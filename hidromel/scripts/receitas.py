# -*- coding: utf-8 -*-
"""
CONTEÚDO DAS 30 RECEITAS DO GRIMÓRIO.

Separado do gerador de PDF de propósito: aqui é texto, lá é diagramação.
Quem for revisar receita não precisa encostar em código de layout.

Todas as formulações são para 20 L, com OG calculada em 292 pontos por kg de
mel por litro (ver assets/js/calculadoras.js para a dedução dessa constante).
"""

# ---------------------------------------------------------------------------
# MEDIEVAIS CLÁSSICAS — as onze categorias históricas
# ---------------------------------------------------------------------------

MEDIEVAIS = [
    {
        "nome": "Traditional Show Mead",
        "sub": "A receita mestra — mel, água e levedura",
        "origem": "Europa, registro contínuo desde a Antiguidade",
        "historia": (
            "“Show mead” é o hidromel que não tem onde se esconder: sem fruta, sem "
            "especiaria, sem madeira. É o teste do produtor e o teste do mel. Se o "
            "resultado for bom aqui, será bom em qualquer outra categoria — e se for "
            "ruim, nenhuma fruta vai salvar."
        ),
        "og": 1.088, "fg": 1.010, "abv": 10.5, "estilo": "Semi-seco",
        "ingredientes": [
            ("Mel de flor de laranjeira", "6,0 kg"),
            ("Água filtrada sem cloro", "até completar 20 L"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Go-Ferm", "12,5 g"),
            ("Fermaid-O (TOSNA, 4 adições)", "21 g no total"),
        ],
        "passos": [
            "Sanitize tudo o que vai encostar no mosto. Star San a 1,5 mL/L, 60 segundos de contato.",
            "Dissolva o mel em 8 L de água morna (não passe de 40 °C — acima disso os aromas voláteis evaporam).",
            "Complete até 20 L com água fria. Meça a OG: deve ficar em 1,088 (±0,003).",
            "Reidrate a levedura em 125 mL de água a 40 °C com o Go-Ferm. Espere 20 min.",
            "Iguale a temperatura do fermento à do mosto antes de inocular — diferença acima de 10 °C mata metade das células.",
            "Fermente entre 18 e 20 °C.",
            "Nutriente escalonado: 5,3 g às 24 h, 48 h e 72 h, e a última dose quando a densidade tiver caído 1/3.",
            "Faça degassing diário até o 7º dia.",
            "Trasfegue aos 21 dias, ou quando a densidade estiver estável por 3 leituras seguidas.",
            "Maturação: 60 dias no mínimo. Aos 90 fica outro produto.",
        ],
        "nota": (
            "Quem prova hidromel jovem e acha que “tem gosto de álcool” está provando "
            "um produto que ainda não terminou. Não é defeito, é pressa."
        ),
    },
    {
        "nome": "Metheglin de Especiarias",
        "sub": "O hidromel medicinal galês",
        "origem": "País de Gales — do galês *meddyglyn*, “licor curativo”",
        "historia": (
            "O nome vem da mesma raiz de *meddyg*, médico. Metheglin era remédio antes "
            "de ser bebida: mosteiros medievais infundiam especiarias caras — que vinham "
            "das rotas do Oriente — em hidromel para tratar de tudo. A especiaria, na "
            "época, valia mais que o mel."
        ),
        "og": 1.092, "fg": 1.016, "abv": 10.2, "estilo": "Semi-doce",
        "ingredientes": [
            ("Mel silvestre", "6,3 kg"),
            ("Canela em pau", "3 unidades"),
            ("Cravo-da-índia", "6 unidades"),
            ("Gengibre fresco em lâminas", "40 g"),
            ("Noz-moscada ralada na hora", "1/2 unidade"),
            ("Levedura Lalvin D47", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Monte o mosto como no Show Mead. Fermente limpo, SEM especiaria nenhuma.",
            "Só depois da fermentação primária: faça um chá frio das especiarias em 500 mL de hidromel do próprio lote, por 48 h.",
            "Prove esse extrato a cada 12 h. É ele que dita a intensidade.",
            "Misture o extrato coado ao lote inteiro, aos poucos, provando entre as adições.",
            "Pare quando as especiarias aparecerem no fim do gole, não no começo.",
            "Maturação mínima de 90 dias: especiaria jovem é agressiva e se harmoniza com o tempo.",
        ],
        "nota": (
            "Adicionar especiaria na primária é o erro mais comum. O CO₂ arrasta os "
            "aromáticos para fora e o que fica é o amargor. Sempre depois."
        ),
    },
    {
        "nome": "Melomel de Frutas Vermelhas",
        "sub": "A categoria mais comercial de todas",
        "origem": "Toda a Europa medieval — melomel é qualquer hidromel com fruta",
        "historia": (
            "Melomel é a categoria guarda-chuva: mel + qualquer fruta que não seja maçã "
            "(cyser) nem uva (pyment). É a porta de entrada do público que nunca bebeu "
            "hidromel, porque a fruta dá referência para o paladar."
        ),
        "og": 1.095, "fg": 1.012, "abv": 11.2, "estilo": "Semi-seco",
        "ingredientes": [
            ("Mel silvestre", "6,0 kg"),
            ("Amora congelada", "2,0 kg"),
            ("Framboesa congelada", "1,0 kg"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Pectinase", "2 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Congele e descongele a fruta: o gelo rompe as células e libera muito mais suco e cor.",
            "Fermente o hidromel base sozinho até a densidade cair pela metade.",
            "Só então adicione a fruta, em saco de malha, na fermentação secundária.",
            "Adicione a pectinase junto com a fruta, para evitar turbidez permanente por pectina.",
            "Deixe 10 a 14 dias em contato. Prove a partir do 7º.",
            "Retire o saco sem espremer — espremer extrai tanino da semente e traz adstringência.",
            "Trasfegue e deixe clarificar a frio por 30 dias.",
        ],
        "nota": (
            "Fruta na primária perde 40% do aroma pelo arraste de CO₂. Fruta na "
            "secundária mantém o perfume. Mesma fruta, produto completamente diferente."
        ),
    },
    {
        "nome": "Cyser de Maçã",
        "sub": "Mel e maçã — o clássico inglês",
        "origem": "Inglaterra e Normandia",
        "historia": (
            "Onde havia pomar, havia cyser. Nas regiões de sidra, misturar mel ao mosto "
            "de maçã era a forma de subir o teor alcoólico e a guarda antes que se "
            "conhecesse qualquer química de fermentação."
        ),
        "og": 1.090, "fg": 1.008, "abv": 11.0, "estilo": "Seco",
        "ingredientes": [
            ("Mel de laranjeira", "4,5 kg"),
            ("Suco de maçã integral sem conservante", "12 L"),
            ("Água", "até completar 20 L"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Ácido málico", "a ajustar para pH 3,4"),
        ],
        "passos": [
            "Confira o rótulo do suco: sorbato ou benzoato impedem a fermentação. Se tiver, não serve.",
            "Misture mel e suco. Complete com água até 20 L.",
            "Ajuste o pH para 3,4–3,6 antes de inocular.",
            "Fermente a 16–18 °C — o frio preserva o éster de maçã.",
            "Trasfegue aos 30 dias e maturação de 60.",
        ],
        "nota": (
            "O cyser é o hidromel que mais converte cliente novo: o paladar reconhece "
            "maçã, e o mel entra como surpresa agradável em vez de estranheza."
        ),
    },
    {
        "nome": "Pyment de Uva Tinta",
        "sub": "A ponte entre o hidromel e o vinho",
        "origem": "Roma e França medieval",
        "historia": (
            "Quando a colheita de uva era ruim, adicionava-se mel ao mosto para salvar "
            "a safra. Da versão com especiarias nasceu o *hippocras*, servido nas cortes "
            "e assim chamado por passar pela “manga de Hipócrates”, o filtro de pano cônico."
        ),
        "og": 1.098, "fg": 1.004, "abv": 12.6, "estilo": "Seco",
        "ingredientes": [
            ("Mel silvestre escuro", "4,0 kg"),
            ("Suco de uva integral tinto", "10 L"),
            ("Levedura Lalvin RC-212", "10 g"),
            ("Tanino enológico", "2 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Misture mel e suco de uva; complete com água.",
            "Adicione o tanino no mosto — ele dá estrutura e ajuda na clarificação.",
            "Fermente a 22–24 °C: a RC-212 é cepa tinta e trabalha mais quente.",
            "Trasfegue aos 21 dias.",
            "Envelheça com carvalho francês em cubos, 6 g/L, por 45 dias.",
        ],
        "nota": "Serve como carta de apresentação para sommelier: é o hidromel que fala a língua do vinho.",
    },
    {
        "nome": "Braggot de Malte",
        "sub": "Metade hidromel, metade cerveja",
        "origem": "País de Gales — *bragawd*",
        "historia": (
            "Citado nas leis galesas do século X, o braggot era servido em ocasiões "
            "solenes e valia mais que a cerveja comum. É o híbrido mais antigo "
            "documentado entre as duas bebidas."
        ),
        "og": 1.086, "fg": 1.014, "abv": 9.5, "estilo": "Semi-doce",
        "ingredientes": [
            ("Mel silvestre", "3,5 kg"),
            ("Extrato de malte claro", "2,0 kg"),
            ("Lúpulo Saaz", "20 g"),
            ("Levedura Safale US-05", "11,5 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Ferva 8 L de água com o extrato de malte por 45 min.",
            "Adicione o lúpulo nos últimos 15 min. Lúpulo cedo demais amarga e cobre o mel.",
            "Resfrie até 25 °C. SÓ ENTÃO dissolva o mel — mel fervido perde tudo que o torna mel.",
            "Complete até 20 L, inocule e fermente a 18–20 °C.",
            "Pronto em 30 dias. É a receita mais rápida do grimório.",
        ],
        "nota": "Braggot é o produto que converte bebedor de cerveja artesanal. Use isso na feira.",
    },
    {
        "nome": "Bochet — o Mel Caramelizado",
        "sub": "A técnica medieval mais impressionante",
        "origem": "França, séc. XIV — *Le Ménagier de Paris*",
        "historia": (
            "O manuscrito parisiense de 1393 descreve ferver o mel até escurecer antes "
            "de fazer o hidromel. O açúcar caramelizado e as reações de Maillard criam "
            "notas de toffee, marshmallow queimado e chocolate que nenhum ingrediente "
            "adicionado reproduz."
        ),
        "og": 1.100, "fg": 1.018, "abv": 11.5, "estilo": "Doce",
        "ingredientes": [
            ("Mel silvestre", "6,5 kg"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "SEGURANÇA: mel a 130 °C é mais perigoso que óleo quente. Panela alta, fogo médio, luva, mangas longas, sem crianças por perto.",
            "Cozinhe o mel puro, mexendo sempre. Ele vai espumar e subir — por isso a panela alta.",
            "Alvo por cor: 40 min = âmbar (toffee) · 60 min = mogno (chocolate) · 75 min = quase preto (amargo, café).",
            "Desligue e espere baixar para 80 °C.",
            "Adicione água quente MUITO devagar. Água fria em mel a 120 °C explode em vapor.",
            "Complete até 20 L, resfrie até 25 °C e inocule.",
            "Envelhecimento mínimo de 6 meses. O bochet jovem é agressivo; aos 12 meses fica notável.",
        ],
        "nota": (
            "Perde-se cerca de 15% do volume de mel na caramelização. Já está contabilizado "
            "na formulação — se você compensar, o resultado sai doce demais."
        ),
    },
    {
        "nome": "Sack Mead",
        "sub": "Forte, doce, de guarda",
        "origem": "Inglaterra — de *sec*, referência aos vinhos fortificados",
        "historia": (
            "Concentração alta de mel, doçura residual e álcool elevado. Era o hidromel "
            "das ocasiões importantes, feito para envelhecer anos na adega do senhor feudal."
        ),
        "og": 1.130, "fg": 1.030, "abv": 14.5, "estilo": "Sobremesa",
        "ingredientes": [
            ("Mel de cipó-uva ou assa-peixe", "9,0 kg"),
            ("Levedura Lalvin K1-V1116", "15 g"),
            ("Fermaid-O", "26 g escalonado"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Não dissolva todo o mel de uma vez. Comece com 6 kg (OG ~1,088).",
            "Adicione o restante em 3 etapas conforme a densidade cair — é o *step feeding*.",
            "Alimentar aos poucos evita choque osmótico: mosto muito denso desidrata a levedura e trava a fermentação.",
            "Nutriente reforçado: 26 g de Fermaid-O em 4 adições.",
            "Fermente a 18 °C. Vai levar de 45 a 60 dias.",
            "Maturação mínima de 6 meses; o ideal é 12.",
        ],
        "nota": "Engarrafe em 375 mL. Ticket alto, volume baixo, presente de fim de ano.",
    },
    {
        "nome": "Acerglyn de Bordo",
        "sub": "Mel e xarope de bordo",
        "origem": "América do Norte, tradição colonial",
        "historia": (
            "Onde havia bordo, o xarope entrava no hidromel. É categoria oficial em "
            "concurso e praticamente inexistente no Brasil — o que é exatamente a "
            "oportunidade."
        ),
        "og": 1.092, "fg": 1.014, "abv": 10.5, "estilo": "Semi-doce",
        "ingredientes": [
            ("Mel de laranjeira", "4,5 kg"),
            ("Xarope de bordo grau A escuro", "1,5 kg"),
            ("Levedura Lalvin D47", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Dissolva mel e xarope juntos em água morna.",
            "Fermente a 16–18 °C: a D47 produz glicerol e dá corpo.",
            "Guarde 200 g do xarope para adicionar depois da estabilização — devolve o aroma que a fermentação levou.",
            "Maturação de 90 dias.",
        ],
        "nota": "Use xarope escuro (grau A dark). O claro desaparece na fermentação.",
    },
    {
        "nome": "Rhodomel de Rosas",
        "sub": "O hidromel de pétalas",
        "origem": "Pérsia e Roma antiga",
        "historia": (
            "Rosas eram símbolo de amor e de luxo. O rhodomel aparece em receituários "
            "romanos e persas como bebida de celebração — e é, até hoje, o produto de "
            "casamento com a maior margem que existe na categoria."
        ),
        "og": 1.086, "fg": 1.010, "abv": 10.2, "estilo": "Semi-seco",
        "ingredientes": [
            ("Mel de laranjeira", "5,8 kg"),
            ("Pétalas de rosa secas, sem agrotóxico, grau alimentício", "60 g"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Confirme a origem das pétalas. Rosa de floricultura tem defensivo e não serve.",
            "Fermente o hidromel base limpo.",
            "Na secundária, infusão de 40 g por 5 dias. Prove diariamente.",
            "Guarde 20 g para um segundo ajuste, se o aroma tiver ficado tímido.",
            "Rosa demais vira sabonete. O ponto é o aroma aparecer só na retro-olfação.",
        ],
        "nota": "Garrafa de 375 mL, rótulo de casamento, venda por encomenda. Margem altíssima.",
    },
    {
        "nome": "T'ej Etíope",
        "sub": "A tradição viva mais antiga do mundo",
        "origem": "Etiópia — bebida nacional, ininterrupta há mais de mil anos",
        "historia": (
            "Servido em *berele*, o frasco de vidro de gargalo longo, o t'ej é fermentado "
            "com o gesho (*Rhamnus prinoides*), um arbusto que faz o papel do lúpulo: "
            "amarga e conserva. Enquanto a Europa esquecia o hidromel, a Etiópia nunca parou."
        ),
        "og": 1.084, "fg": 1.020, "abv": 8.4, "estilo": "Semi-doce",
        "ingredientes": [
            ("Mel silvestre escuro", "5,5 kg"),
            ("Gesho em lascas (ou substituto — ver nota)", "60 g"),
            ("Levedura selvagem ou Lalvin EC-1118", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Dissolva o mel em água morna.",
            "Ferva o gesho em 2 L de água por 20 min; coe e junte ao mosto frio.",
            "Fermente a 22–25 °C — mais quente que o padrão, como manda a tradição.",
            "O t'ej é bebido jovem: 20 a 30 dias.",
            "Turbidez é característica do estilo. Não clarifique.",
        ],
        "nota": (
            "Sem gesho no Brasil? A substituição mais próxima é lúpulo de baixo alfa "
            "(Saaz, 15 g) com uma pitada de casca de laranja amarga. Não é idêntico — "
            "e o rótulo deve dizer “inspirado no t'ej”, não “t'ej”."
        ),
    },
    {
        "nome": "Trójniak Polonês",
        "sub": "Uma parte de mel, duas de água",
        "origem": "Polônia — protegido por indicação geográfica na União Europeia",
        "historia": (
            "O sistema polonês nomeia pela proporção: *półtorak* (1:0,5), *dwójniak* "
            "(1:1), *trójniak* (1:2) e *czwórniak* (1:3). O trójniak é o equilíbrio — "
            "e a Polônia leva tão a sério que a nomenclatura é protegida por lei europeia."
        ),
        "og": 1.105, "fg": 1.022, "abv": 11.5, "estilo": "Doce",
        "ingredientes": [
            ("Mel silvestre", "7,0 kg"),
            ("Água", "14 L (proporção 1:2 em volume)"),
            ("Lúpulo Lublin", "10 g"),
            ("Levedura Lalvin K1-V1116", "12 g"),
        ],
        "passos": [
            "Tradicionalmente o mosto é fervido — o que clarifica e esteriliza, ao custo de aroma.",
            "Versão moderna: aqueça a 70 °C por 15 min em vez de ferver. Fica no meio-termo.",
            "Adicione o lúpulo nos últimos 10 min do aquecimento.",
            "Resfrie, inocule, fermente a 18 °C.",
            "Maturação mínima de 6 meses. A tradição pede 2 anos.",
        ],
        "nota": "Se for exportar ou vender para público polonês, respeite a proporção. Eles conferem.",
    },
]

# ---------------------------------------------------------------------------
# PREMIUM INUSITADAS — a linha que sustenta preço
# ---------------------------------------------------------------------------

PREMIUM = [
    {
        "nome": "Bochet de Café e Cardamomo",
        "sub": "O carro-chefe da linha premium",
        "origem": "Criação autoral sobre a técnica medieval de bochet",
        "historia": (
            "O mel caramelizado já entrega toffee e chocolate. O café de origem em cold "
            "brew acrescenta acidez e amargor limpos; o cardamomo verde abre o aroma no "
            "topo. É o produto que justifica preço de vinho de guarda numa prateleira "
            "onde ninguém mais tem nada parecido."
        ),
        "og": 1.102, "fg": 1.020, "abv": 11.4, "estilo": "Doce",
        "custo": 19, "venda": 149,
        "ingredientes": [
            ("Mel silvestre (para caramelizar)", "6,5 kg"),
            ("Café de origem em grão, torra média", "180 g"),
            ("Cardamomo verde em vagem", "12 unidades"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Caramelize o mel por 55 min, até o tom mogno (ver Bochet, com as mesmas precauções de segurança).",
            "Faça cold brew: 180 g de café moído grosso em 1,5 L de água fria por 16 h na geladeira.",
            "Coe o café em pano fino. Nunca use café quente — extrai amargor áspero.",
            "Fermente o bochet base sozinho, até o fim.",
            "Estabilize (sorbato + metabissulfito) e espere 24 h.",
            "Adicione o cold brew aos poucos, provando. Comece com metade.",
            "Cardamomo: 12 vagens levemente amassadas, em infusão de 72 h. Prove a cada 24 h.",
            "Maturação de 90 dias após as adições.",
        ],
        "nota": (
            "Cardamomo tem uma janela estreitíssima: no ponto certo é perfume, um dia "
            "depois é sabão. Prove todo dia e não confie no relógio."
        ),
    },
    {
        "nome": "Melomel de Jabuticaba com Amburana",
        "sub": "Cem por cento brasileiro — fruta e madeira",
        "origem": "Criação autoral, Mata Atlântica e Cerrado",
        "historia": (
            "Jabuticaba é uma fruta que praticamente não existe fora do Brasil, e a "
            "amburana entrega baunilha e canela naturalmente, sem nenhum aditivo. Juntas, "
            "criam um hidromel que literalmente não pode ser feito em nenhum outro lugar "
            "do mundo. É o produto-bandeira: presente, exportação e imprensa."
        ),
        "og": 1.096, "fg": 1.014, "abv": 11.1, "estilo": "Semi-doce",
        "custo": 23, "venda": 168,
        "ingredientes": [
            ("Mel de silvestre escuro", "6,0 kg"),
            ("Jabuticaba madura", "4,0 kg"),
            ("Amburana em cubos tostados", "40 g"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Pectinase", "2 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Congele a jabuticaba por 48 h e descongele. A casca é onde está a cor e o tanino.",
            "Fermente o hidromel base até metade da queda de densidade.",
            "Adicione a fruta inteira em saco de malha, na secundária, com a pectinase.",
            "10 dias de contato. NÃO esprema o saco: a semente da jabuticaba é muito amarga.",
            "Trasfegue e adicione a amburana. Comece com 20 g.",
            "Prove a cada 3 dias. Amburana é potente — 20 g podem bastar em 20 L.",
            "Retire a madeira quando a baunilha aparecer no fim do gole, não no meio.",
            "Maturação de 120 dias.",
        ],
        "nota": (
            "Amburana em excesso deixa um gosto medicinal que não sai mais. É sempre "
            "melhor adicionar de novo do que tentar tirar."
        ),
    },
    {
        "nome": "Capsicumel de Pimenta Rosa e Aroeira",
        "sub": "Picância controlada, para harmonizar com carne",
        "origem": "Criação autoral — capsicumel é categoria reconhecida em concurso",
        "historia": (
            "A pimenta rosa é, na verdade, o fruto da aroeira — a mesma árvore que dá "
            "uma das floradas mais marcantes do mel brasileiro. Usar as duas no mesmo "
            "produto fecha uma narrativa que se conta em dez segundos no balcão."
        ),
        "og": 1.088, "fg": 1.008, "abv": 10.8, "estilo": "Seco",
        "custo": 16, "venda": 119,
        "ingredientes": [
            ("Mel de aroeira", "6,0 kg"),
            ("Pimenta rosa em grão", "25 g"),
            ("Pimenta dedo-de-moça sem semente", "2 unidades"),
            ("Levedura Lalvin D47", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Fermente o hidromel base de aroeira até o fim, limpo.",
            "Estabilize.",
            "Extrato: 25 g de pimenta rosa levemente amassada em 500 mL do próprio hidromel, 48 h.",
            "Extrato de picância, separado: 2 dedos-de-moça SEM SEMENTE em 250 mL, por 12 h apenas.",
            "Junte os extratos ao lote em pequenas doses, provando sempre.",
            "Alvo: a picância aparece 3 a 4 segundos depois do gole e desaparece rápido.",
            "Maturação de 60 dias. A picância diminui um pouco com o tempo — calibre um ponto acima.",
        ],
        "nota": (
            "Semente e placenta concentram quase toda a capsaicina. Deixar as sementes "
            "produz um lote impossível de beber e sem conserto."
        ),
    },
    {
        "nome": "Hidromel de Hibisco e Gengibre",
        "sub": "A cor que ninguém ignora na foto",
        "origem": "Criação autoral",
        "historia": (
            "Magenta profundo, translúcido, impossível de passar batido numa foto. É o "
            "produto pensado para a rede social — e que ainda assim se sustenta no copo: "
            "o hibisco traz acidez cítrica e o gengibre, o calor no final."
        ),
        "og": 1.084, "fg": 1.006, "abv": 10.4, "estilo": "Seco",
        "custo": 14, "venda": 89,
        "ingredientes": [
            ("Mel de laranjeira", "5,7 kg"),
            ("Hibisco seco (cálices)", "120 g"),
            ("Gengibre fresco", "80 g"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Fermente o hidromel base limpo.",
            "Infusão a frio de hibisco: 120 g por 72 h na secundária. A cor sai rápido, o tanino também.",
            "Não passe de 96 h — depois disso vem uma adstringência que não sai.",
            "Gengibre: 80 g em lâminas, 48 h, em paralelo.",
            "Trasfegue com cuidado: a cor é o produto.",
            "Clarifique com quitosana, que preserva a cor melhor que a bentonita.",
        ],
        "nota": "Garrafa de vidro claro, obrigatoriamente. A cor é metade do que o cliente compra.",
    },
    {
        "nome": "Sack Mead de Cipó-Uva com Baunilha",
        "sub": "Sobremesa em garrafa de 375 mL",
        "origem": "Criação autoral",
        "historia": (
            "O mel de cipó-uva é escuro, denso e quase melado — um dos méis mais "
            "marcantes do Brasil. Levado a sack mead e casado com baunilha em fava, vira "
            "o produto de fim de ano: alto valor, baixo volume, giro concentrado."
        ),
        "og": 1.128, "fg": 1.032, "abv": 13.8, "estilo": "Sobremesa",
        "custo": 27, "venda": 189,
        "ingredientes": [
            ("Mel de cipó-uva", "9,0 kg"),
            ("Fava de baunilha", "3 unidades"),
            ("Levedura Lalvin K1-V1116", "15 g"),
            ("Fermaid-O", "26 g escalonado"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Step feeding, como no Sack Mead: 6 kg no início, o resto em 3 etapas.",
            "Fermente a 18 °C por 45 a 60 dias.",
            "Estabilize.",
            "Abra as favas ao meio, raspe as sementes e deixe tudo em infusão por 14 dias.",
            "Maturação mínima de 6 meses.",
        ],
        "nota": "Engarrafe em 375 mL com rolha de cortiça. Formato de sobremesa vende melhor que 750 mL.",
    },
    {
        "nome": "Braggot de Café Torrado e Cacau Nibs",
        "sub": "Corpo de stout, alma de hidromel",
        "origem": "Criação autoral sobre o braggot galês",
        "historia": (
            "Malte torrado, cacau nibs e café constroem a percepção de stout. Mas o mel "
            "aparece no final, onde a cerveja não chega. É a ponte para o público de "
            "cerveja artesanal — que já paga caro e já entende produto autoral."
        ),
        "og": 1.090, "fg": 1.018, "abv": 9.6, "estilo": "Semi-doce",
        "custo": 18, "venda": 109,
        "ingredientes": [
            ("Mel silvestre escuro", "3,5 kg"),
            ("Extrato de malte escuro", "2,0 kg"),
            ("Malte chocolate", "300 g"),
            ("Cacau nibs", "200 g"),
            ("Café em grão, torra escura", "120 g"),
            ("Levedura Safale US-05", "11,5 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Faça a mostura do malte chocolate em 4 L a 68 °C por 30 min; coe.",
            "Ferva com o extrato de malte por 45 min.",
            "Resfrie até 25 °C e só então adicione o mel.",
            "Fermente a 19 °C.",
            "Na secundária: cacau nibs (200 g) por 10 dias, e cold brew do café nos últimos 3.",
            "Pronto em 45 dias.",
        ],
        "nota": "Tosta os nibs a 150 °C por 10 min antes de usar. Muda completamente o aroma.",
    },
    {
        "nome": "Hidromel Seco de Eucalipto",
        "sub": "Feito para entrar em carta de restaurante",
        "origem": "Criação autoral",
        "historia": (
            "Mel de eucalipto é mineral, levemente mentolado, quase medicinal. Fermentado "
            "até o seco, dá um hidromel que se comporta como vinho branco de corpo médio "
            "— e é assim que entra na carta, onde o preço por garrafa triplica."
        ),
        "og": 1.082, "fg": 0.996, "abv": 11.3, "estilo": "Seco extremo",
        "custo": 12, "venda": 96,
        "ingredientes": [
            ("Mel de eucalipto", "5,6 kg"),
            ("Levedura Lalvin DV10", "10 g"),
            ("Bentonita", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Fermente a 14–16 °C. Frio e devagar — é o que preserva a mineralidade.",
            "Nutriente completo: seco extremo exige levedura sem nenhum estresse.",
            "Fermente até parar sozinho, sem interferir.",
            "Clarifique com bentonita até ficar brilhante.",
            "Maturação de 120 dias.",
            "Considere carbonatação leve (2,0 volumes) para servir como aperitivo.",
        ],
        "nota": "Leve duas garrafas e uma ficha de harmonização quando for falar com o sommelier. Ele decide na hora.",
    },
    {
        "nome": "Melomel de Cajá com Pimenta do Reino",
        "sub": "Nordeste em garrafa",
        "origem": "Criação autoral",
        "historia": (
            "O cajá tem uma acidez tropical intensa que combina com o mel de marmeleiro. "
            "A pimenta do reino entra em dose homeopática — não para arder, mas para "
            "prolongar o final de boca."
        ),
        "og": 1.092, "fg": 1.010, "abv": 11.2, "estilo": "Semi-seco",
        "custo": 17, "venda": 124,
        "ingredientes": [
            ("Mel de marmeleiro", "6,0 kg"),
            ("Polpa de cajá sem conservante", "3,0 kg"),
            ("Pimenta do reino em grão", "8 g"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Pectinase", "2 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Confira a polpa: sorbato ou benzoato impedem a fermentação.",
            "Fermente o base até metade da densidade e adicione a polpa na secundária.",
            "8 dias de contato com a fruta.",
            "Pimenta: 8 g moídas na hora, em infusão de 24 h. Só 24 h.",
            "Maturação de 60 dias.",
        ],
        "nota": "Pimenta do reino passa de sutil a dominante em poucas horas. Cronometre.",
    },
    {
        "nome": "Cyser de Maçã Verde com Alecrim",
        "sub": "Herbal, seco, para aperitivo",
        "origem": "Criação autoral",
        "historia": (
            "A maçã verde dá acidez; o alecrim, um aroma resinoso que remete a jardim de "
            "mosteiro. É o hidromel que funciona como aperitivo e abre a refeição em vez "
            "de fechar."
        ),
        "og": 1.086, "fg": 1.000, "abv": 11.4, "estilo": "Seco",
        "custo": 15, "venda": 98,
        "ingredientes": [
            ("Mel de laranjeira", "4,2 kg"),
            ("Suco de maçã verde integral", "12 L"),
            ("Alecrim fresco", "20 g"),
            ("Levedura Lalvin DV10", "10 g"),
        ],
        "passos": [
            "Misture mel e suco; complete até 20 L.",
            "Fermente a 15 °C até secar completamente.",
            "Alecrim: 20 g em infusão a frio por 36 h, na secundária.",
            "Prove a cada 12 h — alecrim vira pinho muito rápido.",
            "Clarifique e maturação de 90 dias.",
        ],
        "nota": "Sirva a 8 °C. Quente, o alecrim domina tudo.",
    },
    {
        "nome": "Bochet de Rapadura e Cravo",
        "sub": "Caramelo sobre caramelo",
        "origem": "Criação autoral — bochet medieval com ingrediente brasileiro",
        "historia": (
            "A rapadura acrescenta melaço e um toque mineral ao mel já caramelizado. O "
            "cravo, em dose mínima, amarra tudo. É a leitura mais brasileira possível de "
            "uma técnica francesa do século XIV."
        ),
        "og": 1.106, "fg": 1.024, "abv": 11.4, "estilo": "Doce",
        "custo": 16, "venda": 132,
        "ingredientes": [
            ("Mel silvestre (para caramelizar)", "5,5 kg"),
            ("Rapadura", "1,2 kg"),
            ("Cravo-da-índia", "4 unidades"),
            ("Levedura Lalvin 71B", "10 g"),
            ("Água até completar", "20 L"),
        ],
        "passos": [
            "Caramelize o mel por 50 min (precauções do Bochet).",
            "Dissolva a rapadura ralada na água quente, separadamente.",
            "Junte tudo, complete até 20 L, resfrie e inocule.",
            "Cravo: apenas 4 unidades, na secundária, por 48 h. Cravo é implacável.",
            "Maturação mínima de 6 meses.",
        ],
        "nota": "Quatro cravos em 20 litros parece pouco. Não é. Oito arruínam o lote.",
    },
]

# ---------------------------------------------------------------------------
# SAZONAIS — giro de calendário
# ---------------------------------------------------------------------------

SAZONAIS = [
    ("Hidromel de Natal", "Canela, laranja, anis-estrelado e gengibre. Produza em julho para vender em dezembro.", 1.094, 1.018, 10.4),
    ("Hidromel de Festa Junina", "Amendoim torrado e milho verde. Estranho no papel, campeão de degustação.", 1.088, 1.014, 10.0),
    ("Melomel de Morango", "Fruta de inverno, cor viva, alto giro no Dia dos Namorados.", 1.090, 1.012, 10.6),
    ("Cyser de Inverno com Especiarias", "Servido morno, em caneca. Feira de inverno e festival de montanha.", 1.092, 1.016, 10.2),
    ("Hidromel de Verão com Limão Siciliano", "Seco, carbonatado, 8% ABV. Lata ou garrafa de 355 mL.", 1.070, 0.998, 9.5),
    ("Melomel de Manga com Maracujá", "Tropical, aromático, produto de exportação.", 1.092, 1.010, 11.0),
    ("Braggot de Páscoa com Cacau", "Chocolate sem ser enjoativo. Encomenda de Páscoa.", 1.088, 1.020, 9.2),
    ("Metheglin de Erva-Mate", "Sul do Brasil, amargor herbal, identidade regional forte.", 1.086, 1.012, 10.0),
    ("Hidromel de Café da Colheita", "Edição anual com café da safra, numerada. Cria colecionador.", 1.096, 1.016, 10.8),
]
