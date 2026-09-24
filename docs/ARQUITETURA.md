# Arquitetura

## Objetivo

1. Percorrer todos os cursos da conta, **na ordem** (curso → módulo → aula).
2. Para cada aula: guardar o texto, **baixar anexos** e **transcrever o vídeo**.
3. Ao concluir cada módulo: **criar um expert** naquele assunto.
4. Um **coordenador** conversa com o usuário e delega aos experts.

## Componentes

| Camada | Módulo | Responsabilidade |
|---|---|---|
| Sessão | `scraper/auth.py` | Login em navegador visível; salva cookies em `.auth/state.json`. |
| Navegação | `scraper/browser.py` | Reusa a sessão, pausa entre páginas, detecta sessão expirada. |
| Catálogo | `scraper/catalog.py` | Lista cursos, módulos e aulas na ordem do DOM. |
| Aula | `scraper/lesson.py` | Título, texto, iframes/`<video>`, legendas `<track>`, links de anexos. |
| Anexos | `scraper/downloader.py` | Download autenticado; nomes com prefixo de ordem. |
| Vídeo | `transcribe.py` | Legendas (yt-dlp) → senão áudio + faster-whisper, local. |
| Estado | `storage.py` | SQLite; cada aula tem status; módulo tem `expert_built`. Tudo retomável. |
| Expert | `experts/builder.py` | Nota por aula → perfil estruturado (JSON schema) → índice de trechos. |
| Busca | `experts/retrieval.py` | BM25 local em português, sem serviços externos. |
| Fusão | `experts/fusion.py` | Agrupa experts por tema (Claude ou Jaccard offline) e cria experts sêniores. |
| Conselho | `experts/coordinator.py` | Loop de tool use com `consult_expert(expert, question)`. |

## Ciclo de um módulo

```
para cada aula pendente (ordem):
    scrape → lesson.md + page.html + meta.json
    anexos → attachments/NN-nome.ext
    vídeo  → transcript.txt
    status = done   (erro → status = error, módulo fica pendente)
se todas as aulas estão done:
    notes/<aula>.md    ← Claude resume cada aula (fiel ao material)
    profile.json       ← Claude define o expert (nome, escopo, quando consultar,
                          system_prompt, conceitos, procedimentos, armadilhas, glossário)
    chunks.jsonl       ← trechos do material para citar nas respostas
    expert_built = 1
```

## O expert

Um expert é uma pasta, não um processo: `profile.json` (persona + escopo) + `chunks.jsonl`
(base de conhecimento). Ao ser consultado, recebe seu `system_prompt` e os trechos mais
relevantes do seu módulo (BM25) — então responde com base no que o curso ensinou e diz
quando a pergunta foge do escopo.

## O coordenador

- O system prompt contém a lista de experts (`slug: nome — quando consultar`).
- Uma ferramenta: `consult_expert` com `expert` restrito aos slugs existentes (`strict`).
- Pode consultar vários experts em paralelo e sintetiza a resposta final citando quem embasou cada parte.

## Próximos passos

1. **Calibrar seletores** com `asimov inspect` após o primeiro login.
2. ~~Fusão de experts~~: feito (`experts/fusion.py`).
3. **Hierarquia**: coordenadores por curso/trilha quando o número de experts crescer muito.
4. **Embeddings** no lugar do BM25 se a busca lexical não bastar.
5. **Avaliação**: um conjunto de perguntas por módulo para medir a qualidade dos experts.
