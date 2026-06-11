import { useState } from 'react';
import { 
  Trash2, Edit3, Package, DollarSign, Flame, Beef, Wheat, 
  Droplets, Search, X, ChevronDown, ChevronUp, Info, 
  Activity, Scale, AlertTriangle
} from 'lucide-react';
import { Ingrediente } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ListaIngredientesProps {
  ingredientes: Ingrediente[];
  onEditar?: (ingrediente: Ingrediente) => void;
  onRemover: (id: string, senha?: string) => void;
}

const resumoNutrientes = [
  { key: 'calorias' as const, label: 'Calorias', suffix: 'kcal', Icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'proteinas' as const, label: 'Proteínas', suffix: 'g', Icon: Beef, color: 'text-red-500', bg: 'bg-red-50' },
  { key: 'carboidratos' as const, label: 'Carboidratos', suffix: 'g', Icon: Wheat, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'gorduras' as const, label: 'Gorduras', suffix: 'g', Icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
];

const todosNutrientes = [
  { key: 'calorias', label: 'Valor Energético', unit: 'kcal', Icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'carboidratos', label: 'Carboidratos', unit: 'g', Icon: Wheat, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'acucares_totais', label: 'Açúcares Totais', unit: 'g', Icon: Wheat, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'acucares_adicionados', label: 'Açúc. Adicionados', unit: 'g', Icon: Wheat, color: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'proteinas', label: 'Proteínas', unit: 'g', Icon: Beef, color: 'text-rose-500', bg: 'bg-rose-50' },
  { key: 'gorduras', label: 'Gorduras Totais', unit: 'g', Icon: Droplets, color: 'text-sky-500', bg: 'bg-sky-50' },
  { key: 'gorduras_saturadas', label: 'Gord. Saturadas', unit: 'g', Icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'gorduras_trans', label: 'Gorduras Trans', unit: 'g', Icon: Droplets, color: 'text-sky-700', bg: 'bg-sky-50' },
  { key: 'fibras', label: 'Fibras Alimentares', unit: 'g', Icon: Wheat, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'sodio', label: 'Sódio', unit: 'mg', Icon: Activity, color: 'text-gray-500', bg: 'bg-gray-100' },
  { key: 'vitaminas', label: 'Vitaminas', unit: 'g', Icon: Info, color: 'text-purple-500', bg: 'bg-purple-50' },
  { key: 'minerais', label: 'Minerais', unit: 'g', Icon: Scale, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export function ListaIngredientes({ ingredientes, onEditar, onRemover }: ListaIngredientesProps) {
  const [query, setQuery] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [itemParaRemover, setItemParaRemover] = useState<Ingrediente | null>(null);

  const [itensEstoque, setItensEstoque] = useState<any[]>(() => {
    try {
      const salvas = localStorage.getItem('estoque_itens');
      return salvas ? JSON.parse(salvas) : [];
    } catch {
      return [];
    }
  });

  // Sync state if user opens page or database updates
  const recarregarEstoque = () => {
    try {
      const salvas = localStorage.getItem('estoque_itens');
      setItensEstoque(salvas ? JSON.parse(salvas) : []);
    } catch {}
  };

  const itemEstoqueParaRemover = itemParaRemover
    ? itensEstoque.find((item: any) => 
        (itemParaRemover.tacoId && item.tacoId === itemParaRemover.tacoId) ||
        (item.nome.toLowerCase() === itemParaRemover.nome.toLowerCase())
      )
    : null;

  const iniciarRemocao = (ingrediente: Ingrediente) => {
    recarregarEstoque();
    setItemParaRemover(ingrediente);
  };

  const filtrados = query.trim()
    ? ingredientes.filter((i) => i.nome.toLowerCase().includes(query.toLowerCase()))
    : ingredientes;

  const toggleExpandir = (id: string) => {
    setExpandido(expandido === id ? null : id);
  };

  const confirmarRemocao = (senha?: string) => {
    if (itemParaRemover) {
      if (itemEstoqueParaRemover) {
        const updatedEstoque = itensEstoque.filter((item: any) => item.id !== itemEstoqueParaRemover.id);
        localStorage.setItem('estoque_itens', JSON.stringify(updatedEstoque));
        setItensEstoque(updatedEstoque);
      }

      onRemover(itemParaRemover.id, senha);
      setItemParaRemover(null);
    }
  };

  if (ingredientes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-8 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gray-50">
            <Package size={40} className="text-gray-300" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-gray-500 mb-1">Nenhum ingrediente cadastrado</h3>
        <p className="text-sm text-gray-400">Cadastre seus primeiros ingredientes para começar a criar receitas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* Barra de Busca e Título */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        {/* Lado Esquerdo: Título */}
        <div className="flex items-center gap-3 lg:w-1/4 shrink-0">
          <div className="p-2.5 bg-teal-50 rounded-2xl">
            <Package size={22} className="text-teal-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-black text-gray-800 leading-tight truncate">Meus Ingredientes</h2>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Total: {ingredientes.length}</p>
          </div>
        </div>

        {/* Centro: Busca */}
        <div className="flex-1 flex justify-center">
          <div className="relative group w-full max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-teal-500" />
            <input
              type="text"
              placeholder="Encontre um ingrediente pelo nome..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 text-sm rounded-2xl border-0 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:shadow-lg focus:shadow-teal-500/5 transition-all placeholder:text-gray-400 font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer p-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Lado Direito: Espaçador para manter o centro (ou futuras ações) */}
        <div className="hidden lg:flex lg:w-1/4 justify-end">
          {/* Espaço reservado para manter o equilíbrio visual */}
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="grid gap-3">
        {filtrados.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
            <p className="text-gray-400 text-sm">Nenhum ingrediente encontrado para "{query}"</p>
          </div>
        ) : (
          filtrados.map((ingrediente) => {
            const isExpandido = expandido === ingrediente.id;
            
            return (
              <div 
                key={ingrediente.id} 
                className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpandido 
                    ? 'border-teal-500/30 shadow-md ring-1 ring-teal-500/5' 
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-teal-500/20'
                }`}
              >
                {/* Linha Principal */}
                <div 
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 cursor-pointer select-none"
                  onClick={() => toggleExpandir(ingrediente.id)}
                >
                  {/* Nome e Badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800 truncate group-hover:text-teal-600 transition-colors">
                        {ingrediente.nome}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full shrink-0">
                        {ingrediente.unidade}
                      </span>
                    </div>
                    
                    {/* Resumo Nutricional Rápido */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {resumoNutrientes.map(({ key, label, suffix, Icon, color }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <Icon size={12} className={`${color} opacity-70`} />
                          <span className="text-[11px] text-gray-500">
                            <span className="font-medium text-gray-700">
                              {ingrediente.dadosNutricionais[key as keyof typeof ingrediente.dadosNutricionais]}
                            </span>
                            {suffix}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preço e Ações */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-gray-50">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Preço</span>
                      {(() => {
                        const itensEstoqueRaw = localStorage.getItem('estoque_itens');
                        let itensEstoque = [];
                        try {
                          itensEstoque = itensEstoqueRaw ? JSON.parse(itensEstoqueRaw) : [];
                        } catch {
                          itensEstoque = [];
                        }
                        
                        const itemEstoque = itensEstoque.find((item: any) => 
                          (ingrediente.tacoId && item.tacoId === ingrediente.tacoId) ||
                          (item.nome.toLowerCase() === ingrediente.nome.toLowerCase())
                        );

                        let labelUnidade: string = ingrediente.unidade;
                        if (labelUnidade === 'unidade' || labelUnidade === 'un') labelUnidade = 'und';
                        else if (labelUnidade === 'l') labelUnidade = 'L';

                        if (itemEstoque && itemEstoque.lotes && itemEstoque.lotes.length > 0) {
                          const lotesValidos = itemEstoque.lotes.filter((l: any) => l.quantidadeOriginal > 0);
                          if (lotesValidos.length > 0) {
                            const totalPago = lotesValidos.reduce((acc: number, l: any) => {
                              const bUn = ingrediente.unidade;
                              const fator = (bUn === 'kg' || bUn === 'l' || bUn === 'unidade' || bUn === 'un')
                                ? l.quantidadeOriginal
                                : (l.quantidadeOriginal / 100);
                              return acc + (fator * l.custoUnitario);
                            }, 0);

                            return (
                              <>
                                <span className="text-sm font-black text-emerald-600">
                                  R$ {ingrediente.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </span>
                                <span className="text-[11px] text-gray-500 font-semibold mt-0.5">
                                  Total em estoque: R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </>
                            );
                          }
                        }
                        return (
                          <>
                            <span className="text-sm font-black text-emerald-600">
                              R$ {ingrediente.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                              Sem lote em estoque
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditar && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditar(ingrediente); }}
                          className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all border-0 bg-transparent cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          iniciarRemocao(ingrediente);
                        }}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border-0 bg-transparent cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={`p-1.5 rounded-lg transition-transform duration-300 ${isExpandido ? 'rotate-180 bg-teal-50 text-teal-600' : 'text-gray-300'}`}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes Expandidos (Dropdown) */}
                <div className={`transition-all duration-300 ease-in-out ${isExpandido ? 'max-h-[800px] border-t border-gray-50' : 'max-h-0'}`}>
                  <div className="p-5 bg-gray-50/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Info size={14} className="text-teal-600" />
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informação Nutricional Completa</h4>
                      <div className="flex-1 h-px bg-gray-100"></div>
                      <span className="text-[10px] text-gray-400 font-medium">Valores por 100g</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {todosNutrientes.map(({ key, label, unit, Icon, color, bg }) => (
                        <div 
                          key={key} 
                          className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col gap-1 shadow-sm hover:shadow transition-shadow"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${bg}`}>
                              <Icon size={12} className={color} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase truncate">{label}</span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-sm font-bold text-gray-800">
                              {ingrediente.dadosNutricionais[key as keyof typeof ingrediente.dadosNutricionais] ?? 0}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400">{unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {ingrediente.tacoId && (
                      <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                        <p className="text-[11px] text-blue-600 font-medium">
                          Este ingrediente está vinculado à tabela TACO (Nº {ingrediente.tacoId})
                        </p>
                      </div>
                    )}

                    {(() => {
                      const itensEstoqueRaw = localStorage.getItem('estoque_itens');
                      let itensEstoque = [];
                      try {
                        itensEstoque = itensEstoqueRaw ? JSON.parse(itensEstoqueRaw) : [];
                      } catch {
                        itensEstoque = [];
                      }
                      
                      const itemEstoque = itensEstoque.find((item: any) => 
                        (ingrediente.tacoId && item.tacoId === ingrediente.tacoId) ||
                        (item.nome.toLowerCase() === ingrediente.nome.toLowerCase())
                      );

                      if (!itemEstoque || !itemEstoque.lotes || itemEstoque.lotes.length === 0) return null;

                      return (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Package size={14} className="text-teal-600" />
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lotes em Estoque & Custos</h4>
                            <div className="flex-1 h-px bg-gray-100"></div>
                          </div>
                          <div className="grid gap-2 max-w-2xl">
                            {itemEstoque.lotes.map((l: any, index: number) => {
                              const bUn = ingrediente.unidade;
                              const fator = (bUn === 'kg' || bUn === 'l' || bUn === 'unidade' || bUn === 'un')
                                ? l.quantidadeOriginal
                                : (l.quantidadeOriginal / 100);
                              const totalLote = fator * l.custoUnitario;
                              const precoLoteUnit = l.custoUnitario;
                              let labelUnidade: string = ingrediente.unidade;
                              if (labelUnidade === 'unidade' || labelUnidade === 'un') labelUnidade = 'und';
                              else if (labelUnidade === 'l') labelUnidade = 'L';

                              return (
                                <div key={l.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-gray-100 text-xs gap-2 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-700">Lote #{index + 1}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-gray-600 font-medium">Qtd: {l.quantidadeAtual} / {l.quantidadeOriginal} {labelUnidade}</span>
                                    {l.fornecedor && (
                                      <>
                                        <span className="text-gray-400">|</span>
                                        <span className="text-gray-500 italic">Fornecedor: {l.fornecedor}</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-right">
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Custo Total do Lote</span>
                                      <span className="font-semibold text-gray-800">R$ {totalLote.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="border-l border-gray-100 pl-4">
                                      <span className="text-teal-600 block text-[9px] uppercase font-bold">Custo Unitário</span>
                                      <span className="font-bold text-teal-600">R$ {precoLoteUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / {labelUnidade}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={!!itemParaRemover}
        onClose={() => setItemParaRemover(null)}
        onConfirm={confirmarRemocao}
        title="Remover Ingrediente"
        message={!itemEstoqueParaRemover || !itemEstoqueParaRemover.lotes || itemEstoqueParaRemover.lotes.length === 0
          ? `Você está prestes a excluir "${itemParaRemover?.nome}". Esta ação não pode ser desfeita e pode afetar receitas existentes.`
          : `Atenção: O ingrediente "${itemParaRemover?.nome}" possui ${itemEstoqueParaRemover.lotes.length} lote(s) ativo(s) no estoque. Ao excluí-lo, todos os lotes associados também serão removidos do estoque. Esta ação não pode ser desfeita e afetará receitas existentes.`
        }
        confirmText="Sim, excluir tudo"
        cancelText="Cancelar"
        requirePassword={false}
      />
    </div>
  );
}
