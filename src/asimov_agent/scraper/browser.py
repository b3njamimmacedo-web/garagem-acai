"""Navegador Playwright reutilizando a sessão salva no login."""

from __future__ import annotations

import random
import time
from contextlib import contextmanager
from typing import Iterator

from playwright.sync_api import BrowserContext, Page, sync_playwright

from ..config import Settings


class SessionExpired(RuntimeError):
    """A sessão salva não é mais válida — rode `asimov login` de novo."""


@contextmanager
def open_context(s: Settings, headless: bool | None = None) -> Iterator[BrowserContext]:
    if not s.auth_state.exists():
        raise SessionExpired("Nenhuma sessão salva. Rode `asimov login` primeiro.")
    headless = s.get("crawl.headless", True) if headless is None else headless
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        ctx = browser.new_context(storage_state=str(s.auth_state), locale="pt-BR")
        try:
            yield ctx
            # Cookies podem ter sido renovados durante a navegação
            ctx.storage_state(path=str(s.auth_state))
        finally:
            browser.close()


def polite_goto(page: Page, url: str, s: Settings) -> None:
    """Navega com pausa aleatória e detecta redirecionamento para o login."""
    time.sleep(random.uniform(s.get("crawl.delay_min", 2.0), s.get("crawl.delay_max", 5.0)))
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle", timeout=30_000)
    if "/login" in page.url:
        raise SessionExpired(f"Redirecionado para o login ao abrir {url}. Rode `asimov login`.")
