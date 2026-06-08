import { useState } from 'react';
import {
  LayoutDashboard,
  Utensils,
  Leaf,
  FilePlus2,
  ScrollText,
  Archive,
  PackageOpen,
  Banknote,
  BarChart3,
  Video,
  LogOut,
  Settings,
  Menu,
  X,
  ChefHat
} from 'lucide-react';
import { UsuarioLogado } from '../types';

type TelaAtiva = any; // Will use the same type from App.tsx

interface SidebarProps {
  telaAtiva: TelaAtiva;
  onNavegar: (tela: TelaAtiva) => void;
  onSair: () => void;
  usuario: UsuarioLogado;
}

export function Sidebar({ telaAtiva, onNavegar, onSair, usuario }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (tela: string) =>
    telaAtiva === tela || (tela === 'receitas' && telaAtiva === 'criar-receita');

  const navItem = (tela: TelaAtiva, label: string, Icon: any) => {
    const active = isActive(tela);
    return (
      <a
        key={tela}
        href={`#${tela}`}
        onClick={(e) => {
          e.preventDefault();
          onNavegar(tela);
          setMobileOpen(false);
        }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all focus:outline-none cursor-pointer group
          ${active 
            ? 'bg-[#04585a] text-white font-medium shadow-sm' 
            : 'text-gray-400 hover:text-white hover:bg-[#04585a]/40 font-medium'
          }
        `}
      >
        <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
        {label}
      </a>
    );
  };

  const navSection = (title: string) => (
    <div className="px-3 mb-2 mt-6">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1e293b] text-white overflow-y-auto w-64 border-r border-[#334155] shadow-xl">
      {/* Logo & Brand */}
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-[#04585a] rounded-lg flex items-center justify-center">
          <ChefHat size={20} className="text-white" />
        </div>
        <span className="font-bold tracking-tight text-lg">NutriGestão</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 pb-6">
        <div className="space-y-1">
          {navItem('dashboard', 'Dashboard', LayoutDashboard)}
        </div>

        {navSection('Cardápio')}
        <div className="space-y-1">
          {navItem('refeicao', 'Marmitas / Refeições', Utensils)}
          {navItem('receitas', 'Minhas Receitas', ScrollText)}
          {navItem('criar-receita', 'Nova Receita', FilePlus2)}
          {navItem('lista-ingredientes', 'Ingredientes', Leaf)}
        </div>

        {navSection('Operação')}
        <div className="space-y-1">
          {navItem('estoque', 'Controle de Estoque', Archive)}
          {navItem('producao', 'Registro de Produção', PackageOpen)}
        </div>

        {navSection('Financeiro')}
        <div className="space-y-1">
          {navItem('despesas', 'Despesas e Rateio', Banknote)}
          {navItem('estatisticas', 'Estatísticas', BarChart3)}
        </div>

        {navSection('Ajuda & Suporte')}
        <div className="space-y-1">
          {navItem('aulas', 'Aulas ao Vivo', Video)}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-[#334155] bg-[#0f172a] shrink-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white truncate max-w-[120px]">
              {usuario.nome.split(' ')[0]}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              {usuario.role === 'admin' ? 'Administrador' : 'Plano PRO'}
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onNavegar('perfil'); setMobileOpen(false); }}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#334155] transition-colors border-0 bg-transparent cursor-pointer"
            title="Configurações do Perfil"
          >
            <Settings size={18} />
          </button>
        </div>
        <button
          onClick={onSair}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#1e293b] flex items-center justify-between px-4 z-40 border-b border-[#334155]">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-[#04585a] rounded-lg flex items-center justify-center">
            <ChefHat size={18} className="text-white" />
          </div>
          <span className="font-bold tracking-tight">NutriGestão</span>
        </div>
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-300 hover:text-white border-0 bg-transparent cursor-pointer"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full flex flex-col bg-[#1e293b] shadow-2xl animate-in slide-in-from-left-full duration-200">
            <button 
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white border-0 bg-transparent cursor-pointer z-50 bg-[#1e293b] rounded-md"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 z-40 shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
