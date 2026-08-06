<div align="center">

# HIDROMEL DE REIS

**Plataforma completa de venda e entrega de curso online**
*Da colmeia ao cálice.*

</div>

---

## O que é isto

Uma operação de infoproduto inteira, pronta para publicar: página de vendas, área
de membros com acesso individualizado, backend de pagamento com entrega
automática, material em PDF e a documentação de lançamento, jurídico e operação.

O tema é produção e comercialização de hidromel — a bebida alcoólica mais antiga
documentada, com 9.000 anos de história usada como argumento de preço.

**Está funcionando agora, em modo demonstração.** Abra `index.html` e navegue:
o checkout simula a compra, libera credencial e abre a área de membros completa.

---

## Ver funcionando em 30 segundos

```bash
cd hidromel
python3 -m http.server 8000
```

| Página | Endereço |
|---|---|
| Vendas | http://localhost:8000/ |
| Área de membros | http://localhost:8000/curso/ |
| Pós-compra | (chega pelo checkout) |

Na área de membros, use qualquer e-mail e o código `MEAD-DEMO-2026-REIS`.

---

## O que tem dentro

| | |
|---|---|
| **16 módulos, 112 aulas** | currículo completo, de "o que é mel" a "como escalar produção" |
| **30 receitas** | 11 medievais clássicas · 10 premium inusitadas · 9 sazonais |
| **11 PDFs** | diagramados por código, com processo-base escrito uma vez só |
| **686 prompts de IA** | imagem e vídeo, com estilo travado para saírem coerentes |
| **36 SVGs** | arte autoral, gerada por código — nenhuma imagem licenciada |
| **5 calculadoras** | mosto, ABV, nutriente TOSNA, backsweetening, precificação |
| **Backend completo** | Pix e cartão, webhook assinado, credencial única, e-mail |
| **105 testes** | 22 das calculadoras + 83 do backend, mais a auditoria |

---

## Estrutura

```
hidromel/
├── index.html              Página de vendas
├── obrigado.html           Pós-compra: QR Pix + liberação automática
├── curso/index.html        Área de membros
├── assets/
│   ├── css/                site.css (design system) · curso.css
│   ├── js/
│   │   ├── config.js       ← O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR
│   │   ├── curriculo.js    fonte da verdade: módulos e aulas
│   │   ├── api.js          cliente do backend + modo demonstração
│   │   ├── site.js         comportamento da página de vendas
│   │   ├── curso.js        área de membros
│   │   └── calculadoras.js as cinco calculadoras
│   └── img/                36 SVGs gerados
├── material/               11 PDFs gerados
├── producao/               briefing de IA: 686 prompts + 112 roteiros
├── api/
│   ├── worker.js           backend inteiro, arquivo único
│   ├── wrangler.toml
│   └── README.md           ← instalação passo a passo
├── scripts/
│   ├── gerar-arte.mjs           gera os SVGs
│   ├── gerar_pdfs.py            gera os PDFs
│   ├── gerar_legal.py           gera termos/privacidade/reembolso
│   ├── receitas.py              conteúdo das 30 receitas
│   ├── analisar-producao.mjs    custo de produção dos vídeos
│   ├── gerar-briefing-ia.mjs    prompts de IA + roteiros de narração
│   ├── auditar.mjs              varredura de defeitos (falha em ALTA)
│   ├── gerar-previa.mjs         empacota a página de vendas num arquivo só
│   ├── servir-como-vercel.mjs   serve com os headers do vercel.json
│   ├── testar-calculadoras.mjs  22 testes
│   └── testar-worker.mjs        83 testes
├── previa/                 prévia em arquivo único (gerada)
├── vercel.json             headers de segurança, cache e noindex
├── docs/
│   ├── DEPLOY.md           publicar na Vercel — e o passo que quebra
│   ├── LANCAMENTO.md       estratégia de 30 dias + copy de anúncios
│   ├── PAGAMENTOS.md       comparativo de taxas e configuração
│   ├── JURIDICO.md         MAPA, MEI, rótulo, LGPD, o que não pode
│   ├── PRODUCAO-VIDEO.md   como cortar 96% da filmagem (aula-base + delta)
│   ├── VIDEOS-ROTEIROS.md  o que gravar, como e em que ordem
│   └── legal/              termos · privacidade · reembolso (HTML)
└── ARQUITETURA.md          as decisões e o porquê de cada uma
```

---

## Regenerar os artefatos

```bash
node scripts/gerar-arte.mjs          # 36 SVGs
python3 scripts/gerar_pdfs.py        # 11 PDFs
python3 scripts/gerar_legal.py       # 3 páginas legais
node scripts/gerar-briefing-ia.mjs   # prompts de IA e roteiros
node scripts/analisar-producao.mjs   # custo de produção de vídeo

node scripts/testar-calculadoras.mjs # 22 testes
node scripts/testar-worker.mjs       # 83 testes
node scripts/auditar.mjs             # auditoria de defeitos
```

---

## Para colocar no ar

1. **Backend** — siga `api/README.md` (Cloudflare + Mercado Pago + Resend, ~40 min).
2. **Preencha `assets/js/config.js`** — a `API_URL` tira o site do modo demonstração.
3. **Preencha os dados da empresa** — rodapé de `index.html` e campos `[ ]` em `docs/legal/`.
4. **Depoimentos** — coloque reais ou remova a seção (ver `docs/JURIDICO.md` §5).
5. **Publique a pasta** — `docs/DEPLOY.md` traz o passo a passo da Vercel
   (atenção ao Root Directory: sem ele, publica o app de açaí).
6. **Grave os vídeos** — `docs/VIDEOS-ROTEIROS.md` traz a ordem e os roteiros.
7. **Lance** — `docs/LANCAMENTO.md` traz o plano de 30 dias.

---

## Como o acesso individualizado funciona

```
Pagamento aprovado
   ↓
Webhook chega  ──► assinatura HMAC conferida · replay bloqueado · idempotente
   ↓
Credencial ÚNICA gerada     MEAD-7K3Q-92XR-B4TL
   + link individual assinado
   ↓
E-mail sai com os dois
   ↓
Aluno clica → entra direto, sem senha
     ou digita e-mail + código, de qualquer aparelho
   ↓
Área de membros abre só os módulos do plano dele
```

Cada comprador recebe um código que não se repete. O plano viaja assinado dentro
do token — ninguém se promove editando o navegador. O limite de dispositivos
(2, 3 ou 5 conforme o plano) impede que um código circule em grupo de WhatsApp.

Detalhes e o porquê de cada decisão: `ARQUITETURA.md` §4.4.

---

## O que fica por conta de uma pessoa

Registrado aqui de propósito:

1. **Gravar os vídeos.** A infraestrutura está pronta e cada aula tem roteiro.
   Com o esquema aula-base + delta, são 17 aulas de bancada, 20 deltas curtos,
   7 capturas de tela e 68 narrações — não 112 gravações. Ver
   `docs/PRODUCAO-VIDEO.md`.
2. **Fotografia real do produto.** A arte é vetorial autoral e fica premium, mas
   foto de garrafa real converte mais. Os espaços já existem.
3. **Depoimentos.** Nenhum foi inventado — os cards estão marcados como
   reservados.
4. **Registro no MAPA**, se você também for vender a bebida. O curso ensina o
   caminho; o processo é seu.

---

<div align="center">

**Beba com moderação. Venda com responsabilidade.**
Conteúdo para maiores de 18 anos.

</div>
