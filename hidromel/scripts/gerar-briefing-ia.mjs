#!/usr/bin/env node
/* =============================================================================
   BRIEFING DE IA — gera o pacote de produção de mídia a partir do currículo

   Produz em producao/:
     prompts-imagem.json   um prompt por imagem de cada aula narrada
     prompts-video.json    os clipes-âncora históricos e as peças de marketing
     narracao/*.md         a estrutura de roteiro de cada aula, pronta para TTS
     RESUMO.md             contagem, custo e ordem de execução

   Por que gerar prompt por script em vez de escrever um a um:

     1. CONSISTÊNCIA. 546 imagens pedidas em conversas diferentes saem em 546
        estilos diferentes. Aqui todo prompt recebe o MESMO sufixo de estilo,
        travado em ESTILO_BASE. É o que faz o curso parecer um produto só.
     2. RASTREABILIDADE. Cada prompt carrega o id da aula. Regerou a imagem?
        Você sabe exatamente onde ela entra.
     3. REPRODUTIBILIDADE. Mudou o currículo, roda de novo. Sem retrabalho.

   Uso:  node scripts/gerar-briefing-ia.mjs
============================================================================= */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRICULO } from '../assets/js/curriculo.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(RAIZ, 'producao');
mkdirSync(join(OUT, 'narracao'), { recursive: true });

/* ===========================================================================
   TRAVA DE ESTILO — o parágrafo mais importante deste arquivo.
   Colado no fim de TODO prompt de imagem. Sem isso não existe curso, existe
   uma colagem de imagens que não conversam entre si.
=========================================================================== */
const ESTILO_BASE =
  'estilo: pintura digital cinematográfica, iluminação lateral quente de vela e ' +
  'luz de janela, paleta âmbar e dourado sobre marrom escuro, sombras profundas, ' +
  'textura de tinta a óleo sutil, composição centrada e limpa, sem texto, ' +
  'sem marca d\'água, sem pessoas olhando para a câmera, proporção 16:9';

const NEGATIVO =
  'evitar: texto, letras, logotipo, marca d\'água, rosto deformado, mãos com ' +
  'dedos a mais, aspecto de foto de banco de imagens, cores frias, saturação alta';

/* Cada módulo tem um assunto visual próprio, para as imagens não virarem
   dezesseis variações de "potes de mel". */
const TEMA_VISUAL = {
  m00: 'pergaminho, selo de cera, chave antiga, mesa de madeira escura',
  m01: 'arqueologia e mitologia: cerâmica neolítica, salão nórdico, manuscrito iluminado',
  m02: 'mel e abelhas: favos, floradas, potes de vidro contra a luz, colmeia',
  m03: 'microscopia e química: células de levedura, bolhas, vidraria de laboratório',
  m04: 'equipamento: fermentadores de inox e vidro, airlock, bancada limpa',
  m05: 'mão na massa: mel escorrendo, densímetro, fermentador borbulhando',
  m06: 'medieval: taberna, barris, especiarias das rotas do Oriente, brasões',
  m07: 'clareza e transformação: líquido âmbar límpido contra a luz, sedimento',
  m08: 'madeira: barris de carvalho e amburana, adega escura, garrafas empoeiradas',
  m09: 'diagnóstico: garrafas com defeito, nariz avaliando, tabela sensorial',
  m10: 'produto premium: garrafas de linha, café, jabuticaba, pimenta rosa, hibisco',
  m11: 'burocracia: carimbos, pastas de documento, balança da justiça, protocolo',
  m12: 'números: planilha, calculadora, moedas, etiqueta de preço',
  m13: 'marca: rótulos, tipografia, mesa de design, garrafa em contraluz',
  m14: 'venda: feira, balcão de bar, degustação, aperto de mão, caixa de entrega',
  m15: 'escala: sala de produção, paletes, linha de engarrafamento, equipe',
};

/* Clipes-âncora: os únicos momentos que merecem VÍDEO em vez de imagem. */
const CLIPES_ANCORA = [
  ['a0101', 'Jiahu, China neolítica, 7.000 a.C. Potes de cerâmica sobre terra batida, vapor subindo de um deles, fogueira ao fundo, amanhecer'],
  ['a0101', 'Close extremo de mel dourado e viscoso escorrendo dentro de um pote de barro antigo, luz de fogo'],
  ['a0102', 'Salão do Valhalla: guerreiros nórdicos erguendo chifres de beber, fogueira central, escudos nas paredes, fumaça'],
  ['a0102', 'Uma cabra branca no telhado de um salão de madeira, hidromel escorrendo de suas tetas para um caldeirão, névoa'],
  ['a0103', 'Salão de hidromel anglo-saxão à noite, mesa longa, bardo cantando, luz de tochas'],
  ['a0104', 'Casal medieval recebendo um barril pequeno de hidromel como presente de casamento, aldeia ao fundo'],
  ['a0104', 'Lua cheia sobre um vilarejo medieval, um mês inteiro passando em timelapse'],
  ['a0105', 'Cerimônia etíope de t\'ej: frasco berele de vidro com líquido dourado sendo servido, tecidos brancos bordados'],
  ['a0105', 'Adega polonesa antiga, barris de miód pitny empilhados, luz de vela'],
  ['a0106', 'Uma garrafa de hidromel em contraluz numa mesa de carvalho, o líquido âmbar brilhando, ao fundo um manuscrito antigo'],
  ['a0601', 'Mesa de mosteiro medieval coberta de especiarias: canela em pau, cravo, noz-moscada, gengibre, em tigelas de barro'],
  ['a0606', 'Mel fervendo e escurecendo numa panela de cobre sobre fogo, espuma dourada subindo, vapor'],
  ['a0804', 'Interior de uma adega: barris de amburana e carvalho empilhados, feixe de luz atravessando poeira em suspensão'],
  ['a1003', 'Jabuticabas escuras e brilhantes num cacho preso ao tronco da árvore, gotas de orvalho'],
  ['a1005', 'Cálices de hibisco secos caindo em câmera lenta dentro de um líquido dourado, cor magenta se espalhando'],
];

/* Peças de marketing. */
const MARKETING = [
  ['vsl-01', 'Close macro de mel dourado escorrendo lentamente de uma colher de madeira, luz lateral quente, fundo escuro'],
  ['vsl-02', 'Timelapse de fermentação: airlock borbulhando, espuma se formando na superfície do mosto'],
  ['vsl-03', 'Mão erguendo uma garrafa de hidromel contra a luz de uma janela, líquido âmbar translúcido'],
  ['vsl-04', 'Garrafa premium com rótulo escuro sendo colocada numa prateleira de madeira ao lado de vinhos'],
  ['ads-01', 'Chifre de beber nórdico cheio de hidromel sobre mesa de madeira rústica, fogo ao fundo'],
  ['ads-02', 'Densímetro flutuando numa proveta de hidromel, leitura nítida, bancada de produção ao fundo'],
  ['ads-03', 'Feira artesanal: banca com garrafas de hidromel, pessoas provando em taças pequenas'],
  ['ads-04', 'Mãos colando um rótulo à mão numa garrafa, oficina caseira, luz de janela'],
];

/* ===================================================================== APOIO */

const TODAS = CURRICULO.flatMap((m) => m.aulas.map((a) => ({ ...a, modulo: m })));

/** Quantas imagens uma aula precisa: uma a cada 2 minutos, no mínimo 3. */
const qtdImagens = (aula) => Math.max(3, Math.round(aula.m / 2));

/** Aulas que são narração sobre imagem (não bancada, não tela). */
const BANCADA = new Set(['m05']);
const TELA = new Set(['m12']);
const ehNarrada = (a) =>
  !a.lab && !BANCADA.has(a.modulo.id) && !TELA.has(a.modulo.id);

/* ============================================================ PROMPTS IMAGEM */

const promptsImagem = [];
for (const aula of TODAS.filter(ehNarrada)) {
  const tema = TEMA_VISUAL[aula.modulo.id] || 'hidromel, mel, fermentação';
  const n = qtdImagens(aula);
  for (let i = 1; i <= n; i++) {
    promptsImagem.push({
      arquivo: `${aula.id}-${String(i).padStart(2, '0')}.jpg`,
      aula: aula.id,
      modulo: aula.modulo.id,
      titulo: aula.t,
      prompt:
        `${aula.t}. ${aula.d} ` +
        `Elementos visuais do módulo: ${tema}. ` +
        `Imagem ${i} de ${n} desta aula — varie o enquadramento e o ângulo em ` +
        `relação às demais. ${ESTILO_BASE}`,
      negativo: NEGATIVO,
    });
  }
}

/* ============================================================= PROMPTS VÍDEO */

const promptsVideo = [
  ...CLIPES_ANCORA.map(([aula, cena], i) => ({
    arquivo: `ancora-${String(i + 1).padStart(2, '0')}.mp4`,
    tipo: 'ancora',
    aula,
    duracao: 10,
    prompt: `${cena}. Movimento de câmera lento e contínuo. ${ESTILO_BASE}`,
    negativo: NEGATIVO,
  })),
  ...MARKETING.map(([id, cena]) => ({
    arquivo: `${id}.mp4`,
    tipo: id.startsWith('vsl') ? 'vsl' : 'anuncio',
    aula: null,
    duracao: 10,
    prompt: `${cena}. Movimento de câmera lento. ${ESTILO_BASE}`,
    negativo: NEGATIVO,
  })),
  ...CURRICULO.map((m) => ({
    arquivo: `vinheta-${String(m.n).padStart(2, '0')}.mp4`,
    tipo: 'vinheta',
    aula: null,
    duracao: 5,
    prompt:
      `Vinheta de abertura do módulo "${m.titulo}". ${TEMA_VISUAL[m.id]}. ` +
      `Movimento lento de aproximação, espaço vazio no centro para o título entrar. ${ESTILO_BASE}`,
    negativo: NEGATIVO,
  })),
];

/* ========================================================= ROTEIRO NARRAÇÃO */

function roteiro(aula) {
  const m = aula.modulo;
  const base = (aula.base || [])
    .map((id) => TODAS.find((x) => x.id === id))
    .filter(Boolean);

  return `# ${aula.t}

> Módulo ${String(m.n).padStart(2, '0')} — ${m.titulo}
> Aula \`${aula.id}\` · duração alvo ${aula.m} min · ~${qtdImagens(aula)} imagens

**O que o aluno sai sabendo:** ${aula.d}

${aula.novo ? `**O que muda em relação à base:** ${aula.novo}\n` : ''}
${base.length ? `**Não repita estas etapas** — já foram ensinadas e a área de membros
linka para elas:
${base.map((b) => `- \`${b.id}\` ${b.t} (Módulo ${String(b.modulo.n).padStart(2, '0')})`).join('\n')}
` : ''}
---

## Roteiro para narração

### 0:00–0:15 · GANCHO
Abra com a promessa concreta desta aula. Nada de "olá pessoal".

> _[escrever: uma frase que diz exatamente o que o aluno vai saber fazer]_

### 0:15–0:45 · POR QUE IMPORTA
O que dá errado sem isto. Um problema concreto, com consequência.

> _[escrever]_

### 0:45–${Math.max(2, aula.m - 1)}:00 · CONTEÚDO
Um conceito por vez. Marque \`[IMG n]\` onde cada imagem entra.

> _[escrever]_

### Fecho · RESUMO
Três pontos e o gancho da próxima aula.

> _[escrever]_

---

## Ficha para o TTS

- **Voz:** a mesma em todas as 112 aulas. Grave uma amostra e reutilize o id.
- **Ritmo:** pausado. Conteúdo técnico lido rápido não é absorvido.
- **Números:** escreva por extenso no roteiro ("um vírgula zero oito oito"),
  senão o TTS lê "1.088" como "mil e oitenta e oito".
- **Unidades:** "graus Celsius", não "°C". "gramas por litro", não "g/L".
`;
}

/* ================================================================= ESCRITA */

writeFileSync(join(OUT, 'prompts-imagem.json'),
  JSON.stringify(promptsImagem, null, 2), 'utf8');
writeFileSync(join(OUT, 'prompts-video.json'),
  JSON.stringify(promptsVideo, null, 2), 'utf8');

const narradas = TODAS.filter(ehNarrada);

// Os roteiros são preenchidos à mão depois de gerados. Sobrescrevê-los ao
// rodar o script de novo apagaria o trabalho — então só cria o que falta.
// Para forçar a regeração de um roteiro, apague o arquivo dele.
let criados = 0, mantidos = 0;
for (const aula of TODAS) {
  const caminho = join(OUT, 'narracao', `${aula.id}.md`);
  if (existsSync(caminho)) { mantidos++; continue; }
  writeFileSync(caminho, roteiro(aula), 'utf8');
  criados++;
}

/* ---------------------------------------------------------------- RESUMO */

const CRED_IMG = 1000 / 4800;
const CRED_SEG = 1;
const RETRY_IMG = 2;
const RETRY_VID = 4;
const CRED_USD = 99 / 3000;

const credImg = promptsImagem.length * CRED_IMG * RETRY_IMG;
const credVid = promptsVideo.reduce((s, v) => s + v.duracao * CRED_SEG * (v.tipo === 'vinheta' ? 3 : RETRY_VID), 0);
const total = credImg + credVid;

const resumo = `# Briefing de produção — gerado por script

Não edite à mão. Rode \`node scripts/gerar-briefing-ia.mjs\`.

## O que tem aqui

| Arquivo | Conteúdo |
|---|---|
| \`prompts-imagem.json\` | ${promptsImagem.length} prompts, cobrindo ${narradas.length} aulas narradas |
| \`prompts-video.json\` | ${promptsVideo.length} clipes (${CLIPES_ANCORA.length} âncoras · ${MARKETING.length} marketing · ${CURRICULO.length} vinhetas) |
| \`narracao/\` | ${TODAS.length} roteiros, um por aula |

## Custo estimado

| Item | Peças | Tentativas | Créditos |
|---|---|---|---|
| Imagens | ${promptsImagem.length} | ${RETRY_IMG}x | ${Math.round(credImg)} |
| Vídeo | ${promptsVideo.length} | ${RETRY_VID}x (3x nas vinhetas) | ${Math.round(credVid)} |
| **Total** | | | **${Math.round(total)}** |

**US$ ${(total * CRED_USD).toFixed(0)}** — cerca de ${Math.ceil(total / 3000)} mês(es) de plano Ultra.

## Ordem de execução

1. **Trave a voz primeiro.** Gere uma amostra de TTS, aprove, guarde o id da voz.
   Trocar de voz no meio obriga a refazer tudo.
2. **Gere 10 imagens de teste** de módulos diferentes. Se não parecerem do mesmo
   produto, ajuste \`ESTILO_BASE\` no script e rode de novo — não corrija imagem
   por imagem.
3. **Imagens em lote**, por módulo. São baratas: erre à vontade.
4. **Clipes-âncora**, um a um, com curadoria. São caros.
5. **Narração** em lote, depois dos roteiros escritos.
6. **Vinhetas e marketing** por último.

## A regra que evita retrabalho

Todo prompt de imagem termina com o mesmo \`ESTILO_BASE\`. Se você pedir uma
imagem avulsa fora deste arquivo, ela vai destoar — e uma imagem destoante no
meio de ${promptsImagem.length} entrega que o curso foi montado às pressas.
`;

writeFileSync(join(OUT, 'RESUMO.md'), resumo, 'utf8');

console.log(`✓ briefing gerado em producao/`);
console.log(`  ${promptsImagem.length} prompts de imagem (${narradas.length} aulas narradas)`);
console.log(`  ${promptsVideo.length} prompts de vídeo`);
console.log(`  ${criados} roteiros criados, ${mantidos} preservados (já existiam)`);
console.log(`  ~${Math.round(total)} créditos = US$ ${(total * CRED_USD).toFixed(0)}`);
