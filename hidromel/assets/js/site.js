/* =============================================================================
   PÁGINA DE VENDAS — comportamento
============================================================================= */

import { CURRICULO, BONUS, PLANOS, STATS } from './curriculo.js';
import { CONFIG, MODO_DEMO } from './config.js';
import * as API from './api.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** Parcelamento realista: adquirentes não aceitam parcela abaixo de ~R$ 5.
 *  Anunciar "12x de R$ 3,92" e o checkout oferecer 9x destrói a confiança
 *  exatamente no momento do pagamento. */
const PARCELA_MINIMA = 5;
function parcelamento(total, max = 12) {
  const n = Math.max(1, Math.min(max, Math.floor(total / PARCELA_MINIMA)));
  return { n, valor: Math.ceil((total / n) * 100) / 100 };
}

/* ============================================================ RASTREAMENTO */
(function carregarPixels() {
  if (CONFIG.META_PIXEL) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CONFIG.META_PIXEL);
    window.fbq('track', 'PageView');
  }
  if (CONFIG.GA4_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.GA4_ID);
  }
})();

/* =========================================================== PORTA DE IDADE */
(function portaIdade() {
  const porta = $('#portaIdade');
  if (!porta) return;
  if (localStorage.getItem('hdr_idade') === 'ok') return;

  porta.classList.add('on');
  document.body.style.overflow = 'hidden';

  porta.addEventListener('click', (e) => {
    const b = e.target.closest('[data-idade]');
    if (!b) return;
    if (b.dataset.idade === 'nao') {
      porta.innerHTML = `<div class="modal-caixa centro">
        <h2 style="font-size:1.4rem">Acesso restrito</h2>
        <p class="mini" style="margin-top:.9rem">
          Este conteúdo trata de bebida alcoólica e só pode ser acessado por maiores de 18 anos.
        </p></div>`;
      return;
    }
    localStorage.setItem('hdr_idade', 'ok');
    porta.classList.remove('on');
    document.body.style.overflow = '';
  });
})();

/* =================================================================== REVEAL
   Medição direta com getBoundingClientRect em vez de IntersectionObserver.
   O observer coalesce notificações sob rolagem rápida e deixa blocos inteiros
   invisíveis — testado e reproduzido. Aqui a checagem é síncrona no evento de
   rolagem (limitada a um requestAnimationFrame), então não existe entrega
   perdida. A lista só encolhe, e o listener se remove sozinho no fim. */
const revelar = (() => {
  document.documentElement.classList.add('js-rv');
  let pendentes = [];
  let agendado = false;

  function checar() {
    agendado = false;
    const alturaJanela = window.innerHeight || document.documentElement.clientHeight;
    const restantes = [];
    for (const el of pendentes) {
      // basta o topo ter subido acima da dobra (com 60px de folga). Cobre tanto
      // "entrou na tela" quanto "já passou batido" — este segundo caso é o que
      // deixava blocos invisíveis quando a rolagem era rápida.
      if (el.getBoundingClientRect().top < alturaJanela - 60) el.classList.add('on');
      else restantes.push(el);
    }
    pendentes = restantes;
    if (!pendentes.length) {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
    }
  }

  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(checar);
  }

  function registrar(elementos) {
    const novos = [...elementos].filter((e) => !e.classList.contains('on'));
    if (!novos.length) return;
    pendentes = [...new Set([...pendentes, ...novos])];
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    agendar();
  }

  registrar($$('.rv'));
  // rede de segurança: se algo escapar (layout tardio, fonte que muda altura),
  // em 5s tudo que já está no fluxo aparece de qualquer jeito.
  setTimeout(() => { pendentes.forEach((e) => e.classList.add('on')); pendentes = []; }, 5000);

  return registrar;
})();

/* ================================================================ CONTADORES */
(function contadores() {
  const alvos = $$('[data-conta]');
  if (!alvos.length || !('IntersectionObserver' in window)) {
    alvos.forEach((e) => (e.textContent = e.dataset.conta));
    return;
  }
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const fim = +e.target.dataset.conta;
      const dur = 1300;
      const t0 = performance.now();
      const passo = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        // easeOutExpo: sobe rápido e freia — dá a sensação de contagem "real"
        const f = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        e.target.textContent = Math.round(fim * f);
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }, { threshold: 0.5 });
  alvos.forEach((e) => obs.observe(e));
})();

/* ====================================================================== NAV */
(function nav() {
  const n = $('#nav');
  const barra = $('#barraCheckout');

  // texto da barra derivado dos preços reais, para não divergir dos cards
  const txt = $('#barraTxt');
  if (txt) {
    const p = PLANOS.mestre;
    const { n: qtd, valor } = parcelamento(p.preco);
    txt.innerHTML =
      `<b>Hidromel de Reis · ${p.nome}</b>` +
      `<span>${qtd}x de ${API.brl(valor)} ou ${API.brl(Math.round(p.preco * 0.9))} no Pix · garantia de 15 dias</span>`;
  }

  const hero = $('#topo');
  const aoRolar = () => {
    const y = window.scrollY;
    n.classList.toggle('solida', y > 60);
    // a barra fixa só aparece depois que o hero saiu de cena — antes disso ela
    // compete com o CTA principal em vez de reforçá-lo
    if (barra && hero) barra.classList.toggle('on', y > hero.offsetHeight * 0.9);
  };
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });
})();

/* ================================================================== MÓDULOS */
(function renderModulos() {
  const alvo = $('#listaModulos');
  if (!alvo) return;

  alvo.innerHTML = CURRICULO.map((m) => {
    const min = m.aulas.reduce((s, a) => s + a.m, 0);
    const capa = `./assets/img/modulo-${String(m.n).padStart(2, '0')}.svg`;
    const tagPlano = m.plano !== 'iniciado'
      ? `<span class="tag tag-plano">${PLANOS[m.plano].nome}+</span>` : '';

    const aulas = m.aulas.map((a, i) => `
      <div class="aula">
        <span class="aula-n">${String(i + 1).padStart(2, '0')}</span>
        <span class="aula-t">${a.t}${a.free ? '<span class="tag tag-free">Grátis</span>' : ''}${a.lab ? '<span class="tag tag-lab">Prática</span>' : ''}${a.pdf ? '<span class="tag tag-pdf">PDF</span>' : ''}
          <span class="aula-d">${a.d}</span>
        </span>
        <span class="aula-m">${a.m} min</span>
      </div>`).join('');

    return `
    <details class="mod"${m.destaque ? ' data-destaque="1"' : ''}>
      <summary>
        <img class="mod-capa" src="${capa}" alt="" loading="lazy" width="96" height="60">
        <div class="mod-cab">
          <div class="rot">Módulo ${String(m.n).padStart(2, '0')} ${tagPlano}</div>
          <h3>${m.titulo}</h3>
          <div class="sub">${m.subtitulo}</div>
        </div>
        <div class="mod-meta">
          <span class="qtd">${m.aulas.length} aulas · ${Math.round(min / 60 * 10) / 10}h</span>
          <span class="mod-seta" aria-hidden="true">▾</span>
        </div>
      </summary>
      <div class="mod-corpo">
        <p class="mod-epig">${m.epigrafe}</p>
        <div class="aulas">${aulas}</div>
      </div>
    </details>`;
  }).join('');

  // Abre o primeiro módulo de destaque para o visitante ver o nível de detalhe
  // sem precisar clicar. Fechado por padrão, quase ninguém abre.
  const primeiro = alvo.querySelector('[data-destaque]');
  if (primeiro) primeiro.open = true;
})();

/* ==================================================================== BÔNUS */
(function renderBonus() {
  const alvo = $('#listaBonus');
  if (!alvo) return;
  alvo.innerHTML = BONUS.map((b, i) => `
    <div class="cartao bonus-item rv ${i % 2 ? 'rv-d1' : ''}">
      <img src="./assets/img/bonus-${b.icone}.svg" alt="" width="62" height="62" loading="lazy">
      <div>
        <h3>${b.nome}</h3>
        <p>${b.desc}</p>
        <div class="bonus-val">${b.tipo} · valor <s>${API.brl(b.valor)}</s> — incluso</div>
      </div>
    </div>`).join('');

  const v = $('#valorBonus');
  if (v) v.textContent = API.brl(STATS.valorBonus);
  revelar($$('.rv', alvo));
})();

/* =================================================================== PLANOS */
(function renderPlanos() {
  const alvo = $('#listaPlanos');
  if (!alvo) return;

  // Derivado do currículo, nunca escrito à mão: número em página de vendas que
  // não bate com o produto entregue é publicidade enganosa por descuido.
  const doPlano = (p) => CURRICULO.filter((m) => m.plano === p);
  const contar = (mods) => ({
    aulas: mods.reduce((s, m) => s + m.aulas.length, 0),
    horas: Math.round(mods.reduce((s, m) => s + m.aulas.reduce((a, x) => a + x.m, 0), 0) / 60),
  });
  const iniciado = contar(doPlano('iniciado'));

  const itens = {
    iniciado: [
      ['Módulos 0 a 9 — produção completa', 1],
      [`${iniciado.aulas} aulas, ~${iniciado.horas} horas`, 1],
      ['Grimório do Hidromel (30 receitas)', 1],
      ['Fichas de fermentação imprimíveis', 1],
      ['Calculadoras da Ordem', 1],
      ['Acesso em 2 dispositivos', 1],
      ['Módulo Premium, Legalização, Custos, Marca e Vendas', 0],
      ['Pack de rótulos editáveis', 0],
      ['Comunidade e mentoria', 0],
    ],
    mestre: [
      ['Tudo do Iniciado', 1],
      ['<b>Módulo X</b> — 10 receitas premium inusitadas', 1],
      ['<b>Módulo XI</b> — legalização: MAPA, CNAE, rótulo, laudo', 1],
      ['<b>Módulo XII</b> — custos e precificação', 1],
      ['<b>Módulo XIII</b> — marca e storytelling', 1],
      ['<b>Módulo XIV</b> — vendas em 6 canais', 1],
      ['Manual de Legalização e Precificação (PDF)', 1],
      ['Pack de 30 rótulos editáveis', 1],
      ['Acesso em 3 dispositivos', 1],
      ['Comunidade e mentoria ao vivo', 0],
    ],
    real: [
      ['Tudo do Mestre', 1],
      ['<b>Módulo XV</b> — escala e operação comercial', 1],
      ['Comunidade fechada da Ordem', 1],
      ['Encontro mensal ao vivo — análise de lote', 1],
      ['Revisão do seu rótulo e da sua precificação', 1],
      ['Certificado de conclusão', 1],
      ['Acesso em 5 dispositivos', 1],
      ['Prioridade no suporte', 1],
    ],
  };

  alvo.innerHTML = Object.values(PLANOS).map((p) => {
    const top = p.id === 'mestre';
    const { n: nParcelas, valor: parcela } = parcelamento(p.preco);
    const pix = Math.round(p.preco * 0.9);
    return `
    <div class="plano ${top ? 'plano-top' : ''} rv ${top ? 'rv-d1' : ''}">
      ${top ? '<span class="plano-fita">Mais escolhido</span>' : ''}
      <div class="plano-nome">${p.nome}</div>
      <div class="plano-chamada">${p.chamada}</div>
      <div class="plano-de">de <s>${API.brl(p.precoDe)}</s> por</div>
      <div class="plano-preco">
        <span class="cifrao">R$</span>
        <span class="valor">${String(p.preco)}</span>
      </div>
      <div class="plano-parcela">ou <b>${nParcelas}x de ${API.brl(parcela)}</b> no cartão</div>
      <span class="plano-pix">Pix à vista: ${API.brl(pix)} — 10% off</span>
      <ul>${itens[p.id].map(([t, ok]) => `<li class="${ok ? '' : 'nao'}">${t}</li>`).join('')}</ul>
      <button class="btn ${top ? 'btn-ouro' : 'btn-linha'} btn-bloco" data-checkout="${p.id}">
        Quero o ${p.nome}
      </button>
    </div>`;
  }).join('');

  revelar($$('.rv', alvo));
})();

/* ================================================================ ESCASSEZ */
(function escassez() {
  const cx = $('#contador');
  const fim = new Date(CONFIG.OFERTA_FIM).getTime();

  if (cx) {
    const campos = {
      d: cx.querySelector('[data-t="d"]'), h: cx.querySelector('[data-t="h"]'),
      m: cx.querySelector('[data-t="m"]'), s: cx.querySelector('[data-t="s"]'),
    };
    const tick = () => {
      const resta = fim - Date.now();
      if (!Number.isFinite(fim) || resta <= 0) {
        // Oferta encerrada: some. NÃO reinicia — ver comentário em config.js.
        cx.closest('div').style.display = 'none';
        clearInterval(id);
        return;
      }
      const s = Math.floor(resta / 1000);
      campos.d.textContent = String(Math.floor(s / 86400)).padStart(2, '0');
      campos.h.textContent = String(Math.floor(s / 3600) % 24).padStart(2, '0');
      campos.m.textContent = String(Math.floor(s / 60) % 60).padStart(2, '0');
      campos.s.textContent = String(s % 60).padStart(2, '0');
    };
    tick();
    var id = setInterval(tick, 1000);
  }

  const barra = $('#vagasBarra');
  const txt = $('#vagasTxt');
  if (barra && txt) {
    const vendidas = CONFIG.VAGAS_TOTAL - CONFIG.VAGAS_RESTANTES;
    const pct = Math.round((vendidas / CONFIG.VAGAS_TOTAL) * 100);
    txt.textContent = `${CONFIG.VAGAS_RESTANTES} de ${CONFIG.VAGAS_TOTAL} vagas restantes`;
    setTimeout(() => { barra.style.width = pct + '%'; }, 500);
  }
})();

/* ================================================================ CHECKOUT */
(function checkout() {
  const modal   = $('#modalCheckout');
  const form    = $('#formCheckout');
  const resumo  = $('#ckResumo');
  const nomeEl  = $('#ckPlanoNome');
  const bumpEl  = $('#ckBump');
  const enviar  = $('#ckEnviar');
  const result  = $('#ckResultado');
  if (!modal) return;

  let plano = 'mestre';
  let metodo = 'pix';

  const precoFinal = () => {
    const base = PLANOS[plano].preco;
    const comDesconto = metodo === 'pix' ? Math.round(base * 0.9) : base;
    return { base, comDesconto, bump: bumpEl.checked ? CONFIG.ORDER_BUMP.preco : 0 };
  };

  function pintarResumo() {
    const { base, comDesconto, bump } = precoFinal();
    const total = comDesconto + bump;
    const linhas = [`<div><span>Plano ${PLANOS[plano].nome}</span><span>${API.brl(base)}</span></div>`];
    if (metodo === 'pix') {
      linhas.push(`<div style="color:#5FCFA6"><span>Desconto Pix (10%)</span><span>− ${API.brl(base - comDesconto)}</span></div>`);
    }
    if (bump) {
      linhas.push(`<div><span>${CONFIG.ORDER_BUMP.nome}</span><span>${API.brl(bump)}</span></div>`);
    }
    linhas.push(`<div class="total"><span>Total</span><span>${API.brl(total)}</span></div>`);
    if (metodo === 'cartao') {
      const { n, valor } = parcelamento(total);
      linhas.push(`<div class="mini"><span>ou ${n}x de</span><span>${API.brl(valor)}</span></div>`);
    }
    resumo.innerHTML = linhas.join('');
  }

  function abrir(qual) {
    plano = PLANOS[qual] ? qual : 'mestre';
    nomeEl.textContent = PLANOS[plano].nome;
    result.classList.add('oculto');
    result.innerHTML = '';
    form.classList.remove('oculto');
    pintarResumo();
    modal.classList.add('on');
    document.body.style.overflow = 'hidden';
    $('#ckNome').focus();
    API.evento('InitiateCheckout', {
      content_name: 'Hidromel de Reis · ' + PLANOS[plano].nome,
      value: precoFinal().comDesconto, currency: 'BRL',
    });
  }

  function fechar() {
    modal.classList.remove('on');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const abre = e.target.closest('[data-checkout]');
    if (abre) { e.preventDefault(); abrir(abre.dataset.checkout); return; }
    if (e.target.closest('[data-fechar]') || e.target === modal) fechar();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('on')) fechar();
  });

  $$('.pagamento-abas button').forEach((b) => {
    b.addEventListener('click', () => {
      $$('.pagamento-abas button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      metodo = b.dataset.pgto;
      pintarResumo();
    });
  });
  bumpEl.addEventListener('change', () => {
    pintarResumo();
    if (bumpEl.checked) API.evento('AddToCart', { content_name: CONFIG.ORDER_BUMP.nome, value: CONFIG.ORDER_BUMP.preco, currency: 'BRL' });
  });

  // máscaras
  $('#ckCpf').addEventListener('input', (e) => { e.target.value = API.mascaraCpf(e.target.value); });
  $('#ckTel').addEventListener('input', (e) => { e.target.value = API.mascaraTel(e.target.value); });

  const marcar = (id, ok) => $(id).closest('.campo').classList.toggle('invalido', !ok);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome  = $('#ckNome').value.trim();
    const email = $('#ckEmail').value.trim();
    const cpf   = $('#ckCpf').value;
    const tel   = $('#ckTel').value;

    const okNome  = nome.split(/\s+/).filter(Boolean).length >= 2;
    const okEmail = API.emailValido(email);
    const okCpf   = API.cpfValido(cpf);
    marcar('#ckNome', okNome); marcar('#ckEmail', okEmail); marcar('#ckCpf', okCpf);
    if (!okNome || !okEmail || !okCpf) {
      $('.campo.invalido input')?.focus();
      return;
    }

    enviar.disabled = true;
    const rotulo = enviar.textContent;
    enviar.textContent = 'Gerando seu pedido…';

    try {
      const r = await API.criarPedido({
        plano, nome, email, cpf, telefone: tel,
        bump: bumpEl.checked, metodo,
      });

      if (r.tipo === 'redirect') { window.location.href = r.url; return; }

      // Pix: leva para a página de obrigado, que faz o acompanhamento
      sessionStorage.setItem('hdr_pix', JSON.stringify({ ...r, plano, email, nome }));
      window.location.href = `./obrigado.html?p=${encodeURIComponent(r.pedidoId)}`;
    } catch (erro) {
      enviar.disabled = false;
      enviar.textContent = rotulo;
      result.classList.remove('oculto');
      result.innerHTML = `<div class="dor-item" style="margin-top:1rem">
        <div><strong>Não consegui gerar o pedido.</strong><br>
        <span class="mini">${erro.message}</span><br>
        <span class="mini">Se o problema continuar, fale com
        <a href="mailto:${CONFIG.EMAIL_SUPORTE}">${CONFIG.EMAIL_SUPORTE}</a>.</span></div></div>`;
    }
  });
})();

/* ================================================================= RODAPÉ */
$('#ano').textContent = String(new Date().getFullYear());

/* =========================================== AVISO DE MODO DEMONSTRAÇÃO */
if (MODO_DEMO) {
  const aviso = document.createElement('div');
  aviso.style.cssText =
    'position:fixed;left:0;right:0;top:0;z-index:200;background:#6B1F2A;color:#F3E9D2;' +
    'font:600 12px/1.5 system-ui,sans-serif;text-align:center;padding:5px 10px;letter-spacing:.04em';
  aviso.innerHTML =
    'MODO DEMONSTRAÇÃO — sem backend configurado. O checkout é simulado. ' +
    'Preencha <code>API_URL</code> em <code>assets/js/config.js</code> para vender de verdade.';
  document.body.appendChild(aviso);
  document.documentElement.style.scrollPaddingTop = '30px';
}
