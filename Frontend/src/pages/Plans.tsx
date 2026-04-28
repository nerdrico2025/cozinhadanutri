import { Check, Sparkles } from 'lucide-react';
import { UsuarioLogado } from '../types';
import React, { useState, useEffect } from 'react';
import { getPlans, Plano as PlanoLabel } from '../services/planService';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'login' | 'register' | 'planos' | 'faq' | 'suporte' | 'termos' | 'pagamento' | 'adm';

interface PlanosProps {
  onNavegar?: (tela: TelaAtiva) => void;
  onAssinarPlano?: (planoId: 'profissional' | 'empresarial') => void;
  usuario?: UsuarioLogado | null;
}


export function Planos({ onNavegar, onAssinarPlano, usuario }: PlanosProps) {
  const [planosData, setPlanosData] = useState(getPlans());

  useEffect(() => {
    const handleUpdate = () => setPlanosData(getPlans());
    window.addEventListener('plans_updated', handleUpdate);
    return () => window.removeEventListener('plans_updated', handleUpdate);
  }, []);

  const listPlanos = [
    { id: 'gratis',       nome: 'Grátis',       data: planosData['Grátis'],       destaque: false },
    { id: 'profissional', nome: 'Profissional', data: planosData['Profissional'], destaque: true },
    { id: 'empresarial',  nome: 'Empresarial',  data: planosData['Empresarial'],  destaque: false },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {listPlanos.map((plano) => {
          const isPlanoAtual = !!usuario && usuario.planoAtual === plano.id;
          const isGratis = plano.id === 'gratis';
          const data = plano.data;

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
            handleClick = () => onAssinarPlano?.(plano.id as 'profissional' | 'empresarial');
          }

          const economia = (data.mensal * 12) - (data.anual * 12);

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
              {plano.destaque && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-white text-[#04585a] text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    <Sparkles size={12} />
                    Mais popular
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col flex-1">
                {/* Nome do plano */}
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                  {plano.nome}
                </p>

                {/* Preço */}
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold leading-none ${plano.destaque ? 'text-white' : 'text-gray-900'}`}>
                    R$ {data.mensal}
                  </span>
                </div>
                <p className={`text-sm ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                  {isGratis ? 'para sempre' : '/ mês'}
                </p>
                {!isGratis && (
                  <div className="mt-3 flex flex-col gap-1">
                    <div className={`flex items-center gap-2 text-xs ${plano.destaque ? 'text-white/60' : 'text-gray-400'}`}>
                      <span>ou</span>
                      <span className={`font-bold text-sm ${plano.destaque ? 'text-white' : 'text-gray-800'}`}>
                        R$ {data.anual}/mês
                      </span>
                      <span>no plano anual</span>
                    </div>
                    <p className={`text-xs ${plano.destaque ? 'text-white/50' : 'text-gray-400'}`}>
                      R$ {data.anual * 12} cobrado uma vez
                    </p>
                    {economia > 0 && (
                      <span className={`text-xs font-semibold ${plano.destaque ? 'text-green-300' : 'text-green-600'}`}>
                        Economize R$ {economia} vs. mensal
                      </span>
                    )}
                  </div>
                )}
                <div className="mb-6" />

                {/* Divisor */}
                <div className={`h-px mb-7 ${plano.destaque ? 'bg-white/15' : 'bg-gray-100'}`} />

                {/* Recursos */}
                <ul className="flex flex-col gap-3 mb-8">
                  {data.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        plano.destaque ? 'bg-white/20' : 'bg-[#04585a]/10'
                      }`}>
                        <Check size={10} className={plano.destaque ? 'text-white' : 'text-[#04585a]'} strokeWidth={3} />
                      </span>
                      <span className={plano.destaque ? 'text-white/85' : 'text-gray-600'}>{r}</span>
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

      {/* Rodapé informativo */}
      <p className="text-center text-xs text-gray-400 mt-10">
        Todos os planos incluem suporte por e-mail. Cancele quando quiser, sem multas.
      </p>
    </div>
  );
}
