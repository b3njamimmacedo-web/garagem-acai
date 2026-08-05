#!/usr/bin/env node
/* =============================================================================
   TESTES DO BACKEND
   Roda o worker.js em Node com KV e fetch simulados. Cobre justamente o que,
   se quebrar, custa dinheiro: assinatura de webhook, idempotência, unicidade
   de código, limite de dispositivos e isolamento entre alunos.

   Uso:  node scripts/testar-worker.mjs
============================================================================= */

import worker from '../api/worker.js';

/* ------------------------------------------------------------- SIMULADOS */

function kvSimulado() {
  const dados = new Map();
  return {
    _dados: dados,
    async get(k, tipo) {
      const v = dados.get(k);
      if (v === undefined) return null;
      return tipo === 'json' ? JSON.parse(v) : v;
    },
    async put(k, v) { dados.set(k, v); },
    async delete(k) { dados.delete(k); },
  };
}

const SEGREDO = 'segredo-de-teste-com-tamanho-suficiente-1234567890';
const WEBHOOK_SECRET = 'chave-webhook-de-teste';

function ambiente() {
  return {
    ALUNOS: kvSimulado(),
    SEGREDO,
    MP_ACCESS_TOKEN: 'TEST-token',
    MP_WEBHOOK_SECRET: WEBHOOK_SECRET,
    RESEND_API_KEY: '',                 // vazio: envio pulado, sem rede
    URL_PUBLICA: 'https://api.teste.dev',
    URL_SITE: 'https://site.teste.dev',
    ORIGEM_PERMITIDA: '*',
  };
}

/** Respostas do Mercado Pago, controladas pelo teste. */
let pagamentoFalso = null;
globalThis.fetch = async (url, opcoes = {}) => {
  const u = String(url);
  if (u.includes('/v1/payments/')) {
    return new Response(JSON.stringify(pagamentoFalso), { status: 200 });
  }
  if (u.endsWith('/v1/payments')) {
    const corpo = JSON.parse(opcoes.body);
    return new Response(JSON.stringify({
      id: 99887766,
      status: 'pending',
      external_reference: corpo.external_reference,
      date_of_expiration: corpo.date_of_expiration,
      point_of_interaction: { transaction_data: { qr_code: '00020126PIXFALSO', qr_code_base64: 'AAAA' } },
    }), { status: 200 });
  }
  if (u.includes('/checkout/preferences')) {
    return new Response(JSON.stringify({ init_point: 'https://mp.fake/checkout' }), { status: 200 });
  }
  if (u.includes('resend.com')) return new Response('{}', { status: 200 });
  throw new Error('fetch inesperado: ' + u);
};

/* ----------------------------------------------------------------- APOIO */

const enc = new TextEncoder();
async function hmacHex(segredo, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const chamar = (env, caminho, opcoes = {}) =>
  worker.fetch(new Request('https://api.teste.dev' + caminho, opcoes), env);

const post = (env, caminho, corpo, cabecalhos = {}) =>
  chamar(env, caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cabecalhos },
    body: JSON.stringify(corpo),
  });

async function webhookAssinado(env, pagamentoId, { adulterar = false, ts = null } = {}) {
  const requestId = 'req-' + Math.random().toString(36).slice(2);
  const carimbo = ts ?? Math.floor(Date.now() / 1000);
  const manifesto = `id:${String(pagamentoId).toLowerCase()};request-id:${requestId};ts:${carimbo};`;
  let v1 = await hmacHex(WEBHOOK_SECRET, manifesto);
  if (adulterar) v1 = v1.slice(0, -1) + (v1.at(-1) === 'a' ? 'b' : 'a');
  return post(env, '/api/webhook/mercadopago', { type: 'payment', data: { id: pagamentoId } }, {
    'x-signature': `ts=${carimbo},v1=${v1}`,
    'x-request-id': requestId,
  });
}

/* ---------------------------------------------------------------- TESTES */

let ok = 0, falhou = 0;
const t = (nome, condicao, detalhe = '') => {
  console.log((condicao ? '✓ ' : '✗ ') + nome + (detalhe && !condicao ? '  → ' + detalhe : ''));
  condicao ? ok++ : falhou++;
};

const CLIENTE = {
  plano: 'mestre', nome: 'Maria Silva', email: 'Maria@Exemplo.COM',
  cpf: '111.444.777-35',           // CPF com dígitos verificadores válidos
  telefone: '(11) 98888-7777', bump: true, metodo: 'pix',
};

/* ------------------------------------------------------------------------ */
console.log('\n— saúde e validação de entrada —');
{
  const env = ambiente();
  const r = await chamar(env, '/api/saude');
  const d = await r.json();
  t('saúde responde ok', d.ok === true);
  t('saúde detecta KV, MP e assinatura', d.kv && d.mp && d.webhookAssinado);
  t('saúde reporta e-mail ausente', d.email === false);

  t('rota inexistente devolve 404', (await chamar(env, '/api/nada')).status === 404);

  const casos = [
    ['plano inválido', { ...CLIENTE, plano: 'ouro' }],
    ['e-mail inválido', { ...CLIENTE, email: 'nao-e-email' }],
    ['CPF inválido', { ...CLIENTE, cpf: '111.111.111-11' }],
    ['nome sem sobrenome', { ...CLIENTE, nome: 'Maria' }],
    ['método inválido', { ...CLIENTE, metodo: 'boleto' }],
  ];
  for (const [nome, corpo] of casos) {
    const resp = await post(env, '/api/pedido', corpo);
    t('recusa ' + nome, resp.status === 400);
  }
}

/* ------------------------------------------------------------------------ */
console.log('\n— criação de pedido —');
let pedidoSalvo, envGlobal;
{
  const env = ambiente(); envGlobal = env;
  const r = await post(env, '/api/pedido', CLIENTE);
  const d = await r.json();
  t('cria cobrança Pix', d.tipo === 'pix' && !!d.copiaCola, JSON.stringify(d));
  t('devolve id do pedido', typeof d.pedidoId === 'string' && d.pedidoId.startsWith('HDR-'));
  // mestre 197 com 10% de desconto = 177, + bump 27 = 204
  t('valor com desconto Pix + bump', d.valor === 204, 'recebido ' + d.valor);
  pedidoSalvo = d;

  const pend = await env.ALUNOS.get('pedido:' + d.pedidoId, 'json');
  t('pedido gravado como pendente', pend.status === 'pendente');
  t('e-mail normalizado para minúsculas', pend.email === 'maria@exemplo.com');

  const rc = await post(env, '/api/pedido', { ...CLIENTE, metodo: 'cartao' });
  const dc = await rc.json();
  t('cartão devolve redirecionamento', dc.tipo === 'redirect' && dc.url.includes('mp.fake'));

  const cons = await (await chamar(env, '/api/pedido/' + d.pedidoId)).json();
  t('consulta pedido pendente', cons.status === 'pendente');
  t('consulta pedido inexistente devolve 404',
    (await chamar(env, '/api/pedido/NAO-EXISTE')).status === 404);
}

/* ------------------------------------------------------------------------ */
console.log('\n— webhook: assinatura —');
{
  const env = envGlobal;
  pagamentoFalso = {
    id: 99887766, status: 'approved', external_reference: pedidoSalvo.pedidoId,
    payer: { email: 'maria@exemplo.com', first_name: 'Maria', last_name: 'Silva' },
    metadata: { plano: 'mestre', bump: true },
  };

  const semAssinatura = await post(env, '/api/webhook/mercadopago',
    { type: 'payment', data: { id: 99887766 } });
  t('RECUSA webhook sem assinatura', semAssinatura.status === 401);

  const adulterada = await webhookAssinado(env, 99887766, { adulterar: true });
  t('RECUSA assinatura adulterada em 1 byte', adulterada.status === 401);

  const antiga = await webhookAssinado(env, 99887766, { ts: Math.floor(Date.now() / 1000) - 3600 });
  t('RECUSA replay de 1 hora atrás', antiga.status === 401);

  const liberado = await env.ALUNOS.get('aluno:maria@exemplo.com');
  t('nenhum acesso liberado pelas tentativas inválidas', liberado === null);
}

/* ------------------------------------------------------------------------ */
console.log('\n— webhook: liberação e idempotência —');
let codigoGerado;
{
  const env = envGlobal;
  const r = await webhookAssinado(env, 99887766);
  t('ACEITA webhook com assinatura válida', r.status === 200);

  const aluno = await env.ALUNOS.get('aluno:maria@exemplo.com', 'json');
  t('aluno gravado', !!aluno, 'não encontrado');
  t('plano correto', aluno.plano === 'mestre');
  t('order bump registrado', aluno.bump === true);
  t('código no formato MEAD-XXXX-XXXX-XXXX', /^MEAD-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(aluno.codigo), aluno.codigo);
  t('código sem caracteres ambíguos (I O 0 1)', !/[IO01]/.test(aluno.codigo.slice(5)), aluno.codigo);
  t('índice código→e-mail criado',
    (await env.ALUNOS.get('codigo:' + aluno.codigo)) === 'maria@exemplo.com');
  t('validade de 3 anos',
    Math.abs(new Date(aluno.expiraEm) - Date.now() - 3 * 365 * 864e5) < 864e5);
  codigoGerado = aluno.codigo;

  const reg = await env.ALUNOS.get('pedido:' + pedidoSalvo.pedidoId, 'json');
  t('pedido virou aprovado', reg.status === 'aprovado');
  t('link individual assinado gerado', reg.link.includes('/curso/#/entrar?t=') && reg.link.split('t=')[1].includes('.'));

  // reenvio — o Mercado Pago faz isso de verdade
  await webhookAssinado(env, 99887766);
  await webhookAssinado(env, 99887766);
  const depois = await env.ALUNOS.get('aluno:maria@exemplo.com', 'json');
  t('IDEMPOTENTE: código não muda com webhook repetido', depois.codigo === codigoGerado);
  t('IDEMPOTENTE: não duplica pedido no histórico', depois.pedidos.length === 1,
    depois.pedidos.length + ' pedidos');

  pagamentoFalso = { ...pagamentoFalso, status: 'pending' };
  const naoAprovado = await webhookAssinado(env, 99887766);
  t('ignora pagamento não aprovado', (await naoAprovado.json()).status === 'pending');
  pagamentoFalso = { ...pagamentoFalso, status: 'approved' };
}

/* ------------------------------------------------------------------------ */
console.log('\n— login —');
let tokenSessao;
{
  const env = envGlobal;

  const errado = await post(env, '/api/entrar',
    { email: 'maria@exemplo.com', codigo: 'MEAD-XXXX-XXXX-XXXX', dispositivo: 'd1' });
  t('recusa código errado', errado.status === 401);

  const outroEmail = await post(env, '/api/entrar',
    { email: 'ladrao@exemplo.com', codigo: codigoGerado, dispositivo: 'd1' });
  t('recusa código certo com e-mail de outra pessoa', outroEmail.status === 401);

  // As duas respostas precisam ser indistinguíveis: se "código inexistente" e
  // "código válido, e-mail errado" dessem mensagens diferentes, um atacante
  // conseguiria enumerar códigos válidos sem saber nenhum e-mail.
  const m1 = await errado.json(), m2 = await outroEmail.json();
  t('as duas recusas são idênticas (não dá para enumerar código)',
    m1.erro === m2.erro && m1.codigo === m2.codigo, `"${m1.erro}" vs "${m2.erro}"`);

  const bom = await post(env, '/api/entrar',
    { email: 'MARIA@exemplo.com', codigo: codigoGerado.toLowerCase(), dispositivo: 'disp-1' });
  const d = await bom.json();
  t('aceita e-mail e código sem diferenciar maiúsculas', bom.status === 200, JSON.stringify(d));
  t('devolve token de sessão', typeof d.token === 'string' && d.token.includes('.'));
  t('devolve dados do aluno', d.aluno.email === 'maria@exemplo.com' && d.aluno.plano === 'mestre');
  t('NÃO vaza a lista de dispositivos', d.aluno.dispositivosVistos === undefined);
  tokenSessao = d.token;

  const eu = await (await post(env, '/api/eu', { token: tokenSessao })).json();
  t('sessão revalida', eu.aluno.codigo === codigoGerado);

  const forjado = tokenSessao.split('.')[0] + '.' + 'f'.repeat(64);
  t('recusa token com assinatura forjada',
    (await post(env, '/api/eu', { token: forjado })).status === 401);

  // tenta se promover editando o conteúdo do token
  const cru = JSON.parse(Buffer.from(tokenSessao.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  const adulterado = Buffer.from(JSON.stringify({ ...cru, plano: 'real' })).toString('base64url')
    + '.' + tokenSessao.split('.')[1];
  t('recusa token com plano adulterado',
    (await post(env, '/api/eu', { token: adulterado })).status === 401);
}

/* ------------------------------------------------------------------------ */
console.log('\n— limite de dispositivos —');
{
  const env = envGlobal;   // Maria está no MESTRE: limite 3
  const tentar = (d) => post(env, '/api/entrar',
    { email: 'maria@exemplo.com', codigo: codigoGerado, dispositivo: d });

  t('2º dispositivo entra', (await tentar('disp-2')).status === 200);
  t('3º dispositivo entra', (await tentar('disp-3')).status === 200);
  const quarto = await tentar('disp-4');
  t('4º dispositivo é RECUSADO no plano Mestre', quarto.status === 403);
  t('erro traz código "dispositivos"', (await quarto.json()).codigo === 'dispositivos');
  t('dispositivo já conhecido entra de novo', (await tentar('disp-1')).status === 200);
}

/* ------------------------------------------------------------------------ */
console.log('\n— acesso expirado —');
{
  const env = envGlobal;
  const a = await env.ALUNOS.get('aluno:maria@exemplo.com', 'json');
  await env.ALUNOS.put('aluno:maria@exemplo.com',
    JSON.stringify({ ...a, expiraEm: new Date(Date.now() - 864e5).toISOString() }));

  const r = await post(env, '/api/entrar',
    { email: 'maria@exemplo.com', codigo: codigoGerado, dispositivo: 'disp-1' });
  t('bloqueia acesso expirado no login', r.status === 403);
  t('sessão existente também para de valer',
    (await post(env, '/api/eu', { token: tokenSessao })).status === 403);

  await env.ALUNOS.put('aluno:maria@exemplo.com', JSON.stringify(a)); // restaura
}

/* ------------------------------------------------------------------------ */
console.log('\n— upgrade de plano —');
{
  const env = envGlobal;
  const pedido2 = 'HDR-upgrade-teste';
  await env.ALUNOS.put('pedido:' + pedido2, JSON.stringify({
    status: 'pendente', email: 'maria@exemplo.com', nome: 'Maria Silva', plano: 'real', bump: false,
  }));
  pagamentoFalso = { id: 555, status: 'approved', external_reference: pedido2,
    payer: { email: 'maria@exemplo.com' }, metadata: { plano: 'real' } };
  await webhookAssinado(env, 555);

  const a = await env.ALUNOS.get('aluno:maria@exemplo.com', 'json');
  t('upgrade sobe o plano para REAL', a.plano === 'real');
  t('upgrade MANTÉM o mesmo código', a.codigo === codigoGerado);
  t('histórico registra os dois pedidos', a.pedidos.length === 2, a.pedidos.length + '');

  // downgrade acidental não pode rebaixar quem já pagou mais
  const pedido3 = 'HDR-downgrade-teste';
  await env.ALUNOS.put('pedido:' + pedido3, JSON.stringify({
    status: 'pendente', email: 'maria@exemplo.com', nome: 'Maria Silva', plano: 'iniciado', bump: false,
  }));
  pagamentoFalso = { id: 556, status: 'approved', external_reference: pedido3,
    payer: { email: 'maria@exemplo.com' }, metadata: { plano: 'iniciado' } };
  await webhookAssinado(env, 556);
  const b = await env.ALUNOS.get('aluno:maria@exemplo.com', 'json');
  t('compra de plano menor NÃO rebaixa quem já tem plano maior', b.plano === 'real');
}

/* ------------------------------------------------------------------------ */
console.log('\n— unicidade dos códigos —');
{
  const env = ambiente();
  const vistos = new Set();
  for (let i = 0; i < 60; i++) {
    const email = `aluno${i}@teste.com`;
    const pedido = 'HDR-lote-' + i;
    await env.ALUNOS.put('pedido:' + pedido, JSON.stringify({
      status: 'pendente', email, nome: 'Aluno ' + i, plano: 'iniciado', bump: false,
    }));
    pagamentoFalso = { id: 1000 + i, status: 'approved', external_reference: pedido,
      payer: { email }, metadata: { plano: 'iniciado' } };
    await webhookAssinado(env, 1000 + i);
    const a = await env.ALUNOS.get('aluno:' + email, 'json');
    vistos.add(a.codigo);
  }
  t('60 compradores → 60 códigos distintos', vistos.size === 60, vistos.size + ' distintos');

  const um = await env.ALUNOS.get('aluno:aluno5@teste.com', 'json');
  const outro = await env.ALUNOS.get('aluno:aluno9@teste.com', 'json');
  const r = await post(env, '/api/entrar',
    { email: um.email, codigo: outro.codigo, dispositivo: 'x' });
  t('código de um aluno não abre a conta de outro', r.status === 401);
}

/* ------------------------------------------------------------------------ */
console.log('\n— webhook de plataforma externa —');
{
  const env = ambiente();
  env.WEBHOOK_TOKEN_PLATAFORMA = 'token-plataforma';
  env.PLANOS_EXTERNOS = '{"oferta-mestre":"mestre"}';

  const semToken = await post(env, '/api/webhook/kirvano',
    { event: 'SALE_APPROVED', customer: { email: 'a@b.com', name: 'A B' }, sale_id: '1' });
  t('recusa webhook externo sem token', semToken.status === 401);

  const comToken = await post(env, '/api/webhook/kirvano', {
    event: 'SALE_APPROVED', customer: { email: 'joao@teste.com', name: 'João Souza' },
    sale_id: 'K-123', products: [{ offer_id: 'oferta-mestre' }],
  }, { 'x-webhook-token': 'token-plataforma' });
  t('aceita webhook externo com token', comToken.status === 200);

  const a = await env.ALUNOS.get('aluno:joao@teste.com', 'json');
  t('mapeia a oferta para o plano certo', a?.plano === 'mestre', a?.plano);

  const naoAprovado = await post(env, '/api/webhook/cakto',
    { status: 'pending', customer: { email: 'x@y.com' }, id: '9' },
    { 'x-webhook-token': 'token-plataforma' });
  t('ignora evento que não é aprovação', (await naoAprovado.json()).ignorado !== undefined);
}

/* ------------------------------------------------------------------------ */
console.log('\n— limite de requisições —');
{
  const env = ambiente();
  const cab = { 'CF-Connecting-IP': '203.0.113.9' };
  let bloqueou = false;
  for (let i = 0; i < 12; i++) {
    const r = await chamar(env, '/api/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cab },
      body: JSON.stringify(CLIENTE),
    });
    if (r.status === 429) { bloqueou = true; break; }
  }
  t('bloqueia excesso de pedidos do mesmo IP', bloqueou);
}

/* ------------------------------------------------------------------------ */
console.log(`\n${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
