# Pagamento — qual escolher e por quê

O requisito era "método de pagamento que realmente venha a funcionar". Este
documento mostra a conta, a decisão e como trocar de ideia depois sem reescrever
nada.

---

## O que o mercado brasileiro realmente usa

Em infoproduto no Brasil, **o Pix domina**. Ele aprova em segundos, não tem
chargeback e cobra a menor taxa do mercado. Cartão existe para quem precisa
parcelar — e parcelar aumenta o ticket que a pessoa aceita pagar.

Por isso o checkout deste projeto abre **com o Pix selecionado** e oferece
**10% de desconto à vista**. O desconto se paga sozinho: a diferença de taxa
entre Pix e cartão já é maior que ele.

---

## Comparativo

| Plataforma | Taxa Pix | Taxa cartão | Dinheiro na conta | Emite NF / trata imposto | Mensalidade |
|---|---|---|---|---|---|
| **Mercado Pago (direto)** | **0,99%** | 4,98% na hora / 3,79% em 14d | imediato (Pix) | **não — é você** | R$ 0 |
| Cakto | ~0% a 4% | ~3,99% | D+2 a D+15 | sim | R$ 0 |
| Kirvano | ~4% a 8% | ~5% a 8% | D+2 a D+30 | sim | R$ 0 |
| Kiwify | ~7% + R$ 1 | ~7% + R$ 1 | D+2 a D+15 | sim | R$ 0 |
| Hotmart | 9,9% + R$ 1 (Starter) | idem | D+2 a D+30 | sim | R$ 0 ou R$ 99+ |

*Taxas de referência coletadas em 2026. Confirme na plataforma antes de decidir —
elas mudam sem aviso.*

### Quanto isso custa de verdade

Numa venda de R$ 197 no Pix:

| Plataforma | Taxa | Você recebe | Diferença |
|---|---|---|---|
| Mercado Pago | R$ 1,95 | **R$ 195,05** | — |
| Cakto | ~R$ 7,88 | R$ 189,12 | −R$ 5,93 |
| Kiwify | ~R$ 14,79 | R$ 182,21 | −R$ 12,84 |
| Hotmart | ~R$ 20,50 | R$ 176,50 | −R$ 18,55 |

**Em 300 vendas, a diferença entre Mercado Pago e Hotmart é de R$ 5.565.**

---

## A decisão: Mercado Pago direto

**Por quê:**

1. **Menor taxa do mercado no Pix** — 0,99%.
2. **Dinheiro na conta na hora**, não em D+15. Capital de giro importa quando se
   está investindo em tráfego pago diariamente.
3. **A relação com o cliente é sua.** Você tem o e-mail, o histórico e o canal.
   Em marketplace, o cliente é da plataforma.
4. **Cartão sem risco de PCI** — o formulário é hospedado pelo Mercado Pago
   (Checkout Pro). Número de cartão nunca passa pela nossa infraestrutura.

**O que fica por sua conta** — e é justo dizer:

- emitir nota fiscal (o marketplace faria isso por você);
- recolher os impostos;
- responder por chargeback no cartão;
- dar suporte de pagamento.

Se você prefere não lidar com nada disso, **Cakto ou Kirvano** são escolhas
razoáveis. A diferença de taxa é o preço da conveniência — e o código já suporta
as duas.

---

## Trocar de plataforma sem reescrever nada

O Worker tem endpoints de webhook prontos para as quatro. Para migrar:

### Opção A — checkout próprio (recomendado)

```js
// assets/js/config.js
MODO_CHECKOUT: 'proprio',
API_URL: 'https://sua-api.workers.dev',
```

### Opção B — checkout externo

```js
MODO_CHECKOUT: 'externo',
LINKS_EXTERNOS: {
  iniciado: 'https://pay.cakto.com.br/xxxx',
  mestre:   'https://pay.cakto.com.br/yyyy',
  real:     'https://pay.cakto.com.br/zzzz',
},
```

E na plataforma, cadastre o webhook apontando para:

```
https://sua-api.workers.dev/api/webhook/cakto?token=SEU_TOKEN
```

Mapeie as ofertas para os planos em `wrangler.toml`:

```toml
PLANOS_EXTERNOS = '{"id-oferta-1":"iniciado","id-oferta-2":"mestre"}'
```

**A geração de credencial única, o e-mail de acesso e a área de membros
continuam exatamente iguais.** Só muda quem processa o dinheiro.

> Antes de abrir vendas por uma plataforma externa, dispare um evento de teste
> pelo painel dela e confira o formato real do payload. Kirvano, Cakto e Hotmart
> mudam nomes de campo sem aviso — a normalização está em `worker.js`, função
> `rotaWebhookPlataforma`, e é fácil de ajustar.

---

## Fluxo de uma venda por Pix

```
Cliente preenche o checkout
   ↓
POST /api/pedido           valida CPF, e-mail, plano · limite por IP
   ↓
Mercado Pago cria a cobrança  (X-Idempotency-Key evita cobrança dupla)
   ↓
Cliente vai para obrigado.html — QR + copia e cola + contagem de expiração
   ↓
Cliente paga
   ↓
Mercado Pago chama o webhook  ──► assinatura HMAC conferida
   ↓                               timestamp dentro de 10 min
   ↓                               idempotência por pedido
Credencial única gerada + gravada + e-mail enviado
   ↓
A página de obrigado detecta sozinha (consulta a cada 5 s) e mostra o código
   ↓
Cliente clica e entra — sem digitar senha
```

Tempo total entre o pagamento e o acesso: **poucos segundos**.

---

## Testes obrigatórios antes de anunciar

| # | Teste | Como | Resultado esperado |
|---|---|---|---|
| 1 | Saúde da API | `curl .../api/saude` | tudo `true` |
| 2 | Pix de teste | credenciais de sandbox do MP | QR aparece, aprova, e-mail chega |
| 3 | Cartão de teste | cartões de teste do MP | redireciona e volta aprovado |
| 4 | Webhook duplicado | reenviar pelo painel do MP | mesmo código, sem duplicar |
| 5 | Webhook forjado | POST sem assinatura | **401**, nada liberado |
| 6 | E-mail | Gmail, Outlook e iCloud | **caixa de entrada**, não spam |
| 7 | Limite de dispositivos | entrar em 3 navegadores no Iniciado | o 3º é recusado |
| 8 | **Compra real** | seu próprio cartão, R$ 47, depois estorne | é o único teste que prova produção |

O teste 8 não é opcional. Sandbox aprova coisas que produção recusa.

Os testes 4, 5 e 7 já rodam automaticamente:

```bash
node scripts/testar-worker.mjs     # 62 verificações
```

---

## Custo operacional mensal

| Item | Faixa gratuita | Quando passa a custar |
|---|---|---|
| Cloudflare Workers | 100 mil requisições/dia | praticamente nunca nesse volume |
| Cloudflare KV | 100 mil leituras/dia | idem |
| Resend | 3 mil e-mails/mês | acima de ~3 mil vendas/mês |
| Domínio | — | ~R$ 40/ano |
| Hospedagem do site estático | GitHub Pages / Netlify | grátis |
| Panda Video (aulas) | — | a partir de ~R$ 100/mês |

**Infraestrutura de venda: R$ 0/mês** até algumas centenas de vendas mensais.
O único custo relevante é a hospedagem dos vídeos, e ela só faz sentido depois
que houver aulas gravadas.
