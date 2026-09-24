"""Carrega os experts gerados em data/experts/.

- Experts de módulo: data/experts/<slug>/
- Experts sêniores (fusão por tema): data/experts/_themes/<tema>/
O conselho = sêniores + experts de módulo que não pertencem a nenhum tema fundido.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path

from .retrieval import BM25, Chunk


@dataclass
class Expert:
    path: Path
    profile: dict

    @property
    def slug(self) -> str:
        return self.profile["slug"]

    @property
    def is_theme(self) -> bool:
        return self.profile.get("kind") == "theme"

    @cached_property
    def index(self) -> BM25:
        chunks = []
        f = self.path / "chunks.jsonl"
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                d = json.loads(line)
                chunks.append(Chunk(source=d["source"], text=d["text"]))
        return BM25(chunks)


def _load(paths) -> dict[str, Expert]:
    out: dict[str, Expert] = {}
    for p in paths:
        e = Expert(path=p.parent, profile=json.loads(p.read_text(encoding="utf-8")))
        out[e.slug] = e
    return out


def load_module_experts(experts_dir: Path) -> dict[str, Expert]:
    """Experts de módulo em ordem cronológica (created_order, depois nome)."""
    found = _load(p for p in experts_dir.glob("*/profile.json") if not p.parent.name.startswith("_"))
    return dict(sorted(found.items(), key=lambda kv: (kv[1].profile.get("order", 10**9), kv[0])))


def load_theme_experts(experts_dir: Path) -> dict[str, Expert]:
    return _load(sorted((experts_dir / "_themes").glob("*/profile.json")))


def load_experts(experts_dir: Path) -> dict[str, Expert]:
    """O conselho que o coordenador enxerga."""
    modules = load_module_experts(experts_dir)
    themes = load_theme_experts(experts_dir)
    covered = {m for t in themes.values() for m in t.profile.get("members", [])}
    council = dict(themes)
    council.update({k: v for k, v in modules.items() if k not in covered})
    return council
