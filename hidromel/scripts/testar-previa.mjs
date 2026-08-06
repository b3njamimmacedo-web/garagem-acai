#!/usr/bin/env node
/* =============================================================================
   TESTE DA PRÉVIA EM ARQUIVO ÚNICO

   Empacotar quebra em silêncio. Cada verificação aqui corresponde a um defeito
   que aconteceu de verdade ao montar este empacotador:

     · `String.replace` com texto de substituição interpreta $$ como $ — o
       bundle continha `const $$ = ...` e virava `const $ = ...`, derrubando a
       página inteira com "Identifier '$' has already been declared";
     · caminhos de imagem montados pelo JS em tempo de execução escapavam da
       troca feita no HTML, deixando 22 imagens 404;
     · o recorte do fragmento por regex cortava no `<body>` mencionado dentro
       de um comentário do CSS, e não na tag real.

   Sem dependência externa: roda em qualquer lugar, inclusive no CI.

   Uso:  node scripts/gerar-previa.mjs && node scripts/testar-previa.mjs
============================================================================= */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIA = join(RAIZ, 'previa');

let ok = 0, falhou = 0;
const t = (nome, cond, detalhe = '') => {
  console.log((cond ? '✓ ' : '✗ ') + nome + (detalhe && !cond ? '  → ' + detalhe : ''));
  cond ? ok++ : falhou++;
};

if (!existsSync(join(PREVIA, 'index.html'))) {
  console.error('previa/index.html não existe. Rode: node scripts/gerar-previa.mjs');
  process.exit(1);
}

const doc = readFileSync(join(PREVIA, 'index.html'), 'utf8');
const frag = readFileSync(join(PREVIA, 'artifact.html'), 'utf8');

/* ---------------------------------------------------- autossuficiência */
console.log('\n— autossuficiência —');
for (const [nome, txt] of [['documento', doc], ['fragmento', frag]]) {
  // Só o que o navegador REALMENTE busca. `<link rel="canonical">` e
  // `<a href>` apontam para fora de propósito e não geram requisição.
  const externos = [
    ...[...txt.matchAll(/\bsrc="(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
    ...[...txt.matchAll(/<link[^>]*rel="(?:stylesheet|preload|icon|apple-touch-icon|manifest)"[^>]*href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]),
    ...[...txt.matchAll(/<link[^>]*href="(https?:\/\/[^"]+)"[^>]*rel="(?:stylesheet|preload|icon|apple-touch-icon|manifest)"/g)].map((m) => m[1]),
    ...[...txt.matchAll(/url\(['"]?(https?:\/\/[^'")]+)/g)].map((m) => m[1]),
  ];
  t(`${nome}: nenhum recurso externo carregado`, externos.length === 0, externos.slice(0, 2).join(', '));

  t(`${nome}: nenhum caminho relativo sobrou`,
    !/(?:src|href)="\.\/assets\//.test(txt) && !/url\(['"]?\.\.\/img\//.test(txt));

  t(`${nome}: fontes embutidas`, (txt.match(/@font-face/g) || []).length >= 4,
    (txt.match(/@font-face/g) || []).length + ' faces');
}

/* -------------------------------------------------------------- imagens */
console.log('\n— imagens —');
{
  const mapa = doc.match(/const IMG_PREVIA = (\{[\s\S]*?\});/);
  t('mapa de imagens presente no bundle', !!mapa);
  if (mapa) {
    const chaves = new Set(Object.keys(JSON.parse(mapa[1])));
    const noDisco = readdirSync(join(RAIZ, 'assets/img')).filter((f) => f.endsWith('.svg'));
    t('mapa cobre todos os SVGs do projeto', chaves.size === noDisco.length,
      `${chaves.size} no mapa, ${noDisco.length} no disco`);

    // toda chamada imgPrevia(`nome`) tem que resolver — literais e templates
    const chamadas = [...doc.matchAll(/imgPrevia\(`([^`]*)`\)/g)].map((m) => m[1]);
    t('há chamadas dinâmicas a imgPrevia', chamadas.length > 0, chamadas.length + '');
    const naoResolve = chamadas.filter((c) => {
      if (!c.includes('${')) return !chaves.has(c);
      // template: confere se algum nome do mapa casa com o padrão
      const re = new RegExp('^' + c.replace(/\$\{[^}]*\}/g, '.+').replace(/[.]/g, '\\.').replace(/\\\.\+/g, '.+') + '$');
      return ![...chaves].some((k) => re.test(k));
    });
    t('toda chamada a imgPrevia resolve para um SVG do mapa',
      naoResolve.length === 0, naoResolve.join(', '));

    const semData = [...chaves].filter((k) => !JSON.parse(mapa[1])[k].startsWith('data:image/svg'));
    t('todo valor do mapa é data URI', semData.length === 0, semData.slice(0, 2).join(', '));
  }
}

/* ------------------------------------------------------- JS do bundle */
console.log('\n— javascript —');
{
  const m = doc.match(/<script type="module">([\s\S]*?)<\/script>/);
  t('bundle presente', !!m);
  if (m) {
    const js = m[1];
    t('nenhum import/export sobrou', !/^\s*(import|export)\s/m.test(js));

    // o bug do $$: duas declarações do mesmo identificador
    const decls = [...js.matchAll(/^const (\$\$?)\s/gm)].map((x) => x[1]);
    t('$ e $$ declarados uma vez cada',
      decls.length === new Set(decls).size && decls.includes('$') && decls.includes('$$'),
      decls.join(', '));

    // sintaxe: compila sem executar
    let erroSintaxe = null;
    try { new Function(js); } catch (e) { erroSintaxe = e.message; }
    t('bundle compila', !erroSintaxe, erroSintaxe || '');

    t('namespace API reconstruído', /const API = \{[^}]+\}/.test(js));
    t('CONFIG e CURRICULO no bundle', js.includes('const CONFIG') && js.includes('const CURRICULO'));
  }
}

/* ------------------------------------------------------------ fragmento */
console.log('\n— fragmento para hospedeiro externo —');
{
  const semComentarios = frag
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const wrappers = semComentarios.match(/<\/?(?:html|body|head)\b[^>]*>/g) || [];
  t('sem <html>/<body>/<head> (o hospedeiro monta o esqueleto)',
    wrappers.length === 0, wrappers.join(', '));
  t('tem <title>', /<title>[^<]+<\/title>/.test(frag));
  t('tem <style>', frag.includes('<style>'));
  t('tem o conteúdo da página', frag.includes('id="topo"') && frag.includes('id="planos"'));
  t('tem o aviso de prévia', frag.includes('previa-aviso'));
}

console.log(`\n${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
