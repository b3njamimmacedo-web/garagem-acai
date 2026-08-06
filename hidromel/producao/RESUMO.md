# Briefing de produção — gerado por script

Não edite à mão. Rode `node scripts/gerar-briefing-ia.mjs`.

## O que tem aqui

| Arquivo | Conteúdo |
|---|---|
| `prompts-imagem.json` | 686 prompts, cobrindo 82 aulas narradas |
| `prompts-video.json` | 39 clipes (15 âncoras · 8 marketing · 16 vinhetas) |
| `narracao/` | 112 roteiros, um por aula |

## Custo estimado

| Item | Peças | Tentativas | Créditos |
|---|---|---|---|
| Imagens | 686 | 2x | 286 |
| Vídeo | 39 | 4x (3x nas vinhetas) | 1160 |
| **Total** | | | **1446** |

**US$ 48** — cerca de 1 mês(es) de plano Ultra.

## Ordem de execução

1. **Trave a voz primeiro.** Gere uma amostra de TTS, aprove, guarde o id da voz.
   Trocar de voz no meio obriga a refazer tudo.
2. **Gere 10 imagens de teste** de módulos diferentes. Se não parecerem do mesmo
   produto, ajuste `ESTILO_BASE` no script e rode de novo — não corrija imagem
   por imagem.
3. **Imagens em lote**, por módulo. São baratas: erre à vontade.
4. **Clipes-âncora**, um a um, com curadoria. São caros.
5. **Narração** em lote, depois dos roteiros escritos.
6. **Vinhetas e marketing** por último.

## A regra que evita retrabalho

Todo prompt de imagem termina com o mesmo `ESTILO_BASE`. Se você pedir uma
imagem avulsa fora deste arquivo, ela vai destoar — e uma imagem destoante no
meio de 686 entrega que o curso foi montado às pressas.
