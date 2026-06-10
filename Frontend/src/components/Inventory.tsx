import React, { useState, useMemo, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Box, Archive, AlertCircle, Calendar, X,
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, Pencil
} from "lucide-react";
import { Unidade } from "../types";

const CATEGORIAS_ESTOQUE = [
  "Embalagem",
  "Limpeza e Higiene",
  "EPIs e Uniformes",
  "Manutenção",
  "Administrativo e Escritório",
  "Outros"
] as const;

type CategoriaEstoque = typeof CATEGORIAS_ESTOQUE[number];

interface Lote {
  id: string;
  quantidadeOriginal: number;
  quantidadeAtual: number;
  custoUnitario: number;
  dataValidade: string;
  fornecedor?: string;
}

interface ItemEstoque {
  id: string;
  tacoId?: number;
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
  fornecedor: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

interface InventoryProps {
  onVoltar: () => void;
  onIrParaIngredientes?: () => void;
  ingredientes?: any[];
  onAtualizarPrecoIngrediente?: (id: string, novoPreco: number) => Promise<void>;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-0 py-2.5 bg-transparent border-0 border-b-2 ${
    hasError
      ? "border-red-300 focus:border-red-300"
      : "border-gray-200 focus:border-gray-200"
  } text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors`;

const labelCls = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

export function Inventory({ onVoltar, onIrParaIngredientes, ingredientes, onAtualizarPrecoIngrediente }: InventoryProps) {
  const [itens, setItens] = useState<ItemEstoque[]>(() => {
    try {
      const salvas = localStorage.getItem('estoque_itens');
      if (salvas) {
        const parsed = JSON.parse(salvas);
        if (parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            lotes: item.lotes || []
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [mostrarFormInline, setMostrarFormInline] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemEstoque | null>(null);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemEstoque | null>(null);
  const [loteEmEdicao, setLoteEmEdicao] = useState<Lote | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  
  const isIngrediente = itemEmEdicao?.categoria === "Ingrediente" || !!itemEmEdicao?.tacoId;
  
  // Modal Form State
  const [qtdMovimento, setQtdMovimento] = useState<number | ''>('');
  const [custoMovimento, setCustoMovimento] = useState<number | ''>('');
  const [validadeMovimento, setValidadeMovimento] = useState<string>('');
  const [fornecedorMovimento, setFornecedorMovimento] = useState<string>('');

  // Filter States
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('nome-asc');
  const [abaAtiva, setAbaAtiva] = useState<'ingredientes' | 'materiais'>('ingredientes');

  // Row Expansion
  const [linhaExpandida, setLinhaExpandida] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('estoque_itens', JSON.stringify(itens));
  }, [itens]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      quantidadeAtual: 0,
      estoqueMinimo: 0,
      custoMedio: 0,
      dataValidade: '',
      fornecedor: ''
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

  const fecharFormInline = () => {
    reset({
      nome: "",
      categoria: "Embalagem",
      unidade: "kg",
      quantidadeAtual: 0,
      estoqueMinimo: 0,
      custoMedio: 0,
      dataValidade: '',
      fornecedor: ''
    });
    setItemEmEdicao(null);
    setLoteEmEdicao(null);
    setMostrarFormInline(false);
  };

  const abrirEdicaoLote = (item: ItemEstoque, lote: Lote) => {
    setItemEmEdicao(item);
    setLoteEmEdicao(lote);
    reset({
      nome: item.nome,
      categoria: String(item.categoria),
      unidade: String(item.unidade),
      estoqueMinimo: item.estoqueMinimo,
      quantidadeAtual: lote.quantidadeAtual,
      custoMedio: lote.custoUnitario,
      dataValidade: lote.dataValidade,
      fornecedor: lote.fornecedor || ''
    });
    setMostrarFormInline(true);
  };

  const handleRemoverLote = (itemId: string, loteId: string) => {
    if (confirm("Remover este lote? O saldo e custo médio do insumo serão recalculados.")) {
      setItens(prev => prev.map(item => {
        if (item.id !== itemId) return item;
        const novosLotes = (item.lotes || []).filter(l => l.id !== loteId);
        
        if (novosLotes.length === 0) {
          if (onAtualizarPrecoIngrediente) {
            const ing = ingredientes?.find(i => (item.tacoId && i.tacoId === item.tacoId) || (i.nome.toLowerCase() === item.nome.toLowerCase()));
            if (ing) onAtualizarPrecoIngrediente(ing.id, 0);
          }
          return {
            ...item,
            lotes: [],
            quantidadeAtual: 0,
            custoMedio: 0
          };
        } else {
          const { qtdTotal, custoMedio } = recalcularTotais(novosLotes, item.custoMedio);
          if (onAtualizarPrecoIngrediente) {
            const ing = ingredientes?.find(i => (item.tacoId && i.tacoId === item.tacoId) || (i.nome.toLowerCase() === item.nome.toLowerCase()));
            if (ing) onAtualizarPrecoIngrediente(ing.id, custoMedio);
          }
          return {
            ...item,
            lotes: novosLotes,
            quantidadeAtual: qtdTotal,
            custoMedio: custoMedio
          };
        }
      }));
    }
  };

  const onAddItem = (data: ItemForm) => {
    if (itemEmEdicao && loteEmEdicao) {
      const nomeFormatado = data.nome.trim();
      const conflito = itens.find(i => i.id !== itemEmEdicao.id && i.nome.toLowerCase() === nomeFormatado.toLowerCase());
      
      if (conflito) {
        alert("Já existe outro insumo com esse nome no estoque.");
        return;
      }

      setItens(prev => prev.map(item => {
        if (item.id === itemEmEdicao.id) {
          const novosLotes = (item.lotes || []).map(l => {
            if (l.id === loteEmEdicao.id) {
              return {
                ...l,
                quantidadeAtual: data.quantidadeAtual,
                custoUnitario: data.custoMedio,
                dataValidade: data.dataValidade || l.dataValidade,
                fornecedor: data.fornecedor
              };
            }
            return l;
          });
          const { qtdTotal, custoMedio } = recalcularTotais(novosLotes, item.custoMedio);
          if (onAtualizarPrecoIngrediente) {
            const ing = ingredientes?.find(i => (item.tacoId && i.tacoId === item.tacoId) || (i.nome.toLowerCase() === item.nome.toLowerCase()));
            if (ing) onAtualizarPrecoIngrediente(ing.id, custoMedio);
          }
          return {
            ...item,
            nome: item.categoria === "Ingrediente" || item.tacoId ? item.nome : nomeFormatado,
            categoria: item.categoria === "Ingrediente" || item.tacoId ? item.categoria : data.categoria,
            unidade: item.categoria === "Ingrediente" || item.tacoId ? item.unidade : data.unidade,
            estoqueMinimo: data.estoqueMinimo,
            lotes: novosLotes,
            quantidadeAtual: qtdTotal,
            custoMedio: custoMedio,
            ultimaAtualizacao: new Date().toISOString()
          };
        }
        return item;
      }));

      fecharFormInline();
      return;
    }

    if (data.quantidadeAtual > 0 && !data.dataValidade) {
      alert("Para cadastrar um item com quantidade inicial, informe a Data de Validade.");
      return;
    }

    const nomeFormatado = data.nome.trim();
    const itemExistente = itens.find(i => i.nome.toLowerCase() === nomeFormatado.toLowerCase());

    let novosItens = [...itens];

    if (itemExistente) {
      const loteInicial: Lote[] = data.quantidadeAtual > 0 ? [{
        id: crypto.randomUUID(),
        quantidadeOriginal: data.quantidadeAtual,
        quantidadeAtual: data.quantidadeAtual,
        custoUnitario: data.custoMedio,
        dataValidade: data.dataValidade!,
        fornecedor: data.fornecedor
      }] : [];

      const novosLotes = [...(itemExistente.lotes || []), ...loteInicial].sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime());
      
      const { qtdTotal, custoMedio } = recalcularTotais(novosLotes, itemExistente.custoMedio);
      if (onAtualizarPrecoIngrediente) {
        const ing = ingredientes?.find(i => (itemExistente.tacoId && i.tacoId === itemExistente.tacoId) || (i.nome.toLowerCase() === itemExistente.nome.toLowerCase()));
        if (ing) onAtualizarPrecoIngrediente(ing.id, custoMedio);
      }

      const itemAtualizado = {
        ...itemExistente,
        lotes: novosLotes,
        quantidadeAtual: qtdTotal,
        custoMedio: custoMedio,
        estoqueMinimo: itemExistente.estoqueMinimo + (data.estoqueMinimo > 0 ? data.estoqueMinimo : 0),
        ultimaAtualizacao: new Date().toISOString()
      };

      novosItens = novosItens.map(i => i.id === itemExistente.id ? itemAtualizado : i);
      alert(`O item "${nomeFormatado}" já existia no estoque. A quantidade foi adicionada como um novo lote (Custo e Saldo atualizados).`);
    } else {
      const loteInicial: Lote[] = data.quantidadeAtual > 0 ? [{
        id: crypto.randomUUID(),
        quantidadeOriginal: data.quantidadeAtual,
        quantidadeAtual: data.quantidadeAtual,
        custoUnitario: data.custoMedio,
        dataValidade: data.dataValidade!,
        fornecedor: data.fornecedor
      }] : [];

      const novoItem: ItemEstoque = {
        id: crypto.randomUUID(),
        nome: nomeFormatado,
        categoria: data.categoria,
        unidade: data.unidade,
        quantidadeAtual: data.quantidadeAtual,
        estoqueMinimo: data.estoqueMinimo,
        custoMedio: data.custoMedio,
        lotes: loteInicial,
        ultimaAtualizacao: new Date().toISOString()
      };

      novosItens = [novoItem, ...novosItens];
      if (onAtualizarPrecoIngrediente) {
        const ing = ingredientes?.find(i => i.nome.toLowerCase() === nomeFormatado.toLowerCase());
        if (ing) onAtualizarPrecoIngrediente(ing.id, data.custoMedio);
      }
    }

    setItens(novosItens);
    fecharFormInline();
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
    setFornecedorMovimento('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setItemSelecionado(null);
    setQtdMovimento('');
    setCustoMovimento('');
    setValidadeMovimento('');
    setFornecedorMovimento('');
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
            dataValidade: validadeMovimento,
            fornecedor: fornecedorMovimento
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
        const finalCustoMedio = tipoMovimentacao === 'saida' && item.quantidadeAtual - qtdNum <= 0 ? 0 : custoMedio;

        if (onAtualizarPrecoIngrediente) {
          const ing = ingredientes?.find(i => (item.tacoId && i.tacoId === item.tacoId) || (i.nome.toLowerCase() === item.nome.toLowerCase()));
          if (ing) onAtualizarPrecoIngrediente(ing.id, finalCustoMedio);
        }

        return {
          ...item,
          lotes: novosLotes,
          quantidadeAtual: tipoMovimentacao === 'saida' && item.quantidadeAtual - qtdNum < 0 ? (item.quantidadeAtual - qtdNum) : qtdTotal, 
          custoMedio: finalCustoMedio,
          ultimaAtualizacao: new Date().toISOString()
        };
      }
      return item;
    }));

    fecharModal();
  };

  const itensDaAbaAtual = useMemo(() => {
    return itens.filter(item => {
      const isIngred = item.categoria === "Ingrediente" || !!item.tacoId;
      return abaAtiva === 'ingredientes' ? isIngred : !isIngred;
    });
  }, [itens, abaAtiva]);

  const itensFiltrados = useMemo(() => {
    let resultado = [...itensDaAbaAtual];

    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      resultado = resultado.filter(item => {
        if (item.nome.toLowerCase().includes(termo)) return true;
        if (item.lotes?.some(l => l.fornecedor?.toLowerCase().includes(termo))) return true;
        return false;
      });
    }

    if (filtroCategoria) {
      resultado = resultado.filter(item => item.categoria === filtroCategoria);
    }

    resultado.sort((a, b) => {
      switch (ordenarPor) {
        case 'nome-asc': return a.nome.localeCompare(b.nome);
        case 'nome-desc': return b.nome.localeCompare(a.nome);
        case 'custo-desc': return b.custoMedio - a.custoMedio;
        case 'custo-asc': return a.custoMedio - b.custoMedio;
        case 'saldo-desc': return b.quantidadeAtual - a.quantidadeAtual;
        case 'saldo-asc': return a.quantidadeAtual - b.quantidadeAtual;
        case 'validade-asc': {
           const valA = a.lotes && a.lotes.length > 0 ? new Date(a.lotes[0].dataValidade).getTime() : Infinity;
           const valB = b.lotes && b.lotes.length > 0 ? new Date(b.lotes[0].dataValidade).getTime() : Infinity;
           return valA - valB;
        }
        default: return 0;
      }
    });

    return resultado;
  }, [itensDaAbaAtual, termoBusca, filtroCategoria, ordenarPor]);

  const valorTotalParado = useMemo(() => {
    return itensDaAbaAtual.reduce((acc, curr) => acc + (curr.quantidadeAtual > 0 ? curr.quantidadeAtual * curr.custoMedio : 0), 0);
  }, [itensDaAbaAtual]);

  const itensEmAlerta = useMemo(() => {
    return itensDaAbaAtual.filter(i => i.quantidadeAtual <= i.estoqueMinimo).length;
  }, [itensDaAbaAtual]);

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
        
        {/* Sub-navegação com alto destaque */}
        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex gap-2 w-full max-w-lg mx-auto">
          <button 
            type="button"
            onClick={() => setAbaAtiva('ingredientes')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm border-0 cursor-pointer transition-all ${
              abaAtiva === 'ingredientes'
                ? "bg-[#04585a] text-white shadow-md shadow-[#04585a]/15"
                : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Ingredientes
          </button>
          <button 
            type="button"
            onClick={() => setAbaAtiva('materiais')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm border-0 cursor-pointer transition-all ${
              abaAtiva === 'materiais'
                ? "bg-[#04585a] text-white shadow-md shadow-[#04585a]/15"
                : "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Embalagens e Insumos
          </button>
        </div>

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
              {itensDaAbaAtual.length}
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

        {/* ── Main Layout: Table ────────────────────────────────────── */}
        <section className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xl font-bold text-gray-900 tracking-tight">Rastreamento de Lotes</h4>
                {!mostrarFormInline && abaAtiva === 'materiais' && (
                  <button
                    onClick={() => {
                      setItemEmEdicao(null);
                      setLoteEmEdicao(null);
                      setMostrarFormInline(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={16} />
                    Cadastrar Embalagem/Insumo
                  </button>
                )}
                {!mostrarFormInline && abaAtiva === 'ingredientes' && onIrParaIngredientes && (
                  <button
                    onClick={onIrParaIngredientes}
                    className="px-4 py-2 rounded-xl bg-[#04585a] hover:bg-[#034042] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={16} />
                    Novo Ingrediente (TACO)
                  </button>
                )}
              </div>

              {/* Formulário Inline */}
              {mostrarFormInline && (
                <div className="border-b border-gray-200 bg-gray-50/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {itemEmEdicao ? "Editar Insumo" : "Novo Insumo"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {itemEmEdicao ? "Modifique as informações básicas." : "Registre a primeira compra no sistema."}
                      </p>
                    </div>
                    <button 
                      onClick={fecharFormInline}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 border-0 bg-transparent cursor-pointer transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  {!itemEmEdicao && (
                    <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                      <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800 leading-relaxed">
                        <strong>Atenção:</strong> Ingredientes de receitas (Arroz, Feijão, etc) devem ser cadastrados em <strong className="font-bold">Ingredientes Nutricionais</strong> para puxar a tabela TACO.<br/>
                        Use este formulário apenas para embalagens, limpeza e afins.
                        {onIrParaIngredientes && (
                          <button 
                            type="button"
                            onClick={onIrParaIngredientes} 
                            className="ml-2 underline font-bold text-amber-900 hover:text-amber-700 bg-transparent border-none cursor-pointer p-0"
                          >
                            Cadastrar Ingrediente (TACO)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onAddItem)} className="space-y-6 max-w-3xl">
                  
                    <div>
                      <label className={labelCls}>Nome do Item {isIngrediente && <span className="text-[10px] text-teal-600 font-semibold normal-case">(Ingrediente)</span>}</label>
                      <input 
                        {...register("nome")} 
                        list="sugestoes-nomes" 
                        placeholder="Ex: Arroz Branco Tipo 1" 
                        readOnly={isIngrediente}
                        className={`${inputCls(!!errors.nome)} ${isIngrediente ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed pl-2' : ''}`} 
                        autoFocus={!isIngrediente} 
                      />
                      {!isIngrediente && (
                        <datalist id="sugestoes-nomes">
                          {itens.map(i => <option key={i.id} value={i.nome} />)}
                        </datalist>
                      )}
                      {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message as string}</p>}
                    </div>

                    <div className="flex gap-5">
                      <div className="flex-1">
                        <label className={labelCls}>Categoria</label>
                        <select 
                          {...register("categoria")} 
                          disabled={isIngrediente}
                          className={`${inputCls(!!errors.categoria)} ${isIngrediente ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed pl-2' : ''}`}
                        >
                          {CATEGORIAS_ESTOQUE.map(c => <option key={c} value={c}>{c}</option>)}
                          {isIngrediente && <option value="Ingrediente">Ingrediente</option>}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className={labelCls}>Unid.</label>
                        <select 
                          {...register("unidade")} 
                          disabled={isIngrediente}
                          className={`${inputCls(!!errors.unidade)} ${isIngrediente ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed pl-2' : ''}`}
                        >
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
                        <label className={labelCls}>Qtd Atual</label>
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

                    {Number(quantidadeAtualWatcher) > 0 && (
                      <div>
                        <label className={labelCls}>Fornecedor (Opcional)</label>
                        <input type="text" {...register("fornecedor")} placeholder="Nome do Fornecedor" className={inputCls(!!errors.fornecedor)} />
                      </div>
                    )}

                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full h-14 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-base transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {itemEmEdicao ? <Pencil size={20} /> : <Plus size={20} />}
                        {itemEmEdicao ? "Salvar Alterações" : "Cadastrar Insumo"}
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Toolbar */}
              {itens.length > 0 && (
                <div className="px-8 py-4 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  {/* Busca */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Buscar insumo ou fornecedor..."
                      value={termoBusca}
                      onChange={e => setTermoBusca(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    {/* Categoria */}
                    <div className="relative flex-1 sm:w-48">
                      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={filtroCategoria}
                        onChange={e => setFiltroCategoria(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
                      >
                        <option value="">Todas as Categorias</option>
                        {CATEGORIAS_ESTOQUE.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Ordenação */}
                    <div className="relative flex-1 sm:w-48">
                      <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={ordenarPor}
                        onChange={e => setOrdenarPor(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
                      >
                        <option value="nome-asc">Nome (A-Z)</option>
                        <option value="nome-desc">Nome (Z-A)</option>
                        <option value="custo-desc">Maior Custo Unit.</option>
                        <option value="custo-asc">Menor Custo Unit.</option>
                        <option value="saldo-desc">Maior Saldo</option>
                        <option value="saldo-asc">Menor Saldo</option>
                        <option value="validade-asc">Validade Próxima</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {itens.length === 0 ? (
                <div className="px-8 py-24 text-center">
                  <p className="text-gray-500 font-medium text-lg">Estoque vazio.</p>
                  <p className="text-base text-gray-400 mt-2">Clique no botão acima para cadastrar seu primeiro insumo.</p>
                </div>
              ) : itensFiltrados.length === 0 ? (
                <div className="px-8 py-24 text-center">
                  <p className="text-gray-500 font-medium text-lg">Nenhum resultado encontrado.</p>
                  <p className="text-base text-gray-400 mt-2">Tente ajustar seus filtros ou termo de busca.</p>
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
                      {itensFiltrados.map((item) => {
                        const isBaixo = item.quantidadeAtual <= item.estoqueMinimo;
                        
                        const lotesOrdenados = [...(item.lotes || [])].sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime());
                        const proximoVencimento = lotesOrdenados.length > 0 ? lotesOrdenados[0].dataValidade : null;

                        const isExpandido = linhaExpandida === item.id;

                        return (
                          <Fragment key={item.id}>
                            <tr 
                              onClick={() => setLinhaExpandida(isExpandido ? null : item.id)}
                              className={`group transition-colors cursor-pointer ${isExpandido ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                            >
                              
                              {/* Produto */}
                              <td className="px-8 py-5">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 transition-transform">
                                    {isExpandido ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                  </div>
                                  <div>
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
                                  </div>
                                </div>
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
                              <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); abrirModal(item, 'saida'); }}
                                    className="h-9 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-sm font-bold border-0 cursor-pointer flex items-center gap-2"
                                    title="Registrar Consumo"
                                  >
                                    <TrendingDown size={16} /> Saída
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); abrirModal(item, 'entrada'); }}
                                    className="h-9 px-4 rounded-lg bg-[#04585a]/10 text-[#04585a] hover:bg-[#04585a]/20 transition-colors text-sm font-bold border-0 cursor-pointer flex items-center gap-2"
                                    title="Registrar Compra"
                                  >
                                    <TrendingUp size={16} /> Entrada
                                  </button>

                                </div>
                              </td>
                              
                            </tr>
                            
                            {/* Linha Expandida */}
                            {isExpandido && (
                              <tr>
                                <td colSpan={5} className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-bold text-gray-900">Detalhamento de Lotes Ativos</h5>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                          Estoque Mínimo: {item.estoqueMinimo} {item.unidade}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {lotesOrdenados.length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">Nenhum lote ativo no momento.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {lotesOrdenados.map((lote, index) => (
                                          <div key={lote.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all hover:shadow-md hover:border-gray-300">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#04585a]" />
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Lote #{index + 1}</p>
                                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={lote.fornecedor || 'Fornecedor não informado'}>
                                                  {lote.fornecedor || 'N/A'}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Saldo</p>
                                                <p className="text-sm font-bold text-[#04585a] bg-[#04585a]/10 px-2 py-0.5 rounded-md inline-block">
                                                  {lote.quantidadeAtual} <span className="text-xs font-normal opacity-80">{item.unidade}</span>
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-1 pt-3 border-t border-gray-50">
                                              <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-xs font-medium text-gray-600" title="Validade">
                                                  {new Date(lote.dataValidade).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5 ml-auto">
                                                <span className="text-xs font-bold text-gray-900" title="Custo Unitário">
                                                  {formatCurrency(lote.custoUnitario)}/un
                                                </span>
                                              </div>
                                            </div>

                                            {/* Ações do Lote */}
                                            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); abrirEdicaoLote(item, lote); }}
                                                className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                                                title="Editar Lote"
                                              >
                                                <Pencil size={14} />
                                              </button>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoverLote(item.id, lote.id); }}
                                                className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                                                title="Remover Lote"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Validade do Lote</label>
                      <input 
                        type="date" 
                        value={validadeMovimento}
                        onChange={e => setValidadeMovimento(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
                      />
                    </div>
                  </div>
                )}
                
                {tipoMovimentacao === 'entrada' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fornecedor (Opcional)</label>
                    <input 
                      type="text" 
                      value={fornecedorMovimento}
                      onChange={e => setFornecedorMovimento(e.target.value)}
                      placeholder="Nome do Fornecedor"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-200 transition-colors"
                    />
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
