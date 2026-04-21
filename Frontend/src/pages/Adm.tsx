import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Trash2, ShieldCheck, ShieldOff, Users, TrendingUp,
  DollarSign, UserCheck, UserX, ChefHat, Printer,
  Search, X, Calendar, Lock, Download,
  Pencil, Check, Tag, LogIn, Leaf, Crown, Star, Zap,
  LayoutDashboard, CreditCard, Activity,
} from 'lucide-react';
import { login } from '../services/auth';

type Plano = 'Grátis' | 'Profissional' | 'Empresarial';
type Status = 'ativo' | 'inativo';
type Aba = 'visao-geral' | 'usuarios' | 'planos' | 'atividades';

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

const PRECO_INICIAL: Record<Plano, number> = {
  'Grátis': 0,
  'Profissional': 49,
  'Empresarial': 99,
};

function parseDate(s: string): Date {
  const [d, m, y] = s.split('/').map(Number);
  return new Date(y, m - 1, d);
}

const HOJE = new Date(2026, 3, 19);
const TRINTA_DIAS_ATRAS = new Date(HOJE);
TRINTA_DIAS_ATRAS.setDate(TRINTA_DIAS_ATRAS.getDate() - 30);

const usuariosIniciais: Usuario[] = [
  { id: '1', nome: 'Ana Souza',      email: 'ana@email.com',      plano: 'Profissional', status: 'ativo',   cadastro: '01/03/2026', ultimoAcesso: '18/04/2026', receitas: 12, rotulos: 8  },
  { id: '2', nome: 'Carlos Lima',    email: 'carlos@email.com',   plano: 'Grátis',       status: 'ativo',   cadastro: '10/03/2026', ultimoAcesso: '15/04/2026', receitas: 3,  rotulos: 0  },
  { id: '3', nome: 'Fernanda Costa', email: 'fernanda@email.com', plano: 'Empresarial',  status: 'inativo', cadastro: '15/02/2026', ultimoAcesso: '01/03/2026', receitas: 27, rotulos: 19 },
  { id: '4', nome: 'João Mendes',    email: 'joao@email.com',     plano: 'Grátis',       status: 'ativo',   cadastro: '20/03/2026', ultimoAcesso: '19/04/2026', receitas: 1,  rotulos: 0  },
  { id: '5', nome: 'Mariana Braga',  email: 'mariana@email.com',  plano: 'Profissional', status: 'ativo',   cadastro: '05/04/2026', ultimoAcesso: '19/04/2026', receitas: 6,  rotulos: 4  },
];

const atividadesMock = [
  { id: 1, usuario: 'Mariana Braga', acao: 'Gerou rótulo nutricional',         tempo: '2h atrás',  tipo: 'rotulo'     },
  { id: 2, usuario: 'João Mendes',   acao: 'Criou receita "Bolo de Cenoura"',  tempo: '5h atrás',  tipo: 'receita'    },
  { id: 3, usuario: 'Ana Souza',     acao: 'Atualizou cadastro de ingrediente',tempo: '1d atrás',  tipo: 'ingrediente'},
  { id: 4, usuario: 'Carlos Lima',   acao: 'Fez login no sistema',             tempo: '2d atrás',  tipo: 'login'      },
  { id: 5, usuario: 'Mariana Braga', acao: 'Criou receita "Frango Grelhado"',  tempo: '3d atrás',  tipo: 'receita'    },
  { id: 6, usuario: 'Ana Souza',     acao: 'Criou receita "Salada Caesar"',    tempo: '4d atrás',  tipo: 'receita'    },
];

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
};

const PLANO_CONFIG: Record<Plano, { cor: string; borda: string; fundo: string; Icon: React.ElementType; badge: string }> = {
  'Grátis':       { cor: 'text-gray-600',   borda: 'border-gray-300',   fundo: 'bg-gray-50',   Icon: Star,  badge: 'bg-gray-100 text-gray-600'    },
  'Profissional': { cor: 'text-teal-700',   borda: 'border-teal-400',   fundo: 'bg-teal-50',   Icon: Zap,   badge: 'bg-teal-100 text-teal-700'    },
  'Empresarial':  { cor: 'text-purple-700', borda: 'border-purple-400', fundo: 'bg-purple-50', Icon: Crown, badge: 'bg-purple-100 text-purple-700' },
};

const ABAS: { id: Aba; label: string; Icon: React.ElementType }[] = [
  { id: 'visao-geral', label: 'Visão Geral',  Icon: LayoutDashboard },
  { id: 'usuarios',    label: 'Usuários',      Icon: Users           },
  { id: 'planos',      label: 'Planos',         Icon: CreditCard      },
  { id: 'atividades',  label: 'Atividades',     Icon: Activity        },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, bg, label, value, accent }: { icon: React.ReactNode; bg: string; label: string; value: string | number; accent: string }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${accent} shadow-sm p-4 flex items-center gap-3`}>
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

  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais);
  const [precos, setPrecos]     = useState<Record<Plano, number>>(PRECO_INICIAL);
  const [editandoPreco, setEditandoPreco] = useState<Plano | null>(null);
  const [precoTemp, setPrecoTemp]         = useState('');

  const [query, setQuery]               = useState('');
  const [filtroPlano, setFiltroPlano]   = useState<Plano | 'Todos'>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<Status | 'Todos'>('Todos');

  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null);
  const [auditLog, setAuditLog]         = useState<AuditEntry[]>(auditLogInicial);
  const [senhaModal, setSenhaModal]     = useState('');
  const [erroSenha, setErroSenha]       = useState('');
  const inputSenhaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (acaoPendente) inputSenhaRef.current?.focus();
  }, [acaoPendente]);

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

  function executarAcao() {
    const resultado = login('admin@cozinhadanutri.com', senhaModal);
    if (!resultado) { setErroSenha('Senha incorreta.'); return; }
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

  function salvarPreco(plano: Plano) {
    const valor = parseFloat(precoTemp);
    if (!isNaN(valor) && valor >= 0) {
      confirmarComSenha(
        () => setPrecos(p => ({ ...p, [plano]: valor })),
        `Preço do plano ${plano} atualizado para R$ ${valor.toFixed(2)}`,
        'Administrador', 'admin@cozinhadanutri.com',
      );
    }
    setEditandoPreco(null);
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
    const ativos   = usuarios.filter(u => u.status === 'ativo').length;
    const inativos = usuarios.length - ativos;
    const mrr      = usuarios.filter(u => u.status === 'ativo').reduce((s, u) => s + precos[u.plano], 0);
    const novosMes = usuarios.filter(u => parseDate(u.cadastro) >= TRINTA_DIAS_ATRAS).length;
    const pagantes = usuarios.filter(u => u.plano !== 'Grátis' && u.status === 'ativo').length;
    const conversao = usuarios.length > 0 ? Math.round((pagantes / usuarios.length) * 100) : 0;
    const porPlano  = (['Grátis', 'Profissional', 'Empresarial'] as Plano[]).reduce(
      (acc, p) => ({ ...acc, [p]: usuarios.filter(u => u.plano === p).length }),
      {} as Record<Plano, number>,
    );
    return { ativos, inativos, mrr, novosMes, conversao, porPlano };
  }, [usuarios, precos]);

  const filtrados = useMemo(() => usuarios.filter(u => {
    const q = query.toLowerCase();
    const matchQuery  = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchPlano  = filtroPlano  === 'Todos' || u.plano  === filtroPlano;
    const matchStatus = filtroStatus === 'Todos' || u.status === filtroStatus;
    return matchQuery && matchPlano && matchStatus;
  }), [usuarios, query, filtroPlano, filtroStatus]);

  const alternarStatus = (id: string) =>
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'ativo' ? 'inativo' : 'ativo' } : u));
  const excluir = (id: string) =>
    setUsuarios(prev => prev.filter(u => u.id !== id));
  const alterarPlano = (id: string, plano: Plano) =>
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, plano } : u));

  return (
    <div className="py-8 min-h-[80vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-teal-50 shrink-0">
          <Users size={20} className="text-teal-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Painel Administrativo</h1>
          <p className="text-xs text-gray-400 mt-0.5">{usuarios.length} usuário(s) cadastrado(s)</p>
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
          <KpiCard icon={<UserCheck  size={17} className="text-teal-600"   />} bg="bg-teal-50"   label="Ativos"      value={kpis.ativos}          accent="border-l-teal-500"   />
          <KpiCard icon={<UserX      size={17} className="text-red-500"    />} bg="bg-red-50"    label="Inativos"    value={kpis.inativos}        accent="border-l-red-400"    />
          <KpiCard icon={<DollarSign size={17} className="text-green-600"  />} bg="bg-green-50"  label="Receita/mês (Est.)"    value={`R$ ${kpis.mrr}`}     accent="border-l-green-500"  />
          <KpiCard icon={<Calendar   size={17} className="text-blue-600"   />} bg="bg-blue-50"   label="Novos (30d)" value={kpis.novosMes}         accent="border-l-blue-500"   />
          <KpiCard icon={<TrendingUp size={17} className="text-purple-600" />} bg="bg-purple-50" label="Conversão"   value={`${kpis.conversao}%`} accent="border-l-purple-500" />
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
            const count    = kpis.porPlano[plano];
            const pct      = usuarios.length > 0 ? Math.round((count / usuarios.length) * 100) : 0;
            const mrrPlano = usuarios.filter(u => u.plano === plano && u.status === 'ativo').length * precos[plano];
            const Icon     = cfg.Icon;
            const editando = editandoPreco === plano;

            return (
              <div key={plano} className={`bg-white rounded-2xl border-2 ${cfg.borda} shadow-sm p-6 flex flex-col gap-5`}>
                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${cfg.fundo}`}>
                      <Icon size={16} className={cfg.cor} />
                    </div>
                    <span className={`text-sm font-bold ${cfg.cor}`}>{plano}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {count} usuário{count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Preço */}
                <div>
                  {editando ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-500">R$</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        title="Novo valor do plano"
                        value={precoTemp}
                        onChange={e => setPrecoTemp(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') salvarPreco(plano); if (e.key === 'Escape') setEditandoPreco(null); }}
                        className="w-24 px-2 py-1 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200"
                        autoFocus
                      />
                      <button title="Salvar" onClick={() => salvarPreco(plano)} className="p-1.5 rounded-lg bg-teal-100 text-teal-700 border-0 cursor-pointer hover:bg-teal-200">
                        <Check size={14} />
                      </button>
                      <button title="Cancelar" onClick={() => setEditandoPreco(null)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 border-0 cursor-pointer hover:bg-gray-200">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-800">
                        {precos[plano] === 0 ? 'Grátis' : `R$ ${precos[plano].toFixed(2)}`}
                      </span>
                      {precos[plano] > 0 && <span className="text-xs text-gray-400">/mês</span>}
                      <button
                        onClick={() => { setEditandoPreco(plano); setPrecoTemp(String(precos[plano])); }}
                        className="ml-1 p-1 rounded-lg bg-gray-100 text-gray-400 border-0 cursor-pointer hover:bg-gray-200 hover:text-gray-600"
                        title="Editar preço"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-2.5 pt-4 border-t border-gray-100 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Assinantes ativos</span>
                    <span className="font-semibold text-gray-800">{usuarios.filter(u => u.plano === plano && u.status === 'ativo').length}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>MRR do plano</span>
                    <span className="font-semibold text-gray-800">R$ {mrrPlano.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Participação</span>
                    <span className="font-semibold text-gray-800">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        plano === 'Grátis' ? 'bg-gray-400' : plano === 'Profissional' ? 'bg-teal-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Atividades ── */}
      {aba === 'atividades' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {atividadesMock.map(a => {
              const cfg  = TIPO_ATIVIDADE[a.tipo] ?? TIPO_ATIVIDADE['login'];
              const Icon = cfg.Icon;
              return (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg shrink-0 ${cfg.cls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">{a.acao}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.usuario}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-400 shrink-0">{a.tempo}</span>
                </li>
              );
            })}
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
            <div className="flex gap-2 mt-4 justify-end">
              <button
                className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 cursor-pointer border-0 hover:bg-gray-200"
                onClick={fecharModal}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white cursor-pointer border-0 hover:bg-teal-700"
                onClick={executarAcao}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

