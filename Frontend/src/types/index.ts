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
  carboidratos: number; // por 100g
  acucares_totais: number; // por 100g
  acucares_adicionados: number; // por 100g
  proteinas: number; // por 100g
  gorduras: number; // por 100g (Totais)
  gorduras_saturadas: number; // por 100g
  gorduras_trans: number; // por 100g
  fibras: number; // por 100g
  sodio: number; // por 100g (mg)
  vitaminas: number; // por 100g (g)
  minerais: number; // por 100g (g)
}

export interface IngredienteReceita {
  tacoId: number;
  nome: string;
  quantidade: number; // quantidade na unidade escolhida
  preco: number; // preço da unidade inteira (ex: por kg, por l, ou por 100g se g)
  unidade?: Unidade;
}

export interface Receita {
  id?: string;
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

export interface ReceitaRefeicao {
  receitaId: string;
  nome: string;
  porcoesUtilizadas: number;
  custoPorPorcao: number;
  dadosNutricionaisPorPorcao: DadosNutricionais;
}

export interface Refeicao {
  id: string;
  nome: string;
  descricao?: string;
  receitas: ReceitaRefeicao[];
  custoTotal: number;
  dadosNutricionaisTotais: DadosNutricionais;
  createdAt: string; // ISO string
}