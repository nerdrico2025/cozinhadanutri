import { IngredienteReceita, DadosNutricionais } from '../types';

interface CustosReceita {
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
}

export function calcularCustosReceita(
  ingredientes: { quantidade: number; preco: number }[],
  porcoes: number,
  margemLucro: number
): CustosReceita & { margemLucroReal: number } {
  // preco é por 100g ou unidade. quantidade é em gramas ou unidade.
  const custoTotal = ingredientes.reduce((acc, i) => acc + (i.quantidade / 100) * (i.preco ?? 0), 0);
  const custoPorPorcao = porcoes > 0 ? custoTotal / porcoes : 0;
  const precoSugerido = custoPorPorcao * (1 + margemLucro / 100);
  const margemLucroReal = precoSugerido - custoPorPorcao;
  
  return { custoTotal, custoPorPorcao, precoSugerido, margemLucroReal };
}

export function calcularNutrientesTotais(
  ingredientes: { quantidade: number; dadosNutricionais: DadosNutricionais }[]
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
    const fator = ing.quantidade / 100;
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
