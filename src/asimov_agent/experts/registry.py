"""Carrega os experts gerados em data/experts/."""

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

    @cached_property
    def index(self) -> BM25:
        chunks = []
        f = self.path / "chunks.jsonl"
        if f.exists():
            for line in f.read_text(encoding="utf-8").splitlines():
                d = json.loads(line)
                chunks.append(Chunk(source=d["source"], text=d["text"]))
        return BM25(chunks)


def load_experts(experts_dir: Path) -> dict[str, Expert]:
    out: dict[str, Expert] = {}
    for p in sorted(experts_dir.glob("*/profile.json")):
        e = Expert(path=p.parent, profile=json.loads(p.read_text(encoding="utf-8")))
        out[e.slug] = e
    return out
