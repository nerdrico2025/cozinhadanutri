import { Mail, MessageCircle, ShieldCheck, HelpCircle, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSupportConfig, SupportConfig } from '../services/supportService';

type TelaAtiva =
  | 'home' | 'dashboard' | 'receitas' | 'criar-receita'
  | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login'
  | 'register' | 'esqueci-senha' | 'planos' | 'faq' | 'suporte' | 'termos'
  | 'pagamento' | 'adm';

interface FooterProps {
  onNavegar: (tela: TelaAtiva) => void;
}

const ANO = new Date().getFullYear();

export function Footer({ onNavegar }: FooterProps) {
  const [config, setConfig] = useState<SupportConfig>(getSupportConfig());

  useEffect(() => {
    const handleUpdate = () => setConfig(getSupportConfig());
    window.addEventListener('support_updated', handleUpdate);
    return () => window.removeEventListener('support_updated', handleUpdate);
  }, []);

  return (
    <footer className="bg-[#04585a] text-white">
      {/* Faixa superior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Marca */}
        <div className="flex flex-col gap-4">
          <img src="/logo.svg" alt="Cozinha da Nutri" className="h-12 w-auto brightness-0 invert" />
          <p className="text-sm text-teal-100 leading-relaxed">
            Tecnologia nutricional para quem transforma alimentos em negócio. Receitas, custos e rótulos num só lugar.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a
              href={`https://instagram.com/${config.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Sistema */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Sistema</p>
          {[
            { label: 'Início', tela: 'home' as TelaAtiva },
            { label: 'Planos e Preços', tela: 'planos' as TelaAtiva },
            { label: 'Suporte', tela: 'suporte' as TelaAtiva },
          ].map((l) => (
            <button
              key={l.tela}
              type="button"
              onClick={() => onNavegar(l.tela)}
              className="text-sm text-teal-100 hover:text-white text-left transition flex items-center gap-2 group w-fit"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 group-hover:bg-white transition shrink-0" />
              {l.label}
            </button>
          ))}
        </div>

        {/* Suporte */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Suporte</p>
          {[
            { label: 'Central de Ajuda', tela: 'suporte' as TelaAtiva, Icon: HelpCircle },
            { label: 'Perguntas e Respostas', tela: 'faq' as TelaAtiva, Icon: BookOpen },
          ].map((l) => {
            const Icon = l.Icon;
            return (
              <button
                key={l.tela}
                type="button"
                onClick={() => onNavegar(l.tela)}
                className="text-sm text-teal-100 hover:text-white text-left transition flex items-center gap-2 w-fit"
              >
                <Icon size={14} className="shrink-0 text-teal-400" />
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Contato */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Fale conosco</p>
          <a
            href={`mailto:${config.email}`}
            className="flex items-center gap-2 text-sm text-teal-100 hover:text-white transition"
          >
            <Mail size={15} className="shrink-0 text-teal-400" />
            {config.email}
          </a>
          <a
            href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-100 hover:text-white transition"
          >
            <MessageCircle size={15} className="shrink-0 text-teal-400" />
            WhatsApp: {config.whatsapp}
          </a>
          <a
            href={`https://www.instagram.com/${config.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-100 hover:text-white transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal-400">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            @{config.instagram}
          </a>


          <div className="mt-2 bg-white/10 rounded-xl px-4 py-3 flex items-start gap-2">
            <ShieldCheck size={16} className="text-teal-300 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-100 leading-relaxed">
              Dados protegidos conforme a <span className="font-semibold text-white">LGPD</span>. Sua privacidade é nossa prioridade.
            </p>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-teal-300">
          <span>© {ANO} Cozinha da Nutri. Todos os direitos reservados.</span>
          <span>Feito com ❤️ para nutricionistas e empreendedores.</span>
        </div>
      </div>
    </footer>
  );
}
