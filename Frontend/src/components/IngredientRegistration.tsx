import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search, ChevronDown, Loader2, ArrowLeft,
  PackagePlus, DollarSign, Flame, Beef, Wheat, Droplets, HelpCircle, AlertTriangle,
  CheckCircle2, List, PlusCircle, Archive
} from 'lucide-react';
import { Unidade, Ingrediente } from '../types';
import { buscarAlimentosBackend } from '../services/alimentos';

const numField = z.preprocess(
  (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
  z.number({ message: 'Campo não pode ficar vazio' })
    .min(0, 'Inválido')
) as any;

const ingredienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  unidade: z.enum(['g', 'kg', 'ml', 'l', 'unidade']),
  preco: z.preprocess(
    (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
    z.number({ message: 'Campo não pode ficar vazio' })
      .min(0.01, 'Preço deve ser maior que zero')
  ) as any,
  calorias: numField,
  proteinas: numField,
  carboidratos: numField,
  gorduras: numField,
  acucares_totais: numField,
  acucares_adicionados: numField,
  gorduras_saturadas: numField,
  gorduras_trans: numField,
  fibras: numField,
  sodio: numField,
  vitaminas: numField,
  minerais: numField,
});

type IngredienteForm = z.infer<typeof ingredienteSchema>;

interface CadastroIngredienteProps {
  ingredienteInicial?: Ingrediente;
  onSalvar: (ingrediente: Ingrediente) => Promise<void> | void;
  onCancelar: () => void;
  onVerLista?: () => void;
}

const unidades: { value: Unidade; label: string }[] = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'unidade', label: 'Unidade' },
];

const getFonte = (numero?: number) => {
  if (!numero) return '';
  return numero < 10000 ? 'TACO' : 'IBGE';
};

const inputCls = (hasError?: boolean) =>
  `w-full px-0 py-2.5 bg-transparent border-0 border-b-2 ${
    hasError
      ? "border-red-300 focus:border-red-300"
      : "border-gray-200 focus:border-gray-300"
  } text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors`;

export function CadastroIngrediente({ ingredienteInicial, onSalvar, onCancelar, onVerLista }: CadastroIngredienteProps) {
  const [sugestoesTaco, setSugestoesTaco] = useState<any[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [tacoNumeroSelecionado, setTacoNumeroSelecionado] = useState<number | undefined>(ingredienteInicial?.tacoId);
  const [tacoDbId, setTacoDbId] = useState<string | number | undefined>(ingredienteInicial?.id);
  const [salvando, setSalvando] = useState(false);
  const [modalAcucarAberto, setModalAcucarAberto] = useState(false);
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [dadosParaSalvar, setDadosParaSalvar] = useState<IngredienteForm | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [itensEstoque, setItensEstoque] = useState<any[]>(() => {
    try {
      const salvas = localStorage.getItem('estoque_itens');
      return salvas ? JSON.parse(salvas) : [];
    } catch {
      return [];
    }
  });

  const [incluirNoEstoque, setIncluirNoEstoque] = useState(!ingredienteInicial);
  const [estoqueQuantidade, setEstoqueQuantidade] = useState<number | ''>('');
  const [estoqueMinimo, setEstoqueMinimo] = useState<number | ''>(0);
  const [estoqueFornecedor, setEstoqueFornecedor] = useState<string>('');
  const [estoqueValorTotal, setEstoqueValorTotal] = useState<number | ''>('');

  const [tipoVencimento, setTipoVencimento] = useState<"dias" | "data">("dias");
  const [validadeDias, setValidadeDias] = useState<number | ''>(30);
  const [dataVencimentoEspecifica, setDataVencimentoEspecifica] = useState<string>('');

  const dataVencimentoCalculada = useMemo(() => {
    if (tipoVencimento === "dias" && typeof validadeDias === "number" && validadeDias > 0) {
      const date = new Date();
      date.setDate(date.getDate() + validadeDias);
      return date.toLocaleDateString("pt-BR");
    }
    return "-";
  }, [validadeDias, tipoVencimento]);

  const handleDataVencimentoChange = (val: string) => {
    setDataVencimentoEspecifica(val);
    if (val) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(val + "T00:00:00");
      const diffTime = selected.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setValidadeDias(diffDays > 0 ? diffDays : 1);
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<IngredienteForm>({
    resolver: zodResolver(ingredienteSchema),
    defaultValues: ingredienteInicial
      ? {
          nome: ingredienteInicial.nome,
          unidade: ingredienteInicial.unidade as 'g' | 'kg' | 'ml' | 'l' | 'unidade',
          preco: ingredienteInicial.preco,
          calorias: Number((ingredienteInicial.dadosNutricionais.calorias || 0).toFixed(1)),
          proteinas: Number((ingredienteInicial.dadosNutricionais.proteinas || 0).toFixed(1)),
          carboidratos: Number((ingredienteInicial.dadosNutricionais.carboidratos || 0).toFixed(1)),
          gorduras: Number((ingredienteInicial.dadosNutricionais.gorduras || 0).toFixed(1)),
          acucares_totais: Number((ingredienteInicial.dadosNutricionais.acucares_totais || 0).toFixed(1)),
          acucares_adicionados: Number((ingredienteInicial.dadosNutricionais.acucares_adicionados || 0).toFixed(1)),
          gorduras_saturadas: Number((ingredienteInicial.dadosNutricionais.gorduras_saturadas || 0).toFixed(1)),
          gorduras_trans: Number((ingredienteInicial.dadosNutricionais.gorduras_trans || 0).toFixed(1)),
          fibras: Number((ingredienteInicial.dadosNutricionais.fibras || 0).toFixed(1)),
          sodio: Number((ingredienteInicial.dadosNutricionais.sodio || 0).toFixed(1)),
          vitaminas: Number((ingredienteInicial.dadosNutricionais.vitaminas || 0).toFixed(1)),
          minerais: Number((ingredienteInicial.dadosNutricionais.minerais || 0).toFixed(1)),
        }
      : { unidade: 'g', calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0, gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0 },
  });

  const labelPreco = useMemo(() => {
    const un = watch('unidade');
    if (un === 'g') return "Preço por 100g (R$)";
    if (un === 'ml') return "Preço por 100ml (R$)";
    if (un === 'kg') return "Preço por kg (R$)";
    if (un === 'l') return "Preço por Litro (R$)";
    return "Preço por Unidade (R$)";
  }, [watch('unidade')]);

  const precoAtual = watch('preco');
  const unidadeAtual = watch('unidade');

  // Sincroniza o valor total quando o preço unitário ou a quantidade mudam
  useEffect(() => {
    if (incluirNoEstoque && typeof precoAtual === 'number' && typeof estoqueQuantidade === 'number' && estoqueQuantidade > 0) {
      const total = (unidadeAtual === 'g' || unidadeAtual === 'ml')
        ? (precoAtual * estoqueQuantidade) / 100
        : precoAtual * estoqueQuantidade;
      setEstoqueValorTotal(Number(total.toFixed(2)));
    } else if (!incluirNoEstoque || !estoqueQuantidade || !precoAtual) {
      setEstoqueValorTotal('');
    }
  }, [precoAtual, estoqueQuantidade, unidadeAtual, incluirNoEstoque]);

  const handleQuantidadeChange = (valStr: string) => {
    if (valStr === '') {
      setEstoqueQuantidade('');
      return;
    }
    const qtd = Number(valStr);
    setEstoqueQuantidade(qtd);
    const unitPrice = Number(watch('preco')) || 0;
    if (unitPrice > 0) {
      const total = (unidadeAtual === 'g' || unidadeAtual === 'ml')
        ? (unitPrice * qtd) / 100
        : unitPrice * qtd;
      setEstoqueValorTotal(Number(total.toFixed(2)));
    }
  };

  const handleValorTotalChange = (valStr: string) => {
    if (valStr === '') {
      setEstoqueValorTotal('');
      return;
    }
    const val = Number(valStr);
    setEstoqueValorTotal(val);
    const qtd = Number(estoqueQuantidade);
    if (qtd > 0) {
      const unitPrice = (unidadeAtual === 'g' || unidadeAtual === 'ml')
        ? (val / qtd) * 100
        : val / qtd;
      setValue('preco', Number(unitPrice.toFixed(4)), { shouldValidate: true });
    }
  };

  const precoFeedbackCalculado = useMemo(() => {
    const qtd = Number(estoqueQuantidade);
    const precoUnit = Number(precoAtual) || 0;
    if (!incluirNoEstoque || !qtd || qtd <= 0 || precoUnit <= 0) return null;

    const total = (unidadeAtual === 'g' || unidadeAtual === 'ml') ? (precoUnit * qtd) / 100 : precoUnit * qtd;
    const unitLabel = unidadeAtual === 'unidade' ? 'und' : unidadeAtual === 'l' ? 'L' : unidadeAtual;
    
    return `Total da compra: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (R$ ${precoUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por ${unidadeAtual === 'g' || unidadeAtual === 'ml' ? '100' + unidadeAtual : unitLabel})`;
  }, [incluirNoEstoque, estoqueQuantidade, precoAtual, unidadeAtual]);

  useEffect(() => {
    if (ingredienteInicial) {
      reset({
        nome: ingredienteInicial.nome,
        unidade: (ingredienteInicial.unidade === 'un' ? 'unidade' : ingredienteInicial.unidade) as 'g' | 'kg' | 'ml' | 'l' | 'unidade',
        preco: ingredienteInicial.preco,
        calorias: Number((ingredienteInicial.dadosNutricionais.calorias || 0).toFixed(1)),
        proteinas: Number((ingredienteInicial.dadosNutricionais.proteinas || 0).toFixed(1)),
        carboidratos: Number((ingredienteInicial.dadosNutricionais.carboidratos || 0).toFixed(1)),
        gorduras: Number((ingredienteInicial.dadosNutricionais.gorduras || 0).toFixed(1)),
        acucares_totais: Number((ingredienteInicial.dadosNutricionais.acucares_totais || 0).toFixed(1)),
        acucares_adicionados: Number((ingredienteInicial.dadosNutricionais.acucares_adicionados || 0).toFixed(1)),
        gorduras_saturadas: Number((ingredienteInicial.dadosNutricionais.gorduras_saturadas || 0).toFixed(1)),
        gorduras_trans: Number((ingredienteInicial.dadosNutricionais.gorduras_trans || 0).toFixed(1)),
        fibras: Number((ingredienteInicial.dadosNutricionais.fibras || 0).toFixed(1)),
        sodio: Number((ingredienteInicial.dadosNutricionais.sodio || 0).toFixed(1)),
        vitaminas: Number((ingredienteInicial.dadosNutricionais.vitaminas || 0).toFixed(1)),
        minerais: Number((ingredienteInicial.dadosNutricionais.minerais || 0).toFixed(1)),
      });
      setTacoNumeroSelecionado(ingredienteInicial.tacoId);
      setTacoDbId(ingredienteInicial.id);
    } else {
      reset({
        nome: '',
        unidade: 'g',
        preco: 0,
        calorias: 0,
        proteinas: 0,
        carboidratos: 0,
        gorduras: 0,
        acucares_totais: 0,
        acucares_adicionados: 0,
        gorduras_saturadas: 0,
        gorduras_trans: 0,
        fibras: 0,
        sodio: 0,
        vitaminas: 0,
        minerais: 0,
      });
      setTacoNumeroSelecionado(undefined);
      setTacoDbId(undefined);
      setIncluirNoEstoque(true);
      setEstoqueQuantidade('');
      setEstoqueMinimo(0);
      setTipoVencimento('dias');
      setValidadeDias(30);
      setDataVencimentoEspecifica('');
      setEstoqueFornecedor('');
      setEstoqueValorTotal('');
    }
  }, [ingredienteInicial, reset]);

  const itemEstoqueVinculado = itensEstoque.find(i => 
    (tacoNumeroSelecionado && i.tacoId === tacoNumeroSelecionado) ||
    (i.nome.toLowerCase() === watch('nome')?.trim().toLowerCase())
  ) || null;

  useEffect(() => {
    if (itemEstoqueVinculado && !ingredienteInicial) {
      setValue('preco', Number((itemEstoqueVinculado.custoMedio || 0).toFixed(2)), { shouldValidate: true });
      setValue('unidade', (itemEstoqueVinculado.unidade === 'un' ? 'unidade' : itemEstoqueVinculado.unidade) as 'g' | 'kg' | 'ml' | 'l' | 'unidade');
    }
  }, [itemEstoqueVinculado, setValue, ingredienteInicial]);

  const buscarSugestoes = (nome: string) => {
    if (nome.length < 2) { setSugestoesTaco([]); setMostrarSugestoes(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCarregando(true); setErroApi(null);
      try {
        const resultados = await buscarAlimentosBackend(nome);
        setSugestoesTaco(resultados);
        setMostrarSugestoes(resultados.length > 0);
      } catch {
        setErroApi('Não foi possível buscar na API TACO / IBGE. Preencha os dados manualmente.');
        setSugestoesTaco([]); setMostrarSugestoes(false);
      } finally { setCarregando(false); }
    }, 400);
  };

  const parseTacoVal = (val: any) => parseFloat(String(val || '0').replace(',', '.')) || 0;

  const aplicarDadosTaco = (alimento: any) => {
    setValue('nome', alimento.descricao);
    setValue('calorias', Number(parseTacoVal(alimento.energia_kcal).toFixed(1)));
    setValue('proteinas', Number(parseTacoVal(alimento.proteina).toFixed(1)));
    setValue('carboidratos', Number(parseTacoVal(alimento.carboidrato).toFixed(1)));
    setValue('gorduras', Number(parseTacoVal(alimento.lipideos).toFixed(1)));
    setValue('acucares_totais', Number(parseTacoVal(alimento.acucares_totais).toFixed(1)));
    setValue('acucares_adicionados', Number(parseTacoVal(alimento.acucares_adicionados).toFixed(1)));
    setValue('gorduras_saturadas', Number(parseTacoVal(alimento.saturados).toFixed(1)));
    
    const trans1 = parseTacoVal(alimento.AG18_1t);
    const trans2 = parseTacoVal(alimento.AG18_2t);
    setValue('gorduras_trans', Number((trans1 + trans2).toFixed(1)));
    
    setValue('fibras', Number(parseTacoVal(alimento.fibra_alimentar).toFixed(1)));
    setValue('sodio', Number(parseTacoVal(alimento.sodio).toFixed(1)));
    setValue('vitaminas', Number(parseTacoVal(alimento.vitaminas).toFixed(1)));
    setValue('minerais', Number(parseTacoVal(alimento.minerais).toFixed(1)));
    setTacoNumeroSelecionado(alimento.numero);
    setTacoDbId(alimento.id);
    setMostrarSugestoes(false);
  };

  const onSubmit = (data: IngredienteForm) => {
    // Verifica se os campos de açúcares estão vazios ou zerados
    if (!data.acucares_totais && !data.acucares_adicionados) {
      setDadosParaSalvar(data);
      setModalAcucarAberto(true);
      return;
    }
    salvarFinal(data);
  };

  const salvarFinal = async (data: IngredienteForm) => {
    setSalvando(true);
    setModalAcucarAberto(false);
    try {
      let finalPreco = data.preco;

      if (incluirNoEstoque && estoqueQuantidade !== '') {
        const qtd = Number(estoqueQuantidade);
        const min = Number(estoqueMinimo) || 0;
        let novaListaEstoque = [...itensEstoque];
        const totalCusto = estoqueValorTotal !== '' ? Number(estoqueValorTotal) : data.preco;
        const custoUnit = data.preco;

        const loteNovo = {
          id: crypto.randomUUID(),
          quantidadeOriginal: qtd,
          quantidadeAtual: qtd,
          custoUnitario: custoUnit,
          dataValidade: tipoVencimento === "dias" 
            ? (() => { const d = new Date(); d.setDate(d.getDate() + (Number(validadeDias) || 1)); return d.toISOString().split('T')[0]; })()
            : (dataVencimentoEspecifica || new Date().toISOString().split('T')[0]),
          fornecedor: estoqueFornecedor
        };

        if (itemEstoqueVinculado) {
          const itemIndex = novaListaEstoque.findIndex(i => i.id === itemEstoqueVinculado.id);
          if (itemIndex >= 0) {
            const item = novaListaEstoque[itemIndex];
            const lotes = [...(item.lotes || []), loteNovo].sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime());
            
            const qtdTotal = lotes.reduce((acc, l) => acc + l.quantidadeAtual, 0);
            let custoMedio = item.custoMedio;
            if (qtdTotal > 0) {
              const valorTotal = lotes.reduce((acc, l) => acc + (l.quantidadeAtual * l.custoUnitario), 0);
              custoMedio = valorTotal / qtdTotal;
            }
            
            finalPreco = custoMedio;

            novaListaEstoque[itemIndex] = {
              ...item,
              lotes,
              quantidadeAtual: qtdTotal,
              custoMedio,
              estoqueMinimo: item.estoqueMinimo + (min > 0 ? min : 0),
              ultimaAtualizacao: new Date().toISOString()
            };
          }
        } else {
          finalPreco = custoUnit;
          novaListaEstoque.push({
            id: crypto.randomUUID(),
            tacoId: tacoNumeroSelecionado,
            nome: data.nome,
            categoria: 'Ingrediente',
            unidade: data.unidade,
            quantidadeAtual: qtd,
            estoqueMinimo: min,
            custoMedio: custoUnit,
            lotes: [loteNovo],
            ultimaAtualizacao: new Date().toISOString()
          });
        }
        
        localStorage.setItem('estoque_itens', JSON.stringify(novaListaEstoque));
        setItensEstoque(novaListaEstoque);
      }

      await onSalvar({
        id: String(tacoDbId ?? ingredienteInicial?.id ?? ''), // App.tsx vai lidar com isso e salvarAlimento também
        tacoId: tacoNumeroSelecionado,
        nome: data.nome,
        unidade: data.unidade,
        preco: Number(finalPreco.toFixed(2)),
        dadosNutricionais: {
          calorias: data.calorias,
          proteinas: data.proteinas,
          carboidratos: data.carboidratos,
          gorduras: data.gorduras,
          acucares_totais: data.acucares_totais || 0,
          acucares_adicionados: data.acucares_adicionados || 0,
          gorduras_saturadas: data.gorduras_saturadas || 0,
          gorduras_trans: data.gorduras_trans || 0,
          fibras: data.fibras || 0,
          sodio: data.sodio || 0,
          vitaminas: data.vitaminas || 0,
          minerais: data.minerais || 0,
        },
        createdAt: ingredienteInicial?.createdAt ?? new Date(),
      });

      setTacoNumeroSelecionado(undefined);
      setTacoDbId(undefined);
      reset();
      setModalSucessoAberto(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header sticky ─────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
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
                <PackagePlus size={15} className="text-brand" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {ingredienteInicial ? 'Editar Ingrediente' : 'Novo Ingrediente'}
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
              disabled={salvando}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                salvando
                  ? 'bg-brand/40 cursor-not-allowed'
                  : 'bg-brand hover:brightness-110 cursor-pointer'
              }`}
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
              {salvando ? 'Salvando…' : 'Salvar Ingrediente'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Corpo ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

          {/* Seção 1 — Identificação */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <h2 className="text-sm font-semibold text-gray-800">Identificação</h2>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Busca TACO */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nome do Ingrediente <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    {...register('nome', {
                      onChange: (e) => {
                        buscarSugestoes(e.target.value);
                      }
                    })}
                    onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                    onFocus={() => sugestoesTaco.length > 0 && setMostrarSugestoes(true)}
                    placeholder="Digite para pesquisar na tabela TACO / IBGE…"
                    className={`${inputCls(!!errors.nome)} pl-9 pr-8`}
                  />
                  {carregando && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                {erroApi && <p className="text-yellow-600 text-xs mt-1">{erroApi}</p>}
                {tacoNumeroSelecionado && (
                  <p className="text-brand text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                    Vinculado à tabela {getFonte(tacoNumeroSelecionado)} (Nº {tacoNumeroSelecionado})
                  </p>
                )}

                {mostrarSugestoes && sugestoesTaco.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                    {sugestoesTaco.map((alimento) => (
                      <button
                        key={alimento.id}
                        type="button"
                        onMouseDown={() => aplicarDadosTaco(alimento)}
                        className="w-full text-left px-4 py-2.5 hover:bg-brand/5 border-0 bg-transparent cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-b-0"
                      >
                        <span className="text-sm text-gray-800 truncate">{alimento.descricao}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{getFonte(alimento.numero)} {alimento.numero}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col gap-5">
                
                {/* Group 1: Qtd Comprada (if checked), Unidade, Preço */}
                <div className={`grid gap-4 ${incluirNoEstoque ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Unidade de Medida
                    </label>
                    <div className="relative">
                      <select
                        {...register('unidade')}
                        className={`${inputCls(!!errors.unidade)} appearance-none pr-8`}
                      >
                        {unidades.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.unidade && <p className="text-red-500 text-xs mt-1">{errors.unidade.message as string}</p>}
                  </div>

                  {incluirNoEstoque && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Qtd Comprada <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="number" min={0.01} step="any" required
                        value={estoqueQuantidade} onChange={e => handleQuantidadeChange(e.target.value)}
                        placeholder="Ex: 5" className={inputCls(false)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {labelPreco} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        {...register('preco', { valueAsNumber: true })}
                        placeholder="0,00"
                        className={`${inputCls(!!errors.preco)} pl-8`}
                      />
                    </div>
                    {itemEstoqueVinculado && (
                      <p className="text-xs text-brand mt-1 flex items-center gap-1">
                        <Archive size={12} /> Custo médio no estoque: R$ {itemEstoqueVinculado.custoMedio.toFixed(2)}
                      </p>
                    )}
                    {precoFeedbackCalculado && (
                      <p className="text-xs text-teal-700 mt-1.5 flex items-center gap-1.5 font-bold bg-teal-50 border border-teal-100 px-2.5 py-1.5 rounded-lg shadow-sm">
                        <span>💡</span>
                        <span>{precoFeedbackCalculado}</span>
                      </p>
                    )}
                    {errors.preco && <p className="text-red-500 text-xs mt-1">{errors.preco.message as string}</p>}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer mb-4">
                    <input 
                      type="checkbox" 
                      checked={incluirNoEstoque} 
                      onChange={(e) => setIncluirNoEstoque(e.target.checked)}
                      className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                    />
                    {itemEstoqueVinculado ? 'Adicionar Novo Lote ao Estoque' : 'Incluir Novo Item no Estoque'}
                  </label>
                  
                  {incluirNoEstoque && (
                    <div className="flex flex-col gap-5">
                      {/* Primeira Linha */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Valor Total Pago (R$)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">R$</span>
                            <input 
                              type="number" min={0} step="0.01"
                              value={estoqueValorTotal} onChange={e => handleValorTotalChange(e.target.value)}
                              placeholder="Ex: 25.60" className={`${inputCls(false)} pl-8`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Fornecedor (Opcional)</label>
                          <input 
                            type="text"
                            value={estoqueFornecedor} onChange={e => setEstoqueFornecedor(e.target.value)}
                            placeholder="Nome do fornecedor" className={inputCls(false)}
                          />
                        </div>
                        {/* <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Estoque Mínimo (Alerta)</label>
                          <input 
                            type="number" min={0} step="any"
                            value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Ex: 1" className={inputCls(false)}
                          />
                        </div> */}
                      </div>

                      {/* Segunda Linha */}
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0">Validade do Lote</label>
                        <div className="flex bg-gray-200/60 p-0.5 rounded-lg w-full mb-1">
                          <button
                            type="button"
                            onClick={() => setTipoVencimento("dias")}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border-0 cursor-pointer transition-all ${
                              tipoVencimento === "dias" ? "bg-white text-[#04585a] shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Dias Corridos
                          </button>
                          <button
                            type="button"
                            onClick={() => setTipoVencimento("data")}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border-0 cursor-pointer transition-all ${
                              tipoVencimento === "data" ? "bg-white text-[#04585a] shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Data Específica
                          </button>
                        </div>
                        {tipoVencimento === "dias" ? (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min={1} step={1}
                                value={validadeDias}
                                onChange={(e) => setValidadeDias(e.target.value === '' ? '' : Number(e.target.value))}
                                className={inputCls(false)}
                              />
                              <span className="text-[10px] font-bold text-gray-400 shrink-0">dias</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 mt-1">🗓️ Vence em: {dataVencimentoCalculada}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 w-full">
                            <input
                              type="date"
                              value={dataVencimentoEspecifica}
                              onChange={(e) => handleDataVencimentoChange(e.target.value)}
                              className={inputCls(false)}
                            />
                            <span className="text-[10px] font-bold text-indigo-600 mt-1">⏱️ Equivale a: {validadeDias || 1} dias</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 — Dados Nutricionais */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <h2 className="text-sm font-semibold text-gray-800">
                  Dados Nutricionais
                  <span className="ml-2 text-xs font-normal text-gray-400">por 100g</span>
                </h2>
              </div>
              {tacoNumeroSelecionado && (
                <span className="text-xs bg-brand/8 text-brand px-2 py-0.5 rounded-full font-medium">
                  Preenchido via {getFonte(tacoNumeroSelecionado)}
                </span>
              )}
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  { field: 'calorias',             label: 'Valor Energético',  unit: 'kcal', Icon: Flame,    color: 'text-brand-orange', bg: 'bg-brand-orange/8' },
                  { field: 'carboidratos',         label: 'Carboidratos',      unit: 'g',    Icon: Wheat,    color: 'text-amber-500',    bg: 'bg-amber-50'       },
                  { field: 'acucares_totais',      label: 'Açúcares Totais',   unit: 'g',    Icon: Wheat,    color: 'text-amber-600',    bg: 'bg-amber-50'       },
                  { field: 'acucares_adicionados', label: 'Açúc. Adicionados', unit: 'g',    Icon: Wheat,    color: 'text-amber-700',    bg: 'bg-amber-50'       },
                  { field: 'proteinas',            label: 'Proteínas',         unit: 'g',    Icon: Beef,     color: 'text-rose-500',     bg: 'bg-rose-50'        },
                  { field: 'gorduras',             label: 'Gorduras Totais',   unit: 'g',    Icon: Droplets, color: 'text-sky-500',      bg: 'bg-sky-50'         },
                  { field: 'gorduras_saturadas',   label: 'Gord. Saturadas',   unit: 'g',    Icon: Droplets, color: 'text-sky-600',      bg: 'bg-sky-50'         },
                  { field: 'gorduras_trans',       label: 'Gorduras Trans',    unit: 'g',    Icon: Droplets, color: 'text-sky-700',      bg: 'bg-sky-50'         },
                  { field: 'fibras',               label: 'Fibras Alimentares',unit: 'g',    Icon: Wheat,    color: 'text-emerald-500',  bg: 'bg-emerald-50'     },
                  { field: 'sodio',                label: 'Sódio',             unit: 'mg',   Icon: PackagePlus,color: 'text-gray-500',   bg: 'bg-gray-100'       },
                  { field: 'vitaminas',            label: 'Vitaminas',         unit: 'g',    Icon: PackagePlus,color: 'text-purple-500', bg: 'bg-purple-50'      },
                  { field: 'minerais',             label: 'Minerais',          unit: 'g',    Icon: PackagePlus,color: 'text-indigo-500', bg: 'bg-indigo-50'      },
                ] as const).map(({ field, label, unit, Icon, color, bg }) => {
                  const isSugarField = field === 'acucares_totais' || field === 'acucares_adicionados';
                  const isReadOnly = !!tacoNumeroSelecionado && !isSugarField;
                  return (
                  <div key={field}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon size={12} className={color} />
                      </span>
                      {label}
                      <span className="text-gray-300 font-normal normal-case">({unit})</span>
                      {isSugarField && tacoNumeroSelecionado && (
                        <div className="group relative ml-auto flex items-center justify-center">
                          <HelpCircle size={14} className="text-brand/80 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 text-center">
                            A tabela {getFonte(tacoNumeroSelecionado)} não possui este dado. Preencha manualmente, se desejar.
                          </div>
                        </div>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      {...register(field, { 
                        valueAsNumber: true,
                        onBlur: (e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setValue(field, Number(val.toFixed(1)), { shouldValidate: true });
                          }
                        }
                      })}
                      placeholder="0.0"
                      readOnly={isReadOnly}
                      className={`${inputCls(!!errors[field])} ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed select-none' : ''}`}
                    />
                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message as string}</p>}
                  </div>
                );})}
              </div>

              {!tacoNumeroSelecionado && (
                <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                  Pesquise um alimento acima para preencher automaticamente os dados nutricionais.
                </p>
              )}
            </div>
          </section>

          {/* Ações */}
          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                salvando ? 'bg-brand/40 cursor-not-allowed' : 'bg-brand hover:brightness-110 cursor-pointer'
              }`}
            >
              {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
              {salvando ? 'Salvando…' : 'Salvar Ingrediente'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Confirmação de Açúcares */}
      {modalAcucarAberto && dadosParaSalvar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4 mx-auto">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              Atenção aos Açúcares
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              "Açúcares Totais" e "Açúc. Adicionados" não foram preenchidos. Deseja continuar e salvar assim mesmo?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalAcucarAberto(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => salvarFinal(dadosParaSalvar)}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:brightness-110 transition-colors focus:outline-none"
              >
                Sim, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {modalSucessoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-5 mx-auto">
              <CheckCircle2 className="text-emerald-600" size={30} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              Ingrediente salvo com sucesso!
            </h3>
            <p className="text-sm text-gray-600 text-center mb-8">
              O que você deseja fazer agora?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setModalSucessoAberto(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:brightness-110 transition-colors focus:outline-none border-0 cursor-pointer"
              >
                <PlusCircle size={16} />
                Cadastrar mais ingredientes
              </button>
              {onVerLista && (
                <button
                  type="button"
                  onClick={() => {
                    setModalSucessoAberto(false);
                    onVerLista();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none cursor-pointer"
                >
                  <List size={16} />
                  Acessar lista de ingredientes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
