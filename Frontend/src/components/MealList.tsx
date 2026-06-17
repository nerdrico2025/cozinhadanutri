import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Printer, 
  DollarSign, 
  Layers, 
  CalendarDays, 
  ChefHat,
  UtensilsCrossed,
  Info,
  PackageOpen,
  AlertCircle
} from 'lucide-react';
import { Refeicao, Receita } from '../types';
import { ConfirmModal } from './ConfirmModal';

const obterTextoAlergicosRef = (ref: Refeicao) => {
  const listaDireta: string[] = [];
  if (ref.alergicos?.leite) listaDireta.push('Leite');
  if (ref.alergicos?.ovo) listaDireta.push('Ovo');
  if (ref.alergicos?.trigo) listaDireta.push('Trigo');
  if (ref.alergicos?.soja) listaDireta.push('Soja');
  if (ref.alergicos?.peixe) listaDireta.push('Peixe');
  if (ref.alergicos?.amendoim) listaDireta.push('Amendoim');
  if (ref.alergicos?.castanhas) listaDireta.push('Castanhas');

  const listaPodeConter: string[] = [];
  if (ref.podeConter?.leite) listaPodeConter.push('Leite');
  if (ref.podeConter?.ovo) listaPodeConter.push('Ovo');
  if (ref.podeConter?.trigo) listaPodeConter.push('Trigo');
  if (ref.podeConter?.soja) listaPodeConter.push('Soja');
  if (ref.podeConter?.peixe) listaPodeConter.push('Peixe');
  if (ref.podeConter?.amendoim) listaPodeConter.push('Amendoim');
  if (ref.podeConter?.castanhas) listaPodeConter.push('Castanhas');

  return { listaDireta, listaPodeConter };
};

interface MealListProps {
  refeicoes: Refeicao[];
  receitasDisponiveis: Receita[];
  onEditar?: (refeicao: Refeicao) => void;
  onRemover: (id: string) => void;
  onGerarRotulo?: (refeicao: Refeicao) => void;
  onNovaRefeicao?: () => void;
}

export function MealList({ refeicoes, receitasDisponiveis, onEditar, onRemover, onGerarRotulo, onNovaRefeicao }: MealListProps) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; mealId: string | null; mealName: string }>({
    isOpen: false,
    mealId: null,
    mealName: ''
  });

  const filtradas = query.trim()
    ? refeicoes.filter((r) =>
        r.nome.toLowerCase().includes(query.toLowerCase()) ||
        r.descricao?.toLowerCase().includes(query.toLowerCase())
      )
    : refeicoes;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (refeicoes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-20 text-center max-w-3xl mx-auto mt-6 flex flex-col items-center justify-center">
        <div className="p-6 rounded-full bg-[#04585a]/5 text-[#04585a] mb-6">
          <UtensilsCrossed size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-3">Nenhuma refeição cadastrada</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">Monte sua primeira marmita combinando receitas, embalagens e calculando seu custo real.</p>
        {onNovaRefeicao && receitasDisponiveis.length > 0 && (
          <button
            onClick={onNovaRefeicao}
            className="px-8 py-3 bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm rounded-xl border-0 cursor-pointer shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
          >
            Criar Nova Refeição
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 px-4 mt-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#04585a]/10 rounded-xl text-[#04585a]">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Minhas Refeições e Marmitas</h2>
            <p className="text-xs text-gray-500 font-medium">
              {filtradas.length} {filtradas.length === 1 ? 'refeição encontrada' : 'refeições encontradas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#04585a]/20 focus:border-[#04585a] focus:bg-white transition-all placeholder-gray-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0 focus:outline-none"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {onNovaRefeicao && receitasDisponiveis.length > 0 && (
            <button
              onClick={onNovaRefeicao}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm rounded-xl border-0 cursor-pointer shadow-sm transition whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Criar Refeição</span>
            </button>
          )}
        </div>
      </div>

      {filtradas.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-12 text-center">
          <p className="text-gray-500">
            Nenhuma refeição encontrada para <span className="font-bold text-[#04585a]">"{query}"</span>
          </p>
        </div>
      )}

      {/* Meals Grid */}
      <div className="flex flex-col gap-3">
        {filtradas.map((refeicao) => {
          const isExpanded = expandedId === refeicao.id;
          const custoOperacionalVal = refeicao.custoOperacional || 0;
          const precoSugeridoVal = refeicao.precoSugerido || 0;
          const custoTotalReal = refeicao.custoTotal + custoOperacionalVal;
          const lucroEstimado = precoSugeridoVal - custoTotalReal;
          
          return (
            <div 
              key={refeicao.id} 
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded 
                  ? 'border-[#04585a]/30 shadow-md ring-1 ring-[#04585a]/10' 
                  : 'border-gray-100 shadow-sm hover:border-[#04585a]/20 hover:shadow-md'
              }`}
            >
              {/* Summary Bar */}
              <div 
                onClick={() => toggleExpand(refeicao.id)}
                className="p-5 cursor-pointer flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-[#04585a] text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <PackageOpen size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-bold text-gray-800 truncate">{refeicao.nome}</h3>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">
                        {refeicao.receitas.length} {refeicao.receitas.length === 1 ? 'RECEITA' : 'RECEITAS'}
                      </span>
                    </div>
                    {refeicao.descricao && (
                      <p className="text-xs text-gray-400 truncate max-w-md">{refeicao.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                        <DollarSign size={13} className="text-[#04585a]" />
                        Custo Insumos: <span className="text-gray-700 font-bold">R$ {refeicao.custoTotal.toFixed(2)}</span>
                      </span>
                      {custoOperacionalVal > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                          Operacional: <span className="text-gray-700 font-bold">R$ {custoOperacionalVal.toFixed(2)}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                        <CalendarDays size={13} />
                        Criado em: <span className="text-gray-700 font-bold">{refeicao.createdAt ? new Date(refeicao.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                      </span>
                      {refeicao.dataValidade && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                          <AlertCircle size={13} className="text-amber-500" strokeWidth={2.5} />
                          Validade: <span className="text-[#c17900] font-extrabold">{new Date(refeicao.dataValidade + "T12:00:00").toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço Sugerido</span>
                    <span className="text-lg font-black text-[#04585a]">R$ {precoSugeridoVal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(refeicao.id); }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm cursor-pointer"
                    >
                      <Info size={14} className={isExpanded ? "text-[#04585a]" : "text-gray-400"} />
                      {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    </button>
                    
                    <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
                      {onEditar && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditar(refeicao); }}
                          className="p-2 rounded-lg text-gray-400 hover:bg-[#04585a]/10 hover:text-[#04585a] transition-colors border-0 bg-transparent cursor-pointer"
                          title="Editar refeição"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setDeleteModal({
                            isOpen: true,
                            mealId: refeicao.id,
                            mealName: refeicao.nome
                          });
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border-0 bg-transparent cursor-pointer"
                        title="Excluir refeição"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={`p-2 rounded-lg transition-colors sm:hidden ${isExpanded ? 'bg-[#04585a]/10 text-[#04585a]' : 'text-gray-300'}`}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              {isExpanded && (
                <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-gray-100 mb-5" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Constituent Recipes */}
                    <div className="lg:col-span-5">
                      <div className="flex items-center gap-2 mb-3">
                        <ChefHat size={15} className="text-[#04585a]" />
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Receitas e Insumos Integrantes</h4>
                      </div>
                      <div className="space-y-2">
                        {refeicao.receitas.map((rec, idx) => {
                          const recCusto = rec.custoPorPorcao * (rec.porcoesUtilizadas || rec.quantidadeUtilizada || 0);
                          const recPercent = refeicao.custoTotal > 0 ? (recCusto / refeicao.custoTotal) * 100 : 0;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100/50">
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-bold text-gray-700 truncate">{rec.nome}</span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  Custo Base: R$ {rec.custoPorPorcao.toFixed(2)} / porção
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                                  Custo Proporcional: <span className="text-[#04585a] font-bold">R$ {recCusto.toFixed(2)}</span> ({recPercent.toFixed(1)}% do custo)
                                </span>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <span className="text-xs font-black text-[#04585a]">
                                  {rec.quantidadeUtilizada} {rec.unidadeMedida === 'porcoes' ? 'porção(ões)' : rec.unidadeMedida}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Embalagens integradas */}
                        {refeicao.embalagens && refeicao.embalagens.filter(e => e.checked).map((emb) => {
                          const embCusto = (emb.quantidade || 0) * (emb.custoUnitario || 0);
                          const embPercent = refeicao.custoTotal > 0 ? (embCusto / refeicao.custoTotal) * 100 : 0;
                          return (
                            <div key={emb.id} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100/50">
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-bold text-gray-700 truncate">{emb.nome}</span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  Custo Unitário: R$ {emb.custoUnitario.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                                  Custo Proporcional: <span className="text-[#04585a] font-bold">R$ {embCusto.toFixed(2)}</span> ({embPercent.toFixed(1)}% do custo)
                                </span>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <span className="text-xs font-bold text-[#04585a]">
                                  {emb.quantidade} un.
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bloco de Alergênicos */}
                      <div className="mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Restrições e Alergênicos</span>
                        
                        <div className="flex flex-wrap gap-2">
                          {refeicao.contemGluten ? (
                            <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded-md border border-red-100">Contém Glúten</span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md border border-emerald-100">Não Contém Glúten</span>
                          )}

                          {refeicao.contemLactose ? (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md border border-amber-100">Contém Lactose</span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md border border-emerald-100">Não Contém Lactose</span>
                          )}
                        </div>

                        {(() => {
                          const { listaDireta, listaPodeConter } = obterTextoAlergicosRef(refeicao);
                          return (
                            <div className="space-y-1.5 text-xs">
                              {listaDireta.length > 0 && (
                                <p className="text-gray-600">
                                  <strong className="text-red-600 font-bold uppercase text-[10px]">Contém: </strong> 
                                  {listaDireta.join(', ')}
                                </p>
                              )}
                              {listaPodeConter.length > 0 && (
                                <p className="text-gray-600">
                                  <strong className="text-amber-600 font-bold uppercase text-[10px]">Pode Conter: </strong> 
                                  {listaPodeConter.join(', ')}
                                </p>
                              )}
                              {refeicao.outrosAlergenicos && (
                                <p className="text-gray-600">
                                  <strong className="text-gray-500 font-bold uppercase text-[10px]">Outros: </strong> 
                                  {refeicao.outrosAlergenicos}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {onGerarRotulo && (
                        <button
                          onClick={() => onGerarRotulo(refeicao)}
                          style={{ backgroundColor: '#f49100' }}
                          className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-bold text-xs hover:brightness-105 transition shadow-sm border-0 cursor-pointer"
                        >
                          <Printer size={15} />
                          Gerar Rótulo Nutricional
                        </button>
                      )}
                    </div>

                    {/* Pricing Breakdown & Analysis */}
                    <div className="lg:col-span-7 flex flex-col gap-5">
                      
                      <div className="bg-[#04585a]/5 rounded-2xl p-5 border border-[#04585a]/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="flex items-center gap-2 text-xs font-bold text-[#04585a] uppercase tracking-wider">
                            <DollarSign size={15} /> Análise de Precificação e Custos
                          </h4>
                          <span className="text-[9px] font-bold bg-[#04585a]/10 text-[#04585a] px-2 py-0.5 rounded-full uppercase">Métricas Reais</span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#04585a]/5 text-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Custo Insumos</p>
                              <p className="text-sm font-bold text-gray-700">R$ {refeicao.custoTotal.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#04585a]/5 text-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Custo Operacional</p>
                              <p className="text-sm font-bold text-gray-700">R$ {custoOperacionalVal.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#04585a]/5 text-center col-span-2 md:col-span-1">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Custo Total Real</p>
                              <p className="text-sm font-black text-gray-900">R$ {custoTotalReal.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#04585a]/5 text-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Lucro Unitário</p>
                              <p className="text-sm font-extrabold text-emerald-600">R$ {lucroEstimado.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#04585a]/5 text-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Margem Real</p>
                              <p className="text-sm font-extrabold text-teal-600">
                                {precoSugeridoVal > 0 ? ((lucroEstimado / precoSugeridoVal) * 100).toFixed(1) : '0.0'}%
                              </p>
                            </div>
                            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-[#04585a]/5 text-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Markup (Margem)</p>
                              <p className="text-sm font-extrabold text-gray-800">{refeicao.margemLucro || 0}%</p>
                            </div>
                          </div>

                          {(() => {
                            const cmvCustoTotal = refeicao.custoTotal + (refeicao.custoOperacional || 0);
                            const cmvPercent = precoSugeridoVal > 0 ? (cmvCustoTotal / precoSugeridoVal) * 100 : 0;
                            let statusCMV = "CMV Aceitável";
                            let statusIcon = "";
                            if (cmvPercent < 28) {
                              statusCMV = "CMV Ótimo";
                              statusIcon = "✅ ";
                            } else if (cmvPercent > 35) {
                              statusCMV = "CMV Alto / Alerta";
                              statusIcon = "⚠️ ";
                            }
                            return (
                              <div className="bg-[#04585a] p-4 rounded-xl flex items-center justify-between text-white shadow-sm">
                                <div>
                                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mb-0.5">Preço Final Sugerido</p>
                                  <p className="text-[9px] text-teal-50/70 font-medium">
                                    {statusIcon}{statusCMV} de {cmvPercent.toFixed(1)}%
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-black">R$ {precoSugeridoVal.toFixed(2)}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Tabela Nutricional por Porção */}
                      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-1">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                          <Info size={14} className="text-[#04585a]" /> Informação Nutricional (Total por Marmita)
                        </h4>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'Calorias', value: refeicao.dadosNutricionaisTotais?.calorias ?? 0, unit: 'kcal', decimals: 0, classes: 'bg-orange-50/40 border-orange-100/30 text-orange-600' },
                            { label: 'Carboidratos', value: refeicao.dadosNutricionaisTotais?.carboidratos ?? 0, unit: 'g', decimals: 1, classes: 'bg-amber-50/40 border-amber-100/30 text-amber-600' },
                            { label: 'Açúcares Totais', value: refeicao.dadosNutricionaisTotais?.acucares_totais ?? 0, unit: 'g', decimals: 1, classes: 'bg-pink-50/40 border-pink-100/30 text-pink-600' },
                            { label: 'Açúcares Adic.', value: refeicao.dadosNutricionaisTotais?.acucares_adicionados ?? 0, unit: 'g', decimals: 1, classes: 'bg-pink-50/40 border-pink-100/30 text-pink-600' },
                            { label: 'Proteínas', value: refeicao.dadosNutricionaisTotais?.proteinas ?? 0, unit: 'g', decimals: 1, classes: 'bg-emerald-50/40 border-emerald-100/30 text-emerald-600' },
                            { label: 'Gorduras Totais', value: refeicao.dadosNutricionaisTotais?.gorduras ?? 0, unit: 'g', decimals: 1, classes: 'bg-rose-50/40 border-rose-100/30 text-rose-600' },
                            { label: 'Gord. Saturadas', value: refeicao.dadosNutricionaisTotais?.gorduras_saturadas ?? 0, unit: 'g', decimals: 1, classes: 'bg-rose-50/40 border-rose-100/30 text-rose-600' },
                            { label: 'Gorduras Trans', value: refeicao.dadosNutricionaisTotais?.gorduras_trans ?? 0, unit: 'g', decimals: 1, classes: 'bg-rose-50/40 border-rose-100/30 text-rose-600' },
                            { label: 'Fibras Alimentares', value: refeicao.dadosNutricionaisTotais?.fibras ?? 0, unit: 'g', decimals: 1, classes: 'bg-emerald-50/40 border-emerald-100/30 text-emerald-600' },
                            { label: 'Sódio', value: refeicao.dadosNutricionaisTotais?.sodio ?? 0, unit: 'mg', decimals: 0, classes: 'bg-slate-50/60 border-slate-200/40 text-slate-600' },
                            { label: 'Vitaminas', value: refeicao.dadosNutricionaisTotais?.vitaminas ?? 0, unit: 'g', decimals: 1, classes: 'bg-violet-50/40 border-violet-100/30 text-violet-600' },
                            { label: 'Minerais', value: refeicao.dadosNutricionaisTotais?.minerais ?? 0, unit: 'g', decimals: 1, classes: 'bg-indigo-50/40 border-indigo-100/30 text-indigo-600' },
                          ].map((nutri, idx) => (
                            <div key={idx} className={`${nutri.classes} p-2.5 rounded-xl border text-center`}>
                              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{nutri.label}</p>
                              <p className="text-sm font-black">{nutri.value.toFixed(nutri.decimals)} {nutri.unit}</p>
                            </div>
                          ))}
                        </div>
                      </div>


                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => {
          if (deleteModal.mealId) {
            onRemover(deleteModal.mealId);
            setDeleteModal({ isOpen: false, mealId: null, mealName: '' });
          }
        }}
        title="Excluir Refeição"
        message={`Tem certeza que deseja remover a refeição "${deleteModal.mealName}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir"
        cancelText="Manter refeição"
        requirePassword={false}
      />
    </div>
  );
}
