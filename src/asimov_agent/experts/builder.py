"""Ao terminar um módulo, destila o material num expert.

Etapas:
  1. Nota de estudo por aula (resumo técnico, conceitos, código-chave).
  2. Perfil do expert (persona, escopo, quando consultar, conceitos, armadilhas).
  3. Índice de trechos (chunks.jsonl) para o expert citar o material na hora de responder.
"""

from __future__ import annotations

import json
from pathlib import Path

from slugify import slugify

from ..llm import LLM
from .knowledge import lesson_documents
from .retrieval import chunk_text

NOTE_SYSTEM = (
    "Você é um estudante técnico meticuloso. Recebe o material de UMA aula "
    "(texto da página, transcrição do vídeo e anexos) e escreve uma nota de estudo "
    "em português, em Markdown: objetivo da aula, conceitos explicados, passo a passo "
    "dos procedimentos, trechos de código essenciais (curtos) e dúvidas/armadilhas citadas. "
    "Seja fiel ao material; não invente conteúdo que não está lá."
)

PROFILE_SYSTEM = (
    "Você projeta agentes especialistas. A partir das notas de estudo de um módulo de curso, "
    "defina um expert que domine exatamente aquele conteúdo e saiba seus limites. "
    "O system_prompt deve ser escrito em segunda pessoa, em português, descrevendo a "
    "especialidade, o método de trabalho ensinado no módulo, como responder (prático, com "
    "exemplos) e instruir o expert a basear-se nos trechos do material fornecidos e a dizer "
    "quando algo está fora do seu escopo."
)

PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "description": "Nome curto do expert, ex.: 'Expert em Pandas'"},
        "domain": {"type": "string"},
        "description": {"type": "string"},
        "when_to_consult": {"type": "string"},
        "system_prompt": {"type": "string"},
        "key_concepts": {"type": "array", "items": {"type": "string"}},
        "procedures": {"type": "array", "items": {"type": "string"}},
        "pitfalls": {"type": "array", "items": {"type": "string"}},
        "glossary": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"term": {"type": "string"}, "definition": {"type": "string"}},
                "required": ["term", "definition"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["name", "domain", "description", "when_to_consult", "system_prompt",
                 "key_concepts", "procedures", "pitfalls", "glossary"],
    "additionalProperties": False,
}

MAX_LESSON_CHARS = 300_000


def build_expert(llm: LLM, module_dir: Path, experts_dir: Path,
                 course_title: str, module_title: str) -> Path:
    slug = slugify(f"{course_title}-{module_title}")[:80]
    out = experts_dir / slug
    (out / "notes").mkdir(parents=True, exist_ok=True)

    notes: list[str] = []
    chunks: list[dict] = []
    for lesson_dir in sorted(p for p in module_dir.iterdir() if p.is_dir()):
        docs = lesson_documents(lesson_dir)
        if not docs:
            continue
        for source, text in docs:
            chunks += [{"source": source, "text": c} for c in chunk_text(text)]

        note_file = out / "notes" / f"{lesson_dir.name}.md"
        if not note_file.exists():  # retomável: não refaz notas prontas
            material = "\n\n".join(f"### {src}\n{txt}" for src, txt in docs)[:MAX_LESSON_CHARS]
            resp = llm.create(
                system=NOTE_SYSTEM,
                messages=[{"role": "user", "content": f"Aula: {lesson_dir.name}\n\n{material}"}],
            )
            note_file.write_text(llm.text(resp), encoding="utf-8")
        notes.append(f"## {lesson_dir.name}\n\n{note_file.read_text(encoding='utf-8')}")

    if not notes:
        raise RuntimeError(f"Módulo sem material legível: {module_dir}")

    profile = llm.json(
        PROFILE_SYSTEM,
        f"Curso: {course_title}\nMódulo: {module_title}\n\n" + "\n\n".join(notes),
        PROFILE_SCHEMA,
    )
    profile |= {"slug": slug, "course": course_title, "module": module_title}
    (out / "profile.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding="utf-8")
    with (out / "chunks.jsonl").open("w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    return out
