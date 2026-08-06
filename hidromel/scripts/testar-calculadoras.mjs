import * as C from '../assets/js/calculadoras.js';
let ok=0, fail=0;
const t=(nome, real, esp, tol)=>{ const p=Math.abs(real-esp)<=tol;
  console.log((p?'✓':'✗')+' '+nome+'  → '+(+real.toFixed(4))+' (esperado ~'+esp+' ±'+tol+')'); p?ok++:fail++; };

// Receitas de referência
t('OG Joe\'s Ancient Orange (1,36kg / 3,785L)', C.densidadeOriginal(1.36,3.785), 1.105, 0.004);
t('OG show mead (1,134kg / 3,785L)',            C.densidadeOriginal(1.134,3.785), 1.087, 0.004);
t('OG lote 20L com 6kg',                        C.densidadeOriginal(6,20), 1.0876, 0.002);
t('ABV show mead 1.087→1.005',                  C.abv(1.087,1.005), 11.5, 0.6);
t('ABV baixo usa linear 1.040→1.000',           C.abv(1.040,1.000), 5.25, 0.3);
t('Atenuação 1.088→1.005',                      C.atenuacao(1.088,1.005), 94.3, 1);
t('melParaOG inverte densidadeOriginal',        C.melParaOG(C.densidadeOriginal(6,20),20), 6, 0.01);

// TOSNA: 4 g por galão → 20 L = 5,285 galões → 21,1 g
t('TOSNA total 20L média', C.tosna(20).total, 21.1, 0.3);
t('TOSNA dose por adição', C.tosna(20).dose, 5.28, 0.1);
console.log('  cronograma:', C.tosna(20).cronograma.length, 'adições');

// Backsweetening: 20L de 0.998 para 1.020 = 22 pontos
t('Backsweetening mel (20L, +22 pts)', C.backsweetening(20,0.998,1.020).melKg, 22*20/292, 0.02);
t('Sorbato 200ppm em 20L',             C.backsweetening(20,0.998,1.020).sorbatoG, 4, 0.01);
const b35=C.backsweetening(20,0.998,1.020,3.5), b38=C.backsweetening(20,0.998,1.020,3.8);
console.log((b38.metaG>b35.metaG?'✓':'✗')+' metabissulfito sobe com o pH: '+b35.metaG+'g (pH3.5) → '+b38.metaG+'g (pH3.8)');
b38.metaG>b35.metaG?ok++:fail++;

// Precificação — markup divisor
const p=C.precificar({custoUnitario:20, impostoPct:12, comissaoPct:0, margemPct:35, perdaPct:8});
// custoComPerda = 20/0.92 = 21.739 ; preço = 21.739/(1-0.47) = 41.017
t('Preço markup divisor', p.preco, 41.02, 0.05);
t('Margem real bate com a pedida', p.margemReal, 35, 0.6);
const soma = p.custoComPerda + p.imposto + p.comissao + p.lucro;
t('Preço = custo+imposto+comissão+lucro', soma, p.preco, 0.02);
const erro=C.precificar({custoUnitario:20, impostoPct:50, margemPct:60});
console.log((erro.erro?'✓':'✗')+' recusa soma ≥100%: '+(erro.erro||'NÃO RECUSOU')); erro.erro?ok++:fail++;

// Ficha técnica
const f=C.fichaTecnica({litros:20, melKg:6, precoMelKg:32, levedura:28, outros:15,
  garrafaUn:4.5, rolhaUn:1.2, rotuloUn:1.8, capsulaUn:0.6, perdaPct:8});
// 20L/0.75 = 26.67 garrafas brutas ; ×0.92 = 24.5 → 24
t('Garrafas do lote 20L', f.garrafas, 24, 0);
t('Custo embalagem/un', f.custoEmbalagemUn, 8.1, 0.01);
// custoLote = 6*32+28+15 = 235 ; /24 = 9.79 + 8.1 = 17.89
t('Custo por garrafa', f.custoUnitario, 17.89, 0.02);

// Ponto de equilíbrio
t('Ponto de equilíbrio', C.pontoEquilibrio(2500,38).unidades, 66, 0);
console.log((C.pontoEquilibrio(2500,0).erro?'✓':'✗')+' recusa lucro zero'); C.pontoEquilibrio(2500,0).erro?ok++:fail++;

// Escalonamento
const esc=C.escalonar([{nome:'mel',qtd:6},{nome:'levedura',qtd:5}],20,60);
t('Escalonar 20L→60L (mel)', esc[0].qtd, 18, 0.001);

console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail?1:0);
