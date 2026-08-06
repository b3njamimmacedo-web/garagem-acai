# -*- coding: utf-8 -*-
"""Gera as três páginas legais a partir de um molde comum."""
import os

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "legal")

MOLDE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo} — Hidromel de Reis</title>
<meta name="robots" content="noindex, follow">
<link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/site.css">
<style>
  .doc {{ width: min(100% - 2.4rem, 780px); margin: 0 auto; padding: 5rem 0 4rem; }}
  .doc h1 {{ font-size: clamp(1.8rem, 4vw, 2.6rem); margin-bottom: .5rem; }}
  .doc h2 {{ font-size: 1.25rem; margin: 2.4rem 0 .8rem; color: var(--ouro-claro); }}
  .doc h3 {{ font-size: 1.02rem; margin: 1.5rem 0 .5rem; }}
  .doc p, .doc li {{ font-size: .97rem; line-height: 1.75; }}
  .doc ul, .doc ol {{ padding-left: 1.3rem; margin: .7rem 0; }}
  .doc li {{ margin-bottom: .45rem; }}
  .doc table {{ width: 100%; border-collapse: collapse; margin: 1.2rem 0; font-size: .9rem; }}
  .doc th, .doc td {{ text-align: left; padding: .65rem .8rem; border-bottom: var(--borda); vertical-align: top; }}
  .doc th {{ color: var(--ouro); font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; }}
  .preencher {{
    background: rgba(107,31,42,.18); border: 1px solid rgba(139,30,63,.5);
    border-radius: 4px; padding: .1rem .4rem; color: #E9A0AE; font-weight: 600;
    font-size: .88rem;
  }}
  .voltar {{ display: inline-block; margin-bottom: 2rem; font-size: .88rem; }}
  .atualizado {{ color: var(--fumaca); font-size: .85rem; margin-bottom: 2.5rem; }}
</style>
</head>
<body>
<div class="doc">
  <a class="voltar" href="../../">← Voltar ao site</a>
  <h1>{titulo}</h1>
  <p class="atualizado">Última atualização: {data}</p>
  {corpo}
  <hr style="margin:3rem 0 1.5rem;border:0;border-top:var(--borda)">
  <p class="mini">
    <span class="preencher">[RAZÃO SOCIAL]</span> ·
    CNPJ <span class="preencher">[00.000.000/0001-00]</span> ·
    <span class="preencher">[ENDEREÇO COMPLETO]</span><br>
    contato@hidromeldereis.com.br
  </p>
</div>
</body>
</html>
"""

FALTA = '<span class="preencher">[PREENCHER]</span>'
DATA = "5 de agosto de 2026"

# ---------------------------------------------------------------- TERMOS
TERMOS = """
<p>Estes Termos regem o acesso e o uso do curso <strong>Hidromel de Reis</strong>,
oferecido por <span class="preencher">[RAZÃO SOCIAL]</span>, inscrita no CNPJ
<span class="preencher">[00.000.000/0001-00]</span>. Ao concluir a compra, você
declara que leu e concorda com o que está aqui.</p>

<h2>1. Quem pode comprar</h2>
<p>O curso trata da produção de bebida alcoólica fermentada e é destinado
<strong>exclusivamente a maiores de 18 anos</strong>. Ao comprar, você declara ter
18 anos ou mais. A venda de bebida alcoólica a menores é crime (ECA, art. 243) —
e ainda que este produto seja um curso, mantemos a mesma restrição por
responsabilidade.</p>

<h2>2. O que você recebe</h2>
<ul>
  <li>Acesso à área de membros conforme o plano contratado (Iniciado, Mestre ou Real).</li>
  <li>Uma <strong>credencial pessoal e única</strong>, composta de e-mail e código de acesso.</li>
  <li>Os materiais em PDF do plano contratado, para download.</li>
  <li>As atualizações publicadas durante a vigência do acesso.</li>
</ul>

<h3>2.1 Conteúdo em produção</h3>
<p>Parte das aulas pode estar identificada como <em>“Aula em produção”</em> no
momento da sua compra. Isso está informado de forma visível na área de membros e
não caracteriza descumprimento. Novas aulas são publicadas ao longo da vigência e
você é avisado por e-mail a cada publicação. Caso o cronograma de publicação seja
determinante para a sua decisão, consulte-nos <strong>antes</strong> de comprar.</p>

<h2>3. Prazo de acesso</h2>
<p>O acesso vale por <strong>3 (três) anos</strong> contados da confirmação do
pagamento. Os materiais em PDF baixados permanecem com você indefinidamente.</p>
<p>Não usamos o termo “vitalício”: nenhuma empresa pode garantir existir para
sempre, e prometer isso seria enganar.</p>

<h2>4. Credencial de acesso</h2>
<ul>
  <li>A credencial é <strong>pessoal e intransferível</strong>.</li>
  <li>Cada plano permite um número de dispositivos: 2 (Iniciado), 3 (Mestre) e 5 (Real).</li>
  <li>Registramos uma identificação técnica não reversível de cada dispositivo, apenas para contá-los.</li>
  <li>Compartilhar a credencial esgota o seu próprio limite e pode levar ao
      <strong>cancelamento do acesso sem reembolso</strong>.</li>
</ul>

<h2>5. Propriedade intelectual</h2>
<p>Todo o conteúdo — vídeos, PDFs, receitas, planilhas, calculadoras, textos e
imagens — é protegido por direito autoral (Lei 9.610/98). É <strong>proibido</strong>
copiar, redistribuir, revender, exibir publicamente ou disponibilizar o conteúdo,
no todo ou em parte.</p>
<p>Você <strong>pode</strong>, livremente: produzir as receitas, usá-las
comercialmente (observadas as exigências legais do item 7), adaptá-las e
incorporá-las aos seus próprios produtos. As receitas existem para serem usadas —
o que não pode é revender o curso.</p>

<h2>6. Uso das calculadoras e do material técnico</h2>
<p>As calculadoras e os materiais técnicos são ferramentas de apoio. Os resultados
dependem dos dados que você informa e das condições reais de produção.
Confira sempre com instrumentos calibrados. Não nos responsabilizamos por lote
perdido, prejuízo material ou dano decorrente de uso incorreto.</p>

<h2>7. Sobre produzir e vender hidromel</h2>
<p>Este é o ponto mais importante deste documento.</p>
<ul>
  <li>Produzir hidromel para <strong>consumo próprio</strong> ou para presentear não
      exige autorização.</li>
  <li><strong>Comercializar</strong> bebida alcoólica no Brasil exige registro do
      estabelecimento e do produto no Ministério da Agricultura e Pecuária
      (Lei 8.918/94), alvará sanitário e laudo laboratorial por lote.</li>
  <li>O curso <strong>ensina o caminho</strong> dessa regularização. Ele
      <strong>não realiza</strong> o processo por você, não intermedia junto a
      órgão público e <strong>não garante prazo nem aprovação</strong> — que
      dependem exclusivamente dos órgãos competentes e das regras do seu
      município e estado.</li>
</ul>

<h2>8. O que este curso não é</h2>
<p>Este é um curso de formação técnica. <strong>Não é promessa de renda, garantia
de resultado financeiro nem oportunidade de investimento.</strong> Os valores
citados em aulas e materiais são exemplos de cálculo, não projeções.
Resultado depende de execução, mercado, investimento e do cumprimento das
exigências legais.</p>

<h2>9. Suporte</h2>
<p>Atendimento por e-mail em <a href="mailto:contato@hidromeldereis.com.br">contato@hidromeldereis.com.br</a>,
em até 48 horas úteis. Informe sempre o seu código de acesso.</p>

<h2>10. Cancelamento pela nossa parte</h2>
<p>Podemos suspender o acesso, sem reembolso, em caso de compartilhamento de
credencial, tentativa de burlar as proteções da plataforma, redistribuição do
conteúdo ou fraude no pagamento (chargeback indevido).</p>

<h2>11. Alterações</h2>
<p>Podemos alterar estes Termos. Mudanças relevantes são comunicadas por e-mail
com <strong>30 dias</strong> de antecedência. Se você não concordar, pode pedir o
reembolso proporcional ao período restante.</p>

<h2>12. Foro</h2>
<p>Aplica-se a legislação brasileira. Fica eleito o foro da comarca de
<span class="preencher">[CIDADE/UF]</span>, ressalvado o direito do consumidor de
ajuizar ação no foro do seu domicílio (CDC, art. 101, I).</p>
"""

# ------------------------------------------------------------ PRIVACIDADE
PRIVACIDADE = """
<p>Esta Política explica como tratamos os seus dados pessoais, conforme a
Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

<h2>1. Quem é o controlador</h2>
<p><span class="preencher">[RAZÃO SOCIAL]</span>, CNPJ
<span class="preencher">[00.000.000/0001-00]</span>.<br>
Contato para assuntos de privacidade: contato@hidromeldereis.com.br</p>

<h2>2. Que dados coletamos, e por quê</h2>
<table>
  <tr><th>Dado</th><th>Para quê</th><th>Base legal</th></tr>
  <tr><td>Nome completo</td><td>Identificar você e emitir a nota fiscal</td><td>Execução de contrato</td></tr>
  <tr><td>E-mail</td><td>Entregar o acesso, dar suporte e avisar de novas aulas</td><td>Execução de contrato</td></tr>
  <tr><td>CPF</td><td>Exigência do Pix e da emissão de nota fiscal</td><td>Obrigação legal</td></tr>
  <tr><td>Telefone (opcional)</td><td>Suporte por WhatsApp, se você quiser</td><td>Consentimento</td></tr>
  <tr><td>Identificação técnica do dispositivo</td><td>Contar aparelhos e coibir compartilhamento de conta</td><td>Legítimo interesse</td></tr>
  <tr><td>Endereço IP</td><td>Limitar requisições abusivas e prevenir fraude</td><td>Legítimo interesse</td></tr>
</table>

<h3>2.1 O que NÃO coletamos</h3>
<ul>
  <li><strong>Número de cartão de crédito.</strong> O formulário de pagamento é
      hospedado pelo Mercado Pago; os dados do cartão nunca passam pela nossa
      infraestrutura.</li>
  <li><strong>Seu progresso nas aulas.</strong> Fica gravado apenas no seu
      navegador. Não é enviado a servidor nenhum.</li>
  <li>Dados sensíveis de qualquer natureza.</li>
</ul>

<h2>3. Identificação do dispositivo — o que é exatamente</h2>
<p>Ao entrar, geramos um identificador a partir de características técnicas do
navegador (idioma, resolução, fuso horário). É um valor <strong>não
reversível</strong>: não permite descobrir quem você é, nem rastrear você em
outros sites. Serve unicamente para contar quantos aparelhos usam a mesma
credencial.</p>

<h2>4. Com quem compartilhamos</h2>
<table>
  <tr><th>Quem</th><th>O que recebe</th><th>Para quê</th></tr>
  <tr><td>Mercado Pago</td><td>Nome, e-mail, CPF, valor</td><td>Processar o pagamento</td></tr>
  <tr><td>Resend</td><td>Nome e e-mail</td><td>Enviar o e-mail de acesso</td></tr>
  <tr><td>Cloudflare</td><td>Dados da conta</td><td>Hospedar a aplicação</td></tr>
  <tr><td>Meta e Google</td><td>Eventos anônimos de navegação</td><td>Medir anúncios — <strong>somente se estiver ativado</strong></td></tr>
</table>
<p>Não vendemos, alugamos nem cedemos seus dados para terceiros com finalidade
comercial.</p>

<h2>5. Cookies e rastreamento</h2>
<p>Usamos armazenamento local do navegador para manter você conectado, guardar seu
progresso e registrar a confirmação de idade. Isso é necessário para o serviço
funcionar.</p>
<p>Pixel da Meta e Google Analytics só são carregados se estiverem configurados
pelo administrador do site. Quando não estão, <strong>nenhum rastreador de
terceiros é carregado</strong>.</p>

<h2>6. Por quanto tempo guardamos</h2>
<ul>
  <li><strong>Dados de aluno:</strong> durante os 3 anos de acesso e mais 5 anos,
      por exigência fiscal e prazo de eventual discussão de contrato.</li>
  <li><strong>Registros de pedido:</strong> 5 anos (obrigação fiscal).</li>
  <li><strong>IP e controle de requisições:</strong> expiram sozinhos em minutos.</li>
</ul>

<h2>7. Seus direitos</h2>
<p>Você pode, a qualquer momento, solicitar: confirmação de tratamento, acesso aos
dados, correção, anonimização ou eliminação, portabilidade, informação sobre
compartilhamento e revogação de consentimento.</p>
<p>Escreva para contato@hidromeldereis.com.br. Respondemos em até 15 dias.</p>
<p><strong>Observação honesta:</strong> pedir a eliminação dos dados durante o
período de acesso encerra o seu acesso ao curso — sem os dados não temos como
autenticar você. Alguns registros fiscais precisam ser mantidos por obrigação
legal, mesmo após o pedido de exclusão.</p>

<h2>8. Segurança</h2>
<ul>
  <li>Tráfego sempre por HTTPS.</li>
  <li>Tokens de acesso assinados criptograficamente (HMAC-SHA256).</li>
  <li>Webhooks de pagamento com assinatura verificada e comparação em tempo constante.</li>
  <li>Limite de requisições por IP.</li>
  <li>Dados de cartão nunca trafegam pela nossa infraestrutura.</li>
</ul>
<p>Nenhum sistema é inviolável. Em caso de incidente com risco relevante,
comunicaremos você e a ANPD nos prazos da lei.</p>

<h2>9. Menores de idade</h2>
<p>O serviço não se destina a menores de 18 anos e não coletamos dados de menores
conscientemente. Identificado esse caso, os dados são eliminados e o acesso
cancelado.</p>
"""

# ------------------------------------------------------------- REEMBOLSO
REEMBOLSO = """
<h2>Resumo</h2>
<p><strong>15 dias para desistir, sem precisar explicar o motivo.</strong>
Basta escrever para contato@hidromeldereis.com.br. Sem formulário de retenção,
sem ligação de convencimento, sem pergunta.</p>

<h2>1. O prazo</h2>
<p>A lei brasileira garante <strong>7 dias</strong> de arrependimento em compras
feitas fora do estabelecimento (CDC, art. 49). Nós oferecemos
<strong>15 dias</strong>, contados da confirmação do pagamento.</p>
<p>Se você pedir o reembolso dentro dos 7 dias legais, ele é um direito seu e é
processado sem qualquer condição. Do 8º ao 15º dia, é uma política nossa — e
vale igual.</p>

<h2>2. Como pedir</h2>
<ol>
  <li>Envie um e-mail para <strong>contato@hidromeldereis.com.br</strong>.</li>
  <li>Assunto: <em>Reembolso</em>.</li>
  <li>No corpo, informe o e-mail da compra e o código de acesso.</li>
</ol>
<p>Só isso. Não pedimos justificativa, não oferecemos “bônus para você ficar” e
não transferimos você para nenhum atendente de retenção.</p>

<h2>3. Prazos de devolução</h2>
<table>
  <tr><th>Forma de pagamento</th><th>Prazo para o dinheiro voltar</th></tr>
  <tr><td>Pix</td><td>Até 5 dias úteis, na mesma chave</td></tr>
  <tr><td>Cartão de crédito</td><td>Estorno em até 2 faturas, conforme o cartão</td></tr>
</table>
<p>Nós processamos o estorno em até 48 horas úteis do pedido. O tempo até o
dinheiro aparecer depois disso depende do banco ou da administradora do cartão.</p>

<h2>4. O que acontece com o acesso</h2>
<p>O acesso é encerrado no momento do reembolso. Os PDFs que você já baixou
continuam com você — não temos como recolhê-los, e não faria sentido tentar.</p>

<h2>5. Depois dos 15 dias</h2>
<p>Passados os 15 dias, não há reembolso por desistência. Continuamos
respondendo, é claro, por qualquer problema técnico de acesso ou por conteúdo
que não corresponda ao anunciado — nesses casos, resolvemos ou devolvemos,
independentemente do prazo.</p>

<h2>6. Order bump e upgrade</h2>
<p>O <em>Pack de Rótulos</em> comprado junto e os upgrades de plano seguem
exatamente a mesma política, com o prazo contado da respectiva compra.</p>

<h2>7. Chargeback</h2>
<p>Se você abrir contestação junto ao banco sem antes falar conosco, o acesso é
suspenso enquanto durar a análise. Pedir o reembolso direto é mais rápido para
você e mais simples para todo mundo — normalmente resolvemos no mesmo dia.</p>

<h2>8. Compromisso</h2>
<p>Preferimos devolver o dinheiro de quem não se identificou com o método a ter
um aluno insatisfeito. Reembolso pedido é reembolso concedido, dentro do prazo,
sem atrito.</p>
"""

PAGINAS = [
    ("termos.html", "Termos de Uso", TERMOS),
    ("privacidade.html", "Política de Privacidade", PRIVACIDADE),
    ("reembolso.html", "Política de Reembolso", REEMBOLSO),
]

for arq, titulo, corpo in PAGINAS:
    html = MOLDE.format(titulo=titulo, data=DATA, corpo=corpo.strip())
    with open(os.path.join(BASE, arq), "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✓ {arq}  ({len(html)/1024:.1f} kB)")
