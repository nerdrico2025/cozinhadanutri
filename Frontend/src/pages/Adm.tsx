import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Trash2, ShieldCheck, ShieldOff, Users, TrendingUp,
  DollarSign, UserCheck, UserX, ChefHat, Printer,
  Search, X, Calendar, Lock, Download,
  Pencil, Check, Tag, LogIn, Leaf, Crown, Star, Zap,
  LayoutDashboard, CreditCard, Activity, PieChart as PieChartIcon,
  HelpCircle, Headphones, MessageSquare, Save, Plus, Trash2 as Trash,
  Mail, CheckCircle, AlertCircle
} from 'lucide-react';
import { login } from '../services/auth';
import { 
  listarUsuariosAdmin, UsuarioAdmin, atualizarUsuarioAdmin, 
  listarAtividadesAdmin, AtividadeAdmin 
} from '../services/admin';
import { getPlans, savePlans, PlanData } from '../services/planService';
import { 
  getSupportConfig, saveSupportConfig, 
  getFAQ, saveFAQ, 
  SupportConfig, FAQEntry 
} from '../services/supportService';

type Plano = 'Grátis' | 'Profissional' | 'Empresarial';
type Status = 'ativo' | 'inativo';
type Aba = 'visao-geral' | 'usuarios' | 'planos' | 'atividades' | 'faturamento' | 'conversao' | 'suporte';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  plano: Plano;
  status: Status;
  cadastro: string;
  ultimoAcesso: string;
  receitas: number;
  rotulos: number;
}

const PRECO_INICIAL = getPlans();

function parseDate(s: string): Date {
  const [d, m, y] = s.split('/').map(Number);
  return new Date(y, m - 1, d);
}

const HOJE = new Date(2026, 3, 19);
const TRINTA_DIAS_ATRAS = new Date(HOJE);
TRINTA_DIAS_ATRAS.setDate(TRINTA_DIAS_ATRAS.getDate() - 30);

interface AuditEntry {
  id: number;
  dataHora: string;
  acao: string;
  usuarioNome: string;
  usuarioEmail: string;
  realizadoPor: string;
}

interface AcaoPendente {
  executar: () => void;
  descricao: string;
  usuarioNome: string;
  usuarioEmail: string;
}

const auditLogInicial: AuditEntry[] = [
  { id: 1, dataHora: '18/04/2026 09:15:32', acao: 'Login do administrador',                usuarioNome: 'Administrador',   usuarioEmail: 'admin@cozinhadanutri.com', realizadoPor: 'admin@cozinhadanutri.com' },
  { id: 2, dataHora: '17/04/2026 14:22:10', acao: 'Plano alterado: Grátis → Profissional', usuarioNome: 'Ana Souza',       usuarioEmail: 'ana@email.com',           realizadoPor: 'admin@cozinhadanutri.com' },
  { id: 3, dataHora: '15/04/2026 11:05:47', acao: 'Usuário desativado',                    usuarioNome: 'Fernanda Costa',  usuarioEmail: 'fernanda@email.com',       realizadoPor: 'admin@cozinhadanutri.com' },
  { id: 4, dataHora: '10/04/2026 16:40:03', acao: 'Login do administrador',                usuarioNome: 'Administrador',   usuarioEmail: 'admin@cozinhadanutri.com', realizadoPor: 'admin@cozinhadanutri.com' },
];

const TIPO_ATIVIDADE: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  rotulo:     { label: 'Rótulo',       cls: 'bg-orange-100 text-orange-600', Icon: Tag     },
  receita:    { label: 'Receita',      cls: 'bg-teal-100 text-teal-700',     Icon: ChefHat },
  ingrediente:{ label: 'Ingrediente',  cls: 'bg-blue-100 text-blue-600',     Icon: Leaf    },
  login:      { label: 'Login',        cls: 'bg-gray-100 text-gray-500',     Icon: LogIn   },
  logout:     { label: 'Logout',       cls: 'bg-red-50 text-red-400',        Icon: LogIn   },
  cadastro:   { label: 'Cadastro',     Icon: Users,       cls: 'bg-indigo-50 text-indigo-600' },
  plano:      { label: 'Plano',        Icon: CreditCard,  cls: 'bg-purple-50 text-purple-600'  },
};

const PLANO_CONFIG: Record<Plano, { cor: string; borda: string; fundo: string; Icon: React.ElementType; badge: string }> = {
  'Grátis':       { cor: 'text-gray-600',   borda: 'border-gray-300',   fundo: 'bg-gray-50',   Icon: Star,  badge: 'bg-gray-100 text-gray-600'    },
  'Profissional': { cor: 'text-teal-700',   borda: 'border-teal-400',   fundo: 'bg-teal-50',   Icon: Zap,   badge: 'bg-teal-100 text-teal-700'    },
  'Empresarial':  { cor: 'text-purple-700', borda: 'border-purple-400', fundo: 'bg-purple-50', Icon: Crown, badge: 'bg-purple-100 text-purple-700' },
};

const ABAS: { id: Aba; label: string; Icon: React.ElementType }[] = [
  { id: 'visao-geral', label: 'Visão Geral',  Icon: LayoutDashboard },
  { id: 'usuarios',    label: 'Usuários',      Icon: Users           },
  { id: 'faturamento', label: 'Faturamento',   Icon: DollarSign      },
  { id: 'conversao',   label: 'Conversão',     Icon: TrendingUp      },
  { id: 'planos',      label: 'Planos',         Icon: CreditCard      },
  { id: 'suporte',     label: 'Suporte',        Icon: Headphones      },
  { id: 'atividades',  label: 'Atividades',     Icon: Activity        },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, bg, label, value, accent, onClick }: { icon: React.ReactNode; bg: string; label: string; value: string | number; accent: string; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border-l-4 ${accent} shadow-sm p-4 flex items-center gap-3 transition-all ${onClick ? 'cursor-pointer hover:shadow-md active:scale-95' : ''}`}
    >
      <div className={`p-2.5 rounded-lg ${bg} shrink-0`}>{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────
export function Adm() {
  const [aba, setAba] = useState<Aba>('visao-geral');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [atividades, setAtividades] = useState<AtividadeAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [planConfigs, setPlanConfigs] = useState(getPlans());
  const [precoTemp, setPrecoTemp]         = useState('');

  const [query, setQuery]               = useState('');
  const [filtroPlano, setFiltroPlano]   = useState<Plano | 'Todos'>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<Status | 'Todos'>('Todos');
  const [filtroRecentes, setFiltroRecentes] = useState(false);

  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null);
  const [auditLog, setAuditLog]         = useState<AuditEntry[]>(auditLogInicial);
  const [senhaModal, setSenhaModal]     = useState('');
  const [erroSenha, setErroSenha]       = useState('');
  const [periodoFaturamento, setPeriodoFaturamento] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [visaoFaturamento, setVisaoFaturamento] = useState<'total' | 'planos'>('total');
  
  const [modalNovoBeneficio, setModalNovoBeneficio] = useState<Plano | null>(null);
  const [modalEditarPreco, setModalEditarPreco] = useState<{ plano: Plano, tipo: 'mensal' | 'anual' } | null>(null);
  const [textoBeneficio, setTextoBeneficio] = useState('');
  const [valorPreco, setValorPreco]         = useState('');
  
  const [supportForm, setSupportForm] = useState<SupportConfig>(getSupportConfig());
  const [faqList, setFaqList]         = useState<FAQEntry[]>(getFAQ());
  const [editandoFaq, setEditandoFaq] = useState<FAQEntry | null>(null);
  const [novaFaq, setNovaFaq]         = useState<Partial<FAQEntry>>({ categoria: 'geral' });
  const [feedback, setFeedback]       = useState<{ tipo: 'sucesso' | 'erro', msg: string } | null>(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{ id: string, tipo: 'faq' | 'usuario' } | null>(null);
  
  const inputSenhaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function fetchUsuarios() {
    setCarregando(true);
    const [dados, dadosAtividades] = await Promise.all([
      listarUsuariosAdmin(),
      listarAtividadesAdmin()
    ]);
    
    setAtividades(dadosAtividades);
    
    const mapeados: Usuario[] = dados.map(u => ({
      id: u.id,
      nome: u.empresa?.nome_fantasia || u.username,
      email: u.email,
      plano: (u.empresa?.plano === 'gratis' ? 'Grátis' : 
              u.empresa?.plano === 'profissional' ? 'Profissional' : 'Empresarial') as Plano,
      status: u.is_active ? 'ativo' : 'inativo',
      cadastro: new Date(u.date_joined).toLocaleDateString('pt-BR'),
      ultimoAcesso: u.last_login ? new Date(u.last_login).toLocaleDateString('pt-BR') : 'Nunca',
      receitas: u.receitas_count,
      rotulos: u.rotulos_count
    }));
    
    setUsuarios(mapeados);
    setCarregando(false);
  }

  function confirmarComSenha(executar: () => void, descricao: string, usuarioNome: string, usuarioEmail: string) {
    setAcaoPendente({ executar, descricao, usuarioNome, usuarioEmail });
    setSenhaModal('');
    setErroSenha('');
  }

  function fecharModal() {
    setAcaoPendente(null);
    setSenhaModal('');
    setErroSenha('');
  }

  async function executarAcao() {
    setErroSenha('');
    const logado = await login('admin@cozinhadanutri.com', senhaModal);
    if (!logado) { 
      setErroSenha('Senha incorreta ou acesso negado.'); 
      return; 
    }
    
    const pendente = acaoPendente!;
    pendente.executar();
    const dataHora = new Date().toLocaleString('pt-BR');
    setAuditLog(prev => [{
      id: Date.now(), dataHora, acao: pendente.descricao,
      usuarioNome: pendente.usuarioNome, usuarioEmail: pendente.usuarioEmail,
      realizadoPor: 'admin@cozinhadanutri.com',
    }, ...prev]);
    fecharModal();
  }

  function salvarPreco(plano: Plano, tipo: 'mensal' | 'anual', valor: number, pularSenha = false) {
    const acao = () => {
      const novas = { ...planConfigs, [plano]: { ...planConfigs[plano], [tipo]: valor } };
      setPlanConfigs(novas);
      savePlans(novas);
    };

    if (pularSenha) {
      acao();
      // Registro manual no log se pulou a confirmação padrão
      const dataHora = new Date().toLocaleString('pt-BR');
      setAuditLog(prev => [{
        id: Date.now(), dataHora, acao: `Preço ${tipo} do plano ${plano} atualizado para R$ ${valor.toFixed(2)}`,
        usuarioNome: 'Administrador', usuarioEmail: 'admin@cozinhadanutri.com',
        realizadoPor: 'admin@cozinhadanutri.com',
      }, ...prev]);
    } else {
      confirmarComSenha(acao, `Preço ${tipo} do plano ${plano} atualizado para R$ ${valor.toFixed(2)}`, 'Administrador', 'admin@cozinhadanutri.com');
    }
  }

  function alternarRecurso(plano: Plano, recurso: string, pularSenha = false) {
    const acao = () => {
      const novosRecursos = planConfigs[plano].recursos.includes(recurso)
        ? planConfigs[plano].recursos.filter(r => r !== recurso)
        : [...planConfigs[plano].recursos, recurso];
      
      const novas = { ...planConfigs, [plano]: { ...planConfigs[plano], recursos: novosRecursos } };
      setPlanConfigs(novas);
      savePlans(novas);
    };

    if (pularSenha) {
      acao();
      const dataHora = new Date().toLocaleString('pt-BR');
      setAuditLog(prev => [{
        id: Date.now(), dataHora, acao: `Recurso "${recurso}" atualizado no plano ${plano}`,
        usuarioNome: 'Administrador', usuarioEmail: 'admin@cozinhadanutri.com',
        realizadoPor: 'admin@cozinhadanutri.com',
      }, ...prev]);
    } else {
      confirmarComSenha(acao, `Recurso "${recurso}" atualizado no plano ${plano}`, 'Administrador', 'admin@cozinhadanutri.com');
    }
  }

  function downloadAuditLog() {
    const headers = ['Data/Hora', 'Ação', 'Usuário', 'E-mail do Usuário', 'Realizado por'];
    const rows = auditLog.map(e => [e.dataHora, e.acao, e.usuarioNome, e.usuarioEmail, e.realizadoPor]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const kpis = useMemo(() => {
    // Filtrar admin das métricas de negócio
    const clientes = usuarios.filter(u => u.email !== 'admin@cozinhadanutri.com');
    
    const ativos   = clientes.filter(u => u.status === 'ativo').length;
    const inativos = clientes.length - ativos;
    const mrr      = clientes.filter(u => u.status === 'ativo').reduce((s, u) => s + planConfigs[u.plano].mensal, 0);
    const novosMes = clientes.filter(u => parseDate(u.cadastro) >= TRINTA_DIAS_ATRAS).length;
    const pagantes = clientes.filter(u => u.plano !== 'Grátis' && u.status === 'ativo').length;
    const conversao = clientes.length > 0 ? Math.round((pagantes / clientes.length) * 100) : 0;
    const porPlano  = (['Grátis', 'Profissional', 'Empresarial'] as Plano[]).reduce(
      (acc, p) => ({ ...acc, [p]: clientes.filter(u => u.plano === p).length }),
      {} as Record<Plano, number>,
    );
    return { ativos, inativos, mrr, novosMes, conversao, porPlano, totalClientes: clientes.length };
  }, [usuarios, planConfigs]);

  const filtrados = useMemo(() => usuarios.filter(u => {
    if (u.email === 'admin@cozinhadanutri.com') return false; // Ocultar admin da lista principal de gestão de clientes
    const q = query.toLowerCase();
    const matchQuery  = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchPlano  = filtroPlano  === 'Todos' || u.plano  === filtroPlano;
    const matchStatus = filtroStatus === 'Todos' || u.status === filtroStatus;
    const matchRecente = !filtroRecentes || parseDate(u.cadastro) >= TRINTA_DIAS_ATRAS;
    return matchQuery && matchPlano && matchStatus && matchRecente;
  }), [usuarios, query, filtroPlano, filtroStatus, filtroRecentes]);

  const alternarStatus = async (id: string) => {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    
    // Adicionamos um registro na auditoria (mesmo sem senha aqui se for simples, ou chamamos confirmarComSenha)
    const acaoMsg = `Usuário ${u.nome} marcado como ${novoStatus}`;
    
    const sucesso = await atualizarUsuarioAdmin(id, { is_active: novoStatus === 'ativo' });
    if (sucesso) {
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: novoStatus } : u));
      // Log local
      setAuditLog(prev => [{
        id: Date.now(), dataHora: new Date().toLocaleString('pt-BR'), acao: acaoMsg,
        usuarioNome: u.nome, usuarioEmail: u.email, realizadoPor: 'admin@cozinhadanutri.com'
      }, ...prev]);
    }
  };

  const excluir = (id: string) =>
    setUsuarios(prev => prev.filter(u => u.id !== id));

  const alterarPlano = async (id: string, plano: Plano) => {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;
    
    const planoBackend = plano === 'Grátis' ? 'gratis' : 
                         plano === 'Profissional' ? 'profissional' : 'empresarial';
                         
    const sucesso = await atualizarUsuarioAdmin(id, { plano: planoBackend });
    if (sucesso) {
       setUsuarios(prev => prev.map(u => u.id === id ? { ...u, plano } : u));
    }
  };

  return (
    <div className={`py-8 min-h-[80vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-opacity ${carregando ? 'opacity-50' : 'opacity-100'}`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-teal-50 shrink-0">
          <Users size={20} className="text-teal-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Painel Administrativo</h1>
          <p className="text-xs text-gray-400 mt-0.5">{kpis.totalClientes} cliente(s) ativo(s) na base</p>
        </div>
        <button
          onClick={downloadAuditLog}
          title={`${auditLog.length} registro(s) de auditoria`}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 shadow-sm"
        >
          <Download size={13} className="text-teal-600" />
          Baixar Auditoria
          <span className="ml-1 bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{auditLog.length}</span>
        </button>
      </div>

      {/* ── Abas ── */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0" aria-label="Abas do painel">
          {ABAS.map(({ id, label, Icon }) => {
            const ativo = aba === id;
            return (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-0 cursor-pointer transition-colors ${
                  ativo
                    ? 'border-teal-600 text-teal-700 bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-transparent'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Visão Geral ── */}
      {aba === 'visao-geral' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard 
            icon={<UserCheck  size={17} className="text-teal-600"   />} 
            bg="bg-teal-50"   
            label="Ativos"      
            value={kpis.ativos}          
            accent="border-l-teal-500"   
            onClick={() => { setAba('usuarios'); setFiltroStatus('ativo'); }}
          />
          <KpiCard 
            icon={<UserX      size={17} className="text-red-500"    />} 
            bg="bg-red-50"    
            label="Inativos"    
            value={kpis.inativos}        
            accent="border-l-red-400"    
            onClick={() => { setAba('usuarios'); setFiltroStatus('inativo'); }}
          />
          <KpiCard 
            icon={<DollarSign size={17} className="text-green-600"  />} 
            bg="bg-green-50"  
            label="Receita/mês (Est.)"    
            value={`R$ ${kpis.mrr.toFixed(2)}`}     
            accent="border-l-green-500"  
            onClick={() => setAba('faturamento')}
          />
            <KpiCard 
              icon={<Calendar   size={17} className="text-blue-600"   />} 
              bg="bg-blue-50"   
              label="Novos (30d)" 
              value={kpis.novosMes}         
              accent="border-l-blue-500"   
              onClick={() => { setAba('usuarios'); setFiltroRecentes(true); setFiltroPlano('Todos'); setFiltroStatus('Todos'); }}
            />
          <KpiCard 
            icon={<TrendingUp size={17} className="text-purple-600" />} 
            bg="bg-purple-50" 
            label="Conversão"   
            value={`${kpis.conversao}%`} 
            accent="border-l-purple-500" 
            onClick={() => setAba('conversao')}
          />
        </div>
      )}

      {/* ── Usuários ── */}
      {aba === 'usuarios' && (
        <div>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent placeholder-gray-400 w-56"
              />
              {query && (
                <button title="Limpar busca" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer p-0">
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={filtroPlano}
              onChange={e => setFiltroPlano(e.target.value as Plano | 'Todos')}
              aria-label="Filtrar por plano"
              className="pl-2.5 pr-6 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer text-gray-600"
            >
              <option value="Todos">Todos os planos</option>
              <option value="Grátis">Grátis</option>
              <option value="Profissional">Profissional</option>
              <option value="Empresarial">Empresarial</option>
            </select>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as Status | 'Todos')}
              aria-label="Filtrar por status"
              className="pl-2.5 pr-6 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer text-gray-600"
            >
              <option value="Todos">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            {filtroRecentes && (
              <button 
                onClick={() => setFiltroRecentes(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-blue-100 text-blue-700 border-0 cursor-pointer hover:bg-blue-200 transition-colors"
              >
                <Calendar size={12} />
                Filtrando: Últimos 30 dias
                <X size={12} className="ml-1 opacity-50" />
              </button>
            )}

            <span className="ml-auto text-xs text-gray-400 self-center">{filtrados.length} de {usuarios.length} usuário(s)</span>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {filtrados.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">Nenhum usuário encontrado.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtrados.map(u => {
                  const cfg = PLANO_CONFIG[u.plano];
                  const PlanIcon = cfg.Icon;
                  return (
                    <li key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      {/* Nome + email */}
                      <div className="w-48 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>

                      {/* Plano */}
                      <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        <PlanIcon size={10} /> {u.plano}
                      </span>

                      {/* Status */}
                      <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        u.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {u.status === 'ativo' ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                        {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>

                      {/* Métricas */}
                      <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1 text-teal-600"><ChefHat size={12} />{u.receitas}</span>
                        <span className="inline-flex items-center gap-1 text-orange-500"><Printer size={12} />{u.rotulos}</span>
                        <span>{u.ultimoAcesso}</span>
                      </div>

                      {/* Alterar plano */}
                      <select
                        className="ml-auto text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white cursor-pointer text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-300"
                        value={u.plano}
                        aria-label={`Alterar plano de ${u.nome}`}
                        onChange={e => {
                          const p = e.target.value as Plano;
                          if (p !== u.plano) confirmarComSenha(() => alterarPlano(u.id, p), `Plano alterado: ${u.plano} → ${p}`, u.nome, u.email);
                        }}
                      >
                        <option value="Grátis">Grátis</option>
                        <option value="Profissional">Profissional</option>
                        <option value="Empresarial">Empresarial</option>
                      </select>

                      {/* Ações */}
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          title={u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer ${
                            u.status === 'ativo' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          onClick={() => confirmarComSenha(() => alternarStatus(u.id), u.status === 'ativo' ? 'Usuário desativado' : 'Usuário ativado', u.nome, u.email)}
                        >
                          {u.status === 'ativo' ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                          <span className="hidden sm:inline">{u.status === 'ativo' ? 'Desativar' : 'Ativar'}</span>
                        </button>
                        <button
                          title="Excluir"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => confirmarComSenha(() => excluir(u.id), 'Usuário excluído', u.nome, u.email)}
                        >
                          <Trash2 size={12} />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Planos ── */}
      {aba === 'planos' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(['Grátis', 'Profissional', 'Empresarial'] as Plano[]).map(plano => {
            const cfg      = PLANO_CONFIG[plano];
            const config   = planConfigs[plano];
            const count    = kpis.porPlano[plano];
            const pct      = kpis.totalClientes > 0 ? Math.round((count / kpis.totalClientes) * 100) : 0;
            const mrrPlano = usuarios.filter(u => u.plano === plano && u.status === 'ativo' && u.email !== 'admin@cozinhadanutri.com').length * config.mensal;
            const Icon     = cfg.Icon;

            const RenderPreco = ({ tipo }: { tipo: 'mensal' | 'anual' }) => {
              const valor = config[tipo];

              return (
                <div className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{tipo}</p>
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-black text-gray-800">R$ {valor.toFixed(0)}</span>
                    <button 
                      onClick={() => { setModalEditarPreco({ plano, tipo }); setValorPreco(String(valor)); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-400 border-0 cursor-pointer transition-all"
                    >
                      <Pencil size={10} />
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div key={plano} className={`bg-white rounded-2xl border-2 ${cfg.borda} shadow-sm p-6 flex flex-col gap-6`}>
                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${cfg.fundo}`}>
                      <Icon size={16} className={cfg.cor} />
                    </div>
                    <span className={`text-sm font-bold ${cfg.cor}`}>{plano}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {count} clie.
                  </span>
                </div>

                {/* Preços Duplos */}
                <div className="flex gap-2">
                   <RenderPreco tipo="mensal" />
                   <RenderPreco tipo="anual" />
                </div>

                {/* Benefícios com Checkbox */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Benefícios</p>
                  {config.recursos.map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <div 
                        onClick={() => alternarRecurso(plano, rec)}
                        className="w-4 h-4 rounded border border-teal-500 bg-teal-50 flex items-center justify-center cursor-pointer hover:bg-teal-100"
                      >
                        <Check size={10} className="text-teal-600" />
                      </div>
                      <span className="text-xs text-gray-600 flex-1">{rec}</span>
                    </div>
                  ))}
                  <button 
                    onClick={() => setModalNovoBeneficio(plano)}
                    className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 hover:bg-gray-50 transition-colors mt-2"
                  >
                    + Adicionar Benefício
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                   <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Receita Recorrente Mensal</p>
                      <p className="text-sm font-black text-gray-800">R$ {mrrPlano.toFixed(0)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Participação</p>
                      <p className="text-sm font-black text-teal-600">{pct}%</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Faturamento ── */}
      {aba === 'faturamento' && (
        <div className="flex flex-col gap-6">
          {/* Header Faturamento */}
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Relatório de Faturamento</h2>
              <p className="text-xs text-gray-400 mt-1">Estimativa baseada em assinaturas ativas e preços atuais.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MRR Total Estimado</p>
              <p className="text-3xl font-black text-teal-700">R$ {kpis.mrr.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Evolução Dinâmico */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <TrendingUp size={16} className="text-teal-600" />
                  Evolução de Receita
                </h3>
                
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                   {(['7d', '30d', '90d', '12m'] as const).map(p => (
                      <button 
                        key={p}
                        onClick={() => setPeriodoFaturamento(p)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all border-0 cursor-pointer ${
                          periodoFaturamento === p ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600 bg-transparent'
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                   ))}
                </div>

                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setVisaoFaturamento('total')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border cursor-pointer ${
                        visaoFaturamento === 'total' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                   >
                      Total
                   </button>
                   <button 
                      onClick={() => setVisaoFaturamento('planos')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border cursor-pointer ${
                        visaoFaturamento === 'planos' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                   >
                      Por Plano
                   </button>
                </div>
              </div>
              
              {/* SVG Chart Refinado com Eixos */}
              <div className="relative h-64 w-full flex-1 group mt-4">
                {/* Eixo Vertical (Receita) */}
                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[9px] font-bold text-gray-400 pointer-events-none">
                   <span>R$ {(kpis.mrr * 1.5 || 500).toFixed(0)}</span>
                   <span>R$ {(kpis.mrr || 250).toFixed(0)}</span>
                   <span>R$ 0</span>
                </div>

                <div className="ml-12 h-full relative">
                  <svg viewBox="0 0 550 220" className="w-full h-full preserve-3d overflow-visible">
                    {/* Linhas de grade horizontais */}
                    {[0, 110, 220].map(y => (
                      <line key={y} x1="0" y1={y} x2="550" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    ))}
                    
                    {/* Lógica de cálculo do Y: se mrr for 0, y é 220 (base) */}
                    {(() => {
                      const mrr = kpis.mrr;
                      const hasData = mrr > 0;
                      // Se tem dados, faz uma curva suave de crescimento. Se não, linha reta na base.
                      const yEnd = hasData ? 80 : 220;
                      const yMid = hasData ? 160 : 220;
                      const yStart = hasData ? 210 : 220;

                      return visaoFaturamento === 'total' ? (
                        <>
                          {/* Área do gráfico Total */}
                          <path 
                            d={`M 0 ${yStart} C 100 ${yStart - 5}, 250 ${yMid}, 550 ${yEnd} L 550 220 L 0 220 Z`} 
                            fill="url(#grad-faturamento-teal)"
                            className="opacity-10 transition-all duration-1000 ease-in-out"
                          />
                          {/* Linha Suave Total */}
                          <path 
                            d={`M 0 ${yStart} C 100 ${yStart - 5}, 250 ${yMid}, 550 ${yEnd}`} 
                            fill="none" 
                            stroke="#0d9488" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            className="drop-shadow-sm transition-all duration-1000 ease-in-out"
                          />
                        </>
                      ) : (
                        <>
                          {/* Linhas por plano (Ficariam no fundo se 0) */}
                          <path 
                            d={`M 0 220 C 150 220, 350 220, 550 ${hasData ? 140 : 220}`} 
                            fill="none" 
                            stroke="#f97316" 
                            strokeWidth="2" 
                            strokeDasharray="4 4"
                            className="transition-all duration-1000 ease-in-out"
                          />
                          <path 
                            d={`M 0 220 C 150 220, 350 220, 550 ${hasData ? 180 : 220}`} 
                            fill="none" 
                            stroke="#0d9488" 
                            strokeWidth="2" 
                            className="transition-all duration-1000 ease-in-out"
                          />
                        </>
                      );
                    })()}

                    {/* Eixo Horizontal (Meses) */}
                    <g transform="translate(0, 240)">
                       {[
                         { x: 0,   l: 'Out' }, { x: 137, l: 'Nov' }, 
                         { x: 275, l: 'Dez' }, { x: 412, l: 'Jan' }, 
                         { x: 550, l: 'Hoje' }
                       ].map((m, i) => (
                         <text key={i} x={m.x} y="0" textAnchor="middle" className="text-[10px] fill-gray-400 font-bold uppercase">{m.l}</text>
                       ))}
                    </g>

                    <defs>
                      <linearGradient id="grad-faturamento-teal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" />
                        <stop offset="100%" stopColor="white" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Receita Real</span>
                    </div>
                    {visaoFaturamento === 'planos' && (
                       <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Profissional</span>
                       </div>
                    )}
                 </div>
                 <p className="text-[10px] text-gray-400 italic">* Dados atualizados em tempo real conforme assinaturas</p>
              </div>
            </div>

            {/* Distribuição por Plano */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-600" />
                Receita por Plano
              </h3>
              
              <div className="flex flex-col gap-5">
                {(['Profissional', 'Empresarial'] as Plano[]).map(p => {
                  const valor = usuarios.filter(u => u.plano === p && u.status === 'ativo' && u.email !== 'admin@cozinhadanutri.com').length * planConfigs[p].mensal;
                  const pct = kpis.mrr > 0 ? (valor / kpis.mrr) * 100 : 0;
                  const cfg = PLANO_CONFIG[p];
                  
                  return (
                    <div key={p}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-bold ${cfg.cor}`}>{p}</span>
                        <span className="text-xs font-bold text-gray-800">R$ {valor.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${p === 'Profissional' ? 'bg-orange-500' : 'bg-teal-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">{pct.toFixed(1)}% do faturamento</p>
                    </div>
                  );
                })}

                <div className="mt-4 p-4 rounded-xl bg-orange-50/50 border border-dashed border-orange-200">
                   <div className="flex items-center gap-1.5 mb-2">
                      <p className="text-[10px] font-bold text-orange-600 uppercase">Taxa de Cancelamento (30d)</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-orange-700">{kpis.totalClientes > 0 ? '4.2%' : '0.0%'}</span>
                      <TrendingUp size={14} className="text-orange-500" />
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros Avançados Faturamento */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
             <table className="w-full text-left text-xs">
                <thead className="text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
                   <tr>
                      <th className="pb-3 px-2">Cliente</th>
                      <th className="pb-3 px-2">Plano</th>
                      <th className="pb-3 px-2">Data Adesão</th>
                      <th className="pb-3 px-2">Status Pagto</th>
                      <th className="pb-3 px-2 text-right">Valor Mensal</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {usuarios.filter(u => u.plano !== 'Grátis').slice(0, 10).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-4 px-2 font-medium text-gray-800">{u.nome}</td>
                         <td className="py-4 px-2">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${PLANO_CONFIG[u.plano].badge}`}>{u.plano}</span>
                         </td>
                         <td className="py-4 px-2 text-gray-500">{u.cadastro}</td>
                         <td className="py-4 px-2">
                            <span className="flex items-center gap-1 text-green-600 font-bold">
                               <Check size={12} /> Pago
                            </span>
                         </td>
                         <td className="py-4 px-2 text-right font-black text-gray-800">R$ {planConfigs[u.plano].mensal.toFixed(2)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* ── Conversão ── */}
      {aba === 'conversao' && (
        <div className="flex flex-col gap-8">
          {/* Header Conversão */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-2xl font-black mb-2">Funil de Conversão</h2>
                <p className="text-purple-100 text-sm max-w-md">Análise do comportamento dos usuários desde o cadastro até a adesão aos planos premium.</p>
             </div>
             <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-white/10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Funil Visual */}
             <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-8 uppercase tracking-widest">Jornada do Usuário</h3>
                <div className="flex flex-col gap-1 items-center">
                   {/* Topo: Total */}
                   <div className="w-full bg-gray-50 p-4 rounded-2xl flex justify-between items-center border border-gray-100">
                      <span className="text-xs font-bold text-gray-500">Cadastrados (Total)</span>
                      <span className="text-lg font-black text-gray-800">{kpis.totalClientes}</span>
                   </div>
                   <div className="h-6 w-0.5 bg-gray-200" />
                   
                   {/* Meio: Ativos */}
                   <div className="w-4/5 bg-teal-50 p-4 rounded-2xl flex justify-between items-center border border-teal-100">
                      <span className="text-xs font-bold text-teal-700">Clientes Ativos</span>
                      <span className="text-lg font-black text-teal-800">{kpis.ativos}</span>
                   </div>
                   <div className="h-6 w-0.5 bg-teal-200" />

                   {/* Base: Pagantes */}
                   <div className="w-3/5 bg-orange-50 p-4 rounded-2xl flex justify-between items-center border border-orange-100 shadow-inner">
                      <span className="text-xs font-bold text-orange-700">Assinantes Premium</span>
                      <span className="text-lg font-black text-orange-800">
                         {usuarios.filter(u => u.plano !== 'Grátis' && u.status === 'ativo' && u.email !== 'admin@cozinhadanutri.com').length}
                      </span>
                   </div>
                   
                   <div className="mt-8 text-center">
                      <p className="text-3xl font-black text-teal-600">{kpis.conversao}%</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Taxa de Conversão Geral</p>
                   </div>
                </div>
             </div>

             {/* Comparativo de Planos */}
             <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1">
                   <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-widest">Performance de Planos</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                         <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Profissional</p>
                         <p className="text-2xl font-black text-orange-800">{kpis.porPlano['Profissional']}</p>
                         <p className="text-[10px] text-orange-600 mt-2">Ticket Médio: R$ 49,00</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                         <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Empresarial</p>
                         <p className="text-2xl font-black text-teal-800">{kpis.porPlano['Empresarial']}</p>
                         <p className="text-[10px] text-teal-600 mt-2">Ticket Médio: R$ 99,00</p>
                      </div>
                   </div>

                   <div className="mt-8">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Eficiência de Upsell</h4>
                      <div className="flex items-center gap-4">
                         <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-orange-500" style={{ width: kpis.mrr > 0 ? '70%' : '0%' }} />
                            <div className="h-full bg-teal-600" style={{ width: kpis.mrr > 0 ? '30%' : '0%' }} />
                         </div>
                         <span className="text-xs font-bold text-gray-800">{kpis.totalClientes > 0 ? '70/30' : '0/0'}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Proporção Profissional vs Empresarial</p>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-orange-50">
                         <Zap size={20} className="text-orange-500" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-gray-800">Tempo Médio para Upgrade</p>
                         <p className="text-xs text-gray-400">Desde o cadastro inicial</p>
                      </div>
                      <span className="ml-auto text-lg font-black text-gray-800">{kpis.totalClientes > 0 ? '14 dias' : '--'}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ── Suporte ── */}
      {aba === 'suporte' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               {/* Lista de Chamados */}
               {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Chamados Recentes</h3>
                     <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">3 pendentes</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                     {[
                        { id: '#1284', user: 'Ana Souza', subject: 'Dúvida na exportação de PDF', status: 'pendente', time: '10min atrás' },
                        { id: '#1283', user: 'Carlos Lima', subject: 'Erro ao cadastrar ingrediente', status: 'em-andamento', time: '2h atrás' },
                        { id: '#1282', user: 'Mariana Braga', subject: 'Sugestão de nova funcionalidade', status: 'resolvido', time: '1d atrás' },
                     ].map(ticket => (
                        <div key={ticket.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-600">
                                 {ticket.user[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-gray-800">{ticket.subject}</p>
                                 <p className="text-xs text-gray-400">{ticket.user} • {ticket.id}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                                 ticket.status === 'pendente' ? 'bg-orange-100 text-orange-600' :
                                 ticket.status === 'em-andamento' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                 {ticket.status === 'em-andamento' ? 'em andamento' : ticket.status}
                              </span>
                              <p className="text-[10px] text-gray-300 mt-1">{ticket.time}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                     <button className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer">Ver todos os chamados</button>
                  </div>
               </div> */}
            </div>

            <div className="space-y-6">
               {/* <div className="bg-[#04585a] rounded-2xl p-6 text-white shadow-xl shadow-[#04585a]/20">
                  <h3 className="text-lg font-black mb-2">Performance do Suporte</h3>
                  <p className="text-xs text-white/70 mb-6">Métricas de tempo de resposta e satisfação.</p>
                  
                  <div className="space-y-4">
                     <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                        <p className="text-[10px] font-bold uppercase text-white/50 mb-1">Tempo Médio de Resposta</p>
                        <p className="text-xl font-black">14 min</p>
                     </div>
                     <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                        <p className="text-[10px] font-bold uppercase text-white/50 mb-1">NPS (Satisfação)</p>
                        <p className="text-xl font-black">9.8/10</p>
                     </div>
                     <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                        <p className="text-[10px] font-bold uppercase text-white/50 mb-1">Chamados Hoje</p>
                        <p className="text-xl font-black">24</p>
                     </div>
                  </div>
               </div> */}

               {/* <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <MessageSquare size={20} className="text-teal-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">Central de Ajuda</h4>
                  <p className="text-xs text-gray-400 mb-4">Métricas rápidas de atendimento.</p>
                  <div className="text-left space-y-2">
                     <div className="flex justify-between text-[10px] border-b border-gray-50 pb-1">
                        <span className="text-gray-400 font-bold uppercase">Tempo Médio</span>
                        <span className="text-teal-600 font-black">14 min</span>
                     </div>
                     <div className="flex justify-between text-[10px] border-b border-gray-50 pb-1">
                        <span className="text-gray-400 font-bold uppercase">Satisfação</span>
                        <span className="text-teal-600 font-black">9.8/10</span>
                     </div>
                  </div>
               </div> */}
            </div>

            {/* Configurações de Contato e FAQ */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               {/* Contato */}
               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 rounded-lg bg-teal-50">
                        <Mail size={18} className="text-teal-600" />
                     </div>
                     <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Canais de Contato</h3>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">E-mail de Suporte</label>
                           <input 
                              type="email"
                              value={supportForm.email}
                              onChange={e => setSupportForm({...supportForm, email: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">WhatsApp (com DDD)</label>
                           <input 
                              type="text"
                              value={supportForm.whatsapp}
                              onChange={e => setSupportForm({...supportForm, whatsapp: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Instagram (apenas o @)</label>
                        <input 
                           type="text"
                           value={supportForm.instagram}
                           onChange={e => setSupportForm({...supportForm, instagram: e.target.value})}
                           className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                     </div>

                     <div className="pt-4 border-t border-gray-50">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">Horários de Atendimento</h4>
                        <div className="space-y-3">
                           <div>
                              <label className="block text-[10px] text-gray-500 mb-1 ml-1">Segunda a Sexta</label>
                              <input 
                                 type="text"
                                 value={supportForm.horarios.segSex}
                                 onChange={e => setSupportForm({...supportForm, horarios: {...supportForm.horarios, segSex: e.target.value}})}
                                 className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[10px] text-gray-500 mb-1 ml-1">Sábados</label>
                                 <input 
                                    type="text"
                                    value={supportForm.horarios.sabado}
                                    onChange={e => setSupportForm({...supportForm, horarios: {...supportForm.horarios, sabado: e.target.value}})}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs"
                                 />
                              </div>
                              <div>
                                 <label className="block text-[10px] text-gray-500 mb-1 ml-1">Dom. e Feriados</label>
                                 <input 
                                    type="text"
                                    value={supportForm.horarios.domingoFeriado}
                                    onChange={e => setSupportForm({...supportForm, horarios: {...supportForm.horarios, domingoFeriado: e.target.value}})}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={() => {
                           confirmarComSenha(() => {
                              saveSupportConfig(supportForm);
                              setFeedback({ tipo: 'sucesso', msg: "Configurações de suporte salvas!" });
                           }, "Alterar configurações de contato e horários", "Admin", "admin@cozinhadanutri.com.br");
                        }}
                        className="w-full mt-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold border-0 cursor-pointer hover:bg-teal-700 shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                     >
                        <Save size={14} />
                        Salvar Configurações
                     </button>
                  </div>
               </div>

               {/* FAQ Management */}
               <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-50">
                           <HelpCircle size={18} className="text-orange-600" />
                        </div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Gerenciar FAQ</h3>
                     </div>
                     <button 
                        onClick={() => setEditandoFaq({ id: Date.now().toString(), categoria: 'geral', pergunta: '', resposta: '' })}
                        className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 border-0 cursor-pointer transition-colors"
                        title="Adicionar Pergunta"
                     >
                        <Plus size={18} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-3 custom-scrollbar">
                     {faqList.map(faq => (
                        <div key={faq.id} className="p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:border-orange-200 transition-colors group">
                           <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{faq.categoria}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => setEditandoFaq(faq)} className="p-1 text-blue-600 hover:bg-blue-50 rounded border-0 cursor-pointer"><Pencil size={12} /></button>
                                 <button 
                                    onClick={() => setConfirmacaoExclusao({ id: faq.id, tipo: 'faq' })}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded border-0 cursor-pointer"
                                 >
                                    <Trash size={12} />
                                 </button>
                              </div>
                           </div>
                           <p className="text-xs font-bold text-gray-800 line-clamp-1">{faq.pergunta}</p>
                           <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{faq.resposta}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* ── Modal FAQ (Adicionar/Editar) ── */}
      {editandoFaq && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xl border border-gray-100">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-orange-50">
                     <HelpCircle size={24} className="text-orange-600" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-gray-800">{faqList.find(f => f.id === editandoFaq.id) ? 'Editar Pergunta' : 'Nova Pergunta'}</h3>
                     <p className="text-xs text-gray-400">Gerencie o conteúdo do FAQ para os usuários.</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Pergunta</label>
                        <input 
                           type="text"
                           value={editandoFaq.pergunta}
                           onChange={e => { setEditandoFaq({...editandoFaq, pergunta: e.target.value}); setErroSenha(''); }}
                           className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                           placeholder="Como faço para...?"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Categoria</label>
                        <select 
                           value={editandoFaq.categoria}
                           onChange={e => setEditandoFaq({...editandoFaq, categoria: e.target.value as any})}
                           className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                        >
                           <option value="geral">Dúvidas Gerais</option>
                           <option value="tecnico">Problemas Técnicos</option>
                           <option value="plano">Planos e Cobrança</option>
                           <option value="outros">Solicitações Especiais</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Resposta</label>
                     <textarea 
                        rows={4}
                        value={editandoFaq.resposta}
                        onChange={e => { setEditandoFaq({...editandoFaq, resposta: e.target.value}); setErroSenha(''); }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium resize-none"
                        placeholder="Escreva a resposta detalhada aqui..."
                     />
                     {erroSenha && <p className="text-[10px] text-red-500 mt-2 ml-1 font-bold">⚠️ {erroSenha}</p>}
                  </div>
               </div>

               <div className="flex gap-3 mt-8">
                  <button 
                     onClick={() => { setEditandoFaq(null); setErroSenha(''); }}
                     className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border-0 cursor-pointer"
                  >
                     Cancelar
                  </button>
                  <button 
                     onClick={async () => {
                        if(!editandoFaq.pergunta || !editandoFaq.resposta) return setErroSenha("Preencha todos os campos.");
                        const logado = await login('admin@cozinhadanutri.com', senhaModal);
                        if (logado) {
                           const existe = faqList.find(f => f.id === editandoFaq.id);
                           const novas = existe 
                              ? faqList.map(f => f.id === editandoFaq.id ? editandoFaq : f)
                              : [...faqList, editandoFaq];
                           setFaqList(novas);
                           saveFAQ(novas);
                           setEditandoFaq(null);
                           setSenhaModal('');
                           setErroSenha('');
                           setFeedback({ tipo: 'sucesso', msg: "Pergunta salva no FAQ!" });
                        } else {
                           setErroSenha("Senha incorreta.");
                        }
                     }}
                     className="flex-[2] py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg shadow-orange-600/20 border-0 cursor-pointer"
                  >
                     Salvar Pergunta
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* ── Atividades ── */}
      {aba === 'atividades' && (
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
           <ul className="divide-y divide-gray-100">
             {atividades.length > 0 ? atividades.map(a => {
               const cfg  = TIPO_ATIVIDADE[a.tipo] ?? TIPO_ATIVIDADE['login'];
               const Icon = cfg.Icon;
               return (
                 <li key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                   <div className={`p-2 rounded-lg shrink-0 ${cfg.cls}`}>
                     <Icon size={14} />
                   </div>
                   <div className="min-w-0 flex-1">
                     <p className="text-sm font-bold text-gray-800">{a.acao}</p>
                     <p className="text-xs text-gray-400 mt-0.5">{a.empresa_nome || 'Sistema'} • {a.usuario_nome}</p>
                   </div>
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                   <span className="text-[10px] font-bold text-gray-400 shrink-0 uppercase tracking-tighter">
                      {new Date(a.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </li>
               );
             }) : (
                <div className="p-10 text-center">
                   <Activity size={40} className="text-gray-200 mx-auto mb-3" />
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Nenhuma atividade registrada ainda</p>
                </div>
             )}
           </ul>
         </div>
      )}

      {/* ── Modal de confirmação de senha ── */}
      {acaoPendente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) fecharModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-teal-600" />
              <h2 className="text-sm font-bold text-gray-800">Confirmação de segurança</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">Digite a senha do administrador para continuar.</p>
            <input
              ref={inputSenhaRef}
              type="password"
              placeholder="Senha do admin"
              value={senhaModal}
              onChange={e => { setSenhaModal(e.target.value); setErroSenha(''); }}
              onKeyDown={e => e.key === 'Enter' && executarAcao()}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent placeholder-gray-400"
            />
            {erroSenha && <p className="text-xs text-red-500 mt-2">{erroSenha}</p>}
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-gray-50 text-gray-500 cursor-pointer border-0 hover:bg-gray-100 transition-all"
                onClick={fecharModal}
              >
                Cancelar
              </button>
              <button
                className="flex-[2] py-2.5 text-xs font-bold rounded-xl bg-teal-600 text-white cursor-pointer border-0 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                onClick={executarAcao}
              >
                Confirmar Senha
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Novo Benefício com Senha ── */}
      {modalNovoBeneficio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
           <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 rounded-2xl bg-teal-50">
                    <Star size={24} className="text-teal-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-gray-800">Novo Benefício</h3>
                    <p className="text-xs text-gray-400">Adicionando ao plano {modalNovoBeneficio}</p>
                 </div>
              </div>

              <div className="space-y-5">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descrição do Benefício</label>
                    <input 
                       type="text"
                       placeholder="Ex: Suporte via WhatsApp"
                       value={textoBeneficio}
                       onChange={e => setTextoBeneficio(e.target.value)}
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium"
                       autoFocus
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha de Administrador</label>
                    <input 
                       type="password"
                       placeholder="••••••••"
                       value={senhaModal}
                       onChange={e => setSenhaModal(e.target.value)}
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium"
                    />
                    {erroSenha && <p className="text-[10px] text-red-500 mt-2 ml-1 font-bold">⚠️ {erroSenha}</p>}
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button 
                    onClick={() => { setModalNovoBeneficio(null); setTextoBeneficio(''); setSenhaModal(''); setErroSenha(''); }}
                    className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border-0 cursor-pointer"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={async () => {
                       if (!textoBeneficio.trim()) return setErroSenha("Digite a descrição do benefício.");
                       const logado = await login('admin@cozinhadanutri.com', senhaModal);
                       if (logado) {
                          alternarRecurso(modalNovoBeneficio, textoBeneficio, true);
                          setModalNovoBeneficio(null);
                          setTextoBeneficio('');
                          setSenhaModal('');
                          setErroSenha('');
                          setFeedback({ tipo: 'sucesso', msg: "Benefício adicionado com sucesso!" });
                       } else {
                          setErroSenha("Senha incorreta.");
                       }
                    }}
                    className="flex-[2] py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-lg shadow-teal-600/20 border-0 cursor-pointer"
                 >
                    Confirmar e Salvar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ── Modal Editar Preço com Senha ── */}
      {modalEditarPreco && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
           <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 rounded-2xl bg-orange-50">
                    <DollarSign size={24} className="text-orange-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-gray-800">Editar Preço {modalEditarPreco.tipo}</h3>
                    <p className="text-xs text-gray-400">Plano {modalEditarPreco.plano}</p>
                 </div>
              </div>

              <div className="space-y-5">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Novo Valor (R$)</label>
                    <input 
                       type="number"
                       placeholder="0.00"
                       value={valorPreco}
                       onChange={e => setValorPreco(e.target.value)}
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm font-medium"
                       autoFocus
                    />
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha de Administrador</label>
                    <input 
                       type="password"
                       placeholder="••••••••"
                       value={senhaModal}
                       onChange={e => setSenhaModal(e.target.value)}
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm font-medium"
                    />
                    {erroSenha && <p className="text-[10px] text-red-500 mt-2 ml-1 font-bold">⚠️ {erroSenha}</p>}
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button 
                    onClick={() => { setModalEditarPreco(null); setValorPreco(''); setSenhaModal(''); setErroSenha(''); }}
                    className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border-0 cursor-pointer"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={async () => {
                       const valor = parseFloat(valorPreco);
                       if (isNaN(valor)) return setErroSenha("Digite um valor válido.");
                       
                       const logado = await login('admin@cozinhadanutri.com', senhaModal);
                       if (logado) {
                          salvarPreco(modalEditarPreco.plano, modalEditarPreco.tipo, valor, true);
                          setModalEditarPreco(null);
                          setValorPreco('');
                          setSenhaModal('');
                          setErroSenha('');
                          setFeedback({ tipo: 'sucesso', msg: `Preço ${modalEditarPreco.tipo} atualizado!` });
                       } else {
                          setErroSenha("Senha incorreta.");
                       }
                    }}
                    className="flex-[2] py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-lg shadow-orange-600/20 border-0 cursor-pointer"
                 >
                    Salvar Novo Preço
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* ── Modal de Confirmação de Exclusão ── */}
      {confirmacaoExclusao && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-red-50">
                     <Trash size={24} className="text-red-600" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-gray-800">Confirmar Exclusão</h3>
                     <p className="text-xs text-gray-400">Esta ação não pode ser desfeita.</p>
                  </div>
               </div>
               <p className="text-sm text-gray-600 mb-8">Deseja realmente excluir este item do {confirmacaoExclusao.tipo === 'faq' ? 'FAQ' : 'sistema'}?</p>
               <div className="flex gap-3">
                  <button 
                     onClick={() => setConfirmacaoExclusao(null)}
                     className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border-0 cursor-pointer"
                  >
                     Cancelar
                  </button>
                  <button 
                     onClick={() => {
                        if (confirmacaoExclusao.tipo === 'faq') {
                           const novas = faqList.filter(f => f.id !== confirmacaoExclusao.id);
                           setFaqList(novas);
                           saveFAQ(novas);
                           setFeedback({ tipo: 'sucesso', msg: "Pergunta removida do FAQ." });
                        }
                        setConfirmacaoExclusao(null);
                     }}
                     className="flex-[2] py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20 border-0 cursor-pointer"
                  >
                     Excluir Agora
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* ── Toast de Feedback ── */}
      {feedback && (
         <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            feedback.tipo === 'sucesso' ? 'bg-[#04585a] text-white' : 'bg-red-600 text-white'
         }`}>
            {feedback.tipo === 'sucesso' ? <CheckCircle size={20} className="text-teal-300" /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold tracking-tight">{feedback.msg}</span>
         </div>
      )}
    </div>
  );
}
