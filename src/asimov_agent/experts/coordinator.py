"""Coordenador: recebe a pergunta, escolhe e consulta os experts, sintetiza a resposta.

O coordenador é um loop de tool use do Claude com uma única ferramenta,
`consult_expert`. Cada consulta roda o expert com seu system_prompt próprio
e os trechos mais relevantes do material do módulo (BM25).
"""

from __future__ import annotations

from rich.console import Console

from ..llm import LLM
from .registry import Expert

console = Console()

COORDINATOR_SYSTEM = """Você coordena um conselho de experts, cada um formado a partir de um \
módulo dos cursos da Asimov Academy que o usuário estudou.

Como trabalhar:
- Leia a pergunta e escolha o(s) expert(s) cujo escopo cobre o assunto (veja a lista abaixo).
- Use a ferramenta consult_expert para perguntar a eles; faça perguntas específicas. \
Consulte vários em paralelo quando o problema cruza áreas.
- Sintetize uma resposta final única, prática, em português, dizendo quais experts embasaram cada parte.
- Se nenhum expert cobre o tema, diga isso claramente em vez de inventar.

Experts disponíveis:
{roster}"""

EXPERT_CONTEXT = """{system_prompt}

Trechos do material do seu módulo relevantes para esta pergunta:
{excerpts}"""


def _roster(experts: dict[str, Expert]) -> str:
    return "\n".join(
        f"- {e.slug}: {e.profile['name']} — {e.profile['when_to_consult']}"
        for e in experts.values()
    )


def consult(llm: LLM, expert: Expert, question: str, k: int = 6) -> str:
    hits = expert.index.search(question, k=k)
    excerpts = "\n\n".join(f"[{h.source}]\n{h.text}" for h in hits) or "(nenhum trecho encontrado)"
    resp = llm.create(
        system=EXPERT_CONTEXT.format(system_prompt=expert.profile["system_prompt"], excerpts=excerpts),
        messages=[{"role": "user", "content": question}],
    )
    return llm.text(resp)


def ask(llm: LLM, experts: dict[str, Expert], question: str, max_rounds: int = 8) -> str:
    if not experts:
        return "Nenhum expert criado ainda. Rode `asimov run` primeiro."
    tool = {
        "name": "consult_expert",
        "description": "Faz uma pergunta a um expert do conselho e retorna a resposta dele.",
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "expert": {"type": "string", "enum": sorted(experts)},
                "question": {"type": "string"},
            },
            "required": ["expert", "question"],
            "additionalProperties": False,
        },
    }
    system = COORDINATOR_SYSTEM.format(roster=_roster(experts))
    messages: list[dict] = [{"role": "user", "content": question}]

    for _ in range(max_rounds):
        resp = llm.create(system=system, tools=[tool], messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason != "tool_use":
            return llm.text(resp)
        results = []
        for block in resp.content:
            if block.type != "tool_use":
                continue
            slug, q = block.input["expert"], block.input["question"]
            console.print(f"[dim]→ consultando {slug}: {q}[/]")
            try:
                answer, err = consult(llm, experts[slug], q), False
            except Exception as e:  # noqa: BLE001 — devolve o erro ao coordenador
                answer, err = f"Erro ao consultar {slug}: {e}", True
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": answer, "is_error": err})
        messages.append({"role": "user", "content": results})
    return "Limite de rodadas atingido sem resposta final."
