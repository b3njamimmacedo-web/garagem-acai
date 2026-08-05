#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GERADOR DE PDFs — HIDROMEL DE REIS

Produz todo o material de apoio em ../material/.
Conteúdo das receitas vem de receitas.py; aqui é só diagramação.

Uso:  python3 scripts/gerar_pdfs.py
"""

import os
import math
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, NextPageTemplate,
)
from reportlab.pdfgen import canvas as pdfcanvas

import receitas as R

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "material")
os.makedirs(SAIDA, exist_ok=True)

# --------------------------------------------------------------------- PALETA
BREU        = colors.HexColor("#0E0B08")
CARVAO      = colors.HexColor("#1F160D")
OURO        = colors.HexColor("#B8860B")
OURO_CLARO  = colors.HexColor("#D4A017")
SANGUE      = colors.HexColor("#6B1F2A")
PERGAMINHO  = colors.HexColor("#F6F0E2")
TINTA       = colors.HexColor("#241A10")
TINTA_FRACA = colors.HexColor("#5C4B36")
VERDE       = colors.HexColor("#2E5E4E")

L, A = A4
MARGEM = 20 * mm

# ------------------------------------------------------------------- ESTILOS
def estilo(nome, **kw):
    base = dict(name=nome, fontName="Times-Roman", fontSize=10.5, leading=15,
                textColor=TINTA, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(**base)

E = {
    "titulo":    estilo("titulo", fontName="Times-Bold", fontSize=26, leading=30,
                        textColor=TINTA, spaceAfter=4),
    "sub":       estilo("sub", fontName="Times-Italic", fontSize=12.5, leading=17,
                        textColor=OURO, spaceAfter=12),
    "h1":        estilo("h1", fontName="Times-Bold", fontSize=19, leading=23,
                        textColor=TINTA, spaceBefore=16, spaceAfter=9),
    "h2":        estilo("h2", fontName="Times-Bold", fontSize=13.5, leading=17,
                        textColor=SANGUE, spaceBefore=12, spaceAfter=5),
    "rot":       estilo("rot", fontName="Helvetica-Bold", fontSize=7.5, leading=11,
                        textColor=OURO, spaceAfter=4),
    "corpo":     estilo("corpo", alignment=TA_JUSTIFY),
    "corpoC":    estilo("corpoC", alignment=TA_CENTER),
    "historia":  estilo("historia", fontName="Times-Italic", fontSize=10.5, leading=16,
                        textColor=colors.HexColor("#3D2E1C"), alignment=TA_JUSTIFY,
                        leftIndent=8, borderPadding=0),
    "passo":     estilo("passo", fontSize=10, leading=14.5, leftIndent=16,
                        firstLineIndent=-16, spaceAfter=4.5),
    "nota":      estilo("nota", fontName="Times-Italic", fontSize=9.5, leading=13.5,
                        textColor=colors.HexColor("#4A3A26"), leftIndent=10, spaceBefore=4),
    "mini":      estilo("mini", fontName="Helvetica", fontSize=8, leading=11,
                        textColor=TINTA_FRACA),
    "capaTit":   estilo("capaTit", fontName="Times-Bold", fontSize=42, leading=46,
                        textColor=colors.HexColor("#F5C542"), alignment=TA_CENTER),
    "capaSub":   estilo("capaSub", fontName="Times-Italic", fontSize=15, leading=21,
                        textColor=colors.HexColor("#D9C9A3"), alignment=TA_CENTER),
    "capaRot":   estilo("capaRot", fontName="Helvetica-Bold", fontSize=9, leading=14,
                        textColor=OURO_CLARO, alignment=TA_CENTER),
}


# ------------------------------------------------------------------- DESENHO
def hexagono(c, cx, cy, r, traco=None, preenche=None, largura=1.2):
    p = c.beginPath()
    for i in range(6):
        ang = math.radians(60 * i - 90)
        x, y = cx + r * math.cos(ang), cy + r * math.sin(ang)
        p.moveTo(x, y) if i == 0 else p.lineTo(x, y)
    p.close()
    if preenche:
        c.setFillColor(preenche)
    if traco:
        c.setStrokeColor(traco)
        c.setLineWidth(largura)
    c.drawPath(p, stroke=1 if traco else 0, fill=1 if preenche else 0)


def malha_favos(c, x0, y0, x1, y1, cor, alpha=0.05, lado=13):
    """Textura de favos. Só o contorno, bem apagada — é fundo, não decoração.

    O alpha vem DENTRO da cor, não de setStrokeAlpha(): no reportlab,
    setStrokeColor() com uma cor opaca redefine o alpha do estado gráfico e
    anula a chamada anterior. O resultado era uma malha quase sólida por cima
    do texto.

    Hexágonos vizinhos compartilham aresta, então cada linha é traçada duas
    vezes e a opacidade efetiva dobra. O alpha aqui já considera isso.
    """
    tom = colors.Color(cor.red, cor.green, cor.blue, alpha=alpha)
    c.saveState()
    c.setLineWidth(0.35)
    dx, dy = lado * 1.5, lado * math.sqrt(3)
    cols = int((x1 - x0) / dx) + 2
    linhas = int((y1 - y0) / dy) + 2
    for i in range(cols):
        for j in range(linhas):
            cx = x0 + i * dx
            cy = y0 + j * dy + (dy / 2 if i % 2 else 0)
            hexagono(c, cx, cy, lado, traco=tom, largura=0.35)
    c.restoreState()


def canto(c, x, y, esc, rot, cor):
    c.saveState()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(esc, esc)
    c.setStrokeColor(cor)
    c.setLineWidth(1.4)
    p = c.beginPath()
    p.moveTo(0, -34); p.lineTo(0, -8)
    p.curveTo(0, 0, 0, 0, 8, 0); p.lineTo(34, 0)
    c.drawPath(p)
    c.setFillColor(cor)
    c.circle(9, -9, 2, stroke=0, fill=1)
    c.restoreState()


# ------------------------------------------------------------------- PÁGINAS
class Fundo:
    """Desenha capa e miolo. Instanciado por documento para carregar o título."""

    def __init__(self, titulo, subtitulo, rotulo="GRIMÓRIO"):
        self.titulo = titulo
        self.subtitulo = subtitulo
        self.rotulo = rotulo

    # ---------------------------------------------------------------- capa
    def capa(self, c, doc):
        c.saveState()
        c.setFillColor(BREU)
        c.rect(0, 0, L, A, stroke=0, fill=1)
        malha_favos(c, 0, 0, L, A, OURO_CLARO, alpha=0.10, lado=19)

        # moldura dupla
        c.setStrokeColor(OURO)
        c.setLineWidth(2)
        c.rect(14 * mm, 14 * mm, L - 28 * mm, A - 28 * mm, stroke=1, fill=0)
        c.setStrokeColor(colors.HexColor("#8A6D1F"))
        c.setLineWidth(0.6)
        c.rect(17 * mm, 17 * mm, L - 34 * mm, A - 34 * mm, stroke=1, fill=0)

        for (x, y, r) in [(16 * mm, A - 16 * mm, 0), (L - 16 * mm, A - 16 * mm, 90),
                          (L - 16 * mm, 16 * mm, 180), (16 * mm, 16 * mm, 270)]:
            canto(c, x, y, 1.3, r, OURO_CLARO)

        # emblema
        cx, cy = L / 2, A - 92 * mm
        hexagono(c, cx, cy, 34 * mm, traco=OURO_CLARO, largura=2)
        hexagono(c, cx, cy, 29 * mm, traco=colors.HexColor("#8A6D1F"), largura=0.7)
        # chifre estilizado
        c.setStrokeColor(OURO_CLARO)
        c.setLineWidth(3)
        p = c.beginPath()
        p.moveTo(cx - 20 * mm, cy + 9 * mm)
        p.curveTo(cx - 2 * mm, cy + 13 * mm, cx + 15 * mm, cy + 2 * mm, cx + 19 * mm, cy - 15 * mm)
        p.curveTo(cx + 12 * mm, cy - 9 * mm, cx + 2 * mm, cy - 5 * mm, cx - 12 * mm, cy - 2 * mm)
        p.curveTo(cx - 17 * mm, cy - 1 * mm, cx - 19 * mm, cy + 4 * mm, cx - 20 * mm, cy + 9 * mm)
        c.drawPath(p)
        c.setFillColor(OURO_CLARO)
        c.circle(cx - 18 * mm, cy + 4 * mm, 4.5 * mm, stroke=0, fill=1)
        c.setFillColor(BREU)
        c.circle(cx - 18 * mm, cy + 4 * mm, 2.6 * mm, stroke=0, fill=1)
        # coroa
        c.setFillColor(OURO_CLARO)
        p = c.beginPath()
        p.moveTo(cx - 14 * mm, cy + 21 * mm); p.lineTo(cx - 8 * mm, cy + 27 * mm)
        p.lineTo(cx, cy + 19 * mm); p.lineTo(cx + 8 * mm, cy + 27 * mm)
        p.lineTo(cx + 14 * mm, cy + 21 * mm); p.lineTo(cx + 15 * mm, cy + 30 * mm)
        p.lineTo(cx - 15 * mm, cy + 30 * mm); p.close()
        c.drawPath(p, stroke=0, fill=1)

        c.restoreState()

    # -------------------------------------------------------------- miolo
    def miolo(self, c, doc):
        c.saveState()
        c.setFillColor(PERGAMINHO)
        c.rect(0, 0, L, A, stroke=0, fill=1)
        malha_favos(c, 0, 0, L, A, colors.HexColor("#C9A227"), alpha=0.055, lado=17)

        # cabeçalho
        c.setStrokeColor(OURO)
        c.setLineWidth(0.8)
        c.line(MARGEM, A - 15 * mm, L - MARGEM, A - 15 * mm)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(OURO)
        c.drawString(MARGEM, A - 13 * mm, "HIDROMEL DE REIS")
        c.setFont("Helvetica", 7)
        c.setFillColor(TINTA_FRACA)
        c.drawRightString(L - MARGEM, A - 13 * mm, self.titulo.upper())

        # rodapé
        c.setStrokeColor(colors.HexColor("#D6C08A"))
        c.setLineWidth(0.6)
        c.line(MARGEM, 14 * mm, L - MARGEM, 14 * mm)
        c.setFont("Helvetica", 7)
        c.setFillColor(TINTA_FRACA)
        c.drawString(MARGEM, 10 * mm,
                     "Material exclusivo para alunos. Proibida a redistribuição.")
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(OURO)
        c.drawRightString(L - MARGEM, 10 * mm, str(doc.page - 1))

        # hexágono decorativo no número da página
        hexagono(c, L - MARGEM - 12, 11.6 * mm, 7,
                 traco=colors.HexColor("#D6C08A"), largura=0.5)
        c.restoreState()


class Doc(BaseDocTemplate):
    def __init__(self, arquivo, titulo, subtitulo, rotulo="GRIMÓRIO", **kw):
        BaseDocTemplate.__init__(self, arquivo, pagesize=A4,
                                 leftMargin=MARGEM, rightMargin=MARGEM,
                                 topMargin=24 * mm, bottomMargin=20 * mm,
                                 title=titulo, author="Hidromel de Reis",
                                 subject=subtitulo, **kw)
        f = Fundo(titulo, subtitulo, rotulo)
        quadro = Frame(MARGEM, 20 * mm, L - 2 * MARGEM, A - 44 * mm, id="normal")
        quadroCapa = Frame(MARGEM + 10 * mm, 30 * mm, L - 2 * MARGEM - 20 * mm,
                           A - 150 * mm, id="capa")
        self.addPageTemplates([
            PageTemplate(id="capa", frames=[quadroCapa], onPage=f.capa),
            PageTemplate(id="miolo", frames=[quadro], onPage=f.miolo),
        ])


# ----------------------------------------------------------------- HELPERS
def regua(cor=OURO, largura=1, espaco=8):
    t = Table([[""]], colWidths=[L - 2 * MARGEM], rowHeights=[0.1])
    t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, 0), largura, cor)]))
    return [Spacer(1, espaco), t, Spacer(1, espaco)]


def caixa(texto, corFundo, corBorda, estiloTxt="corpo"):
    p = Paragraph(texto, E[estiloTxt])
    t = Table([[p]], colWidths=[L - 2 * MARGEM])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), corFundo),
        ("BOX", (0, 0), (-1, -1), 0.8, corBorda),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def tabela(dados, larguras, cabecalho=True):
    t = Table(dados, colWidths=larguras, repeatRows=1 if cabecalho else 0)
    estilos = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.6),
        ("TEXTCOLOR", (0, 0), (-1, -1), TINTA),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, colors.HexColor("#DCCFA8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.HexColor("#FBF7EC"), colors.HexColor("#F2EAD6")]),
    ]
    if cabecalho:
        estilos += [
            ("BACKGROUND", (0, 0), (-1, 0), CARVAO),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#F5C542")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
        ]
    t.setStyle(TableStyle(estilos))
    return t


def capa_conteudo(titulo, subtitulo, rodape):
    return [
        Spacer(1, 6 * mm),
        Paragraph(titulo.upper(), E["capaTit"]),
        Spacer(1, 5 * mm),
        Paragraph(subtitulo, E["capaSub"]),
        Spacer(1, 14 * mm),
        Paragraph(rodape, E["capaRot"]),
        NextPageTemplate("miolo"),
        PageBreak(),
    ]


# ============================================================================
# 1 — GRIMÓRIO DO HIDROMEL
# ============================================================================
def grimorio():
    arq = os.path.join(SAIDA, "grimorio-do-hidromel.pdf")
    doc = Doc(arq, "Grimório do Hidromel", "30 receitas fechadas")
    h = capa_conteudo(
        "Grimório<br/>do Hidromel",
        "Trinta receitas — das medievais clássicas<br/>às premium inusitadas",
        "HIDROMEL DE REIS &nbsp;·&nbsp; DA COLMEIA AO CÁLICE",
    )

    # ---- abertura
    h.append(Paragraph("Como usar este grimório", E["h1"]))
    h += regua()
    h.append(Paragraph(
        "Toda receita aqui é para <b>20 litros</b> e traz a densidade inicial (OG), a "
        "densidade final esperada (FG) e o teor alcoólico calculado. Para outro volume, "
        "use a calculadora de escalonamento na área de membros — as proporções são "
        "lineares, mas o tempo de fermentação não é: lotes maiores fermentam mais devagar.",
        E["corpo"]))
    h.append(Paragraph(
        "A OG foi calculada considerando que <b>1 kg de mel em 1 litro de mosto final "
        "acrescenta 292 pontos de densidade</b>. É a conversão correta do valor de "
        "referência da literatura (35 pontos por libra por galão) para o sistema métrico. "
        "Se a sua leitura no densímetro divergir mais de 0,005, o mel provavelmente tem "
        "umidade acima do padrão — corrija o volume, não a receita.",
        E["corpo"]))
    h.append(Spacer(1, 4))
    h.append(caixa(
        "<b>Antes do primeiro lote.</b> Sanitização não é limpeza. Limpar tira sujeira; "
        "sanitizar mata microrganismo. Um fermentador visualmente impecável e não "
        "sanitizado contamina o lote do mesmo jeito — e você só vai descobrir 40 dias "
        "depois, pelo cheiro.",
        colors.HexColor("#F7E9EC"), SANGUE))
    h.append(Spacer(1, 6))
    h.append(caixa(
        "<b>Sobre vender.</b> As receitas deste grimório podem ser produzidas livremente "
        "para consumo próprio e para presentear. <b>Comercializar</b> bebida alcoólica no "
        "Brasil exige registro do estabelecimento e do produto no MAPA (Lei 8.918/94), "
        "alvará sanitário e laudo laboratorial por lote. O caminho completo está no Módulo 11 "
        "e no Manual de Legalização.",
        colors.HexColor("#EDF3F0"), VERDE))

    # ---- índice
    h.append(PageBreak())
    h.append(Paragraph("Índice", E["h1"]))
    h += regua()
    linhas = [["#", "Receita", "Estilo", "ABV"]]
    n = 0
    for r in R.MEDIEVAIS + R.PREMIUM:
        n += 1
        linhas.append([str(n), r["nome"], r["estilo"], f'{r["abv"]}%'])
    for nome, _, og, fg, abv in R.SAZONAIS:
        n += 1
        linhas.append([str(n), nome, "Sazonal", f"{abv}%"])
    h.append(tabela(linhas, [12 * mm, 92 * mm, 38 * mm, 20 * mm]))
    h.append(PageBreak())   # cada receita começa em página limpa

    # ---- receitas
    def bloco_receita(r, numero, secao):
        el = [
            Paragraph(f"{secao} &nbsp;·&nbsp; RECEITA {numero:02d}", E["rot"]),
            Paragraph(r["nome"], E["titulo"]),
            Paragraph(r["sub"], E["sub"]),
        ]
        el += regua(espaco=4)
        el.append(Paragraph(f'<b>Origem:</b> {r["origem"]}', E["mini"]))
        el.append(Spacer(1, 7))
        el.append(Paragraph(r["historia"], E["historia"]))
        el.append(Spacer(1, 9))

        # ficha
        ficha = [["OG", "FG", "ABV", "ESTILO"],
                 [f'{r["og"]:.3f}', f'{r["fg"]:.3f}', f'{r["abv"]}%', r["estilo"]]]
        if "custo" in r:
            ficha[0] += ["CUSTO/GARRAFA", "VENDA SUGERIDA"]
            ficha[1] += [f'R$ {r["custo"]}', f'R$ {r["venda"]}']
            larg = [20 * mm, 20 * mm, 18 * mm, 32 * mm, 33 * mm, 39 * mm]
        else:
            larg = [30 * mm, 30 * mm, 30 * mm, 72 * mm]
        el.append(tabela(ficha, larg))
        el.append(Spacer(1, 11))

        el.append(Paragraph("Ingredientes", E["h2"]))
        el.append(tabela([["Item", "Quantidade"]] +
                         [[i, q] for i, q in r["ingredientes"]],
                         [110 * mm, 52 * mm]))
        el.append(Spacer(1, 11))

        el.append(Paragraph("Modo de fazer", E["h2"]))
        for i, passo in enumerate(r["passos"], 1):
            el.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{passo}", E["passo"]))

        el.append(Spacer(1, 7))
        el.append(caixa("<b>Nota do mestre.</b> " + r["nota"],
                        colors.HexColor("#F6EFDC"), OURO, "nota"))
        el.append(PageBreak())
        return el

    num = 0
    for r in R.MEDIEVAIS:
        num += 1
        h += bloco_receita(r, num, "MEDIEVAIS CLÁSSICAS")
    for r in R.PREMIUM:
        num += 1
        h += bloco_receita(r, num, "LINHA PREMIUM")

    # ---- sazonais
    h.append(Paragraph("SAZONAIS", E["rot"]))
    h.append(Paragraph("Nove receitas de calendário", E["titulo"]))
    h.append(Paragraph("Produção planejada para o pico de venda", E["sub"]))
    h += regua()
    h.append(Paragraph(
        "Hidromel leva meses. Quem começa a produzir o hidromel de Natal em novembro "
        "não vende no Natal. Estas nove receitas existem para amarrar produção a "
        "calendário — a formulação segue a lógica das anteriores; o que muda é "
        "<i>quando</i> começar.",
        E["corpo"]))
    h.append(Spacer(1, 8))
    linhas = [["Receita", "Conceito", "OG", "FG", "ABV"]]
    for nome, conceito, og, fg, abv in R.SAZONAIS:
        linhas.append([nome, conceito, f"{og:.3f}", f"{fg:.3f}", f"{abv}%"])
    h.append(tabela(linhas, [42 * mm, 78 * mm, 15 * mm, 15 * mm, 12 * mm]))

    h.append(Spacer(1, 12))
    h.append(caixa(
        "<b>Regra do calendário:</b> conte para trás a partir da data de venda. "
        "Fermentação (30 dias) + maturação (60 a 90) + envase e descanso (15) = "
        "comece <b>quatro meses antes</b>. Para bochet e sack mead, seis.",
        colors.HexColor("#EDF3F0"), VERDE))

    doc.build(h)
    return arq


# ============================================================================
# 2 — MANUAL DE LEGALIZAÇÃO E PRECIFICAÇÃO
# ============================================================================
def manual():
    arq = os.path.join(SAIDA, "manual-legalizacao-precificacao.pdf")
    doc = Doc(arq, "Manual de Legalização e Precificação", "Burocracia e números")
    h = capa_conteudo(
        "Legalização<br/>&amp; Precificação",
        "O caminho da burocracia e a conta<br/>que decide se o negócio existe",
        "HIDROMEL DE REIS &nbsp;·&nbsp; MÓDULOS XI E XII",
    )

    h.append(caixa(
        "<b>Aviso necessário.</b> Este material é didático e reflete a legislação "
        "federal vigente na data de publicação. Regras <b>municipais e estaduais</b> "
        "variam muito, e a norma federal muda. Antes de investir, confirme cada etapa "
        "na Superintendência Federal de Agricultura do seu estado e na vigilância "
        "sanitária do seu município. Este manual não substitui advogado nem contador.",
        colors.HexColor("#F7E9EC"), SANGUE))
    h.append(Spacer(1, 10))

    # ---- panorama
    h.append(Paragraph("Parte I — O mapa da burocracia", E["h1"]))
    h += regua()
    h.append(Paragraph(
        "Produzir hidromel em casa, para consumo próprio ou para presentear, "
        "<b>não exige autorização nenhuma</b>. A partir do momento em que existe venda, "
        "o produto passa a ser bebida sob competência do Ministério da Agricultura e "
        "Pecuária, e o caminho é o seguinte.",
        E["corpo"]))
    h.append(Spacer(1, 6))
    h.append(tabela([
        ["#", "Etapa", "Onde", "Prazo típico", "Custo estimado"],
        ["1", "Abertura da empresa (CNPJ + CNAE)", "Junta Comercial / Receita", "5 a 15 dias", "R$ 600 – 1.500"],
        ["2", "Consulta de viabilidade e alvará de localização", "Prefeitura", "15 a 45 dias", "R$ 200 – 800"],
        ["3", "Alvará sanitário", "Vigilância Sanitária municipal", "30 a 90 dias", "R$ 300 – 1.200"],
        ["4", "Auto de vistoria do corpo de bombeiros", "CBM estadual", "30 a 60 dias", "R$ 300 – 900"],
        ["5", "Licença ambiental (quando exigida)", "Órgão ambiental estadual", "30 a 120 dias", "R$ 500 – 3.000"],
        ["6", "Responsável técnico", "Contrato + CREA/CRQ", "—", "R$ 800 – 2.500/mês"],
        ["7", "Registro do ESTABELECIMENTO", "MAPA / SFA do estado", "60 a 180 dias", "taxa + assessoria"],
        ["8", "Registro do PRODUTO", "MAPA", "30 a 90 dias", "por produto"],
        ["9", "Análise laboratorial do lote", "Lab. credenciado", "10 a 20 dias", "R$ 250 – 600/lote"],
    ], [8 * mm, 52 * mm, 38 * mm, 27 * mm, 37 * mm]))
    h.append(Spacer(1, 8))
    h.append(caixa(
        "<b>Ordem importa.</b> O registro no MAPA (etapa 7) exige alvará sanitário e "
        "responsável técnico já contratado. Tentar pular a fila faz o processo voltar "
        "e recomeçar — e é o motivo número um de gente desistir no meio.",
        colors.HexColor("#F6EFDC"), OURO))

    # ---- CNPJ
    h.append(Paragraph("Parte II — CNPJ: o MEI não serve", E["h1"]))
    h += regua()
    h.append(Paragraph(
        "Esta é a dúvida mais frequente, e a resposta é direta: <b>a fabricação de "
        "bebida alcoólica não está na lista de ocupações permitidas ao MEI</b>. "
        "Não é questão de faturamento — a atividade em si está fora.",
        E["corpo"]))
    h.append(Spacer(1, 5))
    h.append(tabela([
        ["Enquadramento", "Serve para hidromel?", "Observação"],
        ["MEI", "NÃO", "Fabricação de bebida alcoólica não consta nas ocupações permitidas"],
        ["ME – Simples Nacional", "Sim", "Caminho usual de quem começa; até R$ 360 mil/ano"],
        ["EPP – Simples Nacional", "Sim", "Até R$ 4,8 milhões/ano"],
        ["Lucro Presumido", "Sim", "Costuma compensar acima do teto do Simples"],
    ], [34 * mm, 30 * mm, 98 * mm]))
    h.append(Spacer(1, 8))
    h.append(Paragraph("CNAEs usados no setor", E["h2"]))
    h.append(tabela([
        ["CNAE", "Descrição", "Uso"],
        ["1113-5/02", "Fabricação de vinho", "Usado por produtores de fermentados de fruta e mel"],
        ["1112-7/00", "Fabricação de vinho de outras frutas / fermentados", "Alternativa comum para hidromel"],
        ["4635-4/02", "Comércio atacadista de cerveja, chope e refrigerante", "Se também revender"],
        ["4723-7/00", "Comércio varejista de bebidas", "Loja própria ou e-commerce"],
    ], [26 * mm, 84 * mm, 52 * mm]))
    h.append(Spacer(1, 6))
    h.append(caixa(
        "<b>Confirme com seu contador antes de registrar.</b> O CNAE define tributação, "
        "exigência sanitária e o próprio enquadramento no MAPA. Errar aqui custa caro "
        "para desfazer.",
        colors.HexColor("#F6EFDC"), OURO))

    # ---- rotulagem
    h.append(PageBreak())
    h.append(Paragraph("Parte III — Rótulo: o que é obrigatório", E["h1"]))
    h += regua()
    h.append(tabela([
        ["Elemento", "Obrigatório", "Detalhe"],
        ["Denominação de venda", "Sim", "“Hidromel” só se for mel, água e levedura"],
        ["Marca / nome do produto", "Sim", "—"],
        ["Teor alcoólico", "Sim", "% em volume a 20 °C"],
        ["Conteúdo líquido", "Sim", "Em mL ou L, na face principal"],
        ["Lote", "Sim", "Precisa permitir rastrear a produção"],
        ["Data de fabricação", "Sim", "—"],
        ["Prazo de validade", "Sim", "Ou “consumir preferencialmente antes de”"],
        ["Ingredientes", "Sim", "Ordem decrescente de quantidade"],
        ["Identificação do fabricante", "Sim", "Razão social, CNPJ e endereço completo"],
        ["Nº de registro no MAPA", "Sim", "Do estabelecimento e do produto"],
        ["Advertência de consumo", "Sim", "“Evite o consumo excessivo de álcool”"],
        ["Proibido para menores de 18", "Sim", "—"],
        ["Alergênicos (sulfitos)", "Sim", "Se acima de 10 mg/kg — quase sempre é o caso"],
    ], [46 * mm, 24 * mm, 92 * mm]))
    h.append(Spacer(1, 9))
    h.append(caixa(
        "<b>Duas armadilhas que pegam quase todo mundo.</b><br/>"
        "<b>1.</b> Termos como “premium”, “artesanal”, “natural” e “reserva” sofrem "
        "restrição no painel principal do rótulo de bebida. Isso não impede você de "
        "usá-los no marketing, no site e no material de venda — só no rótulo.<br/>"
        "<b>2.</b> Acrescentar fruta, cacau ou especiaria pode fazer o produto perder o "
        "direito de se chamar “Hidromel” no painel principal, passando a ser registrado "
        "como <b>bebida alcoólica mista</b>. O produto continua o mesmo; o que muda é o "
        "enquadramento. Planeje isso ANTES de mandar imprimir 5 mil rótulos.",
        colors.HexColor("#F7E9EC"), SANGUE))

    # ---- precificação
    h.append(PageBreak())
    h.append(Paragraph("Parte IV — A conta que decide tudo", E["h1"]))
    h += regua()
    h.append(Paragraph(
        "O erro mais caro do produtor iniciante é precificar multiplicando o custo por "
        "três. Parece seguro e não é: imposto e comissão incidem sobre o <b>preço</b>, "
        "não sobre o custo. Quem multiplica por três e depois desconta 12% de imposto e "
        "30% de comissão do canal descobre no fim do ano que a margem real foi metade "
        "da que imaginava.",
        E["corpo"]))
    h.append(Spacer(1, 6))
    h.append(Paragraph("A fórmula correta — markup divisor", E["h2"]))
    h.append(caixa(
        '<para alignment="center"><font face="Times-Bold" size="13">'
        'preço = custo ÷ [ 1 − (imposto% + comissão% + margem%) ÷ 100 ]'
        '</font></para>',
        colors.HexColor("#F6EFDC"), OURO))
    h.append(Spacer(1, 8))
    h.append(Paragraph("Exemplo completo — lote de 20 litros", E["h2"]))
    h.append(tabela([
        ["Item", "Cálculo", "Valor"],
        ["Mel (6 kg × R$ 32)", "insumo", "R$ 192,00"],
        ["Levedura + nutriente", "insumo", "R$ 28,00"],
        ["Outros insumos", "insumo", "R$ 15,00"],
        ["Custo do lote", "soma", "R$ 235,00"],
        ["Garrafas produzidas", "20 L ÷ 0,75 L, menos 8% de perda", "24 garrafas"],
        ["Custo do líquido por garrafa", "R$ 235 ÷ 24", "R$ 9,79"],
        ["Embalagem por garrafa", "garrafa 4,50 + rolha 1,20 + rótulo 1,80 + cápsula 0,60", "R$ 8,10"],
        ["CUSTO POR GARRAFA", "soma", "R$ 17,89"],
        ["Preço de venda", "17,89 ÷ (1 − 0,47)", "R$ 33,75"],
        ["  Imposto (12%)", "sobre o preço", "R$ 4,05"],
        ["  Margem (35%)", "sobre o preço", "R$ 11,81"],
        ["Lucro por garrafa", "—", "R$ 11,81"],
        ["Lucro do lote", "× 24 garrafas", "R$ 283,44"],
    ], [56 * mm, 72 * mm, 34 * mm]))
    h.append(Spacer(1, 8))
    h.append(caixa(
        "<b>Este é o preço de custo-mais-margem — o piso, não o teto.</b> "
        "R$ 33,75 é o mínimo para o negócio se pagar. O que sustenta R$ 140 numa "
        "garrafa de custo R$ 17,89 não é a planilha: é marca, história e escassez. "
        "A planilha impede o prejuízo; o Módulo 13 é que constrói o preço.",
        colors.HexColor("#EDF3F0"), VERDE))

    h.append(Spacer(1, 10))
    h.append(Paragraph("Preço por canal", E["h2"]))
    h.append(Paragraph(
        "A mesma garrafa tem preços diferentes conforme o canal — e a tabela precisa "
        "ser montada de trás para frente, partindo do preço na prateleira, para você "
        "não brigar com o próprio revendedor.", E["corpo"]))
    h.append(Spacer(1, 5))
    h.append(tabela([
        ["Canal", "Comissão", "Seu preço", "Preço final", "Margem"],
        ["Direto (site / WhatsApp)", "0%", "R$ 89,00", "R$ 89,00", "alta"],
        ["Feira e evento", "custo do estande", "R$ 79,00", "R$ 79,00", "alta"],
        ["Bar / restaurante", "—", "R$ 52,00", "R$ 120,00+", "média"],
        ["Loja especializada", "—", "R$ 48,00", "R$ 95,00", "média"],
        ["Distribuidor", "—", "R$ 38,00", "R$ 95,00", "baixa"],
        ["Marketplace", "12–18%", "R$ 89,00", "R$ 89,00", "média"],
    ], [42 * mm, 30 * mm, 28 * mm, 30 * mm, 32 * mm]))
    h.append(Spacer(1, 8))
    h.append(caixa(
        "<b>Nunca venda direto mais barato que o seu revendedor.</b> É a forma mais "
        "rápida de perder o canal — e o revendedor não avisa, só para de comprar.",
        colors.HexColor("#F6EFDC"), OURO))

    # ---- ponto de equilíbrio
    h.append(Paragraph("Parte V — Ponto de equilíbrio", E["h1"]))
    h += regua()
    h.append(tabela([
        ["Custo fixo mensal", "Lucro por garrafa", "Garrafas/mês para empatar", "Litros"],
        ["R$ 1.500", "R$ 38", "40", "30 L"],
        ["R$ 2.500", "R$ 38", "66", "50 L"],
        ["R$ 2.500", "R$ 60", "42", "32 L"],
        ["R$ 5.000", "R$ 60", "84", "63 L"],
        ["R$ 8.000", "R$ 90", "89", "67 L"],
    ], [42 * mm, 38 * mm, 52 * mm, 30 * mm]))
    h.append(Spacer(1, 8))
    h.append(caixa(
        "<b>Leitura honesta desta tabela:</b> com R$ 2.500 de custo fixo e R$ 38 de "
        "lucro por garrafa, você precisa vender <b>66 garrafas por mês, todo mês</b>, "
        "só para não ter prejuízo. Se esse número parece alto para a sua realidade "
        "agora, a resposta não é desistir — é começar menor, com custo fixo perto de "
        "zero, e crescer com o faturamento.",
        colors.HexColor("#EDF3F0"), VERDE))

    doc.build(h)
    return arq


# ============================================================================
# 3 — FICHAS DE FERMENTAÇÃO (imprimíveis)
# ============================================================================
def fichas():
    arq = os.path.join(SAIDA, "fichas-de-fermentacao.pdf")
    doc = Doc(arq, "Fichas de Fermentação", "Controle de lote")
    h = capa_conteudo(
        "Fichas de<br/>Fermentação",
        "Controle de lote, cronograma de nutriente<br/>e avaliação sensorial",
        "IMPRIMA E MANTENHA JUNTO AO FERMENTADOR",
    )

    def linhas_vazias(n, larguras, cabecalho):
        return tabela([cabecalho] + [[""] * len(cabecalho) for _ in range(n)], larguras)

    h.append(Paragraph("FICHA 1", E["rot"]))
    h.append(Paragraph("Identificação do lote", E["titulo"]))
    h += regua()
    h.append(tabela([
        ["Campo", "Preencher"],
        ["Nº do lote", ""], ["Receita", ""], ["Data de início", ""],
        ["Volume (L)", ""], ["Mel — florada e origem", ""], ["Mel — quantidade (kg)", ""],
        ["Levedura (cepa e lote)", ""], ["OG medida", ""], ["pH inicial", ""],
        ["Temperatura alvo", ""], ["FG esperada", ""], ["ABV alvo", ""],
    ], [62 * mm, 100 * mm]))

    h.append(Spacer(1, 12))
    h.append(Paragraph("FICHA 2", E["rot"]))
    h.append(Paragraph("Registro diário", E["titulo"]))
    h += regua()
    h.append(linhas_vazias(20, [16 * mm, 20 * mm, 24 * mm, 20 * mm, 18 * mm, 64 * mm],
                           ["Dia", "Data", "Densidade", "Temp. °C", "pH", "Observações (cheiro, atividade, cor)"]))

    h.append(PageBreak())
    h.append(Paragraph("FICHA 3", E["rot"]))
    h.append(Paragraph("Cronograma de nutriente (TOSNA)", E["titulo"]))
    h += regua()
    h.append(Paragraph(
        "Divida a dose total em quatro adições iguais. A quarta acontece quando a "
        "densidade tiver caído um terço do caminho entre a OG e a FG — não em data fixa.",
        E["corpo"]))
    h.append(Spacer(1, 6))
    h.append(tabela([
        ["Adição", "Quando", "Dose (g)", "Feito em", "Densidade no dia"],
        ["1ª", "24 h após inocular", "", "", ""],
        ["2ª", "48 h após inocular", "", "", ""],
        ["3ª", "72 h após inocular", "", "", ""],
        ["4ª", "a 1/3 da queda de densidade", "", "", ""],
    ], [20 * mm, 56 * mm, 24 * mm, 30 * mm, 32 * mm]))

    h.append(Spacer(1, 12))
    h.append(Paragraph("FICHA 4", E["rot"]))
    h.append(Paragraph("Trasfegas e adições", E["titulo"]))
    h += regua()
    h.append(linhas_vazias(10, [24 * mm, 26 * mm, 46 * mm, 66 * mm],
                           ["Data", "Densidade", "Operação", "O que foi adicionado / retirado"]))

    h.append(PageBreak())
    h.append(Paragraph("FICHA 5", E["rot"]))
    h.append(Paragraph("Avaliação sensorial", E["titulo"]))
    h += regua()
    h.append(Paragraph(
        "Avalie sempre às cegas e sempre com a amostra a 12–14 °C. Frio demais esconde "
        "defeito; quente demais inventa defeito que não existe.", E["corpo"]))
    h.append(Spacer(1, 6))
    h.append(tabela([
        ["Atributo", "1", "2", "3", "4", "5", "Anotações"],
        ["Limpidez", "", "", "", "", "", ""],
        ["Cor", "", "", "", "", "", ""],
        ["Intensidade aromática", "", "", "", "", "", ""],
        ["Presença do mel", "", "", "", "", "", ""],
        ["Doçura", "", "", "", "", "", ""],
        ["Acidez", "", "", "", "", "", ""],
        ["Corpo", "", "", "", "", "", ""],
        ["Álcool (integração)", "", "", "", "", "", ""],
        ["Persistência", "", "", "", "", "", ""],
        ["Impressão geral", "", "", "", "", "", ""],
    ], [44 * mm, 9 * mm, 9 * mm, 9 * mm, 9 * mm, 9 * mm, 73 * mm]))

    h.append(Spacer(1, 10))
    h.append(Paragraph("Defeitos — marque o que identificar", E["h2"]))
    h.append(tabela([
        ["Defeito", "Como se apresenta", "Presente?"],
        ["H₂S (enxofre)", "ovo podre, fósforo queimado", ""],
        ["Óleo fúsel", "solvente, esquenta a garganta", ""],
        ["Acetaldeído", "maçã verde machucada", ""],
        ["Acidez volátil", "vinagre, esmalte", ""],
        ["Oxidação", "papelão molhado, xerez", ""],
        ["Fenólico", "band-aid, remédio, fumaça", ""],
        ["Adstringência", "resseca a boca", ""],
        ["Diacetil", "manteiga, pipoca de cinema", ""],
    ], [40 * mm, 92 * mm, 30 * mm]))

    doc.build(h)
    return arq


# ============================================================================
# 4 — MATERIAIS DE AULA
# ============================================================================
def material(nome_arq, titulo, subtitulo, rotulo, blocos):
    arq = os.path.join(SAIDA, nome_arq)
    doc = Doc(arq, titulo, subtitulo)
    h = capa_conteudo(titulo, subtitulo, rotulo)
    for b in blocos:
        tipo = b[0]
        if tipo == "h1":
            h.append(Paragraph(b[1], E["h1"])); h += regua()
        elif tipo == "h2":
            h.append(Paragraph(b[1], E["h2"]))
        elif tipo == "p":
            h.append(Paragraph(b[1], E["corpo"]))
        elif tipo == "tab":
            h.append(tabela(b[1], b[2])); h.append(Spacer(1, 8))
        elif tipo == "aviso":
            h.append(caixa(b[1], colors.HexColor("#F7E9EC"), SANGUE)); h.append(Spacer(1, 8))
        elif tipo == "dica":
            h.append(caixa(b[1], colors.HexColor("#F6EFDC"), OURO)); h.append(Spacer(1, 8))
        elif tipo == "ok":
            h.append(caixa(b[1], colors.HexColor("#EDF3F0"), VERDE)); h.append(Spacer(1, 8))
        elif tipo == "quebra":
            h.append(PageBreak())
        elif tipo == "esp":
            h.append(Spacer(1, b[1]))
    doc.build(h)
    return arq


MATERIAIS = [
    dict(
        nome_arq="lista-compras-semana-1.pdf",
        titulo="Lista de Compras<br/>Semana 1",
        subtitulo="O que comprar agora — e o que NÃO comprar ainda",
        rotulo="MÓDULO 00 · AULA 03",
        blocos=[
            ("h1", "Setup mínimo — cerca de R$ 280"),
            ("p", "Suficiente para o primeiro lote de 5 litros. Nada aqui é supérfluo, "
                  "e nada aqui compromete a qualidade do produto."),
            ("tab", [
                ["Item", "Especificação", "Faixa de preço"],
                ["Fermentador 6 L", "balde ou galão de vidro, com tampa e furo", "R$ 45 – 90"],
                ["Airlock + rolha", "tipo S ou de três peças", "R$ 8 – 18"],
                ["Densímetro + proveta", "faixa 0,990 – 1,170", "R$ 35 – 70"],
                ["Sanitizante", "Star San 250 mL rende muitos lotes", "R$ 35 – 60"],
                ["Mangueira de trasfega", "silicone atóxico, 1,5 m", "R$ 15 – 30"],
                ["Termômetro", "digital espeto", "R$ 15 – 35"],
                ["Balança", "até 5 kg, precisão de 1 g", "R$ 30 – 60"],
                ["Mel", "3 kg, florada única, de apicultor", "R$ 90 – 150"],
                ["Levedura", "Lalvin 71B ou D47, 1 sachê", "R$ 12 – 22"],
                ["Nutriente", "Fermaid-O 50 g", "R$ 25 – 45"],
            ], [40 * mm, 82 * mm, 40 * mm]),
            ("dica", "<b>Onde economizar sem prejuízo:</b> balde de grau alimentício "
                     "funciona tão bem quanto vidro no primeiro lote, e custa um terço. "
                     "O vidro é mais bonito, não mais eficiente."),
            ("aviso", "<b>NÃO compre agora:</b> barril de inox, controlador de temperatura, "
                      "bomba de trasfega, filtro de placas, cilindro de CO₂. Tudo isso faz "
                      "sentido a partir do terceiro lote — antes disso é dinheiro parado "
                      "enquanto você ainda está descobrindo se gosta do processo."),
            ("h1", "Setup intermediário — cerca de R$ 1.400"),
            ("p", "Vale a partir do terceiro lote, quando você já sabe que vai continuar."),
            ("tab", [
                ["Item", "Por que agora", "Faixa de preço"],
                ["Fermentador inox 30 L", "durabilidade e volume de trabalho", "R$ 450 – 800"],
                ["Controlador de temperatura", "o maior salto de qualidade por real gasto", "R$ 90 – 180"],
                ["Freezer usado + controlador", "câmara de fermentação de verdade", "R$ 400 – 700"],
                ["Refratômetro", "leitura com 3 gotas, sem gastar amostra", "R$ 80 – 160"],
                ["pHmetro", "pH trava fermentação e você não vê sem medir", "R$ 90 – 200"],
                ["Bomba de trasfega", "menos oxidação, menos perda", "R$ 180 – 350"],
            ], [46 * mm, 78 * mm, 38 * mm]),
            ("ok", "<b>Se for comprar uma coisa só desta lista:</b> o controlador de "
                   "temperatura. Fermentação a 28 °C produz óleo fúsel e solvente; a "
                   "18 °C, o mesmo mosto vira outro produto. É o item de maior impacto "
                   "por real investido em todo o curso."),
        ],
    ),
    dict(
        nome_arq="guia-flotadas.pdf",
        titulo="Guia de Floradas<br/>Brasileiras",
        subtitulo="Doze méis, doze hidroméis diferentes",
        rotulo="MÓDULO 02 · AULA 02",
        blocos=[
            ("h1", "A florada é a receita"),
            ("p", "Trocar a florada muda mais o resultado final do que trocar a levedura. "
                  "Um mesmo procedimento com mel de laranjeira e com mel de aroeira produz "
                  "dois produtos que ninguém diria ser da mesma categoria."),
            ("tab", [
                ["Florada", "Cor", "Perfil sensorial", "Melhor uso"],
                ["Laranjeira", "clara", "floral, cítrico, delicado", "show mead, rhodomel, cyser"],
                ["Silvestre", "âmbar", "complexo, herbal, encorpado", "metheglin, melomel, bochet"],
                ["Eucalipto", "âmbar escuro", "mentolado, mineral, resinoso", "seco de harmonização"],
                ["Assa-peixe", "clara", "suave, adocicado, limpo", "show mead, sack mead"],
                ["Cipó-uva", "escuro", "melado, denso, caramelo", "sack mead, sobremesa"],
                ["Aroeira", "âmbar", "picante, apimentado, marcante", "capsicumel, metheglin"],
                ["Marmeleiro", "âmbar claro", "frutado, acidez leve", "melomel tropical"],
                ["Cambará", "clara", "floral, delicado", "show mead premium"],
                ["Angico", "escuro", "amadeirado, robusto", "bochet, braggot"],
                ["Morro", "âmbar", "equilibrado, versátil", "uso geral"],
                ["Capixingui", "clara", "suave, notas de baunilha", "acerglyn, sobremesa"],
                ["Melato de bracatinga", "muito escuro", "malte, melaço, umami", "braggot, bochet"],
            ], [30 * mm, 24 * mm, 56 * mm, 52 * mm]),
            ("dica", "<b>Como escolher sem errar:</b> mel claro e delicado pede receita "
                     "que não o cubra (show mead, seco). Mel escuro e potente aguenta "
                     "fruta, especiaria e madeira. Usar mel caro e delicado num melomel "
                     "de amora é desperdiçar os dois."),
            ("h1", "Como identificar mel adulterado sem laboratório"),
            ("tab", [
                ["Teste", "Como fazer", "O que indica"],
                ["Água", "1 colher em copo de água fria, sem mexer", "mel puro afunda em bloco; adulterado se dissolve"],
                ["Chama", "molhe um palito e acenda", "mel puro queima; com água, chia e não acende"],
                ["Cristalização", "observe ao longo de meses", "mel puro cristaliza; xarope quase nunca"],
                ["Papel", "gota em papel absorvente", "mel puro não molha o papel rapidamente"],
            ], [24 * mm, 68 * mm, 70 * mm]),
            ("aviso", "<b>Nenhum teste caseiro substitui laudo.</b> Eles servem para "
                      "descartar fornecedor duvidoso, não para atestar qualidade. Para "
                      "produção comercial, exija laudo físico-químico do apicultor."),
        ],
    ),
    dict(
        nome_arq="tabela-leveduras.pdf",
        titulo="Tabela de<br/>Leveduras",
        subtitulo="Dez cepas e o que cada uma entrega",
        rotulo="MÓDULO 03 · AULA 02",
        blocos=[
            ("h1", "Escolher a cepa é escolher o perfil"),
            ("p", "A levedura decide se o mel vai aparecer ou desaparecer, se o resultado "
                  "vai ser seco ou doce, e quanto tempo o lote leva. Escolha antes de "
                  "comprar o mel, não depois."),
            ("tab", [
                ["Cepa", "ABV máx.", "Temp. °C", "Perfil", "Melhor para"],
                ["Lalvin 71B", "14%", "15–30", "frutado, suaviza acidez", "melomel, iniciantes"],
                ["Lalvin D47", "14%", "15–20", "corpo, glicerol, floral", "show mead, acerglyn"],
                ["Lalvin K1-V1116", "18%", "10–35", "neutro, muito resistente", "sack mead, alto ABV"],
                ["Lalvin EC-1118", "18%", "10–30", "neutro e agressivo", "resgatar lote travado"],
                ["Lalvin RC-212", "16%", "20–30", "estrutura tânica", "pyment tinto"],
                ["Lalvin DV10", "18%", "10–35", "muito neutro, seca total", "seco extremo, espumante"],
                ["Lalvin BM-4X4", "16%", "15–28", "complexidade, corpo", "premium de guarda"],
                ["Wyeast 4184 Sweet", "12%", "18–24", "deixa doçura residual", "doce sem adoçar depois"],
                ["Lalvin QA23", "16%", "15–20", "aromático, tropical", "melomel de fruta tropical"],
                ["Safale US-05", "11%", "15–22", "neutro cervejeiro", "braggot"],
            ], [34 * mm, 20 * mm, 22 * mm, 42 * mm, 44 * mm]),
            ("dica", "<b>Na dúvida, 71B.</b> Perdoa erro de nutriente, trabalha numa faixa "
                     "larga de temperatura e produz éster frutado que agrada quase todo "
                     "mundo. É a cepa certa para os três primeiros lotes."),
            ("h1", "Reidratação — o passo que quase todo mundo pula"),
            ("tab", [
                ["Passo", "Detalhe"],
                ["1", "Aqueça 20× o peso da levedura em água a 40 °C (10 g → 200 mL)"],
                ["2", "Dissolva o Go-Ferm: 1,25 g para cada 1 g de levedura"],
                ["3", "Espere a água baixar para 40 °C e polvilhe a levedura por cima"],
                ["4", "Deixe 15 min sem mexer, depois agite suavemente"],
                ["5", "Iguale a temperatura ao mosto em etapas de 5 °C, a cada 5 min"],
                ["6", "Inocule quando a diferença for menor que 5 °C"],
            ], [16 * mm, 146 * mm]),
            ("aviso", "<b>Choque térmico mata metade das células.</b> Jogar levedura "
                      "reidratada a 40 °C num mosto a 18 °C é a causa silenciosa de "
                      "fermentação lenta e de cheiro de enxofre no terceiro dia."),
        ],
    ),
    dict(
        nome_arq="receita-mestra.pdf",
        titulo="Receita Mestra",
        subtitulo="Traditional Show Mead — 5 litros, semi-seco, 10,5% ABV",
        rotulo="MÓDULO 05 · AULA 01",
        blocos=[
            ("h1", "A receita que você vai repetir a vida inteira"),
            ("p", "Esta é a versão de 5 litros da receita mestra do grimório. Comece por "
                  "ela, repita três vezes, e só então parta para as outras categorias."),
            ("tab", [
                ["Item", "Quantidade", "Observação"],
                ["Mel de laranjeira", "1,5 kg", "florada única, de apicultor"],
                ["Água filtrada", "até 5 L", "sem cloro — deixe descansar 24 h ou ferva e esfrie"],
                ["Lalvin 71B", "2,5 g", "meio sachê; o resto guarde na geladeira"],
                ["Go-Ferm", "3,1 g", "para a reidratação"],
                ["Fermaid-O", "5,3 g", "dividido em 4 adições de 1,3 g"],
            ], [42 * mm, 30 * mm, 90 * mm]),
            ("h2", "Números-alvo"),
            ("tab", [
                ["OG", "FG", "ABV", "Estilo", "Tempo total"],
                ["1,088", "1,010", "10,5%", "Semi-seco", "90 dias"],
            ], [28 * mm, 28 * mm, 28 * mm, 40 * mm, 38 * mm]),
            ("h1", "Cronograma dia a dia"),
            ("tab", [
                ["Dia", "O que fazer", "O que observar"],
                ["0", "Sanitizar, montar o mosto, medir OG, reidratar e inocular", "OG entre 1,085 e 1,091"],
                ["1", "1ª dose de nutriente (1,3 g)", "airlock borbulhando"],
                ["2", "2ª dose (1,3 g) + degassing", "espuma no topo"],
                ["3", "3ª dose (1,3 g) + degassing", "densidade começa a cair"],
                ["5–7", "4ª dose quando cair a 1/3 (≈1,062)", "atividade no pico"],
                ["7–14", "degassing diário, medir densidade", "queda constante"],
                ["21", "1ª trasfega", "densidade estável por 3 leituras"],
                ["30", "conferir estabilidade", "FG próxima de 1,010"],
                ["45", "2ª trasfega", "líquido começa a clarear"],
                ["90", "engarrafar", "límpido e sem sedimento"],
            ], [18 * mm, 88 * mm, 56 * mm]),
            ("ok", "<b>Se a densidade não cair nos primeiros 3 dias:</b> confira a "
                   "temperatura (deve estar entre 15 e 30 °C), confira se a água tinha "
                   "cloro e confira a validade da levedura. Nessa ordem — quase sempre é "
                   "uma dessas três."),
        ],
    ),
    dict(
        nome_arq="checklist-legalizacao.pdf",
        titulo="Checklist de<br/>Legalização",
        subtitulo="As etapas, na ordem, com o que já foi feito",
        rotulo="MÓDULO 11 · AULA 01",
        blocos=[
            ("aviso", "<b>Confirme localmente.</b> Regras municipais e estaduais variam. "
                      "Use este checklist como roteiro, e valide cada etapa na "
                      "Superintendência Federal de Agricultura do seu estado e na "
                      "vigilância sanitária do seu município."),
            ("h1", "Etapa 1 — Empresa"),
            ("tab", [
                ["Feito", "Item", "Onde"],
                ["☐", "Definir CNAE com o contador", "contador"],
                ["☐", "Consulta prévia de viabilidade", "prefeitura"],
                ["☐", "Registro na Junta Comercial", "Junta Comercial"],
                ["☐", "CNPJ", "Receita Federal"],
                ["☐", "Inscrição estadual", "Secretaria da Fazenda"],
                ["☐", "Alvará de localização e funcionamento", "prefeitura"],
            ], [16 * mm, 88 * mm, 58 * mm]),
            ("h1", "Etapa 2 — Estrutura física"),
            ("tab", [
                ["Feito", "Item", "Onde"],
                ["☐", "Planta baixa com fluxo sujo→limpo", "arquiteto / RT"],
                ["☐", "Área de produção separada de área doméstica", "—"],
                ["☐", "Piso, parede e teto laváveis", "—"],
                ["☐", "Ponto de água potável com laudo", "—"],
                ["☐", "Auto de vistoria do corpo de bombeiros", "CBM"],
                ["☐", "Alvará sanitário", "Vigilância Sanitária"],
            ], [16 * mm, 88 * mm, 58 * mm]),
            ("quebra",),
            ("h1", "Etapa 3 — Registro no MAPA"),
            ("tab", [
                ["Feito", "Item", "Observação"],
                ["☐", "Contratar responsável técnico", "químico ou eng. de alimentos"],
                ["☐", "Memorial descritivo do processo", "assinado pelo RT"],
                ["☐", "Memorial descritivo das instalações", "com planta"],
                ["☐", "Manual de Boas Práticas de Fabricação", "assinado pelo RT"],
                ["☐", "POPs (procedimentos operacionais)", "higienização, água, pragas"],
                ["☐", "Requerimento de registro do estabelecimento", "SFA do estado"],
                ["☐", "Pagamento da taxa", "GRU"],
                ["☐", "Vistoria do fiscal federal", "agendada pela SFA"],
                ["☐", "Nº de registro do estabelecimento emitido", "—"],
                ["☐", "Registro de cada produto", "um por produto"],
            ], [16 * mm, 84 * mm, 62 * mm]),
            ("h1", "Etapa 4 — Produto e rótulo"),
            ("tab", [
                ["Feito", "Item", "Observação"],
                ["☐", "Ficha técnica de cada produto", "—"],
                ["☐", "Análise físico-química do lote", "lab. credenciado pelo MAPA"],
                ["☐", "Rótulo com todos os itens obrigatórios", "ver Manual, Parte III"],
                ["☐", "Verificar restrição a 'premium'/'artesanal' no rótulo", "—"],
                ["☐", "Definir se é 'hidromel' ou 'bebida alcoólica mista'", "depende dos ingredientes"],
                ["☐", "Registro de marca no INPI (classe 33)", "opcional, mas recomendado"],
                ["☐", "Código de barras (GS1)", "para varejo"],
            ], [16 * mm, 84 * mm, 62 * mm]),
            ("ok", "<b>Enquanto o registro não sai:</b> você pode produzir, aperfeiçoar "
                   "receita, construir marca, montar audiência no Instagram e formar lista "
                   "de espera. Tudo isso é legal e é exatamente o que faz a diferença no "
                   "dia em que o registro sair."),
        ],
    ),
    dict(
        nome_arq="guia-rotulagem.pdf",
        titulo="Guia de<br/>Rotulagem",
        subtitulo="O que é obrigatório, o que é proibido e onde cada coisa vai",
        rotulo="MÓDULO 11 · AULA 06",
        blocos=[
            ("h1", "Painel principal x painel secundário"),
            ("p", "A norma trata de forma diferente o que aparece na face voltada para o "
                  "consumidor (painel principal) e o que pode ficar no contra-rótulo. "
                  "Entender essa divisão resolve a maior parte dos problemas de design."),
            ("tab", [
                ["Elemento", "Painel principal", "Painel secundário"],
                ["Denominação de venda", "obrigatório", "—"],
                ["Marca", "obrigatório", "—"],
                ["Conteúdo líquido", "obrigatório", "—"],
                ["Teor alcoólico", "obrigatório", "—"],
                ["Ingredientes", "—", "obrigatório"],
                ["Fabricante, CNPJ e endereço", "—", "obrigatório"],
                ["Registro no MAPA", "—", "obrigatório"],
                ["Lote e data de fabricação", "—", "obrigatório"],
                ["Advertências legais", "—", "obrigatório"],
                ["Alergênicos (sulfitos)", "—", "obrigatório"],
            ], [56 * mm, 44 * mm, 44 * mm]),
            ("aviso", "<b>Termos restritos no painel principal:</b> “premium”, "
                      "“artesanal”, “natural”, “reserva” e similares sofrem restrição em "
                      "rótulo de bebida. Você continua podendo usá-los livremente em "
                      "site, anúncio, catálogo e material de venda — a restrição é do "
                      "rótulo. Muita gente descobre isso depois de imprimir a tiragem."),
            ("dica", "<b>Denominação: hidromel ou bebida alcoólica mista?</b> Se leva "
                     "apenas mel, água e levedura, é hidromel. Ao acrescentar fruta, "
                     "cacau ou especiaria, o produto pode precisar ser registrado como "
                     "bebida alcoólica mista — e a palavra “hidromel” sai do painel "
                     "principal. Solução prática: use o nome de fantasia em destaque "
                     "(“ODIN”, “JABUTICABA”) e a denominação legal em corpo menor, "
                     "como manda a norma."),
            ("h1", "Textos obrigatórios de advertência"),
            ("tab", [
                ["Texto", "Onde"],
                ["EVITE O CONSUMO EXCESSIVO DE ÁLCOOL", "painel secundário, legível"],
                ["VENDA PROIBIDA PARA MENORES DE 18 ANOS", "painel secundário"],
                ["CONTÉM SULFITOS", "se acima de 10 mg/kg"],
                ["INDÚSTRIA BRASILEIRA", "painel secundário"],
            ], [92 * mm, 70 * mm]),
            ("h1", "Antes de mandar imprimir"),
            ("tab", [
                ["Feito", "Verificação"],
                ["☐", "Todos os itens obrigatórios estão presentes"],
                ["☐", "Teor alcoólico do rótulo bate com o laudo do lote"],
                ["☐", "Conteúdo líquido bate com a garrafa usada"],
                ["☐", "Nenhum termo restrito no painel principal"],
                ["☐", "Denominação de venda correta para a composição"],
                ["☐", "Nº de registro do MAPA impresso"],
                ["☐", "Campo de lote e data impresso ou com espaço para carimbo"],
                ["☐", "Revisão ortográfica feita por outra pessoa"],
                ["☐", "Prova impressa colada numa garrafa real e avaliada"],
            ], [16 * mm, 146 * mm]),
            ("ok", "<b>Imprima 50 antes de imprimir 5.000.</b> Gráfica cobra caro pela "
                   "primeira tiragem pequena e barato pela grande — mas rótulo errado em "
                   "tiragem grande é prejuízo inteiro, não desconto."),
        ],
    ),
    dict(
        nome_arq="linha-premium.pdf",
        titulo="Sua Linha<br/>Premium",
        subtitulo="Quatro produtos, quatro preços, uma marca",
        rotulo="MÓDULO 10 · AULA 10",
        blocos=[
            ("h1", "A lógica do portfólio"),
            ("p", "Um produto só não sustenta um negócio: cliente que gostou não tem o "
                  "que comprar de novo, e cliente que achou caro não tem alternativa. "
                  "Quatro produtos resolvem os dois problemas."),
            ("tab", [
                ["Papel", "Produto sugerido", "Custo", "Venda", "Função"],
                ["Entrada", "Tradicional (show mead)", "R$ 11", "R$ 69", "converte quem nunca bebeu"],
                ["Carro-chefe", "Hibisco e gengibre", "R$ 14", "R$ 89", "volume e recompra"],
                ["Premium", "Bochet de café e cardamomo", "R$ 19", "R$ 149", "margem e reputação"],
                ["Edição limitada", "Jabuticaba e amburana, numerada", "R$ 23", "R$ 168", "escassez e imprensa"],
            ], [26 * mm, 54 * mm, 20 * mm, 20 * mm, 42 * mm]),
            ("dica", "<b>Por que o de entrada não pode ser ruim:</b> ele é o primeiro "
                     "contato. Se decepcionar, o cliente nunca chega ao de R$ 149. "
                     "Entrada quer dizer preço acessível, não qualidade menor."),
            ("h1", "Escassez que não é fabricada"),
            ("p", "Escassez inventada — “últimas unidades” toda semana — queima a marca. "
                  "Escassez real vende para sempre. Formas honestas de criar:"),
            ("tab", [
                ["Mecanismo", "Como funciona", "Por que é real"],
                ["Safra", "cada ano tem sua safra, com data no rótulo", "o mel de cada ano é diferente mesmo"],
                ["Numeração manual", "garrafa 037/200, escrita à mão", "o lote tem tamanho finito de verdade"],
                ["Barril único", "só o que coube no barril", "a capacidade é física"],
                ["Fruta de estação", "jabuticaba só existe alguns meses", "a natureza é que decide"],
                ["Lista de espera", "abre quando o lote fica pronto", "o tempo de maturação é real"],
            ], [30 * mm, 62 * mm, 70 * mm]),
            ("ok", "<b>Comece com dois produtos, não quatro.</b> Entrada e premium. "
                   "Amplie quando os dois estiverem girando — quatro produtos parados no "
                   "estoque é capital de giro travado, não portfólio."),
        ],
    ),
    dict(
        nome_arq="calendario-conteudo.pdf",
        titulo="Calendário de<br/>Conteúdo",
        subtitulo="Trinta dias de pauta para o Instagram",
        rotulo="MÓDULO 14 · AULA 03",
        blocos=[
            ("h1", "Como usar"),
            ("p", "O eixo é a história — é o que diferencia você de qualquer produtor de "
                  "bebida artesanal. Alterne conteúdo histórico, processo, produto e "
                  "prova social. Publique cinco vezes por semana; se não der, três, mas "
                  "todas as semanas."),
            ("aviso", "<b>Regras da Meta para álcool.</b> Conteúdo sobre bebida alcoólica "
                      "tem restrição de segmentação por idade e é sujeito a reprovação de "
                      "anúncio. Configure a restrição etária no perfil, nunca fale de "
                      "consumo por menores e evite associar álcool a direção, esporte ou "
                      "melhora de desempenho. Conta derrubada não se recupera."),
            ("tab", [
                ["Dia", "Pauta", "Formato"],
                ["1", "A bebida mais antiga do mundo — Jiahu, 7.000 a.C.", "carrossel"],
                ["2", "Bastidor: montando o mosto", "reels"],
                ["3", "O que é hidromel, em 30 segundos", "reels"],
                ["4", "A origem da palavra lua de mel", "carrossel"],
                ["5", "Mel de florada única x mel de supermercado", "foto + legenda"],
                ["6", "Enquete: doce ou seco?", "stories"],
                ["7", "O que os vikings realmente bebiam", "carrossel"],
                ["8", "Timelapse da fermentação", "reels"],
                ["9", "Apresentando o produto de entrada", "foto de produto"],
                ["10", "Três erros de quem começa a fazer hidromel", "carrossel"],
                ["11", "Harmonização: hidromel e queijo curado", "foto"],
                ["12", "Responder dúvida frequente", "stories + caixinha"],
                ["13", "A história do bochet — o mel queimado de 1393", "carrossel"],
                ["14", "Caramelizando o mel (o vídeo mais salvo)", "reels"],
                ["15", "Depoimento de cliente real", "repost"],
                ["16", "Por que hidromel demora meses", "reels"],
                ["17", "Conheça o apicultor que fornece o mel", "carrossel"],
                ["18", "Comparativo de cor entre as floradas", "foto"],
                ["19", "Beowulf e o salão de hidromel", "carrossel"],
                ["20", "Dia de engarrafamento", "reels"],
                ["21", "Anúncio da edição limitada", "foto + link"],
                ["22", "T'ej: a Etiópia nunca parou de fazer", "carrossel"],
                ["23", "Como servir: taça, temperatura, ordem", "reels"],
                ["24", "Bastidor: rótulo sendo colado à mão", "reels"],
                ["25", "Pergunta aberta: qual sabor você quer ver?", "stories"],
                ["26", "O sistema polonês de proporções", "carrossel"],
                ["27", "Presente corporativo de fim de ano", "foto"],
                ["28", "Erro que quase custou um lote inteiro", "reels"],
                ["29", "Prova social: reunindo os depoimentos do mês", "carrossel"],
                ["30", "Abertura da lista de espera do próximo lote", "foto + link"],
            ], [14 * mm, 108 * mm, 40 * mm]),
            ("dica", "<b>O post que mais funciona</b> é o histórico com imagem forte. Ele "
                     "não vende diretamente, mas constrói a percepção que permite cobrar "
                     "R$ 149 por uma garrafa. Vender vem depois — e vem mais fácil."),
        ],
    ),
]


# ================================================================== EXECUÇÃO
def main():
    gerados = []
    gerados.append(grimorio())
    gerados.append(manual())
    gerados.append(fichas())
    for m in MATERIAIS:
        gerados.append(material(**m))

    print(f"\n✓ {len(gerados)} PDFs gerados em material/\n")
    total = 0
    for g in gerados:
        tam = os.path.getsize(g)
        total += tam
        print(f"  · {os.path.basename(g):<44} {tam/1024:7.1f} kB")
    print(f"\n  Total: {total/1024:.1f} kB")


if __name__ == "__main__":
    main()
