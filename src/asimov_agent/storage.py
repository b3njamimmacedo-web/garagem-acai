"""Estado persistente em SQLite: permite pausar e retomar de onde parou."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

SCHEMA = """
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    expert_built INTEGER NOT NULL DEFAULT 0,
    UNIQUE(course_id, position)
);
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(id),
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    -- pending → harvested (texto+anexos) → transcribed → done
    status TEXT NOT NULL DEFAULT 'pending',
    folder TEXT,
    error TEXT
);
"""


class Store:
    def __init__(self, path: Path):
        self.path = path
        with self.conn() as c:
            c.executescript(SCHEMA)

    @contextmanager
    def conn(self) -> Iterator[sqlite3.Connection]:
        c = sqlite3.connect(self.path)
        c.row_factory = sqlite3.Row
        try:
            yield c
            c.commit()
        finally:
            c.close()

    def upsert_course(self, url: str, title: str, position: int) -> int:
        with self.conn() as c:
            c.execute(
                "INSERT INTO courses(url,title,position) VALUES(?,?,?) "
                "ON CONFLICT(url) DO UPDATE SET title=excluded.title, position=excluded.position",
                (url, title, position),
            )
            return c.execute("SELECT id FROM courses WHERE url=?", (url,)).fetchone()[0]

    def upsert_module(self, course_id: int, title: str, position: int) -> int:
        with self.conn() as c:
            c.execute(
                "INSERT INTO modules(course_id,title,position) VALUES(?,?,?) "
                "ON CONFLICT(course_id,position) DO UPDATE SET title=excluded.title",
                (course_id, title, position),
            )
            return c.execute(
                "SELECT id FROM modules WHERE course_id=? AND position=?", (course_id, position)
            ).fetchone()[0]

    def upsert_lesson(self, module_id: int, url: str, title: str, position: int) -> int:
        with self.conn() as c:
            c.execute(
                "INSERT INTO lessons(module_id,url,title,position) VALUES(?,?,?,?) "
                "ON CONFLICT(url) DO UPDATE SET title=excluded.title, position=excluded.position, "
                "module_id=excluded.module_id",
                (module_id, url, title, position),
            )
            return c.execute("SELECT id FROM lessons WHERE url=?", (url,)).fetchone()[0]

    def set_lesson(self, lesson_id: int, **fields: object) -> None:
        cols = ", ".join(f"{k}=?" for k in fields)
        with self.conn() as c:
            c.execute(f"UPDATE lessons SET {cols} WHERE id=?", (*fields.values(), lesson_id))

    def set_expert_built(self, module_id: int) -> None:
        with self.conn() as c:
            c.execute("UPDATE modules SET expert_built=1 WHERE id=?", (module_id,))

    def modules_in_order(self) -> list[sqlite3.Row]:
        """Todos os módulos em ordem cronológica (curso, depois módulo)."""
        with self.conn() as c:
            return c.execute(
                "SELECT m.*, c.title AS course_title, c.position AS course_position "
                "FROM modules m JOIN courses c ON c.id=m.course_id "
                "ORDER BY c.position, m.position"
            ).fetchall()

    def lessons_of(self, module_id: int) -> list[sqlite3.Row]:
        with self.conn() as c:
            return c.execute(
                "SELECT * FROM lessons WHERE module_id=? ORDER BY position", (module_id,)
            ).fetchall()

    def errors(self) -> list[sqlite3.Row]:
        with self.conn() as c:
            return c.execute("SELECT * FROM lessons WHERE status='error' ORDER BY id").fetchall()

    def reset_errors(self) -> None:
        with self.conn() as c:
            c.execute("UPDATE lessons SET status='pending' WHERE status='error'")

    def progress(self) -> dict[str, int]:
        with self.conn() as c:
            rows = c.execute("SELECT status, COUNT(*) n FROM lessons GROUP BY status").fetchall()
            out = {r["status"]: r["n"] for r in rows}
            out["experts"] = c.execute(
                "SELECT COUNT(*) FROM modules WHERE expert_built=1"
            ).fetchone()[0]
            out["modules"] = c.execute("SELECT COUNT(*) FROM modules").fetchone()[0]
            return out
