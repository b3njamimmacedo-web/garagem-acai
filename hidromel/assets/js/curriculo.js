/* =============================================================================
   HIDROMEL DE REIS — CURRÍCULO
   Fonte única da verdade. Consumido por:
     - index.html      (página de vendas: contagem de módulos/aulas/horas)
     - curso/index.html(área de membros: navegação, player, progresso)
     - scripts/exportar-curriculo.mjs -> data/curriculo.json -> gerar_pdfs.py

   Campos de aula:
     id    identificador estável (NUNCA renomear: o progresso do aluno usa isso)
     t     título
     m     duração em minutos
     d     descrição / o que o aluno sai sabendo
     v     vídeo -> { p: provedor, id: id no provedor }  (p: yt|vimeo|panda|bunny)
           v: null  => slot vago; o player mostra o estado "em produção"
     pdf   nome do arquivo em /material
     lab   true = aula prática (mão na massa), ganha selo diferente
     free  true = aula liberada como amostra grátis na página de vendas

   Campos de módulo:
     plano  iniciado | mestre | real   (nível MÍNIMO que libera o módulo)
============================================================================= */

export const PLANOS = {
  iniciado: {
    id: 'iniciado',
    nome: 'INICIADO',
    preco: 47,
    precoDe: 197,
    dispositivos: 2,
    ordem: 1,
    chamada: 'Aprenda a produzir hidromel de verdade',
  },
  mestre: {
    id: 'mestre',
    nome: 'MESTRE',
    preco: 197,
    precoDe: 897,
    dispositivos: 3,
    ordem: 2,
    chamada: 'Produza, legalize e venda com margem',
  },
  real: {
    id: 'real',
    nome: 'REAL',
    preco: 497,
    precoDe: 1997,
    dispositivos: 5,
    ordem: 3,
    chamada: 'Transforme em operação comercial',
  },
};

export const CURRICULO = [
  /* ------------------------------------------------------------------ M00 */
  {
    id: 'm00',
    n: 0,
    plano: 'iniciado',
    titulo: 'A Ordem',
    subtitulo: 'Boas-vindas e como extrair o máximo',
    epigrafe: 'Toda ordem começa com um juramento. O seu é simples: fermente antes de duvidar.',
    cor: '#D4A017',
    aulas: [
      { id: 'a0001', t: 'Bem-vindo à Ordem do Hidromel', m: 8, v: null, free: true,
        d: 'O mapa completo do método, o que você vai ter produzido ao final e o erro nº 1 de quem desiste na terceira semana.' },
      { id: 'a0002', t: 'Como estudar: a ordem que funciona', m: 6, v: null,
        d: 'Por que assistir na sequência importa aqui: fermentação tem tempo biológico, e há uma aula que precisa começar hoje para render no módulo 5.' },
      { id: 'a0003', t: 'Sua lista de compras da semana 1', m: 11, v: null, pdf: 'lista-compras-semana-1.pdf',
        d: 'O setup mínimo real, com faixa de preço e o que NÃO comprar agora. Inclui a versão R$ 280 e a versão R$ 1.400.' },
    ],
  },

  /* ------------------------------------------------------------------ M01 */
  {
    id: 'm01',
    n: 1,
    plano: 'iniciado',
    titulo: 'A Bebida dos Deuses',
    subtitulo: '9.000 anos de história — e por que isso vale dinheiro',
    epigrafe: 'Antes do vinho. Antes da cerveja. Antes da escrita.',
    cor: '#B8860B',
    aulas: [
      { id: 'a0101', t: 'Jiahu, 7.000 a.C.: a bebida mais antiga do mundo', m: 14, v: null, free: true,
        d: 'A análise química dos potes de cerâmica da China neolítica que provou: mel fermentado veio antes de tudo. A história que abre a sua venda.' },
      { id: 'a0102', t: 'Valhalla: o hidromel dos nórdicos', m: 16, v: null,
        d: 'Heiðrún, a cabra que dava hidromel no telhado do Valhalla. O Mead of Poetry. O que os vikings realmente bebiam — e o que é invenção de série de TV.' },
      { id: 'a0103', t: 'Beowulf e o salão de hidromel', m: 12, v: null,
        d: 'O mead hall como centro político da Europa do norte. Por que "beber junto" era um contrato — e como usar isso em degustação hoje.' },
      { id: 'a0104', t: 'A origem da lua de mel', m: 9, v: null,
        d: 'Um mês lunar de hidromel após o casamento para garantir herdeiro. A história mais vendável que existe: use no rótulo da sua linha de casamento.' },
      { id: 'a0105', t: 'T\'ej, Miód Pitny e as tradições vivas', m: 15, v: null,
        d: 'Etiópia, Polônia, Lituânia: três culturas onde o hidromel nunca morreu. Três receitas ancestrais que ninguém está vendendo no Brasil.' },
      { id: 'a0106', t: 'Storytelling: transformando 9.000 anos em preço', m: 18, v: null,
        d: 'O exercício central do curso. Como uma garrafa de R$ 35 vira uma garrafa de R$ 140 sem mudar uma gota do líquido — mudando a história que ela carrega.' },
    ],
  },

  /* ------------------------------------------------------------------ M02 */
  {
    id: 'm02',
    n: 2,
    plano: 'iniciado',
    titulo: 'A Ciência do Mel',
    subtitulo: 'Escolher errado o mel arruína o lote antes de começar',
    epigrafe: 'O mel não é ingrediente. É o projeto inteiro.',
    cor: '#E0A800',
    aulas: [
      { id: 'a0201', t: 'O que é mel, quimicamente', m: 13, v: null,
        d: 'Frutose, glicose, água, ácidos, enzimas. Por que a proporção frutose/glicose decide se seu hidromel vai ficar seco ou travar na metade.' },
      { id: 'a0202', t: 'Florada muda tudo: guia de 12 méis brasileiros', m: 22, v: null, pdf: 'guia-flotadas.pdf',
        d: 'Laranjeira, silvestre, eucalipto, assa-peixe, cipó-uva, aroeira, marmeleiro, cambará, morro, angico, capixingui e melato. Perfil sensorial e para que serve cada um.' },
      { id: 'a0203', t: 'Comprar mel: fornecedor, preço e fraude', m: 17, v: null,
        d: 'Como identificar mel adulterado com xarope de milho sem laboratório. Onde comprar em volume. A faixa de preço por kg que fecha a conta.' },
      { id: 'a0204', t: 'Densidade, Brix e o must', m: 14, v: null, lab: true,
        d: 'Prática: montar o mosto no ponto exato de densidade original (OG) para o ABV que você quer. Com densímetro e com refratômetro.' },
      { id: 'a0205', t: 'Água: a metade esquecida da receita', m: 11, v: null,
        d: 'Cloro, cloramina e dureza. Por que água de torneira mata levedura e o teste de 30 segundos que resolve.' },
      { id: 'a0206', t: 'Calculando seu mosto do zero', m: 16, v: null, lab: true,
        d: 'Da garrafa que você quer para o kg de mel que precisa comprar. Usando a Calculadora da Ordem, dentro da área de membros.' },
    ],
  },

  /* ------------------------------------------------------------------ M03 */
  {
    id: 'm03',
    n: 3,
    plano: 'iniciado',
    titulo: 'Leveduras e Fermentação',
    subtitulo: 'O módulo que separa hidromel bom de hidromel medíocre',
    epigrafe: 'Você não faz hidromel. A levedura faz. Você faz o ambiente dela.',
    cor: '#C08C1E',
    aulas: [
      { id: 'a0301', t: 'Como a levedura trabalha', m: 15, v: null,
        d: 'Fase lag, log e estacionária. Por que os 3 primeiros dias decidem o sabor dos 3 meses seguintes.' },
      { id: 'a0302', t: 'Escolhendo a cepa: 10 leveduras e o que cada uma entrega', m: 20, v: null, pdf: 'tabela-leveduras.pdf',
        d: 'EC-1118, K1-V1116, 71B, D47, RC-212, BM-4X4, Wyeast 4184, Lalvin QA23, US-05 e a nativa. Tolerância alcoólica, faixa de temperatura e perfil.' },
      { id: 'a0303', t: 'Nutrientes: o erro que causa 80% dos defeitos', m: 18, v: null,
        d: 'Mel é pobre em nitrogênio. Levedura sem nitrogênio produz enxofre e óleo fúsel. O que é YAN e por que ninguém te contou.' },
      { id: 'a0304', t: 'Protocolo TOSNA/SNA passo a passo', m: 17, v: null, lab: true,
        d: 'A adição escalonada de nutriente que virou padrão-ouro. Cronograma exato em dias, dose por litro, e a versão simplificada para quem está começando.' },
      { id: 'a0305', t: 'Temperatura, pH e oxigênio', m: 16, v: null,
        d: 'Os três parâmetros de controle. Como fazer controle de temperatura sem câmara fria gastando R$ 60. Quando o pH trava a fermentação (stuck).' },
      { id: 'a0306', t: 'Degassing e a rotina dos 14 primeiros dias', m: 12, v: null, lab: true,
        d: 'O calendário dia a dia: o que fazer, o que medir e o que anotar. Com a ficha de fermentação imprimível.' },
      { id: 'a0307', t: 'Fermentação travada: diagnóstico e resgate', m: 19, v: null,
        d: 'Como saber se travou ou só terminou. O procedimento de reinoculação que salva um lote de 20 litros que você já daria por perdido.' },
    ],
  },

  /* ------------------------------------------------------------------ M04 */
  {
    id: 'm04',
    n: 4,
    plano: 'iniciado',
    titulo: 'Equipamentos e Sanitização',
    subtitulo: 'Do setup de R$ 280 à sala de produção',
    epigrafe: 'Contaminação não avisa. Ela aparece 40 dias depois, no cheiro.',
    cor: '#8A6D1F',
    aulas: [
      { id: 'a0401', t: 'Setup mínimo viável: R$ 280', m: 14, v: null,
        d: 'A lista honesta do que basta para o primeiro lote de 5 litros. Sem gambiarra que estraga o produto e sem compra que só serve para o Instagram.' },
      { id: 'a0402', t: 'Setup intermediário: R$ 1.400', m: 13, v: null,
        d: 'O upgrade que faz sentido depois do terceiro lote: fermentador de inox, airlock de qualidade, bomba de trasfega, controlador de temperatura.' },
      { id: 'a0403', t: 'Setup comercial: 200 a 1.000 litros/mês', m: 18, v: null,
        d: 'Dimensionamento real da sala de produção, com planta baixa e orçamento por faixa de volume. Pré-requisito do módulo de legalização.' },
      { id: 'a0404', t: 'Limpeza x sanitização: não é a mesma coisa', m: 12, v: null,
        d: 'A confusão que arruina lotes. PBW, percarbonato, soda cáustica — quando usar cada um.' },
      { id: 'a0405', t: 'Star San, iodofor e ácido peracético', m: 15, v: null, lab: true,
        d: 'Diluição correta, tempo de contato e o mito do "no-rinse". Prática de sanitização completa de um fermentador.' },
      { id: 'a0406', t: 'Montando sua bancada de trabalho', m: 11, v: null,
        d: 'Fluxo sujo → limpo, superfícies, armazenamento de insumos e o layout que evita contaminação cruzada.' },
    ],
  },

  /* ------------------------------------------------------------------ M05 */
  {
    id: 'm05',
    n: 5,
    plano: 'iniciado',
    titulo: 'Seu Primeiro Hidromel',
    subtitulo: 'Traditional Show Mead — do zero à garrafa, em tempo real',
    epigrafe: 'Sem fruta, sem especiaria, sem esconderijo. Só mel, água e levedura.',
    cor: '#D4A017',
    destaque: true,
    aulas: [
      { id: 'a0501', t: 'A receita mestra: 5 litros, semi-seco, 12% ABV', m: 12, v: null, free: true, pdf: 'receita-mestra.pdf',
        d: 'A receita que você vai repetir a vida inteira. Formulação completa, com a matemática explicada e não só o número pronto.' },
      { id: 'a0502', t: 'Dia 0 — sanitizar e montar o mosto', m: 24, v: null, lab: true,
        d: 'Aula prática integral, sem corte. Pesagem, diluição, medição de OG, correção de pH e inoculação.' },
      { id: 'a0503', t: 'Dia 0 — reidratando a levedura do jeito certo', m: 13, v: null, lab: true,
        d: 'Go-Ferm, temperatura da água, choque térmico e por que jogar o sachê seco no mosto desperdiça metade das células.' },
      { id: 'a0504', t: 'Dias 1 a 14 — a rotina', m: 21, v: null, lab: true,
        d: 'Filmado ao longo de duas semanas: adições de nutriente, degassing, leituras de densidade e o que cada mudança de cheiro significa.' },
      { id: 'a0505', t: 'Trasfega: quando e como', m: 16, v: null, lab: true,
        d: 'O momento certo de tirar do sedimento. Técnica de sifonagem sem oxidar e sem puxar borra.' },
      { id: 'a0506', t: 'Maturação: os 60 dias que ninguém tem paciência', m: 14, v: null,
        d: 'O que acontece quimicamente na maturação e por que hidromel jovem tem gosto de álcool. Como acelerar sem estragar.' },
      { id: 'a0507', t: 'Backsweetening: adoçando sem explodir garrafa', m: 18, v: null, lab: true,
        d: 'Sorbato + metabissulfito, dose correta e a conta de risco. A aula que evita a garrafa estourando no armário do cliente.' },
      { id: 'a0508', t: 'Engarrafando o primeiro lote', m: 17, v: null, lab: true,
        d: 'Escolha de garrafa, arrolhamento, headspace, higienização final e o registro do lote.' },
    ],
  },

  /* ------------------------------------------------------------------ M06 */
  {
    id: 'm06',
    n: 6,
    plano: 'iniciado',
    titulo: 'Receitas Medievais Clássicas',
    subtitulo: 'As onze categorias históricas — com receita fechada de cada uma',
    epigrafe: 'Não é releitura. É o que estava escrito nos manuscritos.',
    cor: '#6B1F2A',
    destaque: true,
    aulas: [
      { id: 'a0601', t: 'Metheglin — o hidromel das especiarias', m: 19, v: null,
        d: 'Do galês "meddyglyn", bebida medicinal. Canela, cravo, gengibre, noz-moscada. Receita fechada + quando adicionar cada especiaria.' },
      { id: 'a0602', t: 'Melomel — hidromel com frutas', m: 20, v: null,
        d: 'A categoria mais comercial. Proporção fruta/mel, primária x secundária, e as 6 frutas brasileiras que funcionam melhor.' },
      { id: 'a0603', t: 'Cyser — mel e maçã', m: 16, v: null,
        d: 'O clássico inglês. Suco puro x fruta inteira, e por que cyser é a porta de entrada mais fácil para quem nunca bebeu hidromel.' },
      { id: 'a0604', t: 'Pyment — mel e uva', m: 17, v: null,
        d: 'A ponte entre hidromel e vinho. Tinto e branco, e o hippocras (pyment com especiarias) das cortes medievais.' },
      { id: 'a0605', t: 'Braggot — mel e malte', m: 18, v: null,
        d: 'O híbrido cerveja-hidromel do País de Gales. Mostura simplificada, proporções e o lúpulo na medida certa.' },
      { id: 'a0606', t: 'Bochet — o mel caramelizado', m: 22, v: null, lab: true,
        d: 'A técnica medieval mais impressionante: cozinhar o mel até caramelizar. Notas de toffee, marshmallow e chocolate. O passo a passo com segurança — mel a 130°C queima gente.' },
      { id: 'a0607', t: 'Sack Mead — o hidromel forte e doce', m: 15, v: null,
        d: 'Alto teor de mel, doçura residual, 14–18% ABV. O estilo de sobremesa que sustenta preço premium.' },
      { id: 'a0608', t: 'Acerglyn e Rhodomel — bordo e rosas', m: 14, v: null,
        d: 'Duas categorias raras. Rhodomel com pétalas de rosa é o produto de casamento com maior margem que existe.' },
      { id: 'a0609', t: 'T\'ej etíope e o gesho', m: 16, v: null,
        d: 'A tradição viva mais antiga do mundo. Como substituir o gesho (Rhamnus prinoides) com ingrediente disponível no Brasil.' },
      { id: 'a0610', t: 'Trójniak, Dwójniak e a escala polonesa', m: 15, v: null,
        d: 'Półtorak, dwójniak, trójniak, czwórniak: o sistema polonês de proporção mel:água, protegido por indicação geográfica na UE.' },
    ],
  },

  /* ------------------------------------------------------------------ M07 */
  {
    id: 'm07',
    n: 7,
    plano: 'iniciado',
    titulo: 'Estabilização e Clarificação',
    subtitulo: 'Transformar líquido turvo em produto de prateleira',
    epigrafe: 'O cliente bebe com os olhos primeiro.',
    cor: '#9C7A2E',
    aulas: [
      { id: 'a0701', t: 'Por que hidromel fica turvo', m: 12, v: null,
        d: 'Proteína, pectina, levedura em suspensão e turbidez a frio. Diagnóstico por observação.' },
      { id: 'a0702', t: 'Clarificação natural pelo tempo', m: 11, v: null,
        d: 'A opção gratuita: como sedimentar em frio e trasfegar em cascata. Quanto tempo realmente leva.' },
      { id: 'a0703', t: 'Bentonita, Sparkolloid, quitosana e gelatina', m: 18, v: null, lab: true,
        d: 'Os quatro clarificantes que funcionam. Dose, ordem de aplicação e o teste de bancada antes de tratar 20 litros.' },
      { id: 'a0704', t: 'Estabilização química: sorbato e sulfito', m: 17, v: null,
        d: 'A dupla que impede refermentação. Doses por litro em função do pH, e por que a ordem de adição importa.' },
      { id: 'a0705', t: 'Filtragem: vale a pena?', m: 13, v: null,
        d: 'Placas, cartucho e a perda de aroma. Quando filtrar ajuda e quando é dinheiro jogado fora.' },
      { id: 'a0706', t: 'Carbonatação: natural x forçada', m: 19, v: null, lab: true,
        d: 'Priming com açúcar (com a conta de segurança), contrapressão e barril. Como fazer hidromel espumante sem bomba de fragmentação.' },
      { id: 'a0707', t: 'Teste de estabilidade antes de vender', m: 14, v: null,
        d: 'O protocolo de 30 dias que evita devolução de lote inteiro: garrafa-teste em estufa, choque térmico e prova cega.' },
    ],
  },

  /* ------------------------------------------------------------------ M08 */
  {
    id: 'm08',
    n: 8,
    plano: 'iniciado',
    titulo: 'Envase, Envelhecimento e Madeira',
    subtitulo: 'Onde o hidromel comum vira hidromel caro',
    epigrafe: 'Tempo é o ingrediente que não se compra — só se planeja.',
    cor: '#7A4B2A',
    aulas: [
      { id: 'a0801', t: 'Escolha de garrafa e fechamento', m: 15, v: null,
        d: 'Borgonha, bordalesa, champanhotte, swing-top. Rolha natural, sintética, screw cap e cápsula. Custo por unidade e percepção de valor.' },
      { id: 'a0802', t: 'Oxidação: o inimigo silencioso', m: 13, v: null,
        d: 'Headspace, contrapressão de CO₂ e SO₂ livre. Como um lote perfeito vira papelão em 4 meses.' },
      { id: 'a0803', t: 'Envelhecimento em madeira: carvalho', m: 18, v: null,
        d: 'Barril, cubos, espirais e chips. Tosta média x forte, tempo de contato e teste sensorial semanal.' },
      { id: 'a0804', t: 'Madeiras brasileiras: amburana, jequitibá, bálsamo', m: 21, v: null,
        d: 'O diferencial que nenhum concorrente estrangeiro tem. Amburana dá baunilha e canela naturais — e cria um hidromel que só existe aqui.' },
      { id: 'a0805', t: 'Blending: montando o lote final', m: 17, v: null, lab: true,
        d: 'A técnica de assemblage aplicada ao hidromel. Como corrigir um lote fraco misturando, e a planilha de proporção.' },
      { id: 'a0806', t: 'Armazenagem e vida de prateleira', m: 12, v: null,
        d: 'Temperatura, luz, posição da garrafa. Qual a validade real e o que escrever no rótulo.' },
    ],
  },

  /* ------------------------------------------------------------------ M09 */
  {
    id: 'm09',
    n: 9,
    plano: 'iniciado',
    titulo: 'Diagnóstico de Defeitos',
    subtitulo: '20 problemas, causa e correção',
    epigrafe: 'Todo mestre já perdeu um lote. A diferença é saber por quê.',
    cor: '#5B4636',
    aulas: [
      { id: 'a0901', t: 'Cheiro de ovo podre (H₂S)', m: 14, v: null,
        d: 'A causa nº 1 de lote perdido: estresse nutricional. Correção com cobre e quando já não tem volta.' },
      { id: 'a0902', t: 'Óleo fúsel, solvente e "esquenta garganta"', m: 13, v: null,
        d: 'Fermentação quente demais. Como identificar e o que a maturação consegue ou não consertar.' },
      { id: 'a0903', t: 'Acetaldeído, acidez volátil e vinagre', m: 15, v: null,
        d: 'Acetobacter e oxigênio. O ponto de não-retorno e como evitar na trasfega.' },
      { id: 'a0904', t: 'Brett, filme branco e contaminação', m: 14, v: null,
        d: 'Identificação visual de flor, mofo e infecção. Descartar ou salvar: o critério.' },
      { id: 'a0905', t: 'Adstringência, amargor e sabor de fenol', m: 12, v: null,
        d: 'Cloro na água, sementes de fruta trituradas e excesso de casca. Prevenção na formulação.' },
      { id: 'a0906', t: 'Painel sensorial: treinando seu paladar', m: 18, v: null, lab: true,
        d: 'Como montar amostras de referência com defeito induzido para calibrar o próprio nariz. O que juiz de concurso faz.' },
    ],
  },

  /* ------------------------------------------------------------------ M10 */
  {
    id: 'm10',
    n: 10,
    plano: 'mestre',
    titulo: 'Linha Premium: Receitas Inusitadas',
    subtitulo: 'Dez produtos que não existem na prateleira brasileira',
    epigrafe: 'Não compita em preço com quem faz o mesmo que você.',
    cor: '#8B1E3F',
    destaque: true,
    aulas: [
      { id: 'a1001', t: 'A lógica do produto que ninguém tem', m: 16, v: null,
        d: 'Por que receita inusitada não é capricho: é a única forma de fugir da comparação de preço. O critério para inventar sem errar.' },
      { id: 'a1002', t: 'Bochet de café e cardamomo', m: 20, v: null,
        d: 'Mel caramelizado + café de origem em cold brew + cardamomo verde. O produto de maior margem da linha: custo R$ 19, venda R$ 149.' },
      { id: 'a1003', t: 'Melomel de jabuticaba com amburana', m: 19, v: null,
        d: 'Fruta 100% brasileira + madeira 100% brasileira. Cor de rubi, nota de baunilha. O produto-bandeira para exportação e presente.' },
      { id: 'a1004', t: 'Capsicumel de pimenta rosa e mel de aroeira', m: 18, v: null,
        d: 'Picância controlada. Como dosar capsaicina sem tornar impossível de beber, e o pareamento com carnes que vende em restaurante.' },
      { id: 'a1005', t: 'Hidromel de hibisco e gengibre', m: 16, v: null,
        d: 'Cor magenta impossível de ignorar na foto. O produto feito para Instagram — e que ainda assim é sério no copo.' },
      { id: 'a1006', t: 'Sack mead de mel de cipó-uva com baunilha', m: 17, v: null,
        d: 'Sobremesa em garrafa de 375ml. Ticket alto, volume baixo, giro de fim de ano.' },
      { id: 'a1007', t: 'Braggot de café torrado e cacau nibs', m: 18, v: null,
        d: 'Corpo de stout, alma de hidromel. O produto que converte bebedor de cerveja artesanal.' },
      { id: 'a1008', t: 'Hidromel seco de eucalipto para harmonização', m: 15, v: null,
        d: 'Seco, mineral, 11% ABV. O produto que entra em carta de restaurante — onde o preço por garrafa triplica.' },
      { id: 'a1009', t: 'Série limitada: barril, safra e numeração', m: 19, v: null,
        d: 'Como construir escassez real e não fabricada. Numeração manual, safra e o efeito no preço e na lista de espera.' },
      { id: 'a1010', t: 'Montando sua linha: 4 produtos, 4 preços', m: 21, v: null, pdf: 'linha-premium.pdf',
        d: 'O portfólio completo: entrada, carro-chefe, premium e edição limitada. Com a tabela de custo e preço de cada um.' },
    ],
  },

  /* ------------------------------------------------------------------ M11 */
  {
    id: 'm11',
    n: 11,
    plano: 'mestre',
    titulo: 'Legalização',
    subtitulo: 'MAPA, vigilância, rótulo e a burocracia real',
    epigrafe: 'Vender bebida sem registro é infração sanitária. Este módulo existe para você não passar por isso.',
    cor: '#2F4858',
    destaque: true,
    aulas: [
      { id: 'a1101', t: 'O mapa da burocracia: o que exige o quê', m: 18, v: null, free: true, pdf: 'checklist-legalizacao.pdf',
        d: 'Visão geral honesta: MAPA, vigilância sanitária municipal, corpo de bombeiros, meio ambiente e receita. O que vem primeiro e o custo estimado de cada etapa.' },
      { id: 'a1102', t: 'CNPJ: MEI serve? CNAE e enquadramento', m: 20, v: null,
        d: 'A resposta direta: fabricação de bebida alcoólica NÃO é permitida no MEI. Quais CNAEs usar, ME x EPP, Simples Nacional e o custo mensal real.' },
      { id: 'a1103', t: 'Registro no MAPA: estabelecimento e produto', m: 24, v: null,
        d: 'Lei 8.918/94 e Decreto 6.871/09. Registro do estabelecimento, depois do produto. Documentos, memorial descritivo, responsável técnico e prazos.' },
      { id: 'a1104', t: 'Responsável técnico e memorial descritivo', m: 16, v: null,
        d: 'Quem pode assinar, quanto custa contratar e como montar o memorial de fabricação sem pagar consultoria de R$ 8 mil.' },
      { id: 'a1105', t: 'Análise laboratorial: o laudo por lote', m: 17, v: null,
        d: 'Físico-química obrigatória: ABV, acidez, densidade, açúcares, metanol. Laboratórios credenciados e custo por análise.' },
      { id: 'a1106', t: 'Rótulo legal: o que é obrigatório e o que é proibido', m: 22, v: null, pdf: 'guia-rotulagem.pdf',
        d: 'Atenção: a norma restringe termos como "premium", "artesanal" e "natural" no painel principal. E adicionar fruta pode obrigar a chamar de "bebida alcoólica mista", não de hidromel. Como contornar legalmente.' },
      { id: 'a1107', t: 'Vigilância sanitária e boas práticas de fabricação', m: 18, v: null,
        d: 'Alvará, planta, POPs e manual de BPF. O checklist do fiscal — e como estar pronto para ele.' },
      { id: 'a1108', t: 'Impostos: IPI, ICMS, Simples e nota fiscal', m: 21, v: null,
        d: 'Bebida alcoólica tem carga tributária alta. A conta completa para não descobrir o imposto depois de definir o preço.' },
    ],
  },

  /* ------------------------------------------------------------------ M12 */
  {
    id: 'm12',
    n: 12,
    plano: 'mestre',
    titulo: 'Custos e Precificação',
    subtitulo: 'A conta que decide se o negócio existe',
    epigrafe: 'Quem não sabe o CMV está doando produto e chamando de venda.',
    cor: '#2E5E4E',
    aulas: [
      { id: 'a1201', t: 'Ficha técnica: custo real de uma garrafa', m: 19, v: null, lab: true,
        d: 'Mel, levedura, nutriente, garrafa, rolha, cápsula, rótulo, gás, energia e perda. A conta completa, sem esquecer nada.' },
      { id: 'a1202', t: 'Perdas: os 8% que ninguém coloca na planilha', m: 14, v: null,
        d: 'Borra, quebra, lote reprovado e amostra. Como provisionar perda e por que ignorar isso destrói a margem.' },
      { id: 'a1203', t: 'Custo fixo e ponto de equilíbrio', m: 17, v: null,
        d: 'Aluguel, contador, responsável técnico, taxas. Quantas garrafas por mês pagam a estrutura antes do primeiro real de lucro.' },
      { id: 'a1204', t: 'Markup, margem e o erro de multiplicar por 3', m: 18, v: null,
        d: 'Por que "custo x 3" quebra negócio de bebida. A fórmula de markup divisor com imposto e comissão embutidos.' },
      { id: 'a1205', t: 'Preço por canal: direto, feira, bar e distribuidor', m: 20, v: null,
        d: 'A mesma garrafa tem 4 preços. Como montar a tabela para não brigar com o próprio revendedor.' },
      { id: 'a1206', t: 'Precificação premium: ancoragem e valor percebido', m: 19, v: null,
        d: 'Como sustentar R$ 140 numa garrafa cujo custo é R$ 22 — e por que baixar preço é o caminho mais rápido para o fim.' },
      { id: 'a1207', t: 'Simulando seu negócio na Calculadora da Ordem', m: 15, v: null, lab: true,
        d: 'Prática guiada: montar sua própria ficha técnica e ver o lucro por garrafa e o ponto de equilíbrio, dentro da área de membros.' },
    ],
  },

  /* ------------------------------------------------------------------ M13 */
  {
    id: 'm13',
    n: 13,
    plano: 'mestre',
    titulo: 'Marca e Storytelling',
    subtitulo: 'A garrafa vende antes de ser aberta',
    epigrafe: 'Ninguém paga caro por hidromel. Pagam caro pela história dentro dele.',
    cor: '#4A2C5E',
    aulas: [
      { id: 'a1301', t: 'Posicionamento: para quem, contra quem', m: 17, v: null,
        d: 'Definir o inimigo da sua marca. Sem isso o rótulo fica bonito e genérico — e genérico compete por preço.' },
      { id: 'a1302', t: 'Naming: 40 nomes e o método por trás', m: 16, v: null,
        d: 'Nórdico, latino, indígena, toponímico. Como testar disponibilidade no INPI e no registro de domínio antes de se apaixonar.' },
      { id: 'a1303', t: 'A história de origem que sustenta preço', m: 20, v: null,
        d: 'O exercício do módulo 1 aplicado à SUA marca. Estrutura em 5 partes, com três exemplos completos escritos.' },
      { id: 'a1304', t: 'Design de rótulo que passa na fiscalização', m: 21, v: null,
        d: 'Hierarquia visual, painel principal x secundário, e como encaixar as obrigatoriedades legais sem destruir o design.' },
      { id: 'a1305', t: 'Registro de marca no INPI', m: 15, v: null,
        d: 'Classe 33, busca de anterioridade, custo real e prazo. Fazer sozinho x contratar.' },
      { id: 'a1306', t: 'Fotografia de produto com celular', m: 19, v: null, lab: true,
        d: 'Luz de janela, fundo, contraluz em líquido âmbar. O setup de R$ 0 que produz foto de catálogo.' },
      { id: 'a1307', t: 'Kit de marca: o que produzir antes de vender', m: 14, v: null,
        d: 'Rótulo, contra-rótulo, caixa, tag, sacola e cartão de degustação. Fornecedores e tiragem mínima.' },
    ],
  },

  /* ------------------------------------------------------------------ M14 */
  {
    id: 'm14',
    n: 14,
    plano: 'mestre',
    titulo: 'Vendas',
    subtitulo: 'Do Instagram ao distribuidor',
    epigrafe: 'Produzir é a parte fácil. Este é o módulo que paga a conta.',
    cor: '#1F4E79',
    destaque: true,
    aulas: [
      { id: 'a1401', t: 'Os 6 canais e a ordem certa de abrir', m: 18, v: null,
        d: 'Direto, feira, bar/restaurante, loja especializada, distribuidor e e-commerce. Margem, esforço e velocidade de cada um.' },
      { id: 'a1402', t: 'Instagram: o perfil que vende bebida', m: 22, v: null,
        d: 'Bio, destaques, grade e o formato de post que funciona para bebida artesanal. Restrições da Meta para álcool — e como não ter conta derrubada.' },
      { id: 'a1403', t: 'Conteúdo: 30 ideias de post prontas', m: 19, v: null, pdf: 'calendario-conteudo.pdf',
        d: 'Calendário de 30 dias com pauta, formato e legenda-base. Baseado no eixo histórico, que é o que diferencia.' },
      { id: 'a1404', t: 'Degustação: o script que fecha venda', m: 20, v: null,
        d: 'A sequência de 7 minutos numa feira: aborda, conta a história, serve, pergunta, fecha. Palavra por palavra.' },
      { id: 'a1405', t: 'Vendendo para bar e restaurante', m: 21, v: null,
        d: 'Como abordar sommelier e proprietário, a amostra que se leva, a tabela que se apresenta e a harmonização que convence.' },
      { id: 'a1406', t: 'Feiras e eventos: a conta que precisa fechar', m: 17, v: null,
        d: 'Custo de estande, estoque a levar, ponto de equilíbrio do dia e o pós-evento que gera recompra.' },
      { id: 'a1407', t: 'Distribuidor: quando vale abrir mão de margem', m: 16, v: null,
        d: 'O cálculo de quando o volume compensa o desconto, e as cláusulas de exclusividade que prendem produtor pequeno.' },
      { id: 'a1408', t: 'E-commerce e a logística de vidro', m: 18, v: null,
        d: 'Restrição de transporte de álcool, embalagem antiquebra, frete e a operação de envio que não gera prejuízo.' },
      { id: 'a1409', t: 'Recompra: clube de assinatura de hidromel', m: 19, v: null,
        d: 'O modelo de maior valor por cliente. Como estruturar níveis, precificar e reter — com a matemática do LTV.' },
    ],
  },

  /* ------------------------------------------------------------------ M15 */
  {
    id: 'm15',
    n: 15,
    plano: 'real',
    titulo: 'Escala',
    subtitulo: 'De 50 para 1.000 garrafas por mês',
    epigrafe: 'Escalar processo ruim só multiplica o problema.',
    cor: '#7A2E1E',
    aulas: [
      { id: 'a1501', t: 'Quando escalar — e quando não', m: 16, v: null,
        d: 'Os indicadores que dizem que chegou a hora. E os três sinais de que escalar agora quebra o negócio.' },
      { id: 'a1502', t: 'Padronização: POP e reprodutibilidade de lote', m: 20, v: null,
        d: 'Transformar sua receita em procedimento que outra pessoa executa com o mesmo resultado. Base do controle de qualidade.' },
      { id: 'a1503', t: 'Planejamento de produção e giro', m: 18, v: null,
        d: 'Hidromel leva meses. Como planejar produção com 4 meses de antecedência para não faltar no Natal.' },
      { id: 'a1504', t: 'Contratando: as duas primeiras pessoas', m: 17, v: null,
        d: 'Quem contratar primeiro, custo real de um funcionário e as alternativas legais para operação pequena.' },
      { id: 'a1505', t: 'Fluxo de caixa de negócio com estoque longo', m: 19, v: null,
        d: 'O capital de giro que trava produtor de bebida. Simulação de 12 meses com sazonalidade.' },
      { id: 'a1506', t: 'Ciganagem e produção terceirizada', m: 16, v: null,
        d: 'Produzir na estrutura registrada de outro produtor: como funciona, contrato e quando é a melhor saída.' },
    ],
  },
];

/* ------------------------------------------------------------------ BÔNUS */
export const BONUS = [
  { id: 'b1', nome: 'Grimório do Hidromel', tipo: 'PDF', valor: 197, plano: 'iniciado',
    arquivo: 'grimorio-do-hidromel.pdf', icone: 'grimorio',
    desc: '30 receitas fechadas — 11 medievais clássicas, 10 premium inusitadas e 9 sazonais. Com formulação, cronograma e ficha sensorial de cada uma.' },
  { id: 'b2', nome: 'Manual de Legalização e Precificação', tipo: 'PDF', valor: 297, plano: 'mestre',
    arquivo: 'manual-legalizacao-precificacao.pdf', icone: 'pergaminho',
    desc: 'O caminho completo da burocracia: MAPA, CNAE, rótulo, laudo e impostos. Mais o modelo de ficha técnica e a fórmula de markup.' },
  { id: 'b3', nome: 'Fichas de Fermentação', tipo: 'PDF', valor: 47, plano: 'iniciado',
    arquivo: 'fichas-de-fermentacao.pdf', icone: 'ficha',
    desc: 'Fichas imprimíveis de controle de lote, cronograma TOSNA, registro de densidade e avaliação sensorial.' },
  { id: 'b4', nome: 'Calculadoras da Ordem', tipo: 'Ferramenta', valor: 397, plano: 'iniciado',
    arquivo: null, icone: 'calculadora',
    desc: 'Cinco calculadoras dentro da área de membros: mosto e ABV, backsweetening seguro, nutriente TOSNA, escalonamento de receita e precificação.' },
  { id: 'b5', nome: 'Pack de 30 Rótulos Editáveis', tipo: 'Arquivos', valor: 197, plano: 'mestre',
    arquivo: null, icone: 'rotulo',
    desc: 'Trinta rótulos em estilo medieval e premium, editáveis, já com os campos obrigatórios de lei posicionados.' },
  { id: 'b6', nome: 'A Ordem — Comunidade e Mentoria', tipo: 'Acesso', valor: 997, plano: 'real',
    arquivo: null, icone: 'ordem',
    desc: 'Grupo fechado, encontro mensal ao vivo para análise de lote e revisão do seu rótulo e da sua precificação.' },
];

/* --------------------------------------------------------------- DERIVADOS */
export const STATS = (() => {
  const aulas = CURRICULO.reduce((s, m) => s + m.aulas.length, 0);
  const min = CURRICULO.reduce((s, m) => s + m.aulas.reduce((a, x) => a + x.m, 0), 0);
  const praticas = CURRICULO.reduce((s, m) => s + m.aulas.filter((a) => a.lab).length, 0);
  return {
    modulos: CURRICULO.length,
    aulas,
    minutos: min,
    horas: Math.round(min / 60),
    praticas,
    bonus: BONUS.length,
    valorBonus: BONUS.reduce((s, b) => s + b.valor, 0),
  };
})();

export const ordemPlano = (p) => PLANOS[p]?.ordem ?? 0;
export const temAcesso = (planoAluno, planoExigido) =>
  ordemPlano(planoAluno) >= ordemPlano(planoExigido);
export const aulasGratis = () =>
  CURRICULO.flatMap((m) => m.aulas.filter((a) => a.free).map((a) => ({ ...a, modulo: m })));
