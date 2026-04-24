import { Mail, MessageCircle, ShieldCheck, HelpCircle, BookOpen } from 'lucide-react';

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
           {/*  <a
              href="https://instagram.com"
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
            </a> */}
           {/*  <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="WhatsApp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.5l5.816-1.452A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.645-.523-5.148-1.427l-.369-.217-3.448.861.924-3.352-.24-.384A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </a> */}
          </div>
        </div>

        {/* Sistema */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-300">Sistema</p>
          {[
            { label: 'Início', tela: 'home' as TelaAtiva },
            { label: 'Planos e Preços', tela: 'planos' as TelaAtiva },
            { label: 'Suporte', tela: 'suporte' as TelaAtiva },
            { label: 'Admin', tela: 'login' as TelaAtiva },
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
            { label: 'Central de Ajuda', tela: 'suporte' as TelaAtiva, Icon: HelpCircle },            { label: 'Perguntas e Respostas', tela: 'faq' as TelaAtiva, Icon: BookOpen },          ].map((l) => {
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
            href="mailto:contato@cozinhadanutri.com.br"
            className="flex items-center gap-2 text-sm text-teal-100 hover:text-white transition"
          >
            <Mail size={15} className="shrink-0 text-teal-400" />
            contato@cozinhadanutri.com.br
          </a>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-100 hover:text-white transition"
          >
            <MessageCircle size={15} className="shrink-0 text-teal-400" />
            WhatsApp: (21) 99924-0792
          </a>
          <a
            href="https://www.instagram.com/_cozinhadanutri/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-teal-100 hover:text-white transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal-400">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            @_cozinhadanutri
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
