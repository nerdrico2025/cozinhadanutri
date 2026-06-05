import {
  ChefHat, Leaf, LayoutList, FilePlus2,
  ScrollText, FileBarChart2, Banknote, Utensils, ArrowRight, BarChart3, Video, Archive
} from 'lucide-react';
import { Receita } from '../types';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'estoque' | 'login' | 'register' | 'refeicao' | 'despesas' | 'estatisticas' | 'aulas';

interface DashboardProps {
  onNavegar: (tela: TelaAtiva) => void;
  receitas: Receita[];
  totalIngredientes: number;
}

const menuItems = [
  {
    tela: 'cadastro-ingrediente' as TelaAtiva,
    titulo: 'Cadastrar Ingrediente',
    descricao: 'Pesquise e registre ingredientes com base na tabela TACO.',
    iconBgClass: 'bg-amber-100',
    iconColor: '#d97706',
    Icon: Leaf,
    btnLabel: 'Cadastrar ingrediente',
  },
  {
    tela: 'lista-ingredientes' as TelaAtiva,
    titulo: 'Lista de Ingredientes',
    descricao: 'Consulte e gerencie todos os ingredientes disponíveis no sistema.',
    iconBgClass: 'bg-purple-100',
    iconColor: '#9333ea',
    Icon: LayoutList,
    btnLabel: 'Ver ingredientes',
  },

  {
    tela: 'criar-receita' as TelaAtiva,
    titulo: 'Nova Receita',
    descricao: 'Crie uma receita vinculando ingredientes da tabela TACO com dados nutricionais automáticos.',
    iconBgClass: 'bg-green-100',
    iconColor: '#16a34a',
    Icon: FilePlus2,
    btnLabel: 'Criar receita',
  },
  {
    tela: 'receitas' as TelaAtiva,
    titulo: 'Minhas Receitas',
    descricao: 'Visualize, edite e gerencie todas as receitas cadastradas no sistema.',
    iconBgClass: 'bg-blue-100',
    iconColor: '#2563eb',
    Icon: ScrollText,
    btnLabel: 'Ver receitas',
  },

  {
    tela: 'refeicao' as TelaAtiva,
    titulo: 'Nova Refeição',
    descricao: 'Monte refeições completas agrupando diversas receitas e calcule o custo total.',
    iconBgClass: 'bg-emerald-100',
    iconColor: '#059669',
    Icon: Utensils,
    btnLabel: 'Criar refeição',
  },
  {
    tela: 'estoque' as TelaAtiva,
    titulo: 'Controle de Estoque',
    descricao: 'Rastreie insumos, gerencie entradas e saídas, e receba alertas de faltas.',
    iconBgClass: 'bg-amber-100',
    iconColor: '#d97706',
    Icon: Archive,
    btnLabel: 'Gerenciar estoque',
  },
  {
    tela: 'despesas' as TelaAtiva,
    titulo: 'Controle de Despesas',
    descricao: 'Registre custos fixos e variáveis para apurar a margem de lucro real.',
    iconBgClass: 'bg-rose-100',
    iconColor: '#e11d48',
    Icon: Banknote,
    btnLabel: 'Ver despesas',
  },
  {
    tela: 'estatisticas' as TelaAtiva,
    titulo: 'Estatísticas',
    descricao: 'Analise gráficos e relatórios sobre o custo e rentabilidade das suas receitas.',
    iconBgClass: 'bg-indigo-100',
    iconColor: '#4f46e5',
    Icon: BarChart3,
    btnLabel: 'Ver relatórios',
  },
  {
    tela: 'aulas' as TelaAtiva,
    titulo: 'Aulas ao Vivo',
    descricao: 'Acesse mentorias e conteúdos exclusivos sobre precificação e rotulagem.',
    iconBgClass: 'bg-cyan-100',
    iconColor: '#0891b2',
    Icon: Video,
    btnLabel: 'Acessar aulas',
  }
  /*  {
     tela: 'receitas' as TelaAtiva,
     titulo: 'Rótulo Nutricional',
     descricao: 'Gere rótulos nutricionais no padrão ANVISA a partir das suas receitas.',
     iconBgClass: 'bg-orange-100',
     iconColor: '#ea580c',
     Icon: FileBarChart2,
     btnLabel: 'Gerar rótulo',
   }, */
];

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
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${accentColor} flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

export function Dashboard({ onNavegar, receitas, totalIngredientes }: DashboardProps) {
  const totalValor = receitas.reduce((acc, r) => acc + r.precoSugerido, 0);

  return (
    <div className="py-8 min-h-[80vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">



      {/* Cards de navegação */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-base font-semibold text-gray-700">O que deseja fazer?</p>
        <span className="text-xs text-gray-400">{menuItems.length} ações disponíveis</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.titulo}
            type="button"
            onClick={() => onNavegar(item.tela)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer flex flex-col gap-3 text-left transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 group"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.iconBgClass} transition-transform duration-200 group-hover:scale-110`}>
              <item.Icon size={20} color={item.iconColor} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-800">{item.titulo}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.descricao}</p>
            </div>
            <div className="mt-auto pt-2 flex items-center gap-1 text-xs font-semibold text-brand group-hover:gap-2 transition-all duration-200">
              {item.btnLabel}
              <ArrowRight size={13} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

