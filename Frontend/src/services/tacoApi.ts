const BASE_URL = 'https://taco.codivatech.com/api';
const API_KEY = import.meta.env.VITE_TACO_API_KEY as string;

function headers(): HeadersInit {
  return {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  };
}

export interface TacoFood {
  id: number;
  description: string;
  baseQty: number;
  kcal: number | null;
  protein: number | null;
  carbohydrate: number | null;
  lipids: number | null;
  dietaryFiber: number | null;
  sodium: number | null;
  calcium: number | null;
  iron: number | null;
  vitaminC: number | null;
  category: { id: number; name: string };
}

interface ListFoodsResponse {
  meta: { page: number; per_page: number; total: number; total_pages: number };
  results: TacoFood[];
}

export async function buscarAlimentos(query: string): Promise<TacoFood[]> {
  if (!query || query.length < 2) return [];

  const url = `${BASE_URL}/foods/?q=${encodeURIComponent(query)}&limit=8`;
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error(`Erro ao buscar alimentos: ${response.status}`);
  }

  const data: ListFoodsResponse = await response.json();
  return data.results;
}

export async function obterAlimentoPorId(id: number): Promise<TacoFood | null> {
  const url = `${BASE_URL}/foods/${id}`;
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error(`Erro ao obter alimento: ${response.status}`);
  }

  const data: { food: { id: number; description: string; category: string; macros: { kcal: number | null; protein: number | null; carbohydrate: number | null; lipids: number | null; fiber: number | null } } } = await response.json();

  return {
    id: data.food.id,
    description: data.food.description,
    baseQty: 100,
    kcal: data.food.macros.kcal,
    protein: data.food.macros.protein,
    carbohydrate: data.food.macros.carbohydrate,
    lipids: data.food.macros.lipids,
    dietaryFiber: data.food.macros.fiber,
    sodium: null,
    calcium: null,
    iron: null,
    vitaminC: null,
    category: { id: 0, name: data.food.category ?? '' },
  };
}

export interface CalcularRefeicaoItem {
  id: number;
  grams: number;
}

export interface CalcularRefeicaoResponse {
  items: { food: string; grams: number; kcal: number }[];
  totals: {
    grams: number;
    macros: { kcal: number; protein: number; carbohydrate: number; lipids: number; fiber: number };
    micros: { sodium: number; iron: number; calcium: number; vitaminC: number };
  };
}

export async function calcularRefeicao(items: CalcularRefeicaoItem[]): Promise<CalcularRefeicaoResponse> {
  const url = `${BASE_URL}/foods/calculate-meal`;
  const response = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao calcular refeição: ${response.status}`);
  }

  return response.json();
}
