import { IngredienteReceita, DadosNutricionais } from '../types';

interface CustosReceita {
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
}

export function calcularCustosReceita(
  ingredientes: { quantidade: number; preco: number; unidade?: string }[],
  porcoes: number,
  margemLucro: number
): CustosReceita & { margemLucroReal: number } {
  // preco é por 100g (ou 100ml) quando a unidade é g ou ml.
  // preco é por 1kg, 1l ou 1 unidade quando a unidade é kg, l ou unidade.
  const custoTotal = ingredientes.reduce((acc, i) => {
    const fator = (i.unidade === 'kg' || i.unidade === 'l' || i.unidade === 'unidade') 
      ? i.quantidade 
      : (i.quantidade / 100);
    return acc + fator * (i.preco ?? 0);
  }, 0);
  const custoPorPorcao = porcoes > 0 ? custoTotal / porcoes : 0;
  const precoSugerido = custoPorPorcao * (1 + margemLucro / 100);
  const margemLucroReal = precoSugerido - custoPorPorcao;
  
  return { custoTotal, custoPorPorcao, precoSugerido, margemLucroReal };
}

export function calcularNutrientesTotais(
  ingredientes: { quantidade: number; dadosNutricionais: DadosNutricionais; unidade?: string }[]
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
    let fator = ing.quantidade / 100;
    if (ing.unidade === 'kg' || ing.unidade === 'l') {
      fator = ing.quantidade * 10;
    } else if (ing.unidade === 'unidade') {
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
