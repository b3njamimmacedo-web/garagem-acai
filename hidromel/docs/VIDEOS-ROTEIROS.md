# Vídeos — o que gravar, como e em que ordem

O sistema está pronto: player, progresso, ordem das aulas, marcação de concluído
e marca d'água. **O que falta é uma pessoa gravar.** Não existe atalho para isso,
e este documento existe para tornar a gravação o mais mecânica possível.

> **Leia `PRODUCAO-VIDEO.md` antes deste.** Ele mostra como cortar a filmagem em
> 96% com aula-base + delta, e por que 68 das 112 aulas não precisam de vídeo
> nenhum — só de narração sobre imagem. Muda a ordem de gravação abaixo.

---

## Como o vídeo entra no sistema

Cada aula em `assets/js/curriculo.js` tem um campo `v`:

```js
{ id: 'a0501', t: 'A receita mestra', m: 12, v: null, ... }
//                                        ↑ vazio = mostra "Aula em produção"
```

Publique o vídeo, pegue o ID e preencha:

```js
v: { p: 'panda', id: 'a1b2c3d4-...' }
```

Provedores aceitos: `yt` (YouTube), `vimeo`, `panda` (Panda Video), `bunny`
(Bunny Stream). A aula passa a tocar na hora — não é preciso mexer em mais nada.

---

## Onde hospedar

| Provedor | Custo | Proteção real | Veredito |
|---|---|---|---|
| YouTube não listado | grátis | **nenhuma** — link vazado é link aberto | só para as aulas gratuitas |
| Vimeo Pro | ~US$ 20/mês | domínio travado | bom |
| **Panda Video** | a partir de ~R$ 100/mês | domínio travado + marca d'água dinâmica + anti-download | **melhor para curso pago no Brasil** |
| Bunny Stream | ~US$ 5–15/mês | token de acesso | ótimo custo-benefício |

**A verdade sobre proteção de vídeo:** não existe forma de impedir alguém de
filmar a tela. O que se faz é aumentar o atrito e tornar o vazamento rastreável.
A área de membros já sobrepõe o e-mail e o código do aluno em movimento sobre o
player — quem gravar a tela entrega quem é. Isso resolve mais do que qualquer
DRM.

Recomendação: **YouTube não listado para as 4 aulas gratuitas** (elas são isca,
querem ser vistas) e **Panda ou Bunny para o resto**.

---

## Equipamento mínimo

Não adie a gravação esperando equipamento. Com o que segue, a qualidade já é
melhor que a média do mercado:

| Item | O suficiente | Por quê |
|---|---|---|
| Câmera | celular dos últimos 4 anos, 1080p | resolução não é o gargalo |
| **Áudio** | **microfone de lapela, R$ 60 a R$ 150** | **é aqui que está tudo** |
| Luz | janela de lado, de dia | luz de graça e melhor que ringlight barato |
| Tripé | qualquer um, R$ 40 | imagem tremida cansa em 2 minutos |
| Fundo | a própria bancada de produção | contexto real vende mais que fundo neutro |

> **Se for gastar em uma coisa só, gaste no microfone.** O espectador tolera
> imagem média e abandona áudio ruim em 15 segundos. Áudio ruim é o motivo
> número um de reembolso em curso online.

---

## Ordem de gravação

Não grave na ordem do currículo — grave na ordem que permite lançar antes.

### Bloco 1 — indispensável para abrir as vendas (30 aulas)

Módulos 0 a 5. Com eles o aluno tem cerca de três semanas de conteúdo, e você
publica o restante semanalmente.

**Comece pelo Módulo 5.** É a aula prática filmada em tempo real, precisa
acompanhar um lote de verdade ao longo de duas semanas, e é a que mais demora.
Deixe fermentando enquanto grava os módulos teóricos.

```
Semana 1   Módulo 5 — Dia 0 (montagem do mosto). Inicia o lote real.
Semanas 1–2  Módulos 1, 2, 3 (teoria, estúdio) enquanto o lote fermenta.
Semana 2   Módulo 5 — rotina dos dias 1 a 14 (capturas curtas diárias).
Semana 3   Módulos 0 e 4.
Semana 3   Módulo 5 — trasfega e fechamento.
```

### Bloco 2 — publicado nas semanas seguintes (36 aulas)

Módulos 6 a 9. Receitas medievais, estabilização, madeira e defeitos.

### Bloco 3 — o que sustenta o plano Mestre (46 aulas)

Módulos 10 a 15. Premium, legalização, custos, marca, vendas e escala. Estes são
quase todos de estúdio, com apoio de tela — gravam-se rápido.

---

## Estrutura de cada aula

Funciona para qualquer uma das 112:

```
0–15 s     GANCHO. A promessa concreta da aula.
           "No fim desta aula você vai saber exatamente quanto mel comprar."
15–45 s    CONTEXTO. Por que isso importa e o que dá errado sem isso.
45 s–fim   CONTEÚDO. Um conceito por vez, do simples ao complexo.
Final      RESUMO em 3 pontos + o que vem na próxima aula.
```

**Regras que valem para todas:**

- Nunca comece com "Olá pessoal, tudo bem, sejam bem-vindos a mais um vídeo".
  Comece pela promessa. Os 15 primeiros segundos decidem a retenção.
- Uma ideia por aula. Se está passando de 25 minutos, são duas aulas.
- Mostre a tela quando houver número. Falar de densidade sem mostrar o
  densímetro não ensina ninguém.
- Erre na câmera. Quando um lote der errado, grave. É o conteúdo de maior valor
  percebido do curso inteiro.

---

## Roteiro do vídeo de vendas (VSL) — 8 a 12 min

Este é o vídeo mais importante de todos. Grave-o **por último**, quando já
estiver confortável na frente da câmera.

```
0:00–0:30   GANCHO HISTÓRICO
            Close no mel escorrendo.
            "Esta bebida é mais antiga que a escrita. Mais antiga que o vinho,
            que a cerveja e que a roda. E quase ninguém no Brasil sabe fazê-la."

0:30–2:00   A HISTÓRIA
            Jiahu 7.000 a.C. · Valhalla · Beowulf · lua de mel.
            Encerre com: "Nove mil anos de história dentro de uma garrafa.
            É por isso que ela pode custar cento e quarenta reais."

2:00–3:30   O PROBLEMA
            "Talvez você já tenha tentado. E o resultado cheirou a ovo podre."
            Liste os cinco erros. Nomeie cada um. Mostre que têm solução.

3:30–5:00   A VIRADA
            Sua história — como você aprendeu, quanto errou, quanto custou.
            Autenticidade aqui vale mais que produção.

5:00–7:00   O MÉTODO
            Mostre a área de membros na tela. 16 módulos, 112 aulas.
            Detenha-se em dois pontos: o Módulo 11 (legalização) e o
            Módulo 12 (precificação). É o que ninguém mais entrega.

7:00–8:30   A CONTA
            Mostre a calculadora funcionando na tela, ao vivo.
            "Custo dezessete e oitenta e nove. Venda oitenta e nove.
            Uma garrafa paga o plano de entrada. Três pagam o completo."

8:30–10:00  OFERTA E GARANTIA
            Os três planos. Os bônus. A garantia de 15 dias.
            "Se em quinze dias você achar que não era para você, escreve para a
            gente e devolvemos tudo. Sem formulário, sem ligação, sem pergunta."

10:00–11:00 CHAMADA
            "Nove mil anos esperaram. Seu primeiro lote, não."
```

**O que NÃO colocar no VSL:**

- promessa de renda ("fature R$ 10 mil por mês");
- prazo para legalizar ("em 90 dias você estará vendendo legalmente");
- depoimento que não existe;
- "vagas acabando" se não estiverem.

Cada um desses aumenta a conversão no curto prazo e cria passivo jurídico no
longo. Ver `docs/JURIDICO.md`.

---

## Aulas gratuitas

Quatro aulas estão marcadas com `free: true` em `curriculo.js` e aparecem com o
selo GRÁTIS na página de vendas:

| Aula | Papel |
|---|---|
| Bem-vindo à Ordem | mostra o tom e a qualidade de produção |
| Jiahu, 7.000 a.C. | o conteúdo que viraliza sozinho |
| A receita mestra | prova que o método é concreto, não teoria |
| O mapa da burocracia | mostra que a parte difícil também está lá |

Publique as quatro no YouTube **não listado** e use nos anúncios de meio de
funil. Elas convertem melhor do que qualquer página de vendas.

---

## Checklist antes de cada gravação

- [ ] Microfone testado — grave 10 s e ouça antes de começar de verdade
- [ ] Celular em modo avião (notificação no meio da aula obriga a refazer)
- [ ] Bateria acima de 50% e espaço livre no armazenamento
- [ ] Luz da janela batendo de lado, não de trás
- [ ] Roteiro em tópicos, nunca palavra por palavra (fica robótico)
- [ ] Água por perto
- [ ] Tudo o que vai aparecer já sobre a bancada, ao alcance da mão

---

## Publicando

1. Suba o vídeo no provedor escolhido.
2. Copie o ID.
3. Preencha o campo `v` da aula em `assets/js/curriculo.js`.
4. Publique o site.
5. A aula sai do estado "em produção" automaticamente.

Avise os alunos por e-mail a cada bloco publicado — é o que segura o
engajamento e derruba o índice de reembolso.
