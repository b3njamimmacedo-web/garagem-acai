# Produção de vídeo — como não gastar 12 anos e US$ 14.652

Este documento existe por causa de uma pergunta simples: *quanto custa gerar
todos os vídeos com IA?* A resposta honesta é que a pergunta está errada, e a
correção veio de uma boa ideia — **não refilmar o que é igual**.

Rode `node scripts/analisar-producao.mjs` para reproduzir todos os números daqui.

---

## O ponto de partida: gerar tudo é inviável

| | |
|---|---|
| Curso completo | 112 aulas · 1.850 min · **30,8 h** |
| Em vídeo de IA, com 4 retentativas | **444.000 créditos** |
| Custo (plano Ultra anual) | **US$ 14.652** |
| Tempo, a 3.000 créditos/mês | **148 meses — 12,3 anos** |

O prazo é pior que o preço: os créditos são mensais e não dá para "pagar mais
rápido". E o resultado seria inutilizável — clipes de no máximo 15 s, sem
continuidade de rosto, roupa ou cenário, milhares de vezes.

---

## Redução 1 — Aula-base + delta

**A ideia:** o começo de todo hidromel é idêntico. Sanitizar, dissolver o mel,
medir a OG, reidratar a levedura, inocular, nutriente escalonado, degassing,
trasfega. O que muda entre uma receita e outra é **só a adição** — fruta,
especiaria, madeira, malte, mel caramelizado.

Então grava-se o processo uma vez (Módulo 5) e cada receita mostra apenas o
delta, apontando para onde a etapa comum foi ensinada.

**Implementado na plataforma**, não só no papel. Em `assets/js/curriculo.js`:

```js
{ id: 'a0602', t: 'Melomel — hidromel com frutas',
  base: ['a0502', 'a0503', 'a0504', 'a0505'],
  novo: 'Congelar/descongelar a fruta, saco de malha na secundária e pectinase.' }
```

A área de membros renderiza um bloco **"O que muda nesta receita"** seguido de
**"Etapas em comum, já ensinadas"**, com marcação de concluído e link para
rever. O aluno que ainda não viu uma etapa é avisado.

### O que isso economiza

| | Sem reuso | Com reuso |
|---|---|---|
| Filmagem de bancada nas receitas | 1.853 min (30,9 h) | 68 min (1,1 h) |
| **Lotes reais de hidromel** | **17 lotes** | **4 lotes-base** |
| Mel | R$ 3.264 | R$ 768 |
| Calendário | 17 × 90 dias de fermentação | 4 × 90 dias, em paralelo |

**96% menos filmagem.** Mas o número que realmente importa é o dos lotes: sem
reuso, filmar 17 receitas exigiria produzir 17 lotes de verdade. Com 4
lotes-base — tradicional, melomel, bochet e braggot — todas as 17 são cobertas.

### O ganho que não aparece na planilha

- **Didático.** Repetir "sanitize, dissolva o mel, meça a OG" dezessete vezes
  treina o aluno a pular o começo de toda aula. Ensinar uma vez e depois só o
  delta mantém a atenção onde está a informação nova.
- **Manutenção.** Melhorou sua técnica de sanitização? Regrava **uma** aula, não
  dezessete.

---

## Redução 2 — Narração sobre imagem, não talking head

Esta é maior que a primeira, e passa despercebida.

Das 112 aulas, **62 são conceituais**: história, legalização, precificação,
marca, vendas, escala. Nenhuma precisa de vídeo. Precisam de uma voz clara
sobre imagens boas.

| Formato | Créditos por minuto de aula entregue |
|---|---|
| Vídeo de IA | 60 |
| Narração sobre imagens | 0,10 |

**576× mais barato por minuto entregue.** A conta é simples: uma imagem cobre
~2 minutos de narração; um segundo de vídeo cobre um segundo.

E converte melhor. Aula conceitual com slide bem feito prende mais que uma
pessoa falando em frente à câmera por 20 minutos.

---

## Redução 3 — Clipes-âncora em vez de módulo inteiro em vídeo

O Módulo 1 (histórico) é o que mais pede imagem impossível de filmar: Jiahu em
7.000 a.C., o Valhalla, o salão de Beowulf, um mosteiro medieval.

A tentação é gerar os 84 minutos em vídeo. Isso custaria ~20.000 créditos.

O certo é narração sobre imagens, **pontuada por 30 clipes-âncora de 10 s** nos
momentos que merecem movimento. Custo: 1.200 créditos. Mesmo efeito.

> Eu mesmo errei isso na primeira versão desta análise — calculei o módulo
> inteiro como vídeo contínuo. O erro está corrigido no script, com o comentário
> explicando por quê.

---

## Redução 4 — Um take, várias aulas

O Módulo 5 são 8 aulas. Não são 8 gravações: é **um lote real acompanhado**,
filmado em sessões, e cortado depois.

Vale para todos os blocos de bancada:

| Bloco | Gravações separadas | Sessões reais |
|---|---|---|
| Módulo 5 (primeiro hidromel) | 8 | 3 sessões ao longo de 3 semanas |
| Módulo 4 (sanitização, bancada) | 2 | 1 tarde |
| Deltas das 17 receitas | 17 | 3 a 4 tardes |

Mesma bancada, mesma roupa, mesma luz — e o material fica visualmente coerente,
o que sozinho já eleva a percepção de qualidade.

---

## Redução 5 — B-roll reaproveitado entre aula e marketing

Cada clipe gerado deve servir a mais de um destino. O timelapse de fermentação,
por exemplo, entra em:

1. Módulo 3 (aula de fermentação)
2. Módulo 5 (rotina dos 14 dias)
3. VSL
4. Criativo de anúncio nº 4
5. Post de Instagram

**Um clipe, cinco usos.** Gere pensando nisso: enquadramento neutro, sem texto
queimado na imagem, sem locução embutida.

---

## Redução 6 — Captura de tela custa zero

Sete aulas são sobre ferramentas: as cinco calculadoras, a ficha técnica e o
simulador de precificação. São **captura de tela com narração**. Zero crédito,
zero produção — e são as aulas de maior valor percebido do curso, porque o
aluno vê o próprio número aparecendo.

---

## Redução 7 — Personal Clipper para o conteúdo de Instagram

O `docs/LANCAMENTO.md` pede 30 pautas de Instagram. Não produza nenhuma
separadamente.

O Higgsfield tem o **Personal Clipper** (`clipify`): recebe uma URL do YouTube e
devolve **até 20 clipes verticais legendados**, com corte que acompanha o rosto.

Publique as aulas mais fortes como não listadas, rode o clipper e o mês de
conteúdo sai delas. O calendário de 30 dias vira trabalho de uma tarde — e cada
clipe é uma amostra real do curso, que é o conteúdo que mais converte.

---

## O orçamento final

| Item | Quantidade | Créditos |
|---|---|---|
| Clipes-âncora históricos | 30 × 10 s, 4 tentativas | 1.200 |
| Imagens para narração | 546 imagens | 228 |
| VSL + 4 anúncios + 16 vinhetas | — | 1.680 |
| **Total** | | **3.108** |

**US$ 103 — dois meses de plano Ultra.**

Contra US$ 14.652 e 12,3 anos da abordagem ingênua.

### E o que fica por conta humana

| Tipo | Aulas | Como |
|---|---|---|
| Bancada | 17 | celular + microfone de lapela, lotes reais |
| Delta | 20 | 3 a 4 tardes, sobre os 4 lotes-base |
| Tela | 7 | captura de tela |
| Narração | 68 | voz sobre as imagens geradas |

Equipamento: **celular e um microfone de lapela de R$ 100**. O microfone não é
opcional — áudio ruim é a causa nº 1 de reembolso em curso online.

---

## Ordem de execução

1. **Semana 1** — inicie os 4 lotes-base. Eles fermentam enquanto você grava o resto.
2. **Semanas 1–3** — grave o Módulo 5 acompanhando o lote tradicional.
3. **Paralelo** — gere as imagens (são baratas) e narre as 68 aulas conceituais.
4. **Semana 4** — grave os 20 deltas, com os lotes-base já prontos.
5. **Por último** — o VSL, quando você já estiver confortável na câmera.
6. **Depois de publicar** — rode o Personal Clipper e monte o mês de Instagram.

---

## Onde NÃO economizar

Registrado para a economia não virar prejuízo:

- **Microfone.** R$ 100 que decidem se o curso é assistido até o fim.
- **A aula prática do Módulo 5.** É a prova de que o método é real. Filme o lote
  inteiro, inclusive os erros.
- **Mostrar o erro.** Quando um lote der errado, grave. É o conteúdo de maior
  valor percebido do curso, e nenhuma IA produz isso.
- **Leitura real de densímetro.** Um número real na tela vale mais que qualquer
  animação.
