import { useState, useMemo } from "react";
import {
  ArrowLeft, Calendar, DollarSign, Package, TrendingUp, AlertTriangle, 
  Users, Utensils, ChevronLeft, ChevronRight, Activity, Percent, 
  ArrowUpRight, ShoppingBag, Award, Clock, Printer
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart
} from "recharts";
import { Refeicao, Receita } from "../types";
import { ProducaoRegistro, VendaRegistro } from "./ProductionRegister";

interface Despesa {
  id: string;
  data: string;
  mesReferencia: string;
  categoria: string;
  descricao: string;
  tipoCusto: 'Fixo' | 'Variável' | 'Investimento';
  statusPagamento: 'Pago' | 'A Pagar';
  valorTotal: number;
}

interface LoteEstoque {
  id: string;
  quantidadeOriginal: number;
  quantidadeAtual: number;
  custoUnitario: number;
  dataValidade: string;
  fornecedor?: string;
}

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  custoMedio: number;
  lotes: LoteEstoque[];
}

interface StatisticProps {
  onVoltar: () => void;
  refeicoes: Refeicao[];
  receitas: Receita[];
}

type TabAtiva = "geral" | "financeiro" | "producao" | "estoque" | "fornecedores";

export function Statistic({ onVoltar, refeicoes, receitas }: StatisticProps) {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>("geral");
  const [periodoFiltro, setPeriodoFiltro] = useState<"mes" | "tudo">("mes");
  const [tipoGraficoGeral, setTipoGraficoGeral] = useState<"financeiro" | "volume">("financeiro");
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [mesSelecionado, setMesSelecionado] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Carregar dados do LocalStorage
  const producoes = useMemo<ProducaoRegistro[]>(() => {
    try {
      const data = localStorage.getItem("historico_producao");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const despesas = useMemo<Despesa[]>(() => {
    try {
      const data = localStorage.getItem("despesas_operacionais");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const estoqueItens = useMemo<ItemEstoque[]>(() => {
    try {
      const data = localStorage.getItem("estoque_itens");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const vendas = useMemo<VendaRegistro[]>(() => {
    try {
      const data = localStorage.getItem("historico_vendas");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  // Navegação de mês
  const nextMonth = () => {
    const [y, m] = mesSelecionado.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1);
    date.setMonth(date.getMonth() + 1);
    setMesSelecionado(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const prevMonth = () => {
    const [y, m] = mesSelecionado.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1);
    date.setMonth(date.getMonth() - 1);
    setMesSelecionado(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthYear = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1);
    const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // Timeout para dar tempo do Recharts medir a tela e renderizar todos os graficos
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 600);
  };

  // Filtrar produções e despesas com base no período selecionado
  const producoesFiltradas = useMemo(() => {
    if (periodoFiltro === "tudo") return producoes;
    return producoes.filter((p) => p.mesReferencia === mesSelecionado);
  }, [producoes, periodoFiltro, mesSelecionado]);

  const despesasFiltradas = useMemo(() => {
    if (periodoFiltro === "tudo") return despesas;
    return despesas.filter((d) => d.mesReferencia === mesSelecionado);
  }, [despesas, periodoFiltro, mesSelecionado]);

  const vendasFiltradas = useMemo(() => {
    if (periodoFiltro === "tudo") return vendas;
    return vendas.filter((v) => v.mesReferencia === mesSelecionado);
  }, [vendas, periodoFiltro, mesSelecionado]);

  // Função auxiliar para calcular faturamento esperado de uma refeição
  const getPrecoVendaRefeicao = (refId: string) => {
    const ref = refeicoes.find((r) => r.id === refId);
    if (!ref) return 0;
    if (ref.precoSugerido && ref.precoSugerido > 0) return ref.precoSugerido;
    return ref.receitas.reduce((acc, recRef) => {
      const rec = receitas.find((r) => r.id === recRef.receitaId);
      const precoSugerido = rec ? rec.precoSugerido : (recRef.custoPorPorcao * 2); 
      return acc + (precoSugerido * recRef.porcoesUtilizadas);
    }, 0);
  };

  // 1. CÁLCULOS GERAIS & FINANCEIROS
  const totalQuantidadeProduzida = useMemo(() => {
    return producoesFiltradas.reduce((acc, p) => acc + p.quantidade, 0);
  }, [producoesFiltradas]);

  const totalCustoProducao = useMemo(() => {
    return producoesFiltradas.reduce((acc, p) => acc + (p.custoTotal || 0), 0);
  }, [producoesFiltradas]);

  const totalFaturamentoEstimado = useMemo(() => {
    return vendasFiltradas.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
  }, [vendasFiltradas]);

  const totalLucroBruto = useMemo(() => {
    return Math.max(0, totalFaturamentoEstimado - totalCustoProducao);
  }, [totalFaturamentoEstimado, totalCustoProducao]);

  const margemLucroMedia = useMemo(() => {
    if (totalFaturamentoEstimado === 0) return 0;
    return (totalLucroBruto / totalFaturamentoEstimado) * 100;
  }, [totalLucroBruto, totalFaturamentoEstimado]);

  const totalDespesasOperacionais = useMemo(() => {
    return despesasFiltradas.reduce((acc, d) => acc + d.valorTotal, 0);
  }, [despesasFiltradas]);

  const lucroLiquidoEstimado = useMemo(() => {
    return totalLucroBruto - totalDespesasOperacionais;
  }, [totalLucroBruto, totalDespesasOperacionais]);

  // 2. ESTATÍSTICA DE REFEIÇÃO / MARMITA MAIS PRODUZIDA
  const refeicoesMaisProduzidas = useMemo(() => {
    const contagem: Record<string, { nome: string; qtd: number; custoTotal: number; faturamentoTotal: number }> = {};
    
    producoesFiltradas.forEach((p) => {
      const precoVenda = getPrecoVendaRefeicao(p.refeicaoId);
      if (!contagem[p.refeicaoId]) {
        contagem[p.refeicaoId] = {
          nome: p.refeicaoNome,
          qtd: 0,
          custoTotal: 0,
          faturamentoTotal: 0,
        };
      }
      contagem[p.refeicaoId].qtd += p.quantidade;
      contagem[p.refeicaoId].custoTotal += (p.custoTotal || 0);
      contagem[p.refeicaoId].faturamentoTotal += (precoVenda * p.quantidade);
    });

    return Object.values(contagem)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5); 
  }, [producoesFiltradas, refeicoes, receitas]);

  // 3. INGREDIENTES MAIS USADOS
  const ingredientesMaisUsados = useMemo(() => {
    const consumoIngredientes: Record<string, { nome: string; quantidade: number; unidade: string; custoEstimado: number }> = {};

    producoesFiltradas.forEach((p) => {
      const ref = refeicoes.find((r) => r.id === p.refeicaoId);
      if (!ref) return;

      ref.receitas.forEach((recRef) => {
        const rec = receitas.find((r) => r.id === recRef.receitaId);
        if (!rec) return;

        rec.ingredientes.forEach((ing) => {
          const totalConsumido = ing.quantidade * recRef.porcoesUtilizadas * p.quantidade;
          const fatorCusto = (ing.unidade === "kg" || ing.unidade === "l" || ing.unidade === "unidade")
            ? totalConsumido
            : (totalConsumido / 100);
          const custoCalculado = fatorCusto * (ing.preco || 0);

          const key = ing.nome.toLowerCase().trim();
          if (!consumoIngredientes[key]) {
            consumoIngredientes[key] = {
              nome: ing.nome,
              quantidade: 0,
              unidade: ing.unidade || "g",
              custoEstimado: 0,
            };
          }
          consumoIngredientes[key].quantidade += totalConsumido;
          consumoIngredientes[key].custoEstimado += custoCalculado;
        });
      });
    });

    return Object.values(consumoIngredientes)
      .sort((a, b) => b.custoEstimado - a.custoEstimado) 
      .slice(0, 8);
  }, [producoesFiltradas, refeicoes, receitas]);

  // 4. SAÚDE DE ESTOQUE (Validades & Capital)
  const estoqueSaude = useMemo(() => {
    const totalItens = estoqueItens.length;
    const itensAbaixoMinimo = estoqueItens.filter((i) => i.quantidadeAtual <= i.estoqueMinimo).length;
    const capitalImobilizado = estoqueItens.reduce((acc, i) => acc + (i.quantidadeAtual * i.custoMedio), 0);

    const hoje = new Date();
    const lotesCriticos: { itemNome: string; quantidade: number; validade: string; diasRestantes: number; fornecedor?: string }[] = [];

    estoqueItens.forEach((item) => {
      (item.lotes || []).forEach((lote) => {
        const validadeDate = new Date(lote.dataValidade + "T12:00:00");
        const diffTime = validadeDate.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 15) {
          lotesCriticos.push({
            itemNome: item.nome,
            quantidade: lote.quantidadeAtual,
            validade: lote.dataValidade,
            diasRestantes: diffDays,
            fornecedor: lote.fornecedor,
          });
        }
      });
    });

    lotesCriticos.sort((a, b) => a.diasRestantes - b.diasRestantes);

    return {
      totalItens,
      itensAbaixoMinimo,
      capitalImobilizado,
      lotesCriticos: lotesCriticos.slice(0, 5),
    };
  }, [estoqueItens]);

  // 5. ANÁLISE DE FORNECEDORES
  const fornecedoresStats = useMemo(() => {
    const stats: Record<string, { nome: string; totalLotes: number; valorTotalFornecido: number; categorias: Set<string> }> = {};

    estoqueItens.forEach((item) => {
      (item.lotes || []).forEach((lote) => {
        const fornecedorNome = lote.fornecedor?.trim() || "Sem Fornecedor Cadastrado";
        if (!stats[fornecedorNome]) {
          stats[fornecedorNome] = {
            nome: fornecedorNome,
            totalLotes: 0,
            valorTotalFornecido: 0,
            categorias: new Set<string>(),
          };
        }
        stats[fornecedorNome].totalLotes += 1;
        stats[fornecedorNome].valorTotalFornecido += (lote.quantidadeAtual * lote.custoUnitario);
        if (item.categoria) stats[fornecedorNome].categorias.add(item.categoria);
      });
    });

    return Object.values(stats)
      .sort((a, b) => b.valorTotalFornecido - a.valorTotalFornecido);
  }, [estoqueItens]);

  // 6. PROCESSAMENTO DE HISTÓRICO TEMPORAL (Evolução Financeira)
  const dadosEvolucaoTemporal = useMemo(() => {
    if (periodoFiltro === "mes") {
      const [ano, mes] = mesSelecionado.split("-").map(Number);
      const diasNoMes = new Date(ano, mes, 0).getDate();
      
      return Array.from({ length: diasNoMes }, (_, i) => {
        const dia = i + 1;
        const diaStr = String(dia).padStart(2, "0");
        const dataKey = `${mesSelecionado}-${diaStr}`;
        
        const prodNoDia = producoes.filter((p) => p.data === dataKey);
        const despNoDia = despesas.filter((d) => d.data === dataKey);
        const vendasNoDia = vendas.filter((v) => v.data === dataKey);

        const faturamento = vendasNoDia.reduce((sum, v) => sum + (v.valorTotal || 0), 0);
        const custoProd = prodNoDia.reduce((sum, p) => sum + (p.custoTotal || 0), 0);
        const custoDesp = despNoDia.reduce((sum, d) => sum + d.valorTotal, 0);

        const custos = custoProd + custoDesp;
        const lucro = faturamento - custos;

        return {
          label: `${diaStr}`,
          faturamento,
          custos,
          lucro,
          quantidade: prodNoDia.reduce((sum, p) => sum + p.quantidade, 0)
        };
      });
    } else {
      const mesesSet = new Set<string>();
      
      producoes.forEach(p => mesesSet.add(p.mesReferencia));
      despesas.forEach(d => mesesSet.add(d.mesReferencia));
      vendas.forEach(v => mesesSet.add(v.mesReferencia));
      
      if (mesesSet.size === 0) {
        const hoje = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
          mesesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
      }

      const listaMeses = Array.from(mesesSet).sort();

      return listaMeses.map((m) => {
        const prodNoMes = producoes.filter((p) => p.mesReferencia === m);
        const despNoMes = despesas.filter((d) => d.mesReferencia === m);
        const vendasNoMes = vendas.filter((v) => v.mesReferencia === m);

        const faturamento = vendasNoMes.reduce((sum, v) => sum + (v.valorTotal || 0), 0);
        const custoProd = prodNoMes.reduce((sum, p) => sum + (p.custoTotal || 0), 0);
        const custoDesp = despNoMes.reduce((sum, d) => sum + d.valorTotal, 0);

        const custos = custoProd + custoDesp;
        const lucro = faturamento - custos;

        const [y, mm] = m.split("-");
        const mesNomeCurto = new Date(parseInt(y), parseInt(mm) - 1).toLocaleDateString("pt-BR", { month: "short" });
        const label = `${mesNomeCurto.replace(".", "").toUpperCase()} / ${y.slice(2)}`;

        return {
          label,
          faturamento,
          custos,
          lucro,
          quantidade: prodNoMes.reduce((sum, p) => sum + p.quantidade, 0)
        };
      });
    }
  }, [periodoFiltro, mesSelecionado, producoes, despesas, vendas, refeicoes, receitas]);

  // Distribuição de Despesas por Categoria
  const totalValorDespesas = useMemo(() => {
    return despesasFiltradas.reduce((sum, d) => sum + d.valorTotal, 0);
  }, [despesasFiltradas]);

  const despesasPorCategoria = useMemo(() => {
    const catMap: Record<string, number> = {};
    despesasFiltradas.forEach(d => {
      catMap[d.categoria || "Geral"] = (catMap[d.categoria || "Geral"] || 0) + d.valorTotal;
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalValorDespesas > 0 ? value / totalValorDespesas : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [despesasFiltradas, totalValorDespesas]);

  // Distribuição de Capital de Estoque por Categoria
  const estoquePorCategoria = useMemo(() => {
    const catMap: Record<string, number> = {};
    estoqueItens.forEach(item => {
      const valor = item.quantidadeAtual * item.custoMedio;
      if (valor > 0) {
        catMap[item.categoria || "Outros"] = (catMap[item.categoria || "Outros"] || 0) + valor;
      }
    });
    const total = Object.values(catMap).reduce((sum, v) => sum + v, 0);
    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? value / total : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [estoqueItens]);

  // Formatação de Dinheiro
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatQtd = (qtd: number, unidade: string) => {
    if (unidade === "kg" || unidade === "l") {
      if (qtd >= 1000) {
        return `${(qtd / 1000).toFixed(2)} ${unidade}`;
      }
      return `${qtd.toFixed(0)} g/ml`;
    }
    return `${qtd.toFixed(1)} ${unidade}`;
  };

  // Cores de Gráficos Recharts
  const COLORS = ["#04585a", "#0f766e", "#0d9488", "#14b8a6", "#2dd4bf", "#64748b", "#94a3b8", "#cbd5e1"];

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24 print:pb-0 font-sans selection:bg-[#04585a]/20 animate-fadeIn print:bg-white print:min-h-0">
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .bg-white.rounded-2xl { break-inside: avoid; }
          }
        `}
      </style>
      
      {/* Header */}
      <header className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onVoltar}
              className="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-900 transition-colors" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Raio-X do Negócio (Estatísticas)</h1>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="group flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white text-sm font-bold rounded-xl border-0 cursor-pointer shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 transition-all active:scale-95 print:hidden"
            title="Gera um PDF via caixa de diálogo de impressão do navegador"
          >
            <Printer size={18} className="text-gray-300 group-hover:text-white transition-colors" />
            <span className="tracking-wide">Exportar PDF</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 print:py-0 print:px-0 flex flex-col gap-8 print:gap-4 print:w-full print:max-w-none">
        
        {/* Controle do Filtro de Período */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm print:hidden">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configuração de Relatório</h2>
            <p className="text-xs text-gray-400 mt-1">Selecione o horizonte de tempo para analisar sua produção e saúde financeira.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPeriodoFiltro("mes")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all border-0 cursor-pointer ${
                  periodoFiltro === "mes" ? "bg-white text-[#04585a] shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Por Mês
              </button>
              <button
                onClick={() => setPeriodoFiltro("tudo")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all border-0 cursor-pointer ${
                  periodoFiltro === "tudo" ? "bg-white text-[#04585a] shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Todo o Histórico
              </button>
            </div>

            {periodoFiltro === "mes" && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 p-1">
                <button onClick={prevMonth} className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors border-0 bg-transparent cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-gray-700 px-3 capitalize min-w-[120px] text-center">
                  {formatMonthYear(mesSelecionado)}
                </span>
                <button onClick={nextMonth} className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors border-0 bg-transparent cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Título de Impressão */}
        <div className="hidden print:block text-center mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-black text-gray-900 uppercase">
            Relatório Gerencial - {periodoFiltro === "mes" ? formatMonthYear(mesSelecionado) : "Histórico Completo"}
          </h2>
          <p className="text-gray-500 mt-1">Cozinha da Nutri</p>
        </div>

        {/* Abas */}
        <div className="border-b border-gray-200 print:hidden">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: "geral", label: "Visão Geral", icon: Activity },
              { id: "financeiro", label: "Custos e Lucratividade", icon: DollarSign },
              { id: "producao", label: "Produção e Ingredientes", icon: Utensils },
              { id: "estoque", label: "Saúde do Estoque", icon: Package },
              { id: "fornecedores", label: "Fornecedores", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabAtiva(tab.id as TabAtiva)}
                  className={`border-b-2 py-4 px-1 text-sm font-semibold flex items-center gap-2 border-0 bg-transparent cursor-pointer transition-all ${
                    tabAtiva === tab.id
                      ? "border-[#04585a] text-[#04585a]"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab 1: Geral / Dashboard Macro */}
        {(tabAtiva === "geral" || isPrinting) && (
          <div className="space-y-8 animate-fadeIn print:space-y-4 print:mb-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Estimado</span>
                <h3 className="text-3xl font-light text-emerald-600 font-sans tracking-tight">{formatBRL(totalFaturamentoEstimado)}</h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-emerald-500" /> Preço sugerido das marmitas feitas
                </span>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custo Total de Produção</span>
                <h3 className="text-3xl font-light text-amber-600 tracking-tight">{formatBRL(totalCustoProducao)}</h3>
                <span className="text-[10px] text-gray-400 mt-1">Custo unitário acumulado das fichas</span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lucro Bruto Estimado</span>
                <h3 className="text-3xl font-light text-[#04585a] tracking-tight">{formatBRL(totalLucroBruto)}</h3>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Percent size={12} className="text-[#04585a]" /> Margem média de {margemLucroMedia.toFixed(1)}%
                </span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Despesas Operacionais</span>
                <h3 className="text-3xl font-light text-rose-600 tracking-tight">{formatBRL(totalDespesasOperacionais)}</h3>
                <span className="text-[10px] text-gray-400 mt-1">Contas e custos fixos/variáveis lançados</span>
              </div>
            </div>

            {/* Recharts: Grafico de Evolução Temporal */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Evolução Financeira (Faturamento vs Custos vs Lucros)</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Visualização temporal de faturamento bruto, custos acumulados e lucro líquido.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setTipoGraficoGeral("financeiro")}
                      className={`px-3 py-1 rounded text-[11px] font-bold border-0 cursor-pointer ${
                        tipoGraficoGeral === "financeiro" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      Dinheiro (R$)
                    </button>
                    <button
                      onClick={() => setTipoGraficoGeral("volume")}
                      className={`px-3 py-1 rounded text-[11px] font-bold border-0 cursor-pointer ${
                        tipoGraficoGeral === "volume" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      Volume (un.)
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Gráfico Recharts de Linha/Área */}
              <div className="w-full h-[280px]">
                {dadosEvolucaoTemporal.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    Sem dados de produção ou despesas no período selecionado.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dadosEvolucaoTemporal} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFaturamentoRe" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorLucroRe" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#04585a" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#04585a" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false} 
                        tickFormatter={(value) => 
                          tipoGraficoGeral === "financeiro" 
                            ? `R$ ${value}` 
                            : value
                        }
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#ffffff", 
                          border: "1px solid #e2e8f0", 
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)"
                        }}
                        formatter={(value: any, name: any) => {
                          const formattedValue = tipoGraficoGeral === "financeiro" 
                            ? formatBRL(Number(value)) 
                            : `${value} un`;
                          const labelMap: Record<string, string> = {
                            faturamento: "Faturamento",
                            custos: "Custos Totais",
                            lucro: "Lucro Líquido",
                            quantidade: "Quantidade"
                          };
                          const nameStr = String(name || "");
                          return [formattedValue, labelMap[nameStr] || nameStr];
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: "11px", fontWeight: "bold", paddingTop: "10px" }}
                        iconType="circle"
                      />
                      {tipoGraficoGeral === "financeiro" ? (
                        <>
                          <Area 
                            type="monotone" 
                            dataKey="faturamento" 
                            name="faturamento"
                            stroke="#10b981" 
                            strokeWidth={2.5}
                            fill="url(#colorFaturamentoRe)" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="custos" 
                            name="custos"
                            stroke="#f43f5e" 
                            strokeWidth={2} 
                            strokeDasharray="4 4"
                            dot={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="lucro" 
                            name="lucro"
                            stroke="#04585a" 
                            strokeWidth={3}
                            fill="url(#colorLucroRe)"
                          />
                        </>
                      ) : (
                        <Area 
                          type="monotone" 
                          dataKey="quantidade" 
                          name="quantidade"
                          stroke="#6366f1" 
                          fill="#6366f1"
                          fillOpacity={0.1}
                          strokeWidth={2.5}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Segunda Linha: Resumo da Operação */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Resultado Líquido do Período</h3>
                  <p className="text-xs text-gray-400 mt-1">Margem bruta subtraindo todas as despesas no período selecionado.</p>
                </div>

                <div className={`p-6 rounded-2xl flex flex-col justify-center items-center text-center gap-2 ${
                  lucroLiquidoEstimado >= 0 ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
                }`}>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sobras de Caixa / Lucro Líquido</span>
                  <h4 className={`text-4xl font-black ${lucroLiquidoEstimado >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatBRL(lucroLiquidoEstimado)}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
                    {lucroLiquidoEstimado >= 0 
                      ? "Operação saudável! O faturamento acumulado das marmitas foi capaz de pagar os ingredientes e todos os custos fixos com margem positiva." 
                      : "Atenção: Suas despesas operacionais superaram seu lucro bruto de vendas estimadas. Avalie cortar gastos fixos ou elevar a produção/preço."}
                  </p>
                </div>
              </div>

              {/* Saúde Rápida do Estoque */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
                <h3 className="text-base font-bold text-gray-950">Alertas e Saúde Operacional</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={18} className="text-[#04585a]" />
                      <span className="text-xs font-bold text-gray-700">Itens em Estoque</span>
                    </div>
                    <span className="text-sm font-black text-gray-950">{estoqueSaude.totalItens}</span>
                  </div>

                  <div className={`flex items-center justify-between p-3.5 rounded-xl ${
                    estoqueSaude.itensAbaixoMinimo > 0 ? "bg-amber-50 border border-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={18} />
                      <span className="text-xs font-bold">Abaixo do Mínimo</span>
                    </div>
                    <span className="text-sm font-black">{estoqueSaude.itensAbaixoMinimo} itens</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-indigo-600" />
                      <span className="text-xs font-bold text-gray-700">Volume Produzido</span>
                    </div>
                    <span className="text-sm font-black text-gray-950">{totalQuantidadeProduzida} un.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financeiro Detalhado */}
        {(tabAtiva === "financeiro" || isPrinting) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn print:grid-cols-3 print:gap-4 print:mb-8">
            {/* Lista de Custos */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-col gap-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Recharts Donut Chart de Categorias de Despesa */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Despesas por Categoria</h3>
                    <p className="text-xs text-gray-400 mt-1">Distribuição percentual do seu gasto operacional.</p>
                  </div>
                  
                  {despesasPorCategoria.length === 0 ? (
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl min-h-[180px]">
                      <p className="text-xs text-gray-400">Sem despesas no período.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="w-full h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={despesasPorCategoria}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={3}
                            >
                              {despesasPorCategoria.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => formatBRL(Number(value))}
                              contentStyle={{ fontSize: "11px", borderRadius: "8px", fontWeight: "bold" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legendas rápidas */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {despesasPorCategoria.slice(0, 4).map((d, idx) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-gray-500 font-semibold truncate max-w-[100px]">{d.name}</span>
                            <span className="text-gray-950 font-bold ml-auto">{Math.round(d.percent * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Estrutura de Saídas</h3>
                    <p className="text-xs text-gray-400 mt-1">Percentual entre custos diretos (marmitas) e indiretos (despesas).</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                        <span>CUSTO DIRETO (Fabricação)</span>
                        <span>{formatBRL(totalCustoProducao)} ({((totalCustoProducao / Math.max(1, totalCustoProducao + totalDespesasOperacionais)) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${(totalCustoProducao / Math.max(1, totalCustoProducao + totalDespesasOperacionais)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                        <span>DESPESAS OPERACIONAIS</span>
                        <span>{formatBRL(totalDespesasOperacionais)} ({((totalDespesasOperacionais / Math.max(1, totalCustoProducao + totalDespesasOperacionais)) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#f43f5e] transition-all duration-500"
                          style={{ width: `${(totalDespesasOperacionais / Math.max(1, totalCustoProducao + totalDespesasOperacionais)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Custos Unitários Médios de Produção</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Custo Unitário Direto Médio</span>
                    <p className="text-xl font-bold text-gray-700 mt-1">
                      {formatBRL(totalQuantidadeProduzida > 0 ? totalCustoProducao / totalQuantidadeProduzida : 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Rateio Unitário Médio</span>
                    <p className="text-xl font-bold text-gray-700 mt-1">
                      {formatBRL(totalQuantidadeProduzida > 0 ? totalDespesasOperacionais / totalQuantidadeProduzida : 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo da Lucratividade */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
              <h3 className="text-base font-bold text-gray-900">Análise de Preços Sugeridos</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                As receitas são precificadas com margem sobre o custo do prato. Mantenha a média de markup acima de 2.0x para cobrir as contas operacionais.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Bruto Unitário Médio</span>
                    <span className="text-lg font-black text-emerald-700 mt-1">
                      {formatBRL(totalQuantidadeProduzida > 0 ? totalLucroBruto / totalQuantidadeProduzida : 0)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between border border-blue-100">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">Markup Médio Praticado</span>
                    <span className="text-lg font-black text-blue-700 mt-1">
                      {totalCustoProducao > 0 ? `${(totalFaturamentoEstimado / totalCustoProducao).toFixed(2)}x` : "0.00x"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Produção e Ingredientes */}
        {(tabAtiva === "producao" || isPrinting) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn print:grid-cols-2 print:gap-4 print:mb-8">
            {/* Pratos Mais Produzidos */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Marmitas & Refeições Mais Produzidas</h3>
                <p className="text-xs text-gray-400 mt-1">Curva ABC de fabricação de produtos prontos.</p>
              </div>

              {refeicoesMaisProduzidas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma produção registrada para esta listagem.</p>
              ) : (
                <div className="space-y-4">
                  {refeicoesMaisProduzidas.map((item, idx) => {
                    const pct = (item.qtd / Math.max(1, totalQuantidadeProduzida)) * 100;
                    return (
                      <div key={item.nome} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                          <span className="truncate max-w-[250px]">{idx + 1}. {item.nome}</span>
                          <span>{item.qtd} un ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#04585a] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Custo de produção: {formatBRL(item.custoTotal)}</span>
                          <span>Faturamento estimado: {formatBRL(item.faturamentoTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ingredientes Mais Usados */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Insumos Mais Consumidos</h3>
                <p className="text-xs text-gray-400 mt-1">Quantidade de ingredientes debitada das fichas técnicas.</p>
              </div>

              {ingredientesMaisUsados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum ingrediente consumido no período.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ingredientesMaisUsados.map((ing) => (
                    <div key={ing.nome} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ing.nome}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tight">Valor consumido: {formatBRL(ing.custoEstimado)}</p>
                      </div>
                      <span className="text-xs font-black text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {formatQtd(ing.quantidade, ing.unidade)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Saúde de Estoque */}
        {(tabAtiva === "estoque" || isPrinting) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn print:grid-cols-3 print:gap-4 print:mb-8">
            {/* Lotes em Risco */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Alertas de Vencimento de Lotes</h3>
                <p className="text-xs text-gray-400 mt-1">Itens vencidos ou a vencer em menos de 15 dias (FEFO).</p>
              </div>

              {estoqueSaude.lotesCriticos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <Award size={40} className="text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-gray-700">Tudo sob controle!</p>
                  <p className="text-xs text-gray-400 mt-1">Nenhum lote de insumos está vencido ou próximo da data limite.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {estoqueSaude.lotesCriticos.map((lote, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{lote.itemNome}</p>
                        <p className="text-[10px] text-gray-400">Fornecedor: {lote.fornecedor || "Não informado"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${
                          lote.diasRestantes <= 0 ? "bg-red-100 text-red-700 animate-pulse" : "bg-amber-100 text-amber-700"
                        }`}>
                          {lote.diasRestantes <= 0 ? "Vencido" : `Vence em ${lote.diasRestantes} dias`}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1">Validade: {new Date(lote.validade + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recharts Donut de Categorias em Estoque */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Capital Imobilizado</h3>
                <p className="text-xs text-gray-400 mt-1">Distribuição do valor financeiro estocado por categoria.</p>
              </div>

              {estoquePorCategoria.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl min-h-[140px]">
                  <p className="text-xs text-gray-400">Estoque sem itens.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="w-full h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={estoquePorCategoria}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={3}
                        >
                          {estoquePorCategoria.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatBRL(Number(value))}
                          contentStyle={{ fontSize: "11px", borderRadius: "8px", fontWeight: "bold" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legenda rápida */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {estoquePorCategoria.slice(0, 4).map((d, idx) => (
                      <div key={d.name} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-gray-500 font-semibold truncate max-w-[80px]">{d.name}</span>
                        <span className="text-gray-950 font-bold ml-auto">{Math.round(d.percent * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col gap-1">
                <span className="text-[9px] font-bold text-[#82c8c9] uppercase tracking-wider">Total Estocado (Custo Médio)</span>
                <h4 className="text-xl font-light tracking-tight">{formatBRL(estoqueSaude.capitalImobilizado)}</h4>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Fornecedores */}
        {(tabAtiva === "fornecedores" || isPrinting) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn print:grid-cols-3 print:gap-4 print:mb-8">
            
            {/* Recharts Bar Chart: Participação de Fornecedores */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Participação de Fornecedores</h3>
                <p className="text-xs text-gray-400 mt-1">Valor financeiro estocado por fornecedor.</p>
              </div>

              {fornecedoresStats.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Nenhum fornecedor ativo.</p>
              ) : (
                <div className="w-full h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fornecedoresStats.slice(0, 5)}
                      layout="vertical"
                      margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="nome" 
                        type="category" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        fontWeight="bold"
                        width={80}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any) => formatBRL(Number(value))}
                        contentStyle={{ fontSize: "10px", borderRadius: "8px", fontWeight: "bold" }}
                      />
                      <Bar dataKey="valorTotalFornecido" name="Valor Estocado" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Tabela Principal */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Histórico de Fornecimento</h3>
                <p className="text-xs text-gray-400 mt-1">Volume de compras, lotes ativos e categorias fornecidas.</p>
              </div>

              {fornecedoresStats.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">Cadastre fornecedores na entrada de lotes do estoque.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fornecedor</th>
                        <th className="px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Lotes Ativos</th>
                        <th className="px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Categorias</th>
                        <th className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Valor Estocado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {fornecedoresStats.map((item) => (
                        <tr key={item.nome} className="group hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-900">{item.nome}</span>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="text-xs text-gray-600 font-semibold">{item.totalLotes}</span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className="text-[10px] text-gray-500 font-medium">
                              {Array.from(item.categorias).join(", ") || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-xs font-bold text-gray-900">{formatBRL(item.valorTotalFornecido)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
