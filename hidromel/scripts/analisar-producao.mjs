#!/usr/bin/env node
/* =============================================================================
   ANÁLISE DE PRODUÇÃO DE VÍDEO

   Classifica as 112 aulas por tipo de produção e calcula o custo em duas
   hipóteses: refazendo tudo do zero, e com o reaproveitamento modular
   (aula-base + delta) declarado nos campos `base` / `novo` de curriculo.js.

   Uso:  node scripts/analisar-producao.mjs
============================================================================= */

import { CURRICULO } from '../assets/js/curriculo.js';

/* ------------------------------------------------------------ PARÂMETROS */

// Preços reais do Higgsfield (consultados na API em ago/2026).
const CREDITO_USD = 99 / 3000;        // plano Ultra anual: US$ 99 por 3.000 créditos
const CRED_POR_SEG_VIDEO = 1;         // Kling 3.0 720p: 5 créditos por clipe de 5 s
const CRED_POR_IMAGEM = 1000 / 4800;  // Plus: 1.000 créditos ≈ 4.800 imagens
const RETENTATIVAS = 4;               // gerações necessárias por clipe aproveitável

// Produção humana
const MEL_KG_POR_LOTE = 6;
const PRECO_MEL_KG = 32;
const DIAS_POR_LOTE = 90;

/* ------------------------------------------------- CLASSIFICAÇÃO DAS AULAS

   P  bancada  — filmagem real, única, exige lote/insumo. Custo: seu tempo.
   D  delta    — herda a base; filma só o que muda. Poucos minutos de bancada.
   T  tela     — captura de tela (calculadora, planilha, documento). Custo zero.
   S  slide    — narração sobre imagens. IA de IMAGEM, ~25x mais barata que vídeo.
   B  b-roll   — precisa de cena que não dá para filmar (histórico). IA de VÍDEO.
*/
const CLASSIFICACAO = {
  m00: 'S', m01: 'B', m02: 'S', m03: 'S', m04: 'S',
  m05: 'P',                       // a base de tudo
  m06: 'D', m07: 'S', m08: 'S', m09: 'S',
  m10: 'D', m11: 'S', m12: 'T', m13: 'S', m14: 'S', m15: 'S',
};

// Aulas que fogem do padrão do módulo
const EXCECOES = {
  a0204: 'P', a0206: 'T', a0304: 'P', a0306: 'P', a0405: 'P', a0406: 'P',
  a0501: 'S', a0506: 'S',
  a0703: 'P', a0706: 'P', a0906: 'P', a1306: 'P', a1207: 'T',
};

const tipoDa = (aula, mod) => EXCECOES[aula.id] || (aula.lab ? (CLASSIFICACAO[mod.id] === 'D' ? 'D' : 'P') : CLASSIFICACAO[mod.id]);

/* ------------------------------------------------------------- APURAÇÃO */

const aulas = CURRICULO.flatMap((m) => m.aulas.map((a) => ({ ...a, mod: m, tipo: tipoDa(a, m) })));

const por = (t) => aulas.filter((a) => a.tipo === t);
const min = (lista) => lista.reduce((s, a) => s + a.m, 0);

const grupos = ['P', 'D', 'T', 'S', 'B'].map((t) => ({
  t, aulas: por(t).length, min: min(por(t)),
}));

const NOME = {
  P: 'Bancada (filmagem real, única)',
  D: 'Delta (herda a base, filma só o que muda)',
  T: 'Captura de tela',
  S: 'Slide + narração (IA de imagem)',
  B: 'B-roll histórico (IA de vídeo)',
};

console.log('\n═══ CLASSIFICAÇÃO DAS 112 AULAS ═══\n');
console.log('TIPO  AULAS   MIN   ' + 'DESCRIÇÃO');
for (const g of grupos) {
  console.log(`  ${g.t}   ${String(g.aulas).padStart(4)}  ${String(g.min).padStart(5)}   ${NOME[g.t]}`);
}
const totalMin = min(aulas);
console.log(`      ${String(aulas.length).padStart(4)}  ${String(totalMin).padStart(5)}   TOTAL (${(totalMin / 60).toFixed(1)} h)\n`);

/* --------------------------------------- ECONOMIA DO REAPROVEITAMENTO */

const comBase = aulas.filter((a) => a.base?.length);
const etapasEvitadas = comBase.reduce((s, a) => s + a.base.length, 0);

// Sem reaproveitamento, cada receita teria de mostrar o processo inteiro.
// O processo-base do Módulo 5 tem 6 aulas de bancada.
const baseMin = min(CURRICULO.find((m) => m.id === 'm05').aulas.filter((a) => a.lab));
const MIN_DELTA = 4;   // minutos de bancada nova por receita

const semReuso = comBase.length * baseMin;
const comReuso = comBase.length * MIN_DELTA;

console.log('═══ REAPROVEITAMENTO MODULAR (aula-base + delta) ═══\n');
console.log(`  Receitas que herdam base ............ ${comBase.length}`);
console.log(`  Referências a etapas já ensinadas ... ${etapasEvitadas}`);
console.log(`  Processo-base do Módulo 5 .......... ${baseMin} min de bancada\n`);
console.log(`  Filmagem SEM reuso ....... ${comBase.length} × ${baseMin} min = ${semReuso} min (${(semReuso / 60).toFixed(1)} h)`);
console.log(`  Filmagem COM reuso ....... ${comBase.length} × ${MIN_DELTA} min = ${comReuso} min (${(comReuso / 60).toFixed(1)} h)`);
console.log(`  Economia de filmagem ..... ${semReuso - comReuso} min (${Math.round((1 - comReuso / semReuso) * 100)}%)\n`);

// O custo que realmente dói: lotes reais de hidromel
const lotesSem = comBase.length;
const lotesCom = 4;   // um por técnica-base: tradicional, melomel, bochet, braggot
const custoSem = lotesSem * MEL_KG_POR_LOTE * PRECO_MEL_KG;
const custoCom = lotesCom * MEL_KG_POR_LOTE * PRECO_MEL_KG;

console.log('  ── Insumo e calendário ──');
console.log(`  SEM reuso: ${lotesSem} lotes reais × ${MEL_KG_POR_LOTE} kg de mel = R$ ${custoSem.toLocaleString('pt-BR')}`);
console.log(`             fermentando ${DIAS_POR_LOTE} dias cada`);
console.log(`  COM reuso: ${lotesCom} lotes-base = R$ ${custoCom.toLocaleString('pt-BR')}`);
console.log(`  Economia:  R$ ${(custoSem - custoCom).toLocaleString('pt-BR')} em mel\n`);

/* ------------------------------------------------- CRÉDITOS HIGGSFIELD */

const usd = (n) => 'US$ ' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

// (a) A abordagem ingênua: gerar as 31 h inteiras em vídeo
const segTudo = totalMin * 60;
const credTudo = segTudo * CRED_POR_SEG_VIDEO * RETENTATIVAS;

// (b) A abordagem correta: IA só onde ela é insubstituível.
//
// O módulo histórico NÃO vira 84 minutos de vídeo contínuo — isso seria repetir
// o erro que estamos evitando. Ele é narração sobre IMAGENS, pontuada por um
// número FIXO de clipes-âncora nos momentos que merecem movimento
// (Jiahu, o Valhalla, o salão de Beowulf, a lua de mel, o t'ej, o trójniak).
const CLIPES_ANCORA = 30;
const SEG_POR_CLIPE = 10;
const credB = CLIPES_ANCORA * SEG_POR_CLIPE * CRED_POR_SEG_VIDEO * RETENTATIVAS;

// Imagens cobrem tanto as aulas de slide quanto o corpo do módulo histórico.
const minNarrado = min(por('S')) + min(por('B'));
const imagensS = Math.ceil(minNarrado / 2);         // uma imagem a cada 2 min
const credS = imagensS * CRED_POR_IMAGEM * 2;       // 2 tentativas por imagem

const marketing = { vsl: 12, anuncios: 24, vinhetas: 16 };
const credMkt =
  (marketing.vsl + marketing.anuncios) * 10 * CRED_POR_SEG_VIDEO * RETENTATIVAS +
  marketing.vinhetas * 5 * CRED_POR_SEG_VIDEO * 3;

const credCerto = credB + credS + credMkt;

console.log('═══ CRÉDITOS HIGGSFIELD ═══\n');
console.log('  (a) Gerar as 31 h inteiras em vídeo de IA');
console.log(`      ${credTudo.toLocaleString('pt-BR')} créditos = ${usd(credTudo * CREDITO_USD)}`);
console.log(`      ${Math.ceil(credTudo / 3000)} meses de plano Ultra (${(credTudo / 3000 / 12).toFixed(1)} anos)\n`);

console.log('  (b) IA só onde nenhuma câmera alcança');
console.log(`      Clipes-âncora históricos ... ${CLIPES_ANCORA} × ${SEG_POR_CLIPE}s → ${Math.round(credB).toLocaleString('pt-BR')} créd.`);
console.log(`      Imagens p/ narração ........ ${imagensS} imagens → ${Math.round(credS).toLocaleString('pt-BR')} créd.`);
console.log(`      VSL + anúncios + vinhetas .. ${Math.round(credMkt).toLocaleString('pt-BR')} créd.`);
console.log(`      TOTAL ...................... ${Math.round(credCerto).toLocaleString('pt-BR')} créditos = ${usd(credCerto * CREDITO_USD)}`);
console.log(`      ${Math.ceil(credCerto / 3000)} mês(es) de plano Ultra\n`);

console.log(`  Diferença: ${usd(credTudo * CREDITO_USD - credCerto * CREDITO_USD)} e ${Math.ceil(credTudo / 3000) - Math.ceil(credCerto / 3000)} meses.\n`);

// A comparação honesta é por MINUTO DE CURSO ENTREGUE, não por peça:
// uma imagem cobre 2 minutos de narração; um segundo de vídeo cobre 1 segundo.
const credPorMinImagem = CRED_POR_IMAGEM / 2;
const credPorMinVideo = 60 * CRED_POR_SEG_VIDEO;
console.log('  Por que narração sobre imagem é tão mais barata:');
console.log(`      1 min de aula com imagens ... ${credPorMinImagem.toFixed(2)} créditos`);
console.log(`      1 min de aula em vídeo IA ... ${credPorMinVideo} créditos`);
console.log(`      → ${Math.round(credPorMinVideo / credPorMinImagem)}x mais barato por minuto entregue\n`);
