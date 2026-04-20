import { ChefHat, UtensilsCrossed, List, Tag, PlusCircle, BookOpen } from 'lucide-react';
import { Receita } from '../types';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login' | 'register';

interface DashboardProps {
  onNavegar: (tela: TelaAtiva) => void;
  receitas: Receita[];
  totalIngredientes: number;
}

const menuItems = [
  {
    tela: 'criar-receita' as TelaAtiva,
    titulo: 'Nova Receita',
    descricao: 'Crie uma receita vinculando ingredientes da tabela TACO com dados nutricionais automáticos.',
    iconBgClass: 'bg-teal-100',
    iconColor: '#04585a',
    Icon: PlusCircle,
    btnLabel: 'Criar receita',
  },
  {
    tela: 'receitas' as TelaAtiva,
    titulo: 'Lista de Receitas',
    descricao: 'Visualize, gerencie e consulte todas as receitas cadastradas.',
    iconBgClass: 'bg-blue-100',
    iconColor: '#2563eb',
    Icon: BookOpen,
    btnLabel: 'Ver receitas',
  },
  {
    tela: 'cadastro-ingrediente' as TelaAtiva,
    titulo: 'Cadastrar Ingrediente',
    descricao: 'Pesquise e registre ingredientes com base na tabela TACO.',
    iconBgClass: 'bg-yellow-100',
    iconColor: '#ca8a04',
    Icon: UtensilsCrossed,
    btnLabel: 'Cadastrar',
  },
  {
    tela: 'lista-ingredientes' as TelaAtiva,
    titulo: 'Lista de Ingredientes',
    descricao: 'Consulte todos os ingredientes disponíveis no sistema.',
    iconBgClass: 'bg-purple-100',
    iconColor: '#9333ea',
    Icon: List,
    btnLabel: 'Ver ingredientes',
  },
  {
    tela: 'receitas' as TelaAtiva,
    titulo: 'Rótulo Nutricional',
    descricao: 'Gere rótulos nutricionais no padrão ANVISA a partir das suas receitas.',
    iconBgClass: 'bg-orange-100',
    iconColor: '#ea580c',
    Icon: Tag,
    btnLabel: 'Gerar rótulo',
  },
];

export function Dashboard({ onNavegar, receitas, totalIngredientes }: DashboardProps) {
  const totalValor = receitas.reduce((acc, r) => acc + r.precoSugerido, 0);

  return (
    <div className="py-8 min-h-[80vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-3">
          <ChefHat size={52} color="#04585a" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cozinha da Nutri</h1>
        <p className="text-base text-gray-500">Gerencie receitas, ingredientes e rótulos nutricionais em um só lugar</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-light">
            <ChefHat size={22} color="#04585a" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-0.5">Receitas cadastradas</p>
            <p className="text-xl font-bold text-gray-800">{receitas.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-100">
            <span className="text-xl">💰</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-0.5">Valor total do cardápio</p>
            <p className="text-xl font-bold text-gray-800">R$ {totalValor.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-purple-100">
            <UtensilsCrossed size={22} color="#9333ea" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-0.5">Ingredientes cadastrados</p>
            <p className="text-xl font-bold text-gray-800">{totalIngredientes}</p>
          </div>
        </div>
      </div>

      {/* Cards de navegação */}
      <p className="text-lg font-semibold text-gray-700 mb-4">O que deseja fazer?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <div
            key={item.titulo}
            onClick={() => onNavegar(item.tela)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer flex flex-col gap-2.5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.iconBgClass}`}>
              <item.Icon size={22} color={item.iconColor} />
            </div>
            <p className="text-sm font-semibold text-gray-800">{item.titulo}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.descricao}</p>
            <p className="mt-auto pt-3 text-xs font-semibold text-brand">→ {item.btnLabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

