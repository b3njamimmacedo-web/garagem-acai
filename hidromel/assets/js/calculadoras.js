/* =============================================================================
   CALCULADORAS DA ORDEM
   Bônus B4. Cada função é pura e testável; a interface só as chama.

   As fórmulas seguem a prática consolidada de fermentação de hidromel
   (referências no Grimório, seção "Matemática do mosto").
============================================================================= */

/* ------------------------------------------------------------------ MOSTO */

/**
 * Pontos de densidade que 1 kg de mel gera em 1 L de mosto final.
 *
 * A literatura de fabricação usa PPG = 35 para mel, mas PPG é
 * "points per POUND per GALLON". Converter para kg/L é obrigatório:
 *
 *   35 × (3,785 L/galão) ÷ (0,4536 kg/libra) ≈ 292
 *
 * Conferido contra receitas conhecidas:
 *   1,36 kg em 3,785 L  → 1,36×292/3,785 = 105 pontos → OG 1,105  (Joe's Ancient Orange)
 *   1,134 kg em 3,785 L → 87 pontos → OG 1,087 → ~11,5% ABV        (show mead padrão)
 *
 * Usar 35 aqui produziria OG 1,010 num mosto que na bancada dá 1,088 — o aluno
 * formularia o lote inteiro errado.
 */
const PONTOS_POR_KG_POR_LITRO = 292;

/** Densidade original a partir de mel e volume. */
export function densidadeOriginal(melKg, litros) {
  if (!melKg || !litros) return 1.000;
  return 1 + (melKg * PONTOS_POR_KG_POR_LITRO) / litros / 1000;
}

/** Mel necessário para atingir uma OG alvo. */
export function melParaOG(ogAlvo, litros) {
  const pontos = (ogAlvo - 1) * 1000;
  return (pontos * litros) / PONTOS_POR_KG_POR_LITRO;
}

/** Teor alcoólico.
 *  Para hidromel (faixa ampla de densidade) a fórmula linear clássica
 *  ((OG-FG)*131,25) erra para cima acima de ~14%. Usamos a correção de
 *  Hall/Cutaia, que é a recomendada para vinhos e hidroméis fortes. */
export function abv(og, fg) {
  if (og <= fg) return 0;
  const linear = (og - fg) * 131.25;
  if (linear <= 8) return linear;
  // correção progressiva para mostos densos
  return (76.08 * (og - fg) / (1.775 - og)) * (fg / 0.794);
}

/** Atenuação aparente em %. */
export const atenuacao = (og, fg) =>
  og > 1 ? ((og - fg) / (og - 1)) * 100 : 0;

/** Classificação de doçura pela densidade final — o vocabulário que vai no rótulo. */
export function doceOuSeco(fg) {
  if (fg < 0.996) return { nome: 'Seco extremo', cor: '#7FE0BC' };
  if (fg < 1.006) return { nome: 'Seco', cor: '#7FE0BC' };
  if (fg < 1.015) return { nome: 'Semi-seco', cor: '#F5C542' };
  if (fg < 1.025) return { nome: 'Semi-doce', cor: '#F5C542' };
  if (fg < 1.04) return { nome: 'Doce', cor: '#E9A0AE' };
  return { nome: 'Sobremesa', cor: '#E9A0AE' };
}

/* ------------------------------------------------------------ NUTRIENTES */

/** Protocolo TOSNA 3.0 (Fermentation Nation) com Fermaid-O.
 *  Dose total em gramas = 4 g por galão americano (3,785 L) de mosto,
 *  ajustada pela demanda da cepa, dividida em 4 adições. */
export function tosna(litros, demanda = 'media') {
  const fator = { baixa: 0.75, media: 1, alta: 1.25 }[demanda] ?? 1;
  const galoes = litros / 3.785;
  const total = 4 * galoes * fator;
  const dose = total / 4;
  return {
    total: +total.toFixed(2),
    dose: +dose.toFixed(2),
    cronograma: [
      { quando: '24 h após inocular', g: +dose.toFixed(2) },
      { quando: '48 h após inocular', g: +dose.toFixed(2) },
      { quando: '72 h após inocular', g: +dose.toFixed(2) },
      { quando: 'ao atingir 1/3 de queda da densidade', g: +dose.toFixed(2) },
    ],
    goFerm: +(1.25 * (litros / 3.785) * 1.25).toFixed(2), // ~1,25 g por g de levedura
  };
}

/* --------------------------------------------------------- ADOÇAR DEPOIS */

/** Backsweetening: quanto mel para subir a densidade, e a dose de estabilizante.
 *  ATENÇÃO: adoçar sem estabilizar refermenta na garrafa e ela estoura. */
export function backsweetening(litros, fgAtual, fgAlvo, pH = 3.5) {
  const pontos = Math.max(0, (fgAlvo - fgAtual) * 1000);
  const melKg = (pontos * litros) / PONTOS_POR_KG_POR_LITRO;

  // Sorbato de potássio: 200 ppm é a dose de trabalho usual.
  const sorbatoG = (litros * 200) / 1000;

  // Metabissulfito de potássio: precisa de ~50 ppm de SO2 MOLECULAR efetivo.
  // A fração molecular cai muito conforme o pH sobe, então a dose depende do pH.
  // Tabela de SO2 livre necessário para 0,8 ppm molecular:
  const tabelaSO2 = { 3.0: 13, 3.1: 16, 3.2: 21, 3.3: 26, 3.4: 32, 3.5: 40,
                      3.6: 50, 3.7: 63, 3.8: 79, 3.9: 99, 4.0: 124 };
  const chave = Math.min(4.0, Math.max(3.0, Math.round(pH * 10) / 10));
  const so2Livre = tabelaSO2[chave] ?? 40;
  // K-meta tem ~57% de SO2 disponível
  const metaG = +((so2Livre * litros) / 1000 / 0.57).toFixed(2);

  return {
    melKg: +melKg.toFixed(3),
    sorbatoG: +sorbatoG.toFixed(2),
    metaG,
    so2Livre,
    aviso: pontos > 0 && (sorbatoG === 0 || metaG === 0)
      ? 'Não adoce sem estabilizar.' : null,
  };
}

/* --------------------------------------------------------- ESCALONAMENTO */

/** Reescala uma receita mantendo as proporções. */
export function escalonar(itens, volumeOriginal, volumeNovo) {
  const f = volumeNovo / volumeOriginal;
  return itens.map((i) => ({ ...i, qtd: +(i.qtd * f).toFixed(3) }));
}

/* ----------------------------------------------------------- PRECIFICAÇÃO */

/**
 * Markup divisor — a fórmula correta quando há percentuais sobre o PREÇO
 * (imposto, comissão, margem), e não sobre o custo.
 *
 *   preço = custo / (1 − (imposto + comissão + margem)/100)
 *
 * O erro clássico é "custo × 3": ignora que imposto e comissão incidem sobre
 * o preço final, e a margem real acaba metade da esperada.
 */
export function precificar({ custoUnitario, impostoPct = 0, comissaoPct = 0, margemPct = 30, perdaPct = 8 }) {
  const custoComPerda = custoUnitario / (1 - perdaPct / 100);
  const soma = impostoPct + comissaoPct + margemPct;
  if (soma >= 100) {
    return { erro: 'A soma de imposto + comissão + margem precisa ser menor que 100%.' };
  }
  const preco = custoComPerda / (1 - soma / 100);
  const imposto = preco * (impostoPct / 100);
  const comissao = preco * (comissaoPct / 100);
  const lucro = preco - custoComPerda - imposto - comissao;
  return {
    custoComPerda: +custoComPerda.toFixed(2),
    preco: +preco.toFixed(2),
    imposto: +imposto.toFixed(2),
    comissao: +comissao.toFixed(2),
    lucro: +lucro.toFixed(2),
    margemReal: +((lucro / preco) * 100).toFixed(1),
    markup: +(preco / custoUnitario).toFixed(2),
  };
}

/** Ponto de equilíbrio: garrafas por mês para cobrir o custo fixo. */
export function pontoEquilibrio(custoFixoMensal, lucroPorGarrafa) {
  if (lucroPorGarrafa <= 0) return { erro: 'Com lucro zero ou negativo não existe ponto de equilíbrio.' };
  const un = Math.ceil(custoFixoMensal / lucroPorGarrafa);
  return { unidades: un, litros: +(un * 0.75).toFixed(1) };
}

/* ------------------------------------------------------------ FICHA TÉCNICA */

/** Custo por garrafa a partir dos insumos de um lote. */
export function fichaTecnica({ litros, melKg, precoMelKg, levedura = 0, nutriente = 0,
                               garrafaUn = 0, rolhaUn = 0, rotuloUn = 0, capsulaUn = 0,
                               outros = 0, volumeGarrafaMl = 750, perdaPct = 8 }) {
  const garrafasBrutas = (litros * 1000) / volumeGarrafaMl;
  const garrafas = Math.floor(garrafasBrutas * (1 - perdaPct / 100));
  const custoLote = melKg * precoMelKg + levedura + nutriente + outros;
  const custoEmbalagemUn = garrafaUn + rolhaUn + rotuloUn + capsulaUn;
  const custoUn = garrafas > 0 ? custoLote / garrafas + custoEmbalagemUn : 0;
  return {
    garrafas,
    custoLote: +custoLote.toFixed(2),
    custoEmbalagemUn: +custoEmbalagemUn.toFixed(2),
    custoUnitario: +custoUn.toFixed(2),
    custoTotal: +(custoLote + custoEmbalagemUn * garrafas).toFixed(2),
  };
}
