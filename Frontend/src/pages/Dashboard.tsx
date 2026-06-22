import {
  ChefHat, Leaf, ScrollText, Banknote, Utensils, Zap, Crown, ArrowUpRight
} from 'lucide-react';
import { Receita, UsuarioLogado } from '../types';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'estoque' | 'login' | 'register' | 'refeicao' | 'despesas' | 'producao' | 'estatisticas' | 'aulas' | 'pagamento';

interface DashboardProps {
  onNavegar: (tela: any) => void;
  receitas: Receita[];
  totalIngredientes: number;
  usuario?: UsuarioLogado | null;
}

interface StatCardProps {
  label: string;
  value: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

function StatCard({ label, value, Icon, iconBg, iconColor, accentColor }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${accentColor} flex items-center gap-4 border border-gray-100`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-xl font-black text-gray-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

export function Dashboard({ receitas, totalIngredientes, usuario, onNavegar }: DashboardProps) {
  const totalReceitas = receitas.length;
  const totalIngredientesCadastrados = totalIngredientes;
  
  const somaPrecoSugerido = receitas.reduce((acc, r) => acc + (r.precoSugerido || 0), 0);
  const mediaPrecoSugerido = totalReceitas > 0 ? somaPrecoSugerido / totalReceitas : 0;
  
  const somaCustoPorPorcao = receitas.reduce((acc, r) => acc + (r.custoPorPorcao || 0), 0);
  const mediaCustoPorPorcao = totalReceitas > 0 ? somaCustoPorPorcao / totalReceitas : 0;

  return (
    <div className="py-8 min-h-[80vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-[#04585a] rounded-3xl p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10">
          <ChefHat size={160} />
        </div>
        <div className="relative z-10 flex flex-col gap-1.5">
          <span className="bg-white/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full self-start">
            Painel Geral
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Cozinha da Nutri</h1>
          <p className="text-xs sm:text-sm text-emerald-50/90 max-w-xl leading-relaxed">
            Bem-vindo ao seu sistema de gestão. Aqui você pode formular receitas, calcular custos, cadastrar insumos e gerar informações nutricionais automaticamente de acordo com as regras da ANVISA.
          </p>
        </div>
      </div>
      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Receitas Cadastradas"
          value={String(totalReceitas)}
          Icon={ScrollText}
          iconBg="bg-emerald-50"
          iconColor="#059669"
          accentColor="border-emerald-500"
        />
        <StatCard
          label="Ingredientes Cadastrados"
          value={String(totalIngredientesCadastrados)}
          Icon={Leaf}
          iconBg="bg-amber-50"
          iconColor="#d97706"
          accentColor="border-amber-500"
        />
        <StatCard
          label="Preço de Venda Médio"
          value={`R$ ${mediaPrecoSugerido.toFixed(2).replace('.', ',')}`}
          Icon={Banknote}
          iconBg="bg-indigo-50"
          iconColor="#4f46e5"
          accentColor="border-indigo-500"
        />
        <StatCard
          label="Custo Médio p/ Porção"
          value={`R$ ${mediaCustoPorPorcao.toFixed(2).replace('.', ',')}`}
          Icon={Utensils}
          iconBg="bg-rose-50"
          iconColor="#e11d48"
          accentColor="border-rose-500"
        />
      </section>

      {/* Workflow Guide */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Fluxo de Trabalho Recomendado
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Siga estes passos para extrair o máximo do sistema</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 mb-1">Cadastrar Ingredientes</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Adicione seus insumos, informando preço de compra e unidade de medida. Associe-os à tabela TACO para buscar os dados de energia, carboidratos, proteínas e mais de forma totalmente automática.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 mb-1">Criar & Precificar Receitas</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Combine ingredientes e informe quantidades. O sistema calcula na hora o custo dos insumos, sugere preços de venda ideais e consolida a tabela de informação nutricional de cada porção.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 mb-1">Gerar Rótulo da ANVISA</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Com a receita salva, gere o rótulo de informação nutricional no novo padrão da ANVISA pronto para impressão e colagem nas embalagens dos seus produtos e marmitas.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Propaganda Banner for Free Plan */}
      {(!usuario?.planoAtual || usuario?.planoAtual === 'gratis') && (
        <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fadeIn">
          <div className="relative z-10 flex items-start sm:items-center gap-5">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 shadow-sm shrink-0">
              <Crown size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-white tracking-tight">Eleve sua operação com o Plano Profissional</h3>
              <p className="text-[13px] text-slate-400 max-w-2xl leading-relaxed mt-1.5">
                Atualmente você está no plano <strong className="text-slate-200 font-medium">Grátis</strong> (limite de 5 receitas). Faça o upgrade para criar até <strong className="text-slate-200 font-medium">60 receitas</strong>, gerar etiquetas personalizáveis, exportar relatórios e ter suporte prioritário.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavegar('pagamento')}
            className="relative z-10 w-full md:w-auto flex items-center justify-center gap-2 bg-white text-slate-900 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shrink-0 border-0 shadow-sm"
          >
            Fazer Upgrade
            <ArrowUpRight size={16} className="text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
}
