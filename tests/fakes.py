"""Dublês de teste: um 'Claude' determinístico e um site Asimov simulado."""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace


# --------------------------------------------------------------- Claude falso

def _text(t):
    return SimpleNamespace(type="text", text=t)


class FakeLLM:
    """Imita asimov_agent.llm.LLM sem rede. Registra as chamadas."""

    def __init__(self):
        self.calls: list[dict] = []

    @staticmethod
    def text(resp):
        return "".join(b.text for b in resp.content if b.type == "text")

    def create(self, **kw):
        self.calls.append(kw)
        if kw.get("tools"):  # coordenador
            answered = any(
                isinstance(m["content"], list) and m["content"] and
                isinstance(m["content"][0], dict) and m["content"][0].get("type") == "tool_result"
                for m in kw["messages"]
            )
            if not answered:
                slug = kw["tools"][0]["input_schema"]["properties"]["expert"]["enum"][0]
                return SimpleNamespace(stop_reason="tool_use", content=[SimpleNamespace(
                    type="tool_use", id="t1", input={"expert": slug, "question": "groupby?"})])
            return SimpleNamespace(stop_reason="end_turn", content=[_text("Resposta final sintetizada.")])
        user = kw["messages"][-1]["content"]
        return SimpleNamespace(stop_reason="end_turn", content=[_text(f"NOTA: {user[:80]}")])

    def json(self, system, prompt, schema, max_tokens=16000):
        self.calls.append({"system": system, "prompt": prompt})
        if "themes" in schema["properties"]:
            experts = json.loads(prompt.split("Experts (ordem cronológica):\n", 1)[1])
            groups: dict[str, list[str]] = {}
            for e in experts:
                groups.setdefault(e["domain"], []).append(e["slug"])
            return {"themes": [{"theme_slug": d, "theme_name": d, "members": m} for d, m in groups.items()]}
        domain = "Pandas" if "pandas" in prompt.lower() else "Python"
        return {
            "name": f"Expert em {domain}", "domain": domain,
            "description": "desc", "when_to_consult": f"dúvidas de {domain}",
            "system_prompt": f"Você é expert em {domain}.",
            "key_concepts": [domain.lower(), "exemplo"], "procedures": ["p"],
            "pitfalls": ["x"], "glossary": [{"term": domain, "definition": "d"}],
        }


# --------------------------------------------------------------- site falso

COURSES = {
    "python": ("Python do Zero", [
        ("Fundamentos", [("variaveis", "Variáveis"), ("loops", "Loops")]),
        ("Funções", [("funcoes", "Funções")]),
    ]),
    "dados": ("Análise de Dados", [
        ("Pandas I", [("pandas-intro", "Intro ao pandas")]),
        ("Pandas II", [("pandas-groupby", "Groupby no pandas")]),
    ]),
}


def _page(body: str) -> bytes:
    return f"<html><head><title>t</title></head><body>{body}</body></html>".encode()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body=b"", ctype="text/html; charset=utf-8", headers=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/login":
            return self._send(200, _page("<form><input type=email><input type=password></form>"))
        if "sid=ok" not in (self.headers.get("Cookie") or ""):
            return self._send(303, headers={"Location": "/login"})
        if path == "/cursos":
            links = "".join(f'<a href="/curso/{k}">{v[0]}</a>' for k, v in COURSES.items())
            return self._send(200, _page(f"<main>{links}</main>"))
        if path.startswith("/curso/"):
            title, modules = COURSES[path.split("/")[2]]
            html = "".join(
                f'<div class="module"><h3>{mt}</h3>' +
                "".join(f'<a href="/aula/{s}">{lt}</a>' for s, lt in lessons) + "</div>"
                for mt, lessons in modules)
            return self._send(200, _page(f"<h1>{title}</h1>{html}"))
        if path.startswith("/aula/"):
            slug = path.split("/")[2]
            return self._send(200, _page(
                f"<h1>Aula {slug}</h1><main><p>Conteúdo da aula {slug} sobre "
                f"{'pandas groupby dataframe' if 'pandas' in slug else 'python básico'}.</p>"
                f'<video><track kind="subtitles" src="/subs/{slug}.vtt"></video>'
                f'<a href="/files/{slug}.py">código</a>'
                f'<a href="/files/{slug}.ipynb" download="{slug}.ipynb">notebook</a></main>'))
        if path.startswith("/subs/"):
            vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nNesta aula vamos praticar.\n"
            return self._send(200, vtt.encode(), "text/vtt")
        if path.startswith("/files/") and path.endswith(".py"):
            return self._send(200, b"print('ola')\n", "text/x-python")
        if path.startswith("/files/") and path.endswith(".ipynb"):
            nb = {"cells": [{"source": ["import pandas as pd\n", "df.groupby('x')"]}]}
            return self._send(200, json.dumps(nb).encode(), "application/json")
        return self._send(404, b"nope")


def serve():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"
