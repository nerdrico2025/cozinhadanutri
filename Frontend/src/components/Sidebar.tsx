import { useState } from 'react';
import {
  Leaf, LayoutList, FilePlus2, ScrollText,
  Utensils, PackageOpen, Archive, Banknote, BarChart3, Video, ChevronRight, Menu, X
} from 'lucide-react';

type TelaAtiva = any;

interface SidebarProps {
  activeTela: string;
  onNavegar: (tela: any) => void;
}

const menuCategories = [
  {
    nome: 'Ingredientes & Receitas',
    items: [
      {
        tela: 'cadastro-ingrediente' as TelaAtiva,
        titulo: 'Cadastrar Ingrediente',
        Icon: Leaf,
        iconBgClass: 'bg-amber-100',
        iconColor: '#d97706',
      },
      {
        tela: 'lista-ingredientes' as TelaAtiva,
        titulo: 'Lista de Ingredientes',
        Icon: LayoutList,
        iconBgClass: 'bg-purple-100',
        iconColor: '#9333ea',
      },
      {
        tela: 'criar-receita' as TelaAtiva,
        titulo: 'Nova Receita',
        Icon: FilePlus2,
        iconBgClass: 'bg-green-100',
        iconColor: '#16a34a',
      },
      {
        tela: 'receitas' as TelaAtiva,
        titulo: 'Lista de Receitas',
        Icon: ScrollText,
        iconBgClass: 'bg-blue-100',
        iconColor: '#2563eb',
      }
    ],
  },
  {
    nome: 'Produção & Estoque',
    items: [
      {
        tela: 'refeicao' as TelaAtiva,
        titulo: 'Nova Refeição e Precificação',
        Icon: Utensils,
        iconBgClass: 'bg-emerald-100',
        iconColor: '#059669',
      },
      {
        tela: 'lista-refeicoes' as TelaAtiva,
        titulo: 'Refeições e Rótulos',
        Icon: ScrollText,
        iconBgClass: 'bg-blue-100',
        iconColor: '#2563eb',
      },
     /*  {
        tela: 'producao' as TelaAtiva,
        titulo: 'Registrar Produção',
        Icon: PackageOpen,
        iconBgClass: 'bg-indigo-100',
        iconColor: '#4f46e5',
      }, */
      /* {
        tela: 'estoque' as TelaAtiva,
        titulo: 'Controle de Estoque',
        Icon: Archive,
        iconBgClass: 'bg-amber-100',
        iconColor: '#d97706',
      }, */
    ],
  },
  /*{
    nome: 'Financeiro & Estatísticas',
    items: [
      {
        tela: 'despesas' as TelaAtiva,
        titulo: 'Controle de Despesas',
        Icon: Banknote,
        iconBgClass: 'bg-rose-100',
        iconColor: '#e11d48',
      },
       {
        tela: 'estatisticas' as TelaAtiva,
        titulo: 'Estatísticas',
        Icon: BarChart3,
        iconBgClass: 'bg-indigo-100',
        iconColor: '#4f46e5',
      },
    ],
  }, */
  /* {
    nome: 'Conteúdo',
    items: [
      {
        tela: 'aulas' as TelaAtiva,
        titulo: 'Aulas ao Vivo',
        Icon: Video,
        iconBgClass: 'bg-cyan-100',
        iconColor: '#0891b2',
      },
    ],
  }, */
];

export function Sidebar({ activeTela, onNavegar }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (tela: any) => {
    onNavegar(tela);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Overlay Backdrop (Mobile only) ─────────────────────────────── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
        />
      )}

      {/* ── Floating Mobile Toggle Button ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-12 h-12 rounded-full bg-brand text-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 border-0 focus:outline-none"
        aria-label="Abrir Menu de Navegação"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Sidebar Container ─────────────────────────────────────────── */}
      <aside className={`
        fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-100 z-40 flex flex-col p-4 overflow-y-auto transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-0.5 px-2 pb-1 border-b border-gray-50 lg:hidden">
            <span className="text-xs font-bold text-gray-800">Cozinha da Nutri</span>
            <span className="text-[10px] text-gray-400">Navegue pelas seções</span>
          </div>

          {menuCategories.map((category) => (
            <div key={category.nome} className="flex flex-col gap-2">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2">
                {category.nome}
              </h3>
              <div className="flex flex-col gap-0.5">
                {category.items.map((item) => {
                  const isActive = activeTela === item.tela;
                  return (
                    <button
                      key={item.titulo}
                      type="button"
                      onClick={() => handleNavigate(item.tela)}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left border border-transparent transition-all group cursor-pointer text-xs
                        ${isActive
                          ? 'bg-brand/10 border-brand/10 text-brand font-semibold shadow-[sm_inset]'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBgClass} transition-transform duration-200 group-hover:scale-105`}>
                        <item.Icon size={14} color={item.iconColor} />
                      </div>
                      <span className="flex-1 min-w-0 truncate">
                        {item.titulo}
                      </span>
                      <ChevronRight size={10} className={`shrink-0 transition-all duration-200
                        ${isActive
                          ? 'text-brand translate-x-0.5'
                          : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'
                        }
                      `} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
