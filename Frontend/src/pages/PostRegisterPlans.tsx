import { Check, Sparkles, Rocket } from 'lucide-react';
import { UsuarioLogado } from '../types';

type TelaAtiva = 
  | 'home' | 'dashboard' | 'receitas' | 'criar-receita' 
  | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login' 
  | 'register' | 'planos' | 'faq' | 'suporte' | 'termos' 
  | 'pagamento' | 'adm' | 'esqueci-senha' | 'boas-vindas';

interface PostRegisterPlansProps {
  onNavegar: (tela: TelaAtiva) => void;
  onAssinarPlano: (planoId: 'profissional' | 'empresarial') => void;
  usuario: UsuarioLogado | null;
}

const planos: { 
  id: 'gratis' | 'profissional' | 'empresarial'; 
  nome: string; 
  precoMensal: string; 
  precoAnual: string; 
  totalAnual: string; 
  economia: string | null; 
  periodo: string; 
  destaque: boolean; 
  recursos: string[] 
}[] = [
  {
    id: 'gratis',
    nome: 'Grátis',
    precoMensal: 'R$ 0',
    precoAnual: 'R$ 0',
    totalAnual: 'R$ 0 / ano',
    economia: null,
    periodo: 'para sempre',
    destaque: false,
    recursos: [
      'Até 3 receitas',
      'Até 10 ingredientes',
      'Busca na tabela TACO',
      'Cálculo nutricional básico',
      'Rótulo nutricional ANVISA',
    ],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    precoMensal: 'R$ 29',
    precoAnual: 'R$ 24',
    totalAnual: 'R$ 290 / ano',
    economia: 'Economize R$ 58',
    periodo: '/ mês',
    destaque: true,
    recursos: [
      'Receitas ilimitadas',
      'Ingredientes ilimitados',
      'Precificação avançada',
      'Exportar rótulos em PDF',
      'Histórico de receitas',
      'Suporte prioritário',
    ],
  },
  {
    id: 'empresarial',
    nome: 'Empresarial',
    precoMensal: 'R$ 79',
    precoAnual: 'R$ 66',
    totalAnual: 'R$ 790 / ano',
    economia: 'Economize R$ 158',
    periodo: '/ mês',
    destaque: false,
    recursos: [
      'Tudo do Profissional',
      'Múltiplos usuários',
      'Relatórios gerenciais',
      'API de integração',
      'Onboarding dedicado',
    ],
  },
];

export function PostRegisterPlans({ onNavegar, onAssinarPlano, usuario }: PostRegisterPlansProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      
      {/* Welcome Header */}
      <div className="text-center mb-14 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center justify-center p-4 bg-[#04585a]/10 rounded-2xl text-[#04585a] mb-6">
          <Rocket size={32} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
          Bem-vindo(a), {usuario?.nome.split(' ')[0]}!
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Sua conta foi criada com sucesso. Escolha o plano que melhor se adapta às suas necessidades para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
        {planos.map((plano) => {
          const isGratis = plano.id === 'gratis';

          let labelBotao: string;
          let handleClick: () => void;

          if (isGratis) {
            labelBotao = 'Continuar no Grátis';
            handleClick = () => onNavegar('dashboard');
          } else {
            labelBotao = 'Assinar agora';
            handleClick = () => onAssinarPlano(plano.id as 'profissional' | 'empresarial');
          }

          return (
            <div
              key={plano.id}
              className={`relative flex flex-col rounded-2xl transition-all duration-200 ${
                plano.destaque
                  ? 'bg-[#04585a] text-white shadow-2xl shadow-[#04585a]/30 scale-[1.02]'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Badge */}
              {plano.destaque && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-white text-[#04585a] text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    <Sparkles size={12} />
                    Mais popular
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-1">
                {/* Nome do plano */}
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                  {plano.nome}
                </p>

                {/* Preço */}
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold leading-none ${plano.destaque ? 'text-white' : 'text-gray-900'}`}>
                    {plano.precoMensal}
                  </span>
                </div>
                <p className={`text-sm ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                  {plano.periodo}
                </p>
                
                {plano.id !== 'gratis' && (
                  <div className="mt-3 flex flex-col gap-1">
                    <div className={`flex items-center gap-2 text-xs ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                      <span>ou</span>
                      <span className={`font-bold text-sm ${plano.destaque ? 'text-white' : 'text-gray-800'}`}>
                        {plano.precoAnual}/mês
                      </span>
                      <span>no plano anual</span>
                    </div>
                    <p className={`text-xs ${plano.destaque ? 'text-white/50' : 'text-gray-400'}`}>
                      {plano.totalAnual} cobrado uma vez
                    </p>
                    {plano.economia && (
                      <span className={`text-xs font-semibold ${plano.destaque ? 'text-green-300' : 'text-green-600'}`}>
                        {plano.economia} vs. mensal
                      </span>
                    )}
                  </div>
                )}
                
                <div className="mb-6" />

                {/* Divisor */}
                <div className={`h-px mb-7 ${plano.destaque ? 'bg-white/15' : 'bg-gray-100'}`} />

                {/* Recursos */}
                <ul className="flex flex-col gap-3 mb-8">
                  {plano.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        plano.destaque ? 'bg-white/20' : 'bg-[#04585a]/10'
                      }`}>
                        <Check size={10} className={plano.destaque ? 'text-white' : 'text-[#04585a]'} strokeWidth={3} />
                      </span>
                      <span className={plano.destaque ? 'text-white/85' : 'text-gray-600'}>{r}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão */}
                <button
                  onClick={handleClick}
                  className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 border cursor-pointer ${
                    plano.destaque
                      ? 'bg-white text-[#04585a] border-white hover:bg-white/90'
                      : 'bg-[#04585a] text-white border-[#04585a] hover:bg-[#04585a]/90'
                  }`}
                >
                  {labelBotao}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-12">
        Todos os planos incluem suporte por e-mail. Cancele quando quiser, sem multas.
      </p>
    </div>
  );
}
