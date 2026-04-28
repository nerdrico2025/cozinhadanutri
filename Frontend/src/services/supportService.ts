
export interface SupportConfig {
  email: string;
  whatsapp: string;
  horarios: {
    segSex: string;
    sabado: string;
    domingoFeriado: string;
  };
  instagram: string;
  prazos: {
    geral: string;
    tecnico: string;
    especial: string;
  };
}

export interface FAQEntry {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: 'geral' | 'tecnico' | 'plano' | 'outros';
}

const DEFAULT_CONFIG: SupportConfig = {
  email: 'suporte@cozinhadanutri.com.br',
  whatsapp: '5521999240792',
  horarios: {
    segSex: '08:00 – 18:00',
    sabado: '09:00 – 13:00',
    domingoFeriado: 'Sem atendimento'
  },
  instagram: 'cozinhadanutri',
  prazos: {
    geral: 'Até 24 horas úteis',
    tecnico: 'Até 48 horas úteis',
    especial: 'Até 5 dias úteis'
  }
};

const DEFAULT_FAQ: FAQEntry[] = [
  { id: '1', categoria: 'geral', pergunta: 'Como funciona o cálculo nutricional?', resposta: 'O cálculo é feito com base na tabela TACO, considerando a composição centesimal de cada ingrediente e o rendimento da sua receita.' },
  { id: '2', categoria: 'tecnico', pergunta: 'Posso exportar em PDF?', resposta: 'Sim, todos os rótulos gerados podem ser exportados em PDF seguindo as normas da ANVISA (RDC 429/2020).' },
];

const STORAGE_KEY_CONFIG = 'cozinha_support_config';
const STORAGE_KEY_FAQ    = 'cozinha_faq_data';

export const getSupportConfig = (): SupportConfig => {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
};

export const saveSupportConfig = (config: SupportConfig) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('support_updated'));
};

export const getFAQ = (): FAQEntry[] => {
  const saved = localStorage.getItem(STORAGE_KEY_FAQ);
  return saved ? JSON.parse(saved) : DEFAULT_FAQ;
};

export const saveFAQ = (faq: FAQEntry[]) => {
  localStorage.setItem(STORAGE_KEY_FAQ, JSON.stringify(faq));
  window.dispatchEvent(new CustomEvent('faq_updated'));
};
