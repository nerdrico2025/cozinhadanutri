import { useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { getFAQ, FAQEntry } from '../services/supportService';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login' | 'register' | 'planos' | 'faq' | 'suporte' | 'termos' | 'pagamento' | 'adm';

interface FAQProps {
  onNavegar?: (tela: TelaAtiva) => void;
}

const categoriaColors: Record<string, string> = {
  Nutrição:     'bg-teal-50 text-teal-700',
  Precificação: 'bg-blue-50 text-blue-700',
  Regulatório:  'bg-amber-50 text-amber-700',
  Rótulo:       'bg-orange-50 text-orange-700',
  Receitas:     'bg-green-50 text-green-700',
  Conta:        'bg-purple-50 text-purple-700',
  Dados:        'bg-indigo-50 text-indigo-700',
  Assinatura:   'bg-rose-50 text-rose-700',
  geral:        'bg-teal-50 text-teal-700',
  tecnico:      'bg-blue-50 text-blue-700',
  plano:        'bg-orange-50 text-orange-700',
  outros:       'bg-gray-50 text-gray-700',
};

export function FAQ({ onNavegar }: FAQProps) {
  const [faqs, setFaqs] = useState<FAQEntry[]>(getFAQ());
  const [aberto, setAberto] = useState<number | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const handleUpdate = () => setFaqs(getFAQ());
    window.addEventListener('faq_updated', handleUpdate);
    return () => window.removeEventListener('faq_updated', handleUpdate);
  }, []);

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
                key={faq.id || i}
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
