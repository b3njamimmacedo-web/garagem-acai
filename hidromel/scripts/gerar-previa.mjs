#!/usr/bin/env node
/* =============================================================================
   PRÉVIA EM ARQUIVO ÚNICO

   Empacota a página de vendas — CSS, JS, SVGs e fontes — num único .html
   autossuficiente, sem nenhuma requisição externa.

   Para que serve: mandar o protótipo para alguém ver sem depender de deploy,
   e publicar em ambiente com política de segurança que bloqueia domínio de
   terceiro (que é o caso dos Artifacts do Claude).

   NÃO substitui o deploy real: aqui a área de membros, o checkout e os PDFs
   ficam de fora — são páginas separadas. É uma vitrine, não o produto.

   Uso:  node scripts/gerar-previa.mjs  →  previa/index.html
============================================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(RAIZ, 'previa');
mkdirSync(OUT, { recursive: true });

const ler = (p) => readFileSync(join(RAIZ, p), 'utf8');

/* ========================================================== FONTES INLINE

   O Google Fonts é bloqueado por CSP em ambiente de artifact, e link de fonte
   que falha cai em silêncio no fallback do sistema — o texto aparece, mas a
   identidade some. Então as faces vão embutidas como data URI.

   As escolhas espelham os papéis do site original:
     Cinzel (inscricional)      -> Crimson Pro Bold + Arsenal Small Caps
     Cormorant Garamond (itál.) -> Crimson Pro Italic
     Inter (corpo)              -> Instrument Sans
=========================================================================== */
// Fontes versionadas em assets/fontes/ (SIL OFL 1.1, ver LEIA-ME.md de lá).
// Apontar para um caminho de fora do repositório fazia a prévia sair sem
// tipografia em qualquer máquina que não fosse a de origem — inclusive no CI,
// silenciosamente, porque o gerador só avisava e seguia.
const DIR_FONTES = join(RAIZ, 'assets/fontes');
const FONTES = [
  { arq: 'CrimsonPro-Bold.ttf',       familia: 'Reis Display', peso: 700, estilo: 'normal' },
  { arq: 'CrimsonPro-Italic.ttf',     familia: 'Reis Serif',   peso: 400, estilo: 'italic' },
  { arq: 'ArsenalSC-Regular.ttf',     familia: 'Reis Caps',    peso: 400, estilo: 'normal' },
  { arq: 'InstrumentSans-Regular.ttf',familia: 'Reis Corpo',   peso: 400, estilo: 'normal' },
  { arq: 'InstrumentSans-Bold.ttf',   familia: 'Reis Corpo',   peso: 700, estilo: 'normal' },
];

function cssFontes() {
  // Falha ruidosa em vez de degradar em silêncio: prévia sem as faces é uma
  // prévia que não representa o produto, e passar batido é pior que quebrar.
  const faltando = FONTES.map((f) => f.arq).filter((a) => !existsSync(join(DIR_FONTES, a)));
  if (faltando.length) {
    throw new Error(
      `Fontes ausentes em assets/fontes/: ${faltando.join(', ')}\n` +
      'Elas são versionadas no repositório — verifique se o clone está completo.');
  }
  return FONTES.map((f) => {
    const b64 = readFileSync(join(DIR_FONTES, f.arq)).toString('base64');
    return `@font-face{font-family:'${f.familia}';font-style:${f.estilo};font-weight:${f.peso};` +
           `font-display:swap;src:url(data:font/ttf;base64,${b64}) format('truetype')}`;
  }).join('\n');
}

/* ================================================================== SVGs */

const svgCache = new Map();
function svgDataUri(nome) {
  if (svgCache.has(nome)) return svgCache.get(nome);
  const caminho = join(RAIZ, 'assets/img', nome);
  if (!existsSync(caminho)) return '';
  // base64 em vez de encodeURIComponent: os SVGs têm aspas, # e % em profusão,
  // e escapar tudo isso à mão é onde a prévia quebra sem avisar.
  const uri = 'data:image/svg+xml;base64,' + readFileSync(caminho).toString('base64');
  svgCache.set(nome, uri);
  return uri;
}

/* ============================================================ JS BUNDLE

   Os módulos usam import/export. Aqui viram um script só, na ordem de
   dependência, com os import/export removidos. `import * as API` precisa do
   objeto de namespace recriado à mão.
=========================================================================== */
function bundleJs() {
  const ordem = ['config.js', 'curriculo.js', 'api.js', 'site.js'];
  const partes = [];
  let nomesApi = [];

  // As capas de módulo e os ícones de bônus são montados pelo JS em tempo de
  // execução (`./assets/img/modulo-${n}.svg`), então a troca feita no HTML não
  // os alcança — sem isto, 22 imagens quebram em silêncio na prévia.
  // O mapa abaixo dá ao bundle acesso a todos os SVGs por nome.
  const todos = readdirSync(join(RAIZ, 'assets/img')).filter((f) => f.endsWith('.svg'));
  const mapa = Object.fromEntries(todos.map((n) => [n, svgDataUri(n)]));
  partes.push(
    `/* ===== imagens embutidas ===== */\n` +
    `const IMG_PREVIA = ${JSON.stringify(mapa)};\n` +
    `const imgPrevia = (n) => IMG_PREVIA[n] || '';`);

  for (const arq of ordem) {
    let txt = ler('assets/js/' + arq);

    if (arq === 'api.js') {
      nomesApi = [
        ...[...txt.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((m) => m[1]),
        ...[...txt.matchAll(/export\s+const\s+(\w+)/g)].map((m) => m[1]),
      ];
    }

    txt = txt
      .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^export\s+/gm, '')
      // Qualquer caminho de imagem montado em template vira consulta ao mapa.
      // Precisa casar tanto o literal inteiro (`./assets/img/modulo-${n}.svg`)
      // quanto o caminho embutido num template maior
      // (src="./assets/img/bonus-${b.icone}.svg"), que foi o caso que escapou
      // da primeira versão e deixou os 6 ícones de bônus quebrados.
      .replace(/\.\/assets\/img\/((?:\$\{[^}]*\}|[\w.-])+)/g,
        (_, nome) => '${imgPrevia(`' + nome + '`)}');

    partes.push(`/* ===== ${arq} ===== */\n${txt}`);

    if (arq === 'api.js') {
      partes.push(`const API = { ${nomesApi.join(', ')} };`);
    }
  }
  return partes.join('\n\n');
}

/* ================================================================ MONTAGEM */

let html = ler('index.html');

// 1. fontes do Google fora; faces embutidas entram junto com o CSS
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts\.googleapis[^>]*>\s*/g, '');

// 2. CSS inline, com as imagens de fundo viradas data URI
let css = ler('assets/css/site.css')
  .replace(/url\(['"]?\.\.\/img\/([^'")]+)['"]?\)/g, (_, n) => `url('${svgDataUri(n)}')`);
// (os data URI de SVG e fonte usam só o alfabeto base64, sem $ — mas as
//  substituições acima já são funções, então a questão não se coloca)

// as faces novas assumem os papéis das antigas
css = css.replace(
  /--display:[^;]+;/,
  "--display: 'Reis Display', 'Reis Caps', Georgia, serif;")
  .replace(/--serif:\s*[^;]+;/, "--serif: 'Reis Serif', Georgia, serif;")
  .replace(/--corpo:\s*[^;]+;/, "--corpo: 'Reis Corpo', -apple-system, system-ui, sans-serif;");

// versalete de verdade nos rótulos — é para isso que a Arsenal SC entrou
css += `
/* --- ajustes da prévia --- */
.sobrescrito, .mod-cab .rot, .plano-fita, .hero-selo, .base-rot {
  font-family: 'Reis Caps', Georgia, serif;
}
.previa-aviso {
  position: fixed; inset: auto 0 0 0; z-index: 300;
  background: rgba(14,11,8,.96); border-top: 1px solid rgba(212,160,23,.4);
  color: #D9C9A3; font: 400 12.5px/1.55 'Reis Corpo', system-ui, sans-serif;
  padding: .7rem 1.2rem; text-align: center; backdrop-filter: blur(10px);
}
.previa-aviso b { color: #F5C542; font-weight: 700; }
/* a barra de checkout sobe para nao ficar embaixo do aviso */
.checkout-barra { bottom: 46px; }
@media (max-width: 640px) { .checkout-barra { bottom: 62px; } }
`;

// ATENÇÃO: replace() com STRING interpreta $$, $&, $1 e afins como padrões de
// substituição. O bundle contém `const $$ = ...` e viraria `const $ = ...`,
// derrubando a página com "Identifier '$' has already been declared".
// Função de substituição não sofre disso — use sempre aqui.
const estilo = `<style>\n${cssFontes()}\n${css}\n</style>`;
html = html.replace(
  /<link rel="stylesheet" href="\.\/assets\/css\/site\.css">/,
  () => estilo);

// 3. imagens do HTML viram data URI
html = html.replace(/(src|href)="\.\/assets\/img\/([^"]+)"/g,
  (m, attr, nome) => {
    const uri = svgDataUri(nome);
    return uri ? `${attr}="${uri}"` : m;
  });

// 4. o módulo externo vira script inline
const script = `<script type="module">\n${bundleJs()}\n</script>`;
html = html.replace(
  /<script type="module" src="\.\/assets\/js\/site\.js"><\/script>/,
  () => script);

// 5. o aviso de modo demonstração é para desenvolvedor; na prévia a mensagem
//    tem que falar com quem está olhando o protótipo
html = html.replace(
  /'MODO DEMONSTRAÇÃO — sem backend configurado\. O checkout é simulado\. ' \+\s*'Preencha <code>API_URL<\/code> em <code>assets\/js\/config\.js<\/code> para vender de verdade\.';/,
  `'';`);

// 6. rodapé da prévia
html = html.replace('</body>', `
<div class="previa-aviso">
  <b>Prévia estática</b> — página de vendas do Hidromel de Reis.
  A área de membros, o checkout e os PDFs ficam de fora: são páginas separadas,
  que aparecem no deploy completo.
</div>
</body>`);

// 7. os links internos que não existem aqui não podem dar 404 silencioso
html = html.replace(/href="\.\/curso\/"/g, 'href="#planos" title="Disponível no deploy completo"');
html = html.replace(/href="\.\/docs\/legal\/([^"]+)"/g, 'href="#faq" title="Disponível no deploy completo"');

writeFileSync(join(OUT, 'index.html'), html, 'utf8');

/* ------------------------------------------------------ VARIANTE FRAGMENTO

   Alguns hospedeiros de página (os Artifacts do Claude, por exemplo) montam o
   esqueleto <!doctype><html><head><body> por conta própria e esperam receber
   só o conteúdo. Mandar um documento completo produz HTML aninhado.
   Esta variante entrega style + conteúdo + script, sem o invólucro.
=========================================================================== */
// Recorte por POSIÇÃO, não por regex: o CSS tem um comentário que menciona
// "<body>", e um /<body[^>]*>/ não-guloso corta ali, no meio da folha de
// estilo, produzindo um fragmento quebrado.
const fimCabeca = html.indexOf('</head>');
const cabeca = html.slice(html.indexOf('<head'), fimCabeca);
const iniCorpo = html.indexOf('>', html.indexOf('<body', fimCabeca)) + 1;
const fimCorpo = html.lastIndexOf('</body>');
const corpo = html.slice(iniCorpo, fimCorpo);
const estilos = [...cabeca.matchAll(/<style>[\s\S]*?<\/style>/g)].join('\n');
const titulo = (cabeca.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'Hidromel de Reis';

const fragmento =
  `<title>${titulo}</title>\n` +
  `<meta name="description" content="Página de vendas do curso Hidromel de Reis — prévia estática.">\n` +
  estilos + '\n' + corpo;

writeFileSync(join(OUT, 'artifact.html'), fragmento, 'utf8');

const kb = (n) => (Buffer.byteLength(n) / 1024).toFixed(0);
console.log(`✓ prévia gerada`);
console.log(`  previa/index.html     ${kb(html)} kB  — documento completo, para hospedar`);
console.log(`  previa/artifact.html  ${kb(fragmento)} kB  — fragmento, para hospedeiro que monta o esqueleto`);
console.log(`  ${svgCache.size} SVGs e ${FONTES.length} fontes embutidos · zero requisições externas`);
