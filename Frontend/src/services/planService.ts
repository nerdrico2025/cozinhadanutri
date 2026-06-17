export type Plano = 'Grátis' | 'Profissional';

export interface PlanData {
  mensal: number;
  anual: number;
  recursos: string[];
}

const DEFAULT_PLANS: Record<Plano, PlanData> = {
  'Grátis': {
    mensal: 0,
    anual: 0,
    recursos: [
      'Até 3 receitas',
      'Até 10 ingredientes',
      'Busca na tabela TACO',
      'Cálculo nutricional básico',
      '3 - Rótulos nutricional ANVISA',
    ]
  },
  'Profissional': {
    mensal: 49,
    anual: 39,
    recursos: [
      'Receitas ilimitadas',
      'Ingredientes ilimitados',
      'Precificação avançada',
      'Exportar rótulos em PDF',
      'Suporte prioritário',
    ]
  }
};

export const getPlans = (): Record<Plano, PlanData> => {
  const saved = localStorage.getItem('plans_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_PLANS;
    }
  }
  return DEFAULT_PLANS;
};

export const savePlans = (plans: Record<Plano, PlanData>) => {
  localStorage.setItem('plans_config', JSON.stringify(plans));
  // Disparar evento para outros componentes (como Plans.tsx) saberem que mudou
  window.dispatchEvent(new Event('plans_updated'));
};

import api from './api';

export interface EmpresaPlanoResponse {
  id: number;
  razao_social: string;
  plano: number | null;
  plano_ativo: boolean;
}

export const MAP_PLANO_FRONTEND_TO_DB: Record<string, number> = {
  'gratis': 1,
  'iniciante': 1,
  'profissional': 2,
  'basico': 2
};

export const obterMeuPlano = async (): Promise<EmpresaPlanoResponse> => {
  const response = await api.get('/api/meu-plano/');
  return response.data;
};

export const trocarPlano = async (planoId: number): Promise<{ message: string; plano: string }> => {
  const response = await api.patch('/api/trocar-plano/', { plano: planoId });
  return response.data;
};

