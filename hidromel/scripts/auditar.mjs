#!/usr/bin/env node
/* =============================================================================
   AUDITORIA — varredura de defeitos que testes de unidade não pegam

   Confere, num passe só:
     · integridade dos dados (IDs duplicados, referências quebradas, arquivos
       citados que não existem, ordem das aulas-base)
     · escaping de dados de aluno em HTML (XSS)
     · coerência de negócio (preços, planos, upgrade nunca negativo)
     · números da página de vendas contra o currículo
     · calculadoras com entrada ruim
     · segredos commitados por engano
     · acessibilidade básica do HTML

   Sai com código 1 se houver achado de gravidade ALTA.

   Uso:  node scripts/auditar.mjs
============================================================================= */

import { CURRICULO, BONUS, PLANOS, STATS, ordemPlano } from '../assets/js/curriculo.js';
import * as CALC from '../assets/js/calculadoras.js';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const R = join(dirname(fileURLToPath(import.meta.url)), '..') + '/';
const achados = [];
const nota = (grav, area, msg) => achados.push({ grav, area, msg });

/* ------------------------------------------------- 1. INTEGRIDADE DE DADOS */
const todas = CURRICULO.flatMap((m) => m.aulas.map((a) => ({ ...a, mod: m })));
const ids = todas.map((a) => a.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) nota('ALTA', 'dados', `IDs de aula duplicados: ${[...new Set(dup)]}`);

const modIds = CURRICULO.map((m) => m.id);
if (new Set(modIds).size !== modIds.length) nota('ALTA', 'dados', 'IDs de módulo duplicados');

// base -> aula existente?
for (const a of todas) {
  for (const b of a.base || []) {
    if (!ids.includes(b)) nota('ALTA', 'dados', `${a.id} referencia base inexistente "${b}"`);
  }
  // a base tem que vir ANTES no currículo, senão o aluno é mandado para o futuro
  for (const b of a.base || []) {
    const ia = todas.findIndex((x) => x.id === a.id);
    const ib = todas.findIndex((x) => x.id === b);
    if (ib > ia) nota('MEDIA', 'dados', `${a.id} referencia ${b}, que vem DEPOIS dela no currículo`);
  }
  // a base precisa estar num plano que o aluno da aula já tenha
  const alvo = todas.find((x) => x.id === (a.base || [])[0]);
  for (const b of a.base || []) {
    const ab = todas.find((x) => x.id === b);
    if (ab && ordemPlano(ab.mod.plano) > ordemPlano(a.mod.plano)) {
      nota('ALTA', 'dados', `${a.id} (${a.mod.plano}) referencia ${b} de plano superior (${ab.mod.plano}) — aluno não consegue rever`);
    }
  }
}

// PDFs citados existem?
const pdfsCitados = new Set([
  ...todas.filter((a) => a.pdf).map((a) => a.pdf),
  ...BONUS.filter((b) => b.arquivo).map((b) => b.arquivo),
]);
for (const p of pdfsCitados) {
  if (!existsSync(R + 'material/' + p)) nota('ALTA', 'dados', `PDF citado não existe: ${p}`);
}
// PDFs órfãos
const pdfsNoDisco = readdirSync(R + 'material').filter((f) => f.endsWith('.pdf'));
for (const p of pdfsNoDisco) {
  if (!pdfsCitados.has(p)) nota('BAIXA', 'dados', `PDF no disco que ninguém referencia: ${p}`);
}
// capas de módulo
for (const m of CURRICULO) {
  const f = `modulo-${String(m.n).padStart(2, '0')}.svg`;
  if (!existsSync(R + 'assets/img/' + f)) nota('ALTA', 'dados', `capa faltando: ${f}`);
}
// ícones de bônus
for (const b of BONUS) {
  if (!existsSync(R + `assets/img/bonus-${b.icone}.svg`)) nota('ALTA', 'dados', `ícone faltando: bonus-${b.icone}.svg`);
}
// bônus de plano coerente
for (const b of BONUS) {
  if (!PLANOS[b.plano]) nota('ALTA', 'dados', `bônus ${b.id} tem plano inválido "${b.plano}"`);
}

/* ------------------------------------------------------ 2. XSS / ESCAPING */
const curso = readFileSync(R + 'assets/js/curso.js', 'utf8');
const site = readFileSync(R + 'assets/js/site.js', 'utf8');
const worker = readFileSync(R + 'api/worker.js', 'utf8');

// Dado de aluno interpolado em template sem passar por esc()/escH().
const cru = (txt, campos) => campos.filter((c) => {
  const re = new RegExp('\\$\\{\\s*' + c.replace('.', '\\.') + '[^}]*\\}', 'g');
  return [...txt.matchAll(re)].some((m) => !/esc\(|escH\(/.test(m[0]));
});

const cursoCru = cru(curso, ['ALUNO.nome', 'ALUNO.email', 'ALUNO.codigo']);
if (cursoCru.length) nota('ALTA', 'xss', `curso.js interpola sem escapar: ${cursoCru.join(', ')}`);

// Só dentro do template do e-mail: fora dele `${nome}` é o nome da plataforma
// na rota de webhook, que é literal nosso e não vem de fora.
const corpoEmail = worker.slice(
  worker.indexOf('function corpoEmail'),
  worker.indexOf('async function enviarEmail'));
const workerCru = cru(corpoEmail, ['nome', 'codigo', 'link']);
if (workerCru.length) nota('ALTA', 'xss', `corpoEmail() interpola sem escapar: ${workerCru.join(', ')}`);

if (/\$\{erro\.message\}/.test(site)) nota('MEDIA', 'xss', 'site.js interpola erro.message sem escapar');

/* --------------------------------------------------- 3. LÓGICA DE NEGÓCIO */
for (const p of Object.values(PLANOS)) {
  if (p.precoDe <= p.preco) nota('MEDIA', 'negocio', `${p.nome}: preço "de" não é maior que o "por"`);
  if (p.preco <= 0) nota('ALTA', 'negocio', `${p.nome}: preço inválido`);
}
const ordens = Object.values(PLANOS).map((p) => p.ordem);
if (new Set(ordens).size !== ordens.length) nota('ALTA', 'negocio', 'planos com mesma ordem — temAcesso fica ambíguo');
// upgrade nunca pode ser negativo
for (const a of Object.values(PLANOS)) for (const b of Object.values(PLANOS)) {
  if (b.ordem > a.ordem && b.preco <= a.preco) {
    nota('ALTA', 'negocio', `upgrade de ${a.nome} para ${b.nome} custa ${b.preco - a.preco} — plano melhor não é mais caro`);
  }
}
// todo módulo tem plano válido e ao menos uma aula
for (const m of CURRICULO) {
  if (!PLANOS[m.plano]) nota('ALTA', 'negocio', `módulo ${m.id} com plano inválido`);
  if (!m.aulas.length) nota('ALTA', 'dados', `módulo ${m.id} sem aulas`);
  for (const a of m.aulas) {
    if (!a.m || a.m <= 0) nota('MEDIA', 'dados', `${a.id} sem duração`);
    if (!a.d) nota('BAIXA', 'dados', `${a.id} sem descrição`);
  }
}

/* --------------------------------------- 4. NÚMEROS DA PÁGINA DE VENDAS */
const html = readFileSync(R + 'index.html', 'utf8');
const conta = [...html.matchAll(/data-conta="(\d+)"/g)].map((m) => +m[1]);
const esperado = [STATS.modulos, STATS.aulas, 30, STATS.horas];
conta.forEach((v, i) => {
  if (v !== esperado[i]) nota('ALTA', 'conteudo', `hero anuncia ${v}, currículo tem ${esperado[i]}`);
});
const wl = html.match(/courseWorkload":\s*"PT(\d+)H/);
if (wl && +wl[1] !== STATS.horas) nota('MEDIA', 'conteudo', `schema.org diz PT${wl[1]}H, currículo tem ${STATS.horas}h`);

/* ----------------------------------------- 5. CALCULADORAS: ENTRADA RUIM */
const casos = [
  ['densidadeOriginal(0,0)', () => CALC.densidadeOriginal(0, 0)],
  ['abv(1.0,1.1) invertido', () => CALC.abv(1.0, 1.1)],
  ['atenuacao com og=1', () => CALC.atenuacao(1, 1)],
  ['tosna(0)', () => CALC.tosna(0)],
  ['backsweetening negativo', () => CALC.backsweetening(20, 1.02, 0.99)],
  ['fichaTecnica volume 0', () => CALC.fichaTecnica({ litros: 0, melKg: 6, precoMelKg: 32 })],
  ['fichaTecnica perda 100%', () => CALC.fichaTecnica({ litros: 20, melKg: 6, precoMelKg: 32, perdaPct: 100 })],
  ['precificar perda 100%', () => CALC.precificar({ custoUnitario: 20, perdaPct: 100 })],
  ['pontoEquilibrio lucro negativo', () => CALC.pontoEquilibrio(2500, -5)],
];
for (const [nome, fn] of casos) {
  try {
    const r = fn();
    const v = typeof r === 'object' ? JSON.stringify(r) : r;
    if (v === undefined || /null|NaN|Infinity/.test(String(v))) {
      nota('MEDIA', 'calc', `${nome} devolve ${String(v).slice(0, 90)}`);
    }
  } catch (e) {
    nota('ALTA', 'calc', `${nome} lança exceção: ${e.message}`);
  }
}

/* ------------------------------------------------- 6. SEGREDOS NO REPO */
const arquivos = ['assets/js/config.js', 'api/wrangler.toml', 'api/worker.js'];
for (const f of arquivos) {
  const t = readFileSync(R + f, 'utf8');
  for (const [re, o] of [
    [/APP_USR-[\w-]{20,}/, 'token de produção do Mercado Pago'],
    [/TEST-\d{10,}/, 'token de teste do Mercado Pago'],
    [/re_[A-Za-z0-9]{20,}/, 'chave da Resend'],
    [/sk_live_[A-Za-z0-9]{20,}/, 'chave Stripe'],
  ]) if (re.test(t)) nota('ALTA', 'segredo', `${f} parece conter ${o}`);
}

/* -------------------------------------------------- 7. HTML / A11Y BÁSICO */
for (const [arq, t] of [['index.html', html], ['curso/index.html', readFileSync(R + 'curso/index.html', 'utf8')], ['obrigado.html', readFileSync(R + 'obrigado.html', 'utf8')]]) {
  const imgs = [...t.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const semAlt = imgs.filter((i) => !/\balt=/.test(i));
  if (semAlt.length) nota('MEDIA', 'a11y', `${arq}: ${semAlt.length} <img> sem alt`);
  const btns = [...t.matchAll(/<button\b[^>]*>\s*<svg/g)];
  if (btns.length) {
    const semLabel = [...t.matchAll(/<button\b(?![^>]*aria-label)[^>]*>\s*<svg/g)];
    if (semLabel.length) nota('BAIXA', 'a11y', `${arq}: ${semLabel.length} botão só com ícone e sem aria-label`);
  }
  if (!/lang="pt-BR"/.test(t)) nota('MEDIA', 'a11y', `${arq}: sem lang no <html>`);
}

/* ------------------------------------------------------------- RELATÓRIO */
const ordem = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
achados.sort((a, b) => ordem[a.grav] - ordem[b.grav] || a.area.localeCompare(b.area));
if (!achados.length) console.log('nenhum achado');
for (const a of achados) console.log(`[${a.grav}] ${a.area.padEnd(9)} ${a.msg}`);
const altas = achados.filter((a) => a.grav === 'ALTA').length;
console.log(`\n${achados.length} achados — ALTA:${altas} MEDIA:${achados.filter(a=>a.grav==='MEDIA').length} BAIXA:${achados.filter(a=>a.grav==='BAIXA').length}`);
process.exit(altas ? 1 : 0);
