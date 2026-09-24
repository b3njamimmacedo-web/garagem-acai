"""Mapeia cursos → módulos → aulas na ordem em que aparecem no site."""

from __future__ import annotations

from urllib.parse import urljoin

from playwright.sync_api import BrowserContext, Page
from rich.console import Console

from ..config import Settings
from ..models import Course, Lesson, Module
from .browser import polite_goto

console = Console()


def _links(page: Page, selector: str, base: str) -> list[tuple[str, str]]:
    """(url, texto) únicos, preservando a ordem do DOM."""
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for a in page.locator(selector).all():
        href = a.get_attribute("href")
        if not href or href.startswith("#"):
            continue
        url = urljoin(base, href).split("#")[0]
        if url in seen:
            continue
        seen.add(url)
        out.append((url, " ".join(a.inner_text().split()) or url))
    return out


def list_courses(ctx: BrowserContext, s: Settings) -> list[Course]:
    page = ctx.new_page()
    polite_goto(page, s.get("site.courses_url"), s)
    links = _links(page, s.get("selectors.catalog.course_link"), page.url)
    page.close()
    return [Course(url=u, title=t, position=i) for i, (u, t) in enumerate(links, 1)]


def map_course(ctx: BrowserContext, s: Settings, course: Course) -> Course:
    """Preenche course.modules. Se não achar módulos, agrupa tudo num só."""
    sel = s.get("selectors.course")
    page = ctx.new_page()
    polite_goto(page, course.url, s)

    modules: list[Module] = []
    for m_idx, block in enumerate(page.locator(sel["module"]).all(), 1):
        title_loc = block.locator(sel["module_title"]).first
        title = " ".join(title_loc.inner_text().split()) if title_loc.count() else f"Módulo {m_idx}"
        lessons = []
        for a in block.locator(sel["lesson_link"]).all():
            href = a.get_attribute("href")
            if href:
                lessons.append((urljoin(page.url, href), " ".join(a.inner_text().split())))
        if lessons:
            modules.append(Module(title=title, position=len(modules) + 1, lessons=[
                Lesson(url=u, title=t or u, position=i) for i, (u, t) in enumerate(lessons, 1)
            ]))

    if not modules:
        console.print(f"[yellow]Sem blocos de módulo em {course.url}; usando lista plana.[/]")
        flat = _links(page, sel["lesson_link"], page.url)
        if flat:
            modules = [Module(title=course.title, position=1, lessons=[
                Lesson(url=u, title=t, position=i) for i, (u, t) in enumerate(flat, 1)
            ])]
    page.close()
    course.modules = modules
    return course
