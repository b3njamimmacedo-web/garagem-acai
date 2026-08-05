/* =============================================================================
   HIDROMEL DE REIS — BACKEND (Cloudflare Worker)

   Arquivo único, sem dependências. Faz:
     · cobrança Pix e cartão no Mercado Pago
     · webhook de pagamento aprovado, com validação de assinatura
     · geração de credencial ÚNICA por comprador
     · envio do e-mail de acesso
     · autenticação do aluno e limite de dispositivos

   Também aceita webhook de Kirvano, Cakto e Hotmart — trocar de plataforma
   é trocar variável de ambiente, não reescrever código.

   Configuração: veja api/README.md
============================================================================= */

/* ============================================================ CONFIGURAÇÃO */

const PLANOS = {
  iniciado: { nome: 'INICIADO', preco: 47,  dispositivos: 2, anos: 3 },
  mestre:   { nome: 'MESTRE',   preco: 197, dispositivos: 3, anos: 3 },
  real:     { nome: 'REAL',     preco: 497, dispositivos: 5, anos: 3 },
};
const BUMP = { id: 'rotulos', nome: 'Pack de 30 Rótulos Editáveis', preco: 27 };
const DESCONTO_PIX = 0.10;
const PIX_EXPIRA_MIN = 30;

/* ================================================================= AJUDA */

const json = (dados, status = 200, extra = {}) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });

const erro = (msg, status = 400, codigo) => json({ erro: msg, codigo }, status);

function cabecalhosCors(env) {
  const origem = env.ORIGEM_PERMITIDA || '*';
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

const enc = new TextEncoder();
const paraHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmac(segredo, mensagem) {
  const chave = await crypto.subtle.importKey(
    'raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return paraHex(await crypto.subtle.sign('HMAC', chave, enc.encode(mensagem)));
}

/** Comparação em tempo constante. `a === b` vaza o tamanho do prefixo correto
 *  pelo tempo de execução e permite forjar assinatura byte a byte. */
function iguaisSeguro(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

const b64url = {
  cod: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
};

/* ---------------------------------------------------------------- TOKEN */

/** Token assinado: <payload base64url>.<hmac>.
 *  O plano viaja dentro e é assinado — o aluno não consegue se promover
 *  editando o localStorage, porque a assinatura quebra. */
async function criarToken(env, dados) {
  const corpo = b64url.cod(JSON.stringify(dados));
  return `${corpo}.${await hmac(env.SEGREDO, corpo)}`;
}

async function lerToken(env, token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) return null;
  if (!iguaisSeguro(await hmac(env.SEGREDO, corpo), assinatura)) return null;
  try {
    const d = JSON.parse(b64url.dec(corpo));
    if (d.exp && Date.now() > d.exp) return null;
    return d;
  } catch { return null; }
}

/* ------------------------------------------------------------ CREDENCIAL */

/** Alfabeto sem I, O, 0 e 1: elimina erro de digitação quando o aluno lê o
 *  código do e-mail e digita no celular. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function gerarCodigoBruto() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]);
  return 'MEAD-' + [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)]
    .map((g) => g.join('')).join('-');
}

/** Gera um código garantidamente inédito no KV. */
async function gerarCodigoUnico(env) {
  for (let i = 0; i < 8; i++) {
    const c = gerarCodigoBruto();
    if (!(await env.ALUNOS.get('codigo:' + c))) return c;
  }
  throw new Error('Não consegui gerar um código único.');
}

const normalizarEmail = (e) => String(e || '').trim().toLowerCase();

/* ------------------------------------------------------------- VALIDAÇÃO */

function cpfValido(cpf) {
  const n = String(cpf || '').replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const dv = (base, peso) => {
    const soma = base.split('').reduce((s, d, i) => s + +d * (peso - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(n.slice(0, 9), 10) === +n[9] && dv(n.slice(0, 10), 11) === +n[10];
}

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(e || '').trim());

function calcularValor(plano, metodo, bump) {
  const base = PLANOS[plano].preco;
  const comDesconto = metodo === 'pix' ? Math.round(base * (1 - DESCONTO_PIX)) : base;
  return comDesconto + (bump ? BUMP.preco : 0);
}

/* ------------------------------------------------- LIMITE DE REQUISIÇÕES */

/** Freio simples por IP. Sem isso, um script cria milhares de cobranças Pix
 *  e o painel do Mercado Pago vira lixo — ou pior, a conta é sinalizada. */
async function limitar(env, chave, maximo, janelaSeg) {
  const k = `rl:${chave}:${Math.floor(Date.now() / (janelaSeg * 1000))}`;
  const atual = +(await env.ALUNOS.get(k) || 0);
  if (atual >= maximo) return false;
  await env.ALUNOS.put(k, String(atual + 1), { expirationTtl: janelaSeg + 60 });
  return true;
}

/* ========================================================== MERCADO PAGO */

async function mpCriarPagamento(env, { plano, nome, email, cpf, telefone, bump, metodo, pedidoId }) {
  const valor = calcularValor(plano, metodo, bump);
  const [primeiro, ...resto] = String(nome).trim().split(/\s+/);

  const descricao = `Hidromel de Reis - ${PLANOS[plano].nome}` + (bump ? ` + ${BUMP.nome}` : '');

  const corpo = {
    transaction_amount: valor,
    description: descricao,
    payment_method_id: 'pix',
    date_of_expiration: new Date(Date.now() + PIX_EXPIRA_MIN * 60000).toISOString(),
    external_reference: pedidoId,
    notification_url: `${env.URL_PUBLICA}/api/webhook/mercadopago`,
    payer: {
      email,
      first_name: primeiro,
      last_name: resto.join(' ') || primeiro,
      identification: { type: 'CPF', number: String(cpf).replace(/\D/g, '') },
    },
    metadata: { plano, bump: !!bump, pedido: pedidoId, telefone: telefone || '' },
  };

  const resp = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      // idempotência: se a rede repetir a chamada, o MP não cria cobrança dupla
      'X-Idempotency-Key': pedidoId,
    },
    body: JSON.stringify(corpo),
  });

  const dados = await resp.json();
  if (!resp.ok) {
    throw new Error(dados?.message || 'Mercado Pago recusou a criação do pagamento.');
  }
  return dados;
}

/** Preferência de Checkout Pro — usada para cartão, onde o MP hospeda o
 *  formulário e assume o PCI. Nunca trafegamos número de cartão. */
async function mpCriarPreferencia(env, { plano, nome, email, bump, pedidoId }) {
  const itens = [{
    title: `Hidromel de Reis - ${PLANOS[plano].nome}`,
    quantity: 1, currency_id: 'BRL', unit_price: PLANOS[plano].preco,
  }];
  if (bump) itens.push({ title: BUMP.nome, quantity: 1, currency_id: 'BRL', unit_price: BUMP.preco });

  const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: itens,
      payer: { email, name: nome },
      external_reference: pedidoId,
      notification_url: `${env.URL_PUBLICA}/api/webhook/mercadopago`,
      statement_descriptor: 'HIDROMELREIS',
      payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 12 },
      back_urls: {
        success: `${env.URL_SITE}/obrigado.html?p=${pedidoId}`,
        pending: `${env.URL_SITE}/obrigado.html?p=${pedidoId}`,
        failure: `${env.URL_SITE}/?erro=pagamento#planos`,
      },
      auto_return: 'approved',
      metadata: { plano, bump: !!bump, pedido: pedidoId },
    }),
  });
  const dados = await resp.json();
  if (!resp.ok) throw new Error(dados?.message || 'Falha ao criar a preferência de pagamento.');
  return dados;
}

/**
 * Valida a assinatura do webhook do Mercado Pago.
 *
 * O MP envia `x-signature: ts=...,v1=...` e `x-request-id`. O manifesto é
 * montado num formato exato — qualquer diferença de espaço ou ordem invalida.
 *
 * Sem essa checagem, QUALQUER pessoa que descubra a URL do webhook consegue
 * liberar acesso de graça mandando um POST. Não é opcional.
 */
async function mpAssinaturaValida(env, req, dataId) {
  if (!env.MP_WEBHOOK_SECRET) return { ok: false, motivo: 'MP_WEBHOOK_SECRET não configurado' };

  const assinatura = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';

  const partes = Object.fromEntries(
    assinatura.split(',').map((p) => p.split('=').map((s) => s.trim()))
  );
  const { ts, v1 } = partes;
  if (!ts || !v1) return { ok: false, motivo: 'cabeçalho x-signature ausente ou malformado' };

  // Rejeita replay antigo: 10 minutos de tolerância.
  const idade = Math.abs(Date.now() - Number(ts) * 1000);
  if (!Number.isFinite(idade) || idade > 10 * 60 * 1000) {
    return { ok: false, motivo: 'timestamp fora da janela aceita' };
  }

  const manifesto = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;
  const esperado = await hmac(env.MP_WEBHOOK_SECRET, manifesto);
  return iguaisSeguro(esperado, v1)
    ? { ok: true }
    : { ok: false, motivo: 'assinatura não confere' };
}

async function mpBuscarPagamento(env, id) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) throw new Error('Não consegui consultar o pagamento no Mercado Pago.');
  return r.json();
}

/* =============================================================== E-MAIL */

function corpoEmail({ nome, codigo, link, plano, bump }) {
  const p = PLANOS[plano];
  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#0E0B08;font-family:Georgia,serif;color:#D9C9A3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0E0B08;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:560px;background:#1F160D;border:1px solid #8A6D1F;border-radius:10px;overflow:hidden">
    <tr><td style="padding:34px 32px 22px;text-align:center;border-bottom:1px solid rgba(212,160,23,.25)">
      <div style="font-size:12px;letter-spacing:5px;color:#D4A017;margin-bottom:10px">HIDROMEL DE REIS</div>
      <h1 style="margin:0;font-size:25px;color:#F3E9D2;font-weight:700">Bem-vindo à Ordem</h1>
    </td></tr>

    <tr><td style="padding:28px 32px;font-size:15px;line-height:1.65">
      <p style="margin:0 0 16px">Olá, <strong style="color:#F3E9D2">${nome}</strong>.</p>
      <p style="margin:0 0 22px">Seu pagamento foi aprovado e o acesso ao plano
        <strong style="color:#F5C542">${p.nome}</strong> está liberado${bump ? `, junto com o <strong>${BUMP.nome}</strong>` : ''}.</p>

      <table role="presentation" width="100%" style="margin:0 0 24px">
        <tr><td align="center">
          <a href="${link}" style="display:inline-block;background:#D4A017;color:#1a1206;
             text-decoration:none;padding:15px 34px;border-radius:5px;font-weight:700;
             font-size:15px;letter-spacing:1.5px">ENTRAR NO CURSO</a>
        </td></tr>
      </table>

      <div style="background:rgba(0,0,0,.4);border:1px solid rgba(212,160,23,.3);border-radius:6px;padding:18px;margin-bottom:22px">
        <div style="font-size:11px;letter-spacing:2px;color:#D4A017;margin-bottom:8px">SEU CÓDIGO DE ACESSO PESSOAL</div>
        <div style="font-family:'Courier New',monospace;font-size:19px;color:#F5C542;letter-spacing:2.5px;font-weight:700">${codigo}</div>
        <div style="font-size:12px;color:#8A7B62;margin-top:10px">
          O botão acima entra direto. Este código serve para acessar de outro
          aparelho — use com o e-mail desta mensagem.
        </div>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#8A7B62">
        Este código é <strong style="color:#D9C9A3">único e rastreável</strong>, vinculado a você.
        Seu plano permite ${p.dispositivos} dispositivos. Compartilhar derruba o seu próprio acesso.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#8A7B62">
        Se o botão não funcionar, copie este endereço:<br>
        <span style="color:#D4A017;word-break:break-all">${link}</span>
      </p>
    </td></tr>

    <tr><td style="padding:20px 32px;border-top:1px solid rgba(212,160,23,.2);font-size:12px;color:#8A7B62;text-align:center">
      Dúvidas? Responda este e-mail.<br>
      <strong style="color:#D9C9A3">Beba com moderação.</strong> Conteúdo para maiores de 18 anos.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

async function enviarEmail(env, { para, assunto, html }) {
  if (!env.RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY ausente — envio pulado para', para);
    return { pulado: true };
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_REMETENTE || 'Hidromel de Reis <acesso@hidromeldereis.com.br>',
      to: [para], subject: assunto, html,
    }),
  });
  if (!r.ok) {
    // Falha de e-mail NÃO pode derrubar a liberação: o acesso já foi gravado e
    // a página de obrigado mostra o código na tela. Registramos e seguimos.
    console.error('[email] falha:', r.status, await r.text());
    return { erro: true };
  }
  return r.json();
}

/* ================================================== LIBERAÇÃO DE ACESSO */

/**
 * O coração do sistema. Idempotente por `pedidoId`: se o webhook chegar duas
 * vezes (e ele chega — o MP reenvia), o aluno NÃO recebe dois códigos.
 */
async function liberarAcesso(env, { pedidoId, email, nome, plano, bump, origem, telefone }) {
  const chavePedido = 'pedido:' + pedidoId;
  const existente = await env.ALUNOS.get(chavePedido, 'json');
  if (existente?.codigo) {
    return { ...existente, jaExistia: true };
  }

  const emailNorm = normalizarEmail(email);

  // Já é aluno? Então isto é upgrade ou recompra: mantém o mesmo código e sobe
  // o plano. Gerar um código novo confundiria quem já guardou o antigo.
  const anterior = await env.ALUNOS.get('aluno:' + emailNorm, 'json');
  const codigo = anterior?.codigo || await gerarCodigoUnico(env);

  const planoFinal =
    anterior && ordem(anterior.plano) > ordem(plano) ? anterior.plano : plano;

  const agora = Date.now();
  const expiraEm = agora + PLANOS[planoFinal].anos * 365 * 864e5;

  const aluno = {
    nome: nome || anterior?.nome || 'Aluno',
    email: emailNorm,
    telefone: telefone || anterior?.telefone || '',
    plano: planoFinal,
    codigo,
    bump: !!bump || !!anterior?.bump,
    compradoEm: anterior?.compradoEm || new Date(agora).toISOString(),
    expiraEm: new Date(expiraEm).toISOString(),
    dispositivosVistos: anterior?.dispositivosVistos || [],
    pedidos: [...(anterior?.pedidos || []), { id: pedidoId, plano, origem, em: new Date(agora).toISOString() }],
  };

  await env.ALUNOS.put('aluno:' + emailNorm, JSON.stringify(aluno));
  await env.ALUNOS.put('codigo:' + codigo, emailNorm);

  const token = await criarToken(env, {
    email: emailNorm, codigo, plano: planoFinal,
    exp: agora + 30 * 864e5,   // link do e-mail vale 30 dias
    t: 'acesso',
  });
  const link = `${env.URL_SITE}/curso/#/entrar?t=${token}`;

  const registro = { codigo, email: emailNorm, plano: planoFinal, link, status: 'aprovado' };
  await env.ALUNOS.put(chavePedido, JSON.stringify(registro));

  await enviarEmail(env, {
    para: emailNorm,
    assunto: `Seu acesso: Hidromel de Reis — ${PLANOS[planoFinal].nome}`,
    html: corpoEmail({ nome: aluno.nome, codigo, link, plano: planoFinal, bump: aluno.bump }),
  });

  return registro;
}

const ordem = (p) => ({ iniciado: 1, mestre: 2, real: 3 }[p] || 0);

/* ================================================================ ROTAS */

async function rotaPedido(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'sem-ip';
  if (!(await limitar(env, 'pedido:' + ip, 8, 300))) {
    return erro('Muitas tentativas. Espere alguns minutos.', 429);
  }

  const d = await req.json().catch(() => null);
  if (!d) return erro('Corpo inválido.');

  const { plano, nome, email, cpf, telefone, bump, metodo } = d;
  if (!PLANOS[plano]) return erro('Plano inválido.');
  if (!nome || String(nome).trim().split(/\s+/).length < 2) return erro('Informe o nome completo.');
  if (!emailValido(email)) return erro('E-mail inválido.');
  if (!cpfValido(cpf)) return erro('CPF inválido.');
  if (metodo !== 'pix' && metodo !== 'cartao') return erro('Método de pagamento inválido.');

  const pedidoId = 'HDR-' + crypto.randomUUID();
  const emailNorm = normalizarEmail(email);

  await env.ALUNOS.put('pedido:' + pedidoId, JSON.stringify({
    status: 'pendente', email: emailNorm, nome, plano, bump: !!bump, metodo,
    criadoEm: new Date().toISOString(),
  }), { expirationTtl: 60 * 60 * 24 * 7 });

  try {
    if (metodo === 'cartao') {
      const pref = await mpCriarPreferencia(env, { plano, nome, email: emailNorm, bump, pedidoId });
      return json({ tipo: 'redirect', url: pref.init_point, pedidoId });
    }

    const pg = await mpCriarPagamento(env, {
      plano, nome, email: emailNorm, cpf, telefone, bump, metodo, pedidoId,
    });
    const tx = pg.point_of_interaction?.transaction_data || {};
    // guarda o vínculo pagamento -> pedido para o webhook resolver depois
    await env.ALUNOS.put('mp:' + pg.id, pedidoId, { expirationTtl: 60 * 60 * 24 * 7 });

    return json({
      tipo: 'pix',
      pedidoId,
      pagamentoId: pg.id,
      qrBase64: tx.qr_code_base64 || null,
      copiaCola: tx.qr_code || null,
      expiraEm: pg.date_of_expiration,
      valor: calcularValor(plano, metodo, bump),
    });
  } catch (e) {
    console.error('[pedido]', e.message);
    return erro('Não consegui gerar a cobrança agora. Tente novamente em instantes.', 502);
  }
}

async function rotaConsultarPedido(pedidoId, env) {
  const reg = await env.ALUNOS.get('pedido:' + pedidoId, 'json');
  if (!reg) return erro('Pedido não encontrado.', 404);
  if (reg.status === 'aprovado') {
    return json({ status: 'aprovado', codigo: reg.codigo, email: reg.email, plano: reg.plano, link: reg.link });
  }
  return json({ status: reg.status || 'pendente' });
}

async function rotaWebhookMP(req, env) {
  const url = new URL(req.url);
  const corpo = await req.json().catch(() => ({}));
  const dataId = corpo?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
  const tipo = corpo?.type || url.searchParams.get('type');

  if (!dataId) return json({ ok: true, ignorado: 'sem data.id' });
  if (tipo && tipo !== 'payment') return json({ ok: true, ignorado: tipo });

  const val = await mpAssinaturaValida(env, req, dataId);
  if (!val.ok) {
    console.error('[webhook mp] assinatura rejeitada:', val.motivo);
    // 401 faz o MP tentar de novo; se for ataque, nada foi liberado.
    return erro('Assinatura inválida.', 401);
  }

  let pg;
  try { pg = await mpBuscarPagamento(env, dataId); }
  catch (e) { console.error('[webhook mp]', e.message); return erro('Falha ao consultar.', 502); }

  if (pg.status !== 'approved') {
    return json({ ok: true, status: pg.status });
  }

  const pedidoId = pg.external_reference || await env.ALUNOS.get('mp:' + dataId);
  if (!pedidoId) return json({ ok: true, ignorado: 'pedido não localizado' });

  const pendente = await env.ALUNOS.get('pedido:' + pedidoId, 'json');
  const meta = pg.metadata || {};

  await liberarAcesso(env, {
    pedidoId,
    email: pendente?.email || pg.payer?.email,
    nome: pendente?.nome || [pg.payer?.first_name, pg.payer?.last_name].filter(Boolean).join(' '),
    plano: pendente?.plano || meta.plano || 'iniciado',
    bump: pendente?.bump ?? meta.bump,
    telefone: pendente?.telefone || meta.telefone,
    origem: 'mercadopago',
  });

  return json({ ok: true });
}

/**
 * Webhook genérico para Kirvano / Cakto / Hotmart.
 * Cada uma manda um formato diferente; normalizamos aqui.
 * A autenticação é por token compartilhado no cabeçalho ou na querystring —
 * é o que essas plataformas oferecem.
 */
async function rotaWebhookPlataforma(plataforma, req, env) {
  const url = new URL(req.url);
  const segredo = env.WEBHOOK_TOKEN_PLATAFORMA;
  const recebido = req.headers.get('x-webhook-token')
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || url.searchParams.get('token');

  if (!segredo || !iguaisSeguro(segredo, recebido || '')) {
    return erro('Token inválido.', 401);
  }

  const c = await req.json().catch(() => ({}));

  // Normalização por plataforma. Confira o payload real no painel de cada uma
  // antes de abrir as vendas — elas mudam os campos sem aviso.
  const mapa = {
    kirvano: {
      pago: ['APPROVED', 'SALE_APPROVED'].includes(c.event || c.status),
      email: c.customer?.email, nome: c.customer?.name,
      pedido: c.sale_id || c.checkout_id, produto: c.products?.[0]?.offer_id,
    },
    cakto: {
      pago: ['paid', 'approved'].includes(c.status || c.event),
      email: c.customer?.email, nome: c.customer?.name,
      pedido: c.id || c.transaction_id, produto: c.offer?.id || c.product?.id,
    },
    hotmart: {
      pago: c.event === 'PURCHASE_APPROVED',
      email: c.data?.buyer?.email, nome: c.data?.buyer?.name,
      pedido: c.data?.purchase?.transaction, produto: c.data?.product?.id,
    },
  }[plataforma];

  if (!mapa) return erro('Plataforma desconhecida.', 400);
  if (!mapa.pago) return json({ ok: true, ignorado: 'evento não é aprovação' });
  if (!emailValido(mapa.email)) return erro('Payload sem e-mail válido.', 400);

  // Mapeia o id da oferta -> plano. Configure em PLANOS_EXTERNOS.
  let planos = {};
  try { planos = JSON.parse(env.PLANOS_EXTERNOS || '{}'); } catch { /* mantém vazio */ }
  const plano = planos[String(mapa.produto)] || env.PLANO_PADRAO || 'iniciado';

  await liberarAcesso(env, {
    pedidoId: `${plataforma}-${mapa.pedido}`,
    email: mapa.email, nome: mapa.nome, plano, bump: false, origem: plataforma,
  });

  return json({ ok: true });
}

/* --------------------------------------------------------------- LOGIN */

async function registrarDispositivo(env, aluno, impressao) {
  if (!impressao) return { ok: true, total: aluno.dispositivosVistos.length };
  const lista = aluno.dispositivosVistos || [];
  if (lista.includes(impressao)) return { ok: true, total: lista.length };

  const limite = PLANOS[aluno.plano].dispositivos;
  if (lista.length >= limite) {
    return { ok: false, total: lista.length, limite };
  }
  aluno.dispositivosVistos = [...lista, impressao];
  await env.ALUNOS.put('aluno:' + aluno.email, JSON.stringify(aluno));
  return { ok: true, total: aluno.dispositivosVistos.length };
}

function respostaAluno(aluno, total) {
  return {
    nome: aluno.nome, email: aluno.email, plano: aluno.plano, codigo: aluno.codigo,
    bump: aluno.bump, compradoEm: aluno.compradoEm, expiraEm: aluno.expiraEm,
    dispositivos: total,
  };
}

async function rotaEntrar(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'sem-ip';
  if (!(await limitar(env, 'entrar:' + ip, 12, 600))) {
    return erro('Muitas tentativas. Espere 10 minutos.', 429);
  }

  const { email, codigo, dispositivo } = await req.json().catch(() => ({}));
  const emailNorm = normalizarEmail(email);
  const cod = String(codigo || '').trim().toUpperCase();

  const emailDoCodigo = await env.ALUNOS.get('codigo:' + cod);
  // Mesma mensagem para código inexistente e para e-mail que não bate:
  // dizer "código existe mas e-mail errado" entrega meio segredo.
  if (!emailDoCodigo || emailDoCodigo !== emailNorm) {
    return erro('E-mail ou código não conferem.', 401, 'nao_encontrado');
  }

  const aluno = await env.ALUNOS.get('aluno:' + emailNorm, 'json');
  if (!aluno) return erro('Cadastro não encontrado.', 404);
  if (new Date(aluno.expiraEm) < new Date()) {
    return erro('Seu acesso expirou. Fale com o suporte para renovar.', 403, 'expirado');
  }

  const disp = await registrarDispositivo(env, aluno, dispositivo);
  if (!disp.ok) {
    return erro(
      `Seu plano permite ${disp.limite} dispositivos e você já usou todos. ` +
      `Fale com o suporte para liberar este aparelho.`, 403, 'dispositivos');
  }

  const token = await criarToken(env, {
    email: emailNorm, codigo: cod, plano: aluno.plano,
    exp: Date.now() + 90 * 864e5, t: 'sessao',
  });

  return json({ token, aluno: respostaAluno(aluno, disp.total) });
}

async function rotaEntrarToken(req, env) {
  const { token, dispositivo } = await req.json().catch(() => ({}));
  const d = await lerToken(env, token);
  if (!d) return erro('Link inválido ou expirado.', 401, 'token');

  const aluno = await env.ALUNOS.get('aluno:' + d.email, 'json');
  if (!aluno) return erro('Cadastro não encontrado.', 404);
  if (aluno.codigo !== d.codigo) return erro('Credencial revogada.', 401);
  if (new Date(aluno.expiraEm) < new Date()) return erro('Seu acesso expirou.', 403, 'expirado');

  const disp = await registrarDispositivo(env, aluno, dispositivo);
  if (!disp.ok) {
    return erro(`Limite de ${disp.limite} dispositivos atingido.`, 403, 'dispositivos');
  }

  const sessao = await criarToken(env, {
    email: d.email, codigo: aluno.codigo, plano: aluno.plano,
    exp: Date.now() + 90 * 864e5, t: 'sessao',
  });
  return json({ token: sessao, aluno: respostaAluno(aluno, disp.total) });
}

async function rotaEu(req, env) {
  const { token } = await req.json().catch(() => ({}));
  const d = await lerToken(env, token);
  if (!d) return erro('Sessão inválida.', 401);

  const aluno = await env.ALUNOS.get('aluno:' + d.email, 'json');
  if (!aluno) return erro('Cadastro não encontrado.', 404);
  if (new Date(aluno.expiraEm) < new Date()) return erro('Acesso expirado.', 403, 'expirado');

  // O plano vem sempre do KV, nunca do token: assim um upgrade vale na hora,
  // e um token antigo não congela o aluno num plano menor (nem maior).
  return json({ token, aluno: respostaAluno(aluno, (aluno.dispositivosVistos || []).length) });
}

/* ============================================================== ROTEADOR */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = cabecalhosCors(env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const responder = (r) => {
      const h = new Headers(r.headers);
      Object.entries(cors).forEach(([k, v]) => h.set(k, v));
      return new Response(r.body, { status: r.status, headers: h });
    };

    try {
      const p = url.pathname;

      if (p === '/api/saude') {
        return responder(json({
          ok: true,
          kv: !!env.ALUNOS,
          mp: !!env.MP_ACCESS_TOKEN,
          webhookAssinado: !!env.MP_WEBHOOK_SECRET,
          email: !!env.RESEND_API_KEY,
        }));
      }

      if (p === '/api/pedido' && req.method === 'POST') return responder(await rotaPedido(req, env));

      if (p.startsWith('/api/pedido/') && req.method === 'GET') {
        return responder(await rotaConsultarPedido(decodeURIComponent(p.slice('/api/pedido/'.length)), env));
      }

      if (p === '/api/webhook/mercadopago' && req.method === 'POST') {
        return responder(await rotaWebhookMP(req, env));
      }
      for (const nome of ['kirvano', 'cakto', 'hotmart']) {
        if (p === `/api/webhook/${nome}` && req.method === 'POST') {
          return responder(await rotaWebhookPlataforma(nome, req, env));
        }
      }

      if (p === '/api/entrar' && req.method === 'POST') return responder(await rotaEntrar(req, env));
      if (p === '/api/entrar/token' && req.method === 'POST') return responder(await rotaEntrarToken(req, env));
      if (p === '/api/eu' && req.method === 'POST') return responder(await rotaEu(req, env));

      return responder(erro('Rota não encontrada.', 404));
    } catch (e) {
      console.error('[erro não tratado]', e.stack || e.message);
      return responder(erro('Erro interno.', 500));
    }
  },
};
