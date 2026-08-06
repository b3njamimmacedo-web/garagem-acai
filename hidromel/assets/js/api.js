/* =============================================================================
   CLIENTE DA API + MODO DEMONSTRAÇÃO

   Toda conversa com o backend passa por aqui. Se CONFIG.API_URL estiver vazia,
   cada função devolve uma resposta simulada com a MESMA forma da real — assim o
   site funciona inteiro para teste, e trocar demo por produção é preencher uma
   variável, não mexer em código.
============================================================================= */

import { CONFIG, MODO_DEMO, CODIGO_DEMO } from './config.js';

/* --------------------------------------------------------------- UTILIDADES */

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function chamar(rota, opcoes = {}) {
  const resp = await fetch(CONFIG.API_URL.replace(/\/$/, '') + rota, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });
  let dados = null;
  try { dados = await resp.json(); } catch { /* resposta sem corpo */ }
  if (!resp.ok) {
    const e = new Error(dados?.erro || `Falha na comunicação (${resp.status})`);
    e.status = resp.status;
    e.codigo = dados?.codigo;
    throw e;
  }
  return dados;
}

/** CPF: validação real de dígito verificador, não só contagem de caracteres. */
export function cpfValido(cpf) {
  const n = String(cpf).replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const dv = (base, peso) => {
    const soma = base.split('').reduce((s, d, i) => s + +d * (peso - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(n.slice(0, 9), 10) === +n[9] && dv(n.slice(0, 10), 11) === +n[10];
}

export const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(e).trim());

export const mascaraCpf = (v) =>
  String(v).replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

/** Telefone BR. Decide o formato pelo TAMANHO em vez de encadear replaces:
 *  encadeado, a regra de 4 dígitos reaplica sobre o resultado da de 5 e
 *  produz "(11) 9888-8-777". */
export function mascaraTel(v) {
  const n = String(v).replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : '';
  const ddd = n.slice(0, 2);
  const resto = n.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  // 9 dígitos = celular → 5+4 ; 8 dígitos = fixo → 4+4
  const corte = resto.length > 8 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export const brl = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* ------------------------------------------------------------------ PEDIDOS */

/**
 * Cria o pedido e devolve o que a interface precisa mostrar.
 * Formatos possíveis de retorno:
 *   { tipo: 'pix',      pedidoId, qrBase64, copiaCola, expiraEm, valor }
 *   { tipo: 'redirect', url }                       (cartão / checkout externo)
 */
export async function criarPedido({ plano, nome, email, cpf, telefone, bump, metodo }) {
  if (CONFIG.MODO_CHECKOUT === 'externo') {
    const url = CONFIG.LINKS_EXTERNOS[plano];
    if (!url) throw new Error('Link de checkout externo não configurado para este plano.');
    return { tipo: 'redirect', url };
  }

  if (MODO_DEMO) {
    await espera(900);
    if (metodo === 'cartao') {
      return { tipo: 'redirect', url: `./obrigado.html?demo=1&plano=${plano}&metodo=cartao` };
    }
    return {
      tipo: 'pix',
      pedidoId: 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      qrBase64: null,          // sem QR real no demo
      copiaCola: '00020126DEMO-PIX-SIMULADO-HIDROMEL-DE-REIS' + '5204000053039865802BR',
      expiraEm: new Date(Date.now() + 30 * 60000).toISOString(),
      valor: 0,
      demo: true,
    };
  }

  return chamar('/api/pedido', {
    method: 'POST',
    body: { plano, nome, email, cpf, telefone, bump: !!bump, metodo },
  });
}

/** Consulta o status. A página de obrigado chama isso em intervalos. */
export async function consultarPedido(pedidoId) {
  if (MODO_DEMO) {
    // No demo, aprova sozinho ~8 segundos depois de criado.
    const chave = 'demo_pedido_' + pedidoId;
    let t0 = Number(sessionStorage.getItem(chave));
    if (!t0) { t0 = Date.now(); sessionStorage.setItem(chave, String(t0)); }
    if (Date.now() - t0 < 8000) return { status: 'pendente' };
    return {
      status: 'aprovado',
      codigo: CODIGO_DEMO,
      email: 'demo@hidromeldereis.com.br',
      plano: 'real',
      // usa ?t= igual à produção, para o teste exercitar o mesmo caminho de
      // entrada com um clique que o comprador real vai receber por e-mail
      link: `./curso/#/entrar?t=demo.${btoa(CODIGO_DEMO)}`,
      demo: true,
    };
  }
  return chamar(`/api/pedido/${encodeURIComponent(pedidoId)}`);
}

/* -------------------------------------------------------------------- LOGIN */

/** Impressão digital estável do navegador. Não identifica a pessoa —
 *  só serve para contar quantos dispositivos usam o mesmo código. */
export function impressaoDispositivo() {
  const guardada = localStorage.getItem('hdr_disp');
  if (guardada) return guardada;
  const semente = [
    navigator.userAgent, navigator.language, screen.width + 'x' + screen.height,
    screen.colorDepth, new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ].join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const id = h.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  localStorage.setItem('hdr_disp', id);
  return id;
}

const ALUNO_DEMO = {
  nome: 'Aluno Demonstração',
  email: 'demo@hidromeldereis.com.br',
  plano: 'real',
  codigo: CODIGO_DEMO,
  compradoEm: new Date().toISOString(),
  expiraEm: new Date(Date.now() + 3 * 365 * 864e5).toISOString(),
  bump: true,
  demo: true,
};

/** Entrar com e-mail + código de acesso. */
export async function entrarComCodigo(email, codigo) {
  const cod = String(codigo).trim().toUpperCase();
  if (MODO_DEMO) {
    await espera(500);
    if (cod !== CODIGO_DEMO) {
      const e = new Error('Código não encontrado. No modo demonstração use ' + CODIGO_DEMO);
      e.codigo = 'nao_encontrado';
      throw e;
    }
    return { token: 'demo.' + btoa(cod), aluno: ALUNO_DEMO };
  }
  return chamar('/api/entrar', {
    method: 'POST',
    body: { email: String(email).trim().toLowerCase(), codigo: cod, dispositivo: impressaoDispositivo() },
  });
}

/** Entrar pelo link individual (token assinado que veio no e-mail). */
export async function entrarComToken(token) {
  if (MODO_DEMO) {
    await espera(350);
    return { token, aluno: ALUNO_DEMO };
  }
  return chamar('/api/entrar/token', {
    method: 'POST',
    body: { token, dispositivo: impressaoDispositivo() },
  });
}

/** Revalida a sessão guardada. Devolve null se não houver sessão válida. */
export async function sessaoAtual() {
  const token = localStorage.getItem('hdr_token');
  if (!token) return null;
  if (MODO_DEMO) return { token, aluno: ALUNO_DEMO };
  try {
    const r = await chamar('/api/eu', {
      method: 'POST',
      body: { token, dispositivo: impressaoDispositivo() },
    });
    return r;
  } catch {
    localStorage.removeItem('hdr_token');
    return null;
  }
}

export function guardarSessao(token) { localStorage.setItem('hdr_token', token); }
export function sairSessao() { localStorage.removeItem('hdr_token'); }

/* ------------------------------------------------------------- RASTREAMENTO */

/** Dispara evento no Pixel da Meta e no GA4, se estiverem configurados.
 *  Silencioso quando não estão — nada de erro no console em produção. */
export function evento(nome, dados = {}) {
  try {
    if (window.fbq) {
      const padroes = { ViewContent: 1, InitiateCheckout: 1, Purchase: 1, Lead: 1, AddToCart: 1 };
      window.fbq(padroes[nome] ? 'track' : 'trackCustom', nome, dados);
    }
    if (window.gtag) window.gtag('event', nome, dados);
  } catch { /* rastreamento nunca pode quebrar a página */ }
}
