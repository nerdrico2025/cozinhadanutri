import { useState } from 'react';
import { 
  ChefHat, 
  DollarSign, 
  Calculator, 
  Printer, 
  Trash2, 
  Pencil, 
  UtensilsCrossed, 
  TrendingUp, 
  CalendarDays, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Scale,
  Info,
  Layers,
  Trash
} from 'lucide-react';
import { Receita } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ListaReceitasProps {
  receitas: Receita[];
  onEditar?: (receita: Receita) => void;
  onRemover: (id: string, senha?: string) => void;
  onGerarRotulo?: (receita: Receita) => void;
}

export function ListaReceitas({ receitas, onEditar, onRemover, onGerarRotulo }: ListaReceitasProps) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; recipeId: string | null; recipeName: string }>({
    isOpen: false,
    recipeId: null,
    recipeName: ''
  });

  const filtradas = query.trim()
    ? receitas.filter((r) =>
        r.nome.toLowerCase().includes(query.toLowerCase()) ||
        r.descricao?.toLowerCase().includes(query.toLowerCase())
      )
    : receitas;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (receitas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-20 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-5 rounded-3xl bg-teal-50 text-teal-500">
            <ChefHat size={48} strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Sua cozinha está vazia</h3>
        <p className="text-gray-500 max-w-xs mx-auto">Crie sua primeira receita para começar a organizar sua produção e precificar com precisão.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Minhas Receitas</h2>
            <p className="text-xs text-gray-500 font-medium">
              {filtradas.length} {filtradas.length === 1 ? 'receita encontrada' : 'receitas encontradas'}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {filtradas.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-12 text-center">
          <p className="text-gray-500">
            Nenhuma receita encontrada para <span className="font-bold text-teal-600">"{query}"</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtradas.map((receita) => {
          const isExpanded = expandedId === receita.id;
          
          return (
            <div 
              key={receita.id} 
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'border-teal-200 shadow-md ring-1 ring-teal-100' : 'border-gray-100 shadow-sm hover:border-teal-100 hover:shadow-md'
              }`}
            >
              {/* Collapsed Header */}
              <div 
                onClick={() => toggleExpand(receita.id!)}
                className="p-5 cursor-pointer flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <UtensilsCrossed size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-bold text-gray-800 truncate">{receita.nome}</h3>
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {receita.porcoes} {receita.porcoes === 1 ? 'PORÇÃO' : 'PORÇÕES'}
                      </span>
                    </div>
                    {receita.descricao && (
                      <p className="text-sm text-gray-500 truncate max-w-md">{receita.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <TrendingUp size={14} className="text-teal-500" />
                        Margem: <span className="text-gray-700">{receita.margemLucro}%</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <CalendarDays size={14} />
                        {new Date(receita.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço Sugerido</span>
                    <span className="text-lg font-black text-teal-600">R$ {receita.precoSugerido.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {onEditar && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditar(receita); }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-colors border-0 bg-transparent"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setDeleteModal({
                          isOpen: true,
                          recipeId: receita.id!,
                          recipeName: receita.nome
                        });
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border-0 bg-transparent"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-teal-50 text-teal-600' : 'text-gray-300'}`}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-gray-100 mb-6" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Ingredients */}
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Scale size={16} className="text-teal-500" />
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Ingredientes</h4>
                      </div>
                      <div className="space-y-2">
                        {receita.ingredientes.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-700">{item.nome}</span>
                              <span className="text-[10px] text-gray-400 font-medium">R$ {item.preco.toFixed(2)} / 100g</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-teal-600">{item.quantidade}g</span>
                              <span className="text-[10px] text-gray-400 font-medium">R$ {((item.quantidade / 100) * item.preco).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {onGerarRotulo && (
                        <button
                          onClick={() => onGerarRotulo(receita)}
                          style={{ backgroundColor: '#f49100' }}
                          className="w-full mt-6 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-orange-200 border-0 cursor-pointer"
                        >
                          <Printer size={18} />
                          Gerar Rótulo Nutricional
                        </button>
                      )}
                    </div>

                    {/* Right Column: Detailed Info Panels */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Precificação Panel */}
                      <div className="bg-teal-50/50 rounded-2xl p-6 border border-teal-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-teal-800 uppercase tracking-wider">
                            <DollarSign size={16} /> Precificação
                          </h4>
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-1 rounded-full uppercase">Cálculos Financeiros</span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-50">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custo Total</p>
                              <p className="text-base font-black text-gray-800">R$ {receita.custoTotal.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-50">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custo / Porção</p>
                              <p className="text-base font-black text-gray-800">R$ {receita.custoPorPorcao.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-50">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lucro / Porção</p>
                              <p className="text-base font-black text-teal-600">R$ {(receita.precoSugerido - receita.custoPorPorcao).toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-50">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lucro Total</p>
                              <p className="text-base font-black text-teal-600">R$ {(receita.precoSugerido * receita.porcoes - receita.custoTotal).toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="bg-teal-600 p-5 rounded-2xl shadow-lg shadow-teal-600/20 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-teal-100 uppercase tracking-widest mb-0.5">Valor de Venda Sugerido</p>
                              <p className="text-sm text-teal-50/70 font-medium">Considerando {receita.margemLucro}% de margem de lucro</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-white">R$ {receita.precoSugerido.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Nutritional Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Receita Completa */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                            <Calculator size={16} className="text-blue-500" /> Receita Completa
                          </h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Valor Energético', value: `${(receita.dadosNutricionaisTotais?.calorias ?? 0).toFixed(0)} kcal`, color: 'blue' },
                              { label: 'Proteínas', value: `${(receita.dadosNutricionaisTotais?.proteinas ?? 0).toFixed(1)}g`, color: 'emerald' },
                              { label: 'Carboidratos', value: `${(receita.dadosNutricionaisTotais?.carboidratos ?? 0).toFixed(1)}g`, color: 'amber' },
                              { label: 'Gorduras Totais', value: `${(receita.dadosNutricionaisTotais?.gorduras ?? 0).toFixed(1)}g`, color: 'rose' },
                              { label: 'Sódio', value: `${(receita.dadosNutricionaisTotais?.sodio ?? 0).toFixed(0)}mg`, color: 'slate' },
                            ].map((nutri) => (
                              <div key={nutri.label} className="flex items-center justify-between group">
                                <span className="text-xs font-medium text-gray-500">{nutri.label}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1 bg-gray-50 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${nutri.color}-400 opacity-30`} style={{ width: '60%' }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 min-w-[60px] text-right">{nutri.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Por Porção */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                            <Info size={16} className="text-orange-500" /> Por Porção
                          </h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Valor Energético', value: `${(receita.dadosNutricionaisPorPorcao?.calorias ?? 0).toFixed(0)} kcal`, color: 'orange' },
                              { label: 'Proteínas', value: `${(receita.dadosNutricionaisPorPorcao?.proteinas ?? 0).toFixed(1)}g`, color: 'emerald' },
                              { label: 'Carboidratos', value: `${(receita.dadosNutricionaisPorPorcao?.carboidratos ?? 0).toFixed(1)}g`, color: 'amber' },
                              { label: 'Gorduras Totais', value: `${(receita.dadosNutricionaisPorPorcao?.gorduras ?? 0).toFixed(1)}g`, color: 'rose' },
                              { label: 'Sódio', value: `${(receita.dadosNutricionaisPorPorcao?.sodio ?? 0).toFixed(0)}mg`, color: 'slate' },
                            ].map((nutri) => (
                              <div key={nutri.label} className="flex items-center justify-between group">
                                <span className="text-xs font-medium text-gray-500">{nutri.label}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1 bg-gray-50 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${nutri.color}-400 opacity-30`} style={{ width: '40%' }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 min-w-[60px] text-right">{nutri.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
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
        onConfirm={(senha) => {
          if (deleteModal.recipeId) {
            onRemover(deleteModal.recipeId, senha);
            setDeleteModal({ isOpen: false, recipeId: null, recipeName: '' });
          }
        }}
        title="Excluir Receita"
        message={`Tem certeza que deseja remover a receita "${deleteModal.recipeName}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir"
        cancelText="Manter receita"
        requirePassword={true}
      />
    </div>
  );
}
