import { useState } from 'react';
import { Trash2, Edit3, Package, DollarSign, Flame, Beef, Wheat, Droplets, Search, X } from 'lucide-react';
import { Ingrediente } from '../types';

interface ListaIngredientesProps {
  ingredientes: Ingrediente[];
  onEditar?: (ingrediente: Ingrediente) => void;
  onRemover: (id: string) => void;
}

const nutrientes = [
  { key: 'calorias' as const, label: 'Calorias', suffix: 'kcal', Icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'proteinas' as const, label: 'Proteínas', suffix: 'g', Icon: Beef, color: 'text-red-500', bg: 'bg-red-50' },
  { key: 'carboidratos' as const, label: 'Carboidratos', suffix: 'g', Icon: Wheat, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { key: 'gorduras' as const, label: 'Gorduras', suffix: 'g', Icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
];

export function ListaIngredientes({ ingredientes, onEditar, onRemover }: ListaIngredientesProps) {
  const [query, setQuery] = useState('');

  const filtrados = query.trim()
    ? ingredientes.filter((i) => i.nome.toLowerCase().includes(query.toLowerCase()))
    : ingredientes;

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-5 py-3.5 bg-teal-50 border-b border-gray-100 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-teal-600" />
          <span className="text-sm font-semibold text-gray-700">
            Ingredientes <span className="text-teal-600">({filtrados.length}{query ? `/${ingredientes.length}` : ''})</span>
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar ingrediente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              title="Limpar pesquisa"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer p-0"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Linhas */}
      <div className="divide-y divide-gray-50">
        {filtrados.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Nenhum ingrediente encontrado para <span className="font-medium text-gray-600">"{query}"</span>
          </div>
        )}
        {filtrados.map((ingrediente) => (
          <div key={ingrediente.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors">

            {/* Conteúdo principal */}
            <div className="flex-1 min-w-0">
              {/* Nome + unidade */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-800 truncate">{ingrediente.nome}</span>
                <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full shrink-0">
                  {ingrediente.unidade}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* Preço */}
                <div className="flex items-center gap-1.5 bg-green-50 rounded-lg px-3 py-2">
                  <DollarSign size={13} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-500 leading-none mb-0.5">Preço</p>
                    <p className="text-xs font-bold text-green-700">R$ {ingrediente.preco.toFixed(2)}</p>
                  </div>
                </div>

                {/* Nutrientes */}
                {nutrientes.map(({ key, label, suffix, Icon, color, bg }) => (
                  <div key={key} className={`flex items-center gap-1.5 ${bg} rounded-lg px-3 py-2`}>
                    <Icon size={13} className={`${color} shrink-0`} />
                    <div>
                      <p className="text-[10px] text-gray-500 leading-none mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-gray-700">
                        {ingrediente.dadosNutricionais[key]}{suffix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {onEditar && (
                <button
                  onClick={() => onEditar(ingrediente)}
                  title="Editar ingrediente"
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition border-0 cursor-pointer focus:outline-none"
                >
                  <Edit3 size={15} />
                </button>
              )}
              <button
                onClick={() => { if (confirm(`Remover "${ingrediente.nome}"?`)) onRemover(ingrediente.id); }}
                title="Remover ingrediente"
                className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition border-0 cursor-pointer focus:outline-none"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
