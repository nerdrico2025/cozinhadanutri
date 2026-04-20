import { IngredienteReceita, DadosNutricionais } from '../types';

interface CustosReceita {
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
}

export function calcularCustosReceita(
  ingredientes: IngredienteReceita[],
  porcoes: number,
  margemLucro: number
): CustosReceita {
  const custoTotal = ingredientes.reduce((acc, i) => acc + (i.preco ?? 0), 0);
  const custoPorPorcao = porcoes > 0 ? custoTotal / porcoes : 0;
  const precoSugerido = custoPorPorcao * (1 + margemLucro / 100);
  return { custoTotal, custoPorPorcao, precoSugerido };
}

export function calcularDadosNutricionaisPorPorcao(
  totais: DadosNutricionais,
  porcoes: number
): DadosNutricionais {
  if (porcoes <= 0) return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
  return {
    calorias: totais.calorias / porcoes,
    proteinas: totais.proteinas / porcoes,
    carboidratos: totais.carboidratos / porcoes,
    gorduras: totais.gorduras / porcoes,
  };
}
