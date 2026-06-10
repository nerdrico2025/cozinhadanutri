import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, ChefHat, Loader2, Search, ArrowLeft,
  UtensilsCrossed, DollarSign, Flame,
  Beef, Wheat, Droplets, Info, Activity,
  PlusCircle, AlertCircle
} from "lucide-react";

import { Receita, IngredienteReceita, DadosNutricionais, Ingrediente, Unidade } from "../types";
import {
  calcularCustosReceita,
  calcularDadosNutricionaisPorPorcao,
} from "../utils/calculations";
import { buscarAlimentosBackend, listarAlimentos } from "../services/alimentos";

const receitaSchema = z.object({
  nome: z.string().min(1, "Nome da receita é obrigatório"),
  descricao: z.string().optional(),
  porcoes: z.number().min(1, "Número de porções deve ser maior que zero"),
  ingredientes: z
    .array(
      z.object({
        tacoId: z.number().min(1, "Selecione um ingrediente"),
        nome: z.string().min(1),
        quantidade: z.any().refine((val) => {
          if (!val) return false;
          const num = parseFloat(String(val).replace(',', '.'));
          return !isNaN(num) && num > 0;
        }, "Quantidade inválida"),
        preco: z.any().refine((val) => {
          if (val === undefined || val === null || val === '') return true;
          const num = parseFloat(String(val).replace(',', '.'));
          return !isNaN(num) && num >= 0;
        }, "Informe o preço").optional(),
        unidade: z.string().optional(),
        baseUnidade: z.string().optional(),
        cadastrado: z.boolean().optional(),
        precoBase: z.number().optional(),
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
  ingredientes: Ingrediente[];
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

export function CriarReceita({ receitaInicial, onSalvar, onCancelar, onSolicitarCadastro, ingredientes }: CriarReceitaProps) {
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
      defaultValues: receitaInicial
        ? {
            ...receitaInicial,
            ingredientes: receitaInicial.ingredientes.map((i) => {
              const baseIng = ingredientes.find((ing) => String(ing.id) === String(i.tacoId));
              return {
                tacoId: i.tacoId,
                nome: i.nome,
                quantidade: i.quantidade,
                preco: i.preco,
                unidade: i.unidade,
                baseUnidade: baseIng?.unidade || i.baseUnidade || 'g',
                cadastrado: !!baseIng,
                precoBase: baseIng?.preco || i.preco || 0,
              };
            }),
          }
        : {
            porcoes: 1,
            ingredientes: [{ tacoId: 0, nome: "", quantidade: 0, preco: 0, unidade: "g", baseUnidade: "g", cadastrado: false, precoBase: 0 }],
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

  const executarCalculos = useCallback(() => {
    const currentValues = getValues();
    const porcoesVal = currentValues.porcoes ?? 1;
    const margemLucroVal = 0;
    const ingredientesList = currentValues.ingredientes ?? [];

    const validos = ingredientesList.filter((i) => {
      const qtd = parseFloat(String(i.quantidade).replace(',', '.'));
      const p = parseFloat(String(i.precoBase || i.preco || 0).replace(',', '.'));
      return i && i.tacoId && !isNaN(qtd) && qtd > 0 && !isNaN(p) && p >= 0;
    });
    if (validos.length === 0 || porcoesVal <= 0) {
      setCalculos(null);
      return;
    }

    const custos = calcularCustosReceita(
      validos.map(v => {
        const baseUn = v.cadastrado ? v.baseUnidade : v.unidade;
        return { 
          quantidade: parseFloat(String(v.quantidade).replace(',', '.')), 
          preco: parseFloat(String(v.preco).replace(',', '.')), 
          unidade: v.unidade, 
          baseUnidade: baseUn
        };
      }), 
      porcoesVal, 
      margemLucroVal
    );

    const totais: DadosNutricionais = {
      calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
      acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
      gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
    };

    validos.forEach((item) => {
      // 1. Procurar na lista de ingredientes cadastrados (prop)
      let ingredienteCompleto = ingredientes.find(ing => String(ing.id) === String(item.tacoId));

      // 2. Se não achar, procurar nos resultados de pesquisa temporários do rowSearches
      if (!ingredienteCompleto) {
        const searchResult = rowSearches
          .flatMap(rs => rs.results)
          .find(r => String(r.id) === String(item.tacoId));
        ingredienteCompleto = searchResult?.originalData as Ingrediente | undefined;
      }
      
      if (ingredienteCompleto?.dadosNutricionais) {
        const qtd = parseFloat(String(item.quantidade).replace(',', '.'));
        let proporcao = qtd / 100;
        if (item.unidade === 'kg' || item.unidade === 'l') {
          proporcao = qtd * 10;
        } else if (item.unidade === 'unidade') {
          proporcao = qtd;
        }

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
      dadosNutricionaisPorPorcao: calcularDadosNutricionaisPorPorcao(totais, porcoesVal) 
    });
  }, [rowSearches, getValues, ingredientes]);

  useEffect(() => {
    executarCalculos();
  }, [watchedIngredientes, watchedPorcoes, executarCalculos]);

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
            unidade: item.unidade_medida === 'un' ? 'unidade' : (item.unidade_medida || 'g'),
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

    const unidade = (result.originalData as Ingrediente).unidade || 'g';

    setValue(`ingredientes.${index}.tacoId`, Number(result.id), { shouldValidate: true });
    setValue(`ingredientes.${index}.nome`, result.nome, { shouldValidate: true });
    setValue(`ingredientes.${index}.preco`, result.preco || 0.00, { shouldValidate: true });
    setValue(`ingredientes.${index}.precoBase`, result.preco || 0.00, { shouldValidate: true });
    setValue(`ingredientes.${index}.unidade`, unidade, { shouldValidate: true });
    setValue(`ingredientes.${index}.baseUnidade`, unidade, { shouldValidate: true });
    setValue(`ingredientes.${index}.cadastrado`, result.cadastrado, { shouldValidate: true });
    updateRow(index, { query: result.nome, results: [result], open: false });
  };

  const handleConfirmarRedirecionamento = () => {
    const result = modalCadastro.ingrediente;
    if (result && onSolicitarCadastro) {
      const currentData = getValues();
      const rascunho: Receita = {
        id: receitaInicial?.id,
        nome: currentData.nome,
        descricao: currentData.descricao,
        porcoes: currentData.porcoes,
        margemLucro: 0,
        ingredientes: (currentData.ingredientes || []).map((ing) => ({
          tacoId: ing.tacoId,
          nome: ing.nome,
          quantidade: parseFloat(String(ing.quantidade).replace(',', '.')),
          preco: parseFloat(String(ing.preco).replace(',', '.')),
          unidade: ing.unidade as Unidade,
          baseUnidade: ing.baseUnidade as Unidade || ing.unidade as Unidade
        })),
        custoTotal: calculos?.custoTotal || 0,
        custoPorPorcao: calculos?.custoPorPorcao || 0,
        precoSugerido: calculos?.precoSugerido || 0,
        dadosNutricionaisTotais: calculos?.dadosNutricionaisTotais || {
          calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
          acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
          gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
        },
        dadosNutricionaisPorPorcao: calculos?.dadosNutricionaisPorPorcao || {
          calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
          acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
          gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
        },
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
      const ingredientesComNumeros = (data.ingredientes as any[]).map(i => {
        const rawQtd = parseFloat(String(i.quantidade).replace(',', '.'));
        const qtd = isNaN(rawQtd) ? 0 : rawQtd;
        const rawPreco = parseFloat(String(i.preco).replace(',', '.'));
        const preco = isNaN(rawPreco) ? 0 : rawPreco;

        // Converter a quantidade para a unidade base antes de salvar no backend
        const bUnidade = i.baseUnidade || i.unidade || 'g';
        const rUnidade = i.unidade || 'g';
        let quantidadeBase = qtd;
        if (bUnidade === 'l' && rUnidade === 'ml') {
          quantidadeBase = qtd / 1000;
        } else if (bUnidade === 'ml' && rUnidade === 'l') {
          quantidadeBase = qtd * 1000;
        } else if (bUnidade === 'kg' && rUnidade === 'g') {
          quantidadeBase = qtd / 1000;
        } else if (bUnidade === 'g' && rUnidade === 'kg') {
          quantidadeBase = qtd * 1000;
        }

        // Para ingredientes cadastrados, o preço a ser salvo é o preço base (precoBase ou preco)
        const precoSalvar = i.cadastrado ? (i.precoBase ?? preco) : preco;

        return {
          ...i,
          quantidade: quantidadeBase,
          preco: precoSalvar,
          unidade: bUnidade,
        };
      }) as IngredienteReceita[];

      const custos = calcularCustosReceita(ingredientesComNumeros, data.porcoes, 0);
      onSalvar({
        id: receitaInicial?.id,
        nome: data.nome,
        descricao: data.descricao,
        ingredientes: ingredientesComNumeros,
        porcoes: data.porcoes,
        custoTotal: custos.custoTotal,
        custoPorPorcao: custos.custoPorPorcao,
        precoSugerido: custos.precoSugerido,
        margemLucro: 0,
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

                 {/*  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div> */}
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
                          <div className="flex gap-2">
                            <div className="w-24 shrink-0">
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Unidade
                              </label>
                              <select
                                {...register(`ingredientes.${index}.unidade`)}
                                className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none box-border transition-colors focus:border-brand focus:ring-1 focus:ring-brand/20 font-semibold text-gray-700 cursor-pointer appearance-none text-center"
                              >
                                {(() => {
                                  const base = watchedIngredientes[index]?.baseUnidade || watchedIngredientes[index]?.unidade || 'g';
                                  if (base === 'l' || base === 'ml') {
                                    return (
                                      <>
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                      </>
                                    );
                                  } else if (base === 'kg' || base === 'g') {
                                    return (
                                      <>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                      </>
                                    );
                                  } else {
                                    return <option value={base}>{base === 'unidade' ? 'UN' : base}</option>;
                                  }
                                })()}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                Quantidade
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                {...register(`ingredientes.${index}.quantidade`)}
                                placeholder="0"
                                className={`${inputCls(!!errosIng?.quantidade)} w-full`}
                              />
                              {errosIng?.quantidade?.message && typeof errosIng.quantidade.message === 'string' && (
                                <p className="text-red-500 text-xs mt-1">{errosIng.quantidade.message}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              {watchedIngredientes[index]?.cadastrado ? 'Custo (R$)' : `Preço / ${['g', 'ml'].includes(watchedIngredientes[index]?.baseUnidade || watchedIngredientes[index]?.unidade || 'g') ? '100' : ''}${watchedIngredientes[index]?.baseUnidade === 'unidade' || watchedIngredientes[index]?.unidade === 'unidade' ? 'UN' : (watchedIngredientes[index]?.baseUnidade || watchedIngredientes[index]?.unidade || 'g')} (R$)`}
                            </label>
                            <div className="relative">
                              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              {watchedIngredientes[index]?.cadastrado ? (
                                <div className={`${inputCls(false)} pl-8 bg-emerald-50 text-emerald-700 font-bold flex items-center h-[42px]`}>
                                  {(() => {
                                    const ing = watchedIngredientes[index];
                                    const rawQtd = parseFloat(String(ing?.quantidade || 0).replace(',', '.'));
                                    const qtd = isNaN(rawQtd) ? 0 : rawQtd;
                                    const bUnidade = ing?.baseUnidade || ing?.unidade || 'g';
                                    const rUnidade = ing?.unidade || 'g';
                                    let qtdConvertida = qtd;
                                    if (bUnidade === 'l' && rUnidade === 'ml') qtdConvertida = qtd / 1000;
                                    else if (bUnidade === 'ml' && rUnidade === 'l') qtdConvertida = qtd * 1000;
                                    else if (bUnidade === 'kg' && rUnidade === 'g') qtdConvertida = qtd / 1000;
                                    else if (bUnidade === 'g' && rUnidade === 'kg') qtdConvertida = qtd * 1000;
                                    const fator = (bUnidade === 'kg' || bUnidade === 'l' || bUnidade === 'unidade') ? qtdConvertida : (qtdConvertida / 100);
                                    const rawPBase = parseFloat(String(ing?.precoBase || 0).replace(',', '.'));
                                    const pBase = isNaN(rawPBase) ? 0 : rawPBase;
                                    return (fator * pBase).toFixed(2);
                                  })()}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  {...register(`ingredientes.${index}.preco`)}
                                  placeholder="0,00"
                                  className={`${inputCls(!!errosIng?.preco)} pl-8`}
                                />
                              )}
                            </div>
                            {errosIng?.preco?.message && typeof errosIng.preco.message === 'string' && (
                              <p className="text-red-500 text-xs mt-1">{errosIng.preco.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Hidden fields */}
                        <input type="hidden" {...register(`ingredientes.${index}.tacoId`, { valueAsNumber: true })} />
                        <input type="hidden" {...register(`ingredientes.${index}.nome`)} />
                        <input type="hidden" {...register(`ingredientes.${index}.baseUnidade`)} />
                        <input type="hidden" {...register(`ingredientes.${index}.cadastrado`)} />
                        <input type="hidden" {...register(`ingredientes.${index}.precoBase`)} />
                        {watchedIngredientes[index]?.cadastrado && (
                          <input type="hidden" {...register(`ingredientes.${index}.preco`)} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Adicionar mais — rodapé da seção */}
                <div className="px-5 py-3 border-t border-dashed border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      append({ tacoId: 0, nome: "", quantidade: 0, preco: 0, unidade: "g", baseUnidade: "g", cadastrado: false, precoBase: 0 });
                      setRowSearches((prev) => [...prev, emptyRow()]);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-xl border-0 transition-colors cursor-pointer focus:outline-none font-bold shadow-sm"
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
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">Resumo Financeiro</p>
                  <button
                    type="button"
                    onClick={() => executarCalculos()}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                  >
                    Atualizar
                  </button>
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

                   {/*  <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-3 mt-1">
                        <span className="text-sm text-gray-600 font-bold">Custo por Porção</span>
                        <span className="text-lg font-black text-gray-800">R$ {calculos.custoPorPorcao.toFixed(2)}</span>
                      </div>
                    </div> */}
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

      {/* Modal Cadastro de Ingrediente não cadastrado */}
      {modalCadastro.aberto && modalCadastro.ingrediente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4 mx-auto">
              <AlertCircle className="text-amber-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              Ingrediente não cadastrado
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              O ingrediente <strong>"{modalCadastro.ingrediente.nome}"</strong> ainda não possui preço ou unidade cadastrados. Deseja cadastrar agora?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalCadastro({ aberto: false })}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRedirecionamento}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:brightness-110 transition-colors focus:outline-none cursor-pointer border-0"
              >
                Sim, Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
