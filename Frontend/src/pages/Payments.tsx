import { useState } from 'react';
import {
  CreditCard,
  Check,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Zap,
  Building2,
  QrCode,
  ChevronDown,
} from 'lucide-react';
import { criarPreferencia, PlanoId, MetodoPagamento } from '../services/mercadoPagoApi';
import { UsuarioLogado } from '../types';

interface Plano {
  id: PlanoId;
  nome: string;
  valorMensal: number;
  valorAnualMes: number;
  totalAnual: number;
  economiaMensal: number;
  destaque: boolean;
  icon: React.ElementType;
  recursos: string[];
}

const planos: Plano[] = [
  {
    id: 'profissional',
    nome: 'Profissional',
    valorMensal: 29.9,
    valorAnualMes: 24.17,
    totalAnual: 290,
    economiaMensal: 5.73,
    destaque: true,
    icon: Zap,
    recursos: [
      'Receitas ilimitadas',
      'Ingredientes ilimitados',
      'Precificação avançada',
      'Exportar rótulos em PDF',
      'Histórico de receitas',
      'Suporte prioritário',
    ],
  },
  {
    id: 'empresarial',
    nome: 'Empresarial',
    valorMensal: 79.9,
    valorAnualMes: 65.83,
    totalAnual: 790,
    economiaMensal: 14.07,
    destaque: false,
    icon: Building2,
    recursos: [
      'Tudo do Profissional',
      'Múltiplos usuários',
      'Relatórios gerenciais',
      'API de integração',
      'Onboarding dedicado',
    ],
  },
];

interface PaymentsProps {
  usuario: UsuarioLogado | null;
  planoPreSelecionado?: PlanoId;
  onVoltar?: () => void;
  onLogin?: () => void;
}

const DESCONTO_PIX = 0.05;
const MAX_PARCELAS = 12;

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Payments({ usuario, planoPreSelecionado, onVoltar, onLogin }: PaymentsProps): JSX.Element {
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoId | null>(planoPreSelecionado ?? null);
  const [cicloAnual, setCicloAnual] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | null>(null);
  const [parcelas, setParcelas] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const planoAtual = planos.find((p) => p.id === planoSelecionado);

  const valorBase = cicloAnual
    ? (planoAtual?.totalAnual ?? 0)
    : (planoAtual?.valorMensal ?? 0);
  const valorFinal = metodoPagamento === 'pix' ? valorBase * (1 - DESCONTO_PIX) : valorBase;
  const valorParcela = valorFinal / parcelas;

  const podePagar = !!planoAtual && !!metodoPagamento;

  const handleAssinar = async () => {
    if (!planoAtual || !metodoPagamento) return;
    if (!usuario) { onLogin?.(); return; }

    setCarregando(true);
    setErro(null);

    try {
      const resposta = await criarPreferencia({
        planoId: planoAtual.id,
        planoNome: planoAtual.nome,
        valor: valorFinal,
        usuarioEmail: usuario.email,
        usuarioNome: usuario.nome,
        metodoPagamento,
        parcelas: metodoPagamento === 'cartao' ? parcelas : undefined,
      });

      const isSandbox = import.meta.env.DEV;
      const url = isSandbox ? resposta.sandboxInitPoint : resposta.initPoint;
      window.location.href = url;
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Erro ao iniciar o pagamento. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de topo */}
      <div className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
        {onVoltar ? (
          <button
            onClick={onVoltar}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition focus:outline-none"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
        ) : <div />}
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-[#04585a]" />
          Pagamento seguro via Mercado Pago
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Título */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Finalizar assinatura</h1>
          <p className="text-sm text-gray-400 mt-1">Preencha os dados abaixo para ativar seu plano.</p>
        </div>

        {/* Alerta de login */}
        {!usuario && (
          <div className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3 mb-8">
            <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Você precisa estar{' '}
              <button
                type="button"
                onClick={onLogin}
                className="font-bold underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
              >
                logado
              </button>{' '}
              para assinar um plano.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Coluna esquerda — steps (3/5) */}
          <div className="lg:col-span-3 flex flex-col gap-8">

            {/* Step 1 */}
            <div className="border-l-4 border-[#04585a] pl-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#04585a] mb-1">Passo 1</p>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Escolha seu plano</h2>

                {/* Toggle mensal / anual */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${!cicloAnual ? 'text-gray-900' : 'text-gray-400'}`}>Mensal</span>
                  <button
                    type="button"
                    title={cicloAnual ? 'Mudar para cobrança mensal' : 'Mudar para cobrança anual'}
                    onClick={() => setCicloAnual((v) => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${
                      cicloAnual ? 'bg-[#04585a]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      cicloAnual ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                  <span className={`text-xs font-semibold ${cicloAnual ? 'text-gray-900' : 'text-gray-400'}`}>Anual</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {planos.map((plano) => {
                  const Icon = plano.icon;
                  const ativo = planoSelecionado === plano.id;
                  return (
                    <button
                      key={plano.id}
                      type="button"
                      onClick={() => setPlanoSelecionado(plano.id)}
                      className={`w-full text-left rounded-xl p-4 transition-all focus:outline-none ${
                        ativo
                          ? 'bg-[#04585a] text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            ativo ? 'border-white bg-white' : 'border-gray-300 bg-white'
                          }`}>
                            {ativo && <span className="w-2 h-2 bg-[#04585a] rounded-full" />}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon size={14} className={ativo ? 'text-white' : 'text-gray-400'} />
                              <span className="font-bold text-sm">{plano.nome}</span>
                              {plano.destaque && (
                                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                                  ativo ? 'bg-white/20 text-white' : 'bg-[#04585a]/10 text-[#04585a]'
                                }`}>
                                  Popular
                                </span>
                              )}
                            </div>
                            <ul className="flex flex-col gap-1">
                              {plano.recursos.map((r) => (
                                <li key={r} className={`flex items-center gap-2 text-xs ${ativo ? 'text-white/80' : 'text-gray-500'}`}>
                                  <Check size={10} className={ativo ? 'text-white' : 'text-[#04585a]'} strokeWidth={3} />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`text-xl font-extrabold ${ativo ? 'text-white' : 'text-gray-900'}`}>
                            {formatarMoeda(cicloAnual ? plano.valorAnualMes : plano.valorMensal)}
                          </p>
                          <p className={`text-xs mt-0.5 ${ativo ? 'text-white/60' : 'text-gray-400'}`}>/mês</p>
                          {cicloAnual && (
                            <p className={`text-[10px] mt-0.5 ${ativo ? 'text-green-300' : 'text-green-600'}`}>
                              {formatarMoeda(plano.totalAnual)}/ano
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-[#04585a] pl-5">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#04585a] mb-1">Passo 2</p>
              <h2 className="text-base font-bold text-gray-900 mb-4">Forma de pagamento</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* PIX */}
                <button
                  type="button"
                  onClick={() => setMetodoPagamento('pix')}
                  className={`flex flex-col gap-2 rounded-xl p-4 text-left transition-all focus:outline-none border-2 ${
                    metodoPagamento === 'pix'
                      ? 'border-[#04585a] bg-[#04585a]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <QrCode size={18} className={metodoPagamento === 'pix' ? 'text-[#04585a]' : 'text-gray-400'} />
                    <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full tracking-wider uppercase">5% OFF</span>
                  </div>
                  <p className="font-bold text-sm text-gray-900">PIX</p>
                  <p className="text-xs text-gray-400 leading-relaxed">Aprovação instantânea. Sem taxas.</p>
                </button>

                {/* Cartão */}
                <button
                  type="button"
                  onClick={() => setMetodoPagamento('cartao')}
                  className={`flex flex-col gap-2 rounded-xl p-4 text-left transition-all focus:outline-none border-2 ${
                    metodoPagamento === 'cartao'
                      ? 'border-[#04585a] bg-[#04585a]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CreditCard size={18} className={metodoPagamento === 'cartao' ? 'text-[#04585a]' : 'text-gray-400'} />
                    <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full tracking-wider uppercase">até {MAX_PARCELAS}x</span>
                  </div>
                  <p className="font-bold text-sm text-gray-900">Cartão de crédito</p>
                  <p className="text-xs text-gray-400 leading-relaxed">Parcelamento sem juros.</p>
                </button>
              </div>

              {/* Parcelas */}
              {metodoPagamento === 'cartao' && planoAtual && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="parcelas" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Parcelamento
                  </label>
                  <div className="relative">
                    <select
                      id="parcelas"
                      value={parcelas}
                      onChange={(e) => setParcelas(Number(e.target.value))}
                      className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:border-[#04585a] transition"
                    >
                      {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}x de {formatarMoeda(valorBase / n)} — sem juros
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita — Resumo escuro (2/5) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden sticky top-6 bg-[#04585a]">

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/50 mb-1">Resumo</p>
                <p className="text-lg font-bold text-white">
                  {planoAtual ? `Plano ${planoAtual.nome}` : 'Nenhum plano selecionado'}
                </p>
                {planoAtual && (
                  <p className="text-xs text-white/50 mt-0.5">Cobrança {cicloAnual ? 'anual' : 'mensal'} recorrente</p>
                )}
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                {planoAtual ? (
                  <>
                    {/* Linha base */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/70">{cicloAnual ? 'Plano anual' : 'Plano mensal'}</span>
                      <span className="text-sm font-semibold text-white">
                        {cicloAnual ? formatarMoeda(planoAtual.totalAnual) : formatarMoeda(planoAtual.valorMensal)}
                      </span>
                    </div>
                    {/* Desconto PIX */}
                    {metodoPagamento === 'pix' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-300">Desconto PIX (5%)</span>
                        <span className="text-sm font-semibold text-green-300">− {formatarMoeda(valorBase * DESCONTO_PIX)}</span>
                      </div>
                    )}

                    {/* Parcelas */}
                    {metodoPagamento === 'cartao' && parcelas > 1 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/50">{parcelas}x sem juros</span>
                        <span className="text-sm text-white/50">{formatarMoeda(valorParcela)}/parcela</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                      <span className="text-sm text-white/70">{cicloAnual ? 'Total / ano' : 'Total / mês'}</span>
                      <span className="text-3xl font-extrabold text-white tracking-tight">{formatarMoeda(valorFinal)}</span>
                    </div>

                    {/* Erro */}
                    {erro && (
                      <div className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2.5">
                        <AlertCircle size={13} className="text-red-300 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-200">{erro}</p>
                      </div>
                    )}

                    {/* Botão */}
                    <button
                      type="button"
                      onClick={handleAssinar}
                      disabled={carregando || !podePagar}
                      className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition ${
                        carregando || !podePagar
                          ? 'bg-white/20 text-white/40 cursor-not-allowed'
                          : 'bg-white text-[#04585a] hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      {carregando ? (
                        <><Loader2 size={15} className="animate-spin" /> Processando...</>
                      ) : metodoPagamento === 'pix' ? (
                        <><QrCode size={15} /> Pagar com PIX</>
                      ) : metodoPagamento === 'cartao' ? (
                        <><CreditCard size={15} /> Pagar com cartão</>
                      ) : (
                        'Selecione como pagar'
                      )}
                    </button>

                    {/* Link MP */}
                    <a
                      href="https://www.mercadopago.com.br/seguranca"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
                    >
                      <ExternalLink size={10} />
                      Checkout seguro — Mercado Pago
                    </a>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-white/40">Selecione um plano para continuar.</p>
                  </div>
                )}
              </div>

              {/* Garantias */}
              <div className="border-t border-white/10 px-6 py-4 flex flex-col gap-2">
                {[
                  'Cancele a qualquer momento',
                  '7 dias de garantia — CDC art. 49',
                  'Dados protegidos — LGPD',
                ].map((g) => (
                  <div key={g} className="flex items-center gap-2 text-xs text-white/50">
                    <Check size={10} className="text-green-400 shrink-0" strokeWidth={3} />
                    {g}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
