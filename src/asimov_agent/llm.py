"""Cliente Claude compartilhado (Anthropic SDK)."""

from __future__ import annotations

import json
from typing import Any

import anthropic

from .config import Settings

FALLBACK_BETA = "server-side-fallback-2026-07-01"


class LLM:
    def __init__(self, s: Settings):
        self.client = anthropic.Anthropic()
        self.model = s.get("llm.model", "claude-opus-5")
        self.effort = s.get("llm.effort", "high")
        self.fallback = bool(s.get("llm.server_side_fallback", True))

    def create(self, **kwargs: Any):
        """messages.create com thinking adaptativo, effort e fallback server-side."""
        kwargs.setdefault("model", self.model)
        kwargs.setdefault("max_tokens", 16000)
        kwargs.setdefault("thinking", {"type": "adaptive"})
        oc = kwargs.setdefault("output_config", {})
        oc.setdefault("effort", self.effort)
        if self.fallback:
            resp = self.client.beta.messages.create(
                betas=[FALLBACK_BETA], fallbacks="default", **kwargs
            )
        else:
            resp = self.client.messages.create(**kwargs)
        if resp.stop_reason == "refusal":
            raise RuntimeError(f"Requisição recusada pelo modelo: {resp.stop_details}")
        return resp

    @staticmethod
    def text(resp) -> str:
        return "".join(b.text for b in resp.content if b.type == "text")

    def json(self, system: str, prompt: str, schema: dict, max_tokens: int = 16000) -> dict:
        resp = self.create(
            system=system,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            output_config={"format": {"type": "json_schema", "schema": schema}},
        )
        return json.loads(self.text(resp))
