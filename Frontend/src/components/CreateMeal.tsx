import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Trash2, Loader2, ArrowLeft,
  UtensilsCrossed, DollarSign, Flame,
  Beef, Wheat, Droplets, Info, Activity,
  AlertCircle, FolderHeart
} from "lucide-react";

import { Receita, Refeicao, ReceitaRefeicao, DadosNutricionais } from "../types";

const mealSchema = z.object({
  nome: z.string().min(1, "Nome da refeição é obrigatório"),
  descricao: z.string().optional(),
  receitas: z
    .array(
      z.object({
        receitaId: z.string().min(1, "Selecione uma receita"),
        porcoesUtilizadas: z.number().min(0.01, "A quantidade de porções deve ser maior que zero"),
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

export function CreateMeal({ refeicaoInicial, receitasDisponiveis, onSalvar, onCancelar }: CreateMealProps) {
  const [salvando, setSalvando] = useState(false);
  const [calculos, setCalculos] = useState<CalculosRefeicao | null>(null);

  const { register, handleSubmit, control, formState: { errors }, watch, reset, getValues } =
    useForm<MealForm>({
      resolver: zodResolver(mealSchema),
      defaultValues: refeicaoInicial
        ? {
            nome: refeicaoInicial.nome,
            descricao: refeicaoInicial.descricao,
            receitas: refeicaoInicial.receitas.map((r) => ({
              receitaId: r.receitaId,
              porcoesUtilizadas: r.porcoesUtilizadas,
            })),
          }
        : {
            nome: "",
            descricao: "",
            receitas: [{ receitaId: "", porcoesUtilizadas: 1 }],
          },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "receitas" });

  const watchedReceitas = watch("receitas");

  const executarCalculos = useCallback(() => {
    const currentValues = getValues();
    const receitasList = currentValues.receitas ?? [];

    const validas = receitasList.filter(
      (item) => item && item.receitaId && item.porcoesUtilizadas > 0
    );

    if (validas.length === 0) {
      setCalculos(null);
      return;
    }

    let custoTotal = 0;
    const totais: DadosNutricionais = {
      calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
      acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
      gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
    };

    validas.forEach((item) => {
      const receitaCompleta = receitasDisponiveis.find((r) => r.id === item.receitaId);
      if (receitaCompleta) {
        const porcoes = item.porcoesUtilizadas;
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

    setCalculos({
      custoTotal,
      dadosNutricionaisTotais: totais,
    });
  }, [watchedReceitas, receitasDisponiveis, getValues]);

  useEffect(() => {
    executarCalculos();
  }, [watchedReceitas, executarCalculos]);

  const onSubmit = async (data: MealForm) => {
    if (!calculos) return;
    setSalvando(true);
    try {
      const receitasMapeadas: ReceitaRefeicao[] = data.receitas.map((item) => {
        const receitaInfo = receitasDisponiveis.find((r) => r.id === item.receitaId)!;
        return {
          receitaId: item.receitaId,
          nome: receitaInfo.nome,
          porcoesUtilizadas: item.porcoesUtilizadas,
          custoPorPorcao: receitaInfo.custoPorPorcao,
          dadosNutricionaisPorPorcao: receitaInfo.dadosNutricionaisPorPorcao,
        };
      });

      onSalvar({
        id: refeicaoInicial?.id ?? crypto.randomUUID(),
        nome: data.nome,
        descricao: data.descricao,
        receitas: receitasMapeadas,
        custoTotal: calculos.custoTotal,
        dadosNutricionaisTotais: calculos.dadosNutricionaisTotais,
        createdAt: refeicaoInicial?.createdAt ?? new Date().toISOString(),
      });
      reset();
    } finally {
      setSalvando(false);
    }
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

              {/* Seção 2 — Composição da Refeição (Receitas) */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
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

                        {/* Seleção de Receita e Porções */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
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

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              Porções Utilizadas <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              min={0.01}
                              step="any"
                              {...register(`receitas.${index}.porcoesUtilizadas`, { valueAsNumber: true })}
                              placeholder="1"
                              className={inputCls(!!errosRec?.porcoesUtilizadas)}
                            />
                            {errosRec?.porcoesUtilizadas && (
                              <p className="text-red-500 text-xs mt-1">{errosRec.porcoesUtilizadas.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Prévia financeira rápida da linha */}
                        {receitaSelecionada && (
                          <div className="flex items-center justify-between text-xs bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                            <span className="text-gray-500">
                              Custo base: <strong className="text-gray-700">R$ {receitaSelecionada.custoPorPorcao.toFixed(2)} / porção</strong>
                            </span>
                            <span className="text-gray-500">
                              Custo proporcional: <strong className="text-[#04585a]">R$ {(receitaSelecionada.custoPorPorcao * (watchedReceitas[index]?.porcoesUtilizadas || 0)).toFixed(2)}</strong>
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
                    onClick={() => append({ receitaId: "", porcoesUtilizadas: 1 })}
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
                          {watchedReceitas.reduce((acc, curr) => acc + (Number(curr?.porcoesUtilizadas) || 0), 0).toFixed(1)}
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
