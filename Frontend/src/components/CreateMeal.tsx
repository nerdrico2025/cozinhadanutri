import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, Loader2, ArrowLeft,
  UtensilsCrossed, DollarSign, Flame,
  Beef, Wheat, Droplets, Info, Activity,
  AlertCircle, FolderHeart, PlusCircle
} from "lucide-react";

import { Receita, Refeicao, ReceitaRefeicao, DadosNutricionais, ItemEmbalagemSelecionada } from "../types";

const mealSchema = z.object({
  nome: z.string().min(1, "Nome da refeição é obrigatório"),
  descricao: z.string().optional(),
  receitas: z
    .array(
      z.object({
        receitaId: z.string().min(1, "Selecione uma receita"),
        quantidadeUtilizada: z.number().min(0.01, "A quantidade deve ser maior que zero"),
        unidadeMedida: z.enum(["porcoes", "kg", "g", "l", "ml", "unidade"]).default("porcoes"),
      })
    )
    .min(1, "Adicione pelo menos uma receita para montar a refeição"),
});

type MealForm = z.infer<typeof mealSchema>;

interface CreateMealProps {
  refeicaoInicial?: Refeicao;
  receitasDisponiveis: Receita[];
  onSalvar: (refeicao: Refeicao) => void;
  onCancelar: () => void;
  onIrParaEstoque?: () => void;
}

interface CalculosRefeicao {
  custoTotal: number;
  dadosNutricionaisTotais: DadosNutricionais;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm outline-none box-border transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 bg-white focus:border-[#04585a] focus:ring-1 focus:ring-[#04585a]/20"
  }`;

export function CreateMeal({ refeicaoInicial, receitasDisponiveis, onSalvar, onCancelar, onIrParaEstoque }: CreateMealProps) {
  const [salvando, setSalvando] = useState(false);
  const [calculos, setCalculos] = useState<CalculosRefeicao | null>(null);

  interface ItemEstoque {
    id: string;
    nome: string;
    categoria: string;
    custoMedio: number;
  }

  const [embalagensEstoque, setEmbalagensEstoque] = useState<ItemEstoque[]>([]);
  const [embalagensSelecionadas, setEmbalagensSelecionadas] = useState<ItemEmbalagemSelecionada[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('estoque_itens');
      if (raw) {
        const parsed = JSON.parse(raw) as ItemEstoque[];
        const filtered = parsed.filter(item => 
          item.categoria?.toLowerCase() === "embalagem" || 
          item.categoria?.toLowerCase() === "embalagens"
        );
        setEmbalagensEstoque(filtered);

        const initialSaved = refeicaoInicial?.embalagens ?? [];
        
        // Merge inventory items with saved selection
        const mergedList: ItemEmbalagemSelecionada[] = filtered.map(item => {
          const saved = initialSaved.find(s => s.id === item.id);
          if (saved) {
            return {
              id: item.id,
              nome: item.nome,
              checked: saved.checked,
              quantidade: saved.quantidade,
              custoUnitario: saved.custoUnitario,
            };
          }
          return {
            id: item.id,
            nome: item.nome,
            checked: false,
            quantidade: 1,
            custoUnitario: item.custoMedio,
          };
        });

        // Add custom manual items
        initialSaved.forEach(saved => {
          if (saved.isCustom && !mergedList.some(m => m.id === saved.id)) {
            mergedList.push(saved);
          }
        });

        // If it's a legacy meal that only has a generic valorEmbalagem and no detailed packaging list,
        // we can add a custom entry so that the value is not lost.
        if (refeicaoInicial && refeicaoInicial.valorEmbalagem && refeicaoInicial.valorEmbalagem > 0 && mergedList.filter(m => m.checked).length === 0) {
          mergedList.push({
            id: 'legacy-pkg',
            nome: 'Embalagem Principal (Ficha)',
            checked: true,
            quantidade: 1,
            custoUnitario: refeicaoInicial.valorEmbalagem,
            isCustom: true,
          });
        }

        setEmbalagensSelecionadas(mergedList);
      }
    } catch (e) {
      console.error("Erro ao carregar embalagens do estoque:", e);
    }
  }, [refeicaoInicial]);

  const { register, handleSubmit, control, formState: { errors }, watch, reset, getValues, setValue } =
    useForm<MealForm>({
      resolver: zodResolver(mealSchema) as any,
      defaultValues: (refeicaoInicial
        ? {
            nome: refeicaoInicial.nome,
            descricao: refeicaoInicial.descricao,
            receitas: refeicaoInicial.receitas.map((r) => ({
              receitaId: r.receitaId,
              quantidadeUtilizada: r.quantidadeUtilizada ?? r.porcoesUtilizadas,
              unidadeMedida: (r.unidadeMedida as "porcoes" | "kg" | "g" | "l" | "ml" | "unidade") ?? "porcoes",
            })),
          }
        : {
            nome: "",
            descricao: "",
            receitas: [{ receitaId: "", quantidadeUtilizada: 1, unidadeMedida: "porcoes" as const }],
          }) as any,
    });

  const { fields, append, remove } = useFieldArray({ control, name: "receitas" });

  const watchedReceitas = watch("receitas");

  const obterPesoTotalReceita = useCallback((receita: Receita) => {
    let totalGrams = 0;
    receita.ingredientes.forEach(ing => {
      const qty = ing.quantidade;
      const unit = ing.unidade?.toLowerCase() || 'g';
      if (unit === 'kg' || unit === 'l') {
        totalGrams += qty * 1000;
      } else if (unit === 'g' || unit === 'ml') {
        totalGrams += qty;
      } else {
        totalGrams += qty * 50; 
      }
    });
    return totalGrams || 1;
  }, []);

  const obterPorcoesEquivalentes = useCallback((
    receita: Receita, 
    qtyUtilizada: number, 
    unidade: string
  ) => {
    if (!qtyUtilizada || qtyUtilizada <= 0) return 0;
    if (unidade === 'porcoes' || unidade === 'unidade') {
      return qtyUtilizada;
    }
    
    const pesoTotal = obterPesoTotalReceita(receita);
    const porcoesTotal = receita.porcoes || 1;
    const pesoPorPorcao = pesoTotal / porcoesTotal;

    let qtyGrams = qtyUtilizada;
    if (unidade === 'kg' || unidade === 'l') {
      qtyGrams = qtyUtilizada * 1000;
    }
    
    return qtyGrams / pesoPorPorcao;
  }, [obterPesoTotalReceita]);

  const executarCalculos = useCallback(() => {
    const currentValues = getValues();
    const receitasList = currentValues.receitas ?? [];

    const validas = receitasList.filter(
      (item) => item && item.receitaId && item.quantidadeUtilizada > 0
    );

    let custoTotal = 0;
    const totais: DadosNutricionais = {
      calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
      acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
      gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
    };

    validas.forEach((item) => {
      const receitaCompleta = receitasDisponiveis.find((r) => r.id === item.receitaId);
      if (receitaCompleta) {
        const porcoes = obterPorcoesEquivalentes(
          receitaCompleta, 
          item.quantidadeUtilizada, 
          item.unidadeMedida
        );
        
        custoTotal += receitaCompleta.custoPorPorcao * porcoes;

        // Soma os dados nutricionais por porção proporcionalmente
        const nutrPorcao = receitaCompleta.dadosNutricionaisPorPorcao;
        if (nutrPorcao) {
          Object.keys(totais).forEach((key) => {
            const k = key as keyof DadosNutricionais;
            const valor = nutrPorcao[k];
            if (typeof valor === 'number') {
              totais[k] += valor * porcoes;
            }
          });
        }
      }
    });

    let valEmbalagem = 0;
    embalagensSelecionadas.forEach((emb) => {
      if (emb.checked) {
        valEmbalagem += (emb.quantidade || 0) * (emb.custoUnitario || 0);
      }
    });
    
    custoTotal += valEmbalagem;

    if (validas.length === 0 && valEmbalagem === 0) {
      setCalculos(null);
      return;
    }

    setCalculos({
      custoTotal,
      dadosNutricionaisTotais: totais,
    });
  }, [watchedReceitas, embalagensSelecionadas, receitasDisponiveis, getValues, obterPorcoesEquivalentes]);

  useEffect(() => {
    executarCalculos();
  }, [watchedReceitas, embalagensSelecionadas, executarCalculos]);

  const onSubmit = async (data: any) => {
    if (!calculos) return;
    setSalvando(true);
    try {
      const receitasMapeadas: ReceitaRefeicao[] = data.receitas.map((item: any) => {
        const receitaInfo = receitasDisponiveis.find((r) => r.id === item.receitaId)!;
        const porcoes = obterPorcoesEquivalentes(
          receitaInfo, 
          item.quantidadeUtilizada, 
          item.unidadeMedida
        );
        return {
          receitaId: item.receitaId,
          nome: receitaInfo.nome,
          porcoesUtilizadas: porcoes,
          quantidadeUtilizada: item.quantidadeUtilizada,
          unidadeMedida: item.unidadeMedida,
          custoPorPorcao: receitaInfo.custoPorPorcao,
          dadosNutricionaisPorPorcao: receitaInfo.dadosNutricionaisPorPorcao,
        };
      });

      let valorEmbalagem = 0;
      embalagensSelecionadas.forEach((emb) => {
        if (emb.checked) {
          valorEmbalagem += (emb.quantidade || 0) * (emb.custoUnitario || 0);
        }
      });

      onSalvar({
        id: refeicaoInicial?.id ?? crypto.randomUUID(),
        nome: data.nome,
        descricao: data.descricao,
        receitas: receitasMapeadas,
        custoTotal: calculos.custoTotal,
        valorEmbalagem,
        embalagens: embalagensSelecionadas,
        dadosNutricionaisTotais: calculos.dadosNutricionaisTotais,
        createdAt: refeicaoInicial?.createdAt ?? new Date().toISOString(),
      });
      reset();
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleEmbalagem = (id: string, checked: boolean) => {
    setEmbalagensSelecionadas(prev => 
      prev.map(item => item.id === id ? { ...item, checked } : item)
    );
  };

  const handleUpdateEmbalagemQuantidade = (id: string, quantidade: number) => {
    setEmbalagensSelecionadas(prev => 
      prev.map(item => item.id === id ? { ...item, quantidade: Math.max(0.01, quantidade) } : item)
    );
  };

  const handleUpdateEmbalagemCusto = (id: string, custoUnitario: number) => {
    setEmbalagensSelecionadas(prev => 
      prev.map(item => item.id === id ? { ...item, custoUnitario: Math.max(0, custoUnitario) } : item)
    );
  };

  const handleUpdateEmbalagemNome = (id: string, nome: string) => {
    setEmbalagensSelecionadas(prev => 
      prev.map(item => item.id === id ? { ...item, nome } : item)
    );
  };

  const handleRemoverEmbalagemPersonalizada = (id: string) => {
    setEmbalagensSelecionadas(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ── Header sticky ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus:outline-none bg-transparent border-0 cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <span className="text-gray-200 select-none">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#04585a]/10 flex items-center justify-center">
                <FolderHeart size={15} className="text-[#04585a]" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {refeicaoInicial ? "Editar Refeição" : "Nova Refeição"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelar}
              className="hidden sm:block px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={!calculos || salvando}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                !calculos || salvando
                  ? "bg-[#04585a]/40 cursor-not-allowed"
                  : "bg-[#04585a] hover:brightness-110 cursor-pointer"
              }`}
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
              {salvando ? "Salvando…" : "Salvar Refeição"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Corpo ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* ── Coluna principal ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-5 min-w-0 w-full">
              
              {/* Seção 1 — Dados da refeição */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                  <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <h2 className="text-sm font-semibold text-gray-800">Dados da Refeição</h2>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Nome da Refeição <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register("nome")}
                      placeholder="Ex: Almoço Saudável Fit - Combo A"
                      className={inputCls(!!errors.nome)}
                    />
                    {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Descrição <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                    </label>
                    <textarea
                      {...register("descricao")}
                      placeholder="Ex: Refeição completa contendo prato principal, acompanhamento e guarnição nutricionalmente balanceados."
                      rows={3}
                      className={`${inputCls()} resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* Seção 2 — Embalagem e Insumos da Marmita */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <h2 className="text-sm font-semibold text-gray-800">Embalagem e Insumos da Marmita</h2>
                  </div>
                  
                  {onIrParaEstoque && (
                    <button
                      type="button"
                      onClick={onIrParaEstoque}
                      className="text-xs font-bold text-[#04585a] hover:text-[#04585a]/80 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      Ir p/ Estoque
                    </button>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Marque os itens que compõem a embalagem e transporte desta marmita. Você pode alterar a quantidade e o custo de cada item individualmente.
                  </p>

                  {embalagensSelecionadas.length === 0 ? (
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-center">
                      <p className="text-xs text-amber-700 font-medium mb-3">
                        Nenhuma embalagem ou insumo encontrado no estoque.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {onIrParaEstoque && (
                          <button
                            type="button"
                            onClick={onIrParaEstoque}
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg border-0 transition cursor-pointer"
                          >
                            Cadastrar no Estoque
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newItem: ItemEmbalagemSelecionada = {
                              id: crypto.randomUUID(),
                              nome: "Marmita Principal",
                              checked: true,
                              quantidade: 1,
                              custoUnitario: 1.20,
                              isCustom: true,
                            };
                            setEmbalagensSelecionadas(prev => [...prev, newItem]);
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg border-0 transition cursor-pointer"
                        >
                          + Adicionar Insumo Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                        {embalagensSelecionadas.map((emb) => (
                          <div
                            key={emb.id}
                            className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              emb.checked ? "bg-white" : "opacity-60"
                            }`}
                          >
                            {/* Checkbox + Nome */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={emb.checked}
                                onChange={(e) => handleToggleEmbalagem(emb.id, e.target.checked)}
                                className="w-4 h-4 text-[#04585a] focus:ring-[#04585a] border-gray-300 rounded cursor-pointer"
                              />
                              {emb.isCustom ? (
                                <input
                                  type="text"
                                  value={emb.nome}
                                  onChange={(e) => handleUpdateEmbalagemNome(emb.id, e.target.value)}
                                  className="text-sm font-medium text-gray-800 bg-transparent border-b border-gray-200 focus:border-[#04585a] focus:outline-none py-0.5 w-full max-w-xs"
                                  placeholder="Nome do insumo..."
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-700 truncate">
                                  {emb.nome}
                                </span>
                              )}
                            </div>

                            {/* Inputs: Quantidade e Custo */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Qtd</span>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  disabled={!emb.checked}
                                  value={emb.quantidade}
                                  onChange={(e) => handleUpdateEmbalagemQuantidade(emb.id, parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded text-center focus:border-[#04585a] focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Preço R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  disabled={!emb.checked}
                                  value={emb.custoUnitario}
                                  onChange={(e) => handleUpdateEmbalagemCusto(emb.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-1.5 py-1 text-xs border border-gray-200 rounded text-center focus:border-[#04585a] focus:outline-none"
                                />
                              </div>

                              {emb.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoverEmbalagemPersonalizada(emb.id)}
                                  className="text-red-400 hover:text-red-600 p-1 bg-transparent border-0 cursor-pointer focus:outline-none"
                                  title="Remover custo manual"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-1 px-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newItem: ItemEmbalagemSelecionada = {
                              id: crypto.randomUUID(),
                              nome: "Insumo Adicional",
                              checked: true,
                              quantidade: 1,
                              custoUnitario: 0.50,
                              isCustom: true,
                            };
                            setEmbalagensSelecionadas(prev => [...prev, newItem]);
                          }}
                          className="text-xs text-[#04585a] hover:text-[#04585a]/80 font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                        >
                          <Plus size={12} />
                          Adicionar Insumo Manual (Ex: sacola, talher)
                        </button>

                        <div className="text-xs font-semibold text-gray-500">
                          Total Embalagens: <span className="text-[#04585a] font-bold">R$ {
                            embalagensSelecionadas
                              .filter(e => e.checked)
                              .reduce((acc, curr) => acc + (curr.quantidade * curr.custoUnitario), 0)
                              .toFixed(2)
                          }</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Seção 3 — Composição da Refeição (Receitas) */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <h2 className="text-sm font-semibold text-gray-800">
                      Receitas Integrantes
                      <span className="ml-2 text-xs font-normal text-gray-400">({fields.length})</span>
                    </h2>
                  </div>
                </div>

                {errors.receitas?.root?.message && (
                  <p className="text-red-500 text-xs px-5 pt-3">{errors.receitas.root.message}</p>
                )}

                <div className="divide-y divide-gray-50">
                  {fields.map((field, index) => {
                    const errosRec = errors.receitas?.[index];
                    const selectedId = watchedReceitas[index]?.receitaId;
                    const receitaSelecionada = receitasDisponiveis.find((r) => r.id === selectedId);

                    return (
                      <div key={field.id} className="p-5 flex flex-col gap-4">
                        {/* Linha topo: número + remover */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                            <UtensilsCrossed size={12} />
                            Receita {index + 1}
                          </span>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors border-0 bg-transparent cursor-pointer focus:outline-none"
                            >
                              <Trash2 size={12} />
                              Remover
                            </button>
                          )}
                        </div>

                        {/* Seleção de Receita e Quantidade Dinâmica */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-6">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Selecionar Receita Cadastrada <span className="text-red-400">*</span>
                            </label>
                            <select
                              {...register(`receitas.${index}.receitaId`)}
                              className={inputCls(!!errosRec?.receitaId)}
                            >
                              <option value="">Selecione uma receita...</option>
                              {receitasDisponiveis.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.nome}
                                </option>
                              ))}
                            </select>
                            {errosRec?.receitaId && (
                              <p className="text-red-500 text-xs mt-1">{errosRec.receitaId.message}</p>
                            )}
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Quantidade Utilizada <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={0.01}
                              step="any"
                              {...register(`receitas.${index}.quantidadeUtilizada`, { valueAsNumber: true })}
                              placeholder="1"
                              className={inputCls(!!errosRec?.quantidadeUtilizada)}
                            />
                            {errosRec?.quantidadeUtilizada && (
                              <p className="text-red-500 text-xs mt-1">{errosRec.quantidadeUtilizada.message}</p>
                            )}
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Unidade de Medida
                            </label>
                            <select
                              {...register(`receitas.${index}.unidadeMedida`)}
                              className={inputCls(!!errosRec?.unidadeMedida)}
                            >
                              <option value="porcoes">porção(ões)</option>
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="l">l</option>
                              <option value="unidade">unid</option>
                            </select>
                            {errosRec?.unidadeMedida && (
                              <p className="text-red-500 text-xs mt-1">{errosRec.unidadeMedida.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Prévia financeira rápida da linha */}
                        {receitaSelecionada && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-gray-50/70 p-3 rounded-lg border border-gray-100 gap-1.5">
                            <span className="text-gray-500">
                              Custo base da receita: <strong className="text-gray-700">R$ {receitaSelecionada.custoPorPorcao.toFixed(2)} / porção</strong>
                            </span>
                            <span className="text-gray-500">
                              Equivalente a: <strong className="text-[#04585a]">
                                {obterPorcoesEquivalentes(
                                  receitaSelecionada, 
                                  watchedReceitas[index]?.quantidadeUtilizada || 0, 
                                  watchedReceitas[index]?.unidadeMedida || "porcoes"
                                ).toFixed(2)} porção(ões)
                              </strong>
                            </span>
                            <span className="text-gray-500">
                              Custo proporcional: <strong className="text-emerald-700">
                                R$ {(
                                  receitaSelecionada.custoPorPorcao * 
                                  obterPorcoesEquivalentes(
                                    receitaSelecionada, 
                                    watchedReceitas[index]?.quantidadeUtilizada || 0, 
                                    watchedReceitas[index]?.unidadeMedida || "porcoes"
                                  )
                                ).toFixed(2)}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Adicionar mais — rodapé da seção */}
                <div className="px-5 py-3 border-t border-dashed border-gray-100">
                  <button
                    type="button"
                    onClick={() => append({ receitaId: "", quantidadeUtilizada: 1, unidadeMedida: "porcoes" })}
                    className="w-full flex items-center justify-center gap-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl border-0 transition-colors cursor-pointer focus:outline-none font-bold shadow-sm"
                  >
                    <Plus size={14} />
                    Adicionar Receita
                  </button>
                </div>
              </section>
            </div>

            {/* ── Coluna lateral — resumo sticky ───────────────────────── */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-20 flex flex-col gap-4">
              
              {/* Card: financeiro */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">Resumo Financeiro</p>
                  <DollarSign size={14} className="text-gray-300" />
                </div>

                {calculos ? (
                  <div className="p-5 flex flex-col gap-4">
                    <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                      <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Custo Total da Refeição</p>
                      <p className="text-2xl font-black text-blue-600">R$ {calculos.custoTotal.toFixed(2)}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-500 font-medium">Receitas integradas</span>
                        <span className="font-bold text-gray-700">{fields.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-500 font-medium">Total de Porções</span>
                        <span className="font-bold text-gray-700">
                          {watchedReceitas.reduce((acc, curr) => {
                            const rec = receitasDisponiveis.find(r => r.id === curr?.receitaId);
                            const equiv = rec ? obterPorcoesEquivalentes(rec, curr.quantidadeUtilizada || 0, curr.unidadeMedida || "porcoes") : 0;
                            return acc + equiv;
                          }, 0).toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-500 font-medium">Custo da Embalagem</span>
                        <span className="font-bold text-[#04585a]">
                          R$ {embalagensSelecionadas
                            .filter(e => e.checked)
                            .reduce((acc, curr) => acc + (curr.quantidade * curr.custoUnitario), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <DollarSign size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Adicione receitas para ver o resumo financeiro da refeição.
                    </p>
                  </div>
                )}
              </div>

              {/* Card: nutricional */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Acumulado Nutricional</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium tracking-tight">Valores totais da refeição</p>
                  </div>
                  <Info size={14} className="text-gray-300" />
                </div>

                {calculos ? (
                  <div className="p-4 flex flex-col gap-3">
                    <div className="bg-orange-50/50 rounded-xl p-3 flex items-center justify-between border border-orange-100/50">
                      <div className="flex items-center gap-2">
                        <Flame size={16} className="text-orange-500" />
                        <span className="text-xs font-bold text-gray-600">Energia</span>
                      </div>
                      <span className="text-sm font-black text-orange-600">
                        {calculos.dadosNutricionaisTotais.calorias.toFixed(0)} kcal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Proteínas", value: calculos.dadosNutricionaisTotais.proteinas, unit: "g", Icon: Beef, color: "text-rose-500", bg: "bg-rose-50" },
                        { label: "Carboidratos", value: calculos.dadosNutricionaisTotais.carboidratos, unit: "g", Icon: Wheat, color: "text-amber-500", bg: "bg-amber-50" },
                        { label: "Gorduras", value: calculos.dadosNutricionaisTotais.gorduras, unit: "g", Icon: Droplets, color: "text-sky-500", bg: "bg-sky-50" },
                        { label: "Fibras", value: calculos.dadosNutricionaisTotais.fibras, unit: "g", Icon: Wheat, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { label: "Sódio", value: calculos.dadosNutricionaisTotais.sodio, unit: "mg", Icon: Activity, color: "text-gray-500", bg: "bg-gray-100" },
                      ].map(({ label, value, unit, Icon, color, bg }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-md ${bg}`}>
                              <Icon size={12} className={color} />
                            </div>
                            <span className="text-[11px] font-medium text-gray-500">{label}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-700">{value.toFixed(1)}{unit}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] text-gray-400 text-center italic mt-2">
                      Valores baseados nas porções indicadas das receitas.
                    </p>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <Flame size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Selecione receitas para gerar o acumulado nutricional da refeição.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
