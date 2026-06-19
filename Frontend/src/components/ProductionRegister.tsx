import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Trash2, Calendar, ChevronLeft, ChevronRight, PackageOpen, LayoutGrid, Edit2, DollarSign, ShoppingBag, AlertTriangle, X
} from "lucide-react";
import { Refeicao } from "../types";

const producaoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  refeicaoId: z.string().min(1, "Selecione uma refeição/marmita"),
  quantidade: z.number().min(1, "A quantidade deve ser de pelo menos 1"),
  validadeDias: z.number().min(1, "Validade mínima de 1 dia"),
  valorUnitario: z.number().min(0, "Valor não pode ser negativo").optional(),
});

type ProducaoForm = z.infer<typeof producaoSchema>;

const vendaSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  refeicaoId: z.string().min(1, "Selecione uma refeição/marmita"),
  quantidade: z.number().min(1, "A quantidade deve ser de pelo menos 1"),
  valorUnitario: z.number().min(0.01, "Valor de venda deve ser maior que zero"),
});

type VendaForm = z.infer<typeof vendaSchema>;

export interface ProducaoRegistro {
  id: string;
  lote?: string;
  data: string;
  mesReferencia: string;
  refeicaoId: string;
  refeicaoNome: string;
  quantidade: number;
  custoUnitario?: number;
  custoTotal?: number;
  validadeDias?: number;
  dataVencimento?: string;
}

export interface VendaRegistro {
  id: string;
  data: string;
  mesReferencia: string;
  refeicaoId: string;
  refeicaoNome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface ProductionRegisterProps {
  onVoltar: () => void;
  refeicoes: Refeicao[];
}

export function ProductionRegister({ onVoltar, refeicoes }: ProductionRegisterProps) {
  const [producoes, setProducoes] = useState<ProducaoRegistro[]>(() => {
    try {
      const data = localStorage.getItem('historico_producao');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Custo/valor unitário é atualizado conforme a marmita selecionada

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const [mostrarFormInline, setMostrarFormInline] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<"producao" | "vendas">("producao");
  const [vendas, setVendas] = useState<VendaRegistro[]>(() => {
    try {
      const data = localStorage.getItem('historico_vendas');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [mostrarFormInlineVenda, setMostrarFormInlineVenda] = useState(false);
  const [editandoVendaId, setEditandoVendaId] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, tipo: 'producao' | 'venda' } | null>(null);

  const [tipoVencimento, setTipoVencimento] = useState<"dias" | "data">("dias");
  const [dataVencimentoEspecifica, setDataVencimentoEspecifica] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    localStorage.setItem('historico_producao', JSON.stringify(producoes));
  }, [producoes]);

  useEffect(() => {
    localStorage.setItem('historico_vendas', JSON.stringify(vendas));
  }, [vendas]);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProducaoForm>({
    resolver: zodResolver(producaoSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      refeicaoId: "",
      quantidade: 1,
      validadeDias: 3,
      valorUnitario: 0,
    }
  });

  const { register: registerVenda, handleSubmit: handleSubmitVenda, setValue: setValueVenda, watch: watchVenda, formState: { errors: errorsVenda }, reset: resetVenda } = useForm<VendaForm>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      refeicaoId: "",
      quantidade: 1,
      valorUnitario: 0,
    }
  });

  const selectedRefeicaoId = watch("refeicaoId");
  useEffect(() => {
    if (selectedRefeicaoId && !editandoId) {
      const refeicao = refeicoes.find(r => String(r.id) === String(selectedRefeicaoId));
      if (refeicao) {
        setValue("valorUnitario", refeicao.custoTotal || 0);
      }
    }
  }, [selectedRefeicaoId, refeicoes, setValue, editandoId]);

  const selectedRefeicaoIdVenda = watchVenda("refeicaoId");
  useEffect(() => {
    if (selectedRefeicaoIdVenda && !editandoVendaId) {
      const refeicao = refeicoes.find(r => String(r.id) === String(selectedRefeicaoIdVenda));
      if (refeicao) {
        setValueVenda("valorUnitario", 0);
      }
    }
  }, [selectedRefeicaoIdVenda, refeicoes, setValueVenda, editandoVendaId]);

  const dataProducao = watch("data");
  const validadeDias = watch("validadeDias");

  const dataVencimentoCalculada = useMemo(() => {
    if (!dataProducao || !validadeDias) return "";
    try {
      const d = new Date(dataProducao + 'T12:00:00');
      d.setDate(d.getDate() + Number(validadeDias));
      return d.toLocaleDateString('pt-BR');
    } catch {
      return "";
    }
  }, [dataProducao, validadeDias]);

  const handleDataVencimentoChange = (dateStr: string) => {
    setDataVencimentoEspecifica(dateStr);
    if (!dataProducao || !dateStr) return;
    try {
      const start = new Date(dataProducao + 'T12:00:00');
      const end = new Date(dateStr + 'T12:00:00');
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
  };

  useEffect(() => {
    if (tipoVencimento === "data" && dataVencimentoEspecifica && dataProducao) {
      handleDataVencimentoChange(dataVencimentoEspecifica);
    }
  }, [dataProducao, tipoVencimento]);

  const onAddProducao = (data: ProducaoForm) => {
    const refeicao = refeicoes.find(r => String(r.id) === String(data.refeicaoId));
    if (!refeicao) return;

    // Se o usuário digitou um valor unitário, usa ele; senão o custoTotal da refeição
    const custoUnit = data.valorUnitario && data.valorUnitario > 0 ? data.valorUnitario : (refeicao.custoTotal || 0);
    const custoTotal = custoUnit * data.quantidade;

    const dataProd = new Date(data.data + 'T12:00:00');
    dataProd.setDate(dataProd.getDate() + data.validadeDias);
    const dataVencimento = dataProd.toISOString().split('T')[0];

    if (editandoId) {
      setProducoes((prev) =>
        prev.map((p) =>
          p.id === editandoId
            ? {
                ...p,
                data: data.data,
                mesReferencia: data.data.substring(0, 7),
                refeicaoId: data.refeicaoId,
                refeicaoNome: refeicao.nome,
                quantidade: data.quantidade,
                custoUnitario: custoUnit,
                custoTotal: custoTotal,
                validadeDias: data.validadeDias,
                dataVencimento,
              }
            : p
        )
      );
      setEditandoId(null);
    } else {
      const dataLoteStr = data.data.replace(/-/g, '');
      const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
      const lote = `LT-${dataLoteStr}-${randomHex}`;

      const novoRegistro: ProducaoRegistro = {
        id: crypto.randomUUID(),
        lote,
        data: data.data,
        mesReferencia: data.data.substring(0, 7),
        refeicaoId: data.refeicaoId,
        refeicaoNome: refeicao.nome,
        quantidade: data.quantidade,
        custoUnitario: custoUnit,
        custoTotal: custoTotal,
        validadeDias: data.validadeDias,
        dataVencimento,
      };

      setProducoes((prev) => [novoRegistro, ...prev]);
    }

    reset({
      data: new Date().toISOString().split('T')[0],
      refeicaoId: "",
      quantidade: 1,
      validadeDias: 3,
      valorUnitario: 0,
    });
    setMostrarFormInline(false);
  };

  const handleEditar = (p: ProducaoRegistro) => {
    setEditandoId(p.id);
    setMostrarFormInline(true);
    
    reset({
      data: p.data,
      refeicaoId: p.refeicaoId,
      quantidade: p.quantidade,
      validadeDias: p.validadeDias || 3,
      valorUnitario: p.custoUnitario || 0,
    });

    if (p.validadeDias) {
      setTipoVencimento("dias");
    }
    if (p.dataVencimento) {
      setDataVencimentoEspecifica(p.dataVencimento);
    }
  };

  const handleRemover = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, tipo: 'producao' });
  };

  const onAddVenda = (data: VendaForm) => {
    const refeicao = refeicoes.find(r => String(r.id) === String(data.refeicaoId));
    if (!refeicao) return;

    const valorTotal = data.valorUnitario * data.quantidade;

    if (editandoVendaId) {
      setVendas((prev) =>
        prev.map((v) =>
          v.id === editandoVendaId
            ? {
                ...v,
                data: data.data,
                mesReferencia: data.data.substring(0, 7),
                refeicaoId: data.refeicaoId,
                refeicaoNome: refeicao.nome,
                quantidade: data.quantidade,
                valorUnitario: data.valorUnitario,
                valorTotal,
              }
            : v
        )
      );
      setEditandoVendaId(null);
    } else {
      const novaVenda: VendaRegistro = {
        id: crypto.randomUUID(),
        data: data.data,
        mesReferencia: data.data.substring(0, 7),
        refeicaoId: data.refeicaoId,
        refeicaoNome: refeicao.nome,
        quantidade: data.quantidade,
        valorUnitario: data.valorUnitario,
        valorTotal,
      };
      setVendas((prev) => [novaVenda, ...prev]);
    }

    resetVenda({
      data: new Date().toISOString().split('T')[0],
      refeicaoId: "",
      quantidade: 1,
      valorUnitario: 0,
    });
    setMostrarFormInlineVenda(false);
  };

  const handleEditarVenda = (v: VendaRegistro) => {
    setEditandoVendaId(v.id);
    setMostrarFormInlineVenda(true);
    resetVenda({
      data: v.data,
      refeicaoId: v.refeicaoId,
      quantidade: v.quantidade,
      valorUnitario: v.valorUnitario,
    });
  };

  const handleRemoverVenda = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, tipo: 'venda' });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.tipo === 'producao') {
      setProducoes(producoes.filter(d => d.id !== deleteConfirm.id));
    } else {
      setVendas(vendas.filter(v => v.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  const vendasDoMes = useMemo(() => {
    return vendas.filter(v => v.mesReferencia === mesSelecionado).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [vendas, mesSelecionado]);

  const totalFaturamentoVendasMes = useMemo(() => {
    return vendasDoMes.reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [vendasDoMes]);

  const totalQuantidadeVendidaMes = useMemo(() => {
    return vendasDoMes.reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [vendasDoMes]);

  const pratoMaisVendidoMes = useMemo(() => {
    if (vendasDoMes.length === 0) return "Nenhum";
    const contagem: Record<string, number> = {};
    vendasDoMes.forEach(v => {
      contagem[v.refeicaoNome] = (contagem[v.refeicaoNome] || 0) + v.quantidade;
    });
    let maiorPrato = "";
    let maiorQtd = 0;
    Object.entries(contagem).forEach(([nome, qtd]) => {
      if (qtd > maiorQtd) {
        maiorQtd = qtd;
        maiorPrato = nome;
      }
    });
    return maiorPrato;
  }, [vendasDoMes]);

  const producoesDoMes = useMemo(() => {
    return producoes.filter(p => p.mesReferencia === mesSelecionado).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [producoes, mesSelecionado]);

  const totalProduzido = useMemo(() => {
    return producoesDoMes.reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [producoesDoMes]);

  const pratoMaisProduzido = useMemo(() => {
    if (producoesDoMes.length === 0) return "Nenhum";
    
    const contagem: Record<string, number> = {};
    producoesDoMes.forEach(p => {
      contagem[p.refeicaoNome] = (contagem[p.refeicaoNome] || 0) + p.quantidade;
    });

    let maiorPrato = "";
    let maiorQtd = 0;
    Object.entries(contagem).forEach(([nome, qtd]) => {
      if (qtd > maiorQtd) {
        maiorQtd = qtd;
        maiorPrato = nome;
      }
    });

    return maiorPrato;
  }, [producoesDoMes]);

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

  const inputCls = (hasError?: boolean) =>
    `w-full px-0 py-2.5 bg-transparent border-0 border-b-2 ${
      hasError
        ? "border-red-300 focus:border-red-300"
        : "border-gray-200 focus:border-gray-200"
    } text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors`;

  const labelCls = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24 font-sans selection:bg-[#04585a]/20">
      
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
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Controle de Produção</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        
        {/* Sub-navegação com alto destaque */}
        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex gap-2 w-full max-w-lg mx-auto">
          <button
            onClick={() => {
              setSubTab("producao");
              setMostrarFormInline(false);
              setMostrarFormInlineVenda(false);
              setEditandoId(null);
              setEditandoVendaId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm border-0 cursor-pointer transition-all ${
              subTab === "producao"
                ? "bg-[#04585a] text-white shadow-md shadow-[#04585a]/15"
                : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <PackageOpen size={16} />
            Lotes de Produção
          </button>
          <button
            onClick={() => {
              setSubTab("vendas");
              setMostrarFormInline(false);
              setMostrarFormInlineVenda(false);
              setEditandoId(null);
              setEditandoVendaId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm border-0 cursor-pointer transition-all ${
              subTab === "vendas"
                ? "bg-[#04585a] text-white shadow-md shadow-[#04585a]/15"
                : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <DollarSign size={16} />
            Registro de Vendas
          </button>
        </div>
        
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

        {subTab === "producao" ? (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
            <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Volume Total do Mês
                </p>
                <PackageOpen size={20} className="text-gray-300" />
              </div>
              <h3 className="text-4xl font-light tracking-tight text-gray-900">
                {totalProduzido.toLocaleString('pt-BR')}
                <span className="text-xl text-gray-400 ml-2 font-normal">unidades</span>
              </h3>
            </div>
            
            <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Refeição Mais Produzida
                </p>
                <LayoutGrid size={20} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-[#04585a] truncate max-w-[300px]">
                {pratoMaisProduzido}
              </h3>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
            <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Faturamento de Vendas
                </p>
                <DollarSign size={20} className="text-emerald-500" />
              </div>
              <h3 className="text-4xl font-light tracking-tight text-emerald-600 font-sans">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFaturamentoVendasMes)}
              </h3>
            </div>
            
            <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Quantidade Vendida
                </p>
                <ShoppingBag size={20} className="text-gray-300" />
              </div>
              <h3 className="text-4xl font-light tracking-tight text-gray-900">
                {totalQuantidadeVendidaMes.toLocaleString('pt-BR')}
                <span className="text-xl text-gray-400 ml-2 font-normal">unidades</span>
              </h3>
            </div>

            <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Marmita Mais Vendida
                </p>
                <LayoutGrid size={20} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-[#04585a] truncate max-w-[300px]">
                {pratoMaisVendidoMes}
              </h3>
            </div>
          </section>
        )}

        {subTab === "producao" ? (
          <section className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4">
                <h4 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Histórico de Produção</h4>
                <div className="flex items-center gap-4 flex-1 justify-end">
                  {!mostrarFormInline && (
                    <>
                      <button
                        onClick={() => setMostrarFormInline(true)}
                        className="px-4 py-2 rounded-xl bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center gap-2 shadow-sm whitespace-nowrap"
                      >
                        <Plus size={16} />
                        Nova Produção
                      </button>
                    </>
                  )}
                </div>
              </div>

              {mostrarFormInline && (
                <div className="border-b border-gray-200 bg-gray-50/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {editandoId ? "Editar Lote de Produção" : "Registrar Lote de Produção"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Informe quantas unidades foram feitas.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormInline(false);
                        setEditandoId(null);
                        reset({
                          data: new Date().toISOString().split('T')[0],
                          refeicaoId: "",
                          quantidade: 1,
                          validadeDias: 3,
                          valorUnitario: 0,
                        });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onAddProducao)} className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                      <div className="md:col-span-1">
                        <label className={labelCls}>Data</label>
                        <input type="date" {...register("data")} className={inputCls(!!errors.data)} />
                      </div>
                      <div className="md:col-span-3">
                        <label className={labelCls}>Marmita / Refeição</label>
                        <select {...register("refeicaoId")} className={inputCls(!!errors.refeicaoId)}>
                          <option value="" disabled>Selecione a marmita produzida...</option>
                          {refeicoes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                          <label className={labelCls}>Quantidade Produzida</label>
                          <input type="number" min={1} step={1} {...register("quantidade", { valueAsNumber: true })} className={inputCls(!!errors.quantidade)} />
                        </div>
                        <div>
                          <label className={labelCls}>Valor Unit. (Opcional)</label>
                          <input type="number" min={0} step={0.01} placeholder="R$ 0,00" {...register("valorUnitario", { valueAsNumber: true })} className={inputCls(!!errors.valorUnitario)} />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3 w-full md:w-1/2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Validade do Lote
                        </label>
                        
                        <div className="flex bg-gray-200/60 p-0.5 rounded-lg w-full">
                          <button
                            type="button"
                            onClick={() => setTipoVencimento("dias")}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border-0 cursor-pointer transition-all ${
                              tipoVencimento === "dias"
                                ? "bg-white text-[#04585a] shadow-sm"
                                : "bg-transparent text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Dias Corridos
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

                        {tipoVencimento === "dias" ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                {...register("validadeDias", { valueAsNumber: true })}
                                className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-[#04585a] text-sm text-gray-900 focus:outline-none py-1 focus:ring-0"
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
                              value={dataVencimentoEspecifica}
                              onChange={(e) => handleDataVencimentoChange(e.target.value)}
                              className="w-full bg-transparent border-0 border-b-2 border-gray-200 focus:border-[#04585a] text-sm text-gray-900 focus:outline-none py-1 focus:ring-0"
                            />
                            <span className="text-[10px] font-bold text-indigo-600 mt-1">
                              ⏱️ Equivalente a: {validadeDias || 1} dias de validade
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" className="w-full md:w-auto px-8 h-12 rounded-xl bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={18} className={editandoId ? "hidden" : ""} />
                        {editandoId ? "Atualizar Lote" : "Salvar Lote"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {producoesDoMes.length === 0 ? (
                <div className="px-8 py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 mx-auto">
                    <Calendar size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Nenhum lote registrado neste mês.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-white">
                        <th className="px-6 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Lote / Data</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Refeição</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">Validade</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Custos</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Qtd</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {producoesDoMes.map((p) => (
                        <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900">{p.lote || 'N/A'}</span>
                              <span className="text-[11px] font-medium text-gray-500 mt-0.5">
                                Prod: {new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">{p.refeicaoNome}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-medium text-gray-600">{p.validadeDias || '-'} dias</span>
                              <span className={`text-[11px] font-bold mt-0.5 ${p.dataVencimento && new Date(p.dataVencimento + 'T12:00:00') < new Date(new Date().setHours(0,0,0,0)) ? 'text-red-500' : 'text-emerald-600'}`}>
                                Venc: {p.dataVencimento ? new Date(p.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-medium text-gray-500">Un: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.custoUnitario || 0)}</span>
                              <span className="text-xs font-bold text-gray-950 mt-0.5">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.custoTotal || 0)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold">
                              {p.quantidade} un.
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditar(p)}
                                className="p-2 text-gray-400 hover:text-[#04585a] hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemover(p.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4">
                <h4 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Histórico de Vendas</h4>
                <div className="flex items-center gap-4 flex-1 justify-end">
                  {!mostrarFormInlineVenda && (
                    <button
                      onClick={() => setMostrarFormInlineVenda(true)}
                      className="px-4 py-2 rounded-xl bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center gap-2 shadow-sm whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Nova Venda
                    </button>
                  )}
                </div>
              </div>

              {mostrarFormInlineVenda && (
                <div className="border-b border-gray-200 bg-gray-50/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {editandoVendaId ? "Editar Registro de Venda" : "Registrar Venda"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Informe quantas unidades foram vendidas e o preço.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormInlineVenda(false);
                        setEditandoVendaId(null);
                        resetVenda({
                          data: new Date().toISOString().split('T')[0],
                          refeicaoId: "",
                          quantidade: 1,
                          valorUnitario: 0,
                        });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border-0 bg-transparent cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleSubmitVenda(onAddVenda)} className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                      <div className="md:col-span-1">
                        <label className={labelCls}>Data</label>
                        <input type="date" {...registerVenda("data")} className={inputCls(!!errorsVenda.data)} />
                        {errorsVenda.data && <p className="text-red-500 text-xs mt-1">{errorsVenda.data.message}</p>}
                      </div>
                      <div className="md:col-span-3">
                        <label className={labelCls}>Marmita / Refeição</label>
                        <select {...registerVenda("refeicaoId")} className={inputCls(!!errorsVenda.refeicaoId)}>
                          <option value="" disabled>Selecione a marmita vendida...</option>
                          {refeicoes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nome}
                            </option>
                          ))}
                        </select>
                        {errorsVenda.refeicaoId && <p className="text-red-500 text-xs mt-1">{errorsVenda.refeicaoId.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div>
                        <label className={labelCls}>Quantidade Vendida</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          {...registerVenda("quantidade", { valueAsNumber: true })}
                          className={inputCls(!!errorsVenda.quantidade)}
                        />
                        {errorsVenda.quantidade && <p className="text-red-500 text-xs mt-1">{errorsVenda.quantidade.message}</p>}
                      </div>
                      <div>
                        <label className={labelCls}>Valor Unitário de Venda (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...registerVenda("valorUnitario", { valueAsNumber: true })}
                          className={inputCls(!!errorsVenda.valorUnitario)}
                        />
                        {errorsVenda.valorUnitario && <p className="text-red-500 text-xs mt-1">{errorsVenda.valorUnitario.message}</p>}
                      </div>
                      <div className="pb-3">
                        <span className="block text-sm font-bold text-emerald-600">
                          Total Venda: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((watchVenda("quantidade") || 0) * (watchVenda("valorUnitario") || 0))}
                        </span>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" className="w-full md:w-auto px-8 h-12 rounded-xl bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={18} className={editandoVendaId ? "hidden" : ""} />
                        {editandoVendaId ? "Atualizar Venda" : "Salvar Venda"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {vendasDoMes.length === 0 ? (
                <div className="px-8 py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 mx-auto">
                    <Calendar size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">Nenhuma venda registrada neste mês.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-white">
                        <th className="px-6 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Data</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Marmita / Refeição</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Valor Unitário</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Quantidade</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Faturamento Total</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {vendasDoMes.map((v) => (
                        <tr key={v.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-900">
                              {new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">{v.refeicaoNome}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs text-gray-600 font-medium">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorUnitario)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">
                              {v.quantidade} un.
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-emerald-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valorTotal)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditarVenda(v)}
                                className="p-2 text-gray-400 hover:text-[#04585a] hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoverVenda(v.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slideUp border border-gray-100">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tem certeza que deseja remover este registro de {deleteConfirm.tipo === 'producao' ? 'produção' : 'venda'}? Esta ação não poderá ser desfeita e os dados sairão dos seus relatórios.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-200 rounded-xl transition-colors border-0 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors border-0 cursor-pointer shadow-sm"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
