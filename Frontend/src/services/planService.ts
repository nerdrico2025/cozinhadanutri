export type Plano = 'Grátis' | 'Profissional' | 'Empresarial';

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
  },
  'Empresarial': {
    mensal: 99,
    anual: 79,
    recursos: [
      'Tudo do Profissional',
      'Múltiplos usuários',
      'Relatórios gerenciais',
      'API de integração',
      'Onboarding dedicado',
      'Histórico de receitas',
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
