"""Baixa anexos usando os cookies da sessão logada."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import BrowserContext
from slugify import slugify

from ..models import Attachment


def safe_filename(name: str) -> str:
    stem, dot, ext = name.rpartition(".")
    if not dot:
        return slugify(name)[:80] or "anexo"
    return f"{slugify(stem)[:80] or 'anexo'}.{slugify(ext)[:10]}"


def download_attachments(ctx: BrowserContext, items: list[Attachment], dest: Path) -> list[Path]:
    dest.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = []
    for i, att in enumerate(items, 1):
        target = dest / f"{i:02d}-{safe_filename(att.name)}"
        if target.exists() and target.stat().st_size > 0:
            saved.append(target)
            continue
        resp = ctx.request.get(att.url, timeout=120_000)
        if not resp.ok:
            raise RuntimeError(f"HTTP {resp.status} ao baixar {att.url}")
        target.write_bytes(resp.body())
        saved.append(target)
    return saved
