import React, { useState, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

/* ============================ DADOS PADRÃO (cardápio real) ============================ */
const DEFAULT_STATE = {
  config: {
    meta: 10000,
    margemAlvo: 35,          // % de lucro desejada sobre o preço de venda
    cartaoTaxa: 2.5,         // % maquininha quando pagamento = cartão
    canais: [
      { id: 'balcao',  nome: 'Balcão / Loja',     taxa: 0,  cor: '#5FA82B' },
      { id: 'whats',   nome: 'WhatsApp (próprio)', taxa: 0,  cor: '#25D366' },
      { id: 'ifood_b', nome: 'iFood (Retirada)',   taxa: 12, cor: '#EA1D2C' },
      { id: 'ifood_e', nome: 'iFood (Entrega)',    taxa: 27, cor: '#B0121C' },
    ],
    // preço dos insumos (fonte da ficha técnica — editável na aba Custos)
    insumos: {
      acaiKg: 16.00,            // R$ por kg do açaí/creme batido
      colher: 0.12,             // colher + guardanapo por copo
      coberturaPorcao: 0.45,    // custo médio de 1 cobertura
      complementoPorcao: 0.30,  // custo médio de 1 complemento
    },
    // custo = CMV calculado pela ficha técnica (gramatura + copo + 1 cob + 2 compl)
    produtos: [
      { id: 'p200', nome: 'Açaí 200ml',   preco: 10, custo: 3.17, ficha: { gramas: 100, copo: 0.40, coberturas: 1, complementos: 2 } },
      { id: 'p300', nome: 'Açaí 300ml',   preco: 12, custo: 3.86, ficha: { gramas: 140, copo: 0.45, coberturas: 1, complementos: 2 } },
      { id: 'p400', nome: 'Açaí 400ml',   preco: 14, custo: 4.55, ficha: { gramas: 180, copo: 0.50, coberturas: 1, complementos: 2 } },
      { id: 'p500', nome: 'Açaí 500ml ⭐', preco: 16, custo: 5.24, ficha: { gramas: 220, copo: 0.55, coberturas: 1, complementos: 2 } },
    ],
  },
  vendas: [],
};

/* ============================ PERSISTÊNCIA ============================ */
const STORAGE_KEY = 'garagem_saas_v1';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // merge defensivo (preenche campos novos em saves antigos)
    const dft = structuredClone(DEFAULT_STATE.config);
    const cfg = { ...dft, ...parsed.config };
    cfg.insumos = { ...dft.insumos, ...(parsed.config?.insumos || {}) };
    // garante ficha técnica em cada produto, herdando do default quando faltar
    cfg.produtos = (parsed.config?.produtos || dft.produtos).map((p) => {
      const base = dft.produtos.find((d) => d.id === p.id);
      return { ...p, ficha: p.ficha || base?.ficha || { gramas: 150, copo: 0.45, coberturas: 1, complementos: 2 } };
    });
    return { config: cfg, vendas: parsed.vendas || [] };
  } catch (e) { return structuredClone(DEFAULT_STATE); }
}
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

/* ============================ AUTENTICAÇÃO (acesso do dono) ============================ */
// Login por e-mail + senha. A senha é guardada como hash SHA-256 (nunca em texto puro).
// Credenciais padrão do dono:  garagemdoacaiitz@gmail.com  /  garagemdoacaiitz
// O dono pode trocar a senha em Config → fica salva (hash) neste navegador.
const AUTH_KEY = 'garagem_auth';          // flag de sessão logada
const PWD_HASH_KEY = 'garagem_pwd_hash';  // hash da senha atual (override do padrão)
const EMAIL_KEY = 'garagem_email';        // e-mail do dono (override do padrão)
const DEFAULT_EMAIL = 'garagemdoacaiitz@gmail.com';
const DEFAULT_PWD_HASH = 'd151dbad4803850b1899406fbffaad6044340c40abd2f7715e2cae29b60e32f3'; // garagemdoacaiitz

async function sha256(txt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const normEmail = (e) => (e || '').trim().toLowerCase();
const emailAtual = () => localStorage.getItem(EMAIL_KEY) || DEFAULT_EMAIL;
const senhaAtualHash = () => localStorage.getItem(PWD_HASH_KEY) || DEFAULT_PWD_HASH;
async function conferirCredenciais(email, senha) {
  return normEmail(email) === normEmail(emailAtual()) && (await sha256(senha)) === senhaAtualHash();
}
async function conferirSenha(txt) { return (await sha256(txt)) === senhaAtualHash(); }
async function definirSenha(nova) { localStorage.setItem(PWD_HASH_KEY, await sha256(nova)); }
const estaLogado = () => localStorage.getItem(AUTH_KEY) === '1';
const entrar = () => localStorage.setItem(AUTH_KEY, '1');
const sair = () => localStorage.removeItem(AUTH_KEY);

/* ============================ HELPERS ============================ */
const brl = (n) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (n) => `${(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

// Taxa total efetiva de uma venda (canal + cartão se aplicável)
function taxaEfetiva(config, canal, pagamento) {
  let t = canal ? canal.taxa : 0;
  if (pagamento === 'cartao') t += config.cartaoTaxa || 0;
  return t;
}

// CMV de um produto a partir da ficha técnica + preço dos insumos
function cmvDaFicha(insumos, ficha) {
  if (!ficha) return 0;
  const i = insumos || {};
  const acai = (ficha.gramas / 1000) * (i.acaiKg || 0);
  return acai + (ficha.copo || 0) + (i.colher || 0)
    + (ficha.coberturas || 0) * (i.coberturaPorcao || 0)
    + (ficha.complementos || 0) * (i.complementoPorcao || 0);
}

// Preço de um produto num canal específico (usa override; se vazio, cai no preço base)
function precoNoCanal(produto, canalId) {
  const v = produto?.precos?.[canalId];
  return (v === undefined || v === null || v === '') ? (produto?.preco || 0) : Number(v);
}

/* ============================ COMPONENTES BASE ============================ */
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-purple-100 ${className}`}>{children}</div>;
}

function KPI({ label, value, sub, accent = 'roxo' }) {
  const accents = {
    roxo: 'from-roxo to-roxo-light',
    verde: 'from-verde to-verde-light',
    red: 'from-red-500 to-red-400',
    amber: 'from-amber-500 to-amber-400',
  };
  return (
    <Card className="p-5 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${accents[accent]}`}></div>
      <div className="pl-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold mt-1 text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

/* ============================ DASHBOARD ============================ */
function Dashboard({ state }) {
  const { config, vendas } = state;
  const [periodo, setPeriodo] = useState('mes'); // hoje | mes | tudo

  const filtradas = useMemo(() => {
    const hoje = todayISO();
    const mesAtual = hoje.slice(0, 7);
    return vendas.filter((v) => {
      if (periodo === 'hoje') return v.data === hoje;
      if (periodo === 'mes') return v.data.slice(0, 7) === mesAtual;
      return true;
    });
  }, [vendas, periodo]);

  const m = useMemo(() => {
    let bruto = 0, taxas = 0, custo = 0, qtd = 0;
    const porCanal = {};
    filtradas.forEach((v) => {
      const canal = config.canais.find((c) => c.id === v.canalId);
      const t = taxaEfetiva(config, canal, v.pagamento) / 100;
      const totBruto = v.precoUnit * v.qtd;
      const totTaxa = totBruto * t;
      const totCusto = v.custoUnit * v.qtd;
      bruto += totBruto; taxas += totTaxa; custo += totCusto; qtd += v.qtd;
      const k = v.canalId;
      if (!porCanal[k]) porCanal[k] = { bruto: 0, liquido: 0, nome: canal?.nome || k, cor: canal?.cor || '#999' };
      porCanal[k].bruto += totBruto;
      porCanal[k].liquido += totBruto - totTaxa;
    });
    const liquido = bruto - taxas;
    const lucro = liquido - custo;
    return { bruto, taxas, liquido, custo, lucro, qtd, porCanal, pedidos: filtradas.length };
  }, [filtradas, config]);

  const metaPct = config.meta ? Math.min(100, (m.liquido / config.meta) * 100) : 0;
  const ticket = m.pedidos ? m.bruto / m.pedidos : 0;
  const margemReal = m.bruto ? (m.lucro / m.bruto) * 100 : 0;
  const canaisArr = Object.values(m.porCanal).sort((a, b) => b.bruto - a.bruto);

  // meta diária e quanto já saiu hoje (líquido)
  const metaDia = config.meta ? config.meta / 30 : 0;
  const liquidoHoje = useMemo(() => {
    const hoje = todayISO();
    return vendas.filter((v) => v.data === hoje).reduce((a, v) => {
      const canal = config.canais.find((c) => c.id === v.canalId);
      const t = taxaEfetiva(config, canal, v.pagamento) / 100;
      return a + v.precoUnit * v.qtd * (1 - t);
    }, 0);
  }, [vendas, config]);
  const faltaHoje = Math.max(0, metaDia - liquidoHoje);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-roxo-dark">Visão geral</h2>
        <div className="flex gap-1 bg-purple-100 p-1 rounded-xl">
          {[['hoje', 'Hoje'], ['mes', 'Este mês'], ['tudo', 'Tudo']].map(([k, l]) => (
            <button key={k} onClick={() => setPeriodo(k)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${periodo === k ? 'bg-white text-roxo shadow' : 'text-roxo-dark/60'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {m.pedidos === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-5xl mb-3">🍇</p>
          <p className="font-semibold text-gray-600">Nenhuma venda nesse período ainda.</p>
          <p className="text-sm text-gray-400 mt-1">Vá na aba <b>Vendas</b> e registre o primeiro pedido.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Faturamento bruto" value={brl(m.bruto)} sub={`${m.pedidos} pedidos · ${m.qtd} itens`} accent="roxo" />
            <KPI label="Entrou no caixa (líquido)" value={brl(m.liquido)} sub="depois das taxas" accent="verde" />
            <KPI label="Taxas pagas" value={brl(m.taxas)} sub={`${pct(m.bruto ? (m.taxas / m.bruto) * 100 : 0)} do bruto`} accent="red" />
            <KPI label="Lucro real" value={brl(m.lucro)} sub={`margem ${pct(margemReal)} · após insumos`} accent={m.lucro >= 0 ? 'verde' : 'red'} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Meta */}
            <Card className="p-5 lg:col-span-2">
              <div className="flex justify-between items-end mb-2">
                <p className="font-bold text-roxo-dark">Meta do mês (líquido)</p>
                <p className="text-sm text-gray-500">{brl(m.liquido)} / {brl(config.meta)}</p>
              </div>
              <div className="h-5 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-roxo to-verde flex items-center justify-end pr-2 transition-all duration-700"
                  style={{ width: `${Math.max(metaPct, 4)}%` }}>
                  <span className="text-[10px] font-bold text-white">{pct(metaPct)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Faltam <b>{brl(Math.max(0, config.meta - m.liquido))}</b> · ticket médio atual <b>{brl(ticket)}</b> →
                ~<b>{Math.ceil(Math.max(0, config.meta - m.liquido) / (ticket || 1))}</b> pedidos pra bater a meta.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-500">🎯 Meta do dia: <b className="text-roxo-dark">{brl(metaDia)}</b></span>
                <span className="text-xs text-gray-500">Hoje saiu <b className="text-verde-dark">{brl(liquidoHoje)}</b></span>
                <span className={`text-xs font-semibold ${faltaHoje <= 0 ? 'text-verde-dark' : 'text-amber-600'}`}>
                  {faltaHoje <= 0 ? '✓ meta do dia batida!' : `faltam ${brl(faltaHoje)} hoje`}
                </span>
              </div>
            </Card>

            <KPI label="Ticket médio" value={brl(ticket)} sub="por pedido" accent="amber" />
          </div>

          {/* Mix por canal */}
          <Card className="p-5">
            <p className="font-bold text-roxo-dark mb-3">Quanto cada canal trouxe</p>
            <div className="space-y-3">
              {canaisArr.map((c) => (
                <div key={c.nome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: c.cor }}>{c.nome}</span>
                    <span className="text-gray-500">bruto {brl(c.bruto)} · líquido <b className="text-gray-700">{brl(c.liquido)}</b></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.bruto ? (c.bruto / m.bruto) * 100 : 0}%`, background: c.cor }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================ VENDAS ============================ */
function Vendas({ state, setState }) {
  const { config, vendas } = state;
  const [form, setForm] = useState({
    produtoId: config.produtos[0]?.id || '',
    canalId: config.canais[0]?.id || '',
    qtd: 1,
    pagamento: 'pix',
    data: todayISO(),
  });

  const produto = config.produtos.find((p) => p.id === form.produtoId);
  const canal = config.canais.find((c) => c.id === form.canalId);
  const precoUnit = precoNoCanal(produto, form.canalId);
  const precoBase = produto?.preco || 0;
  const temOverride = Math.abs(precoUnit - precoBase) > 0.001;
  const t = taxaEfetiva(config, canal, form.pagamento);
  const bruto = precoUnit * form.qtd;
  const liquido = bruto * (1 - t / 100);
  const lucro = liquido - (produto?.custo || 0) * form.qtd;

  function registrar() {
    if (!produto || !canal) return;
    const venda = {
      id: uid(), data: form.data, produtoId: produto.id, canalId: canal.id,
      qtd: Number(form.qtd), pagamento: form.pagamento,
      precoUnit, custoUnit: produto.custo, nome: produto.nome,
    };
    setState((s) => ({ ...s, vendas: [venda, ...s.vendas] }));
    setForm((f) => ({ ...f, qtd: 1 }));
  }
  function remover(id) {
    setState((s) => ({ ...s, vendas: s.vendas.filter((v) => v.id !== id) }));
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="text-lg font-bold text-roxo-dark mb-4">Registrar venda</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Field label="Produto">
            <select className="inp" value={form.produtoId} onChange={(e) => setForm({ ...form, produtoId: e.target.value })}>
              {config.produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} — {brl(p.preco)}</option>)}
            </select>
          </Field>
          <Field label="Canal">
            <select className="inp" value={form.canalId} onChange={(e) => setForm({ ...form, canalId: e.target.value })}>
              {config.canais.map((c) => <option key={c.id} value={c.id}>{c.nome} ({pct(c.taxa)})</option>)}
            </select>
          </Field>
          <Field label="Pagamento">
            <select className="inp" value={form.pagamento} onChange={(e) => setForm({ ...form, pagamento: e.target.value })}>
              <option value="pix">Pix</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão (+{pct(config.cartaoTaxa)})</option>
            </select>
          </Field>
          <Field label="Quantidade">
            <input type="number" min="1" className="inp" value={form.qtd}
              onChange={(e) => setForm({ ...form, qtd: Math.max(1, Number(e.target.value)) })} />
          </Field>
          <Field label="Data">
            <input type="date" className="inp" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mt-4 p-3 bg-purple-50 rounded-xl">
          <div className="flex gap-5 text-sm flex-wrap items-center">
            <span>Preço un.: <b>{brl(precoUnit)}</b>{temOverride && <span className="text-[11px] text-roxo ml-1">(preço do canal)</span>}</span>
            <span>Bruto: <b>{brl(bruto)}</b></span>
            <span className="text-red-500">Taxa {pct(t)}: <b>-{brl(bruto - liquido)}</b></span>
            <span className="text-verde-dark">Você recebe: <b>{brl(liquido)}</b></span>
            <span className={lucro >= 0 ? 'text-verde-dark' : 'text-red-600'}>Lucro: <b>{brl(lucro)}</b></span>
          </div>
          <button onClick={registrar} className="bg-roxo hover:bg-roxo-dark text-white font-bold px-6 py-2.5 rounded-xl shadow transition">
            + Registrar
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-roxo-dark mb-3">Últimas vendas ({vendas.length})</h3>
        {vendas.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 font-semibold">Data</th>
                  <th className="font-semibold">Produto</th>
                  <th className="font-semibold">Canal</th>
                  <th className="font-semibold text-center">Qtd</th>
                  <th className="font-semibold text-right">Bruto</th>
                  <th className="font-semibold text-right">Líquido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vendas.slice(0, 60).map((v) => {
                  const c = config.canais.find((x) => x.id === v.canalId);
                  const tt = taxaEfetiva(config, c, v.pagamento);
                  const b = v.precoUnit * v.qtd;
                  return (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-purple-50/40">
                      <td className="py-2 text-gray-500">{v.data.split('-').reverse().join('/')}</td>
                      <td className="font-medium">{v.nome}</td>
                      <td><span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: c?.cor || '#999' }}>{c?.nome || '—'}</span></td>
                      <td className="text-center">{v.qtd}</td>
                      <td className="text-right">{brl(b)}</td>
                      <td className="text-right font-semibold text-verde-dark">{brl(b * (1 - tt / 100))}</td>
                      <td className="text-right">
                        <button onClick={() => remover(v.id)} className="text-gray-300 hover:text-red-500 px-2">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================ PRECIFICAÇÃO (orientação de valor) ============================ */
function Precificacao({ state, setState }) {
  const { config } = state;

  // Preço ideal pra atingir a margem alvo num canal:
  // lucro = margem*P  e  lucro = P*(1-t) - C  =>  P = C / (1 - t - margem)
  function precoIdeal(custo, taxaPct, margemPct) {
    const t = taxaPct / 100, m = margemPct / 100;
    const denom = 1 - t - m;
    if (denom <= 0) return null; // impossível com essa margem/taxa
    return custo / denom;
  }
  function margemReal(preco, custo, taxaPct) {
    const liquido = preco * (1 - taxaPct / 100);
    const lucro = liquido - custo;
    return preco ? (lucro / preco) * 100 : 0;
  }
  // arredonda pra cima ao próximo final ",90" (preço psicológico: 18,34 -> 18,90)
  const arredonda90 = (v) => { let c = Math.floor(v) + 0.90; if (c < v) c += 1; return c; };

  function aplicarPreco(pid, cid, valor) {
    setState((s) => ({ ...s, config: { ...s.config, produtos: s.config.produtos.map((x) =>
      x.id === pid ? { ...x, precos: { ...(x.precos || {}), [cid]: Number(valor.toFixed(2)) } } : x) } }));
  }
  function limparPreco(pid, cid) {
    setState((s) => ({ ...s, config: { ...s.config, produtos: s.config.produtos.map((x) => {
      if (x.id !== pid) return x;
      const np = { ...(x.precos || {}) }; delete np[cid]; return { ...x, precos: np };
    }) } }));
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-gradient-to-r from-roxo to-roxo-light text-white">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div>
            <h2 className="text-lg font-bold">💡 Orientação de valor</h2>
            <p className="text-sm text-purple-100 mt-0.5">
              Por quanto vender cada item pra <b>não ter prejuízo</b> e bater sua margem de lucro alvo em cada canal.
            </p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-medium">Margem de lucro alvo</span>
            <input type="number" min="0" max="80" value={config.margemAlvo}
              onChange={(e) => setState((s) => ({ ...s, config: { ...s.config, margemAlvo: Number(e.target.value) } }))}
              className="w-16 px-2 py-1 rounded-lg text-roxo-dark font-bold text-center" />
            <span className="font-bold">%</span>
          </div>
        </div>
      </Card>

      {config.produtos.map((p) => (
        <Card key={p.id} className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-roxo-dark text-lg">{p.nome}</h3>
              <p className="text-sm text-gray-500">
                Preço de tabela <b className="text-gray-700">{brl(p.preco)}</b> · custo de insumo{' '}
                <input type="number" step="0.10" value={p.custo}
                  onChange={(e) => setState((s) => ({
                    ...s, config: { ...s.config, produtos: s.config.produtos.map((x) => x.id === p.id ? { ...x, custo: Number(e.target.value) } : x) },
                  }))}
                  className="w-20 px-2 py-0.5 border rounded-md text-gray-700 font-semibold" />
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {config.canais.map((c) => {
              const precoCanal = precoNoCanal(p, c.id);
              const hasOverride = !!(p.precos && p.precos[c.id] != null && p.precos[c.id] !== '');
              const mReal = margemReal(precoCanal, p.custo, c.taxa);
              const ideal = precoIdeal(p.custo, c.taxa, config.margemAlvo);
              const sugestao = ideal === null ? null : arredonda90(ideal);
              const liquido = precoCanal * (1 - c.taxa / 100);
              const lucro = liquido - p.custo;
              const status = lucro < 0 ? 'prejuizo' : mReal < config.margemAlvo ? 'abaixo' : 'ok';
              const precisaAjuste = sugestao !== null && sugestao > precoCanal + 0.05;
              const cores = {
                prejuizo: 'border-red-300 bg-red-50',
                abaixo: 'border-amber-300 bg-amber-50',
                ok: 'border-verde/40 bg-green-50',
              };
              return (
                <div key={c.id} className={`rounded-xl border p-3 ${cores[status]}`}>
                  <p className="font-semibold text-sm" style={{ color: c.cor }}>{c.nome}</p>
                  <p className="text-[11px] text-gray-400 mb-2">taxa {pct(c.taxa)}</p>

                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-gray-500">Preço</span>
                    <span className="font-bold text-gray-800">{brl(precoCanal)}
                      {hasOverride && <span className="text-[10px] font-normal text-gray-400 ml-1">(base {brl(p.preco)})</span>}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <Row k="Você recebe" v={brl(liquido)} />
                    <Row k="Lucro/un." v={brl(lucro)} cls={lucro < 0 ? 'text-red-600 font-bold' : 'text-verde-dark font-bold'} />
                    <Row k="Margem real" v={pct(mReal)} cls={status === 'ok' ? 'text-verde-dark' : status === 'abaixo' ? 'text-amber-600' : 'text-red-600'} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/60">
                    {sugestao === null ? (
                      <p className="text-[11px] text-red-600 font-semibold">Margem inviável nesse canal (taxa alta demais)</p>
                    ) : precisaAjuste ? (
                      <button onClick={() => aplicarPreco(p.id, c.id, sugestao)}
                        className="w-full text-[11px] font-bold text-white bg-roxo hover:bg-roxo-dark rounded-lg py-1.5 transition">
                        Cobrar {brl(sugestao)} ↑
                      </button>
                    ) : (
                      <p className="text-[11px] text-verde-dark font-semibold text-center">✓ preço ok p/ {pct(config.margemAlvo)}</p>
                    )}
                    {hasOverride && (
                      <button onClick={() => limparPreco(p.id, c.id)}
                        className="w-full text-[10px] text-gray-400 hover:text-gray-600 mt-1">voltar ao preço base</button>
                    )}
                  </div>

                  {status === 'prejuizo' && <p className="text-[11px] text-red-600 font-bold mt-1">⚠️ Vendendo no prejuízo!</p>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Card className="p-4 bg-purple-50 border-purple-200">
        <p className="text-sm text-roxo-dark">
          <b>Como ler:</b> 🟢 verde = margem ok · 🟡 amarelo = dá lucro mas abaixo da meta · 🔴 vermelho = você
          <b> perde dinheiro</b> nesse canal. Dica de ouro: muitas açaiterias têm <b>preço diferente no iFood</b> (mais alto)
          pra compensar a comissão e manter o mesmo lucro do balcão.
        </p>
      </Card>
    </div>
  );
}

function Row({ k, v, cls = '' }) {
  return <div className="flex justify-between"><span className="text-gray-500">{k}</span><span className={cls}>{v}</span></div>;
}

/* ============================ CUSTOS (ficha técnica) ============================ */
function Custos({ state, setState }) {
  const { config } = state;
  const ins = config.insumos;

  const updIns = (patch) => setState((s) => ({ ...s, config: { ...s.config, insumos: { ...s.config.insumos, ...patch } } }));
  const updFicha = (id, patch) => setState((s) => ({
    ...s, config: { ...s.config, produtos: s.config.produtos.map((p) => p.id === id ? { ...p, ficha: { ...p.ficha, ...patch } } : p) },
  }));

  // aplica o CMV calculado da ficha ao custo de cada produto
  function aplicar() {
    setState((s) => ({
      ...s, config: {
        ...s.config,
        produtos: s.config.produtos.map((p) => ({ ...p, custo: Number(cmvDaFicha(s.config.insumos, p.ficha).toFixed(2)) })),
      },
    }));
  }

  const algumDivergente = config.produtos.some((p) => Math.abs(cmvDaFicha(ins, p.ficha) - p.custo) > 0.015);

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-gradient-to-r from-verde to-verde-light text-white">
        <h2 className="text-lg font-bold">🧾 Ficha técnica — custo real</h2>
        <p className="text-sm text-green-50 mt-0.5">Coloque o preço dos seus insumos e a gramatura de cada tamanho. O sistema calcula o CMV de cada açaí e leva pra precificação.</p>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-roxo-dark mb-3">Preço dos insumos</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Açaí / creme (R$ por kg)">
            <input type="number" step="0.5" className="inp" value={ins.acaiKg} onChange={(e) => updIns({ acaiKg: Number(e.target.value) })} />
          </Field>
          <Field label="Copo+colher+guardanapo (R$)">
            <input type="number" step="0.01" className="inp" value={ins.colher} onChange={(e) => updIns({ colher: Number(e.target.value) })} />
          </Field>
          <Field label="1 cobertura (R$)">
            <input type="number" step="0.05" className="inp" value={ins.coberturaPorcao} onChange={(e) => updIns({ coberturaPorcao: Number(e.target.value) })} />
          </Field>
          <Field label="1 complemento (R$)">
            <input type="number" step="0.05" className="inp" value={ins.complementoPorcao} onChange={(e) => updIns({ complementoPorcao: Number(e.target.value) })} />
          </Field>
        </div>
        <p className="text-xs text-gray-400 mt-2">Dica: o "copo+colher" do campo acima é o fixo por copo; o copo específico de cada tamanho fica na tabela abaixo.</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h3 className="font-bold text-roxo-dark">Composição por tamanho</h3>
          <button onClick={aplicar}
            className={`font-bold px-4 py-2 rounded-xl text-sm transition ${algumDivergente ? 'bg-verde hover:bg-verde-dark text-white shadow' : 'bg-gray-100 text-gray-400'}`}>
            {algumDivergente ? '↻ Aplicar custos calculados' : '✓ Custos sincronizados'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 font-semibold">Tamanho</th>
              <th className="font-semibold">Açaí (g)</th>
              <th className="font-semibold">Copo (R$)</th>
              <th className="font-semibold text-center">Cob.</th>
              <th className="font-semibold text-center">Compl.</th>
              <th className="font-semibold text-right">CMV calculado</th>
              <th className="font-semibold text-right">% do preço</th>
            </tr></thead>
            <tbody>
              {config.produtos.map((p) => {
                const cmv = cmvDaFicha(ins, p.ficha);
                const cmvPct = p.preco ? (cmv / p.preco) * 100 : 0;
                const f = p.ficha || {};
                const corPct = cmvPct > 40 ? 'text-red-600' : cmvPct > 33 ? 'text-amber-600' : 'text-verde-dark';
                return (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{p.nome}</td>
                    <td><input type="number" step="10" className="inp w-20" value={f.gramas} onChange={(e) => updFicha(p.id, { gramas: Number(e.target.value) })} /></td>
                    <td><input type="number" step="0.05" className="inp w-20" value={f.copo} onChange={(e) => updFicha(p.id, { copo: Number(e.target.value) })} /></td>
                    <td className="text-center"><input type="number" step="1" min="0" className="inp w-14 text-center" value={f.coberturas} onChange={(e) => updFicha(p.id, { coberturas: Number(e.target.value) })} /></td>
                    <td className="text-center"><input type="number" step="1" min="0" className="inp w-14 text-center" value={f.complementos} onChange={(e) => updFicha(p.id, { complementos: Number(e.target.value) })} /></td>
                    <td className="text-right font-bold text-gray-700">{brl(cmv)}</td>
                    <td className={`text-right font-semibold ${corPct}`}>{pct(cmvPct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">CMV saudável de açaiteria fica entre <b>28% e 35%</b> do preço. 🟢 abaixo de 33% · 🟡 33-40% · 🔴 acima de 40% (aperta a margem).</p>
      </Card>
    </div>
  );
}

/* ============================ RELATÓRIOS (evolução) ============================ */
function Relatorios({ state }) {
  const { config, vendas } = state;
  const [escopo, setEscopo] = useState('mes'); // mes | 30d

  const dias = useMemo(() => {
    const hoje = new Date();
    let chaves = [];
    if (escopo === 'mes') {
      const y = hoje.getFullYear(), mth = hoje.getMonth();
      const n = new Date(y, mth + 1, 0).getDate();
      for (let d = 1; d <= n; d++) chaves.push(`${y}-${String(mth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    } else {
      for (let k = 29; k >= 0; k--) {
        const dt = new Date(hoje); dt.setDate(hoje.getDate() - k);
        chaves.push(dt.toISOString().slice(0, 10));
      }
    }
    const map = {};
    chaves.forEach((c) => (map[c] = { data: c, liquido: 0, lucro: 0, bruto: 0, pedidos: 0 }));
    vendas.forEach((v) => {
      if (!map[v.data]) return;
      const canal = config.canais.find((c) => c.id === v.canalId);
      const t = taxaEfetiva(config, canal, v.pagamento) / 100;
      const b = v.precoUnit * v.qtd;
      const liq = b * (1 - t);
      map[v.data].bruto += b;
      map[v.data].liquido += liq;
      map[v.data].lucro += liq - v.custoUnit * v.qtd;
      map[v.data].pedidos += 1;
    });
    return chaves.map((c) => map[c]);
  }, [vendas, config, escopo]);

  const tot = dias.reduce((a, d) => ({ liquido: a.liquido + d.liquido, lucro: a.lucro + d.lucro, pedidos: a.pedidos + d.pedidos }), { liquido: 0, lucro: 0, pedidos: 0 });
  const diasComVenda = dias.filter((d) => d.pedidos > 0).length;
  const mediaDia = diasComVenda ? tot.liquido / diasComVenda : 0;
  const melhorDia = dias.reduce((a, d) => (d.liquido > a.liquido ? d : a), { liquido: 0, data: '—' });
  const max = Math.max(...dias.map((d) => d.liquido), 1);

  // projeção do mês: média/dia ativo × dias do mês
  const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projecao = mediaDia * diasNoMes;
  const projPct = config.meta ? Math.min(100, (projecao / config.meta) * 100) : 0;

  const W = 760, H = 220, pad = 28;
  const bw = (W - pad * 2) / dias.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-roxo-dark">Evolução</h2>
        <div className="flex gap-1 bg-purple-100 p-1 rounded-xl">
          {[['mes', 'Mês atual'], ['30d', 'Últimos 30 dias']].map(([k, l]) => (
            <button key={k} onClick={() => setEscopo(k)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${escopo === k ? 'bg-white text-roxo shadow' : 'text-roxo-dark/60'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Líquido no período" value={brl(tot.liquido)} sub={`${tot.pedidos} pedidos`} accent="verde" />
        <KPI label="Lucro no período" value={brl(tot.lucro)} accent={tot.lucro >= 0 ? 'verde' : 'red'} />
        <KPI label="Média por dia ativo" value={brl(mediaDia)} sub={`${diasComVenda} dias com venda`} accent="roxo" />
        <KPI label="Melhor dia" value={brl(melhorDia.liquido)} sub={melhorDia.data !== '—' ? melhorDia.data.split('-').reverse().join('/') : '—'} accent="amber" />
      </div>

      <Card className="p-5">
        <p className="font-bold text-roxo-dark mb-3">Líquido por dia</p>
        {tot.pedidos === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">Sem vendas nesse período. Registre vendas pra ver o gráfico crescer. 📈</p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 260 }}>
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <g key={g}>
                <line x1={pad} x2={W - pad} y1={H - pad - g * (H - pad * 2)} y2={H - pad - g * (H - pad * 2)} stroke="#f0e9f7" />
                <text x={4} y={H - pad - g * (H - pad * 2) + 3} fontSize="8" fill="#bbb">{Math.round(max * g)}</text>
              </g>
            ))}
            {dias.map((d, i) => {
              const h = (d.liquido / max) * (H - pad * 2);
              const x = pad + i * bw;
              const day = d.data.slice(8);
              return (
                <g key={d.data}>
                  <rect x={x + bw * 0.15} y={H - pad - h} width={bw * 0.7} height={h} rx="2"
                    fill="url(#grad)">
                    <title>{d.data.split('-').reverse().join('/')}: {brl(d.liquido)} líquido · {d.pedidos} ped.</title>
                  </rect>
                  {(dias.length <= 31 && (Number(day) % (dias.length > 16 ? 3 : 1) === 0)) &&
                    <text x={x + bw / 2} y={H - pad + 10} fontSize="7" fill="#aaa" textAnchor="middle">{Number(day)}</text>}
                </g>
              );
            })}
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9D4ED8" />
                <stop offset="100%" stopColor="#5FA82B" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex justify-between items-end mb-2">
          <p className="font-bold text-roxo-dark">Projeção do mês</p>
          <p className="text-sm text-gray-500">{brl(projecao)} / {brl(config.meta)}</p>
        </div>
        <div className="h-5 bg-purple-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-roxo to-verde flex items-center justify-end pr-2 transition-all duration-700" style={{ width: `${Math.max(projPct, 4)}%` }}>
            <span className="text-[10px] font-bold text-white">{pct(projPct)}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          No ritmo atual ({brl(mediaDia)}/dia ativo) você fecha o mês em <b>{brl(projecao)}</b> de líquido —{' '}
          {projecao >= config.meta
            ? <span className="text-verde-dark font-semibold">acima da meta de {brl(config.meta)}! 🎉</span>
            : <span className="text-amber-600 font-semibold">faltam {brl(config.meta - projecao)} pra meta. Suba o ticket ou os pedidos/dia.</span>}
        </p>
      </Card>
    </div>
  );
}

/* ============================ CONFIG ============================ */
function Config({ state, setState }) {
  const { config } = state;
  const upd = (patch) => setState((s) => ({ ...s, config: { ...s.config, ...patch } }));

  function updCanal(id, patch) {
    upd({ canais: config.canais.map((c) => c.id === id ? { ...c, ...patch } : c) });
  }
  function updProduto(id, patch) {
    upd({ produtos: config.produtos.map((p) => p.id === id ? { ...p, ...patch } : p) });
  }
  function exportar() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `garagem-acai-backup-${todayISO()}.json`;
    a.click();
  }
  function importar(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { setState(JSON.parse(r.result)); alert('Backup importado!'); } catch { alert('Arquivo inválido.'); } };
    r.readAsText(file);
  }
  function resetar() {
    if (confirm('Apagar TODAS as vendas e voltar à configuração padrão? Isso não tem volta.')) {
      setState(structuredClone(DEFAULT_STATE));
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-roxo-dark mb-3">Metas e taxas gerais</h3>
          <Field label="Meta de líquido por mês (R$)">
            <input type="number" className="inp" value={config.meta} onChange={(e) => upd({ meta: Number(e.target.value) })} />
          </Field>
          <Field label="Margem de lucro alvo (%)" className="mt-3">
            <input type="number" className="inp" value={config.margemAlvo} onChange={(e) => upd({ margemAlvo: Number(e.target.value) })} />
          </Field>
          <Field label="Taxa da maquininha / cartão (%)" className="mt-3">
            <input type="number" step="0.1" className="inp" value={config.cartaoTaxa} onChange={(e) => upd({ cartaoTaxa: Number(e.target.value) })} />
          </Field>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-roxo-dark mb-3">Canais e comissões</h3>
          <div className="space-y-2">
            {config.canais.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: c.cor }}></span>
                <input className="inp flex-1" value={c.nome} onChange={(e) => updCanal(c.id, { nome: e.target.value })} />
                <div className="flex items-center gap-1">
                  <input type="number" step="0.5" className="inp w-20 text-center" value={c.taxa} onChange={(e) => updCanal(c.id, { taxa: Number(e.target.value) })} />
                  <span className="text-gray-400 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Comissão real do iFood varia por plano (12% retirada · ~23-27% entrega). Ajuste com a sua fatura.</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-roxo-dark mb-3">Produtos — preço e custo de insumo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 font-semibold">Produto</th>
              <th className="font-semibold">Preço (R$)</th>
              <th className="font-semibold">Custo insumo (R$)</th>
              <th className="font-semibold">CMV</th>
            </tr></thead>
            <tbody>
              {config.produtos.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2"><input className="inp w-40" value={p.nome} onChange={(e) => updProduto(p.id, { nome: e.target.value })} /></td>
                  <td><input type="number" step="0.5" className="inp w-24" value={p.preco} onChange={(e) => updProduto(p.id, { preco: Number(e.target.value) })} /></td>
                  <td><input type="number" step="0.1" className="inp w-24" value={p.custo} onChange={(e) => updProduto(p.id, { custo: Number(e.target.value) })} /></td>
                  <td className="text-gray-500">{pct(p.preco ? (p.custo / p.preco) * 100 : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TrocarSenha />

      <Card className="p-5">
        <h3 className="font-bold text-roxo-dark mb-3">Backup dos dados</h3>
        <p className="text-sm text-gray-500 mb-3">Os dados ficam salvos só neste navegador. Exporte de vez em quando pra não perder.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={exportar} className="bg-verde hover:bg-verde-dark text-white font-semibold px-4 py-2 rounded-xl">⬇ Exportar backup</button>
          <label className="bg-roxo hover:bg-roxo-dark text-white font-semibold px-4 py-2 rounded-xl cursor-pointer">
            ⬆ Importar backup<input type="file" accept=".json" className="hidden" onChange={importar} />
          </label>
          <button onClick={resetar} className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-xl ml-auto">🗑 Zerar tudo</button>
        </div>
      </Card>
    </div>
  );
}

/* ============================ CAMPOS ============================ */
function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-gray-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

/* ============================ TROCAR SENHA ============================ */
function TrocarSenha() {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [conf, setConf] = useState('');
  const [msg, setMsg] = useState(null); // { tipo: 'ok'|'erro', texto }

  async function salvar(e) {
    e.preventDefault();
    if (!(await conferirSenha(atual))) return setMsg({ tipo: 'erro', texto: 'Senha atual incorreta.' });
    if (nova.length < 4) return setMsg({ tipo: 'erro', texto: 'A nova senha precisa de ao menos 4 caracteres.' });
    if (nova !== conf) return setMsg({ tipo: 'erro', texto: 'A confirmação não bate com a nova senha.' });
    await definirSenha(nova);
    setAtual(''); setNova(''); setConf('');
    setMsg({ tipo: 'ok', texto: 'Senha alterada! Use a nova no próximo login.' });
  }

  return (
    <Card className="p-5">
      <h3 className="font-bold text-roxo-dark mb-1">🔒 Acesso & senha</h3>
      <p className="text-sm text-gray-500 mb-1">Login do dono: <b className="text-gray-700">{emailAtual()}</b></p>
      <p className="text-sm text-gray-500 mb-3">Só quem tem e-mail + senha entra no sistema. Troque a senha quando quiser.</p>
      <form onSubmit={salvar} className="grid sm:grid-cols-3 gap-3">
        <Field label="Senha atual"><input type="password" className="inp" value={atual} onChange={(e) => setAtual(e.target.value)} /></Field>
        <Field label="Nova senha"><input type="password" className="inp" value={nova} onChange={(e) => setNova(e.target.value)} /></Field>
        <Field label="Confirmar nova"><input type="password" className="inp" value={conf} onChange={(e) => setConf(e.target.value)} /></Field>
        <div className="sm:col-span-3 flex items-center gap-3 flex-wrap">
          <button type="submit" className="bg-roxo hover:bg-roxo-dark text-white font-semibold px-4 py-2 rounded-xl">Salvar nova senha</button>
          {msg && <span className={`text-sm font-medium ${msg.tipo === 'ok' ? 'text-verde-dark' : 'text-red-600'}`}>{msg.tipo === 'ok' ? '✓' : '⚠️'} {msg.texto}</span>}
        </div>
      </form>
      <p className="text-[11px] text-gray-400 mt-3">A senha fica guardada só neste navegador (em formato protegido/hash). Em outro aparelho, defina novamente.</p>
    </Card>
  );
}

/* ============================ LOGIN (acesso do dono) ============================ */
function Login({ onOk }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setCarregando(true); setErro('');
    const ok = await conferirCredenciais(email, pwd);
    setCarregando(false);
    if (ok) { entrar(); onOk(); }
    else { setErro('E-mail ou senha incorretos. Tente de novo.'); setPwd(''); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-roxo to-verde flex items-center justify-center text-4xl shadow-xl mx-auto mb-4">🍇</div>
          <h1 className="text-2xl font-extrabold text-roxo-dark">Garagem do Açaí</h1>
          <p className="text-sm text-gray-400">Área restrita — acesso do dono 🔒</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-3">
            <Field label="E-mail">
              <input type="email" autoFocus autoComplete="username" className="inp" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            </Field>
            <Field label="Senha">
              <input type="password" autoComplete="current-password" className="inp" value={pwd}
                onChange={(e) => setPwd(e.target.value)} placeholder="Digite sua senha" />
            </Field>
            {erro && <p className="text-sm text-red-600 font-medium">⚠️ {erro}</p>}
            <button type="submit" disabled={carregando || !pwd || !email}
              className="w-full mt-1 bg-roxo hover:bg-roxo-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow transition">
              {carregando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </Card>
        <p className="text-center text-[11px] text-gray-300 mt-4">Sistema CONECTEI · acesso protegido</p>
      </div>
    </div>
  );
}

/* ============================ ROOT (porteiro: login ↔ app) ============================ */
function Root() {
  const [logado, setLogado] = useState(estaLogado());
  if (!logado) return <Login onOk={() => setLogado(true)} />;
  return <App onLogout={() => { sair(); setLogado(false); }} />;
}

/* ============================ APP ============================ */
function App({ onLogout }) {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('dash');
  useEffect(() => { saveState(state); }, [state]);

  const tabs = [
    ['dash', '📊 Dashboard'],
    ['vendas', '🛒 Vendas'],
    ['preco', '💡 Precificação'],
    ['custos', '🧾 Custos'],
    ['relatorios', '📈 Relatórios'],
    ['config', '⚙️ Config'],
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-roxo to-verde flex items-center justify-center text-2xl shadow-lg">🍇</div>
          <div>
            <h1 className="text-xl font-extrabold text-roxo-dark leading-tight">Garagem do Açaí</h1>
            <p className="text-xs text-gray-400 font-medium">Gestão financeira & precificação · Imperatriz-MA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 bg-white px-3 py-1.5 rounded-full border border-purple-100 hidden sm:inline">
            CONECTEI · dados salvos localmente
          </span>
          <button onClick={onLogout}
            className="text-xs font-semibold text-roxo-dark bg-white border border-purple-100 hover:border-roxo/50 hover:text-roxo px-3 py-1.5 rounded-full transition">
            🔒 Sair
          </button>
        </div>
      </header>

      <nav className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition ${tab === k ? 'bg-roxo text-white shadow-lg shadow-roxo/20' : 'bg-white text-roxo-dark/70 border border-purple-100 hover:border-roxo/40'}`}>
            {l}
          </button>
        ))}
      </nav>

      {tab === 'dash' && <Dashboard state={state} />}
      {tab === 'vendas' && <Vendas state={state} setState={setState} />}
      {tab === 'preco' && <Precificacao state={state} setState={setState} />}
      {tab === 'custos' && <Custos state={state} setState={setState} />}
      {tab === 'relatorios' && <Relatorios state={state} />}
      {tab === 'config' && <Config state={state} setState={setState} />}

      <footer className="text-center text-xs text-gray-300 mt-10 pb-4">
        Sistema CONECTEI · Garagem do Açaí · todos os dados ficam no seu navegador
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
