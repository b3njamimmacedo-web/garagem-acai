# Publicar na Vercel

O site é estático puro — não tem build, não tem dependência. Publicar é
literalmente copiar a pasta. O que exige atenção é o **diretório raiz**, porque
este repositório tem dois projetos.

---

## O detalhe que quebra na primeira tentativa

O repositório tem o app **Garagem do Açaí** na raiz (Vite + React) e a plataforma
**Hidromel de Reis** em `hidromel/`.

Se você apontar a Vercel para o repositório e mandar detectar sozinha, ela acha
o `package.json` da raiz, identifica Vite, roda `npm run build` e publica **o app
de açaí**. O site de hidromel não aparece.

**A correção é uma configuração:** em *Settings → General → Root Directory*,
coloque `hidromel`. O `vercel.json` que está lá dentro assume o resto.

---

## Caminho A — pela interface (5 minutos, sem instalar nada)

1. Entre em [vercel.com/new](https://vercel.com/new) e conecte sua conta do GitHub.
2. Escolha o repositório `b3njamimmacedo-web/garagem-acai`.
3. Na tela de configuração:

   | Campo | Valor |
   |---|---|
   | **Root Directory** | `hidromel` ← **o passo que importa** |
   | Framework Preset | `Other` |
   | Build Command | *deixe vazio* |
   | Output Directory | *deixe vazio* |
   | Install Command | *deixe vazio* |

4. **Deploy**.

Sai no ar em `https://<nome>.vercel.app`, com as páginas em:

| | |
|---|---|
| Vendas | `/` |
| Área de membros | `/curso/` |
| Pós-compra | `/obrigado.html` |
| Documentos legais | `/docs/legal/termos.html` |

Para publicar a cada push, deixe o branch de produção como `main` e faça o merge
do PR. Enquanto o PR estiver aberto, a Vercel já gera uma **URL de preview** a
cada commit — que é exatamente o que serve para mostrar o protótipo para alguém.

---

## Caminho B — pela linha de comando

```bash
npm i -g vercel
cd hidromel
vercel login
vercel            # preview
vercel --prod     # produção
```

Rodando de dentro de `hidromel/`, o diretório raiz já está correto e a pergunta
do passo 3 não aparece.

---

## O que o `vercel.json` já resolve

| Regra | Por quê |
|---|---|
| `Content-Security-Policy` | limita de onde pode vir script, estilo, fonte e iframe. Sem isso, um script injetado roda livre |
| `frame-ancestors 'none'` | ninguém coloca seu checkout dentro de um iframe em outro site |
| `X-Content-Type-Options: nosniff` | o navegador não "adivinha" tipo de arquivo |
| `Strict-Transport-Security` | força HTTPS nas visitas seguintes |
| `noindex` em `/curso/` e `/obrigado.html` | área de aluno e página de pagamento fora do Google |
| `no-store` nas mesmas | credencial não fica no cache do navegador |
| cache de 1 ano nos SVGs | são gerados e versionados; nunca mudam sem mudar de conteúdo |
| cache curto no CSS/JS | para uma correção entrar no ar rápido |

### Antes de ligar o rastreamento

A CSP libera `connect.facebook.net` e `googletagmanager.com` porque o Pixel e o
GA4 são opcionais em `config.js`. Se você **não** for usar nenhum dos dois,
remova esses dois domínios de `script-src` — política mais estreita é política
melhor.

### Depois de publicar o backend

`connect-src` está com `https:` no fim, um curinga, porque a URL da API é
configurável e não dá para saber de antemão. Assim que o Worker estiver no ar,
troque por algo como:

```
connect-src 'self' https://sua-api.workers.dev https://api.mercadopago.com;
```

---

## Testar os headers ANTES de publicar

CSP mal calibrada **não dá erro no build**. O site sobe, e quebra no navegador do
cliente — normalmente o formulário de checkout, que é o pior lugar possível.

Existe um servidor local que aplica exatamente as regras do `vercel.json`:

```bash
node scripts/servir-como-vercel.mjs     # http://localhost:8901
```

Abra as três páginas com o console aberto. Qualquer linha `Refused to ...` é uma
regra apertada demais. Foi assim que esta configuração foi validada: 16
verificações, zero violações.

---

## Domínio próprio

1. *Settings → Domains* → adicione `hidromeldereis.com.br`.
2. No seu registrador, aponte o DNS conforme a Vercel indicar.
3. O certificado é emitido sozinho.
4. Atualize `URL_SITE` em `api/wrangler.toml` e republique o Worker — é ele que
   monta o link de acesso que vai no e-mail.

---

## Sequência recomendada

```
1. Publique estático na Vercel        → o site no ar em modo demonstração
2. Publique o Worker (api/README.md)  → pagamento e entrega funcionando
3. Preencha API_URL em config.js      → sai do modo demonstração
4. Estreite connect-src na CSP        → agora que a URL da API é conhecida
5. Domínio próprio                    → e atualize URL_SITE no Worker
6. Compra real de teste, com estorno   → o único teste que prova produção
```

Não pule o passo 6. O ambiente de sandbox aprova coisas que produção recusa.

---

## Outras hospedagens

O site não depende de nada da Vercel. Em qualquer outra:

| Onde | Como |
|---|---|
| Netlify | arraste a pasta `hidromel/`, ou aponte o repo com base directory `hidromel` |
| Cloudflare Pages | mesma ideia; conveniente porque o backend já é Cloudflare |
| GitHub Pages | publique o conteúdo de `hidromel/` — mas **sem headers**, então sem CSP |
| Hospedagem comum | FTP da pasta inteira |

Só a Vercel, a Netlify e o Cloudflare Pages aplicam os headers de segurança. No
GitHub Pages o site funciona, mas sem CSP e sem `noindex` — para um curso pago,
prefira uma das três primeiras.
