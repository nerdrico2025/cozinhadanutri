import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login' | 'register' | 'planos' | 'faq' | 'suporte' | 'termos' | 'pagamento' | 'adm';

interface FAQProps {
  onNavegar?: (tela: TelaAtiva) => void;
}

const faqs = [
  // Tabela TACO
  {
    categoria: 'Nutrição',
    pergunta: 'O que é a tabela TACO?',
    resposta: 'A Tabela Brasileira de Composição de Alimentos (TACO) é um banco de dados nutricional desenvolvido pela Unicamp com valores de referência para alimentos consumidos no Brasil. O sistema usa esta tabela para calcular automaticamente os dados nutricionais das suas receitas.',
  },
  {
    categoria: 'Nutrição',
    pergunta: 'Como uso a tabela TACO para cadastrar ingredientes?',
    resposta: 'Ao adicionar um ingrediente à receita, basta digitar o nome do alimento no campo de busca. O sistema pesquisa automaticamente na tabela TACO e exibe os resultados com os respectivos valores nutricionais. Selecione o alimento desejado e informe a quantidade em gramas.',
  },
  {
    categoria: 'Nutrição',
    pergunta: 'E se o ingrediente que preciso não estiver na tabela TACO?',
    resposta: 'Nos planos pagos é possível cadastrar ingredientes personalizados informando manualmente os valores nutricionais. No plano Grátis, o sistema utiliza apenas os alimentos disponíveis na tabela TACO.',
  },
  {
    categoria: 'Nutrição',
    pergunta: 'Os valores nutricionais são calculados por porção ou por 100g?',
    resposta: 'Os valores são calculados com base nas quantidades de cada ingrediente informadas na receita. O sistema distribui os nutrientes proporcionalmente ao número de porções que você definir, exibindo os valores por porção e por 100g no rótulo.',
  },

  // Rótulo
  {
    categoria: 'Rótulo',
    pergunta: 'O rótulo nutricional gerado segue as normas da ANVISA?',
    resposta: 'Sim. O rótulo é gerado seguindo as diretrizes da Resolução RDC nº 429/2020 da ANVISA. Os valores diários de referência (%VD) são calculados com base em uma dieta de 2000 kcal. Para uso comercial, recomenda-se validação com nutricionista.',
  },
  {
    categoria: 'Rótulo',
    pergunta: 'Como gerar o rótulo nutricional de uma receita?',
    resposta: 'Após cadastrar todos os ingredientes e definir o número de porções da receita, acesse a tela da receita e clique no botão "Gerar Rótulo". O sistema calculará automaticamente todos os valores nutricionais e exibirá o rótulo no padrão ANVISA pronto para exportação.',
  },
  {
    categoria: 'Rótulo',
    pergunta: 'Posso exportar o rótulo em PDF?',
    resposta: 'Sim, nos planos Profissional e Empresarial você pode exportar o rótulo gerado em formato PDF com alta resolução, pronto para impressão e uso em embalagens.',
  },
  {
    categoria: 'Rótulo',
    pergunta: 'O rótulo gerado pode ser usado diretamente no produto?',
    resposta: 'O rótulo gerado pelo sistema é uma ferramenta de apoio técnico. Para uso comercial oficial em embalagens, recomendamos a validação por um nutricionista responsável técnico, conforme exigido pela legislação brasileira.',
  },
  {
    categoria: 'Rótulo',
    pergunta: 'Quais informações aparecem no rótulo gerado?',
    resposta: 'O rótulo inclui: valor energético (kcal e kJ), carboidratos, açúcares, gorduras totais, gorduras saturadas, gorduras trans, fibra alimentar, proteínas e sódio — todos com o percentual do valor diário (%VD) — conforme a RDC nº 429/2020.',
  },

  // Receitas
  {
    categoria: 'Receitas',
    pergunta: 'Quantos cadastros de receita são permitidos no plano Grátis?',
    resposta: 'No plano Grátis você pode cadastrar até 5 receitas. Para receitas ilimitadas, faça upgrade para o plano Profissional ou Empresarial.',
  },
  {
    categoria: 'Receitas',
    pergunta: 'Como cadastrar uma nova receita?',
    resposta: 'No menu principal, clique em "Receitas" e depois em "Nova Receita". Informe o nome, descrição, número de porções e adicione os ingredientes buscando pela tabela TACO. O sistema calculará os valores nutricionais em tempo real.',
  },
  {
    categoria: 'Receitas',
    pergunta: 'Posso editar uma receita já cadastrada?',
    resposta: 'Sim. Acesse a lista de receitas, localize a receita desejada e clique em "Editar". Você pode adicionar, remover ou alterar ingredientes, quantidades, nome e número de porções. Após salvar, o rótulo e os custos são recalculados automaticamente.',
  },
  {
    categoria: 'Receitas',
    pergunta: 'Como excluir uma receita?',
    resposta: 'Na lista de receitas, clique no ícone de lixeira ou acesse a receita e utilize a opção "Excluir". A ação é permanente — receitas excluídas não podem ser recuperadas, portanto, confirme antes de prosseguir.',
  },
  {
    categoria: 'Receitas',
    pergunta: 'Posso duplicar uma receita existente?',
    resposta: 'Sim, nos planos pagos é possível duplicar uma receita para usar como base para uma variação sem precisar recadastrá-la do zero. O botão "Duplicar" aparece nas opções da receita.',
  },

  // Precificação
  {
    categoria: 'Precificação',
    pergunta: 'Como é calculado o preço sugerido?',
    resposta: 'O preço sugerido é calculado somando o custo de todos os ingredientes da receita e aplicando a margem de lucro que você definiu. A margem padrão é de 200%, ou seja, o preço de venda é o triplo do custo total.',
  },
  {
    categoria: 'Precificação',
    pergunta: 'Posso personalizar a margem de lucro?',
    resposta: 'Sim. Em cada receita você pode ajustar a margem de lucro desejada. O sistema recalcula instantaneamente o preço sugerido de venda com base na margem informada e no custo total dos ingredientes.',
  },
  {
    categoria: 'Precificação',
    pergunta: 'Como atualizo o preço dos ingredientes?',
    resposta: 'Acesse a lista de ingredientes cadastrados e edite o preço por 100g de cada item. O sistema recalculará automaticamente os custos de todas as receitas que utilizam aquele ingrediente.',
  },

  // Conta
  {
    categoria: 'Conta',
    pergunta: 'Preciso criar uma conta para usar o sistema?',
    resposta: 'É possível explorar o sistema sem conta, mas para salvar receitas e ingredientes recomendamos criar uma conta. O plano Grátis já permite cadastrar até 5 receitas sem custo.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Como alterar meus dados cadastrais?',
    resposta: 'Após fazer login, clique no seu nome no canto superior direito e acesse "Meu Perfil". Lá você pode atualizar nome, e-mail, telefone e demais informações da conta.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Como alterar minha senha?',
    resposta: 'Acesse "Meu Perfil" após fazer login e clique em "Alterar senha". Informe a senha atual e a nova senha. Também é possível redefinir a senha pela opção "Esqueci minha senha" na tela de login.',
  },
  {
    categoria: 'Conta',
    pergunta: 'Posso usar o sistema em mais de um dispositivo?',
    resposta: 'Nos planos pagos, os dados ficam em nuvem e você pode acessar de qualquer dispositivo com internet. No plano Grátis, os dados são salvos localmente no navegador do dispositivo utilizado.',
  },

  // Dados
  {
    categoria: 'Dados',
    pergunta: 'Os dados de receitas ficam salvos onde?',
    resposta: 'No plano Grátis, os dados são salvos localmente no navegador (localStorage). Nos planos pagos, os dados ficam armazenados em nuvem e acessíveis de qualquer dispositivo.',
  },
  {
    categoria: 'Dados',
    pergunta: 'Meus dados ficam seguros?',
    resposta: 'Sim. Todos os dados são protegidos conforme a Lei Geral de Proteção de Dados (LGPD). As informações trafegam por conexões criptografadas (HTTPS) e não são compartilhadas com terceiros sem seu consentimento.',
  },
  {
    categoria: 'Dados',
    pergunta: 'Posso exportar minhas receitas?',
    resposta: 'Nos planos pagos é possível exportar receitas em PDF, incluindo ficha técnica completa com ingredientes, quantidades, custos e rótulo nutricional. O plano Empresarial também oferece exportação via API.',
  },

  // Assinatura
  {
    categoria: 'Assinatura',
    pergunta: 'Posso cancelar minha assinatura a qualquer momento?',
    resposta: 'Sim, você pode cancelar sua assinatura a qualquer momento sem multas. O acesso ao plano pago permanece ativo até o fim do período já pago.',
  },
  {
    categoria: 'Assinatura',
    pergunta: 'O que acontece com minhas receitas se eu cancelar?',
    resposta: 'Ao cancelar, sua conta migra automaticamente para o plano Grátis. As receitas que ultrapassarem o limite de 5 ficam salvas mas não podem ser editadas até que você faça um novo upgrade.',
  },
  {
    categoria: 'Assinatura',
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta: 'Aceitamos cartão de crédito (em até 12x) e Pix (com 5% de desconto). O processamento é feito com segurança pelo Mercado Pago.',
  },
  {
    categoria: 'Assinatura',
    pergunta: 'Existe período de teste gratuito nos planos pagos?',
    resposta: 'O plano Grátis já funciona como um período de avaliação permanente, permitindo explorar as funcionalidades básicas sem limite de tempo. Não há trial separado para os planos pagos.',
  },
];

const categoriaColors: Record<string, string> = {
  Nutrição:     'bg-teal-50 text-teal-700',
  Precificação: 'bg-blue-50 text-blue-700',
  Regulatório:  'bg-amber-50 text-amber-700',
  Rótulo:       'bg-orange-50 text-orange-700',
  Receitas:     'bg-green-50 text-green-700',
  Conta:        'bg-purple-50 text-purple-700',
  Dados:        'bg-indigo-50 text-indigo-700',
  Assinatura:   'bg-rose-50 text-rose-700',
};

export function FAQ({ onNavegar }: FAQProps) {
  const [aberto, setAberto] = useState<number | null>(null);
  const [busca, setBusca] = useState('');

  const faqsFiltrados = faqs.filter(
    (f) =>
      f.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
      f.resposta.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-[80vh] bg-gray-50 py-16 px-4">

      {/* Cabeçalho */}
      <div className="text-center mb-12 max-w-xl mx-auto">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#04585a] bg-[#04585a]/10 px-4 py-1.5 rounded-full mb-4">
          FAQ
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
          Perguntas frequentes
        </h1>
        <p className="text-base text-gray-500">
          Encontre rapidamente respostas para as dúvidas mais comuns.
        </p>
      </div>

      {/* Barra de pesquisa */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar dúvidas..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setAberto(null); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#04585a]/30 focus:border-[#04585a] transition"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium transition"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de perguntas */}
      <div className="max-w-2xl mx-auto flex flex-col gap-3">
        {faqsFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Nenhuma pergunta encontrada para <strong className="text-gray-600">"{busca}"</strong>.</p>
          </div>
        ) : (
          faqsFiltrados.map((faq, i) => {
            const isAberto = aberto === i;
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isAberto ? 'border-[#04585a]/30 shadow-md' : 'border-gray-200 shadow-sm hover:border-gray-300'
                }`}
              >
                <button
                  className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left bg-transparent border-0 cursor-pointer focus:outline-none"
                  onClick={() => setAberto(isAberto ? null : i)}
                >
                  <div className="flex flex-col gap-2">
                    <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${categoriaColors[faq.categoria] ?? 'bg-gray-100 text-gray-500'}`}>
                      {faq.categoria}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 leading-snug">
                      {faq.pergunta}
                    </span>
                  </div>
                  <span className={`shrink-0 mt-1 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    isAberto ? 'bg-[#04585a] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <ChevronDown size={15} className={`transition-transform duration-200 ${isAberto ? 'rotate-180' : ''}`} />
                  </span>
                </button>

                <div className={`grid transition-all duration-200 ${isAberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.resposta}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé */}
      <p className="text-center text-xs text-gray-400 mt-12">
        Não encontrou sua dúvida?{' '}
        <button
          type="button"
          onClick={() => onNavegar?.('suporte')}
          className="text-[#04585a] font-medium hover:underline bg-transparent border-0 p-0 cursor-pointer"
        >
          Entre em contato com o suporte.
        </button>
      </p>
    </div>
  );
}


