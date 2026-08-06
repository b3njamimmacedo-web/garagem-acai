# HIDROMEL DE REIS — Arquitetura da Plataforma

> Documento de decisões. Leia antes de mexer no código.

---

## 1. Análise do site de referência

**Não foi possível abrir `hidromel.tinyhugs.online/elementor-9/`** — o proxy de rede desta
sessão bloqueou o domínio por política (`403 CONNECT`, registrado em
`recentRelayFailures`). Nenhum conteúdo dele foi lido.

O que dá para afirmar **só pela URL e pelos parâmetros de campanha**, sem inventar o resto:

| Sinal na URL | Leitura |
|---|---|
| `/elementor-9/` | WordPress + Elementor, página **sem slug editado** — número 9 é o ID do post. É template padrão, publicado às pressas. |
| `utm_medium=paid&utm_source=ig` | Tráfego **pago frio no Instagram**. |
| `utm_id`, `utm_campaign` e `utm_content` diferentes | Estrutura campanha → conjunto → anúncio. Estão testando criativos. |
| `fbclid=PAaWdy...` | Clique veio de anúncio Meta com Advantage+ / rastreamento agregado. |
| Domínio `tinyhugs.online` com subdomínio `hidromel` | Domínio guarda-chuva de terceiro (`.online` é TLD barato), não é marca própria. |

**Conclusão estratégica:** é uma operação de baixo custo — Elementor genérico, domínio
alugado, tráfego pago frio. O ponto fraco é **estrutural**, não de tráfego. É exatamente
onde dá para ganhar, e por isso as decisões abaixo atacam esses pontos:

| Fraqueza típica desse modelo | O que esta plataforma faz |
|---|---|
| Elementor pesado (LCP 4–8s) mata o CPA no tráfego pago | Estático puro, **zero build, zero framework**, LCP < 1s |
| Página de vendas genérica, sem posicionamento | Storytelling histórico de 9.000 anos como espinha dorsal |
| Entrega manual ou área de membros alugada | **Backend próprio** com credencial única por comprador |
| Só ensina a produzir | Ensina a produzir **e a vender legalizado** |
| Sem ferramenta | 5 calculadoras reais dentro da área de membros |
| Preço único | Escada de valor com 3 níveis + order bump |

---

## 2. Posicionamento

**Marca:** HIDROMEL DE REIS
**Assinatura:** *Da colmeia ao cálice.*
**Área de membros:** A Ordem do Hidromel (gera pertencimento e comunidade)

**Promessa:** produzir hidromel de nível premium em casa e transformar isso em um negócio
legalizado e lucrativo.

**Diferencial vendável (storytelling):** o hidromel é a bebida alcoólica mais antiga
documentada — ~7.000 a.C. na China (Jiahu), a bebida do Valhalla, o hidromel de Beowulf,
a origem da expressão "lua de mel". Isso não é enfeite: é o **argumento de preço**. Um
cliente final paga R$ 30 por uma cerveja artesanal, mas paga R$ 120 por uma garrafa que
carrega 9.000 anos de história. O aluno aprende a vender a história junto com a bebida.

**Duas linhas de receita, de propósito:**
- **Medievais clássicas** (autoridade, tradição): Metheglin, Melomel, Cyser, Pyment,
  Braggot, Bochet, Sack Mead, Acerglyn, Rhodomel, T'ej etíope, Trójniak polonês.
- **Premium inusitadas** (margem, diferenciação, "produto que não existe na prateleira"):
  Bochet de café e cardamomo, melomel de jabuticaba com amburana, capsicumel de pimenta
  rosa, hidromel de mel de aroeira com hibisco, envelhecimento em madeiras brasileiras.

---

## 3. Oferta e escada de valor

| Nível | Preço | Entrega | Papel no funil |
|---|---|---|---|
| **INICIADO** | R$ 47 | Módulos 0–9 (produção completa) + Grimório PDF | Front-end. Converte tráfego frio de IG. |
| **MESTRE** ⭐ | R$ 197 | Tudo + Módulos 10–14 (premium, legalização, custos, marca, vendas) + calculadoras + planilhas + rótulos | Principal. É o plano destacado. |
| **REAL** | R$ 497 | Tudo + Módulo 15 (escala) + comunidade + mentoria em grupo + certificado | Ancoragem e ticket alto. |

- **Order bump** (+R$ 27 no checkout): Pack "30 Rótulos Editáveis".
- **Upsell pós-compra** (OTO): quem compra INICIADO recebe MESTRE por R$ 147.
- **Garantia:** 7 dias incondicional (obrigatória por lei — CDC art. 49) mas vendida como
  "Garantia do Primeiro Lote", 15 dias.

Racional do R$ 47 na porta de entrada: com tráfego frio no Instagram, o CPA de um curso de
nicho fica tipicamente entre R$ 20 e R$ 40. Ticket de entrada baixo mantém o ROAS positivo
já na primeira venda; o lucro real vem do bump + upsell.

---

## 4. Decisões técnicas

### 4.1 Frontend: estático puro, sem build

Nada de React/Vite no site de vendas. HTML + CSS + JS ES modules.

**Por quê:**
1. **Velocidade = dinheiro.** Cada 100ms de LCP mexe na conversão; no tráfego pago isso é
   custo direto por venda. Sem framework não há bundle de 150kB antes do primeiro pixel.
2. **Publicável em qualquer lugar.** Arrastar a pasta para Netlify/Hostinger/GitHub Pages
   e está no ar. Sem `npm install`, sem versão de Node, sem pipeline que quebra.
3. **Sobrevive sem manutenção.** O dono do negócio não é desenvolvedor; o site não pode
   depender de dependências que envelhecem.

O app React de açaí na raiz do repositório **não foi tocado**. Esta plataforma vive
inteira dentro de `hidromel/`.

### 4.2 Backend: um único Cloudflare Worker

`hidromel/api/worker.js` — arquivo único, sem dependências, roda no plano gratuito.

Responsabilidades:
- criar cobrança Pix e cartão no Mercado Pago;
- receber webhook de pagamento aprovado (com **validação de assinatura HMAC**);
- gerar **credencial única e irrepetível** por comprador;
- enviar e-mail de acesso (Resend) e montar a mensagem de WhatsApp;
- autenticar o aluno e emitir token assinado;
- limitar compartilhamento de conta por número de dispositivos.

Persistência: **Cloudflare KV** (gratuito até 100k leituras/dia). Sem banco para
provisionar, sem servidor para manter de pé.

### 4.3 Pagamento: por que Mercado Pago como principal

| Opção | Taxa | Dinheiro na conta | Emite NF / trata imposto | Veredito |
|---|---|---|---|---|
| **Mercado Pago (Pix direto)** | **0,99%** | Na hora | Não — é você | **Principal.** Pix é ~75% das vendas de infoproduto no Brasil. |
| Mercado Pago (cartão) | 4,98% (na hora) / 3,79% (14d) | Configurável | Não | Complemento para parcelar. |
| Kirvano / Cakto | ~4–8% | D+2 a D+30 | **Sim** | Plano B: quem não quer lidar com fiscal. |
| Hotmart / Kiwify | 7–9,9% + R$1 | D+2 a D+30 | Sim | Só vale pela rede de afiliados. |

**A decisão:** Mercado Pago direto no Pix. Numa venda de R$ 197, a diferença entre 0,99% e
9,9% é **R$ 17,54 por venda** — em 300 vendas, R$ 5.262.

**Mas o Worker aceita os quatro.** Há endpoints de webhook prontos para Mercado Pago,
Kirvano, Cakto e Hotmart. Trocar de plataforma é trocar variável de ambiente, não
reescrever código. Isso importa: se a conta for bloqueada por chargeback, a operação não
para.

### 4.4 Acesso individualizado — o modelo

Este é o requisito central. Como funciona, do pagamento até o aluno assistindo:

```
Pagamento aprovado
   │
   ▼
Webhook chega no Worker  ──► valida assinatura HMAC (x-signature)
   │                          rejeita replay: idempotência por payment_id em KV
   ▼
Gera credencial ÚNICA
   ├── codigo:  MEAD-7K3Q-92XR-B4TL   (16 chars, crypto.getRandomValues, único no KV)
   ├── token:   HMAC-SHA256(email|pedido|plano|exp, SEGREDO)   — assinado, não forjável
   └── link:    https://seusite.com/curso/#/entrar?t=<token>
   │
   ▼
Grava em KV:  aluno:<email>  e  codigo:<codigo>  e  pedido:<id>
   │
   ▼
Envia e-mail (Resend) + monta link de WhatsApp
   │
   ▼
Aluno clica no link → entra direto, sem digitar nada
         ou digita e-mail + código, se preferir
   │
   ▼
Área de membros valida token no Worker → libera só os módulos do plano dele
```

**Por que token assinado e não só um código no banco:** o token carrega plano e validade
dentro dele, assinado. A área de membros consegue renderizar o que o aluno comprou sem ida
ao servidor a cada clique, e ninguém consegue editar o próprio plano no navegador — a
assinatura quebra.

**Antifraude de compartilhamento:** cada login registra uma impressão digital do
dispositivo. Acima do limite do plano (2 no INICIADO, 3 no MESTRE, 5 no REAL) o acesso é
recusado com mensagem clara. Não é DRM — é atrito suficiente para impedir que um código
circule em grupo de WhatsApp.

**Proteção do conteúdo — o que é honesto dizer:** vídeo em site estático **não é
inviolável**. Quem quer copiar, copia. A proteção real vem do hospedeiro de vídeo com
domínio travado (Panda Video ou Vimeo Pro) e marca d'água com o e-mail do aluno na tela.
O player já suporta os dois; está documentado em `docs/VIDEOS-ROTEIROS.md`.

### 4.5 Modo demo

O site funciona **inteiro sem backend nenhum**. Sem `API_URL` configurada, o front entra em
modo demonstração: código `MEAD-DEMO-2026-REIS` abre a área de membros completa. Serve
para validar layout, gravar vídeo de vendas e treinar antes de publicar.

---

## 5. Mapa de arquivos

```
hidromel/
├── index.html                  Página de vendas
├── obrigado.html               Pós-compra (Pix pendente → aprovado, com polling)
├── curso/index.html            Área de membros
├── assets/
│   ├── css/site.css            Design system + página de vendas
│   ├── css/curso.css           Área de membros
│   ├── js/curriculo.js         FONTE DA VERDADE: 16 módulos, 112 aulas
│   ├── js/site.js              Vendas: contadores, FAQ, checkout, pixel
│   ├── js/api.js               Cliente do backend + modo demo
│   ├── js/curso.js             Membros: login, player, progresso
│   ├── js/calculadoras.js      5 calculadoras
│   └── img/                    41 SVGs gerados
├── material/                   PDFs gerados
├── api/
│   ├── worker.js               Backend inteiro
│   ├── wrangler.toml
│   └── README.md               Setup passo a passo
├── scripts/
│   ├── gerar-arte.mjs          Node — gera os SVGs
│   ├── gerar_pdfs.py           Python/reportlab — gera os PDFs
│   └── exportar-curriculo.mjs  curriculo.js → curriculo.json
└── docs/
    ├── LANCAMENTO.md           Estratégia de lançamento + copy de anúncios
    ├── PAGAMENTOS.md           Comparativo e configuração
    ├── JURIDICO.md             MAPA, MEI, rótulo, LGPD, tributação
    ├── VIDEOS-ROTEIROS.md      Roteiro de cada vídeo + como gravar
    └── legal/                  Termos, privacidade, reembolso (HTML)
```

---

## 6. Riscos assumidos e o que fica por conta do dono

Registrado aqui de propósito, para não virar surpresa:

1. **Os vídeos precisam ser gravados por uma pessoa.** Não há como gerar 112 aulas de vídeo
   real. O que existe é a infraestrutura completa (player, progresso, ordem, marcação de
   concluído) e o roteiro de cada aula. `docs/VIDEOS-ROTEIROS.md` traz ordem de gravação,
   equipamento mínimo e o roteiro de vendas (VSL).
2. **As fotos são ilustrações vetoriais autorais.** Sem crédito de IA disponível nesta
   sessão e sem usar foto de terceiro sem licença, a arte foi desenhada em SVG por script.
   Fica premium e é 100% própria — mas fotografia real do produto converte mais e deve
   substituí-la quando existir. Os slots já estão prontos.
3. **Vender bebida alcoólica exige registro no MAPA.** O curso pode ser vendido hoje; a
   **bebida** não pode ser comercializada sem registro. O Módulo 11 e `docs/JURIDICO.md`
   tratam disso, e a página de vendas **não promete** que o aluno venderá legalmente em X
   dias — promessa dessas gera processo.
4. **Depoimentos são placeholders identificados.** Não inventei prova social. Os cards
   estão marcados no HTML com `data-placeholder="true"` e há aviso no código: depoimento
   falso é crime (CDC art. 37, publicidade enganosa).
