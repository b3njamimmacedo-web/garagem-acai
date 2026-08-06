/* =============================================================================
   ÁREA DE MEMBROS — A Ordem do Hidromel
============================================================================= */

import { CURRICULO, BONUS, PLANOS, temAcesso, ordemPlano } from './curriculo.js';
import { CONFIG, MODO_DEMO } from './config.js';
import * as API from './api.js';
import * as CALC from './calculadoras.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let ALUNO = null;
let PROGRESSO = {};      // { [idAula]: timestamp }
const TODAS_AULAS = CURRICULO.flatMap((m) => m.aulas.map((a) => ({ ...a, modulo: m })));
const AULA_POR_ID = new Map(TODAS_AULAS.map((a) => [a.id, a]));

/* --------------------------------------------------------------- AVISOS */
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => t.classList.remove('on'), ms);
}

function aviso(html, tipo = 'erro') {
  $('#entradaAviso').innerHTML =
    `<div class="entrada-${tipo === 'erro' ? 'erro' : 'ok'}">${html}</div>`;
}

/* ------------------------------------------------------------- PROGRESSO */
const chaveProgresso = () => 'hdr_prog_' + (ALUNO?.email || 'anon');

function carregarProgresso() {
  try { PROGRESSO = JSON.parse(localStorage.getItem(chaveProgresso()) || '{}'); }
  catch { PROGRESSO = {}; }
}
function salvarProgresso() {
  localStorage.setItem(chaveProgresso(), JSON.stringify(PROGRESSO));
}

/** Só conta as aulas que o plano do aluno realmente libera — mostrar 40% para
 *  quem já viu tudo que comprou seria desmotivar sem motivo. */
function aulasDoPlano() {
  return TODAS_AULAS.filter((a) => temAcesso(ALUNO.plano, a.modulo.plano));
}

function estatisticas() {
  const disp = aulasDoPlano();
  const feitas = disp.filter((a) => PROGRESSO[a.id]).length;
  return {
    total: disp.length,
    feitas,
    pct: disp.length ? Math.round((feitas / disp.length) * 100) : 0,
  };
}

/** Próxima aula não concluída, na ordem do currículo. */
function proximaAula() {
  return aulasDoPlano().find((a) => !PROGRESSO[a.id]) || aulasDoPlano()[0];
}

/* ---------------------------------------------------------------- PLAYER */

/** Monta o embed conforme o provedor. Cada plataforma tem sua URL própria —
 *  centralizar aqui deixa a troca de provedor num único ponto. */
function embedVideo(v, titulo) {
  if (!v || !v.id) return null;
  const prov = v.p || CONFIG.VIDEO_PROVEDOR_PADRAO;
  const lib = CONFIG.VIDEO_BIBLIOTECA;
  const src = {
    yt:    `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1`,
    vimeo: `https://player.vimeo.com/video/${v.id}?dnt=1`,
    panda: `https://player-vz-${lib}.tv.pandavideo.com.br/embed/?v=${v.id}`,
    bunny: `https://iframe.mediadelivery.net/embed/${lib}/${v.id}`,
  }[prov];
  if (!src) return null;
  return `<iframe src="${src}" title="${titulo}" loading="lazy"
    allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
    allowfullscreen referrerpolicy="strict-origin"></iframe>`;
}

function player(aula) {
  const emb = embedVideo(aula.v, aula.t);
  const agua = `<div class="player-agua">${ALUNO.email} · ${ALUNO.codigo}</div>`;
  if (emb) return `<div class="player">${emb}${agua}</div>`;
  return `<div class="player">
    <div class="player-vazio">
      <div class="caixa">
        <b>Aula em produção</b>
        <span>O vídeo desta aula ainda não foi publicado.
          Assim que sair, ele aparece aqui automaticamente — você recebe aviso por e-mail.</span>
      </div>
    </div>${agua}
  </div>`;
}

/* ------------------------------------------------------------------ NAV */
function pintarLateral() {
  const alvo = $('#navModulos');
  alvo.innerHTML = CURRICULO.map((m) => {
    const liberado = temAcesso(ALUNO.plano, m.plano);
    const feitas = m.aulas.filter((a) => PROGRESSO[a.id]).length;
    const completo = liberado && feitas === m.aulas.length;
    const cls = ['mod-nav', completo ? 'completo' : '', liberado ? '' : 'bloqueado'].join(' ');

    const aulas = m.aulas.map((a) => `
      <button class="aula-nav ${PROGRESSO[a.id] ? 'feita' : ''} ${liberado ? '' : 'bloqueada'}"
              data-ir="#/${m.id}/${a.id}" ${liberado ? '' : 'disabled'}>
        <span class="marca"></span>
        <span style="flex:1">${a.t}</span>
        <span class="dur">${a.m}min</span>
      </button>`).join('');

    return `<div class="${cls}" data-mod="${m.id}">
      <button data-abrir="${m.id}">
        <span class="mod-nav-n">${liberado ? String(m.n).padStart(2, '0') : '🔒'}</span>
        <span class="mod-nav-txt">
          <b>${m.titulo}</b>
          <span>${liberado ? `${feitas}/${m.aulas.length} aulas` : PLANOS[m.plano].nome + ' ou superior'}</span>
        </span>
        <span class="mod-nav-seta">▾</span>
      </button>
      <div class="aulas-nav">${aulas}</div>
    </div>`;
  }).join('');

  const { pct, feitas, total } = estatisticas();
  $('#pctProgresso').textContent = pct + '%';
  $('#barraProgresso').style.width = pct + '%';
  $('#txtProgresso').textContent = `${feitas} de ${total} aulas concluídas`;
}

/* -------------------------------------------------------------- PÁGINAS */

function pgPainel() {
  const prox = proximaAula();
  const { pct, feitas, total } = estatisticas();
  const capa = (n) => `../assets/img/modulo-${String(n).padStart(2, '0')}.svg`;

  const cards = CURRICULO.map((m) => {
    const lib = temAcesso(ALUNO.plano, m.plano);
    const f = m.aulas.filter((a) => PROGRESSO[a.id]).length;
    return `<button class="card-mod ${lib ? '' : 'bloqueado'}"
              data-ir="${lib ? `#/${m.id}/${m.aulas[0].id}` : '#/conta'}">
      <img src="${capa(m.n)}" alt="" loading="lazy">
      <div class="corpo">
        <h3>${m.titulo}</h3>
        <div class="meta">${lib ? `${f}/${m.aulas.length} aulas` : `🔒 Plano ${PLANOS[m.plano].nome}`}</div>
        ${lib ? `<div class="barra"><i style="width:${(f / m.aulas.length) * 100}%"></i></div>` : ''}
      </div>
    </button>`;
  }).join('');

  return `
    <div class="painel-cab">
      <h1>Bem-vindo de volta, ${ALUNO.nome.split(' ')[0]}</h1>
      <p class="lead">${pct === 0
        ? 'Sua primeira aula está logo abaixo. Comece por ela.'
        : `Você já concluiu ${feitas} de ${total} aulas — ${pct}% do caminho.`}</p>
    </div>

    ${prox ? `<div class="retomar">
      <img src="${capa(prox.modulo.n)}" alt="">
      <div class="txt">
        <div class="rot">${pct === 0 ? 'Comece por aqui' : 'Continue de onde parou'}</div>
        <h3>${prox.t}</h3>
        <p>Módulo ${String(prox.modulo.n).padStart(2, '0')} · ${prox.modulo.titulo} · ${prox.m} min</p>
      </div>
      <button class="btn btn-ouro" data-ir="#/${prox.modulo.id}/${prox.id}">Assistir</button>
    </div>` : ''}

    <h2 style="font-size:1.4rem;margin-bottom:1.1rem">Todos os módulos</h2>
    <div class="grade-mod">${cards}</div>`;
}

/** "Etapas que você já viu" — o coração da montagem modular do curso.
 *  Em vez de repetir sanitização, mosto e trasfega em toda receita, a aula
 *  aponta para onde cada etapa foi ensinada e mostra só o que muda. */
function blocoBase(aula) {
  if (!aula.base?.length && !aula.novo) return '';

  const etapas = (aula.base || [])
    .map((id) => AULA_POR_ID.get(id))
    .filter(Boolean)
    .map((b) => {
      const feita = !!PROGRESSO[b.id];
      return `<button class="etapa-base ${feita ? 'feita' : ''}"
                data-ir="#/${b.modulo.id}/${b.id}">
        <span class="marca"></span>
        <span class="txt"><b>${b.t}</b>
        <span>Módulo ${String(b.modulo.n).padStart(2, '0')} · ${b.m} min</span></span>
        <span class="rever">rever ↗</span>
      </button>`;
    }).join('');

  const naoVistas = (aula.base || []).filter((id) => !PROGRESSO[id]).length;

  return `
  <div class="base-caixa">
    ${aula.novo ? `<div class="base-novo">
      <span class="rot">O que muda nesta receita</span>
      <p>${aula.novo}</p>
    </div>` : ''}
    ${etapas ? `
      <div class="base-rot">
        Etapas em comum, já ensinadas
        ${naoVistas ? `<em>— ${naoVistas} que você ainda não viu</em>` : '<em>— todas concluídas ✓</em>'}
      </div>
      <p class="base-exp">Esta aula não repete estas etapas. O processo é idêntico
        ao que você já aprendeu — clique para rever qualquer uma.</p>
      <div class="base-lista">${etapas}</div>` : ''}
  </div>`;
}

function pgAula(modId, aulaId) {
  const m = CURRICULO.find((x) => x.id === modId);
  if (!m) return pgPainel();
  const idx = m.aulas.findIndex((a) => a.id === aulaId);
  const aula = m.aulas[idx];
  if (!aula) return pgPainel();

  if (!temAcesso(ALUNO.plano, m.plano)) {
    return `<div class="bloqueio">
      <img src="../assets/img/bonus-ordem.svg" alt="">
      <h2>Este módulo faz parte do plano ${PLANOS[m.plano].nome}</h2>
      <p>Você está no plano <strong>${PLANOS[ALUNO.plano].nome}</strong>.
         O módulo <strong>${m.titulo}</strong> abre a partir do
         ${PLANOS[m.plano].nome} — e você paga apenas a diferença.</p>
      <button class="btn btn-ouro" data-upgrade="${m.plano}">
        Liberar por ${API.brl(PLANOS[m.plano].preco - PLANOS[ALUNO.plano].preco)}
      </button>
    </div>`;
  }

  const feito = !!PROGRESSO[aula.id];
  const anterior = idx > 0 ? m.aulas[idx - 1] : null;
  const seguinte = idx < m.aulas.length - 1 ? m.aulas[idx + 1] : null;
  const proxMod = !seguinte ? CURRICULO[CURRICULO.indexOf(m) + 1] : null;

  return `
    ${player(aula)}
    <div class="aula-cab">
      <div class="trilha">Módulo ${String(m.n).padStart(2, '0')} · ${m.titulo} · Aula ${idx + 1} de ${m.aulas.length}</div>
      <h1>${aula.t}</h1>
      <p class="desc">${aula.d}</p>
    </div>

    <div class="aula-acoes">
      <button class="btn-feito ${feito ? 'feito' : ''}" data-feito="${aula.id}">
        ${feito ? '✓ Aula concluída' : 'Marcar como concluída'}
      </button>
      <div class="nav-aula">
        <button ${anterior ? `data-ir="#/${m.id}/${anterior.id}"` : 'disabled'}>← Anterior</button>
        <button ${seguinte ? `data-ir="#/${m.id}/${seguinte.id}"`
                 : proxMod && temAcesso(ALUNO.plano, proxMod.plano) ? `data-ir="#/${proxMod.id}/${proxMod.aulas[0].id}"`
                 : 'disabled'}>Próxima →</button>
      </div>
    </div>

    ${blocoBase(aula)}

    ${aula.pdf ? `<h3 style="font-size:1.05rem;margin-bottom:.3rem">Material desta aula</h3>
      <a class="anexo" href="../material/${aula.pdf}" download>
        <img src="../assets/img/bonus-pergaminho.svg" alt="">
        <span><b>${aula.pdf.replace(/[-_]/g, ' ').replace('.pdf', '')}</b>
        <span>PDF · para baixar e imprimir</span></span>
        <span class="baixar">Baixar ↓</span>
      </a>` : ''}

    <p class="mod-epig" style="margin-top:2rem">${m.epigrafe}</p>`;
}

function pgCalculadoras() {
  return `
  <div class="painel-cab">
    <h1>Calculadoras da Ordem</h1>
    <p class="lead">As contas que decidem o lote e o preço. Tudo roda no seu navegador —
      nada é enviado para servidor nenhum.</p>
  </div>

  <details class="calc" open>
    <summary>1 · Mosto, densidade e teor alcoólico</summary>
    <div class="calc-corpo">
      <div class="calc-grade">
        <div><label>Mel (kg)</label><input type="number" step="0.1" value="1.5" data-c="m1-mel"></div>
        <div><label>Volume final (L)</label><input type="number" step="0.5" value="5" data-c="m1-vol"></div>
        <div><label>Densidade final (FG)</label><input type="number" step="0.001" value="1.010" data-c="m1-fg"></div>
      </div>
      <div class="calc-saida" id="m1-out"></div>
      <p class="calc-nota">O ABV usa a correção de Hall/Cutaia acima de 8%: a fórmula
        linear simples superestima o álcool em mostos densos, que é justamente o caso
        do hidromel.</p>
    </div>
  </details>

  <details class="calc">
    <summary>2 · Quanto mel para o ABV que eu quero</summary>
    <div class="calc-corpo">
      <div class="calc-grade">
        <div><label>Volume final (L)</label><input type="number" step="0.5" value="20" data-c="m2-vol"></div>
        <div><label>ABV alvo (%)</label><input type="number" step="0.5" value="12" data-c="m2-abv"></div>
        <div><label>FG esperada</label><input type="number" step="0.001" value="1.005" data-c="m2-fg"></div>
        <div><label>Preço do mel (R$/kg)</label><input type="number" step="0.5" value="32" data-c="m2-preco"></div>
      </div>
      <div class="calc-saida" id="m2-out"></div>
    </div>
  </details>

  <details class="calc">
    <summary>3 · Nutriente escalonado (TOSNA)</summary>
    <div class="calc-corpo">
      <div class="calc-grade">
        <div><label>Volume do mosto (L)</label><input type="number" step="0.5" value="20" data-c="m3-vol"></div>
        <div><label>Demanda da cepa</label>
          <select data-c="m3-dem">
            <option value="baixa">Baixa (71B, D47)</option>
            <option value="media" selected>Média (K1-V1116, BM-4X4)</option>
            <option value="alta">Alta (EC-1118, RC-212)</option>
          </select></div>
      </div>
      <div class="calc-saida" id="m3-out"></div>
      <div id="m3-crono"></div>
      <p class="calc-nota">Protocolo TOSNA 3.0 com Fermaid-O. Nutriente é a causa nº 1
        de cheiro de enxofre: mel é pobre em nitrogênio e a levedura estressada produz H₂S.</p>
    </div>
  </details>

  <details class="calc">
    <summary>4 · Adoçar depois sem estourar garrafa</summary>
    <div class="calc-corpo">
      <div class="calc-grade">
        <div><label>Volume (L)</label><input type="number" step="0.5" value="20" data-c="m4-vol"></div>
        <div><label>FG atual</label><input type="number" step="0.001" value="0.998" data-c="m4-fg"></div>
        <div><label>FG desejada</label><input type="number" step="0.001" value="1.020" data-c="m4-alvo"></div>
        <div><label>pH do hidromel</label><input type="number" step="0.1" value="3.5" data-c="m4-ph"></div>
      </div>
      <div class="calc-saida" id="m4-out"></div>
      <div class="calc-alerta">
        <strong>Ordem obrigatória:</strong> estabilize primeiro (sorbato + metabissulfito),
        espere 24 h, só então adoce. Adoçar antes de estabilizar refermenta na garrafa —
        e garrafa de vidro sob pressão é estilhaço.
      </div>
      <p class="calc-nota">A dose de metabissulfito varia com o pH porque só a fração
        <em>molecular</em> do SO₂ protege, e ela despenca conforme o pH sobe. Por isso a
        mesma dose “de receita” funciona num lote e falha em outro.</p>
    </div>
  </details>

  <details class="calc">
    <summary>5 · Ficha técnica e preço de venda</summary>
    <div class="calc-corpo">
      <h4 style="font-size:.9rem;color:var(--ouro);margin-bottom:.7rem">Custos do lote</h4>
      <div class="calc-grade">
        <div><label>Volume (L)</label><input type="number" step="1" value="20" data-c="m5-vol"></div>
        <div><label>Mel (kg)</label><input type="number" step="0.1" value="6" data-c="m5-mel"></div>
        <div><label>R$/kg do mel</label><input type="number" step="0.5" value="32" data-c="m5-pmel"></div>
        <div><label>Levedura + nutriente (R$)</label><input type="number" step="1" value="28" data-c="m5-lev"></div>
        <div><label>Outros insumos (R$)</label><input type="number" step="1" value="15" data-c="m5-out"></div>
      </div>
      <h4 style="font-size:.9rem;color:var(--ouro);margin:1.2rem 0 .7rem">Embalagem (por garrafa)</h4>
      <div class="calc-grade">
        <div><label>Garrafa (R$)</label><input type="number" step="0.1" value="4.5" data-c="m5-gar"></div>
        <div><label>Rolha (R$)</label><input type="number" step="0.1" value="1.2" data-c="m5-rol"></div>
        <div><label>Rótulo (R$)</label><input type="number" step="0.1" value="1.8" data-c="m5-rot"></div>
        <div><label>Cápsula (R$)</label><input type="number" step="0.1" value="0.6" data-c="m5-cap"></div>
      </div>
      <h4 style="font-size:.9rem;color:var(--ouro);margin:1.2rem 0 .7rem">Precificação</h4>
      <div class="calc-grade">
        <div><label>Imposto (%)</label><input type="number" step="0.5" value="12" data-c="m5-imp"></div>
        <div><label>Comissão do canal (%)</label><input type="number" step="0.5" value="0" data-c="m5-com"></div>
        <div><label>Margem desejada (%)</label><input type="number" step="1" value="35" data-c="m5-mar"></div>
        <div><label>Perda (%)</label><input type="number" step="1" value="8" data-c="m5-per"></div>
      </div>
      <div class="calc-saida" id="m5-out"></div>
      <div id="m5-msg"></div>
      <p class="calc-nota">Usa markup <em>divisor</em>: imposto, comissão e margem incidem
        sobre o preço, não sobre o custo. Multiplicar o custo por 3 é o erro que faz o
        produtor descobrir no fim do ano que trabalhou de graça.</p>
    </div>
  </details>

  <details class="calc">
    <summary>6 · Ponto de equilíbrio do mês</summary>
    <div class="calc-corpo">
      <div class="calc-grade">
        <div><label>Custo fixo mensal (R$)</label><input type="number" step="50" value="2500" data-c="m6-fixo"></div>
        <div><label>Lucro por garrafa (R$)</label><input type="number" step="1" value="38" data-c="m6-lucro"></div>
      </div>
      <div class="calc-saida" id="m6-out"></div>
      <p class="calc-nota">Aluguel, contador, responsável técnico, taxas e energia entram
        no custo fixo. Use o lucro por garrafa que saiu da calculadora 5.</p>
    </div>
  </details>`;
}

function pgMaterial() {
  const itens = BONUS.filter((b) => b.arquivo);
  const liberados = itens.filter((b) => temAcesso(ALUNO.plano, b.plano));
  const bloqueados = itens.filter((b) => !temAcesso(ALUNO.plano, b.plano));

  const linha = (b, lib) => `
    <a class="anexo" ${lib ? `href="../material/${b.arquivo}" download` : 'style="opacity:.5;cursor:not-allowed"'}>
      <img src="../assets/img/bonus-${b.icone}.svg" alt="">
      <span style="flex:1"><b>${b.nome}</b><span>${b.desc}</span></span>
      <span class="baixar">${lib ? 'Baixar ↓' : '🔒 ' + PLANOS[b.plano].nome}</span>
    </a>`;

  const daAula = CURRICULO
    .filter((m) => temAcesso(ALUNO.plano, m.plano))
    .flatMap((m) => m.aulas.filter((a) => a.pdf).map((a) => ({ ...a, m })));

  return `
  <div class="painel-cab">
    <h1>Material para baixar</h1>
    <p class="lead">Os PDFs são seus para sempre. Baixe e guarde — não dependem do acesso.</p>
  </div>

  <h3 style="font-size:1.1rem;margin-bottom:.7rem">Bônus</h3>
  ${liberados.map((b) => linha(b, true)).join('')}
  ${bloqueados.length ? `<h3 style="font-size:1.1rem;margin:1.8rem 0 .7rem">
    Disponível em planos superiores</h3>${bloqueados.map((b) => linha(b, false)).join('')}` : ''}

  ${daAula.length ? `<h3 style="font-size:1.1rem;margin:1.8rem 0 .7rem">Material das aulas</h3>
    ${daAula.map((a) => `<a class="anexo" href="../material/${a.pdf}" download>
      <img src="../assets/img/bonus-ficha.svg" alt="">
      <span style="flex:1"><b>${a.t}</b><span>Módulo ${String(a.m.n).padStart(2, '0')} · ${a.pdf}</span></span>
      <span class="baixar">Baixar ↓</span></a>`).join('')}` : ''}

  <div class="calc-nota" style="margin-top:2rem">
    Material sendo produzido? Os PDFs que ainda não foram publicados abrem uma página de
    aviso. Você recebe e-mail quando cada um sai.
  </div>`;
}

function pgConta() {
  const p = PLANOS[ALUNO.plano];
  const data = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const superiores = Object.values(PLANOS).filter((x) => x.ordem > p.ordem);

  return `
  <div class="painel-cab">
    <h1>Meu acesso</h1>
    <p class="lead">Estes dados são únicos e pessoais. Não compartilhe.</p>
  </div>

  <div class="dados">
    <div class="dado"><span>Nome</span><b>${ALUNO.nome}</b></div>
    <div class="dado"><span>E-mail</span><b>${ALUNO.email}</b></div>
    <div class="dado"><span>Plano</span><b>${p.nome}</b></div>
    <div class="dado">
      <span>Código de acesso</span>
      <b><code>${ALUNO.codigo}</code>
      <button id="copiarCodigo" style="margin-left:.5rem;color:var(--ouro-claro);font-size:.8rem">copiar</button></b>
    </div>
    <div class="dado"><span>Compra</span><b>${data(ALUNO.compradoEm)}</b></div>
    <div class="dado"><span>Acesso até</span><b>${data(ALUNO.expiraEm)}</b></div>
    <div class="dado"><span>Dispositivos</span><b>${ALUNO.dispositivos ?? 1} de ${p.dispositivos}</b></div>
  </div>

  <div class="calc-alerta" style="margin-top:1.5rem">
    Seu código é rastreável e vinculado ao seu e-mail. Compartilhar dá acesso a
    outra pessoa <strong>e derruba o seu</strong> quando o limite de dispositivos estoura.
  </div>

  ${superiores.length ? `
  <h2 style="font-size:1.3rem;margin:2.5rem 0 1rem">Subir de plano</h2>
  <div class="grade-mod">
    ${superiores.map((s) => `<div class="card-mod" style="padding:1.3rem">
      <h3>${s.nome}</h3>
      <p class="meta">${s.chamada}</p>
      <p style="font-family:var(--display);font-size:1.6rem;color:var(--ouro-claro);margin:.6rem 0">
        + ${API.brl(s.preco - p.preco)}</p>
      <button class="btn btn-linha btn-bloco" data-upgrade="${s.id}">Quero o ${s.nome}</button>
    </div>`).join('')}
  </div>` : '<p class="calc-ok" style="margin-top:1.5rem">Você está no plano mais completo. Tudo liberado.</p>'}

  <h2 style="font-size:1.3rem;margin:2.5rem 0 1rem">Suporte</h2>
  <p>Escreva para <a href="mailto:${CONFIG.EMAIL_SUPORTE}">${CONFIG.EMAIL_SUPORTE}</a>
     informando o seu código de acesso.</p>`;
}

/* ---------------------------------------------------------------- ROTAS */
function rotear() {
  const h = location.hash.replace(/^#\/?/, '');
  const partes = h.split('/').filter(Boolean);
  const pagina = $('#pagina');

  $$('.atalho').forEach((a) => a.classList.toggle('on', a.dataset.ir === '#/' + partes[0]));

  if (!partes.length || partes[0] === 'painel') pagina.innerHTML = pgPainel();
  else if (partes[0] === 'calculadoras') { pagina.innerHTML = pgCalculadoras(); ligarCalculadoras(); }
  else if (partes[0] === 'material') pagina.innerHTML = pgMaterial();
  else if (partes[0] === 'conta') pagina.innerHTML = pgConta();
  else if (partes[0].startsWith('m')) pagina.innerHTML = pgAula(partes[0], partes[1]);
  else pagina.innerHTML = pgPainel();

  // marca a aula ativa e abre o módulo dela na lateral
  $$('.aula-nav').forEach((b) => b.classList.toggle('on', b.dataset.ir === location.hash));
  if (partes[0]?.startsWith('m')) {
    $$('.mod-nav').forEach((d) => d.classList.toggle('aberto', d.dataset.mod === partes[0]));
  }

  pagina.scrollIntoView({ block: 'start', behavior: 'instant' });
  $('#lateral').classList.remove('on');
  $('#veu').classList.remove('on');
}

/* -------------------------------------------------------------- EVENTOS */
document.addEventListener('click', (e) => {
  const ir = e.target.closest('[data-ir]');
  if (ir && !ir.disabled) { location.hash = ir.dataset.ir; return; }

  const abrir = e.target.closest('[data-abrir]');
  if (abrir) {
    const d = abrir.closest('.mod-nav');
    if (d.classList.contains('bloqueado')) { location.hash = '#/conta'; return; }
    d.classList.toggle('aberto');
    return;
  }

  const feito = e.target.closest('[data-feito]');
  if (feito) {
    const id = feito.dataset.feito;
    if (PROGRESSO[id]) delete PROGRESSO[id];
    else { PROGRESSO[id] = Date.now(); toast('Aula concluída ✓'); }
    salvarProgresso();
    pintarLateral();
    rotear();
    return;
  }

  const up = e.target.closest('[data-upgrade]');
  if (up) {
    const alvo = up.dataset.upgrade;
    const dif = PLANOS[alvo].preco - PLANOS[ALUNO.plano].preco;
    if (MODO_DEMO) { toast('No modo demonstração o upgrade não é processado.'); return; }
    location.href = `../?upgrade=${alvo}&de=${ALUNO.plano}&email=${encodeURIComponent(ALUNO.email)}&dif=${dif}#planos`;
    return;
  }

  if (e.target.closest('#copiarCodigo')) {
    navigator.clipboard?.writeText(ALUNO.codigo)
      .then(() => toast('Código copiado'))
      .catch(() => toast('Não consegui copiar — selecione e copie manualmente'));
    return;
  }

  if (e.target.closest('#abrirMenu')) {
    $('#lateral').classList.add('on'); $('#veu').classList.add('on'); return;
  }
  if (e.target.closest('#veu')) {
    $('#lateral').classList.remove('on'); $('#veu').classList.remove('on'); return;
  }

  if (e.target.closest('#btnSair')) {
    API.sairSessao();
    location.hash = '';
    location.reload();
  }
});

window.addEventListener('hashchange', rotear);

/* ------------------------------------------------------ CALCULADORAS: UI */
function ligarCalculadoras() {
  const v = (k) => {
    const el = $(`[data-c="${k}"]`);
    return el ? (el.type === 'number' ? parseFloat(el.value) || 0 : el.value) : 0;
  };
  const box = (rot, val) => `<div class="box"><span>${rot}</span><b>${val}</b></div>`;

  function recalcular() {
    // 1 — mosto
    if ($('#m1-out')) {
      const og = CALC.densidadeOriginal(v('m1-mel'), v('m1-vol'));
      const fg = v('m1-fg');
      const a = CALC.abv(og, fg);
      const d = CALC.doceOuSeco(fg);
      $('#m1-out').innerHTML =
        box('Densidade inicial', og.toFixed(3)) +
        box('Teor alcoólico', a.toFixed(1) + '%') +
        box('Atenuação', CALC.atenuacao(og, fg).toFixed(0) + '%') +
        `<div class="box"><span>Doçura</span><b style="color:${d.cor}">${d.nome}</b></div>`;
    }

    // 2 — mel para o ABV alvo
    if ($('#m2-out')) {
      const fg = v('m2-fg');
      const alvo = v('m2-abv');
      // inverte a fórmula linear e refina por busca — a de Hall não tem inversa simples
      let og = fg + alvo / 131.25;
      for (let i = 0; i < 40; i++) {
        const err = CALC.abv(og, fg) - alvo;
        if (Math.abs(err) < 0.01) break;
        og -= err / 131.25 / 2;
      }
      const mel = CALC.melParaOG(og, v('m2-vol'));
      $('#m2-out').innerHTML =
        box('Densidade alvo', og.toFixed(3)) +
        box('Mel necessário', mel.toFixed(2) + ' kg') +
        box('Custo do mel', API.brl(mel * v('m2-preco'))) +
        box('Garrafas 750ml', Math.floor(v('m2-vol') * 1000 / 750 * 0.92));
    }

    // 3 — TOSNA
    if ($('#m3-out')) {
      const t = CALC.tosna(v('m3-vol'), v('m3-dem'));
      $('#m3-out').innerHTML =
        box('Fermaid-O total', t.total + ' g') +
        box('Por adição', t.dose + ' g') +
        box('Go-Ferm', t.goFerm + ' g') +
        box('Adições', '4');
      $('#m3-crono').innerHTML =
        '<div class="calc-ok"><strong>Cronograma:</strong><br>' +
        t.cronograma.map((c, i) => `${i + 1}. ${c.quando} — <strong>${c.g} g</strong>`).join('<br>') +
        '</div>';
    }

    // 4 — backsweetening
    if ($('#m4-out')) {
      const b = CALC.backsweetening(v('m4-vol'), v('m4-fg'), v('m4-alvo'), v('m4-ph'));
      $('#m4-out').innerHTML =
        box('Mel a adicionar', b.melKg.toFixed(2) + ' kg') +
        box('Sorbato de potássio', b.sorbatoG + ' g') +
        box('Metabissulfito', b.metaG + ' g') +
        box('SO₂ livre alvo', b.so2Livre + ' ppm');
    }

    // 5 — ficha técnica + preço
    if ($('#m5-out')) {
      const f = CALC.fichaTecnica({
        litros: v('m5-vol'), melKg: v('m5-mel'), precoMelKg: v('m5-pmel'),
        levedura: v('m5-lev'), outros: v('m5-out'),
        garrafaUn: v('m5-gar'), rolhaUn: v('m5-rol'),
        rotuloUn: v('m5-rot'), capsulaUn: v('m5-cap'),
        perdaPct: v('m5-per'),
      });
      const p = CALC.precificar({
        custoUnitario: f.custoUnitario, impostoPct: v('m5-imp'),
        comissaoPct: v('m5-com'), margemPct: v('m5-mar'), perdaPct: 0,
      });
      if (p.erro) {
        $('#m5-out').innerHTML = box('Garrafas', f.garrafas) + box('Custo/garrafa', API.brl(f.custoUnitario));
        $('#m5-msg').innerHTML = `<div class="calc-alerta">${p.erro}</div>`;
      } else {
        $('#m5-out').innerHTML =
          box('Garrafas do lote', f.garrafas) +
          box('Custo por garrafa', API.brl(f.custoUnitario)) +
          box('Preço de venda', API.brl(p.preco)) +
          box('Lucro por garrafa', API.brl(p.lucro)) +
          box('Margem real', p.margemReal + '%') +
          box('Markup', p.markup + 'x');
        $('#m5-msg').innerHTML =
          `<div class="calc-ok">Lote inteiro: receita de <strong>${API.brl(p.preco * f.garrafas)}</strong>,
           lucro de <strong>${API.brl(p.lucro * f.garrafas)}</strong>.</div>`;
      }
    }

    // 6 — ponto de equilíbrio
    if ($('#m6-out')) {
      const r = CALC.pontoEquilibrio(v('m6-fixo'), v('m6-lucro'));
      $('#m6-out').innerHTML = r.erro
        ? `<div class="box"><span>Atenção</span><b style="font-size:.9rem">${r.erro}</b></div>`
        : box('Garrafas por mês', r.unidades) + box('Equivale a', r.litros + ' L');
    }
  }

  $$('[data-c]').forEach((el) => el.addEventListener('input', recalcular));
  recalcular();
}

/* ---------------------------------------------------------------- ENTRADA */
(function ligarEntrada() {
  const form = $('#formEntrada');
  const inputCod = $('#enCodigo');

  inputCod.addEventListener('input', (e) => {
    // formata para MEAD-XXXX-XXXX-XXXX conforme digita
    const bruto = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    e.target.value = (bruto.match(/.{1,4}/g) || []).slice(0, 4).join('-');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#enEmail').value.trim();
    const codigo = inputCod.value.trim();
    const btn = $('#enEnviar');

    $('#enEmail').closest('.campo').classList.toggle('invalido', !API.emailValido(email));
    $('#enCodigo').closest('.campo').classList.toggle('invalido', codigo.length < 8);
    if (!API.emailValido(email) || codigo.length < 8) return;

    btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      const r = await API.entrarComCodigo(email, codigo);
      API.guardarSessao(r.token);
      iniciar(r.aluno);
    } catch (err) {
      aviso(err.message);
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
})();

/* ------------------------------------------------------------------ BOOT */
function iniciar(aluno) {
  ALUNO = aluno;
  carregarProgresso();

  $('#telaEntrada').classList.add('oculto');
  $('#app').classList.remove('oculto');

  $('#alunoNome').textContent = aluno.nome;
  $('#alunoPlano').textContent = PLANOS[aluno.plano]?.nome || '—';
  $('#avatar').textContent = aluno.nome.trim()[0]?.toUpperCase() || '?';

  pintarLateral();
  if (!location.hash || location.hash.startsWith('#/entrar')) location.hash = '#/painel';
  else rotear();
  rotear();
}

(async function boot() {
  // 1) link individual: #/entrar?t=<token>  ou  #/entrar?c=<codigo>
  const h = location.hash;
  if (h.includes('?')) {
    const q = new URLSearchParams(h.split('?')[1]);
    const t = q.get('t');
    const c = q.get('c');
    if (t) {
      try {
        const r = await API.entrarComToken(t);
        API.guardarSessao(r.token);
        history.replaceState(null, '', location.pathname + '#/painel');
        return iniciar(r.aluno);
      } catch (e) { aviso('Este link de acesso expirou ou é inválido. Entre com e-mail e código.'); }
    }
    if (c) {
      $('#enCodigo').value = c.toUpperCase();
      aviso('Confirme seu e-mail para entrar.', 'ok');
    }
    history.replaceState(null, '', location.pathname + location.hash.split('?')[0]);
  }

  // 2) sessão já existente
  const s = await API.sessaoAtual();
  if (s) return iniciar(s.aluno);

  // 3) tela de entrada
  if (MODO_DEMO) {
    aviso(`<strong>Modo demonstração.</strong> Entre com qualquer e-mail e o código
      <code>MEAD-DEMO-2026-REIS</code> para navegar pela área de membros completa.`, 'ok');
    $('#enCodigo').value = 'MEAD-DEMO-2026-REIS';
  }
})();
