import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Trash2, Calendar, ChevronLeft, ChevronRight, PackageOpen, LayoutGrid
} from "lucide-react";
import { Refeicao } from "../types";

const producaoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  refeicaoId: z.string().min(1, "Selecione uma refeição/marmita"),
  quantidade: z.number().min(1, "A quantidade deve ser de pelo menos 1"),
});

type ProducaoForm = z.infer<typeof producaoSchema>;

export interface ProducaoRegistro {
  id: string;
  data: string;
  mesReferencia: string;
  refeicaoId: string;
  refeicaoNome: string;
  quantidade: number;
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

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const [mostrarFormInline, setMostrarFormInline] = useState(false);

  useEffect(() => {
    localStorage.setItem('historico_producao', JSON.stringify(producoes));
  }, [producoes]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProducaoForm>({
    resolver: zodResolver(producaoSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      refeicaoId: "",
      quantidade: 1,
    }
  });

  const onAddProducao = (data: ProducaoForm) => {
    const refeicao = refeicoes.find(r => r.id === data.refeicaoId);
    
    const novoRegistro: ProducaoRegistro = {
      id: crypto.randomUUID(),
      data: data.data,
      mesReferencia: data.data.substring(0, 7),
      refeicaoId: data.refeicaoId,
      refeicaoNome: refeicao ? refeicao.nome : "Refeição Desconhecida",
      quantidade: data.quantidade,
    };

    setProducoes((prev) => [novoRegistro, ...prev]);
    reset({
      data: new Date().toISOString().split('T')[0],
      refeicaoId: "",
      quantidade: 1,
    });
    setMostrarFormInline(false);
  };

  const handleRemover = (id: string) => {
    if (confirm("Remover este registro de produção?")) {
      setProducoes(producoes.filter(d => d.id !== id));
    }
  };

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

  const inputCls = (isError: boolean) => `
    w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm 
    focus:bg-white focus:ring-2 focus:ring-[#04585a]/20 focus:border-[#04585a] 
    transition-all outline-none text-gray-900 shadow-sm
    ${isError ? 'border-red-500 ring-red-50 focus:border-red-500 focus:ring-red-100' : ''}
  `;

  const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24 font-sans selection:bg-[#04585a]/20">
      
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
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Controle de Produção</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        
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

        <section className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between gap-4">
                <h4 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Histórico de Produção</h4>
                <div className="flex items-center gap-4 flex-1 justify-end">
                  {!mostrarFormInline && (
                    <button
                      onClick={() => setMostrarFormInline(true)}
                      className="px-4 py-2 rounded-xl bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center gap-2 shadow-sm whitespace-nowrap"
                    >
                      <Plus size={16} />
                      Nova Produção
                    </button>
                  )}
                </div>
              </div>

              {mostrarFormInline && (
                <div className="border-b border-gray-200 bg-gray-50/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Registrar Lote de Produção</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Informe quantas unidades foram feitas.</p>
                    </div>
                    <button onClick={() => setMostrarFormInline(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border-0 bg-transparent cursor-pointer">
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onAddProducao)} className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div>
                        <label className={labelCls}>Data</label>
                        <input type="date" {...register("data")} className={inputCls(!!errors.data)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelCls}>Marmita / Refeição</label>
                        <select {...register("refeicaoId")} className={inputCls(!!errors.refeicaoId)}>
                          <option value="" disabled>Selecione a marmita produzida...</option>
                          {refeicoes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div>
                        <label className={labelCls}>Quantidade</label>
                        <input type="number" min={1} step={1} {...register("quantidade", { valueAsNumber: true })} className={inputCls(!!errors.quantidade)} />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" className="w-full md:w-auto px-8 h-12 rounded-xl bg-[#04585a] hover:bg-[#034446] text-white font-bold text-sm transition-colors cursor-pointer border-0 flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={18} />
                        Salvar Lote
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
                        <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap w-40">Data</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Refeição</th>
                        <th className="px-4 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Qtd Produzida</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {producoesDoMes.map((p) => (
                        <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-600">
                              {new Date(p.data).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' }).replace('.', '')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">{p.refeicaoNome}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold">
                              {p.quantidade} un.
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => handleRemover(p.id)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 border-0 bg-transparent cursor-pointer"
                              title="Remover"
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
      </main>
    </div>
  );
}
