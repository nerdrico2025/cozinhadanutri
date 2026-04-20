import { useState } from 'react';
import { ChefHat, DollarSign, Calculator, Printer, Trash2, Pencil, UtensilsCrossed, TrendingUp, CalendarDays, Search, X } from 'lucide-react';
import { Receita } from '../types';

interface ListaReceitasProps {
  receitas: Receita[];
  onEditar?: (receita: Receita) => void;
  onRemover: (id: string) => void;
  onGerarRotulo?: (receita: Receita) => void;
}

export function ListaReceitas({ receitas, onEditar, onRemover, onGerarRotulo }: ListaReceitasProps) {
  const [query, setQuery] = useState('');

  const filtradas = query.trim()
    ? receitas.filter((r) =>
        r.nome.toLowerCase().includes(query.toLowerCase()) ||
        r.descricao?.toLowerCase().includes(query.toLowerCase())
      )
    : receitas;

  if (receitas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-8 py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gray-50">
            <ChefHat size={40} className="text-gray-300" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-gray-500 mb-1">Nenhuma receita criada</h3>
        <p className="text-sm text-gray-400">Crie sua primeira receita para começar a precificar seus produtos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Barra de pesquisa */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">
          {filtradas.length}{query ? `/${receitas.length}` : ''} {filtradas.length === 1 ? 'receita' : 'receitas'}
        </span>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar receita..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-60 pl-8 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent placeholder-gray-400 shadow-sm"
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

      {filtradas.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-8 py-12 text-center">
          <p className="text-sm text-gray-400">
            Nenhuma receita encontrada para <span className="font-medium text-gray-600">"{query}"</span>
          </p>
        </div>
      )}

      {filtradas.map((receita) => (
        <div key={receita.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-linear-to-r from-teal-700 to-teal-600 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">{receita.nome}</h3>
                {receita.descricao && (
                  <p className="text-sm text-white/70 mt-0.5 truncate">{receita.descricao}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-white/65">
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed size={12} />
                    {receita.porcoes} {receita.porcoes === 1 ? 'porção' : 'porções'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} />
                    Margem: {receita.margemLucro}%
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    {new Date(receita.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onEditar && (
                  <button
                    onClick={() => onEditar(receita)}
                    title="Editar receita"
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition border-0 cursor-pointer focus:outline-none"
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {onGerarRotulo && (
                  <button
                    onClick={() => onGerarRotulo(receita)}
                    title="Gerar rótulo nutricional"
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition border-0 cursor-pointer focus:outline-none"
                  >
                    <Printer size={15} />
                  </button>
                )}
                <button
                  onClick={() => { if (confirm(`Remover a receita "${receita.nome}"?`)) onRemover(receita.id); }}
                  title="Remover receita"
                  className="p-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white transition border-0 cursor-pointer focus:outline-none"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Corpo */}
          <div className="p-5 flex flex-col gap-5">

            {/* Ingredientes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ingredientes</p>
              <div className="flex flex-col gap-1.5">
                {receita.ingredientes.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.nome}</span>
                    <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-md px-2 py-0.5">{item.quantidade}g</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cards de cálculo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              {/* Precificação */}
              <div className="bg-green-50 rounded-xl p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-green-800 mb-3">
                  <DollarSign size={13} /> Precificação
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Custo Total</span>
                    <span className="font-medium text-gray-800">R$ {receita.custoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Custo/Porção</span>
                    <span className="font-medium text-gray-800">R$ {receita.custoPorPorcao.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 mt-1 border-t border-green-200">
                    <span className="font-semibold text-green-700">Preço Sugerido</span>
                    <span className="font-bold text-green-700">R$ {receita.precoSugerido.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Receita completa */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-3">
                  <Calculator size={13} /> Receita Completa
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Calorias', value: `${receita.dadosNutricionaisTotais.calorias.toFixed(0)} kcal` },
                    { label: 'Proteínas', value: `${receita.dadosNutricionaisTotais.proteinas.toFixed(1)}g` },
                    { label: 'Carboidratos', value: `${receita.dadosNutricionaisTotais.carboidratos.toFixed(1)}g` },
                    { label: 'Gorduras', value: `${receita.dadosNutricionaisTotais.gorduras.toFixed(1)}g` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs text-gray-600">
                      <span>{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por porção */}
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-800 mb-3">
                  <UtensilsCrossed size={13} /> Por Porção
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Calorias', value: `${receita.dadosNutricionaisPorPorcao.calorias.toFixed(0)} kcal` },
                    { label: 'Proteínas', value: `${receita.dadosNutricionaisPorPorcao.proteinas.toFixed(1)}g` },
                    { label: 'Carboidratos', value: `${receita.dadosNutricionaisPorPorcao.carboidratos.toFixed(1)}g` },
                    { label: 'Gorduras', value: `${receita.dadosNutricionaisPorPorcao.gorduras.toFixed(1)}g` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs text-gray-600">
                      <span>{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
