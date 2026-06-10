import { useState, useEffect, useCallback, useMemo } from "react";
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
  custoOperacional: z.number().min(0, "O custo operacional não pode ser negativo").optional(),
  margemLucro: z.number().min(0, "A margem de lucro não pode ser negativa").optional(),
  dataValidade: z.string().optional(),
  validadeDias: z.number().min(1, "Validade mínima de 1 dia").optional(),
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
  precoSugerido: number;
  margemLucroReal: number;
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
  const [sugestaoCustoOperacional, setSugestaoCustoOperacional] = useState<{ mes: string; valor: number } | null>(null);

  useEffect(() => {
    try {
      const rawDespesas = localStorage.getItem('despesas_operacionais');
      const rawProducoes = localStorage.getItem('historico_producao');
      if (rawDespesas && rawProducoes) {
        const despesas = JSON.parse(rawDespesas) as any[];
        const producoes = JSON.parse(rawProducoes) as any[];

        const despesasPorMes: Record<string, number> = {};
        despesas.forEach(d => {
          if (d.embutirNoRateio) {
            const mes = d.mesReferencia || d.data.substring(0, 7);
            despesasPorMes[mes] = (despesasPorMes[mes] || 0) + (d.valorTotal || 0);
          }
        });

        const producaoPorMes: Record<string, number> = {};
        producoes.forEach(p => {
          const mes = p.mesReferencia || p.data.substring(0, 7);
          producaoPorMes[mes] = (producaoPorMes[mes] || 0) + (p.quantidade || 0);
        });

        const mesesComDados = Object.keys(despesasPorMes).filter(mes => producaoPorMes[mes] > 0);
        
        if (mesesComDados.length > 0) {
          mesesComDados.sort((a, b) => b.localeCompare(a));
          const mesRecente = mesesComDados[0];
          const totalDespesas = despesasPorMes[mesRecente];
          const totalProducao = producaoPorMes[mesRecente];
          
          if (totalProducao > 0) {
            const rateio = totalDespesas / totalProducao;
            const [y, m] = mesRecente.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
            const mesFormatado = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${y}`;

            setSugestaoCustoOperacional({
              mes: mesFormatado,
              valor: rateio
            });
          }
        }
      }
    } catch (e) {
      console.error("Erro ao calcular sugestão de custo operacional:", e);
    }
  }, []);

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

  const [tipoVencimento, setTipoVencimento] = useState<"dias" | "data">(
    refeicaoInicial && !refeicaoInicial.validadeDias && refeicaoInicial.dataValidade ? "data" : "dias"
  );

  const [contemGluten, setContemGluten] = useState<boolean>(refeicaoInicial?.contemGluten ?? false);
  const [contemLactose, setContemLactose] = useState<boolean>(refeicaoInicial?.contemLactose ?? false);
  const [alergicos, setAlergicos] = useState<Record<string, boolean>>(() => ({
    leite: false,
    ovo: false,
    trigo: false,
    soja: false,
    peixe: false,
    amendoim: false,
    castanhas: false,
    ...(refeicaoInicial?.alergicos || {})
  }));
  const [podeConter, setPodeConter] = useState<Record<string, boolean>>(() => ({
    leite: false,
    ovo: false,
    trigo: false,
    soja: false,
    peixe: false,
    amendoim: false,
    castanhas: false,
    ...(refeicaoInicial?.podeConter || {})
  }));
  const [outrosAlergenicos, setOutrosAlergenicos] = useState<string>(refeicaoInicial?.outrosAlergenicos ?? '');

  useEffect(() => {
    if (refeicaoInicial) {
      setContemGluten(refeicaoInicial.contemGluten ?? false);
      setContemLactose(refeicaoInicial.contemLactose ?? false);
      setAlergicos({
        leite: false,
        ovo: false,
        trigo: false,
        soja: false,
        peixe: false,
        amendoim: false,
        castanhas: false,
        ...(refeicaoInicial.alergicos || {})
      });
      setPodeConter({
        leite: false,
        ovo: false,
        trigo: false,
        soja: false,
        peixe: false,
        amendoim: false,
        castanhas: false,
        ...(refeicaoInicial.podeConter || {})
      });
      setOutrosAlergenicos(refeicaoInicial.outrosAlergenicos ?? '');
    } else {
      setContemGluten(false);
      setContemLactose(false);
      setAlergicos({
        leite: false,
        ovo: false,
        trigo: false,
        soja: false,
        peixe: false,
        amendoim: false,
        castanhas: false,
      });
      setPodeConter({
        leite: false,
        ovo: false,
        trigo: false,
        soja: false,
        peixe: false,
        amendoim: false,
        castanhas: false,
      });
      setOutrosAlergenicos('');
    }
  }, [refeicaoInicial]);

  const { register, handleSubmit, control, formState: { errors }, watch, reset, getValues, setValue } =
    useForm<MealForm>({
      resolver: zodResolver(mealSchema) as any,
      defaultValues: (refeicaoInicial
        ? {
            nome: refeicaoInicial.nome,
            descricao: refeicaoInicial.descricao,
            custoOperacional: refeicaoInicial.custoOperacional || 0,
            margemLucro: refeicaoInicial.margemLucro || 0,
            dataValidade: refeicaoInicial.dataValidade || "",
            validadeDias: refeicaoInicial.validadeDias || 3,
            receitas: refeicaoInicial.receitas.map((r) => ({
              receitaId: r.receitaId,
              quantidadeUtilizada: r.quantidadeUtilizada ?? r.porcoesUtilizadas,
              unidadeMedida: (r.unidadeMedida as "porcoes" | "kg" | "g" | "l" | "ml" | "unidade") ?? "porcoes",
            })),
          }
        : {
            nome: "",
            descricao: "",
            custoOperacional: 0,
            margemLucro: 0,
            dataValidade: "",
            validadeDias: 3,
            receitas: [{ receitaId: "", quantidadeUtilizada: 1, unidadeMedida: "porcoes" as const }],
          }) as any,
    });

  const { fields, append, remove } = useFieldArray({ control, name: "receitas" });

  const watchedReceitas = watch("receitas");
  const watchedMargem = watch("margemLucro");
  const watchedCustoOperacional = watch("custoOperacional");
  const watchedValidade = watch("dataValidade");
  const watchedValidadeDias = watch("validadeDias");

  const dataVencimentoCalculada = useMemo(() => {
    if (!watchedValidadeDias || watchedValidadeDias <= 0) return "";
    try {
      const d = new Date();
      d.setDate(d.getDate() + Number(watchedValidadeDias));
      return d.toLocaleDateString('pt-BR');
    } catch {
      return "";
    }
  }, [watchedValidadeDias]);

  useEffect(() => {
    if (tipoVencimento === "dias" && watchedValidadeDias && watchedValidadeDias > 0) {
      const d = new Date();
      d.setDate(d.getDate() + Number(watchedValidadeDias));
      const dateStr = d.toISOString().split('T')[0];
      setValue("dataValidade", dateStr);
    }
  }, [watchedValidadeDias, tipoVencimento, setValue]);

  useEffect(() => {
    if (tipoVencimento === "data" && watchedValidade) {
      try {
        const start = new Date();
        start.setHours(12, 0, 0, 0);
        const end = new Date(watchedValidade + 'T12:00:00');
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 1) {
          setValue("validadeDias", diffDays);
        } else {
          setValue("validadeDias", 1);
        }
      } catch {
        // ignore
      }
    }
  }, [watchedValidade, tipoVencimento, setValue]);

  const obterValidadeMinimaIngredientes = useCallback((): { data: string; ingrediente: string } | null => {
    try {
      const raw = localStorage.getItem('estoque_itens');
      if (!raw) return null;
      const estoque = JSON.parse(raw) as any[];

      const currentValues = getValues();
      const receitasList = currentValues.receitas ?? [];

      let minValidadeDate: Date | null = null;
      let minValidadeIngrediente = "";
      let minValidadeStr = "";

      receitasList.forEach((item) => {
        if (!item || !item.receitaId) return;
        const recipe = receitasDisponiveis.find((r) => r.id === item.receitaId);
        if (!recipe) return;

        recipe.ingredientes.forEach((ing) => {
          const estoqueItem = estoque.find((e) => 
            e.nome.trim().toLowerCase() === ing.nome.trim().toLowerCase()
          );

          if (estoqueItem && estoqueItem.lotes && estoqueItem.lotes.length > 0) {
            estoqueItem.lotes.forEach((lote: any) => {
              if (lote.dataValidade && lote.quantidadeAtual > 0) {
                const loteDate = new Date(lote.dataValidade + "T12:00:00");
                if (!minValidadeDate || loteDate < minValidadeDate) {
                  minValidadeDate = loteDate;
                  minValidadeStr = lote.dataValidade;
                  minValidadeIngrediente = ing.nome;
                }
              }
            });
          }
        });
      });

      if (minValidadeDate && minValidadeStr) {
        return { data: minValidadeStr, ingrediente: minValidadeIngrediente };
      }
    } catch (e) {
      console.error("Erro ao obter validade mínima dos ingredientes:", e);
    }
    return null;
  }, [watchedReceitas, receitasDisponiveis, getValues]);

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
    const margemLucroVal = currentValues.margemLucro || 0;
    const custoOperacionalVal = currentValues.custoOperacional || 0;
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

    const custoTotalReal = custoTotal + custoOperacionalVal;
    const precoSugerido = custoTotalReal * (1 + margemLucroVal / 100);
    const margemLucroReal = precoSugerido - custoTotalReal;

    setCalculos({
      custoTotal,
      precoSugerido,
      margemLucroReal,
      dadosNutricionaisTotais: totais,
    });
  }, [watchedReceitas, watchedMargem, watchedCustoOperacional, embalagensSelecionadas, receitasDisponiveis, getValues, obterPorcoesEquivalentes]);

  useEffect(() => {
    executarCalculos();
  }, [watchedReceitas, watchedMargem, watchedCustoOperacional, embalagensSelecionadas, executarCalculos]);

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
        custoOperacional: data.custoOperacional || 0,
        margemLucro: data.margemLucro || 0,
        precoSugerido: calculos.precoSugerido,
        valorEmbalagem,
        embalagens: embalagensSelecionadas,
        dadosNutricionaisTotais: calculos.dadosNutricionaisTotais,
        dataValidade: data.dataValidade || undefined,
        validadeDias: data.validadeDias || undefined,
        contemGluten,
        contemLactose,
        alergicos,
        podeConter,
        outrosAlergenicos,
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

                  {/* Campo de Vencimento / Validade Dinâmico */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Definir Vencimento/Validade da Marmita
                    </label>
                    <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100/80 mb-3 flex flex-col gap-3">
                      {/* Alternador de tipo de vencimento */}
                      <div className="flex bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/50">
                        <button
                          type="button"
                          onClick={() => setTipoVencimento("dias")}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border-0 cursor-pointer transition-all ${
                            tipoVencimento === "dias"
                              ? "bg-white text-[#04585a] shadow-sm"
                              : "bg-transparent text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Validade em Dias
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoVencimento("data")}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border-0 cursor-pointer transition-all ${
                            tipoVencimento === "data"
                              ? "bg-white text-[#04585a] shadow-sm"
                              : "bg-transparent text-gray-500 hover:text-gray-900"
                          }`}
                        >
                          Data Específica
                        </button>
                      </div>

                      {/* Inputs conforme o tipo selecionado */}
                      {tipoVencimento === "dias" ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              {...register("validadeDias", { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#04585a]"
                            />
                            <span className="text-xs font-bold text-gray-400">dias</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 mt-1">
                            🗓️ Vence em: {dataVencimentoCalculada}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <input
                            type="date"
                            {...register("dataValidade")}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#04585a]"
                          />
                          <span className="text-[10px] font-bold text-indigo-600 mt-1">
                            ⏱️ Equivalente a: {watchedValidadeDias || 1} dias de validade
                          </span>
                        </div>
                      )}
                    </div>

                    {(() => {
                      const validadeMinima = obterValidadeMinimaIngredientes();
                      const showValidadeWarning = validadeMinima && watchedValidade && new Date(watchedValidade + "T12:00:00") > new Date(validadeMinima.data + "T12:00:00");
                      if (showValidadeWarning) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-2.5 mt-3 animate-in fade-in duration-200">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs leading-relaxed">
                              <span className="font-bold">Atenção: Validade Limite Excedida!</span>
                              <p className="mt-0.5">
                                A data de validade informada para a refeição ({new Date(watchedValidade + "T12:00:00").toLocaleDateString('pt-BR')}) é maior do que a validade do ingrediente <strong className="font-semibold">"{validadeMinima.ingrediente}"</strong> no estoque, que vence em <strong className="font-semibold">{new Date(validadeMinima.data + "T12:00:00").toLocaleDateString('pt-BR')}</strong>. 
                                Recomenda-se ajustar a validade da marmita para no máximo esta data.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
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

              {/* Seção 3 — Precificação */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <h2 className="text-sm font-semibold text-gray-800">Precificação</h2>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {/* Banner de sugestão de despesa operacional rateada */}
                  {sugestaoCustoOperacional !== null && (
                    <div className="bg-[#04585a]/5 border border-[#04585a]/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <Info size={16} className="text-[#04585a] shrink-0 mt-0.5" />
                        <div className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-gray-800">Custo Operacional Estimado (Rateio):</span>
                          <p>
                            Com base nas suas despesas e produção de <strong className="capitalize">{sugestaoCustoOperacional.mes}</strong>, o custo operacional médio por marmita é de <strong>R$ {sugestaoCustoOperacional.valor.toFixed(2)}</strong>.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValue("custoOperacional", parseFloat(sugestaoCustoOperacional.valor.toFixed(2)));
                          executarCalculos();
                        }}
                        className="text-xs bg-[#04585a] hover:bg-[#034446] text-white font-bold px-3 py-1.5 rounded-lg border-0 transition shrink-0 cursor-pointer focus:outline-none"
                      >
                        Usar este valor
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Custo Operacional p/ Marmita (R$) <span className="text-gray-300 font-normal normal-case">(Ex: Luz, gás, salários...)</span>
                      </label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          {...register("custoOperacional", { valueAsNumber: true })}
                          placeholder="Ex: 5.50"
                          className={`${inputCls(!!errors.custoOperacional)} pl-8`}
                        />
                      </div>
                      {errors.custoOperacional && <p className="text-red-500 text-xs mt-1">{errors.custoOperacional.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Margem de Lucro (%) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          {...register("margemLucro", { valueAsNumber: true })}
                          placeholder="Ex: 100"
                          className={`${inputCls(!!errors.margemLucro)} pl-8`}
                        />
                      </div>
                      {errors.margemLucro && <p className="text-red-500 text-xs mt-1">{errors.margemLucro.message}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    O preço sugerido será calculado como: (Custo de Insumos + Custo Operacional) + Margem de Lucro (%).
                  </p>
                </div>
              </section>

              {/* Seção 4 — Composição da Refeição (Receitas) */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
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

              {/* Seção 5 — Informações de Alergênicos */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#04585a] text-white text-xs font-bold flex items-center justify-center shrink-0">5</span>
                    <h2 className="text-sm font-semibold text-gray-800">Informações de Alergênicos</h2>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-5">
                  {/* Gluten e Lactose */}
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Restrições Básicas</span>
                    <div className="flex flex-wrap gap-5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={contemGluten}
                          onChange={(e) => setContemGluten(e.target.checked)}
                          className="w-4 h-4 text-[#04585a] focus:ring-[#04585a] border-gray-300 rounded cursor-pointer"
                        />
                        Contém Glúten
                      </label>
                      <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={contemLactose}
                          onChange={(e) => setContemLactose(e.target.checked)}
                          className="w-4 h-4 text-[#04585a] focus:ring-[#04585a] border-gray-300 rounded cursor-pointer"
                        />
                        Contém Lactose
                      </label>
                    </div>
                  </div>

                  {/* Alérgicos: Contém */}
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Alérgicos: Contém</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/30 p-4 rounded-xl border border-gray-100">
                      {[
                        { id: 'leite', label: 'Leite' },
                        { id: 'ovo', label: 'Ovo' },
                        { id: 'trigo', label: 'Trigo' },
                        { id: 'soja', label: 'Soja' },
                        { id: 'peixe', label: 'Peixe' },
                        { id: 'amendoim', label: 'Amendoim' },
                        { id: 'castanhas', label: 'Castanhas' },
                      ].map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={alergicos[item.id] || false}
                            onChange={(e) => setAlergicos({ ...alergicos, [item.id]: e.target.checked })}
                            className="w-4 h-4 text-[#04585a] focus:ring-[#04585a] border-gray-300 rounded cursor-pointer"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Alérgicos: Pode Conter */}
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Alérgicos: Pode Conter (Cruzada)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/30 p-4 rounded-xl border border-gray-100">
                      {[
                        { id: 'leite', label: 'Leite' },
                        { id: 'ovo', label: 'Ovo' },
                        { id: 'trigo', label: 'Trigo' },
                        { id: 'soja', label: 'Soja' },
                        { id: 'peixe', label: 'Peixe' },
                        { id: 'amendoim', label: 'Amendoim' },
                        { id: 'castanhas', label: 'Castanhas' },
                      ].map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={podeConter[item.id] || false}
                            onChange={(e) => setPodeConter({ ...podeConter, [item.id]: e.target.checked })}
                            className="w-4 h-4 text-[#04585a] focus:ring-[#04585a] border-gray-300 rounded cursor-pointer"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Outros Alérgenos */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Outros Alérgicos (ex: Crustáceos, Cevada...)</label>
                    <input
                      type="text"
                      placeholder="Ex: Contém derivados de cevada..."
                      value={outrosAlergenicos}
                      onChange={(e) => setOutrosAlergenicos(e.target.value)}
                      className={inputCls()}
                    />
                  </div>
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
                      <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Preço Sugerido</p>
                      <p className="text-2xl font-black text-blue-600">R$ {calculos.precoSugerido.toFixed(2)}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-500 font-medium">Custo de Insumos</span>
                        <span className="font-bold text-gray-700">R$ {calculos.custoTotal.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-500 font-medium">Custo Operacional</span>
                        <span className="font-bold text-gray-700">R$ {(watchedCustoOperacional || 0).toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs bg-gray-50 p-1.5 rounded">
                        <span className="text-gray-700 font-bold">Custo Total Real</span>
                        <span className="font-extrabold text-gray-900">R$ {(calculos.custoTotal + (watchedCustoOperacional || 0)).toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-500 font-medium">Lucro Estimado</span>
                        <span className="font-bold text-emerald-600">R$ {calculos.margemLucroReal.toFixed(2)}</span>
                      </div>

                      {(() => {
                        const cmvCustoTotal = calculos.custoTotal + (watchedCustoOperacional || 0);
                        const cmvPercent = calculos.precoSugerido > 0 ? (cmvCustoTotal / calculos.precoSugerido) * 100 : 0;
                        let corCMV = "text-orange-500";
                        let statusCMV = "Aceitável";
                        if (cmvPercent < 28) {
                          corCMV = "text-emerald-600";
                          statusCMV = "Ótimo";
                        } else if (cmvPercent > 35) {
                          corCMV = "text-red-500 font-extrabold";
                          statusCMV = "Alto / Alerta";
                        }
                        return (
                          <div className="flex flex-col gap-1 py-2 border-b border-gray-50 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 font-medium">CMV (Custo Total / Venda)</span>
                              <span className={`font-bold ${corCMV}`}>
                                {cmvPercent.toFixed(1)}%
                              </span>
                            </div>
                            <span className={`text-[10px] self-end font-semibold ${corCMV}`}>
                              {statusCMV === "Ótimo" ? "✅ " : statusCMV === "Alto / Alerta" ? "⚠️ " : ""}
                              CMV {statusCMV}
                            </span>
                          </div>
                        );
                      })()}

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
                        <span className="text-gray-500 font-medium">Embalagens</span>
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
