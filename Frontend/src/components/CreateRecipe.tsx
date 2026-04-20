import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChefHat, Loader2, Search, ArrowLeft } from "lucide-react";

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

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm outline-none box-border transition ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-brand"
  }`;

export function CriarReceita({ receitaInicial, onSalvar, onCancelar }: CriarReceitaProps) {
  const [rowSearches, setRowSearches] = useState<RowSearch[]>(
    receitaInicial
      ? receitaInicial.ingredientes.map((i) => ({ query: i.nome, results: [], loading: false, open: false }))
      : [emptyRow()]
  );
  const [calculos, setCalculos] = useState<any>(null);
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
    <div className="py-8 min-h-[80vh] max-w-4xl mx-auto px-4 sm:px-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancelar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition focus:outline-none"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="p-2.5 rounded-xl bg-teal-50">
          <ChefHat size={22} className="text-teal-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 leading-tight">
            {receitaInicial ? "Editar Receita" : "Nova Receita"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Preencha os dados e adicione os ingredientes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

        {/* Dados gerais */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-teal-600 inline-block" />
            Dados da Receita
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Receita *</label>
            <input {...register("nome")} placeholder="Ex: Bolo de Cenoura" className={inputCls(!!errors.nome)} />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              {...register("descricao")}
              placeholder="Descrição opcional da receita..."
              rows={2}
              className={`${inputCls()} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porções *</label>
              <input
                type="number"
                min={1}
                {...register("porcoes", { valueAsNumber: true })}
                className={inputCls(!!errors.porcoes)}
              />
              {errors.porcoes && <p className="text-red-500 text-xs mt-1">{errors.porcoes.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro (%)</label>
              <input
                type="number"
                min={0}
                step={5}
                {...register("margemLucro", { valueAsNumber: true })}
                className={inputCls(!!errors.margemLucro)}
              />
            </div>
          </div>
        </section>

        {/* Ingredientes */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-teal-600 inline-block" />
              Ingredientes
            </h2>
            <button
              type="button"
              onClick={() => { append({ tacoId: 0, nome: "", quantidade: 0, preco: 0 }); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition focus:outline-none border-0 cursor-pointer"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {typeof errors.ingredientes?.root?.message === 'string' && (
            <p className="text-red-500 text-xs">{errors.ingredientes.root.message}</p>
          )}
          {typeof errors.ingredientes?.message === 'string' && (
            <p className="text-red-500 text-xs">{errors.ingredientes.message}</p>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const row = rowSearches[index] ?? emptyRow();
              const errosIng = errors.ingredientes?.[index];
              return (
                <div key={field.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-400">Ingrediente {index + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label="Remover ingrediente"
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition border-0 bg-transparent cursor-pointer focus:outline-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Busca TACO */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Alimento (TACO)</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        value={row.query}
                        onChange={(e) => handleQueryChange(index, e.target.value)}
                        onFocus={() => row.results.length > 0 && updateRow(index, { open: true })}
                        onBlur={() => setTimeout(() => updateRow(index, { open: false }), 200)}
                        placeholder="Pesquise na tabela TACO..."
                        className={`${inputCls(!!errosIng?.tacoId)} pl-8 pr-8`}
                      />
                      {row.loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                    </div>
                    {errosIng?.tacoId && <p className="text-red-500 text-xs mt-1">{errosIng.tacoId.message}</p>}
                    {row.open && row.results.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {row.results.map((alimento) => (
                          <button
                            key={alimento.id}
                            type="button"
                            onMouseDown={() => handleSelectAlimento(index, alimento)}
                            className="w-full text-left px-3 py-2.5 hover:bg-teal-50 border-0 bg-transparent cursor-pointer flex items-center justify-between gap-2 border-b border-gray-50 last:border-b-0"
                          >
                            <span className="text-sm font-medium text-gray-800 truncate">{alimento.description}</span>
                            <span className="text-xs text-gray-400 shrink-0">{alimento.category.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantidade e Preço */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade (g)</label>
                      <input
                        type="number"
                        min={1}
                        {...register(`ingredientes.${index}.quantidade`, { valueAsNumber: true })}
                        placeholder="0"
                        className={inputCls(!!errosIng?.quantidade)}
                      />
                      {errosIng?.quantidade && <p className="text-red-500 text-xs mt-1">{errosIng.quantidade.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preço / 100g (R$)</label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        {...register(`ingredientes.${index}.preco`, { valueAsNumber: true })}
                        placeholder="0,00"
                        className={inputCls(!!errosIng?.preco)}
                      />
                      {errosIng?.preco && <p className="text-red-500 text-xs mt-1">{errosIng.preco.message}</p>}
                    </div>
                  </div>

                  {/* Hidden fields */}
                  <input type="hidden" {...register(`ingredientes.${index}.tacoId`, { valueAsNumber: true })} />
                  <input type="hidden" {...register(`ingredientes.${index}.nome`)} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Preview de cálculos */}
        {(calculos || calculandoApi) && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 rounded-full bg-teal-600 inline-block" />
              Resumo Calculado
              {calculandoApi && <Loader2 size={14} className="animate-spin text-teal-600 ml-1" />}
            </h2>

            {calculos && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Custo Total", value: `R$ ${calculos.custoTotal?.toFixed(2)}`, color: "bg-blue-50 text-blue-700" },
                  { label: "Custo/Porção", value: `R$ ${calculos.custoPorPorcao?.toFixed(2)}`, color: "bg-purple-50 text-purple-700" },
                  { label: "Preço Sugerido", value: `R$ ${calculos.precoSugerido?.toFixed(2)}`, color: "bg-green-50 text-green-700" },
                  { label: "Kcal/Porção", value: `${calculos.dadosNutricionaisPorPorcao?.calorias?.toFixed(0)} kcal`, color: "bg-orange-50 text-orange-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-lg px-4 py-3 ${color}`}>
                    <p className="text-xs font-medium opacity-70 mb-0.5">{label}</p>
                    <p className="text-base font-bold">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {calculos && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: "Proteínas", value: `${calculos.dadosNutricionaisPorPorcao?.proteinas?.toFixed(1)}g` },
                  { label: "Carboidratos", value: `${calculos.dadosNutricionaisPorPorcao?.carboidratos?.toFixed(1)}g` },
                  { label: "Gorduras", value: `${calculos.dadosNutricionaisPorPorcao?.gorduras?.toFixed(1)}g` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-4 py-3 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">{label}/porção</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <button
            type="button"
            onClick={onCancelar}
            className="sm:w-36 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer focus:outline-none"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!calculos || salvando}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-0 text-sm font-semibold text-white transition ${
              !calculos || salvando ? "bg-teal-300 cursor-not-allowed" : "bg-teal-700 hover:bg-teal-800 cursor-pointer"
            }`}
          >
            {salvando ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : "Salvar Receita"}
          </button>
        </div>
      </form>
    </div>
  );
}