import { IngredienteReceita, DadosNutricionais } from '../types';

interface CustosReceita {
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
}

export function calcularCustosReceita(
  ingredientes: { quantidade: number; preco: number; unidade?: string; baseUnidade?: string }[],
  porcoes: number,
  margemLucro: number
): CustosReceita & { margemLucroReal: number } {
  // preco é por 100g (ou 100ml) quando a baseUnidade é g ou ml.
  // preco é por 1kg, 1l ou 1 unidade quando a baseUnidade é kg, l ou unidade.
  const custoTotal = ingredientes.reduce((acc, i) => {
    const bUnidade = i.baseUnidade || i.unidade || 'g';
    const rUnidade = i.unidade || 'g';
    
    let qtdConvertida = i.quantidade;
    if (bUnidade === 'l' && rUnidade === 'ml') {
      qtdConvertida = i.quantidade / 1000;
    } else if (bUnidade === 'ml' && rUnidade === 'l') {
      qtdConvertida = i.quantidade * 1000;
    } else if (bUnidade === 'kg' && rUnidade === 'g') {
      qtdConvertida = i.quantidade / 1000;
    } else if (bUnidade === 'g' && rUnidade === 'kg') {
      qtdConvertida = i.quantidade * 1000;
    }

    const fator = (bUnidade === 'kg' || bUnidade === 'l' || bUnidade === 'unidade') 
      ? qtdConvertida 
      : (qtdConvertida / 100);
      
    return acc + fator * (i.preco ?? 0);
  }, 0);
  const custoPorPorcao = porcoes > 0 ? custoTotal / porcoes : 0;
  const precoSugerido = custoPorPorcao * (1 + margemLucro / 100);
  const margemLucroReal = precoSugerido - custoPorPorcao;
  
  return { custoTotal, custoPorPorcao, precoSugerido, margemLucroReal };
}

export function calcularNutrientesTotais(
  ingredientes: { quantidade: number; dadosNutricionais: DadosNutricionais; unidade?: string; baseUnidade?: string }[]
): DadosNutricionais {
  const inicial: DadosNutricionais = {
    calorias: 0,
    carboidratos: 0,
    acucares_totais: 0,
    acucares_adicionados: 0,
    proteinas: 0,
    gorduras: 0,
    gorduras_saturadas: 0,
    gorduras_trans: 0,
    fibras: 0,
    sodio: 0,
    vitaminas: 0,
    minerais: 0,
  };

  return ingredientes.reduce((acc, ing) => {
    const rUnidade = ing.unidade || 'g';
    
    let qtdParaCalculo = ing.quantidade;
    if (rUnidade === 'kg' || rUnidade === 'l') {
      qtdParaCalculo = ing.quantidade * 1000;
    }

    let fator = qtdParaCalculo / 100;
    
    if (rUnidade === 'unidade') {
      fator = ing.quantidade;
    }

    const result = { ...acc };
    
    Object.keys(result).forEach((key) => {
      const k = key as keyof DadosNutricionais;
      const valorNutriente = ing.dadosNutricionais[k] ?? 0;
      result[k] = (result[k] as number) + (valorNutriente * fator);
    });
    
    return result;
  }, inicial);
}

export function calcularDadosNutricionaisPorPorcao(
  totais: DadosNutricionais,
  porcoes: number
): DadosNutricionais {
  if (porcoes <= 0) return { ...totais };
  
  const result = { ...totais };
  Object.keys(result).forEach((key) => {
    const k = key as keyof DadosNutricionais;
    if (typeof result[k] === 'number') {
      result[k] = (result[k] as number) / porcoes;
    }
  });
  
  return result;
}
