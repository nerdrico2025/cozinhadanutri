import { useState, useMemo, useEffect } from 'react';
import { PackageOpen, Banknote, Archive, TrendingDown, Layers, Calculator, ArrowRight, AlertCircle } from 'lucide-react';
import { Receita } from '../types';

type TelaAtiva = 'home' | 'dashboard' | 'receitas' | 'criar-receita' | 'cadastro-ingrediente' | 'lista-ingredientes' | 'estoque' | 'login' | 'register' | 'refeicao' | 'despesas' | 'producao' | 'estatisticas' | 'aulas';

interface DashboardProps {
  onNavegar: (tela: TelaAtiva) => void;
  receitas: Receita[];
  totalIngredientes: number;
}

export function Dashboard({ onNavegar, receitas, totalIngredientes }: DashboardProps) {
  // Dados salvos localmente
  const [despesas, setDespesas] = useState<any[]>(() => {
    try {
      const data = localStorage.getItem('despesas_operacionais');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });

  const [producoes, setProducoes] = useState<any[]>(() => {
    try {
      const data = localStorage.getItem('historico_producao');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });

  const [estoque, setEstoque] = useState<any[]>(() => {
    try {
      const data = localStorage.getItem('estoque_itens');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  });

  const mesAtual = useMemo(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const totalDespesas = useMemo(() => {
    return despesas
      .filter(d => d.mesReferencia === mesAtual)
      .reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [despesas, mesAtual]);

  const producaoMensal = useMemo(() => {
    return producoes
      .filter(p => p.mesReferencia === mesAtual)
      .reduce((acc, curr) => acc + curr.quantidade, 0);
  }, [producoes, mesAtual]);

  const rateioPorUnidade = useMemo(() => {
    if (producaoMensal <= 0) return 0;
    const totalRateio = despesas
      .filter(d => d.mesReferencia === mesAtual && d.embutirNoRateio)
      .reduce((acc, curr) => acc + curr.valorTotal, 0);
    return totalRateio / producaoMensal;
  }, [despesas, producaoMensal, mesAtual]);

  const itensEstoqueBaixo = useMemo(() => {
    return estoque.filter(item => item.quantidadeAtual <= (item.quantidadeMinima || 0)).length;
  }, [estoque]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="py-8 min-h-[80vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Visão Geral do Negócio</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhe a saúde financeira e operacional da sua cozinha neste mês.</p>
      </div>

      {/* Sinais Vitais (KPIs) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KPI: Despesas */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <Banknote size={18} className="text-rose-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custo Operacional</p>
          </div>
          <div>
            <h3 className="text-3xl font-light text-gray-900 tracking-tight mb-1">
              {formatCurrency(totalDespesas)}
            </h3>
            <p className="text-xs text-gray-400">Total de despesas no mês atual</p>
          </div>
        </div>

        {/* KPI: Produção */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-fuchsia-50 flex items-center justify-center">
              <PackageOpen size={18} className="text-fuchsia-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Volume Produzido</p>
          </div>
          <div>
            <h3 className="text-3xl font-light text-gray-900 tracking-tight mb-1">
              {producaoMensal.toLocaleString('pt-BR')} <span className="text-lg text-gray-400 ml-1">unidades</span>
            </h3>
            <p className="text-xs text-gray-400">Total produzido no mês atual</p>
          </div>
        </div>

        {/* KPI: Rateio */}
        <div className="bg-[#04585a] rounded-2xl p-6 border border-[#034446] shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-[#056b6d] opacity-50 group-hover:scale-110 transition-transform">
            <TrendingDown size={100} />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <p className="text-xs font-bold text-[#82c8c9] uppercase tracking-wider">Rateio Atual</p>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-light text-white tracking-tight mb-1">
              {formatCurrency(rateioPorUnidade)} <span className="text-lg text-[#82c8c9] ml-1">/ un</span>
            </h3>
            <p className="text-xs text-[#82c8c9]">Custo fixo embutido por marmita</p>
          </div>
        </div>

        {/* KPI: Alertas Estoque */}
        <div className={`bg-white rounded-2xl p-6 border ${itensEstoqueBaixo > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'} shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${itensEstoqueBaixo > 0 ? 'bg-amber-100' : 'bg-emerald-50'}`}>
              {itensEstoqueBaixo > 0 
                ? <AlertCircle size={18} className="text-amber-600" />
                : <Archive size={18} className="text-emerald-600" />
              }
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alertas de Estoque</p>
          </div>
          <div>
            <h3 className={`text-3xl font-light tracking-tight mb-1 ${itensEstoqueBaixo > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {itensEstoqueBaixo} <span className="text-lg opacity-70 ml-1">itens</span>
            </h3>
            <p className="text-xs text-gray-500">
              {itensEstoqueBaixo > 0 ? 'Estão abaixo do nível mínimo' : 'Estoque saudável e controlado'}
            </p>
          </div>
        </div>

      </section>

      {/* Ações Rápidas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">Ações Rápidas (Dia a Dia)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <button
            onClick={() => onNavegar('producao')}
            className="group relative overflow-hidden bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-left transition-all hover:shadow-md hover:border-gray-300 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
              <PackageOpen size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Registrar Produção</p>
              <p className="text-xs text-gray-500 mt-0.5">Apontar lote diário finalizado</p>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button
            onClick={() => onNavegar('despesas')}
            className="group relative overflow-hidden bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-left transition-all hover:shadow-md hover:border-gray-300 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
              <Banknote size={20} className="text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Lançar Despesa</p>
              <p className="text-xs text-gray-500 mt-0.5">Registrar novo custo ou conta paga</p>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-rose-600 transition-colors" />
          </button>

          <button
            onClick={() => onNavegar('estoque')}
            className="group relative overflow-hidden bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-left transition-all hover:shadow-md hover:border-gray-300 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Archive size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Ajustar Estoque</p>
              <p className="text-xs text-gray-500 mt-0.5">Registrar entrada ou saída manual</p>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
          </button>

        </div>
      </section>

    </div>
  );
}

