# Jurídico e burocracia

Referência de trabalho. **Não é parecer jurídico** — antes de investir dinheiro,
confirme cada ponto com advogado e contador, e valide as etapas na
Superintendência Federal de Agricultura do seu estado e na vigilância sanitária
do seu município.

---

## 1. Duas operações, dois regimes jurídicos

Confundir as duas é a origem de quase toda a confusão neste tema.

| | **Vender o CURSO** | **Vender o HIDROMEL** |
|---|---|---|
| O que é | produto digital / serviço educacional | bebida alcoólica fermentada |
| Registro no MAPA | não se aplica | **obrigatório** (Lei 8.918/94) |
| MEI serve? | sim | **não** — fabricação de bebida alcoólica não consta nas ocupações permitidas |
| Alvará sanitário | não | sim |
| Laudo por lote | não | sim |
| Tempo até poder vender | imediato | 6 a 18 meses |
| Nota fiscal | NFS-e (serviço) | NF-e (produto), com IPI e ICMS |

**Consequência prática:** você pode abrir as vendas do curso esta semana. A
venda da bebida é outro projeto, com outro cronograma — e o curso ensina esse
caminho sem prometer prazo.

---

## 2. Para vender o curso

### O mínimo exigido

- [ ] **CNPJ.** MEI serve para infoproduto. CNAE sugerido: 8599-6/04 (treinamento
      em desenvolvimento profissional) ou 8599-6/99.
- [ ] **Nota fiscal de serviço** em toda venda. Emitida pelo portal da prefeitura.
- [ ] **Identificação completa no site** — razão social, CNPJ e endereço, em
      lugar de fácil acesso. Exigência do Decreto 7.962/13 e do CDC art. 31.
      *No rodapé de `index.html` há um marcador `PREENCHER antes de publicar`.*
- [ ] **Termos de Uso**, **Política de Privacidade** e **Política de Reembolso**
      publicados. Estão em `docs/legal/` — falta preencher os campos entre `[ ]`.
- [ ] **Direito de arrependimento de 7 dias** (CDC art. 49). Oferecemos 15.
- [ ] **Verificação de idade** — implementada na entrada do site.

### O que não pode

| Prática | Norma | Risco |
|---|---|---|
| Depoimento inventado | CDC art. 37 (publicidade enganosa) | multa do Procon e ação judicial |
| Promessa de renda | CDC art. 37 | ação e reembolso forçado |
| Contador de escassez que reseta | CDC art. 37 | idem |
| Recusar reembolso dentro dos 7 dias | CDC art. 49 | devolução em dobro |
| Anunciar 112 aulas e entregar 30 sem avisar | CDC art. 30 e 35 | rescisão + devolução |
| E-mail marketing sem consentimento | LGPD art. 7º | sanção da ANPD |

---

## 3. Para vender o hidromel

### Base legal

- **Lei 8.918/1994** — dispõe sobre padronização, registro, inspeção e
  fiscalização da produção e do comércio de bebidas.
- **Decreto 6.871/2009** — regulamenta a Lei 8.918/94.
- **Instrução Normativa MAPA nº 34/2012** — complementos e padrões de identidade
  e qualidade de bebidas fermentadas.
- **Portaria SDA nº 562/2022** — atualizações de procedimento.
- **RDC ANVISA de rotulagem de alergênicos** — declaração de sulfitos.
- **ECA art. 243** — venda a menor de 18 anos é crime.

### Ordem das etapas

Está detalhada em `material/checklist-legalizacao.pdf`, com custo estimado. Em
resumo:

```
1. Empresa (CNPJ + CNAE de fabricação)
2. Alvará de localização
3. Estrutura física adequada (área separada, piso lavável, água potável com laudo)
4. Auto de vistoria do corpo de bombeiros
5. Alvará sanitário
6. Responsável técnico contratado (químico ou eng. de alimentos)
7. Registro do ESTABELECIMENTO no MAPA
8. Registro de cada PRODUTO
9. Laudo físico-químico por lote
```

As etapas 7 e 8 exigem que 1 a 6 estejam concluídas. Tentar antecipar faz o
processo voltar.

### Duas armadilhas de rotulagem

**Termos restritos.** "Premium", "artesanal", "natural" e "reserva" sofrem
restrição no painel principal de rótulo de bebida. Você segue livre para usá-los
em site, anúncio e catálogo — a restrição é do rótulo.

**Denominação de venda.** Mel + água + levedura = *hidromel*. Ao acrescentar
fruta, cacau ou especiaria, o produto pode ter de ser registrado como **bebida
alcoólica mista**, e a palavra "hidromel" sai do painel principal. Isso muda o
rótulo inteiro — decida antes de mandar imprimir.

> Este ponto tem impacto direto na linha premium do Módulo 10: das dez receitas,
> só o hidromel seco de eucalipto é hidromel puro. As outras nove provavelmente
> serão registradas como bebida alcoólica mista. Não é impedimento; é
> planejamento.

### Mel de abelha nativa

Méis de abelhas sem ferrão (jataí, mandaçaia, uruçu) **não têm autorização do
MAPA** para processamento agroindustrial em hidromel. Produzir para consumo
próprio é uma coisa; registrar produto comercial com esse mel é outra, e hoje
não é possível.

---

## 4. Escassez e urgência honestas

O site foi construído para não permitir os truques mais comuns:

| Recurso | Como está implementado |
|---|---|
| Contador regressivo | lê `CONFIG.OFERTA_FIM`; quando expira, **some** — não reinicia (`assets/js/site.js`) |
| Vagas restantes | número fixo em `CONFIG.VAGAS_RESTANTES`, atualizado por você conforme vende de verdade |
| "Últimas unidades" | não existe no código |
| Depoimentos | cards marcados `data-placeholder="true"`, com aviso no HTML |

Se for usar escassez, que seja real: turma com data de fechamento de verdade,
lote de vagas que realmente acaba, preço que realmente sobe na próxima turma.

---

## 5. Sobre os depoimentos

A seção "Quem já está dentro" contém **três espaços reservados**, não
depoimentos. Antes de publicar, faça uma das duas coisas:

1. substitua por depoimentos reais de alunos reais, com autorização de uso de
   nome e imagem **por escrito**; ou
2. **remova a seção inteira.**

Inventar depoimento é publicidade enganosa (CDC art. 37) e, em produto
educacional com promessa de resultado, agrava a situação. O código está marcado
para você não esquecer.

---

## 6. LGPD

Dados pessoais tratados pela plataforma:

| Dado | Finalidade | Base legal | Onde fica |
|---|---|---|---|
| Nome | identificação e emissão de NF | execução de contrato | KV do Cloudflare |
| E-mail | entrega do acesso e suporte | execução de contrato | KV do Cloudflare |
| CPF | exigência do Pix e emissão de NF | obrigação legal | enviado ao Mercado Pago |
| Telefone | suporte (opcional) | consentimento | KV do Cloudflare |
| Impressão do dispositivo | limitar compartilhamento de conta | legítimo interesse | KV do Cloudflare |
| IP | limite de requisições e antifraude | legítimo interesse | temporário, expira sozinho |

**Decisões tomadas para reduzir exposição:**

- Número de cartão **nunca** passa pela nossa infraestrutura — o formulário é
  hospedado pelo Mercado Pago.
- A impressão do dispositivo é um hash local não reversível; não identifica a
  pessoa, só conta aparelhos.
- Pixel da Meta e GA4 só carregam se você preencher os IDs em `config.js`.
  Vazios, nenhum rastreador de terceiro é carregado — e aí nem banner de
  cookies é necessário.
- O progresso das aulas fica no navegador do aluno, não no servidor.

**Direitos do titular:** acesso, correção, exclusão e portabilidade, atendidos
pelo e-mail de suporte. O texto está em `docs/legal/privacidade.html`.

---

## 7. Checklist antes de publicar

- [ ] Razão social, CNPJ e endereço preenchidos no rodapé de `index.html`
- [ ] Os três documentos de `docs/legal/` com os campos `[ ]` preenchidos
- [ ] Depoimentos reais **ou** seção removida
- [ ] `OFERTA_FIM` com data real de fechamento
- [ ] `VAGAS_RESTANTES` com número real
- [ ] Nenhuma promessa de renda em nenhum texto
- [ ] Aviso de +18 visível (já está no rodapé e na entrada)
- [ ] Página de vendas revisada por advogado (recomendado antes de investir em
      tráfego pago)
