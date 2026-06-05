import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Box, Archive, AlertCircle, Calendar, X
} from "lucide-react";
import { Unidade } from "../types";

const CATEGORIAS_ESTOQUE = [
  "Ingrediente",
  "Embalagem",
  "Limpeza e Higiene",
  "Outros"
] as const;

type CategoriaEstoque = typeof CATEGORIAS_ESTOQUE[number];

interface Lote {
  id: string;
  quantidadeOriginal: number;
  quantidadeAtual: number;
  custoUnitario: number;
  dataValidade: string;
}

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: CategoriaEstoque | string;
  unidade: Unidade | string;
  quantidadeAtual: number;
  estoqueMinimo: number;
  custoMedio: number;
  lotes: Lote[];
  ultimaAtualizacao: string;
}

const itemSchema = z.object({
  nome: z.string().min(1, "O nome do item é obrigatório"),
  categoria: z.string().min(1, "A categoria é obrigatória"),
  unidade: z.string().min(1, "A unidade é obrigatória"),
  quantidadeAtual: z.number().min(0, "A quantidade não pode ser negativa"),
  estoqueMinimo: z.number().min(0, "O estoque mínimo não pode ser negativo"),
  custoMedio: z.number().min(0, "O custo não pode ser negativo"),
  dataValidade: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

interface InventoryProps {
  onVoltar: () => void;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-0 py-2.5 bg-transparent border-0 border-b-2 ${
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-gray-200 focus:border-gray-900"
  } text-base text-gray-900 placeholder-gray-400 focus:ring-0 transition-colors`;

const labelCls = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

export function Inventory({ onVoltar }: InventoryProps) {
  const [itens, setItens] = useState<ItemEstoque[]>(() => {
    try {
      const salvas = localStorage.getItem('estoque_itens');
      if (salvas) {
        const parsed = JSON.parse(salvas);
        return parsed.map((item: any) => ({
          ...item,
          lotes: item.lotes || []
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemEstoque | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  
  // Modal Form State
  const [qtdMovimento, setQtdMovimento] = useState<number | ''>('');
  const [custoMovimento, setCustoMovimento] = useState<number | ''>('');
  const [validadeMovimento, setValidadeMovimento] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('estoque_itens', JSON.stringify(itens));
  }, [itens]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      quantidadeAtual: 0,
      estoqueMinimo: 0,
      custoMedio: 0,
      dataValidade: ''
    }
  });
  
  const quantidadeAtualWatcher = watch("quantidadeAtual", 0);

  const recalcularTotais = (lotes: Lote[], custoMedioAnterior: number) => {
    const qtdTotal = lotes.reduce((acc, l) => acc + l.quantidadeAtual, 0);
    let custoMedio = custoMedioAnterior;
    
    if (qtdTotal > 0) {
      const valorTotal = lotes.reduce((acc, l) => acc + (l.quantidadeAtual * l.custoUnitario), 0);
      custoMedio = valorTotal / qtdTotal;
    }
    
    return { qtdTotal, custoMedio };
  };

  const onAddItem = (data: ItemForm) => {
    if (data.quantidadeAtual > 0 && !data.dataValidade) {
      alert("Para cadastrar um item com quantidade inicial, informe a Data de Validade.");
      return;
    }

    const loteInicial: Lote[] = data.quantidadeAtual > 0 ? [{
      id: crypto.randomUUID(),
      quantidadeOriginal: data.quantidadeAtual,
      quantidadeAtual: data.quantidadeAtual,
      custoUnitario: data.custoMedio,
      dataValidade: data.dataValidade!
    }] : [];

    const novoItem: ItemEstoque = {
      id: crypto.randomUUID(),
      nome: data.nome,
      categoria: data.categoria,
      unidade: data.unidade,
      quantidadeAtual: data.quantidadeAtual,
      estoqueMinimo: data.estoqueMinimo,
      custoMedio: data.custoMedio,
      lotes: loteInicial,
      ultimaAtualizacao: new Date().toISOString()
    };

    setItens((prev) => [novoItem, ...prev]);
    reset({
      nome: "",
      categoria: "Ingrediente",
      unidade: "kg",
      quantidadeAtual: 0,
      estoqueMinimo: 0,
      custoMedio: 0,
      dataValidade: ''
    });
  };

  const handleRemover = (id: string) => {
    if (confirm("Remover este item do estoque? O histórico será perdido.")) {
      setItens(itens.filter(i => i.id !== id));
    }
  };

  const abrirModal = (item: ItemEstoque, tipo: 'entrada' | 'saida') => {
    setItemSelecionado(item);
    setTipoMovimentacao(tipo);
    setQtdMovimento('');
    setCustoMovimento(tipo === 'entrada' ? item.custoMedio : '');
    setValidadeMovimento('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setItemSelecionado(null);
    setQtdMovimento('');
    setCustoMovimento('');
    setValidadeMovimento('');
  };

  const confirmarMovimentacao = () => {
    if (!itemSelecionado) return;
    const qtdNum = Number(qtdMovimento);
    if (qtdNum <= 0) {
      alert("A quantidade deve ser maior que zero.");
      return;
    }

    setItens(prev => prev.map(item => {
      if (item.id === itemSelecionado.id) {
        let novosLotes = [...(item.lotes || [])];

        if (tipoMovimentacao === 'entrada') {
          if (!validadeMovimento) {
            alert("Para dar entrada, é obrigatório informar a Validade do Lote.");
            return item; // Impede o fechamento e a gravação
          }
          novosLotes.push({
            id: crypto.randomUUID(),
            quantidadeOriginal: qtdNum,
            quantidadeAtual: qtdNum,
            custoUnitario: Number(custoMovimento) || 0,
            dataValidade: validadeMovimento
          });
          novosLotes.sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime());
        } else {
          if (qtdNum > item.quantidadeAtual) {
            alert(`Atenção: A saída (${qtdNum}) é maior que o estoque atual (${item.quantidadeAtual}). O saldo ficará zerado ou negativo.`);
          }

          let qtdRestanteParaBaixar = qtdNum;
          
          for (let i = 0; i < novosLotes.length; i++) {
            if (qtdRestanteParaBaixar <= 0) break;
            
            if (novosLotes[i].quantidadeAtual <= qtdRestanteParaBaixar) {
              qtdRestanteParaBaixar -= novosLotes[i].quantidadeAtual;
              novosLotes[i].quantidadeAtual = 0;
            } else {
              novosLotes[i].quantidadeAtual -= qtdRestanteParaBaixar;
              qtdRestanteParaBaixar = 0;
            }
          }
          
          novosLotes = novosLotes.filter(l => l.quantidadeAtual > 0);
        }

        const { qtdTotal, custoMedio } = recalcularTotais(novosLotes, item.custoMedio);

        return {
          ...item,
          lotes: novosLotes,
          quantidadeAtual: tipoMovimentacao === 'saida' && item.quantidadeAtual - qtdNum < 0 ? (item.quantidadeAtual - qtdNum) : qtdTotal, 
          custoMedio: custoMedio,
          ultimaAtualizacao: new Date().toISOString()
        };
      }
      return item;
    }));

    fecharModal();
  };

  const valorTotalParado = useMemo(() => {
    return itens.reduce((acc, curr) => acc + (curr.quantidadeAtual > 0 ? curr.quantidadeAtual * curr.custoMedio : 0), 0);
  }, [itens]);

  const itensEmAlerta = useMemo(() => {
    return itens.filter(i => i.quantidadeAtual <= i.estoqueMinimo).length;
  }, [itens]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24 font-sans selection:bg-[#04585a]/20">
      
      {/* ── Minimalist Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onVoltar}
              className="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-900 transition-colors" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gestão de Estoque</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        
        {/* ── Unified Command Center (KPIs) ────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
          
          <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Capital Imobilizado
              </p>
              <Box size={20} className="text-gray-300" />
            </div>
            <h3 className="text-4xl font-light tracking-tight text-gray-900">
              {formatCurrency(valorTotalParado).replace('R$', '').trim()}
              <span className="text-xl text-gray-400 ml-2 font-normal">BRL</span>
            </h3>
          </div>
          
          <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Skus Rastreados
              </p>
              <Archive size={20} className="text-gray-300" />
            </div>
            <h3 className="text-4xl font-light tracking-tight text-gray-900">
              {itens.length}
              <span className="text-xl text-gray-400 ml-2 font-normal">itens</span>
            </h3>
          </div>

          <div className={`flex-1 p-8 relative overflow-hidden flex flex-col justify-center transition-colors ${itensEmAlerta > 0 ? 'bg-amber-500 text-white' : 'bg-[#04585a] text-white'}`}>
            <p className={`text-sm font-bold uppercase tracking-wider mb-4 relative z-10 ${itensEmAlerta > 0 ? 'text-amber-100' : 'text-[#82c8c9]'}`}>
              Status da Operação
            </p>
            <div className="flex items-center gap-3 relative z-10">
              {itensEmAlerta > 0 ? (
                <AlertCircle size={36} className="text-white opacity-90" />
              ) : (
                <CheckCircle size={36} className="text-white opacity-90" />
              )}
              <h3 className="text-4xl font-light tracking-tight text-white">
                {itensEmAlerta}
                <span className="text-xl font-normal opacity-80 ml-2">alertas</span>
              </h3>
            </div>
            <p className={`text-base mt-2 font-medium relative z-10 ${itensEmAlerta > 0 ? 'text-amber-100' : 'text-[#82c8c9]'}`}>
              {itensEmAlerta > 0 ? 'Existem itens abaixo do estoque mínimo de segurança.' : 'Todos os itens estão com saldo saudável.'}
            </p>
          </div>

        </section>

        {/* ── Main Layout: Form + Table ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Col: Cadastro de Novo Item */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sticky top-24">
            <div className="mb-8">
              <h4 className="text-xl font-bold text-gray-900 tracking-tight">Novo Insumo</h4>
              <p className="text-base text-gray-500 mt-1">Registre a primeira compra no sistema.</p>
            </div>

            <form onSubmit={handleSubmit(onAddItem)} className="space-y-6">
              
              <div>
                <label className={labelCls}>Nome do Item</label>
                <input {...register("nome")} placeholder="Ex: Arroz Branco Tipo 1" className={inputCls(!!errors.nome)} />
              </div>

              <div className="flex gap-5">
                <div className="flex-1">
                  <label className={labelCls}>Categoria</label>
                  <select {...register("categoria")} className={inputCls(!!errors.categoria)}>
                    {CATEGORIAS_ESTOQUE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <label className={labelCls}>Unid.</label>
                  <select {...register("unidade")} className={inputCls(!!errors.unidade)}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="unidade">unid.</option>
                    <option value="caixa">caixa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex-1">
                  <label className={labelCls}>Qtd Inicial</label>
                  <input type="number" min={0} step="any" {...register("quantidadeAtual", { valueAsNumber: true })} className={inputCls(!!errors.quantidadeAtual)} />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Alerta (Mín)</label>
                  <input type="number" min={0} step="any" {...register("estoqueMinimo", { valueAsNumber: true })} className={inputCls(!!errors.estoqueMinimo)} />
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex-1">
                  <label className={labelCls}>Custo Atual (R$)</label>
                  <input type="number" min={0} step={0.01} {...register("custoMedio", { valueAsNumber: true })} className={inputCls(!!errors.custoMedio)} placeholder="0.00" />
                </div>
                {Number(quantidadeAtualWatcher) > 0 && (
                  <div className="flex-1">
                    <label className={labelCls}>Validade (Lote)</label>
                    <input type="date" {...register("dataValidade")} className={inputCls(!!errors.dataValidade)} />
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full h-14 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-base transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={20} />
                  Cadastrar Insumo
                </button>
              </div>

            </form>
          </aside>

          {/* Right Col: Table */}
          <section className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xl font-bold text-gray-900 tracking-tight">Rastreamento de Lotes</h4>
              </div>

              {itens.length === 0 ? (
                <div className="px-8 py-24 text-center">
                  <p className="text-gray-500 font-medium text-lg">Estoque vazio.</p>
                  <p className="text-base text-gray-400 mt-2">Cadastre seus insumos ao lado para começar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Saldo</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Custo Ponderado</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Lançamentos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itens.map((item) => {
                        const isBaixo = item.quantidadeAtual <= item.estoqueMinimo;
                        
                        const lotesOrdenados = [...(item.lotes || [])].sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime());
                        const proximoVencimento = lotesOrdenados.length > 0 ? lotesOrdenados[0].dataValidade : null;

                        return (
                          <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                            
                            {/* Produto */}
                            <td className="px-8 py-5">
                              <p className="text-base font-bold text-gray-900 mb-1" title={item.nome}>
                                {item.nome}
                              </p>
                              {proximoVencimento ? (
                                <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                                  <Calendar size={12} /> Próx. Vencimento: {new Date(proximoVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </p>
                              ) : (
                                <p className="text-xs font-medium text-gray-400">
                                  {item.categoria}
                                </p>
                              )}
                            </td>
                            
                            {/* Status */}
                            <td className="px-6 py-5 text-center">
                              {isBaixo ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold tracking-wide">
                                  <AlertTriangle size={14} /> BAIXO
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-bold tracking-wide">
                                  <CheckCircle size={14} /> OK
                                </span>
                              )}
                            </td>
                            
                            {/* Saldo */}
                            <td className="px-6 py-5 text-right">
                              <p className={`text-lg font-bold ${isBaixo ? 'text-amber-600' : 'text-gray-900'}`}>
                                {item.quantidadeAtual} <span className="text-sm font-medium text-gray-500 ml-1">{item.unidade}</span>
                              </p>
                              <p className="text-xs font-semibold text-gray-400 mt-1">
                                {item.lotes?.length || 0} lotes ativos
                              </p>
                            </td>
                            
                            {/* Custo */}
                            <td className="px-6 py-5 text-right">
                              <p className="text-base font-semibold text-gray-600">{formatCurrency(item.custoMedio)}</p>
                            </td>
                            
                            {/* Ações */}
                            <td className="px-8 py-5">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => abrirModal(item, 'saida')}
                                  className="h-9 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-sm font-bold border-0 cursor-pointer flex items-center gap-2"
                                  title="Registrar Consumo"
                                >
                                  <TrendingDown size={16} /> Saída
                                </button>
                                <button
                                  onClick={() => abrirModal(item, 'entrada')}
                                  className="h-9 px-4 rounded-lg bg-[#04585a]/10 text-[#04585a] hover:bg-[#04585a]/20 transition-colors text-sm font-bold border-0 cursor-pointer flex items-center gap-2"
                                  title="Registrar Compra"
                                >
                                  <TrendingUp size={16} /> Entrada
                                </button>
                                <button
                                  onClick={() => handleRemover(item.id)}
                                  className="h-9 w-9 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer ml-1"
                                  title="Remover Cadastro"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                            
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* ── Modal Flutuante para Movimentações ───────────────────────────── */}
      {modalAberto && itemSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Nova Movimentação</h3>
              <button 
                onClick={fecharModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 border-0 bg-transparent cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">Item Selecionado</p>
                <p className="text-2xl font-bold text-gray-900">{itemSelecionado.nome}</p>
                <p className="text-sm text-gray-500 mt-1">Saldo atual: {itemSelecionado.quantidadeAtual} {itemSelecionado.unidade}</p>
              </div>

              {/* Toggle Entrada/Saída Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setTipoMovimentacao('entrada'); setCustoMovimento(itemSelecionado.custoMedio); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all border-0 cursor-pointer ${tipoMovimentacao === 'entrada' ? 'bg-white shadow-sm text-gray-900' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Registrar Compra (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMovimentacao('saida')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all border-0 cursor-pointer ${tipoMovimentacao === 'saida' ? 'bg-white shadow-sm text-gray-900' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Registrar Consumo (Saída)
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quantidade ({itemSelecionado.unidade})</label>
                  <input 
                    type="number" 
                    min={0.01} step="any"
                    value={qtdMovimento}
                    onChange={e => setQtdMovimento(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                    autoFocus
                  />
                </div>

                {tipoMovimentacao === 'entrada' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Custo Unit. (R$)</label>
                      <input 
                        type="number" 
                        min={0} step={0.01}
                        value={custoMovimento}
                        onChange={e => setCustoMovimento(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Validade do Lote</label>
                      <input 
                        type="date" 
                        value={validadeMovimento}
                        onChange={e => setValidadeMovimento(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {tipoMovimentacao === 'saida' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3">
                  <AlertTriangle size={18} className="text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 leading-relaxed">
                    O sistema dará baixa automática no lote mais antigo (FEFO - Primeiro a vencer, primeiro a sair).
                  </p>
                </div>
              )}

              <div className="mt-8">
                <button 
                  onClick={confirmarMovimentacao}
                  className="w-full py-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-base font-bold transition-colors cursor-pointer border-0 shadow-sm"
                >
                  Confirmar Movimentação
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
