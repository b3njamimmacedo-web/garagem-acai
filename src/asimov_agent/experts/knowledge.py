"""Reúne o material de um módulo (texto, transcrição, anexos) num corpus."""

from __future__ import annotations

import json
from pathlib import Path

TEXT_EXT = {".py", ".txt", ".md", ".sql", ".json", ".yaml", ".yml", ".html", ".css", ".js"}
MAX_ATTACHMENT_CHARS = 40_000


def attachment_text(path: Path) -> str | None:
    ext = path.suffix.lower()
    try:
        if ext in TEXT_EXT:
            return path.read_text(errors="ignore")[:MAX_ATTACHMENT_CHARS]
        if ext == ".ipynb":
            nb = json.loads(path.read_text(errors="ignore"))
            cells = ["".join(c.get("source", [])) for c in nb.get("cells", [])]
            return "\n\n".join(cells)[:MAX_ATTACHMENT_CHARS]
        if ext == ".csv":
            return "\n".join(path.read_text(errors="ignore").splitlines()[:30])
        if ext == ".pdf":
            from pypdf import PdfReader

            pages = [p.extract_text() or "" for p in PdfReader(str(path)).pages]
            return "\n".join(pages)[:MAX_ATTACHMENT_CHARS]
    except Exception:  # noqa: BLE001 — anexo corrompido/binário não bloqueia o módulo
        return None
    return None


def lesson_documents(lesson_dir: Path) -> list[tuple[str, str]]:
    """[(fonte, texto)] de uma aula: página, transcrição e anexos legíveis."""
    docs: list[tuple[str, str]] = []
    for name in ("lesson.md", "transcript.txt"):
        f = lesson_dir / name
        if f.exists() and f.read_text(errors="ignore").strip():
            docs.append((f"{lesson_dir.name}/{name}", f.read_text(errors="ignore")))
    att_dir = lesson_dir / "attachments"
    if att_dir.exists():
        for f in sorted(att_dir.iterdir()):
            txt = attachment_text(f)
            if txt and txt.strip():
                docs.append((f"{lesson_dir.name}/attachments/{f.name}", txt))
    return docs
