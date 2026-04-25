export type Unidade = 'g' | 'kg' | 'ml' | 'l' | 'unidade';

export interface Ingrediente {
  id: string;
  tacoId?: number;
  nome: string;
  unidade: Unidade;
  preco: number;
  dadosNutricionais: DadosNutricionais;
  createdAt?: Date;
}

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  planoAtual?: 'gratis' | 'profissional' | 'empresarial';
  empresa?: {
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    inscricao_estadual: string;
    telefone: string;
  };
}

export interface DadosNutricionais {
  calorias: number; // por 100g
  proteinas: number; // por 100g
  carboidratos: number; // por 100g
  gorduras: number; // por 100g
}

export interface IngredienteReceita {
  tacoId: number;
  nome: string;
  quantidade: number; // em gramas
  preco: number; // preço por 100g (R$)
}

export interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  ingredientes: IngredienteReceita[];
  porcoes: number;
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
  margemLucro: number; // percentual
  dadosNutricionaisTotais: DadosNutricionais;
  dadosNutricionaisPorPorcao: DadosNutricionais;
  createdAt: Date;
}

export interface RotuloNutricional {
  receitaId: string;
  porcao: string;
  valorEnergetico: number;
  carboidratos: number;
  proteinas: number;
  gordurasTotais: number;
  sodio: number;
  percentualVD: {
    valorEnergetico: number;
    carboidratos: number;
    proteinas: number;
    gordurasTotais: number;
    sodio: number;
  };
}