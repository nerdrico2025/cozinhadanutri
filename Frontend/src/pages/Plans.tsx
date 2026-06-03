import { Check, Sparkles, Minus, HelpCircle, ChevronDown, Mail, Clock, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { UsuarioLogado } from '../types';
import React, { useState, useEffect } from 'react';
import { getSupportConfig, getFAQ, SupportConfig, FAQEntry } from '../services/supportService';

function InstagramIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login' | 'register' | 'planos' | 'faq' | 'suporte' | 'termos' | 'pagamento' | 'adm';

interface PlanosProps {
  onNavegar?: (tela: any) => void;
  onAssinarPlano?: (planoId: any) => void;
  usuario?: UsuarioLogado | null;
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

export function Planos({ onNavegar, onAssinarPlano, usuario }: PlanosProps) {
  const [config, setConfig] = useState<SupportConfig>(getSupportConfig());
  const [faqs, setFaqs] = useState<FAQEntry[]>(getFAQ());
  const [faqAberto, setFaqAberto] = useState<string | null>(null);

  useEffect(() => {
    const handleSupportUpdate = () => setConfig(getSupportConfig());
    const handleFaqUpdate = () => setFaqs(getFAQ());
    window.addEventListener('support_updated', handleSupportUpdate);
    window.addEventListener('faq_updated', handleFaqUpdate);
    return () => {
      window.removeEventListener('support_updated', handleSupportUpdate);
      window.removeEventListener('faq_updated', handleFaqUpdate);
    };
  }, []);
  const listPlanos = [
    {
      id: 'iniciante',
      nome: 'Iniciante',
      descricao: 'Para quem está começando e quer experimentar',
      mensal: 0,
      anual: 0,
      badgeMensal: 'Grátis para sempre',
      destaque: false,
      recursos: [
        { nome: 'Até 5 receitas cadastradas', incluso: true },
        { nome: 'Ficha técnica básica', incluso: true },
        { nome: 'Custo automático por receita', incluso: true },
        { nome: 'Base TACO integrada', incluso: true },
        { nome: 'Tabela nutricional ANVISA', incluso: false },
        { nome: 'Rótulo e etiqueta', incluso: false },
        { nome: 'Exportação PDF/Excel', incluso: false },
        { nome: '1 usuário', incluso: true },
        { nome: 'Suporte: central de ajuda', incluso: true }
      ]
    },
    {
      id: 'basico',
      nome: 'Básico',
      descricao: 'Para quem já vende e precisa de controle real',
      mensal: 47,
      anual: 39,
      badgeMensal: '',
      destaque: false,
      recursos: [
        { nome: 'Até 20 receitas', incluso: true },
        { nome: 'Ficha técnica padronizada', incluso: true },
        { nome: 'Custo automático + markup', incluso: true },
        { nome: 'Sugestão de preço de venda', incluso: true },
        { nome: 'Tabela nutricional ANVISA', incluso: true },
        { nome: 'Rótulo e etiqueta imprimível', incluso: false },
        { nome: 'Exportação PDF/Excel', incluso: false },
        { nome: '1 usuário', incluso: true },
        { nome: 'Suporte por e-mail', incluso: true }
      ]
    },
    {
      id: 'profissional',
      nome: 'Profissional',
      descricao: 'Para negócios que precisam de rótulo e etiqueta prontos',
      mensal: 97,
      anual: 79,
      badgeMensal: 'Mais escolhido',
      destaque: true,
      recursos: [
        { nome: 'Até 60 receitas', incluso: true },
        { nome: 'Tudo do plano Básico', incluso: true },
        { nome: 'Rótulo nutricional ANVISA', incluso: true },
        { nome: 'Etiqueta personalizável', incluso: true },
        { nome: 'Exportação PDF e Excel', incluso: true },
        { nome: 'Relatório de custo e margem', incluso: true },
        { nome: '1 usuário', incluso: true },
        { nome: 'Suporte por WhatsApp', incluso: true }
      ]
    },
    {
      id: 'premium',
      nome: 'Premium',
      descricao: 'Para operações maiores com múltiplos colaboradores',
      mensal: 147,
      anual: 119,
      badgeMensal: 'Para equipes',
      destaque: false,
      recursos: [
        { nome: 'Receitas ilimitadas', incluso: true },
        { nome: 'Tudo do Profissional', incluso: true },
        { nome: 'Controle de estoque básico', incluso: true },
        { nome: 'Dashboard financeiro', incluso: true },
        { nome: 'Relatórios avançados', incluso: true },
        { nome: 'Importação em lote (CSV)', incluso: true },
        { nome: 'Histórico de alterações', incluso: true },
        { nome: 'Até 5 usuários', incluso: true },
        { nome: 'Suporte prioritário WhatsApp', incluso: true }
      ]
    }
  ];

  return (
    <div className="min-h-[80vh] bg-gray-50 py-16 px-4">

      {/* Cabeçalho */}
      <div className="text-center mb-14 max-w-xl mx-auto">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#04585a] bg-[#04585a]/10 px-4 py-1.5 rounded-full mb-4">
          Planos e Preços
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
          O plano certo para o seu negócio
        </h1>
        <p className="text-base text-gray-500">
          Comece gratuitamente e evolua conforme crescer. Sem surpresas na fatura.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
        {listPlanos.map((plano) => {
          const isPlanoAtual = !!usuario && usuario.planoAtual === plano.id;
          const isGratis = plano.id === 'iniciante';

          let labelBotao: string;
          let handleClick: (() => void) | undefined;
          let desabilitado = false;

          if (isPlanoAtual) {
            labelBotao = 'Plano atual';
            desabilitado = true;
          } else if (!usuario && isGratis) {
            labelBotao = 'Começar agora';
            handleClick = () => onNavegar?.('register');
          } else {
            labelBotao = 'Assinar agora';
            handleClick = () => onAssinarPlano?.(plano.id);
          }

          const economia = (plano.mensal * 12) - (plano.anual * 12);

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
              {plano.badgeMensal && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full text-center">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap ${
                    plano.destaque ? 'bg-white text-[#04585a]' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {plano.destaque && <Sparkles size={12} />}
                    {plano.badgeMensal}
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-1 mt-2">
                {/* Nome do plano */}
                <p className={`text-xl font-bold mb-2 ${plano.destaque ? 'text-white' : 'text-gray-900'}`}>
                  {plano.nome}
                </p>
                <p className={`text-sm mb-6 min-h-[40px] ${plano.destaque ? 'text-white/80' : 'text-gray-500'}`}>
                  {plano.descricao}
                </p>

                {/* Preço */}
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold leading-none ${plano.destaque ? 'text-white' : 'text-gray-900'}`}>
                    R$ {plano.mensal}
                  </span>
                </div>
                <p className={`text-sm ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                  {isGratis ? 'sem cartão de crédito' : '/ mês'}
                </p>
                
                {!isGratis && (
                  <div className="mt-3 flex flex-col gap-1 min-h-[60px]">
                    <div className={`flex items-center gap-2 text-xs ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                      <span>ou</span>
                      <span className={`font-bold text-sm ${plano.destaque ? 'text-white' : 'text-gray-800'}`}>
                        R$ {plano.anual}/mês
                      </span>
                      <span>no anual</span>
                    </div>
                    {economia > 0 && (
                      <span className={`text-xs font-semibold ${plano.destaque ? 'text-green-300' : 'text-green-600'}`}>
                        Economize R$ {economia}
                      </span>
                    )}
                  </div>
                )}
                {isGratis && <div className="mt-3 flex flex-col gap-1 min-h-[60px]" />}
                
                <div className="mb-6" />

                {/* Divisor */}
                <div className={`h-px mb-7 ${plano.destaque ? 'bg-white/15' : 'bg-gray-100'}`} />

                {/* Recursos */}
                <ul className="flex flex-col gap-3 mb-8">
                  {plano.recursos.map((r, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        r.incluso
                          ? (plano.destaque ? 'bg-white/20' : 'bg-[#04585a]/10')
                          : (plano.destaque ? 'bg-white/5' : 'bg-gray-100')
                      }`}>
                        {r.incluso ? (
                          <Check size={10} className={plano.destaque ? 'text-white' : 'text-[#04585a]'} strokeWidth={3} />
                        ) : (
                          <Minus size={10} className={plano.destaque ? 'text-white/30' : 'text-gray-400'} strokeWidth={3} />
                        )}
                      </span>
                      <span className={`${
                        r.incluso 
                          ? (plano.destaque ? 'text-white/85' : 'text-gray-600')
                          : (plano.destaque ? 'text-white/50' : 'text-gray-400')
                      }`}>
                        {r.nome}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Botão */}
                <button
                  onClick={handleClick}
                  disabled={desabilitado}
                  className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 border ${
                    desabilitado
                      ? `cursor-default ${plano.destaque ? 'bg-white/10 text-white/40 border-white/10' : 'bg-gray-100 text-gray-400 border-gray-100'}`
                      : plano.destaque
                        ? 'bg-white text-[#04585a] border-white hover:bg-white/90 cursor-pointer'
                        : 'bg-[#04585a] text-white border-[#04585a] hover:bg-[#04585a]/90 cursor-pointer'
                  }`}
                >
                  {labelBotao}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divisor */}
      <div className="max-w-7xl mx-auto my-16 border-t border-gray-200" />

      {/* FAQ e Suporte Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-orange-50">
              <HelpCircle size={22} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Perguntas Frequentes (FAQ)</h2>
              <p className="text-xs text-gray-500 mt-0.5">Esclareça suas dúvidas rápidas sobre o funcionamento do sistema e planos.</p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma pergunta cadastrada.</p>
            ) : (
              faqs.map((faq) => {
                const isAberto = faqAberto === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isAberto ? 'border-orange-200 shadow-md' : 'border-gray-200 shadow-sm hover:border-gray-300'
                    }`}
                  >
                    <button
                      className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left bg-transparent border-0 cursor-pointer focus:outline-none"
                      onClick={() => setFaqAberto(isAberto ? null : faq.id)}
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className={`self-start text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoriaColors[faq.categoria] || 'bg-gray-100 text-gray-500'}`}>
                          {faq.categoria}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 leading-snug">
                          {faq.pergunta}
                        </span>
                      </div>
                      <span className={`shrink-0 mt-1 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        isAberto ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <ChevronDown size={13} className={`transition-transform duration-200 ${isAberto ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    <div className={`grid transition-all duration-200 ${isAberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                          {faq.resposta}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Canais de Contato / Horários */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50">
                <Mail size={20} className="text-[#04585a]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Canais de Atendimento</h3>
                <p className="text-xs text-gray-400 mt-0.5">Ainda com dúvidas? Fale conosco.</p>
              </div>
            </div>

            <div className="space-y-4">
              {config.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#04585a]/10 shrink-0">
                    <Mail size={15} className="text-[#04585a]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">E-mail</p>
                    <a href={`mailto:${config.email}`} className="text-xs font-semibold text-[#04585a] hover:underline break-all">
                      {config.email}
                    </a>
                  </div>
                </div>
              )}

              {config.whatsapp && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50 shrink-0">
                    <Phone size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp</p>
                    <a
                      href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-green-600 hover:underline"
                    >
                      +{config.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {config.instagram && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 shrink-0">
                    <InstagramIcon size={15} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Instagram</p>
                    <a
                      href={`https://instagram.com/${config.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-purple-600 hover:underline"
                    >
                      @{config.instagram}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Horários */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">Horários de Atendimento</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Segunda a Sexta</span>
                  <span className="font-semibold text-gray-800">{config.horarios.segSex}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Sábado</span>
                  <span className="font-semibold text-gray-800">{config.horarios.sabado}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Dom. e Feriados</span>
                  <span className="font-semibold text-gray-800">{config.horarios.domingoFeriado}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
