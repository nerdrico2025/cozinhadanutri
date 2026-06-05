import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Trash2, Edit2, Calendar, LayoutGrid, Type, Hash, DollarSign
} from "lucide-react";

const CATEGORIAS = [
  "Embalagens e Insumos",
  "Pessoal e Encargos",
  "Estrutura e Instalações (Água, Luz, Gás, Aluguel)",
  "Equipamentos e Acessórios (Panelas, Forno)",
  "Transporte e Entregas",
  "Marketing e Vendas",
  "Administrativas e Software",
  "Impostos e Taxas",
  "Limpeza e Higiene",
  "Segurança e Conformidade",
  "Outros"
] as const;

type Categoria = typeof CATEGORIAS[number];

interface Despesa {
  id: string;
  data: string;
  categoria: Categoria | string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

const expenseSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  quantidade: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  valorUnitario: z.number().min(0.01, "Valor deve ser maior que zero"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface ExpenseControlProps {
  onVoltar: () => void;
}

const inputCls = (hasError?: boolean) =>
  `w-full px-0 py-2 bg-transparent border-0 border-b ${
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-gray-200 focus:border-gray-900"
  } text-sm text-gray-900 placeholder-gray-400 focus:ring-0 transition-colors`;

const labelCls = "block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1";

export function ExpenseControl({ onVoltar }: ExpenseControlProps) {
  const [despesas, setDespesas] = useState<Despesa[]>(() => {
    try {
      const salvas = localStorage.getItem('despesas_operacionais');
      return salvas ? JSON.parse(salvas) : [];
    } catch {
      return [];
    }
  });

  const [producaoMensal, setProducaoMensal] = useState<number>(() => {
    try {
      const prod = localStorage.getItem('producao_mensal');
      return prod ? Number(prod) : 2000;
    } catch {
      return 2000;
    }
  });

  const [isEditingProducao, setIsEditingProducao] = useState(false);
  const producaoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('despesas_operacionais', JSON.stringify(despesas));
  }, [despesas]);

  useEffect(() => {
    localStorage.setItem('producao_mensal', producaoMensal.toString());
  }, [producaoMensal]);

  useEffect(() => {
    if (isEditingProducao && producaoInputRef.current) {
      producaoInputRef.current.focus();
      producaoInputRef.current.select();
    }
  }, [isEditingProducao]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      quantidade: 1,
      valorUnitario: undefined
    }
  });

  const quantidadeWatcher = watch("quantidade", 1);
  const valorUnitarioWatcher = watch("valorUnitario", 0);

  const onAddExpense = (data: ExpenseForm) => {
    const novaDespesa: Despesa = {
      id: crypto.randomUUID(),
      data: data.data,
      categoria: data.categoria,
      descricao: data.descricao,
      quantidade: data.quantidade,
      valorUnitario: data.valorUnitario,
      valorTotal: data.quantidade * data.valorUnitario
    };

    setDespesas((prev) => [novaDespesa, ...prev]);
    reset({
      data: new Date().toISOString().split('T')[0],
      categoria: "",
      descricao: "",
      quantidade: 1,
      valorUnitario: 0
    });
  };

  const handleRemover = (id: string) => {
    if (confirm("Remover este lançamento?")) {
      setDespesas(despesas.filter(d => d.id !== id));
    }
  };

  const totalDespesas = useMemo(() => {
    return despesas.reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [despesas]);

  const custoPorMarmita = useMemo(() => {
    if (producaoMensal <= 0) return 0;
    return totalDespesas / producaoMensal;
  }, [totalDespesas, producaoMensal]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 font-sans selection:bg-[#04585a]/20">
      
      {/* ── Minimalist Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onVoltar}
              className="group flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <ArrowLeft size={18} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Despesas e Rateio</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
        
        {/* ── Unified Command Center (KPIs) ────────────────────────────────── */}
        <section className="bg-white rounded-[24px] border border-gray-200/60 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden">
          
          {/* Metric 1: Total */}
          <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Custo Operacional Total
            </p>
            <h3 className="text-4xl font-light tracking-tight text-gray-900">
              {formatCurrency(totalDespesas).replace('R$', '').trim()}
              <span className="text-lg text-gray-400 ml-1 font-normal">BRL</span>
            </h3>
          </div>
          
          {/* Metric 2: Produção */}
          <div className="flex-1 p-8 hover:bg-gray-50/50 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Volume de Produção (Mês)
              </p>
              <button 
                onClick={() => setIsEditingProducao(true)} 
                className="text-gray-300 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                title="Editar volume"
              >
                <Edit2 size={14} />
              </button>
            </div>
            
            {isEditingProducao ? (
              <div className="flex items-center gap-3">
                <input 
                  ref={producaoInputRef}
                  type="number" 
                  min={1}
                  className="text-4xl font-light text-gray-900 bg-transparent border-0 border-b border-gray-900 outline-none w-32 focus:ring-0 p-0 h-10"
                  value={producaoMensal}
                  onChange={(e) => setProducaoMensal(Number(e.target.value))}
                  onBlur={() => setIsEditingProducao(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingProducao(false)}
                />
                <span className="text-lg text-gray-400 font-light mt-2">unid.</span>
              </div>
            ) : (
              <h3 
                className="text-4xl font-light tracking-tight text-gray-900 cursor-pointer"
                onClick={() => setIsEditingProducao(true)}
              >
                {producaoMensal.toLocaleString('pt-BR')}
                <span className="text-lg text-gray-400 ml-2 font-normal">unid.</span>
              </h3>
            )}
          </div>

          {/* Metric 3: Rateio */}
          <div className="flex-1 p-8 bg-[#04585a] text-white relative overflow-hidden flex flex-col justify-center">
            <p className="text-xs font-semibold text-[#82c8c9] uppercase tracking-widest mb-3 relative z-10">
              Rateio por Unidade
            </p>
            <h3 className="text-4xl font-light tracking-tight text-white relative z-10">
              <span className="text-2xl font-normal opacity-80 mr-1">R$</span>
              {custoPorMarmita.toFixed(2).replace('.', ',')}
            </h3>
            <p className="text-sm text-[#82c8c9] mt-3 font-medium relative z-10">
              A ser embutido no custo de cada marmita
            </p>
          </div>

        </section>

        {/* ── Main Layout: Form + Table ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Col: Form */}
          <aside className="lg:col-span-4 bg-white rounded-[24px] border border-gray-200/60 shadow-sm p-8 sticky top-24">
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 tracking-tight">Novo Lançamento</h4>
              <p className="text-sm text-gray-500 mt-1">Insira custos variáveis e fixos do período.</p>
            </div>

            <form onSubmit={handleSubmit(onAddExpense)} className="space-y-6">
              
              <div className="flex items-end gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mb-1">
                  <Calendar size={14} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Data</label>
                  <input type="date" {...register("data")} className={inputCls(!!errors.data)} />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mb-1">
                  <LayoutGrid size={14} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Categoria</label>
                  <select {...register("categoria")} className={inputCls(!!errors.categoria)}>
                    <option value="" disabled>Selecione...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mb-1">
                  <Type size={14} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Descrição</label>
                  <input {...register("descricao")} placeholder="Ex: Conta de Luz" className={inputCls(!!errors.descricao)} />
                </div>
              </div>

              <div className="flex gap-4 pl-11">
                <div className="flex-1">
                  <label className={labelCls}>Quantidade</label>
                  <input type="number" min={1} step="any" {...register("quantidade", { valueAsNumber: true })} className={inputCls(!!errors.quantidade)} />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Valor Unit.</label>
                  <input type="number" min={0.01} step={0.01} {...register("valorUnitario", { valueAsNumber: true })} placeholder="0.00" className={inputCls(!!errors.valorUnitario)} />
                </div>
              </div>

              <div className="pt-4 pl-11 border-t border-gray-100 mt-2">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-gray-500">Total</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency((Number(quantidadeWatcher) || 0) * (Number(valorUnitarioWatcher) || 0))}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm transition-colors cursor-pointer border-0 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Despesa
                </button>
              </div>

            </form>
          </aside>

          {/* Right Col: Table */}
          <section className="lg:col-span-8">
            <div className="bg-white rounded-[24px] border border-gray-200/60 shadow-sm overflow-hidden">
              
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 tracking-tight">Histórico</h4>
                <span className="text-sm font-medium text-gray-400">
                  {despesas.length} {despesas.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {despesas.length === 0 ? (
                <div className="px-8 py-20 text-center">
                  <p className="text-gray-400 font-medium">Nenhum lançamento efetuado.</p>
                  <p className="text-sm text-gray-400 mt-1">Os registros aparecerão aqui.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Data</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Despesa</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Qtd</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Unitário</th>
                        <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Total</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {despesas.map((despesa) => (
                        <tr key={despesa.id} className="group hover:bg-gray-50/50 transition-colors">
                          
                          <td className="px-8 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">
                              {new Date(despesa.data).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' }).replace('.', '')}
                            </span>
                          </td>
                          
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={despesa.descricao}>
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
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(despesa.valorTotal)}</span>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
