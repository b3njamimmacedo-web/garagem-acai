"""Fusão de experts do mesmo tema em um expert "sênior".

1. Agrupamento: o Claude agrupa os experts de módulo por tema. Os temas que já
   existem são mantidos (estabilidade): experts novos entram num tema existente
   ou criam um tema novo. Sem LLM, usa similaridade de Jaccard (modo offline).
2. Fusão: cada tema com 2+ membros vira um expert sênior em
   data/experts/_themes/<tema>/ com perfil consolidado e a união dos trechos.
   Só são reconstruídos os temas cuja lista de membros mudou.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from slugify import slugify

from .registry import Expert, load_module_experts
from .retrieval import tokenize

THEMES_DIR = "_themes"
THEMES_FILE = "themes.json"

GROUP_SYSTEM = (
    "Você organiza um conselho de experts. Cada expert domina o conteúdo de um módulo "
    "de curso. Agrupe experts que cobrem o MESMO tema técnico (ex.: vários módulos de "
    "Pandas → tema 'Pandas'), de modo que um expert sênior do tema possa substituí-los. "
    "Não junte temas apenas vizinhos (ex.: Pandas e Matplotlib ficam separados). "
    "Mantenha os temas existentes: reaproveite o mesmo theme_slug e nunca tire um "
    "membro de um tema existente. Todo expert deve aparecer em exatamente um tema."
)

GROUP_SCHEMA = {
    "type": "object",
    "properties": {
        "themes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "theme_slug": {"type": "string"},
                    "theme_name": {"type": "string"},
                    "members": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["theme_slug", "theme_name", "members"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["themes"],
    "additionalProperties": False,
}

MERGE_SYSTEM = (
    "Você consolida vários experts do mesmo tema em um único expert sênior. "
    "Una o conhecimento sem perder detalhes práticos, elimine repetições, ordene do "
    "básico ao avançado (a ordem dos membros é a ordem cronológica do curso) e "
    "escreva o system_prompt em segunda pessoa, em português, instruindo o expert a "
    "basear-se nos trechos do material fornecidos e a dizer quando algo foge do escopo."
)

# ---------------------------------------------------------------- agrupamento


def _summary(e: Expert) -> dict:
    p = e.profile
    return {"slug": e.slug, "name": p["name"], "domain": p["domain"],
            "course": p.get("course"), "module": p.get("module"),
            "key_concepts": p.get("key_concepts", [])[:12]}


def _terms(e: Expert) -> set[str]:
    p = e.profile
    return set(tokenize(" ".join([p["name"], p["domain"], *p.get("key_concepts", [])])))


def group_offline(experts: dict[str, Expert], threshold: float = 0.3) -> list[dict]:
    """Agrupamento sem LLM: une experts com Jaccard(termos) >= threshold."""
    slugs = list(experts)
    parent = {s: s for s in slugs}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    terms = {s: _terms(experts[s]) for s in slugs}
    for i, a in enumerate(slugs):
        for b in slugs[i + 1:]:
            inter, union = len(terms[a] & terms[b]), len(terms[a] | terms[b])
            if union and inter / union >= threshold:
                parent[find(b)] = find(a)
    groups: dict[str, list[str]] = {}
    for s in slugs:
        groups.setdefault(find(s), []).append(s)
    return [{"theme_slug": slugify(experts[m[0]].profile["domain"])[:60] or m[0],
             "theme_name": experts[m[0]].profile["domain"], "members": m}
            for m in groups.values()]


def normalize_groups(raw: list[dict], experts: dict[str, Expert], previous: dict) -> list[dict]:
    """Garante: slugs válidos, cada expert em exatamente um tema, temas antigos preservados."""
    order = list(experts)  # ordem cronológica
    owner: dict[str, str] = {}
    themes: dict[str, dict] = {}

    # temas anteriores têm prioridade (estabilidade entre execuções)
    for slug, t in previous.get("themes", {}).items():
        for m in t["members"]:
            if m in experts and m not in owner:
                owner[m] = slug
                themes.setdefault(slug, {"theme_slug": slug, "theme_name": t["theme_name"], "members": []})
    for g in raw:
        slug = slugify(g["theme_slug"])[:60] or slugify(g["theme_name"])[:60]
        if not slug:
            continue
        themes.setdefault(slug, {"theme_slug": slug, "theme_name": g["theme_name"], "members": []})
        for m in g["members"]:
            if m in experts and m not in owner:
                owner[m] = slug
    for m in order:  # quem sobrou vira tema próprio
        if m not in owner:
            slug = slugify(experts[m].profile["domain"])[:60] or m
            themes.setdefault(slug, {"theme_slug": slug, "theme_name": experts[m].profile["domain"], "members": []})
            owner[m] = slug
    for t in themes.values():
        t["members"] = [m for m in order if owner.get(m) == t["theme_slug"]]
    return [t for t in themes.values() if t["members"]]


def group_experts(llm, experts: dict[str, Expert], previous: dict) -> list[dict]:
    if llm is None:
        raw = group_offline(experts)
    else:
        prev = [{"theme_slug": k, "theme_name": v["theme_name"], "members": v["members"]}
                for k, v in previous.get("themes", {}).items()]
        prompt = (
            "Temas existentes (manter):\n" + json.dumps(prev, ensure_ascii=False, indent=1)
            + "\n\nExperts (ordem cronológica):\n"
            + json.dumps([_summary(e) for e in experts.values()], ensure_ascii=False, indent=1)
        )
        raw = llm.json(GROUP_SYSTEM, prompt, GROUP_SCHEMA)["themes"]
    return normalize_groups(raw, experts, previous)


# ---------------------------------------------------------------- fusão


def _members_hash(members: list[str], experts: dict[str, Expert]) -> str:
    h = hashlib.sha256()
    for m in members:
        h.update(m.encode())
        h.update((experts[m].path / "profile.json").read_bytes())
    return h.hexdigest()[:16]


def merge_theme(llm, theme: dict, experts: dict[str, Expert], out_root: Path) -> Path:
    from .builder import PROFILE_SCHEMA

    members = [experts[m] for m in theme["members"]]
    out = out_root / theme["theme_slug"]
    out.mkdir(parents=True, exist_ok=True)

    if llm is None:
        profile = _merge_offline(theme, members)
    else:
        payload = json.dumps([m.profile for m in members], ensure_ascii=False, indent=1)
        profile = llm.json(MERGE_SYSTEM, f"Tema: {theme['theme_name']}\n\nExperts:\n{payload}", PROFILE_SCHEMA)
    profile |= {"slug": theme["theme_slug"], "kind": "theme", "members": theme["members"],
                "course": ", ".join(dict.fromkeys(m.profile.get("course", "") for m in members)),
                "module": f"{len(members)} módulos"}
    (out / "profile.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding="utf-8")

    with (out / "chunks.jsonl").open("w", encoding="utf-8") as f:
        for m in members:
            src = m.path / "chunks.jsonl"
            if not src.exists():
                continue
            for line in src.read_text(encoding="utf-8").splitlines():
                d = json.loads(line)
                d["source"] = f"{m.slug}/{d['source']}"
                f.write(json.dumps(d, ensure_ascii=False) + "\n")
    return out


def _merge_offline(theme: dict, members: list[Expert]) -> dict:
    def union(key: str) -> list:
        seen, out = set(), []
        for m in members:
            for x in m.profile.get(key, []):
                k = json.dumps(x, sort_keys=True, ensure_ascii=False)
                if k not in seen:
                    seen.add(k)
                    out.append(x)
        return out

    names = ", ".join(m.profile["name"] for m in members)
    return {
        "name": f"Expert sênior em {theme['theme_name']}",
        "domain": theme["theme_name"],
        "description": f"Consolida: {names}.",
        "when_to_consult": " / ".join(m.profile["when_to_consult"] for m in members),
        "system_prompt": "\n\n---\n\n".join(m.profile["system_prompt"] for m in members),
        "key_concepts": union("key_concepts"),
        "procedures": union("procedures"),
        "pitfalls": union("pitfalls"),
        "glossary": union("glossary"),
    }


def fuse(llm, experts_dir: Path) -> dict:
    """Agrupa e funde. Retorna o estado salvo em _themes/themes.json."""
    experts = load_module_experts(experts_dir)
    root = experts_dir / THEMES_DIR
    root.mkdir(parents=True, exist_ok=True)
    state_file = root / THEMES_FILE
    previous = json.loads(state_file.read_text(encoding="utf-8")) if state_file.exists() else {}
    if not experts:
        return previous

    groups = group_experts(llm, experts, previous)
    state = {"themes": {}}
    for g in groups:
        slug = g["theme_slug"]
        entry = {"theme_name": g["theme_name"], "members": g["members"]}
        if len(g["members"]) >= 2:
            digest = _members_hash(g["members"], experts)
            old = previous.get("themes", {}).get(slug, {})
            if old.get("hash") != digest or not (root / slug / "profile.json").exists():
                merge_theme(llm, g, experts, root)
            entry["hash"] = digest
        state["themes"][slug] = entry

    # remove experts sêniores de temas que deixaram de existir ou ficaram com 1 membro
    for d in root.iterdir():
        if d.is_dir() and len(state["themes"].get(d.name, {}).get("members", [])) < 2:
            for f in d.iterdir():
                f.unlink()
            d.rmdir()
    state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    return state
