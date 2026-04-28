import { useState } from 'react';
import {
  Home,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Headphones,
  HelpCircle,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';
import { UsuarioLogado } from '../types';
import { LucideIcon } from 'lucide-react';

type TelaAtiva =
  | 'home'
  | 'dashboard'
  | 'receitas'
  | 'criar-receita'
  | 'cadastro-ingrediente'
  | 'lista-ingredientes'
  | 'login'
  | 'register'
  | 'esqueci-senha'
  | 'perfil'
  | 'planos'
  | 'faq'
  | 'suporte'
  | 'termos'
  | 'pagamento'
  | 'adm';

interface HeaderProps {
  telaAtiva: TelaAtiva;
  onNavegar: (tela: TelaAtiva) => void;
  onSair?: () => void;
  usuario?: UsuarioLogado | null;
}

export function Header({
  telaAtiva,
  onNavegar,
  onSair,
  usuario,
}: HeaderProps): JSX.Element {
  const [menuAberto, setMenuAberto] = useState(false);

  const isActive = (tela: TelaAtiva) =>
    telaAtiva === tela || (tela === 'receitas' && telaAtiva === 'criar-receita');

  const navItem = (tela: TelaAtiva, label: string, Icon: LucideIcon) => {
    const active = isActive(tela);
    return (
      <button
        key={tela}
        onClick={() => onNavegar(tela)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap focus:outline-none
          ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
        `}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  };

  const navItemMobile = (tela: TelaAtiva, label: string, Icon: LucideIcon) => {
    const active = isActive(tela);
    return (
      <button
        key={tela}
        onClick={() => { onNavegar(tela); setMenuAberto(false); }}
        className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition focus:outline-none
          ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
        `}
      >
        <Icon size={18} />
        {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <button
          onClick={() => onNavegar('home')}
          className="flex items-center gap-2 hover:opacity-80 transition focus:outline-none"
        >
          <img src="/logo.svg" alt="Cozinha da Nutri" className="h-9" />
        </button>

        {/* DESKTOP: NAV CENTRAL */}
        <nav className="hidden md:flex items-center gap-1">
          {navItem('home', 'Início', Home)}
          {usuario && usuario.role !== 'admin' && navItem('dashboard', 'Dashboard', LayoutDashboard)}
          {navItem('planos', 'Planos', CreditCard)}
          {navItem('faq', 'Perguntas e Respostas', HelpCircle)}
          {navItem('suporte', 'Suporte', Headphones)}
          {usuario?.role === 'admin' && navItem('adm', 'Admin', ShieldCheck)}
        </nav>

        {/* DESKTOP: AÇÕES */}
        <div className="hidden md:flex items-center gap-2">
          {!usuario ? (
            <>
              <button
                onClick={() => onNavegar('login')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition focus:outline-none"
              >
                <LogIn size={16} />
                Login
              </button>
              <button
                onClick={() => onNavegar('register')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition focus:outline-none"
              >
                <UserPlus size={16} />
                Cadastro
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavegar('perfil')}
                className="text-sm text-gray-700 hover:text-brand transition cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
              >
                Olá, <strong>{usuario.nome.split(' ')[0]}</strong>
              </button>
              <button
                onClick={onSair}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition focus:outline-none"
              >
                <LogOut size={16} />
                Sair
              </button>
            </>
          )}
        </div>

        {/* MOBILE: botão sair + hambúrguer */}
        <div className="flex md:hidden items-center gap-1">
          {usuario && (
            <button
              onClick={onSair}
              className="flex items-center gap-1.5 p-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition focus:outline-none"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition focus:outline-none"
            aria-label="Menu"
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE: Menu dropdown */}
      {menuAberto && (
        <div className="md:hidden border-t border-gray-200 bg-white px-3 pb-4 pt-2 flex flex-col gap-0.5">
          {navItemMobile('home', 'Início', Home)}
          {usuario && usuario.role !== 'admin' && navItemMobile('dashboard', 'Dashboard', LayoutDashboard)}
          {navItemMobile('planos', 'Planos', CreditCard)}
          {navItemMobile('faq', 'Perguntas e Respostas', HelpCircle)}
          {navItemMobile('suporte', 'Suporte', Headphones)}
          {usuario?.role === 'admin' && navItemMobile('adm', 'Admin', ShieldCheck)}

          {!usuario && (
            <div className="border-t border-gray-100 mt-2 pt-2 flex flex-col gap-0.5">
              <button
                onClick={() => { onNavegar('login'); setMenuAberto(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none"
              >
                <LogIn size={18} /> Login
              </button>
              <button
                onClick={() => { onNavegar('register'); setMenuAberto(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none"
              >
                <UserPlus size={18} /> Cadastro
              </button>
            </div>
          )}

          {usuario && (
            <div className="border-t border-gray-100 mt-2 pt-3 px-4">
              <button
                onClick={() => { onNavegar('perfil'); setMenuAberto(false); }}
                className="text-sm text-gray-500 hover:text-brand transition cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
              >
                Olá, <strong className="text-gray-800">{usuario.nome.split(' ')[0]}</strong>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}