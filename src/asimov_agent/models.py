"""Estruturas de dados do catálogo (curso → módulo → aula → anexos)."""

from __future__ import annotations

from dataclasses import dataclass, field

from slugify import slugify


def folder_name(position: int, title: str) -> str:
    """Nome de pasta que preserva a ordem cronológica: '03-pandas-basico'."""
    return f"{position:02d}-{slugify(title)[:60] or 'sem-titulo'}"


@dataclass
class Attachment:
    url: str
    name: str


@dataclass
class Lesson:
    url: str
    title: str
    position: int
    attachments: list[Attachment] = field(default_factory=list)


@dataclass
class Module:
    title: str
    position: int
    lessons: list[Lesson] = field(default_factory=list)


@dataclass
class Course:
    url: str
    title: str
    position: int
    modules: list[Module] = field(default_factory=list)
