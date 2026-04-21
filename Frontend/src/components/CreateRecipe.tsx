import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, ChefHat, Loader2, Search, ArrowLeft,
  UtensilsCrossed, TrendingUp, DollarSign, Flame,
  Beef, Wheat, Droplets,
} from "lucide-react";

import { Receita, IngredienteReceita, DadosNutricionais } from "../types";
import {
  calcularCustosReceita,
  calcularDadosNutricionaisPorPorcao,
} from "../utils/calculations";
import {
  buscarAlimentos,
  calcularRefeicao,
  TacoFood,
} from "../services/tacoApi";

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

interface RowSearch {
  query: string;
  results: TacoFood[];
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
}

interface Calculos {
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
  dadosNutricionaisTotais: DadosNutricionais;
  dadosNutricionaisPorPorcao: DadosNutricionais;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm outline-none box-border transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-gray-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand/20"
  }`;

export function CriarReceita({ receitaInicial, onSalvar, onCancelar }: CriarReceitaProps) {
  const [rowSearches, setRowSearches] = useState<RowSearch[]>(
    receitaInicial
      ? receitaInicial.ingredientes.map((i) => ({ query: i.nome, results: [], loading: false, open: false }))
      : [emptyRow()]
  );
  const [calculos, setCalculos] = useState<Calculos | null>(null);
  const [calculandoApi, setCalculandoApi] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const debounceRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([]);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue, reset } =
    useForm<ReceitaForm>({
      resolver: zodResolver(receitaSchema),
      defaultValues: receitaInicial ?? {
        porcoes: 1,
        margemLucro: 200,
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
      (i) => i.tacoId > 0 && i.quantidade > 0 && i.preco > 0
    );
    if (validos.length === 0 || watchedPorcoes <= 0) { setCalculos(null); return; }

    const custos = calcularCustosReceita(validos as IngredienteReceita[], watchedPorcoes, watchedMargemLucro);
    setCalculandoApi(true);
    calcularRefeicao(validos.map((i) => ({ id: i.tacoId, grams: i.quantidade })))
      .then((resp) => {
        const t = resp.totals.macros;
        const totais: DadosNutricionais = { calorias: t.kcal, proteinas: t.protein, carboidratos: t.carbohydrate, gorduras: t.lipids };
        setCalculos({ ...custos, dadosNutricionaisTotais: totais, dadosNutricionaisPorPorcao: calcularDadosNutricionaisPorPorcao(totais, watchedPorcoes) });
      })
      .finally(() => setCalculandoApi(false));
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
        const results = await buscarAlimentos(value);
        updateRow(index, { results, open: results.length > 0, loading: false });
      } catch { updateRow(index, { loading: false }); }
    }, 350);
  };

  const handleSelectAlimento = (index: number, alimento: TacoFood) => {
    setValue(`ingredientes.${index}.tacoId`, alimento.id, { shouldValidate: true });
    setValue(`ingredientes.${index}.nome`, alimento.description, { shouldValidate: true });
    updateRow(index, { query: alimento.description, results: [], open: false });
  };

  const onSubmit = async (data: ReceitaForm) => {
    if (!calculos) return;
    setSalvando(true);
    try {
      const custos = calcularCustosReceita(data.ingredientes as IngredienteReceita[], data.porcoes, data.margemLucro);
      onSalvar({
        id: receitaInicial?.id ?? Date.now().toString(),
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
                              onClick={() => remove(index)}
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
                              {row.results.map((alimento) => (
                                <button
                                  key={alimento.id}
                                  type="button"
                                  onMouseDown={() => handleSelectAlimento(index, alimento)}
                                  className="w-full text-left px-4 py-2.5 hover:bg-brand/5 border-0 bg-transparent cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-b-0"
                                >
                                  <span className="text-sm text-gray-800 truncate">{alimento.description}</span>
                                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{alimento.category.name}</span>
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
                              Preço / 100g (R$)
                            </label>
                            <input
                              type="number"
                              min={0.01}
                              step={0.01}
                              {...register(`ingredientes.${index}.preco`, { valueAsNumber: true })}
                              placeholder="0,00"
                              className={inputCls(!!errosIng?.preco)}
                            />
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
                    onClick={() => append({ tacoId: 0, nome: "", quantidade: 0, preco: 0 })}
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
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Resumo Financeiro</p>
                  {calculandoApi && (
                    <Loader2 size={14} className="animate-spin text-brand" />
                  )}
                </div>

                {calculos ? (
                  <div className="p-4 flex flex-col gap-3">
                    {[
                      { label: "Custo Total", value: `R$ ${calculos.custoTotal?.toFixed(2)}`, Icon: DollarSign, bg: "bg-blue-50", color: "text-blue-600" },
                      { label: "Custo por Porção", value: `R$ ${calculos.custoPorPorcao?.toFixed(2)}`, Icon: TrendingUp, bg: "bg-purple-50", color: "text-purple-600" },
                      { label: "Preço Sugerido", value: `R$ ${calculos.precoSugerido?.toFixed(2)}`, Icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
                    ].map(({ label, value, Icon, bg, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                          <Icon size={16} className={color} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className={`text-sm font-bold ${color}`}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <DollarSign size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Adicione ingredientes com quantidade e preço para ver o resumo.
                    </p>
                  </div>
                )}
              </div>

              {/* Card: nutricional */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-800">Informação Nutricional</p>
                  <p className="text-xs text-gray-400 mt-0.5">por porção</p>
                </div>

                {calculos ? (
                  <div className="p-4 flex flex-col gap-3">
                    {/* Calorias — destaque */}
                    <div className="bg-brand-orange/8 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                        <Flame size={17} className="text-brand-orange" />
                      </div>
                      <div>
                        <p className="text-xs text-brand-orange/70">Calorias</p>
                        <p className="text-base font-bold text-brand-orange">
                          {calculos.dadosNutricionaisPorPorcao?.calorias?.toFixed(0)} kcal
                        </p>
                      </div>
                    </div>

                    {/* Macros */}
                    {[
                      { label: "Proteínas", value: `${calculos.dadosNutricionaisPorPorcao?.proteinas?.toFixed(1)}g`, Icon: Beef, color: "text-rose-500", bg: "bg-rose-50" },
                      { label: "Carboidratos", value: `${calculos.dadosNutricionaisPorPorcao?.carboidratos?.toFixed(1)}g`, Icon: Wheat, color: "text-amber-500", bg: "bg-amber-50" },
                      { label: "Gorduras", value: `${calculos.dadosNutricionaisPorPorcao?.gorduras?.toFixed(1)}g`, Icon: Droplets, color: "text-sky-500", bg: "bg-sky-50" },
                    ].map(({ label, value, Icon, color, bg }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                          <Icon size={14} className={color} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className={`text-sm font-semibold ${color}`}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <Flame size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Os dados nutricionais aparecem automaticamente conforme os ingredientes são preenchidos.
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
