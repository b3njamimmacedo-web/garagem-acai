#!/usr/bin/env node
/* =============================================================================
   GERADOR DE ARTE — HIDROMEL DE REIS
   Produz todos os SVGs de assets/img/ a partir de código.

   Por que SVG gerado e não foto de banco de imagem:
     1. Arte 100% autoral — nenhum risco de licença.
     2. Peso: cada capa tem ~4kB. Um JPEG equivalente teria 200kB.
        Em tráfego pago, isso é diferença direta de conversão.
     3. Escala infinita: mesma arte no card de 300px e no OG image de 1200px.
     4. Recolorível: o tema inteiro muda alterando a paleta aqui.

   Uso:  node scripts/gerar-arte.mjs
============================================================================= */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(RAIZ, 'assets', 'img');
mkdirSync(OUT, { recursive: true });

/* ----------------------------------------------------------------- PALETA */
const C = {
  breu: '#0E0B08',
  breu2: '#171009',
  carvao: '#1F160D',
  ouro: '#D4A017',
  ouroClaro: '#F5C542',
  ouroEsc: '#8A6D1F',
  bronze: '#B8860B',
  sangue: '#6B1F2A',
  pergaminho: '#F3E9D2',
  pergaminhoEsc: '#D9C9A3',
  fumaca: '#8A7B62',
};

let _uid = 0;
const uid = (p) => `${p}${(++_uid).toString(36)}`;

/* -------------------------------------------------------------- PRIMITIVAS */

/** Malha de favos de mel — o motivo visual que amarra a marca inteira. */
function favos(id, { cor = C.ouro, op = 0.07, lado = 22, traco = 1.1 } = {}) {
  const l = lado;
  const h = l * Math.sqrt(3);
  const w = l * 1.5;
  const hex = (cx, cy) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i);
      return `${(cx + l * Math.cos(a)).toFixed(2)},${(cy + l * Math.sin(a)).toFixed(2)}`;
    }).join(' ');
  return `<pattern id="${id}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" patternUnits="userSpaceOnUse">
    <polygon points="${hex(0, 0)}" fill="none" stroke="${cor}" stroke-opacity="${op}" stroke-width="${traco}"/>
    <polygon points="${hex(0, h)}" fill="none" stroke="${cor}" stroke-opacity="${op}" stroke-width="${traco}"/>
    <polygon points="${hex(w, h / 2)}" fill="none" stroke="${cor}" stroke-opacity="${op}" stroke-width="${traco}"/>
    <polygon points="${hex(0, h / 2)}" fill="none" stroke="${cor}" stroke-opacity="${op * 0.5}" stroke-width="${traco}"/>
  </pattern>`;
}

/** Grão de papel envelhecido. Tira o aspecto "vetor plástico". */
function grao(id, { intensidade = 0.5, freq = 0.9 } = {}) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="7" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="ng"/>
    <feComponentTransfer in="ng" result="nt"><feFuncA type="linear" slope="${intensidade}"/></feComponentTransfer>
    <feBlend in="SourceGraphic" in2="nt" mode="multiply"/>
  </filter>`;
}

/** Ouro escovado: o degradê que dá a leitura de metal, não de amarelo chapado. */
function ouroGrad(id, vertical = true) {
  const dir = vertical ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"';
  return `<linearGradient id="${id}" ${dir}>
    <stop offset="0%"   stop-color="#7A5E14"/>
    <stop offset="18%"  stop-color="${C.ouro}"/>
    <stop offset="38%"  stop-color="#FBE08A"/>
    <stop offset="52%"  stop-color="${C.ouroClaro}"/>
    <stop offset="70%"  stop-color="${C.bronze}"/>
    <stop offset="88%"  stop-color="#6F5411"/>
    <stop offset="100%" stop-color="#A87D18"/>
  </linearGradient>`;
}

/** Ouro claro para tipografia: o `ouroGrad` escurece demais em texto grande. */
function ouroTexto(id) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#FBE08A"/>
    <stop offset="40%"  stop-color="${C.ouroClaro}"/>
    <stop offset="75%"  stop-color="${C.ouro}"/>
    <stop offset="100%" stop-color="#A87D18"/>
  </linearGradient>`;
}

function brilhoRadial(id, cor, op = 0.55) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="${cor}" stop-opacity="${op}"/>
    <stop offset="55%"  stop-color="${cor}" stop-opacity="${op * 0.25}"/>
    <stop offset="100%" stop-color="${cor}" stop-opacity="0"/>
  </radialGradient>`;
}

/** Canto ornamental de manuscrito iluminado — desenhado, não fonte. */
function cantoOrnamento(x, y, esc = 1, rot = 0, cor = C.ouro, op = 0.8) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${esc})" fill="none"
      stroke="${cor}" stroke-opacity="${op}" stroke-width="1.6" stroke-linecap="round">
    <path d="M0 34 L0 8 Q0 0 8 0 L34 0"/>
    <path d="M6 30 L6 12 Q6 6 12 6 L30 6" stroke-opacity="${op * 0.5}"/>
    <path d="M14 14 q10 -8 20 -2 q-9 3 -12 9 q-4 -6 -8 -7z" fill="${cor}" fill-opacity="${op * 0.75}" stroke="none"/>
    <circle cx="9" cy="9" r="2" fill="${cor}" fill-opacity="${op}" stroke="none"/>
  </g>`;
}

/** Hexágono como caminho, com cantos suavizados. */
function hexPath(cx, cy, r, r2 = 0) {
  const p = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  if (!r2) return `M${p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L')} Z`;
  let d = '';
  for (let i = 0; i < 6; i++) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[(i + 1) % 6];
    const [xp, yp] = p[(i + 5) % 6];
    const lerp = (ax, ay, bx, by, t) => [ax + (bx - ax) * t, ay + (by - ay) * t];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const t = Math.min(0.5, r2 / len);
    const [ax, ay] = lerp(x0, y0, xp, yp, t);
    const [bx, by] = lerp(x0, y0, x1, y1, t);
    d += (i === 0 ? `M${ax.toFixed(2)},${ay.toFixed(2)}` : ` L${ax.toFixed(2)},${ay.toFixed(2)}`);
    d += ` Q${x0.toFixed(2)},${y0.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)}`;
  }
  return d + ' Z';
}

const svg = (w, h, corpo, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>\n${corpo}\n</svg>\n`;

function salvar(nome, conteudo) {
  writeFileSync(join(OUT, nome), conteudo, 'utf8');
  return nome;
}

/* ===========================================================================
   1. LOGO — chifre de hidromel dentro de hexágono coroado
=========================================================================== */
function logo({ w = 320, h = 320, marcaDagua = false } = {}) {
  const g = uid('g'), fv = uid('fv'), br = uid('br'), gr = uid('gr');
  const op = marcaDagua ? 0.14 : 1;
  return svg(w, h, `
<defs>
  ${ouroGrad(g)}
  ${favos(fv, { op: 0.1, lado: 18 })}
  ${brilhoRadial(br, C.ouroClaro, 0.3)}
  ${grao(gr, { intensidade: 0.28, freq: 1.1 })}
</defs>
<g opacity="${op}">
  ${marcaDagua ? '' : `<circle cx="160" cy="160" r="150" fill="${C.breu}"/>`}
  <circle cx="160" cy="160" r="150" fill="url(#${br})"/>
  <path d="${hexPath(160, 160, 128, 16)}" fill="none" stroke="url(#${g})" stroke-width="6"/>
  <path d="${hexPath(160, 160, 112, 14)}" fill="url(#${fv})" stroke="url(#${g})" stroke-width="1.6" stroke-opacity="0.5"/>

  <!-- coroa -->
  <g fill="url(#${g})">
    <path d="M112 74 L128 104 L160 66 L192 104 L208 74 L214 112 L106 112 Z"/>
    <rect x="104" y="115" width="112" height="9" rx="3"/>
    <circle cx="112" cy="70" r="6"/><circle cx="160" cy="60" r="7"/><circle cx="208" cy="70" r="6"/>
  </g>

  <!-- chifre de beber: crescente que afina até a ponta.
       Escala 0.76 em torno de (160,190) para a ponta não furar o hexágono. -->
  <g transform="translate(160 190) scale(0.76) translate(-160 -190) translate(-6 -2)">
    <path d="M88 140
             C 168 122, 232 168, 244 244
             C 216 220, 174 202, 120 192
             C 100 186, 90 166, 88 140 Z"
          fill="${C.ouro}" fill-opacity="0.18"
          stroke="url(#${g})" stroke-width="6.5" stroke-linejoin="round"/>
    <!-- hidromel dentro -->
    <path d="M104 168
             C 158 158, 206 190, 222 232
             C 200 216, 168 204, 126 196
             C 112 192, 106 182, 104 168 Z"
          fill="url(#${g})" fill-opacity="0.62"/>
    <!-- aro da boca -->
    <ellipse cx="100" cy="160" rx="17" ry="30" transform="rotate(-24 100 160)"
             fill="${C.breu}" stroke="url(#${g})" stroke-width="7"/>
    <ellipse cx="100" cy="160" rx="9" ry="19" transform="rotate(-24 100 160)"
             fill="url(#${g})" fill-opacity="0.55"/>
    <!-- gota de mel escorrendo da ponta -->
    <path d="M238 262 q11 16 11 24 a11 11 0 0 1 -22 0 q0 -8 11 -24z" fill="url(#${g})"/>
  </g>
</g>
${marcaDagua ? '' : `<rect width="${w}" height="${h}" filter="url(#${gr})" fill="transparent" opacity="0.5"/>`}
`);
}

/* ===========================================================================
   2. HERO — fundo do topo da página de vendas
=========================================================================== */
function hero() {
  const W = 1600, H = 900;
  const fv = uid('fv'), gr = uid('gr'), g = uid('g');
  const luz = uid('luz'), vin = uid('vin'), amb = uid('amb');
  // raios de luz vindo do alto, como vitral de salão
  const raios = Array.from({ length: 9 }, (_, i) => {
    const x = 120 + i * 175;
    const larg = 40 + (i % 3) * 26;
    const o = 0.05 + (i % 4) * 0.017;
    return `<path d="M${x} -40 L${x + larg} -40 L${x + larg + 190} ${H + 40} L${x + 120} ${H + 40} Z"
      fill="${C.ouroClaro}" opacity="${o.toFixed(3)}"/>`;
  }).join('\n  ');
  // fagulhas / pólen em suspensão
  const fagulhas = Array.from({ length: 70 }, (_, i) => {
    const x = ((i * 977) % W);
    const y = ((i * 613) % H);
    const r = 0.8 + ((i * 37) % 22) / 10;
    const o = 0.1 + ((i * 53) % 45) / 100;
    return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${C.ouroClaro}" opacity="${o.toFixed(2)}"/>`;
  }).join('');

  return svg(W, H, `
<defs>
  ${favos(fv, { op: 0.055, lado: 40, traco: 1.4 })}
  ${grao(gr, { intensidade: 0.42, freq: 0.75 })}
  ${ouroGrad(g)}
  <radialGradient id="${luz}" cx="50%" cy="8%" r="78%">
    <stop offset="0%" stop-color="#F5C542" stop-opacity="0.30"/>
    <stop offset="35%" stop-color="#B8860B" stop-opacity="0.11"/>
    <stop offset="100%" stop-color="#0E0B08" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="${vin}" cx="50%" cy="50%" r="72%">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
  </radialGradient>
  <linearGradient id="${amb}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.carvao}"/>
    <stop offset="45%" stop-color="${C.breu2}"/>
    <stop offset="100%" stop-color="${C.breu}"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#${amb})"/>
<rect width="${W}" height="${H}" fill="url(#${fv})"/>
${raios}
<rect width="${W}" height="${H}" fill="url(#${luz})"/>
<g>${fagulhas}</g>
<!-- arcos de salão de hidromel ao fundo -->
<g fill="none" stroke="${C.ouro}" stroke-opacity="0.09" stroke-width="2.5">
  <path d="M240 ${H} L240 470 Q240 350 400 350 Q560 350 560 470 L560 ${H}"/>
  <path d="M640 ${H} L640 420 Q640 280 800 280 Q960 280 960 420 L960 ${H}"/>
  <path d="M1040 ${H} L1040 470 Q1040 350 1200 350 Q1360 350 1360 470 L1360 ${H}"/>
</g>
<rect width="${W}" height="${H}" fill="url(#${vin})"/>
<rect width="${W}" height="${H}" filter="url(#${gr})" fill="transparent" opacity="0.55"/>
`);
}

/* ===========================================================================
   3. CAPAS DE MÓDULO — 16 peças, cada uma com glifo próprio
=========================================================================== */

/** Glifos desenhados à mão, um por módulo. Nada de biblioteca de ícone. */
const GLIFOS = {
  // 0 — juramento: pergaminho selado
  ordem: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 14 h56 a8 8 0 0 1 8 8 v62 a8 8 0 0 1 -8 8 h-56 a8 8 0 0 1 -8 -8 v-62 a8 8 0 0 1 8 -8z"/>
    <path d="M30 36 h40 M30 50 h40 M30 64 h26"/>
    <circle cx="70" cy="72" r="11" fill="${s}" fill-opacity="0.85" stroke="none"/></g>`,
  // 1 — história: ampulheta rúnica
  runa: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M24 14 h52 M24 86 h52"/>
    <path d="M30 14 L70 86 M70 14 L30 86"/>
    <path d="M36 50 h28"/>
    <path d="M50 50 L50 86" stroke-opacity="0.5"/>
    <path d="M40 68 q10 -8 20 0 l0 18 h-20z" fill="${s}" fill-opacity="0.7" stroke="none"/></g>`,
  // 2 — mel: colmeia
  colmeia: (s) => `<g stroke="${s}" fill="none" stroke-width="4" stroke-linejoin="round">
    <path d="${hexPath(50, 32, 17, 3)}"/>
    <path d="${hexPath(32, 62, 17, 3)}"/>
    <path d="${hexPath(68, 62, 17, 3)}"/>
    <path d="${hexPath(50, 32, 8, 2)}" fill="${s}" fill-opacity="0.65" stroke="none"/>
    <path d="M50 82 q6 9 6 13 a6 6 0 0 1 -12 0 q0 -4 6 -13z" fill="${s}" stroke="none"/></g>`,
  // 3 — levedura: células em divisão
  levedura: (s) => `<g stroke="${s}" fill="none" stroke-width="4">
    <circle cx="38" cy="42" r="17"/><circle cx="66" cy="62" r="13"/><circle cx="30" cy="72" r="9"/>
    <circle cx="38" cy="42" r="5" fill="${s}" stroke="none"/>
    <circle cx="66" cy="62" r="4" fill="${s}" stroke="none"/>
    <path d="M14 20 q8 6 4 14 M78 26 q-8 5 -5 13" stroke-linecap="round" stroke-opacity="0.6"/></g>`,
  // 4 — equipamento: fermentador com airlock
  fermentador: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 34 h40 l8 46 a10 10 0 0 1 -10 12 h-36 a10 10 0 0 1 -10 -12z"/>
    <path d="M42 34 v-8 h16 v8"/>
    <path d="M50 26 v-12"/>
    <circle cx="50" cy="10" r="6"/>
    <path d="M28 62 q11 -7 22 0 t22 0" stroke-opacity="0.75"/>
    <path d="M26 74 h48" stroke-opacity="0.4"/></g>`,
  // 5 — primeira receita: cálice
  calice: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M26 18 h48 l-6 30 a18 18 0 0 1 -36 0z"/>
    <path d="M50 66 v16 M32 88 h36"/>
    <path d="M50 66 a18 18 0 0 0 18 -18"/>
    <path d="M31 34 h38 l-4 14 a15 15 0 0 1 -30 0z" fill="${s}" fill-opacity="0.72" stroke="none"/></g>`,
  // 6 — medieval: brasão com espada
  brasao: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 10 L84 24 v28 q0 26 -34 38 q-34 -12 -34 -38 v-28z"/>
    <path d="M50 28 v40 M38 44 h24" />
    <path d="M50 22 L66 30 v18 q0 14 -16 20 q-16 -6 -16 -20 v-18z" fill="${s}" fill-opacity="0.28" stroke="none"/></g>`,
  // 7 — clareza: gota filtrada
  clareza: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 10 q24 32 24 46 a24 24 0 0 1 -48 0 q0 -14 24 -46z"/>
    <path d="M34 56 q16 -12 32 0" stroke-opacity="0.65"/>
    <path d="M50 30 q14 22 14 30 a14 14 0 0 1 -28 0 q0 -8 14 -30z" fill="${s}" fill-opacity="0.55" stroke="none"/>
    <path d="M12 86 h76" stroke-opacity="0.35"/></g>`,
  // 8 — madeira: barril
  barril: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round">
    <path d="M28 20 q-12 30 0 60 q22 8 44 0 q12 -30 0 -60 q-22 -8 -44 0z"/>
    <path d="M22 38 q28 8 56 0 M22 62 q28 8 56 0"/>
    <path d="M50 22 v56" stroke-opacity="0.45"/>
    <ellipse cx="50" cy="20" rx="22" ry="6" fill="${s}" fill-opacity="0.35" stroke="none"/></g>`,
  // 9 — defeito: nariz / alerta
  alerta: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 14 L88 82 h-76z"/>
    <path d="M50 40 v20"/>
    <circle cx="50" cy="70" r="4.5" fill="${s}" stroke="none"/>
    <path d="M18 26 q10 6 6 16 M82 26 q-10 6 -6 16" stroke-opacity="0.45"/></g>`,
  // 10 — premium: coroa com joia
  coroa: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 40 L30 66 L50 26 L70 66 L84 40 L88 82 h-76z"/>
    <path d="M16 40 L30 66 L50 26 L70 66 L84 40 L88 82 h-76z" fill="${s}" fill-opacity="0.2" stroke="none"/>
    <circle cx="16" cy="36" r="5" fill="${s}" stroke="none"/>
    <circle cx="50" cy="20" r="6" fill="${s}" stroke="none"/>
    <circle cx="84" cy="36" r="5" fill="${s}" stroke="none"/>
    <path d="M20 90 h60" /></g>`,
  // 11 — lei: balança
  balanca: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 14 v66 M28 86 h44"/>
    <path d="M18 30 h64"/>
    <path d="M18 30 L8 52 h20z" fill="${s}" fill-opacity="0.3"/>
    <path d="M82 30 L72 52 h20z" fill="${s}" fill-opacity="0.3"/>
    <circle cx="50" cy="24" r="5" fill="${s}" stroke="none"/></g>`,
  // 12 — custo: moedas
  moedas: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round">
    <ellipse cx="50" cy="28" rx="30" ry="11"/>
    <path d="M20 28 v14 q0 11 30 11 t30 -11 v-14"/>
    <path d="M20 50 v14 q0 11 30 11 t30 -11 v-14"/>
    <ellipse cx="50" cy="28" rx="15" ry="5" fill="${s}" fill-opacity="0.5" stroke="none"/></g>`,
  // 13 — marca: garrafa com rótulo
  garrafa: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M42 10 h16 v20 q0 8 8 16 q8 8 8 20 v20 a8 8 0 0 1 -8 8 h-32 a8 8 0 0 1 -8 -8 v-20 q0 -12 8 -20 q8 -8 8 -16z"/>
    <rect x="34" y="58" width="32" height="24" rx="3" fill="${s}" fill-opacity="0.6" stroke="none"/>
    <path d="M40 10 h20" stroke-width="6"/></g>`,
  // 14 — venda: aperto de mão / troca
  venda: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 44 L28 34 L50 46 L72 34 L90 44"/>
    <path d="M28 34 v34 q0 8 8 8 h28 q8 0 8 -8 v-34"/>
    <path d="M40 58 q10 10 20 0" />
    <circle cx="50" cy="46" r="5" fill="${s}" stroke="none"/>
    <path d="M14 82 h72" stroke-opacity="0.35"/></g>`,
  // 15 — escala: engrenagem + crescimento
  escala: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 84 v-22 h16 v22z"/>
    <path d="M42 84 v-40 h16 v40z"/>
    <path d="M68 84 v-58 h16 v58z"/>
    <path d="M16 84 h76" stroke-width="5"/>
    <path d="M20 34 L38 22 L56 30 L84 8" stroke-opacity="0.75"/>
    <path d="M70 8 h14 v14" stroke-opacity="0.75"/></g>`,
};

const MODULOS_META = [
  { n: 0,  glifo: 'ordem',       cor: '#D4A017', titulo: 'A ORDEM' },
  { n: 1,  glifo: 'runa',        cor: '#B8860B', titulo: 'A BEBIDA DOS DEUSES' },
  { n: 2,  glifo: 'colmeia',     cor: '#E0A800', titulo: 'A CIÊNCIA DO MEL' },
  { n: 3,  glifo: 'levedura',    cor: '#C08C1E', titulo: 'LEVEDURAS' },
  { n: 4,  glifo: 'fermentador', cor: '#8A6D1F', titulo: 'EQUIPAMENTOS' },
  { n: 5,  glifo: 'calice',      cor: '#D4A017', titulo: 'PRIMEIRO HIDROMEL' },
  { n: 6,  glifo: 'brasao',      cor: '#6B1F2A', titulo: 'MEDIEVAIS CLÁSSICAS' },
  { n: 7,  glifo: 'clareza',     cor: '#9C7A2E', titulo: 'ESTABILIZAÇÃO' },
  { n: 8,  glifo: 'barril',      cor: '#7A4B2A', titulo: 'MADEIRA' },
  { n: 9,  glifo: 'alerta',      cor: '#5B4636', titulo: 'DEFEITOS' },
  { n: 10, glifo: 'coroa',       cor: '#8B1E3F', titulo: 'LINHA PREMIUM' },
  { n: 11, glifo: 'balanca',     cor: '#2F4858', titulo: 'LEGALIZAÇÃO' },
  { n: 12, glifo: 'moedas',      cor: '#2E5E4E', titulo: 'PRECIFICAÇÃO' },
  { n: 13, glifo: 'garrafa',     cor: '#4A2C5E', titulo: 'MARCA' },
  { n: 14, glifo: 'venda',       cor: '#1F4E79', titulo: 'VENDAS' },
  { n: 15, glifo: 'escala',      cor: '#7A2E1E', titulo: 'ESCALA' },
];

const ROMANOS = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];

/* Quebra o título em no máximo 2 linhas e calcula o corpo que cabe na moldura.
   SVG não tem quebra automática de texto — sem isso, título longo vaza para fora. */
function ajustarTitulo(titulo, larguraMax = 146, corpoMax = 18) {
  // 0.72em por caractere: medido para Georgia bold em CAIXA ALTA, que é bem
  // mais larga que a média de 0.575em de texto corrido.
  const largura = (txt, fs, ls) => txt.length * (fs * 0.72 + ls);
  const corpo = (linhas) => {
    for (let fs = corpoMax; fs >= 10; fs -= 0.5) {
      const ls = fs >= 15 ? 1.2 : 0.8;
      if (linhas.every((l) => largura(l, fs, ls) <= larguraMax)) return { fs, ls };
    }
    return { fs: 10, ls: 0.6 };
  };

  const uma = corpo([titulo]);
  if (uma.fs >= 15) return { linhas: [titulo], ...uma };

  // duas linhas: quebra no ponto que deixa os lados mais equilibrados
  const palavras = titulo.split(' ');
  if (palavras.length === 1) return { linhas: [titulo], ...uma };
  let melhor = null;
  for (let i = 1; i < palavras.length; i++) {
    const a = palavras.slice(0, i).join(' ');
    const b = palavras.slice(i).join(' ');
    const dif = Math.abs(a.length - b.length);
    if (!melhor || dif < melhor.dif) melhor = { linhas: [a, b], dif };
  }
  return { linhas: melhor.linhas, ...corpo(melhor.linhas) };
}

function capaModulo({ n, glifo, cor, titulo }) {
  const W = 480, H = 300;
  const fv = uid('fv'), gr = uid('gr'), g = uid('g'), br = uid('br'), fundo = uid('f');
  const gt = uid('gt');
  const { linhas, fs, ls } = ajustarTitulo(titulo);
  const yTitulo = linhas.length === 2 ? 194 : 206;
  const tituloSvg = linhas
    .map((l, i) => `<text x="300" y="${yTitulo + i * (fs + 6)}" font-family="Georgia,serif" font-size="${fs}"
      font-weight="700" letter-spacing="${ls}" fill="${C.pergaminho}">${l}</text>`)
    .join('\n');
  // teto em 250: abaixo disso a assinatura encosta no ornamento do canto inferior
  const yMarca = Math.min(yTitulo + linhas.length * (fs + 6) + 12, 250);
  return svg(W, H, `
<defs>
  ${favos(fv, { op: 0.09, lado: 26, traco: 1.2 })}
  ${grao(gr, { intensidade: 0.34, freq: 0.85 })}
  ${ouroGrad(g)}
  ${ouroTexto(gt)}
  ${brilhoRadial(br, cor, 0.75)}
  <linearGradient id="${fundo}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"   stop-color="${cor}" stop-opacity="0.30"/>
    <stop offset="45%"  stop-color="${C.breu2}"/>
    <stop offset="100%" stop-color="${C.breu}"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${C.breu}"/>
<rect width="${W}" height="${H}" fill="url(#${fundo})"/>
<rect width="${W}" height="${H}" fill="url(#${fv})"/>
<ellipse cx="150" cy="150" rx="190" ry="170" fill="url(#${br})" opacity="0.5"/>

<!-- moldura -->
<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none"
      stroke="url(#${g})" stroke-width="2" stroke-opacity="0.85"/>
<rect x="21" y="21" width="${W - 42}" height="${H - 42}" fill="none"
      stroke="${C.ouro}" stroke-width="0.8" stroke-opacity="0.35"/>
${cantoOrnamento(20, 20, 1.05, 0)}
${cantoOrnamento(W - 20, 20, 1.05, 90)}
${cantoOrnamento(W - 20, H - 20, 1.05, 180)}
${cantoOrnamento(20, H - 20, 1.05, 270)}

<!-- glifo em hexágono -->
<g transform="translate(150 150)">
  <path d="${hexPath(0, 0, 84, 12)}" fill="${C.breu}" fill-opacity="0.55"
        stroke="url(#${g})" stroke-width="2.5"/>
  <path d="${hexPath(0, 0, 72, 10)}" fill="none" stroke="${cor}" stroke-width="1.2" stroke-opacity="0.55"/>
  <g transform="translate(-50 -50)">${GLIFOS[glifo](C.ouroClaro)}</g>
</g>

<!-- numeral -->
<text x="300" y="132" font-family="Georgia,'Times New Roman',serif" font-size="${ROMANOS[n].length >= 4 ? 66 : 82}"
      font-weight="700" letter-spacing="2" fill="url(#${gt})">${ROMANOS[n]}</text>
<text x="302" y="160" font-family="Georgia,serif" font-size="13" letter-spacing="6"
      fill="${C.fumaca}">MÓDULO ${String(n).padStart(2, '0')}</text>
<path d="M300 176 h140" stroke="url(#${g})" stroke-width="2"/>
${tituloSvg}
<text x="300" y="${yMarca}" font-family="Georgia,serif" font-size="11" letter-spacing="2.4"
      fill="${C.ouro}" opacity="0.8">HIDROMEL DE REIS</text>

<rect width="${W}" height="${H}" filter="url(#${gr})" fill="transparent" opacity="0.5"/>
`);
}

/* ===========================================================================
   4. ÍCONES DE BÔNUS
=========================================================================== */
const BONUS_GLIFOS = {
  grimorio: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M12 20 q22 -8 38 0 q16 -8 38 0 v62 q-22 -8 -38 0 q-16 -8 -38 0z"/>
    <path d="M50 20 v62"/>
    <path d="M22 36 h20 M22 50 h20 M58 36 h20 M58 50 h20" stroke-opacity="0.55"/>
    <path d="${hexPath(50, 66, 9, 2)}" fill="${s}" fill-opacity="0.8" stroke="none"/></g>`,
  pergaminho: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M22 16 h50 a8 8 0 0 1 8 8 v52 a8 8 0 0 1 -8 8 h-50 a8 8 0 0 1 -8 -8 v-52 a8 8 0 0 1 8 -8z"/>
    <path d="M28 34 h38 M28 48 h38 M28 62 h22"/>
    <circle cx="70" cy="70" r="10" fill="${s}" fill-opacity="0.75" stroke="none"/></g>`,
  ficha: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <rect x="16" y="14" width="68" height="72" rx="7"/>
    <path d="M16 34 h68"/>
    <path d="M28 50 h18 M28 64 h18 M56 50 h16 M56 64 h16" stroke-opacity="0.6"/>
    <path d="M30 22 v-10 M70 22 v-10"/></g>`,
  calculadora: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <rect x="20" y="12" width="60" height="76" rx="8"/>
    <rect x="30" y="22" width="40" height="16" rx="3" fill="${s}" fill-opacity="0.55" stroke="none"/>
    <circle cx="34" cy="52" r="4" fill="${s}" stroke="none"/><circle cx="50" cy="52" r="4" fill="${s}" stroke="none"/>
    <circle cx="66" cy="52" r="4" fill="${s}" stroke="none"/><circle cx="34" cy="68" r="4" fill="${s}" stroke="none"/>
    <circle cx="50" cy="68" r="4" fill="${s}" stroke="none"/><circle cx="66" cy="68" r="4" fill="${s}" stroke="none"/></g>`,
  rotulo: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M24 16 h52 a6 6 0 0 1 6 6 v56 a6 6 0 0 1 -6 6 h-52 a6 6 0 0 1 -6 -6 v-56 a6 6 0 0 1 6 -6z"/>
    <path d="${hexPath(50, 40, 14, 3)}" fill="${s}" fill-opacity="0.6" stroke="none"/>
    <path d="M32 62 h36 M38 74 h24" stroke-opacity="0.6"/></g>`,
  ordem: (s) => `<g stroke="${s}" fill="none" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="34" cy="34" r="13"/><circle cx="66" cy="34" r="13"/>
    <path d="M12 76 q0 -18 22 -18 q22 0 22 18"/>
    <path d="M46 76 q0 -18 20 -18 q22 0 22 18"/>
    <path d="${hexPath(50, 88, 8, 2)}" fill="${s}" fill-opacity="0.7" stroke="none"/></g>`,
};

function iconeBonus(nome) {
  const g = uid('g'), fv = uid('fv');
  return svg(140, 140, `
<defs>${ouroGrad(g)}${favos(fv, { op: 0.14, lado: 12 })}</defs>
<path d="${hexPath(70, 70, 64, 9)}" fill="${C.carvao}" stroke="url(#${g})" stroke-width="2.5"/>
<path d="${hexPath(70, 70, 64, 9)}" fill="url(#${fv})"/>
<g transform="translate(20 20)">${BONUS_GLIFOS[nome](C.ouroClaro)}</g>
`);
}

/* ===========================================================================
   5. SELO DE GARANTIA
=========================================================================== */
function seloGarantia() {
  const g = uid('g'), gr = uid('gr');
  const dentes = Array.from({ length: 44 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 44;
    const r1 = 108, r2 = i % 2 ? 118 : 114;
    return `${(120 + r1 * Math.cos(a)).toFixed(1)},${(120 + r1 * Math.sin(a)).toFixed(1)} ${(120 + r2 * Math.cos(a + 0.06)).toFixed(1)},${(120 + r2 * Math.sin(a + 0.06)).toFixed(1)}`;
  }).join(' ');
  return svg(240, 240, `
<defs>${ouroGrad(g)}${grao(gr, { intensidade: 0.3, freq: 1.2 })}
  <path id="arcoTopo" d="M120 120 m-84 0 a84 84 0 0 1 168 0" fill="none"/>
  <!-- arco de baixo percorrido da esquerda para a direita (varredura 0), senão
       o texto sai de cabeça para baixo -->
  <path id="arcoBase" d="M120 120 m-84 0 a84 84 0 0 0 168 0" fill="none"/>
</defs>
<polygon points="${dentes}" fill="url(#${g})" opacity="0.92"/>
<circle cx="120" cy="120" r="106" fill="${C.sangue}"/>
<circle cx="120" cy="120" r="98" fill="none" stroke="url(#${g})" stroke-width="3"/>
<circle cx="120" cy="120" r="90" fill="none" stroke="${C.ouroClaro}" stroke-width="1" stroke-opacity="0.5"/>
<!-- corpo e espaçamento calculados para caber no semicírculo: metade da
     circunferência de r=84 são ~264px, e o texto tem 25 caracteres -->
<text font-family="Georgia,serif" font-size="11" letter-spacing="2" fill="${C.ouroClaro}">
  <textPath href="#arcoTopo" startOffset="50%" text-anchor="middle">GARANTIA DO PRIMEIRO LOTE</textPath></text>
<text font-family="Georgia,serif" font-size="10" letter-spacing="2.5" fill="${C.ouroClaro}" opacity="0.85">
  <textPath href="#arcoBase" startOffset="50%" text-anchor="middle">HIDROMEL DE REIS</textPath></text>
<text x="120" y="118" text-anchor="middle" font-family="Georgia,serif" font-size="64"
      font-weight="700" fill="url(#${g})">15</text>
<text x="120" y="146" text-anchor="middle" font-family="Georgia,serif" font-size="19"
      letter-spacing="7" fill="${C.pergaminho}">DIAS</text>
<path d="M86 162 h68" stroke="url(#${g})" stroke-width="2"/>
<rect width="240" height="240" filter="url(#${gr})" fill="transparent" opacity="0.4"/>
`);
}

/* ===========================================================================
   6. GARRAFAS DA LINHA PREMIUM — ilustração de produto
=========================================================================== */
function garrafa({ nome, liquido, rotuloCor, glifo = 'colmeia' }) {
  const W = 260, H = 460;
  const g = uid('g'), liq = uid('l'), vidro = uid('v'), br = uid('b');
  return svg(W, H, `
<defs>
  ${ouroGrad(g)}
  ${brilhoRadial(br, liquido, 0.4)}
  <linearGradient id="${liq}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${liquido}" stop-opacity="0.95"/>
    <stop offset="30%"  stop-color="${liquido}" stop-opacity="0.7"/>
    <stop offset="55%"  stop-color="#FFF" stop-opacity="0.22"/>
    <stop offset="70%"  stop-color="${liquido}" stop-opacity="0.8"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
  </linearGradient>
  <linearGradient id="${vidro}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#FFF" stop-opacity="0.05"/>
    <stop offset="22%" stop-color="#FFF" stop-opacity="0.30"/>
    <stop offset="40%" stop-color="#FFF" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.28"/>
  </linearGradient>
</defs>
<ellipse cx="130" cy="440" rx="86" ry="14" fill="url(#${br})"/>
<!-- corpo -->
<path d="M104 40 h52 v72 q0 22 16 40 q18 20 18 48 v186 a20 20 0 0 1 -20 20 h-80 a20 20 0 0 1 -20 -20 v-186 q0 -28 18 -48 q16 -18 16 -40z"
      fill="url(#${liq})"/>
<path d="M104 40 h52 v72 q0 22 16 40 q18 20 18 48 v186 a20 20 0 0 1 -20 20 h-80 a20 20 0 0 1 -20 -20 v-186 q0 -28 18 -48 q16 -18 16 -40z"
      fill="url(#${vidro})" stroke="${C.ouro}" stroke-opacity="0.45" stroke-width="1.5"/>
<!-- cápsula -->
<path d="M100 34 h60 v34 q-30 8 -60 0z" fill="url(#${g})"/>
<rect x="100" y="26" width="60" height="12" rx="4" fill="${C.sangue}"/>
<!-- rótulo -->
<rect x="66" y="228" width="128" height="136" rx="5" fill="${rotuloCor}"/>
<rect x="72" y="234" width="116" height="124" rx="3" fill="none" stroke="${C.ouro}" stroke-width="1.4" stroke-opacity="0.9"/>
${cantoOrnamento(76, 238, 0.5, 0, C.ouroEsc, 0.9)}
${cantoOrnamento(184, 238, 0.5, 90, C.ouroEsc, 0.9)}
${cantoOrnamento(184, 354, 0.5, 180, C.ouroEsc, 0.9)}
${cantoOrnamento(76, 354, 0.5, 270, C.ouroEsc, 0.9)}
<g transform="translate(105 246) scale(0.5)">${GLIFOS[glifo](C.ouroEsc)}</g>
<path d="M84 306 h92" stroke="${C.ouroEsc}" stroke-width="1.2"/>
<text x="130" y="326" text-anchor="middle" font-family="Georgia,serif" font-size="14"
      font-weight="700" letter-spacing="1" fill="#1a1208">${nome}</text>
<text x="130" y="344" text-anchor="middle" font-family="Georgia,serif" font-size="8"
      letter-spacing="3" fill="#4a3b1e">HIDROMEL · 750ml</text>
<!-- reflexo -->
<path d="M112 130 q-6 40 -4 120 q1 60 2 130" stroke="#FFF" stroke-opacity="0.28"
      stroke-width="7" fill="none" stroke-linecap="round"/>
`);
}

/* ===========================================================================
   7. DIVISOR ORNAMENTAL
=========================================================================== */
function divisor() {
  const g = uid('g');
  return svg(600, 40, `
<defs>${ouroGrad(g, false)}</defs>
<g stroke="url(#${g})" stroke-width="1.6" fill="none">
  <path d="M0 20 H210" opacity="0.5"/>
  <path d="M390 20 H600" opacity="0.5"/>
  <path d="M222 20 q14 -12 28 0 q-14 12 -28 0z" fill="url(#${g})" stroke="none"/>
  <path d="M350 20 q14 -12 28 0 q-14 12 -28 0z" fill="url(#${g})" stroke="none"/>
</g>
<path d="${hexPath(300, 20, 15, 3)}" fill="none" stroke="url(#${g})" stroke-width="1.8"/>
<path d="${hexPath(300, 20, 7, 1.5)}" fill="url(#${g})"/>
`);
}

/* ===========================================================================
   8. PÔSTER DE VÍDEO (usado enquanto a aula não foi gravada)
=========================================================================== */
function posterVideo() {
  const W = 1280, H = 720;
  const fv = uid('fv'), g = uid('g'), br = uid('br'), gr = uid('gr');
  return svg(W, H, `
<defs>${favos(fv, { op: 0.07, lado: 34 })}${ouroGrad(g)}
  ${brilhoRadial(br, C.ouro, 0.28)}${grao(gr, { intensidade: 0.35, freq: 0.8 })}</defs>
<rect width="${W}" height="${H}" fill="${C.breu}"/>
<rect width="${W}" height="${H}" fill="url(#${fv})"/>
<ellipse cx="640" cy="360" rx="520" ry="380" fill="url(#${br})"/>
<!-- Só marca decorativa. O texto ("Aula em produção") é sobreposto em HTML pelo
     player — se estivesse aqui também, apareceria duplicado, e o corte do
     background-size:cover ainda o partiria ao meio em telas largas. -->
<!-- Emblema acima do centro: a caixa de aviso do player ocupa a faixa de baixo. -->
<path d="${hexPath(640, 288, 100, 13)}" fill="${C.carvao}" fill-opacity="0.75"
      stroke="url(#${g})" stroke-width="3"/>
<path d="${hexPath(640, 288, 84, 11)}" fill="none" stroke="${C.ouro}" stroke-width="1" stroke-opacity="0.45"/>
<path d="M610 242 L712 288 L610 334 Z" fill="url(#${g})"/>
<rect width="${W}" height="${H}" filter="url(#${gr})" fill="transparent" opacity="0.5"/>
`);
}

/* ===========================================================================
   9. OG IMAGE — o que aparece quando o link é compartilhado
=========================================================================== */
function ogImage() {
  const W = 1200, H = 630;
  const fv = uid('fv'), g = uid('g'), br = uid('br'), gr = uid('gr'), fundo = uid('f'), gt = uid('gt');
  return svg(W, H, `
<defs>${favos(fv, { op: 0.07, lado: 30 })}${ouroGrad(g)}${ouroTexto(gt)}
  ${brilhoRadial(br, C.ouro, 0.34)}${grao(gr, { intensidade: 0.32, freq: 0.8 })}
  <linearGradient id="${fundo}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${C.carvao}"/><stop offset="100%" stop-color="${C.breu}"/>
  </linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#${fundo})"/>
<rect width="${W}" height="${H}" fill="url(#${fv})"/>
<ellipse cx="880" cy="315" rx="420" ry="360" fill="url(#${br})"/>
<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="url(#${g})" stroke-width="2"/>
${cantoOrnamento(34, 34, 1.5, 0)}
${cantoOrnamento(W - 34, 34, 1.5, 90)}
${cantoOrnamento(W - 34, H - 34, 1.5, 180)}
${cantoOrnamento(34, H - 34, 1.5, 270)}
<g transform="translate(820 150) scale(1.1)">
  <path d="${hexPath(0, 0, 130, 16)}" fill="none" stroke="url(#${g})" stroke-width="4"/>
  <g transform="translate(-70 -70) scale(1.4)">${GLIFOS.calice(C.ouroClaro)}</g>
</g>
<text x="80" y="188" font-family="Georgia,serif" font-size="17" letter-spacing="8" fill="${C.ouro}">A BEBIDA MAIS ANTIGA DO MUNDO</text>
<text x="80" y="278" font-family="Georgia,serif" font-size="78" font-weight="700" fill="url(#${gt})">HIDROMEL</text>
<text x="80" y="356" font-family="Georgia,serif" font-size="78" font-weight="700" fill="${C.pergaminho}">DE REIS</text>
<path d="M80 396 h300" stroke="url(#${g})" stroke-width="3"/>
<text x="80" y="446" font-family="Georgia,serif" font-size="26" fill="${C.pergaminhoEsc}">Produza. Legalize. Venda.</text>
<text x="80" y="530" font-family="Georgia,serif" font-size="18" letter-spacing="3" fill="${C.fumaca}">16 MÓDULOS · 112 AULAS · 30 RECEITAS</text>
<rect width="${W}" height="${H}" filter="url(#${gr})" fill="transparent" opacity="0.45"/>
`);
}

/* ===========================================================================
   10. TEXTURA DE FUNDO — repetível, para seções internas
=========================================================================== */
function texturaFavos() {
  const fv = uid('fv');
  return svg(240, 208, `<defs>${favos(fv, { op: 0.16, lado: 34, traco: 1.3 })}</defs>
<rect width="240" height="208" fill="url(#${fv})"/>`);
}

/* ===========================================================================
   EXECUÇÃO
=========================================================================== */
const gerados = [];

gerados.push(salvar('logo.svg', logo()));
gerados.push(salvar('logo-marca-dagua.svg', logo({ marcaDagua: true })));
gerados.push(salvar('hero.svg', hero()));
gerados.push(salvar('og.svg', ogImage()));
gerados.push(salvar('divisor.svg', divisor()));
gerados.push(salvar('selo-garantia.svg', seloGarantia()));
gerados.push(salvar('poster-video.svg', posterVideo()));
gerados.push(salvar('textura-favos.svg', texturaFavos()));

MODULOS_META.forEach((m) =>
  gerados.push(salvar(`modulo-${String(m.n).padStart(2, '0')}.svg`, capaModulo(m)))
);

Object.keys(BONUS_GLIFOS).forEach((k) =>
  gerados.push(salvar(`bonus-${k}.svg`, iconeBonus(k)))
);

// Garrafas da linha premium — as mesmas do Módulo 10
[
  { arq: 'garrafa-bochet.svg',    nome: 'BOCHET',    liquido: '#4A2312', rotuloCor: '#E8D9B8', glifo: 'barril' },
  { arq: 'garrafa-jabuticaba.svg',nome: 'JABUTICABA',liquido: '#4B0F2A', rotuloCor: '#F0E4CA', glifo: 'brasao' },
  { arq: 'garrafa-tradicional.svg',nome: 'TRADIÇÃO', liquido: '#C98B14', rotuloCor: '#F3E9D2', glifo: 'colmeia' },
  { arq: 'garrafa-hibisco.svg',   nome: 'HIBISCO',   liquido: '#8E1B4A', rotuloCor: '#EFE0C6', glifo: 'coroa' },
  { arq: 'garrafa-capsicumel.svg',nome: 'CAPSICUMEL',liquido: '#B4451A', rotuloCor: '#EDDFC2', glifo: 'alerta' },
].forEach((b) => gerados.push(salvar(b.arq, garrafa(b))));

// favicon compacto
writeFileSync(join(OUT, 'favicon.svg'), logo({ w: 64, h: 64 }), 'utf8');
gerados.push('favicon.svg');

console.log(`✓ ${gerados.length} arquivos gerados em assets/img/`);
console.log(gerados.map((g) => '  · ' + g).join('\n'));
