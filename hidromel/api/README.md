# Backend — instalação passo a passo

Do zero até vender, em ~40 minutos. Nenhuma etapa exige saber programar.

---

## O que este backend faz

```
Cliente paga
   │
   ▼
Mercado Pago avisa o Worker  ──► confere a assinatura (senão, ignora)
   │
   ▼
Worker gera credencial ÚNICA  ──► MEAD-7K3Q-92XR-B4TL
   │                              + link individual assinado
   ▼
Grava no KV  ──► e-mail sai pelo Resend
   │
   ▼
Cliente clica no link e entra direto
```

---

## Passo 1 — Cloudflare

Crie a conta em [dash.cloudflare.com](https://dash.cloudflare.com) (gratuita) e instale
o utilitário:

```bash
npm install -g wrangler
wrangler login
```

Crie o banco de chave-valor:

```bash
cd hidromel/api
npx wrangler kv namespace create ALUNOS
```

Copie o `id` que aparecer e cole em `wrangler.toml`, no lugar de `COLE_AQUI_O_ID_DO_KV`.

---

## Passo 2 — Mercado Pago

1. Entre em [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel)
2. Crie uma aplicação → **Pagamentos online** → **CheckoutAPI**
3. Em **Credenciais de produção**, copie o **Access Token**
4. Em **Webhooks**, cadastre a URL:
   `https://SEU-WORKER.workers.dev/api/webhook/mercadopago`
   marcando o evento **Pagamentos**
5. O painel gera uma **chave secreta** do webhook — copie também

> **A chave secreta não é opcional.** Sem ela o Worker recusa todo webhook
> (é o comportamento correto): qualquer pessoa que descobrisse a URL poderia
> liberar acesso de graça com um POST.

---

## Passo 3 — E-mail (Resend)

1. Crie conta em [resend.com](https://resend.com) — 3.000 e-mails/mês grátis
2. Adicione e **verifique seu domínio** (registros SPF/DKIM no DNS)
3. Gere uma API key

> Verificar o domínio importa: e-mail de acesso enviado de domínio não
> verificado cai em spam, e aí o cliente pagou e acha que foi golpe.
> Se o e-mail falhar, o acesso **não** se perde — o código aparece na tela
> da página de obrigado e fica gravado no KV.

---

## Passo 4 — Segredos

```bash
# Chave que assina os tokens. Gere assim e guarde:
openssl rand -base64 48

npx wrangler secret put SEGREDO
npx wrangler secret put MP_ACCESS_TOKEN
npx wrangler secret put MP_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY

# Só se for usar Kirvano/Cakto/Hotmart:
npx wrangler secret put WEBHOOK_TOKEN_PLATAFORMA
```

> Trocar `SEGREDO` depois derruba a sessão de todos os alunos (eles entram de
> novo com o código — nada se perde). Trocar não é problema; perder é.

---

## Passo 5 — Publicar

```bash
npx wrangler deploy
```

Anote a URL que aparecer e:

1. cole em `wrangler.toml` → `URL_PUBLICA`, e publique de novo;
2. cole em `../assets/js/config.js` → `API_URL`.

Assim que `API_URL` deixar de ser vazia, o site sai do modo demonstração.

---

## Passo 6 — Conferir

```bash
curl https://SEU-WORKER.workers.dev/api/saude
```

Esperado:

```json
{"ok":true,"kv":true,"mp":true,"webhookAssinado":true,"email":true}
```

Qualquer `false` aponta o que ficou faltando.

---

## Passo 7 — Teste de ponta a ponta antes de anunciar

Não pule. É o passo que separa "está no ar" de "está vendendo".

1. Use as **credenciais de teste** do Mercado Pago (não as de produção).
2. Compre o plano Iniciado com um e-mail seu.
3. Pague o Pix de teste.
4. Confirme, nesta ordem:
   - a página de obrigado virou "aprovado" sozinha, sem recarregar;
   - o e-mail chegou (**e não na caixa de spam**);
   - o link do e-mail entra direto, sem pedir senha;
   - o código funciona numa aba anônima;
   - a área de membros abriu só os módulos do plano comprado;
   - o 3º dispositivo foi recusado no plano Iniciado (limite de 2).
5. Troque para as credenciais de produção e faça **uma compra real de R$ 47**
   com seu próprio cartão. Depois estorne. É o único teste que prova que
   produção funciona.

---

## Rotas

| Método | Rota | Para que serve |
|---|---|---|
| GET  | `/api/saude` | diagnóstico da configuração |
| POST | `/api/pedido` | cria a cobrança Pix ou a preferência de cartão |
| GET  | `/api/pedido/:id` | a página de obrigado consulta o status aqui |
| POST | `/api/webhook/mercadopago` | Mercado Pago avisa o pagamento (assinado) |
| POST | `/api/webhook/kirvano` \| `/cakto` \| `/hotmart` | plataformas externas (token no cabeçalho) |
| POST | `/api/entrar` | login com e-mail + código |
| POST | `/api/entrar/token` | login pelo link individual do e-mail |
| POST | `/api/eu` | revalida a sessão guardada |

---

## Decisões de segurança, e por quê

| Decisão | Motivo |
|---|---|
| Assinatura HMAC no webhook do MP | sem ela, um POST na URL libera acesso de graça |
| Comparação em tempo constante | `a === b` vaza o prefixo correto pelo tempo e permite forjar a assinatura byte a byte |
| Idempotência por `pedidoId` | o MP reenvia webhook; sem isso o aluno recebe dois códigos |
| `X-Idempotency-Key` na criação | falha de rede não gera cobrança dupla |
| Timestamp com janela de 10 min | bloqueia reenvio de um webhook capturado |
| Mesmo erro para código inexistente e e-mail errado | "código existe mas e-mail errado" entrega metade do segredo |
| Alfabeto sem I, O, 0, 1 | o cliente digita o código do e-mail no celular; ambiguidade vira ticket de suporte |
| Limite por IP | impede que um script encha o painel do MP de cobranças |
| Plano lido do KV, não do token | upgrade vale na hora; token antigo não congela o plano |
| Cartão via Checkout Pro | o MP hospeda o formulário e assume o PCI — nunca trafegamos número de cartão |

---

## Custo mensal real

| Serviço | Faixa gratuita | Quando começa a custar |
|---|---|---|
| Cloudflare Workers | 100.000 req/dia | praticamente nunca, nesse volume |
| Cloudflare KV | 100.000 leituras/dia | idem |
| Resend | 3.000 e-mails/mês | acima de ~3.000 vendas/mês |
| Mercado Pago | — | 0,99% no Pix, 4,98% no cartão |

Para até algumas centenas de vendas por mês, a infraestrutura custa **R$ 0**.
