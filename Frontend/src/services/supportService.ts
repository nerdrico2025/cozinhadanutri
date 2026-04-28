
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
  {
    id: '1',
    categoria: 'Nutrição',
    pergunta: 'O que é a tabela TACO?',
    resposta: 'A Tabela Brasileira de Composição de Alimentos (TACO) é um banco de dados nutricional desenvolvido pela Unicamp com valores de referência para alimentos consumidos no Brasil. O sistema usa esta tabela para calcular automaticamente os dados nutricionais das suas receitas.',
  },
  {
    id: '2',
    categoria: 'Nutrição',
    pergunta: 'Como uso a tabela TACO para cadastrar ingredientes?',
    resposta: 'Ao adicionar um ingrediente à receita, basta digitar o nome do alimento no campo de busca. O sistema pesquisa automaticamente na tabela TACO e exibe os resultados com os respectivos valores nutricionais. Selecione o alimento desejado e informe a quantidade em gramas.',
  },
  {
    id: '3',
    categoria: 'Nutrição',
    pergunta: 'E se o ingrediente que preciso não estiver na tabela TACO?',
    resposta: 'Nos planos pagos é possível cadastrar ingredientes personalizados informando manualmente os valores nutricionais. No plano Grátis, o sistema utiliza apenas os alimentos disponíveis na tabela TACO.',
  },
  {
    id: '4',
    categoria: 'Nutrição',
    pergunta: 'Os valores nutricionais são calculados por porção ou por 100g?',
    resposta: 'Os valores são calculados com base nas quantidades de cada ingrediente informadas na receita. O sistema distribui os nutrientes proporcionalmente ao número de porções que você definir, exibindo os valores por porção e por 100g no rótulo.',
  },

  // Rótulo
  {
    id: '5',
    categoria: 'Rótulo',
    pergunta: 'O rótulo nutricional gerado segue as normas da ANVISA?',
    resposta: 'Sim. O rótulo é gerado seguindo as diretrizes da Resolução RDC nº 429/2020 da ANVISA. Os valores diários de referência (%VD) são calculados com base em uma dieta de 2000 kcal. Para uso comercial, recomenda-se validação com nutricionista.',
  },
  {
    id: '6',
    categoria: 'Rótulo',
    pergunta: 'Como gerar o rótulo nutricional de uma receita?',
    resposta: 'Após cadastrar todos os ingredientes e definir o número de porções da receita, acesse a tela da receita e clique no botão "Gerar Rótulo". O sistema calculará automaticamente todos os valores nutricionais e exibirá o rótulo no padrão ANVISA pronto para exportação.',
  },
  {
    id: '7',
    categoria: 'Rótulo',
    pergunta: 'Posso exportar o rótulo em PDF?',
    resposta: 'Sim, nos planos Profissional e Empresarial você pode exportar o rótulo gerado em formato PDF com alta resolução, pronto para impressão e uso em embalagens.',
  },
  {
    id: '8',
    categoria: 'Rótulo',
    pergunta: 'O rótulo gerado pode ser usado diretamente no produto?',
    resposta: 'O rótulo gerado pelo sistema é uma ferramenta de apoio técnico. Para uso comercial oficial em embalagens, recomendamos a validação por um nutricionista responsável técnico, conforme exigido pela legislação brasileira.',
  },
  {
    id: '9',
    categoria: 'Rótulo',
    pergunta: 'Quais informações aparecem no rótulo gerado?',
    resposta: 'O rótulo inclui: valor energético (kcal e kJ), carboidratos, açúcares, gorduras totais, gorduras saturadas, gorduras trans, fibra alimentar, proteínas e sódio — todos com o percentual do valor diário (%VD) — conforme a RDC nº 429/2020.',
  },

  // Receitas
  {
    id: '10',
    categoria: 'Receitas',
    pergunta: 'Quantos cadastros de receita são permitidos no plano Grátis?',
    resposta: 'No plano Grátis você pode cadastrar até 5 receitas. Para receitas ilimitadas, faça upgrade para o plano Profissional ou Empresarial.',
  },
  {
    id: '11',
    categoria: 'Receitas',
    pergunta: 'Como cadastrar uma nova receita?',
    resposta: 'No menu principal, clique em "Receitas" e depois em "Nova Receita". Informe o nome, descrição, número de porções e adicione os ingredientes buscando pela tabela TACO. O sistema calculará os valores nutricionais em tempo real.',
  },
  {
    id: '12',
    categoria: 'Receitas',
    pergunta: 'Posso editar uma receita já cadastrada?',
    resposta: 'Sim. Acesse a lista de receitas, localize a receita desejada e clique em "Editar". Você pode adicionar, remover ou alterar ingredientes, quantidades, nome e número de porções. Após salvar, o rótulo e os custos são recalculados automaticamente.',
  },
  {
    id: '13',
    categoria: 'Receitas',
    pergunta: 'Como excluir uma receita?',
    resposta: 'Na lista de receitas, clique no ícone de lixeira ou acesse a receita e utilize a opção "Excluir". A ação é permanente — receitas excluídas não podem ser recuperadas, portanto, confirme antes de prosseguir.',
  },
  {
    id: '14',
    categoria: 'Receitas',
    pergunta: 'Posso duplicar uma receita existente?',
    resposta: 'Sim, nos planos pagos é possível duplicar uma receita para usar como base para uma variação sem precisar recadastrá-la do zero. O botão "Duplicar" aparece nas opções da receita.',
  },

  // Precificação
  {
    id: '15',
    categoria: 'Precificação',
    pergunta: 'Como é calculado o preço sugerido?',
    resposta: 'O preço sugerido é calculado somando o custo de todos os ingredientes da receita e aplicando a margem de lucro que você definiu. A margem padrão é de 200%, ou seja, o preço de venda é o triplo do custo total.',
  },
  {
    id: '16',
    categoria: 'Precificação',
    pergunta: 'Posso personalizar a margem de lucro?',
    resposta: 'Sim. Em cada receita você pode ajustar a margem de lucro desejada. O sistema recalcula instantaneamente o preço sugerido de venda com base na margem informada e no custo total dos ingredientes.',
  },
  {
    id: '17',
    categoria: 'Precificação',
    pergunta: 'Como atualizo o preço dos ingredientes?',
    resposta: 'Acesse a lista de ingredientes cadastrados e edite o preço por 100g de cada item. O sistema recalculará automaticamente os custos de todas as receitas que utilizam aquele ingrediente.',
  },

  // Conta
  {
    id: '18',
    categoria: 'Conta',
    pergunta: 'Preciso criar uma conta para usar o sistema?',
    resposta: 'É possível explorar o sistema sem conta, mas para salvar receitas e ingredientes recomendamos criar uma conta. O plano Grátis já permite cadastrar até 5 receitas sem custo.',
  },
  {
    id: '19',
    categoria: 'Conta',
    pergunta: 'Como alterar meus dados cadastrais?',
    resposta: 'Após fazer login, clique no seu nome no canto superior direito e acesse "Meu Perfil". Lá você pode atualizar nome, e-mail, telefone e demais informações da conta.',
  },
  {
    id: '20',
    categoria: 'Conta',
    pergunta: 'Como alterar minha senha?',
    resposta: 'Acesse "Meu Perfil" após fazer login e clique em "Alterar senha". Informe a senha atual e a nova senha. Também é possível redefinir a senha pela opção "Esqueci minha senha" na tela de login.',
  },
  {
    id: '21',
    categoria: 'Conta',
    pergunta: 'Posso usar o sistema em mais de um dispositivo?',
    resposta: 'Nos planos pagos, os dados ficam em nuvem e você pode acessar de qualquer dispositivo com internet. No plano Grátis, os dados são salvos localmente no navegador do dispositivo utilizado.',
  },

  // Dados
  {
    id: '22',
    categoria: 'Dados',
    pergunta: 'Os dados de receitas ficam salvos onde?',
    resposta: 'No plano Grátis, os dados são salvos localmente no navegador (localStorage). Nos planos pagos, os dados ficam armazenados em nuvem e acessíveis de qualquer dispositivo.',
  },
  {
    id: '23',
    categoria: 'Dados',
    pergunta: 'Meus dados ficam seguros?',
    resposta: 'Sim. Todos os dados são protegidos conforme a Lei Geral de Proteção de Dados (LGPD). As informações trafegam por conexões criptografadas (HTTPS) e não são compartilhadas com terceiros sem seu consentimento.',
  },
  {
    id: '24',
    categoria: 'Dados',
    pergunta: 'Posso exportar minhas receitas?',
    resposta: 'Nos planos pagos é possível exportar receitas em PDF, incluindo ficha técnica completa com ingredientes, quantidades, custos e rótulo nutricional. O plano Empresarial também oferece exportação via API.',
  },

  // Assinatura
  {
    id: '25',
    categoria: 'Assinatura',
    pergunta: 'Posso cancelar minha assinatura a qualquer momento?',
    resposta: 'Sim, você pode cancelar sua assinatura a qualquer momento sem multas. O acesso ao plano pago permanece ativo até o fim do período já pago.',
  },
  {
    id: '26',
    categoria: 'Assinatura',
    pergunta: 'O que acontece com minhas receitas se eu cancelar?',
    resposta: 'Ao cancelar, sua conta migra automaticamente para o plano Grátis. As receitas que ultrapassarem o limite de 5 ficam salvas mas não podem ser editadas até que você faça um novo upgrade.',
  },
  {
    id: '27',
    categoria: 'Assinatura',
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta: 'Aceitamos cartão de crédito (em até 12x) e Pix (com 5% de desconto). O processamento é feito com segurança pelo Mercado Pago.',
  },
  {
    id: '28',
    categoria: 'Assinatura',
    pergunta: 'Existe período de teste gratuito nos planos pagos?',
    resposta: 'O plano Grátis já funciona como um período de avaliação permanente, permitindo explorar as funcionalidades básicas sem limite de tempo. Não há trial separado para os planos pagos.',
  },
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
