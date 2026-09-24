"""Fluxo principal, em ordem cronológica e retomável:

    para cada curso → para cada módulo → para cada aula:
        abrir aula → salvar texto → baixar anexos → transcrever vídeo
    ao concluir o módulo → construir o expert
"""

from __future__ import annotations

import json
from pathlib import Path

from rich.console import Console

from .config import Settings
from .experts.builder import build_expert
from .llm import LLM
from .models import folder_name
from .scraper.browser import SessionExpired, open_context
from .scraper.catalog import list_courses, map_course
from .scraper.downloader import download_attachments
from .scraper.lesson import scrape_lesson
from .storage import Store
from .transcribe import storage_state_to_netscape, transcribe_lesson

console = Console()


def module_dir(s: Settings, m) -> Path:
    return s.raw_dir / folder_name(m["course_position"], m["course_title"]) / folder_name(
        m["position"], m["title"]
    )


def map_catalog(s: Settings, store: Store, only: str | None = None) -> None:
    with open_context(s) as ctx:
        courses = list_courses(ctx, s)
        console.print(f"{len(courses)} curso(s) encontrados.")
        for course in courses:
            if only and only.lower() not in course.title.lower():
                continue
            map_course(ctx, s, course)
            cid = store.upsert_course(course.url, course.title, course.position)
            for m in course.modules:
                mid = store.upsert_module(cid, m.title, m.position)
                for l in m.lessons:
                    store.upsert_lesson(mid, l.url, l.title, l.position)
            n = sum(len(m.lessons) for m in course.modules)
            console.print(f"  • {course.title}: {len(course.modules)} módulos, {n} aulas")


def harvest_lesson(s: Settings, ctx, row, mdir: Path, cookiefile: Path) -> None:
    ldir = mdir / folder_name(row["position"], row["title"])
    ldir.mkdir(parents=True, exist_ok=True)
    page = scrape_lesson(ctx, s, row["url"])
    (ldir / "lesson.md").write_text(f"# {page.title}\n\nFonte: {page.url}\n\n{page.text}\n", encoding="utf-8")
    (ldir / "page.html").write_text(page.html, encoding="utf-8")
    (ldir / "meta.json").write_text(json.dumps({
        "url": page.url, "title": page.title, "videos": page.video_urls,
        "captions": page.caption_urls, "attachments": [a.__dict__ for a in page.attachments],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    if page.attachments:
        download_attachments(ctx, page.attachments, ldir / "attachments")

    transcript = ldir / "transcript.txt"
    if (page.video_urls or page.caption_urls) and not transcript.exists():
        text = transcribe_lesson(
            s, page.video_urls, page.caption_urls, page.url, ldir, cookiefile,
            http_get=lambda u: ctx.request.get(u).text(),
        )
        transcript.write_text(text, encoding="utf-8")


def run(s: Settings, store: Store, build_experts: bool = True, limit_modules: int | None = None) -> None:
    llm = LLM(s) if build_experts else None
    cookiefile = storage_state_to_netscape(s.auth_state, s.auth_state.parent / "cookies.txt")
    done_modules = 0
    with open_context(s) as ctx:
        for m in store.modules_in_order():
            if m["expert_built"]:
                continue
            mdir = module_dir(s, m)
            console.rule(f"{m['course_title']} › {m['title']}")
            ok = True
            for row in store.lessons_of(m["id"]):
                if row["status"] == "done":
                    continue
                console.print(f"  ▶ {row['position']:02d}. {row['title']}")
                try:
                    harvest_lesson(s, ctx, row, mdir, cookiefile)
                    store.set_lesson(row["id"], status="done", folder=str(mdir), error=None)
                except SessionExpired:
                    raise
                except Exception as e:  # noqa: BLE001 — registra e segue; módulo fica pendente
                    ok = False
                    store.set_lesson(row["id"], status="error", error=str(e)[:500])
                    console.print(f"    [red]erro: {e}[/]")
            if not ok:
                console.print("[yellow]Módulo com erros; expert adiado. Rode de novo para retentar.[/]")
                continue
            if llm:
                console.print("  🧠 construindo expert do módulo…")
                path = build_expert(llm, mdir, s.experts_dir, m["course_title"], m["title"])
                store.set_expert_built(m["id"])
                console.print(f"  [green]expert pronto: {path.name}[/]")
            done_modules += 1
            if limit_modules and done_modules >= limit_modules:
                break
