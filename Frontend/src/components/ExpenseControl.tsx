import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Trash2, Edit2, Calendar, LayoutGrid, Type, Hash, DollarSign, X, ChevronLeft, ChevronRight, CheckCircle2, Circle, Check, Search, Lock
} from "lucide-react";

const CATEGORIAS_FIXAS = [
  "Aluguel", "Internet", "Contabilidade", "Pró-labore", "Funcionários", "Sistemas", "Marketing", "Outros (Fixo)"
];

const CATEGORIAS_VARIAVEIS = [
  "Energia", "Água", "Gás", "Taxas de cartão", "Entrega", "Embalagens", "Outros (Variável)"
];

const CATEGORIAS = [...CATEGORIAS_FIXAS, ...CATEGORIAS_VARIAVEIS];

type Categoria = string;

interface Despesa {
  id: string;
  data: string;
  mesReferencia: string;
  categoria: Categoria | string;
  descricao: string;
  tipoCusto: 'Fixo' | 'Variável' | 'Investimento';
  statusPagamento: 'Pago' | 'A Pagar';
  dataPagamento?: string;
  metodoPagamento?: string;
  embutirNoRateio: boolean;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

const expenseSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipoCusto: z.enum(['Fixo', 'Variável', 'Investimento']),
  statusPagamento: z.enum(['Pago', 'A Pagar']),
  dataPagamento: z.string().optional(),
  metodoPagamento: z.string().optional(),
  embutirNoRateio: z.boolean(),
  quantidade: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  valorUnitario: z.number().min(0.01, "Valor deve ser maior que zero"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface ExpenseControlProps {
  onVoltar: () => void;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-0 py-2.5 bg-transparent border-0 border-b-2 ${
    hasError
      ? "border-red-300 focus:border-red-300"
      : "border-gray-200 focus:border-gray-200"
  } text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors`;

const labelCls = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

export function ExpenseControl({ onVoltar }: ExpenseControlProps) {
  const [despesas, setDespesas] = useState<Despesa[]>(() => {
    try {
      const salvas = localStorage.getItem('despesas_operacionais');
      if (salvas) {
        const parsed = JSON.parse(salvas);
        return parsed.map((d: any) => ({
          ...d,
          mesReferencia: d.mesReferencia || d.data.substring(0, 7),
          tipoCusto: d.tipoCusto || 'Fixo',
          statusPagamento: d.statusPagamento || 'Pago',
          embutirNoRateio: d.embutirNoRateio !== undefined ? d.embutirNoRateio : true,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [mesSelecionado, setMesSelecionado] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [producoes, setProducoes] = useState<any[]>(() => {
    try {
      const data = localStorage.getItem('historico_producao');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const producaoMensal = useMemo(() => {
    const producoesDoMes = producoes.filter(p => p.mesReferencia === mesSelecionado);
    return producoesDoMes.reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [producoes, mesSelecionado]);
  const [mostrarFormInline, setMostrarFormInline] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todas");

  const [pagamentoEmEdicao, setPagamentoEmEdicao] = useState<string | null>(null);
  const [editDataPagamento, setEditDataPagamento] = useState<string>("");
  const [editMetodoPagamento, setEditMetodoPagamento] = useState<string>("");

  useEffect(() => {
    localStorage.setItem('despesas_operacionais', JSON.stringify(despesas));
  }, [despesas]);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      tipoCusto: 'Fixo',
      statusPagamento: 'Pago',
      dataPagamento: new Date().toISOString().split('T')[0],
      metodoPagamento: 'Pix',
      embutirNoRateio: true,
      quantidade: 1,
      valorUnitario: undefined
    }
  });

  const quantidadeWatcher = watch("quantidade", 1);
  const valorUnitarioWatcher = watch("valorUnitario", 0);
  const statusWatcher = watch("statusPagamento");
  const tipoCustoWatcher = watch("tipoCusto");

  const onAddExpense = (data: ExpenseForm) => {
    const novaDespesa: Despesa = {
      id: crypto.randomUUID(),
      data: data.data,
      mesReferencia: data.data.substring(0, 7),
      categoria: data.categoria,
      descricao: data.descricao,
      tipoCusto: data.tipoCusto,
      statusPagamento: data.statusPagamento,
      dataPagamento: data.statusPagamento === 'Pago' ? data.dataPagamento : undefined,
      metodoPagamento: data.statusPagamento === 'Pago' ? data.metodoPagamento : undefined,
      embutirNoRateio: data.embutirNoRateio,
      quantidade: data.quantidade,
      valorUnitario: data.valorUnitario,
      valorTotal: data.quantidade * data.valorUnitario
    };

    setDespesas((prev) => [novaDespesa, ...prev]);
    reset({
      data: new Date().toISOString().split('T')[0],
      categoria: "",
      descricao: "",
      tipoCusto: 'Fixo',
      statusPagamento: 'Pago',
      dataPagamento: new Date().toISOString().split('T')[0],
      metodoPagamento: 'Pix',
      embutirNoRateio: true,
      quantidade: 1,
      valorUnitario: 0
    });
    setMostrarFormInline(false);
  };

  const handleRemover = (id: string) => {
    if (confirm("Remover este lançamento?")) {
      setDespesas(despesas.filter(d => d.id !== id));
    }
  };

  const despesasDoMes = useMemo(() => {
    return despesas.filter(d => {
      const matchMes = d.mesReferencia === mesSelecionado;
      const matchCategoria = filtroCategoria === "Todas" || d.categoria === filtroCategoria;
      const matchBusca = termoBusca 
        ? d.descricao.toLowerCase().includes(termoBusca.toLowerCase()) || d.categoria.toLowerCase().includes(termoBusca.toLowerCase())
        : true;
      return matchMes && matchCategoria && matchBusca;
    });
  }, [despesas, mesSelecionado, termoBusca, filtroCategoria]);

  const handleClickStatus = (d: Despesa) => {
    if (d.statusPagamento === 'Pago') {
      setDespesas(prev => prev.map(item => item.id === d.id ? { ...item, statusPagamento: 'A Pagar', dataPagamento: undefined, metodoPagamento: undefined } : item));
    } else {
      setEditDataPagamento(new Date().toISOString().split('T')[0]);
      setEditMetodoPagamento("Pix");
      setPagamentoEmEdicao(d.id);
    }
  };

  const confirmarPagamento = (id: string) => {
    setDespesas(prev => prev.map(item => item.id === id ? { 
      ...item, 
      statusPagamento: 'Pago', 
      dataPagamento: editDataPagamento, 
      metodoPagamento: editMetodoPagamento 
    } : item));
    setPagamentoEmEdicao(null);
  };

  const totalDespesas = useMemo(() => {
    return despesasDoMes.reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [despesasDoMes]);

  const totalParaRateio = useMemo(() => {
    return despesasDoMes
      .filter(d => d.embutirNoRateio)
      .reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [despesasDoMes]);

  const custoPorMarmita = useMemo(() => {
    if (producaoMensal <= 0) return 0;
    return totalParaRateio / producaoMensal;
  }, [totalParaRateio, producaoMensal]);

  const formatMonthYear = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
  };

  const nextMonth = () => {
    const [y, m] = mesSelecionado.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    date.setMonth(date.getMonth() + 1);
    setMesSelecionado(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const prevMonth = () => {
    const [y, m] = mesSelecionado.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    date.setMonth(date.getMonth() - 1);
    setMesSelecionado(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24 font-sans selection:bg-[#04585a]/20">
      
      {/* ── Minimalist Header ──────────────────────────────────────────────── */}
      <header className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onVoltar}
              className="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-900 transition-colors" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Despesas e Rateio</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-light text-gray-900 tracking-tight">
            Visão Geral: <span className="font-semibold capitalize">{formatMonthYear(mesSelecionado)}</span>
          </h2>
          <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 p-1 shadow-sm">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors border-0 bg-transparent cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-700 px-4 capitalize min-w-[140px] text-center">
              {formatMonthYear(mesSelecionado)}
            </span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors border-0 bg-transparent cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ── Unified Command Center (KPIs) ────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
          
          {/* Metric 1: Total */}
          <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Custo Operacional Total
              </p>
              <DollarSign size={20} className="text-gray-300" />
            </div>
            <h3 className="text-4xl font-light tracking-tight text-gray-900">
              {formatCurrency(totalDespesas).replace('R$', '').trim()}
              <span className="text-xl text-gray-400 ml-2 font-normal">BRL</span>
            </h3>
          </div>
          
          {/* Metric 2: Produção */}
          <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Volume de Produção (Mês)
              </p>
              <div className="text-gray-300" title="Valor calculado automaticamente">
                <Lock size={16} />
              </div>
            </div>
            
            <h3 className="text-4xl font-light tracking-tight text-gray-900">
              {producaoMensal.toLocaleString('pt-BR')}
              <span className="text-xl text-gray-400 ml-2 font-normal">unid.</span>
            </h3>
          </div>

          {/* Metric 3: Rateio */}
          <div className="flex-1 p-8 bg-[#04585a] text-white relative overflow-hidden flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wider mb-4 relative z-10 text-[#82c8c9]">
              Rateio por Unidade
            </p>
            <div className="flex items-center gap-3 relative z-10">
              <h3 className="text-4xl font-light tracking-tight text-white">
                <span className="text-2xl font-normal opacity-80 mr-1">R$</span>
                {custoPorMarmita.toFixed(2).replace('.', ',')}
              </h3>
            </div>
            <p className="text-base mt-2 font-medium relative z-10 text-[#82c8c9]">
              A ser embutido no custo de cada marmita
            </p>
          </div>

        </section>

        {/* ── Main Layout: Table ────────────────────────────────────── */}
        <section className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4">
                <h4 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Histórico de Despesas</h4>
                <div className="flex items-center gap-4 flex-1 justify-end">
                  
                  {/* Filtro de Categoria */}
                  <div className="hidden md:block w-48">
                    <select
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border-0 rounded-xl text-sm focus:ring-1 focus:ring-gray-200 outline-none transition-all text-gray-700 cursor-pointer"
                    >
                      <option value="Todas">Todas as Categorias</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="relative max-w-xs w-full hidden md:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar despesa..." 
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-xl text-sm focus:ring-1 focus:ring-gray-200 outline-none transition-all"
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                    />
                  </div>
                  {!mostrarFormInline && (
                    <button
                      onClick={() => setMostrarFormInline(true)}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center gap-2 shadow-sm whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário Inline */}
              {mostrarFormInline && (
                <div className="border-b border-gray-200 bg-gray-50/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Novo Lançamento
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Insira custos variáveis e fixos do período.
                      </p>
                    </div>
                    <button 
                      onClick={() => setMostrarFormInline(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 border-0 bg-transparent cursor-pointer transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onAddExpense)} className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className={labelCls}>Data</label>
                        <input type="date" {...register("data")} className={inputCls(!!errors.data)} />
                      </div>
                      <div>
                        <label className={labelCls}>Tipo de Custo</label>
                        <select {...register("tipoCusto")} className={inputCls(!!errors.tipoCusto)}>
                          <option value="Fixo">Custo Fixo Mensal</option>
                          <option value="Variável">Custo Variável / Pontual</option>
                          <option value="Investimento">Investimento / Equipamento</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Status</label>
                        <select {...register("statusPagamento")} className={inputCls(!!errors.statusPagamento)}>
                          <option value="Pago">Já Pago</option>
                          <option value="A Pagar">A Pagar / Pendente</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex-1">
                        <label className={labelCls}>Categoria</label>
                        <select {...register("categoria")} className={inputCls(!!errors.categoria)}>
                          <option value="" disabled>Selecione...</option>
                          {tipoCustoWatcher === "Fixo" && CATEGORIAS_FIXAS.map(c => <option key={c} value={c}>{c}</option>)}
                          {tipoCustoWatcher === "Variável" && CATEGORIAS_VARIAVEIS.map(c => <option key={c} value={c}>{c}</option>)}
                          {tipoCustoWatcher === "Investimento" && <option value="Investimento">Investimento / Equipamentos</option>}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className={labelCls}>Descrição</label>
                        <input {...register("descricao")} placeholder="Ex: Conta de Luz" className={inputCls(!!errors.descricao)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div>
                        <label className={labelCls}>Quantidade</label>
                        <input type="number" min={1} step="any" {...register("quantidade", { valueAsNumber: true })} className={inputCls(!!errors.quantidade)} />
                      </div>
                      <div>
                        <label className={labelCls}>Valor Unit. (R$)</label>
                        <input type="number" min={0.01} step={0.01} {...register("valorUnitario", { valueAsNumber: true })} placeholder="0.00" className={inputCls(!!errors.valorUnitario)} />
                      </div>
                      <div className="pb-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <input 
                              type="checkbox" 
                              {...register("embutirNoRateio")} 
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-gray-900 peer-checked:border-gray-900 transition-colors"></div>
                            <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                            Embutir no Rateio?
                          </span>
                        </label>
                      </div>
                    </div>

                    {statusWatcher === 'Pago' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 border-b border-gray-100/50 mb-2">
                        <div className="flex-1">
                          <label className={labelCls}>Data do Pagamento</label>
                          <input type="date" {...register("dataPagamento")} className={inputCls(!!errors.dataPagamento)} />
                        </div>
                        <div className="flex-1">
                          <label className={labelCls}>Método de Pagamento</label>
                          <select {...register("metodoPagamento")} className={inputCls(!!errors.metodoPagamento)}>
                            <option value="">Selecione...</option>
                            <option value="Pix">Pix</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                            <option value="Cartão de Débito">Cartão de Débito</option>
                            <option value="Boleto">Boleto</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Transferência">Transferência</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full h-14 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-base transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Plus size={20} />
                        Adicionar Despesa
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabela de Despesas */}
              {despesasDoMes.length === 0 ? (
                <div className="px-8 py-20 text-center">
                  <p className="text-gray-400 font-medium">Nenhum lançamento efetuado neste mês.</p>
                  <p className="text-sm text-gray-400 mt-1">Os registros aparecerão aqui.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Data</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Status / Tipo</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Despesa</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Qtd</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Unitário</th>
                        <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Total</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {despesasDoMes.map((despesa) => (
                        <Fragment key={despesa.id}>
                          <tr className={`group hover:bg-gray-50/50 transition-colors ${!despesa.embutirNoRateio ? 'opacity-80' : ''}`}>
                            <td className="px-8 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500">
                                {new Date(despesa.data).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' }).replace('.', '')}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1.5 items-start">
                                <label className="flex items-center gap-2 cursor-pointer group/chk">
                                  <div className="relative flex items-center justify-center w-5 h-5">
                                    <input 
                                      type="checkbox"
                                      checked={despesa.statusPagamento === 'Pago'}
                                      onChange={() => handleClickStatus(despesa)}
                                      className="peer sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-colors ${
                                      despesa.statusPagamento === 'Pago' 
                                        ? 'bg-emerald-500 border-emerald-500' 
                                        : 'border-gray-300 group-hover/chk:border-gray-400'
                                    }`}></div>
                                    {despesa.statusPagamento === 'Pago' && <Check size={14} className="absolute text-white pointer-events-none" strokeWidth={3} />}
                                  </div>
                                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                    despesa.statusPagamento === 'Pago' ? 'text-emerald-700' : 'text-amber-600'
                                  }`}>
                                    {despesa.statusPagamento}
                                  </span>
                                </label>
                                {despesa.statusPagamento === 'Pago' && despesa.dataPagamento && (
                                  <span className="text-[10px] text-gray-400 font-medium">Pago: {new Date(despesa.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} ({despesa.metodoPagamento})</span>
                                )}
                                <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                                  {despesa.tipoCusto}
                                </span>
                              </div>
                            </td>
                          <td className="px-4 py-4">
                            <p className={`text-sm font-medium ${despesa.embutirNoRateio ? 'text-gray-900' : 'text-gray-500'} truncate max-w-[200px]`} title={despesa.descricao}>
                              {despesa.descricao}
                            </p>
                            <p className="text-[11px] font-medium text-gray-400 mt-0.5 truncate max-w-[200px]">
                              {despesa.categoria}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm text-gray-600">{despesa.quantidade}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm text-gray-600">{formatCurrency(despesa.valorUnitario)}</span>
                          </td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(despesa.valorTotal)}</span>
                                {despesa.statusPagamento === 'A Pagar' && (
                                  <button
                                    onClick={() => {
                                      setEditDataPagamento(new Date().toISOString().split('T')[0]);
                                      setEditMetodoPagamento("Pix");
                                      setPagamentoEmEdicao(despesa.id);
                                    }}
                                    className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer border-0 shadow-sm transition-colors"
                                  >
                                    Pagar
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => handleRemover(despesa.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                                title="Remover lançamento"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>

                          {/* Dropdown / Linha expandida de pagamento */}
                          {pagamentoEmEdicao === despesa.id && (
                            <tr className="bg-emerald-50/50">
                              <td colSpan={7} className="px-8 py-6 border-l-4 border-emerald-500">
                                <div className="flex flex-col md:flex-row items-end gap-6 w-full">
                                  <div className="flex-1">
                                    <label className={labelCls}>Data do Pagamento</label>
                                    <input type="date" value={editDataPagamento} onChange={e => setEditDataPagamento(e.target.value)} className={inputCls(false)} />
                                  </div>
                                  <div className="flex-1">
                                    <label className={labelCls}>Método de Pagamento</label>
                                    <select value={editMetodoPagamento} onChange={e => setEditMetodoPagamento(e.target.value)} className={inputCls(false)}>
                                      <option value="Pix">Pix</option>
                                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                                      <option value="Cartão de Débito">Cartão de Débito</option>
                                      <option value="Boleto">Boleto</option>
                                      <option value="Dinheiro">Dinheiro</option>
                                      <option value="Transferência">Transferência</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2 pb-1">
                                    <button onClick={() => setPagamentoEmEdicao(null)} className="px-4 py-2 h-11 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border-0 bg-transparent cursor-pointer">Cancelar</button>
                                    <button onClick={() => confirmarPagamento(despesa.id)} className="px-6 py-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors cursor-pointer border-0 shadow-sm flex items-center gap-2">
                                      <CheckCircle2 size={16} />
                                      Confirmar
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </section>

      </main>
    </div>
  );
}
