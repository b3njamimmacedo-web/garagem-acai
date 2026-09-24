"""CLI: `asimov autopilot | login | map | run | fuse | status | experts | ask | chat | inspect`."""

from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from .config import load_settings
from .storage import Store

app = typer.Typer(help="Agente de estudo da Asimov Academy + conselho de experts.", no_args_is_help=True)
console = Console()


@app.command()
def login(timeout_min: int = 5):
    """Abre o navegador para você logar; salva a sessão em .auth/state.json."""
    from .scraper.auth import interactive_login

    interactive_login(load_settings(), timeout_min)


@app.command()
def inspect(url: str, out: Path = Path("data/debug")):
    """Salva HTML + screenshot de uma página logada, para calibrar os seletores."""
    from .scraper.browser import open_context, polite_goto

    s = load_settings()
    out.mkdir(parents=True, exist_ok=True)
    with open_context(s) as ctx:
        page = ctx.new_page()
        polite_goto(page, url, s)
        name = url.rstrip("/").rsplit("/", 1)[-1] or "index"
        (out / f"{name}.html").write_text(page.content(), encoding="utf-8")
        page.screenshot(path=str(out / f"{name}.png"), full_page=True)
    console.print(f"Salvo em {out}/{name}.html|.png")


@app.command("map")
def map_cmd(only: str = typer.Option(None, help="Filtra cursos pelo título")):
    """Mapeia cursos, módulos e aulas (ordem cronológica) no banco local."""
    from .pipeline import map_catalog

    s = load_settings()
    map_catalog(s, Store(s.db_path), only)


@app.command()
def run(
    no_experts: bool = typer.Option(False, help="Só coleta, sem criar experts"),
    limit_modules: int = typer.Option(None, help="Para após N módulos (teste)"),
):
    """Assiste às aulas em ordem, baixa anexos e cria um expert por módulo."""
    from .pipeline import run as run_pipeline

    s = load_settings()
    run_pipeline(s, Store(s.db_path), build_experts=not no_experts, limit_modules=limit_modules)


@app.command()
def fuse(offline: bool = typer.Option(False, help="Agrupa por similaridade, sem chamar o Claude")):
    """Funde experts do mesmo tema em experts sêniores."""
    from .experts.fusion import fuse as do_fuse
    from .llm import LLM

    s = load_settings()
    state = do_fuse(None if offline else LLM(s), s.experts_dir)
    t = Table("tema", "membros")
    for slug, v in state.get("themes", {}).items():
        t.add_row(f"{v['theme_name']} ({slug})", "\n".join(v["members"]))
    console.print(t)


@app.command()
def autopilot(passes: int = typer.Option(3, help="Passadas para retentar aulas com erro")):
    """Faz tudo sozinho: login (se preciso) → mapa → aulas → experts → fusão → relatório."""
    from .pipeline import autopilot as run_autopilot
    from .scraper.auth import interactive_login

    s = load_settings()
    if not s.auth_state.exists():
        interactive_login(s)
    run_autopilot(s, Store(s.db_path), passes=passes)


@app.command()
def build(module_dir: Path, course: str, module: str):
    """(Re)constrói manualmente o expert de uma pasta de módulo."""
    from .experts.builder import build_expert
    from .llm import LLM

    s = load_settings()
    console.print(build_expert(LLM(s), module_dir, s.experts_dir, course, module))


@app.command()
def status():
    """Progresso: aulas por status e experts criados."""
    s = load_settings()
    p = Store(s.db_path).progress()
    t = Table("item", "qtd")
    for k, v in sorted(p.items()):
        t.add_row(k, str(v))
    console.print(t)


@app.command()
def experts():
    """Lista os experts do conselho."""
    from .experts.registry import load_experts

    t = Table("slug", "nome", "quando consultar")
    for e in load_experts(load_settings().experts_dir).values():
        t.add_row(e.slug, e.profile["name"], e.profile["when_to_consult"])
    console.print(t)


@app.command()
def ask(question: str):
    """Pergunta ao coordenador, que consulta os experts adequados."""
    from .experts.coordinator import ask as coordinate
    from .experts.registry import load_experts
    from .llm import LLM

    s = load_settings()
    console.print(coordinate(LLM(s), load_experts(s.experts_dir), question))


@app.command()
def chat():
    """Conversa interativa com o coordenador (Ctrl+C para sair)."""
    from .experts.coordinator import ask as coordinate
    from .experts.registry import load_experts
    from .llm import LLM

    s = load_settings()
    llm, ex = LLM(s), load_experts(s.experts_dir)
    console.print(f"[green]{len(ex)} experts carregados.[/]")
    while True:
        q = console.input("[bold]você> [/]").strip()
        if q:
            console.print(coordinate(llm, ex, q))


if __name__ == "__main__":
    app()
