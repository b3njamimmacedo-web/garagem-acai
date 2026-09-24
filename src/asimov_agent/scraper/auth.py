"""Login interativo: abre um navegador visível e salva a sessão (cookies).

O site fica atrás do Cloudflare, então o login é feito por você num navegador
real — o agente só reaproveita a sessão salva em .auth/state.json. A senha
nunca é gravada em disco pelo agente.
"""

from __future__ import annotations

from playwright.sync_api import sync_playwright
from rich.console import Console

from ..config import Settings
from .browser import launch_kwargs

console = Console()


def interactive_login(s: Settings, timeout_min: int = 5) -> None:
    sel = s.get("selectors.login", {})
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False, **launch_kwargs(s))
        ctx = browser.new_context(locale="pt-BR")
        page = ctx.new_page()
        page.goto(s.get("site.login_url"))

        if s.email and s.password:
            try:
                page.locator(sel["email"]).first.fill(s.email, timeout=15_000)
                page.locator(sel["password"]).first.fill(s.password)
                page.locator(sel["submit"]).first.click()
                console.print("[cyan]Credenciais preenchidas a partir do .env.[/]")
            except Exception:  # noqa: BLE001 — formulário diferente do esperado
                console.print("[yellow]Não consegui preencher sozinho; complete o login na janela.[/]")
        else:
            console.print("[cyan]Faça o login na janela aberta.[/]")

        console.print(f"Aguardando até {timeout_min} min pela área logada…")
        page.wait_for_url(
            lambda url: "/login" not in url, timeout=timeout_min * 60_000
        )
        page.wait_for_load_state("networkidle")
        ctx.storage_state(path=str(s.auth_state))
        s.auth_state.chmod(0o600)
        console.print(f"[green]Sessão salva em {s.auth_state}[/]")
        browser.close()
