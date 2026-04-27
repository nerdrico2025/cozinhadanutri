import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, ChefHat, Loader2, Search, ArrowLeft,
  UtensilsCrossed, TrendingUp, DollarSign, Flame,
  Beef, Wheat, Droplets, Info, Activity, Scale,
  PlusCircle, AlertCircle
} from "lucide-react";

import { Receita, IngredienteReceita, DadosNutricionais, Ingrediente } from "../types";
import {
  calcularCustosReceita,
  calcularDadosNutricionaisPorPorcao,
} from "../utils/calculations";
import { buscarAlimentosBackend, listarAlimentos } from "../services/alimentos";

const receitaSchema = z.object({
  nome: z.string().min(1, "Nome da receita é obrigatório"),
  descricao: z.string().optional(),
  porcoes: z.number().min(1, "Número de porções deve ser maior que zero"),
  margemLucro: z.number().min(0),
  ingredientes: z
    .array(
      z.object({
        tacoId: z.number().min(1, "Selecione um ingrediente"),
        nome: z.string().min(1),
        quantidade: z.number().min(1, "Quantidade deve ser maior que zero"),
        preco: z.number().min(0.01, "Informe o preço"),
      })
    )
    .min(1, "Adicione pelo menos um ingrediente"),
});

type ReceitaForm = z.infer<typeof receitaSchema>;

interface SearchResult {
  id: string | number;
  nome: string;
  cadastrado: boolean;
  preco?: number;
  originalData: any; // Dados brutos do backend
}

interface RowSearch {
  query: string;
  results: SearchResult[];
  loading: boolean;
  open: boolean;
}

const emptyRow = (): RowSearch => ({
  query: "",
  results: [],
  loading: false,
  open: false,
});

interface CriarReceitaProps {
  receitaInicial?: Receita;
  onSalvar: (receita: Receita) => void;
  onCancelar: () => void;
  onSolicitarCadastro?: (dadosIniciais: Partial<Ingrediente>, rascunho: Receita) => void;
}

interface Calculos {
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
  margemLucroReal: number;
  dadosNutricionaisTotais: DadosNutricionais;
  dadosNutricionaisPorPorcao: DadosNutricionais;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm outline-none box-border transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand/20"
  }`;

export function CriarReceita({ receitaInicial, onSalvar, onCancelar, onSolicitarCadastro }: CriarReceitaProps) {
  const [rowSearches, setRowSearches] = useState<RowSearch[]>(
    receitaInicial
      ? receitaInicial.ingredientes.map((i) => ({ query: i.nome, results: [], loading: false, open: false }))
      : [emptyRow()]
  );
  const [calculos, setCalculos] = useState<Calculos | null>(null);
  const [calculandoApi, setCalculandoApi] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalCadastro, setModalCadastro] = useState<{ aberto: boolean; ingrediente?: SearchResult }>({ aberto: false });
  const debounceRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([]);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue, reset, getValues } =
    useForm<ReceitaForm>({
      resolver: zodResolver(receitaSchema),
      defaultValues: receitaInicial ?? {
        porcoes: 1,
        margemLucro: 10,
        ingredientes: [{ tacoId: 0, nome: "", quantidade: 0, preco: 0 }],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "ingredientes" });

  useEffect(() => {
    setRowSearches((prev) => {
      if (prev.length === fields.length) return prev;
      return fields.map((_, i) => prev[i] ?? emptyRow());
    });
  }, [fields]);

  const watchedIngredientes = watch("ingredientes");
  const watchedPorcoes = watch("porcoes");
  const watchedMargemLucro = watch("margemLucro");

  useEffect(() => {
    const validos = watchedIngredientes.filter(
      (i) => i.tacoId && i.quantidade > 0 && i.preco >= 0
    );
    if (validos.length === 0 || watchedPorcoes <= 0) { setCalculos(null); return; }

    const custos = calcularCustosReceita(
      validos.map(v => ({ quantidade: v.quantidade, preco: v.preco })), 
      watchedPorcoes, 
      watchedMargemLucro
    );

    // Cálculo nutricional local baseado nos ingredientes selecionados
    const totais: DadosNutricionais = {
      calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
      acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
      gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
    };

    validos.forEach((item) => {
      // Busca o ingrediente original nos resultados da busca
      const searchResult = rowSearches
        .flatMap(rs => rs.results)
        .find(r => r.cadastrado && String(r.id) === String(item.tacoId));
      
      const ingredienteCompleto = searchResult?.originalData as Ingrediente | undefined;
      
      if (ingredienteCompleto?.dadosNutricionais) {
        const proporcao = item.quantidade / 100;
        Object.keys(totais).forEach((key) => {
          const k = key as keyof DadosNutricionais;
          const valor = ingredienteCompleto.dadosNutricionais[k];
          if (typeof valor === 'number') {
            totais[k] += valor * proporcao;
          }
        });
      }
    });

    setCalculos({ 
      ...custos, 
      dadosNutricionaisTotais: totais, 
      dadosNutricionaisPorPorcao: calcularDadosNutricionaisPorPorcao(totais, watchedPorcoes) 
    });
  }, [watchedIngredientes, watchedPorcoes, watchedMargemLucro]);

  const updateRow = useCallback((index: number, patch: Partial<RowSearch>) => {
    setRowSearches((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }, []);

  const handleQueryChange = (index: number, value: string) => {
    updateRow(index, { query: value, open: false });
    if (debounceRefs.current[index]) clearTimeout(debounceRefs.current[index]!);
    if (value.length < 2) { updateRow(index, { results: [] }); return; }
    debounceRefs.current[index] = setTimeout(async () => {
      updateRow(index, { loading: true });
      try {
        const results = await buscarAlimentosBackend(value);

        const combined: SearchResult[] = results.map((item: any) => {
          const ingrediente: Ingrediente = {
            id: String(item.id),
            tacoId: item.numero,
            nome: item.descricao,
            unidade: item.unidade_medida || 'g',
            preco: item.preco !== null ? parseFloat(item.preco) : 0,
            dadosNutricionais: {
              calorias: parseFloat(item.energia_kcal) || 0,
              proteinas: parseFloat(item.proteina) || 0,
              carboidratos: parseFloat(item.carboidrato) || 0,
              gorduras: parseFloat(item.lipideos) || 0,
              acucares_totais: parseFloat(item.acucares_totais) || 0,
              acucares_adicionados: parseFloat(item.acucares_adicionados) || 0,
              gorduras_saturadas: parseFloat(item.saturados) || 0,
              gorduras_trans: (parseFloat(item.AG18_1t) || 0) + (parseFloat(item.AG18_2t) || 0),
              fibras: parseFloat(item.fibra_alimentar) || 0,
              sodio: parseFloat(item.sodio) || 0,
              vitaminas: parseFloat(item.vitaminas) || 0,
              minerais: parseFloat(item.minerais) || 0,
            }
          };

          return {
            id: String(item.id),
            nome: item.descricao,
            cadastrado: item.preco !== null && item.preco !== undefined,
            preco: item.preco !== null ? parseFloat(item.preco) : undefined,
            originalData: ingrediente
          };
        });

        if (combined.length === 0) {
          updateRow(index, { results: [], open: false, loading: false });
          return;
        }

        updateRow(index, { results: combined, open: true, loading: false });
      } catch (err) { 
        console.error("Erro na busca:", err);
        updateRow(index, { loading: false }); 
      }
    }, 600);
  };

  const handleSelectAlimento = (index: number, result: SearchResult) => {
    if (!result.cadastrado) {
      setModalCadastro({ aberto: true, ingrediente: result });
      return;
    }

    setValue(`ingredientes.${index}.tacoId`, Number(result.id), { shouldValidate: true });
    setValue(`ingredientes.${index}.nome`, result.nome, { shouldValidate: true });
    setValue(`ingredientes.${index}.preco`, result.preco || 0, { shouldValidate: true });
    updateRow(index, { query: result.nome, results: [result], open: false });
  };

  const handleConfirmarRedirecionamento = () => {
    const result = modalCadastro.ingrediente;
    if (result && onSolicitarCadastro) {
      const currentData = getValues();
      const rascunho: Receita = {
        id: receitaInicial?.id ?? "rascunho",
        nome: currentData.nome,
        descricao: currentData.descricao,
        porcoes: currentData.porcoes,
        margemLucro: currentData.margemLucro,
        ingredientes: currentData.ingredientes as IngredienteReceita[],
        custoTotal: calculos?.custoTotal ?? 0,
        custoPorPorcao: calculos?.custoPorPorcao ?? 0,
        precoSugerido: calculos?.precoSugerido ?? 0,
        dadosNutricionaisTotais: calculos?.dadosNutricionaisTotais ?? { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0, gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0 },
        dadosNutricionaisPorPorcao: calculos?.dadosNutricionaisPorPorcao ?? { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0, gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0 },
        createdAt: receitaInicial?.createdAt ?? new Date()
      };
      onSolicitarCadastro(result.originalData as Ingrediente, rascunho);
    }
    setModalCadastro({ aberto: false });
  };

  const onSubmit = async (data: ReceitaForm) => {
    if (!calculos) return;
    setSalvando(true);
    try {
      const custos = calcularCustosReceita(data.ingredientes as IngredienteReceita[], data.porcoes, data.margemLucro);
      onSalvar({
        id: receitaInicial?.id,
        nome: data.nome,
        descricao: data.descricao,
        ingredientes: data.ingredientes as IngredienteReceita[],
        porcoes: data.porcoes,
        custoTotal: custos.custoTotal,
        custoPorPorcao: custos.custoPorPorcao,
        precoSugerido: custos.precoSugerido,
        margemLucro: data.margemLucro,
        dadosNutricionaisTotais: calculos.dadosNutricionaisTotais,
        dadosNutricionaisPorPorcao: calculos.dadosNutricionaisPorPorcao,
        createdAt: receitaInicial?.createdAt ?? new Date(),
      });
      reset();
      setRowSearches([emptyRow()]);
      setCalculos(null);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header sticky ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus:outline-none"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <span className="text-gray-200 select-none">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                <ChefHat size={15} className="text-brand" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {receitaInicial ? "Editar Receita" : "Nova Receita"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelar}
              className="hidden sm:block px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={!calculos || salvando}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                !calculos || salvando
                  ? "bg-brand/40 cursor-not-allowed"
                  : "bg-brand hover:brightness-110 cursor-pointer"
              }`}
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
              {salvando ? "Salvando…" : "Salvar Receita"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Corpo ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Coluna principal ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">

              {/* Seção 1 — Dados da receita */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                  <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <h2 className="text-sm font-semibold text-gray-800">Dados da Receita</h2>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Nome da Receita <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register("nome")}
                      placeholder="Ex: Bolo de Cenoura com Cobertura de Chocolate"
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
                      placeholder="Descreva brevemente a receita, modo de preparo ou observações…"
                      rows={3}
                      className={`${inputCls()} resize-none`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Porções <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        {...register("porcoes", { valueAsNumber: true })}
                        className={inputCls(!!errors.porcoes)}
                      />
                      {errors.porcoes && <p className="text-red-500 text-xs mt-1">{errors.porcoes.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Margem de Lucro (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        {...register("margemLucro", { valueAsNumber: true })}
                        className={inputCls(!!errors.margemLucro)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Seção 2 — Ingredientes */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <h2 className="text-sm font-semibold text-gray-800">
                      Ingredientes
                      <span className="ml-2 text-xs font-normal text-gray-400">({fields.length})</span>
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => append({ tacoId: 0, nome: "", quantidade: 0, preco: 0 })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand/8 hover:bg-brand/15 px-3 py-1.5 rounded-lg transition-colors focus:outline-none border-0 cursor-pointer"
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                </div>

                {typeof errors.ingredientes?.root?.message === "string" && (
                  <p className="text-red-500 text-xs px-5 pt-3">{errors.ingredientes.root.message}</p>
                )}
                {typeof errors.ingredientes?.message === "string" && (
                  <p className="text-red-500 text-xs px-5 pt-3">{errors.ingredientes.message}</p>
                )}

                <div className="divide-y divide-gray-50">
                  {fields.map((field, index) => {
                    const row = rowSearches[index] ?? emptyRow();
                    const errosIng = errors.ingredientes?.[index];
                    return (
                      <div key={field.id} className="p-5 flex flex-col gap-3">

                        {/* Linha topo: número + remover */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                            <UtensilsCrossed size={12} />
                            Ingrediente {index + 1}
                          </span>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                remove(index);
                                setRowSearches((prev) => prev.filter((_, i) => i !== index));
                              }}
                              aria-label="Remover ingrediente"
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors border-0 bg-transparent cursor-pointer focus:outline-none"
                            >
                              <Trash2 size={12} />
                              Remover
                            </button>
                          )}
                        </div>

                        {/* Busca TACO */}
                        <div className="relative">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Alimento (tabela TACO) <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              value={row.query}
                              onChange={(e) => handleQueryChange(index, e.target.value)}
                              onFocus={() => row.results.length > 0 && updateRow(index, { open: true })}
                              onBlur={() => setTimeout(() => updateRow(index, { open: false }), 200)}
                              placeholder="Digite para pesquisar na tabela TACO…"
                              className={`${inputCls(!!errosIng?.tacoId)} pl-9 pr-8`}
                            />
                            {row.loading && (
                              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                            )}
                          </div>
                          {errosIng?.tacoId && (
                            <p className="text-red-500 text-xs mt-1">{errosIng.tacoId.message}</p>
                          )}
                          {row.open && row.results.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                              {row.results.map((result) => (
                                <button
                                  key={result.id}
                                  type="button"
                                  onMouseDown={() => handleSelectAlimento(index, result)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-brand/5 border-0 bg-transparent cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-b-0 group"
                                >
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm text-gray-800 truncate group-hover:text-brand transition-colors font-medium">
                                      {result.nome}
                                    </span>
                                    {result.cadastrado && result.preco && (
                                      <span className="text-[10px] text-gray-400">
                                        Preço base: R$ {result.preco.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {result.cadastrado ? (
                                    <div className="flex items-center gap-1.5 shrink-0 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span className="text-[10px] font-bold uppercase tracking-tight">Cadastrado</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 shrink-0 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">
                                      <PlusCircle size={10} />
                                      <span className="text-[10px] font-bold uppercase tracking-tight">Não Cadastrado</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quantidade e Preço */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Quantidade (g)
                            </label>
                            <input
                              type="number"
                              min={1}
                              {...register(`ingredientes.${index}.quantidade`, { valueAsNumber: true })}
                              placeholder="0"
                              className={inputCls(!!errosIng?.quantidade)}
                            />
                            {errosIng?.quantidade && (
                              <p className="text-red-500 text-xs mt-1">{errosIng.quantidade.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Preço / 100g ou UN (R$)
                            </label>
                            <div className="relative">
                              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                {...register(`ingredientes.${index}.preco`, { valueAsNumber: true })}
                                placeholder="0,00"
                                className={`${inputCls(!!errosIng?.preco)} pl-8`}
                              />
                            </div>
                            {errosIng?.preco && (
                              <p className="text-red-500 text-xs mt-1">{errosIng.preco.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Hidden fields */}
                        <input type="hidden" {...register(`ingredientes.${index}.tacoId`, { valueAsNumber: true })} />
                        <input type="hidden" {...register(`ingredientes.${index}.nome`)} />
                      </div>
                    );
                  })}
                </div>

                {/* Adicionar mais — rodapé da seção */}
                <div className="px-5 py-3 border-t border-dashed border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      append({ tacoId: 0, nome: "", quantidade: 0, preco: 0 });
                      setRowSearches((prev) => [...prev, emptyRow()]);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-brand hover:bg-brand/5 py-2 rounded-lg transition-colors border-0 bg-transparent cursor-pointer focus:outline-none"
                  >
                    <Plus size={14} />
                    Adicionar ingrediente
                  </button>
                </div>
              </section>

              {/* Ações — mobile */}
              <div className="flex gap-3 lg:hidden pb-4">
                <button
                  type="button"
                  onClick={onCancelar}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!calculos || salvando}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                    !calculos || salvando ? "bg-brand/40 cursor-not-allowed" : "bg-brand hover:brightness-110 cursor-pointer"
                  }`}
                >
                  {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
                  {salvando ? "Salvando…" : "Salvar Receita"}
                </button>
              </div>
            </div>

            {/* ── Coluna lateral — resumo sticky ───────────────────────── */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-20 flex flex-col gap-4">

               {/* Card: financeiro */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-sm font-bold text-gray-800">Resumo Financeiro</p>
                </div>

                {calculos ? (
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Ingredientes</p>
                        <p className="text-lg font-black text-gray-700">{watchedIngredientes.length}</p>
                      </div>
                      <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                        <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Custo Total</p>
                        <p className="text-lg font-black text-blue-600">R$ {calculos.custoTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-xs text-gray-500">Custo por Porção</span>
                        <span className="text-sm font-bold text-gray-700">R$ {calculos.custoPorPorcao.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-xs text-gray-500">Sugestão de Venda</span>
                        <span className="text-sm font-black text-emerald-600">R$ {calculos.precoSugerido.toFixed(2)}</span>
                      </div>
                        <div className="flex items-center justify-between py-2 bg-emerald-50/50 px-3 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-emerald-600 uppercase font-bold">Lucro Previsto</span>
                          <span className="text-xs text-emerald-500 font-medium">Margem de {watchedMargemLucro}%</span>
                        </div>
                        <span className="text-base font-black text-emerald-600">R$ {calculos.margemLucroReal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <DollarSign size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Adicione ingredientes para ver o resumo financeiro detalhado.
                    </p>
                  </div>
                )}
              </div>

              {/* Card: nutricional */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Prévia Nutricional</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium tracking-tight">Valores médios por porção</p>
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
                        {calculos.dadosNutricionaisPorPorcao.calorias.toFixed(0)} kcal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Proteínas", value: calculos.dadosNutricionaisPorPorcao.proteinas, unit: "g", Icon: Beef, color: "text-rose-500", bg: "bg-rose-50" },
                        { label: "Carbos", value: calculos.dadosNutricionaisPorPorcao.carboidratos, unit: "g", Icon: Wheat, color: "text-amber-500", bg: "bg-amber-50" },
                        { label: "Gorduras", value: calculos.dadosNutricionaisPorPorcao.gorduras, unit: "g", Icon: Droplets, color: "text-sky-500", bg: "bg-sky-50" },
                        { label: "Fibras", value: calculos.dadosNutricionaisPorPorcao.fibras, unit: "g", Icon: Wheat, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { label: "Sódio", value: calculos.dadosNutricionaisPorPorcao.sodio, unit: "mg", Icon: Activity, color: "text-gray-500", bg: "bg-gray-100" },
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
                      Valores aproximados baseados nos ingredientes informados.
                    </p>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <Flame size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Preencha os ingredientes para gerar a prévia nutricional.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </form>
      </div>

      {/* Modal de Alerta de Cadastro */}
      {modalCadastro.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6 mx-auto">
              <AlertCircle className="text-amber-600" size={40} />
            </div>
            
            <h3 className="text-xl font-black text-gray-800 text-center mb-3">
              Ingrediente não cadastrado
            </h3>
            
            <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
              O item <span className="font-bold text-gray-700">"{modalCadastro.ingrediente?.nome}"</span> ainda não possui preço ou unidade definidos. 
              <br/><br/>
              Deseja cadastrá-lo agora? Seu rascunho da receita será <span className="text-brand font-bold">preservado automaticamente</span>.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirmarRedirecionamento}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white text-sm font-black hover:brightness-110 transition-all shadow-lg shadow-brand/20 border-0 cursor-pointer"
              >
                Sim, cadastrar agora
                <PlusCircle size={18} />
              </button>
              
              <button
                type="button"
                onClick={() => setModalCadastro({ aberto: false })}
                className="w-full py-3 rounded-2xl border border-gray-100 text-xs font-bold text-gray-400 bg-white hover:bg-gray-50 transition-colors border-0 cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
