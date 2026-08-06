# Fontes

Usadas por `scripts/gerar-previa.mjs` para embutir a tipografia na prévia em
arquivo único.

**Ficam versionadas de propósito.** A prévia existe para ser autossuficiente —
depender de fonte instalada na máquina, ou de um caminho que só existe em um
ambiente, faz o arquivo sair sem tipografia e sem avisar. Foi exatamente o que
aconteceu: o gerador apontava para uma pasta do sandbox e o CI produziu uma
prévia com zero faces.

| Arquivo | Papel na página | Substitui |
|---|---|---|
| `CrimsonPro-Bold.ttf` | títulos | Cinzel |
| `CrimsonPro-Italic.ttf` | epígrafes | Cormorant Garamond itálico |
| `ArsenalSC-Regular.ttf` | rótulos em versalete | Cinzel em caixa alta |
| `InstrumentSans-Regular.ttf` | corpo | Inter |
| `InstrumentSans-Bold.ttf` | corpo em negrito | Inter 600/700 |

## Licenças

Todas sob **SIL Open Font License 1.1**, que permite redistribuição desde que a
licença acompanhe os arquivos. Os textos completos estão aqui:

- `CrimsonPro-OFL.txt` — Copyright 2018, The Crimson Pro Project Authors
- `ArsenalSC-OFL.txt` — Copyright 2012, The Arsenal Project Authors
- `InstrumentSans-OFL.txt` — Copyright 2022, The Instrument Sans Project Authors

O site em produção continua usando Cinzel, Cormorant Garamond e Inter pelo
Google Fonts (ver `index.html`). Estas faces são só para a prévia empacotada,
onde CDN de fonte não carrega.
