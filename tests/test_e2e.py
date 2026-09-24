"""Ponta a ponta: site simulado + Chromium real + Claude falso.

Roda o autopilot completo: mapa → aulas (texto, legenda, anexos) → experts →
fusão por tema → relatório → pergunta ao coordenador.
"""

import json
import os
from pathlib import Path

import pytest

from asimov_agent.config import make_settings
from asimov_agent.experts.coordinator import ask
from asimov_agent.experts.registry import load_experts
from asimov_agent.pipeline import autopilot
from asimov_agent.storage import Store

from fakes import FakeLLM, serve

CHROMIUM = os.getenv("CHROMIUM_EXECUTABLE", "/opt/pw-browsers/chromium")


@pytest.fixture
def site():
    srv, url = serve()
    yield url
    srv.shutdown()


def settings(tmp_path: Path, url: str):
    raw = {
        "site": {"base_url": url, "login_url": f"{url}/login", "courses_url": f"{url}/cursos"},
        "selectors": {
            "catalog": {"course_link": "a[href*='/curso/']"},
            "course": {"module": ".module", "module_title": "h3", "lesson_link": "a[href*='/aula/']"},
            "lesson": {"title": "h1", "content": "main",
                       "attachments": "a[download], a[href$='.py'], a[href$='.ipynb']",
                       "mark_complete": "button.nope"},
        },
        "crawl": {"headless": True, "delay_min": 0, "delay_max": 0,
                  "executable_path": CHROMIUM if Path(CHROMIUM).exists() else None},
        "media": {"prefer_captions": True},
        "fusion": {"auto_after_module": True},
        "paths": {"data_dir": "data", "auth_state": ".auth/state.json"},
    }
    s = make_settings(raw, tmp_path)
    s.auth_state.write_text(json.dumps({"cookies": [{
        "name": "sid", "value": "ok", "domain": "127.0.0.1", "path": "/", "expires": -1,
        "httpOnly": False, "secure": False, "sameSite": "Lax"}], "origins": []}))
    return s


def test_autopilot_end_to_end(tmp_path, site):
    s = settings(tmp_path, site)
    store = Store(s.db_path)
    llm = FakeLLM()

    report = autopilot(s, store, passes=1, llm=llm)

    # todas as aulas coletadas, em pastas cronológicas
    p = store.progress()
    assert p["done"] == 5 and p["experts"] == 4 == p["modules"]
    lesson = s.raw_dir / "01-python-do-zero" / "01-fundamentos" / "02-loops"
    assert "Conteúdo da aula loops" in (lesson / "lesson.md").read_text()
    assert (lesson / "transcript.txt").read_text() == "Nesta aula vamos praticar."
    assert sorted(f.name for f in (lesson / "attachments").iterdir()) == ["01-loops.py", "02-loops.ipynb"]

    # 4 experts de módulo → temas Python (2) e Pandas (2) fundidos
    themes = json.loads((s.experts_dir / "_themes" / "themes.json").read_text())["themes"]
    assert {k: len(v["members"]) for k, v in themes.items()} == {"python": 2, "pandas": 2}
    council = load_experts(s.experts_dir)
    assert sorted(council) == ["pandas", "python"] and all(e.is_theme for e in council.values())
    assert any("groupby" in c.text for c in council["pandas"].index.chunks)

    assert "Expert em Pandas" in report.read_text()

    # coordenador consulta um expert sênior e sintetiza
    assert ask(llm, council, "Como agrupar dados?") == "Resposta final sintetizada."


def test_rerun_is_idempotent(tmp_path, site):
    s = settings(tmp_path, site)
    store = Store(s.db_path)
    llm = FakeLLM()
    autopilot(s, store, passes=1, llm=llm)
    n = len(llm.calls)
    autopilot(s, store, passes=1, llm=llm)
    # 2ª execução: nada a coletar; só o reagrupamento roda, nenhuma fusão refeita
    assert len(llm.calls) - n == 1
