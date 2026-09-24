"""Extrai de uma aula: título, texto, fontes de vídeo, legendas e anexos."""

from __future__ import annotations

from dataclasses import dataclass, field
from urllib.parse import urljoin

from playwright.sync_api import BrowserContext

from ..config import Settings
from ..models import Attachment
from .browser import polite_goto

VIDEO_HOSTS = ("youtube", "youtu.be", "vimeo", "pandavideo", "wistia", "bunny", "mediadelivery", "vturb")


@dataclass
class LessonPage:
    url: str
    title: str
    text: str
    video_urls: list[str] = field(default_factory=list)
    caption_urls: list[str] = field(default_factory=list)
    attachments: list[Attachment] = field(default_factory=list)
    html: str = ""


def scrape_lesson(ctx: BrowserContext, s: Settings, url: str) -> LessonPage:
    sel = s.get("selectors.lesson")
    page = ctx.new_page()
    polite_goto(page, url, s)

    title_loc = page.locator(sel["title"]).first
    title = title_loc.inner_text().strip() if title_loc.count() else page.title()
    content_loc = page.locator(sel["content"]).first
    text = content_loc.inner_text() if content_loc.count() else page.locator("body").inner_text()

    videos: list[str] = []
    for frame in page.locator("iframe[src]").all():
        src = frame.get_attribute("src") or ""
        if any(h in src for h in VIDEO_HOSTS):
            videos.append(urljoin(page.url, src))
    for v in page.locator("video[src], video source[src]").all():
        videos.append(urljoin(page.url, v.get_attribute("src") or ""))
    captions = [
        urljoin(page.url, t.get_attribute("src") or "")
        for t in page.locator("track[kind=subtitles][src], track[kind=captions][src]").all()
    ]

    attachments: list[Attachment] = []
    seen: set[str] = set()
    for a in page.locator(sel["attachments"]).all():
        href = a.get_attribute("href")
        if not href:
            continue
        full = urljoin(page.url, href)
        if full in seen:
            continue
        seen.add(full)
        name = (a.get_attribute("download") or full.rsplit("/", 1)[-1].split("?")[0]) or "anexo"
        attachments.append(Attachment(url=full, name=name))

    if s.get("crawl.mark_lessons_complete", False):
        btn = page.locator(sel["mark_complete"]).first
        if btn.count():
            btn.click()

    result = LessonPage(
        url=url, title=title, text=text.strip(), video_urls=list(dict.fromkeys(videos)),
        caption_urls=captions, attachments=attachments, html=page.content(),
    )
    page.close()
    return result
