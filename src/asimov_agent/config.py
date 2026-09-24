"""Carrega config/settings.yaml + variáveis de ambiente (.env)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Settings:
    raw: dict[str, Any]
    root: Path = ROOT
    email: str | None = field(default=None)
    password: str | None = field(default=None)

    def get(self, dotted: str, default: Any = None) -> Any:
        node: Any = self.raw
        for key in dotted.split("."):
            if not isinstance(node, dict) or key not in node:
                return default
            node = node[key]
        return node

    @property
    def data_dir(self) -> Path:
        return self.root / self.get("paths.data_dir", "data")

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def experts_dir(self) -> Path:
        return self.data_dir / "experts"

    @property
    def db_path(self) -> Path:
        return self.data_dir / "state.db"

    @property
    def auth_state(self) -> Path:
        return self.root / self.get("paths.auth_state", ".auth/state.json")


def load_settings(path: Path | None = None) -> Settings:
    load_dotenv(ROOT / ".env")
    path = path or ROOT / "config" / "settings.yaml"
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return make_settings(
        raw, ROOT,
        email=os.getenv("ASIMOV_EMAIL") or None,
        password=os.getenv("ASIMOV_PASSWORD") or None,
    )


def make_settings(raw: dict[str, Any], root: Path, **kw: Any) -> Settings:
    s = Settings(raw=raw, root=root, **kw)
    for d in (s.data_dir, s.raw_dir, s.experts_dir, s.auth_state.parent):
        d.mkdir(parents=True, exist_ok=True)
    return s
