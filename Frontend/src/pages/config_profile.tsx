import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Lock, KeyRound,
  CheckCircle2, AlertCircle, ShieldCheck, X, Zap, Trash2, Building2, MapPin, Phone,
  Receipt, Calendar, CreditCard, Hash, Printer
} from 'lucide-react';

// ── Segurança ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_TAGS_RE     = /<[^>]*>/g;
const INJECT_CHARS_RE  = /['";\\<>(){}[\]`]/;

function sanitizeTexto(v: string): string {
  return v.replace(CONTROL_CHARS_RE, '').replace(HTML_TAGS_RE, '').trim();
}
function sanitizeSenha(v: string): string {
  // eslint-disable-next-line no-control-regex
  return v.replace(/\x00/g, '');
}

function maskTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

// ── Schemas ───────────────────────────────────────────────────────────────────
const schemaProfile = z
  .object({
    nomeEmpresarial: z
      .string()
      .min(3, 'Razão social é obrigatória')
      .max(200, 'Nome muito longo')
      .refine((v) => !INJECT_CHARS_RE.test(v), 'Nome contém caracteres inválidos')
      .transform(sanitizeTexto),
    nomeFantasia: z
      .string()
      .min(2, 'Nome fantasia é obrigatório')
      .max(150, 'Nome muito longo')
      .refine((v) => !INJECT_CHARS_RE.test(v), 'Nome contém caracteres inválidos')
      .transform(sanitizeTexto),
    inscricaoEstadual: z
      .string()
      .min(1, 'Campo obrigatório')
      .refine(
        (v) => /^isento$/i.test(v.trim()) || /^\d{1,14}$/.test(v.trim()),
        'Informe "Isento" ou o número da IE (até 14 dígitos)'
      )
      .transform((v) => sanitizeTexto(v).toLowerCase()),
    telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido'),
    email: z
      .string()
      .min(1, 'E-mail obrigatório')
      .max(254, 'E-mail muito longo')
      .email('E-mail inválido')
      .refine((v) => !INJECT_CHARS_RE.test(v), 'E-mail contém caracteres inválidos')
      .transform((v) => sanitizeTexto(v).toLowerCase()),
    cep: z.string().max(9, 'CEP muito longo').transform(sanitizeTexto).optional(),
    logradouro: z.string().max(255, 'Logradouro muito longo').transform(sanitizeTexto).optional(),
    numero: z.string().max(20, 'Número muito longo').transform(sanitizeTexto).optional(),
    complemento: z.string().max(150, 'Complemento muito longo').transform(sanitizeTexto).optional(),
    bairro: z.string().max(150, 'Bairro muito longo').transform(sanitizeTexto).optional(),
    municipio: z.string().max(150, 'Município muito longo').transform(sanitizeTexto).optional(),
    uf: z.string().max(2, 'UF muito longa').transform(sanitizeTexto).optional(),
    novaSenha: z.string().max(128, 'Senha muito longa').transform(sanitizeSenha),
    confirmarSenha: z.string(),
  })
  .refine(
    (d) => d.novaSenha.length === 0 || d.novaSenha.length >= 8,
    { message: 'Mínimo de 8 caracteres', path: ['novaSenha'] },
  )
  .refine(
    (d) => d.novaSenha.length === 0 || d.novaSenha === d.confirmarSenha,
    { message: 'As senhas não coincidem', path: ['confirmarSenha'] },
  );

const schemaConfirmacao = z.object({
  senhaAtual: z.string().min(1, 'Informe sua senha atual').transform(sanitizeSenha),
});

type FormProfile     = z.infer<typeof schemaProfile>;
type FormConfirmacao = z.infer<typeof schemaConfirmacao>;

// ── Props ─────────────────────────────────────────────────────────────────────
export interface ProfileProps {
  dadosIniciais?: {
    nomeEmpresarial: string;
    nomeFantasia: string;
    cnpj: string;
    inscricaoEstadual: string;
    telefone: string;
    email: string;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
  };
  onSalvar?: (dados: FormProfile, senhaAtual: string) => Promise<boolean> | boolean;
  onVoltar?: () => void;
  onUpgrade?: () => void;
  onApagarConta?: (senhaAtual: string) => Promise<boolean> | boolean;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm outline-none transition-all duration-200 ` +
  `focus:bg-white focus:ring-2 focus:ring-brand/20 ` +
  `${hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-brand hover:border-gray-300'}`;

const inputDisabledCls =
  'w-full px-4 py-3 border border-gray-200/60 rounded-xl text-sm bg-gray-100/50 text-gray-500 cursor-not-allowed outline-none';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{error}</p>}
    </div>
  );
}

function SenhaInput({ reg, placeholder, hasError }: { reg: object; placeholder: string; hasError?: boolean }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="relative">
      <input
        {...reg}
        type={mostrar ? 'text' : 'password'}
        placeholder={placeholder}
        maxLength={128}
        spellCheck={false}
        autoComplete="new-password"
        className={`${inputCls(hasError)} pr-12`}
      />
      <button
        type="button"
        onClick={() => setMostrar((p) => !p)}
        className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 cursor-pointer p-1.5 rounded-lg flex items-center text-gray-500 hover:text-brand hover:border-brand/30 transition-all z-10"
        tabIndex={-1}
      >
        {mostrar ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

// ── Modal de confirmação por senha ────────────────────────────────────────────
function ModalConfirmacao({
  onConfirmar,
  onCancelar,
  erroExterno,
}: {
  onConfirmar: (senhaAtual: string) => Promise<void>;
  onCancelar: () => void;
  erroExterno?: string | null;
}) {
  const [mostrar, setMostrar] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormConfirmacao>({ resolver: zodResolver(schemaConfirmacao) });

  const submit = async (data: FormConfirmacao) => {
    await onConfirmar(data.senhaAtual);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md transition-opacity"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 w-full max-w-sm mx-4 p-8 flex flex-col gap-6 animate-[fadeSlideIn_0.2s_ease-out_forwards]">

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 rounded-2xl p-3">
              <ShieldCheck size={24} className="text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Confirmar ação</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Digite sua senha para prosseguir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="bg-gray-100 hover:bg-gray-200 border-0 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-full mt-1"
          >
            <X size={16} />
          </button>
        </div>

        {erroExterno && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600">
            <AlertCircle size={16} className="shrink-0" />
            {erroExterno}
          </div>
        )}

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5" noValidate>
          <Field label="Senha atual" error={errors.senhaAtual?.message}>
            <div className="relative">
              <input
                {...register('senhaAtual')}
                type={mostrar ? 'text' : 'password'}
                placeholder="Sua senha atual"
                maxLength={128}
                spellCheck={false}
                autoComplete="current-password"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className={`${inputCls(!!errors.senhaAtual)} pr-12`}
              />
              <button
                type="button"
                onClick={() => setMostrar((p) => !p)}
                className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-gray-200 cursor-pointer p-1.5 rounded-lg flex items-center text-gray-500 hover:text-brand hover:border-brand/30 transition-all z-10"
                tabIndex={-1}
              >
                {mostrar ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all cursor-pointer active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl border-0 text-sm font-bold text-white bg-brand shadow-lg shadow-brand/30 hover:shadow-brand/50 transition-all active:scale-95 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting ? 'Verificando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Profile({ dadosIniciais, onSalvar, onVoltar, onUpgrade, onApagarConta }: ProfileProps) {
  const [feedback, setFeedback]       = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const [pendingData, setPendingData] = useState<FormProfile | null>(null);
  const [acaoPendente, setAcaoPendente] = useState<'salvar' | 'apagar' | null>(null);
  const [erroModal, setErroModal]     = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<'geral' | 'endereco' | 'seguranca' | 'pagamentos'>('geral');

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormProfile>({
      resolver: zodResolver(schemaProfile),
      defaultValues: {
        nomeEmpresarial:   dadosIniciais?.nomeEmpresarial   ?? '',
        nomeFantasia:      dadosIniciais?.nomeFantasia      ?? '',
        inscricaoEstadual: dadosIniciais?.inscricaoEstadual ?? '',
        telefone:          dadosIniciais?.telefone          ?? '',
        email:             dadosIniciais?.email             ?? '',
        cep:               dadosIniciais?.cep               ?? '',
        logradouro:        dadosIniciais?.logradouro        ?? '',
        numero:            dadosIniciais?.numero            ?? '',
        complemento:       dadosIniciais?.complemento       ?? '',
        bairro:            dadosIniciais?.bairro            ?? '',
        municipio:         dadosIniciais?.municipio         ?? '',
        uf:                dadosIniciais?.uf                ?? '',
        novaSenha:         '',
        confirmarSenha:    '',
      },
    });

  useEffect(() => {
    if (dadosIniciais) {
      reset({
        nomeEmpresarial:   dadosIniciais.nomeEmpresarial   ?? '',
        nomeFantasia:      dadosIniciais.nomeFantasia      ?? '',
        inscricaoEstadual: dadosIniciais.inscricaoEstadual ?? '',
        telefone:          dadosIniciais.telefone          ?? '',
        email:             dadosIniciais.email             ?? '',
        cep:               dadosIniciais.cep               ?? '',
        logradouro:        dadosIniciais.logradouro        ?? '',
        numero:            dadosIniciais.numero            ?? '',
        complemento:       dadosIniciais.complemento       ?? '',
        bairro:            dadosIniciais.bairro            ?? '',
        municipio:         dadosIniciais.municipio         ?? '',
        uf:                dadosIniciais.uf                ?? '',
        novaSenha:         '',
        confirmarSenha:    '',
      });
    }
  }, [dadosIniciais, reset]);

  const onSubmit = useCallback((data: FormProfile) => {
    setFeedback(null);
    setErroModal(null);
    setPendingData(data);
    setAcaoPendente('salvar');
  }, []);

  const handleApagarRequest = useCallback(() => {
    setFeedback(null);
    setErroModal(null);
    setAcaoPendente('apagar');
  }, []);

  const handleConfirmar = useCallback(async (senhaAtual: string) => {
    setErroModal(null);
    try {
      if (acaoPendente === 'salvar' && pendingData) {
        const ok = onSalvar ? await onSalvar(pendingData, senhaAtual) : true;
        if (ok) {
          setFeedback({ tipo: 'sucesso', mensagem: 'Dados atualizados com sucesso!' });
          reset({ ...pendingData, novaSenha: '', confirmarSenha: '' });
          setPendingData(null);
          setAcaoPendente(null);
        } else {
          setErroModal('Senha incorreta. Verifique e tente novamente.');
        }
      } else if (acaoPendente === 'apagar') {
        const ok = onApagarConta ? await onApagarConta(senhaAtual) : true;
        if (ok) {
          setAcaoPendente(null);
        } else {
          setErroModal('Senha incorreta. Verifique e tente novamente.');
        }
      }
    } catch {
      setErroModal('Erro inesperado. Tente novamente.');
    }
  }, [acaoPendente, pendingData, onSalvar, onApagarConta, reset]);

  const handleCancelarModal = useCallback(() => {
    setPendingData(null);
    setAcaoPendente(null);
    setErroModal(null);
  }, []);

  return (
    <>
      {acaoPendente && (
        <ModalConfirmacao
          onConfirmar={handleConfirmar}
          onCancelar={handleCancelarModal}
          erroExterno={erroModal}
        />
      )}

      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-gray-100 to-gray-200 flex items-start justify-center py-12 px-4 relative overflow-hidden">
        
        {/* Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-3xl relative z-10">

          {/* Cabeçalho */}
          <div className="text-center mb-10 fade-slide-in">
            <img src="/logo.svg" alt="Cozinha da Nutri" className="h-16 mx-auto mb-4 drop-shadow-sm" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Meu Perfil</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Gerencie os dados e configurações da sua conta</p>
          </div>

          {/* Abas */}
          <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-2xl mb-8 shadow-inner border border-white/40 fade-slide-in">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'geral' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Geral
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('endereco')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'endereco' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Endereço
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seguranca')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'seguranca' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Segurança
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pagamentos')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'pagamentos' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              Pagamentos
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="fade-slide-in mb-8">
              <div
                className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium border shadow-sm ${
                  feedback.tipo === 'sucesso'
                    ? 'bg-green-50/80 backdrop-blur-md border-green-200 text-green-700'
                    : 'bg-red-50/80 backdrop-blur-md border-red-200 text-red-600'
                }`}
              >
                {feedback.tipo === 'sucesso'
                  ? <CheckCircle2 size={20} className="shrink-0" />
                  : <AlertCircle size={20} className="shrink-0" />
                }
                {feedback.mensagem}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 md:gap-8 fade-slide-in" style={{ animationDelay: '0.1s' }} noValidate>

            {/* CONTEÚDO: GERAL */}
            {activeTab === 'geral' && (
              <div className="flex flex-col gap-6 md:gap-8 animate-[fadeSlideIn_0.2s_ease-out_forwards]">
                {/* ── Seção: Dados Empresariais ── */}
                <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="border-b border-gray-100 pb-4 mb-2">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-brand/10 rounded-xl text-brand">
                    <Building2 size={18} />
                  </div>
                  Dados Empresariais
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Razão Social" error={errors.nomeEmpresarial?.message}>
                  <input
                    {...register('nomeEmpresarial')}
                    placeholder="Empresa Ltda."
                    maxLength={200}
                    required
                    className={inputCls(!!errors.nomeEmpresarial)}
                  />
                </Field>
                <Field label="Nome Fantasia" error={errors.nomeFantasia?.message}>
                  <input
                    {...register('nomeFantasia')}
                    placeholder="Cozinha da Nutri"
                    maxLength={150}
                    required
                    className={inputCls(!!errors.nomeFantasia)}
                  />
                </Field>
              </div>
              <div className="w-full sm:w-1/2 sm:pr-2.5">
                <Field label="Inscrição Estadual" error={errors.inscricaoEstadual?.message}>
                  <input
                    {...register('inscricaoEstadual')}
                    onChange={(e) => {
                      const v = e.target.value;
                      const normalizado = /^\d+$/.test(v) ? v.slice(0, 14) : v;
                      setValue('inscricaoEstadual', normalizado, { shouldValidate: true });
                    }}
                    placeholder='"Isento" ou número da IE'
                    maxLength={14}
                    inputMode="text"
                    required
                    className={inputCls(!!errors.inscricaoEstadual)}
                  />
                </Field>
              </div>
            </section>

            {/* ── Seção: Contato ── */}
            <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="border-b border-gray-100 pb-4 mb-2">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                    <Phone size={18} />
                  </div>
                  Contato
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Telefone" error={errors.telefone?.message}>
                  <input
                    {...register('telefone')}
                    onChange={(e) => setValue('telefone', maskTelefone(e.target.value), { shouldValidate: true })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    required
                    className={inputCls(!!errors.telefone)}
                  />
                </Field>
                <Field label="E-mail principal" error={errors.email?.message}>
                  <input
                    {...register('email')}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="contato@empresa.com"
                    maxLength={254}
                    required
                    className={inputCls(!!errors.email)}
                  />
                </Field>
              </div>
            </section>

            {/* ── Seção: Upgrade de plano ── */}
            {onUpgrade && (
              <section className="relative overflow-hidden bg-gradient-to-br from-brand via-teal-600 to-blue-600 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg shadow-brand/20">
                <div className="absolute inset-0 bg-white opacity-5 mix-blend-overlay"></div>
                <div className="relative z-10 flex items-center gap-5">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3.5 text-white shadow-inner">
                    <Zap size={28} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Plano Atual: Grátis</h3>
                    <p className="text-sm text-white/90 font-medium">Faça upgrade para desbloquear rótulos ilimitados e suporte VIP.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="relative z-10 w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-brand text-sm font-bold px-6 py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:bg-gray-50 hover:scale-105 transition-all active:scale-95 cursor-pointer"
                >
                  <Zap size={16} className="text-brand" />
                  Fazer Upgrade Agora
                </button>
              </section>
            )}
              </div>
            )}

            {/* CONTEÚDO: ENDEREÇO */}
            {activeTab === 'endereco' && (
              <div className="animate-[fadeSlideIn_0.2s_ease-out_forwards]">
                {/* ── Seção: Endereço ── */}
                <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="border-b border-gray-100 pb-4 mb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                      <MapPin size={18} />
                    </div>
                    Endereço Completo
                  </h3>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Opcional</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-[44px]">Essencial para futuras emissões de Notas Fiscais (NF-e/ISS).</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                <div className="sm:col-span-4">
                  <Field label="CEP" error={errors.cep?.message}>
                    <input {...register('cep')} placeholder="00000-000" maxLength={9} className={inputCls(!!errors.cep)} />
                  </Field>
                </div>
                <div className="sm:col-span-8">
                  <Field label="Logradouro" error={errors.logradouro?.message}>
                    <input {...register('logradouro')} placeholder="Rua, Avenida, etc." maxLength={255} className={inputCls(!!errors.logradouro)} />
                  </Field>
                </div>
                
                <div className="sm:col-span-4">
                  <Field label="Número" error={errors.numero?.message}>
                    <input {...register('numero')} placeholder="123" maxLength={20} className={inputCls(!!errors.numero)} />
                  </Field>
                </div>
                <div className="sm:col-span-8">
                  <Field label="Complemento" error={errors.complemento?.message}>
                    <input {...register('complemento')} placeholder="Sala, Apto, Galpão" maxLength={150} className={inputCls(!!errors.complemento)} />
                  </Field>
                </div>
                
                <div className="sm:col-span-5">
                  <Field label="Bairro" error={errors.bairro?.message}>
                    <input {...register('bairro')} placeholder="Centro" maxLength={150} className={inputCls(!!errors.bairro)} />
                  </Field>
                </div>
                <div className="sm:col-span-5">
                  <Field label="Município" error={errors.municipio?.message}>
                    <input {...register('municipio')} placeholder="São Paulo" maxLength={150} className={inputCls(!!errors.municipio)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="UF" error={errors.uf?.message}>
                    <input {...register('uf')} placeholder="SP" maxLength={2} className={inputCls(!!errors.uf)} />
                  </Field>
                </div>
              </div>
            </section>
              </div>
            )}

            {/* CONTEÚDO: PAGAMENTOS */}
            {activeTab === 'pagamentos' && (
              <div className="flex flex-col gap-6 md:gap-8 animate-[fadeSlideIn_0.2s_ease-out_forwards]">
                <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                  <div className="border-b border-gray-100 pb-4 mb-2 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                        <Receipt size={18} />
                      </div>
                      Histórico de Pagamentos
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4">
                    {[
                      {
                        id: 'REC-12345678-MP',
                        data: '15/05/2026',
                        plano: 'Plano Profissional (Anual)',
                        valor: 'R$ 290,00',
                        metodo: 'PIX',
                        status: 'Concluído'
                      },
                      {
                        id: 'REC-87654321-CC',
                        data: '15/05/2025',
                        plano: 'Plano Básico (Mensal)',
                        valor: 'R$ 29,90',
                        metodo: 'Cartão de Crédito',
                        status: 'Concluído'
                      }
                    ].map((pgto, idx) => (
                      <div key={idx} className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white hover:shadow-md hover:border-gray-200">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                              <CheckCircle2 size={12} />
                              {pgto.status}
                            </span>
                            <span className="text-sm font-mono text-gray-500 flex items-center gap-1">
                              <Hash size={14} />
                              {pgto.id}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="font-semibold">{pgto.data}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle2 size={16} className="text-gray-400" />
                              <span className="font-medium">{pgto.plano}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CreditCard size={16} className="text-gray-400" />
                              <span className="font-medium">{pgto.metodo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 border-gray-200 pt-4 md:pt-0">
                          <div className="text-lg font-extrabold text-gray-900">{pgto.valor}</div>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-50 hover:text-brand transition-all cursor-pointer active:scale-95"
                          >
                            <Printer size={16} />
                            Recibo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* CONTEÚDO: SEGURANÇA */}
            {activeTab === 'seguranca' && (
              <div className="flex flex-col gap-6 md:gap-8 animate-[fadeSlideIn_0.2s_ease-out_forwards]">
                {/* ── Seção: Dados imutáveis e Senha ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              
              <section className="bg-gray-100/50 backdrop-blur-md rounded-3xl border border-gray-200/50 p-6 flex flex-col gap-6">
                <div className="border-b border-gray-200/60 pb-4 mb-1">
                  <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2.5">
                    <div className="p-1.5 bg-gray-200/80 rounded-lg text-gray-600">
                      <Lock size={16} />
                    </div>
                    Dados Protegidos
                  </h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">CNPJ Oficial</label>
                  <input value={dadosIniciais?.cnpj ?? ''} readOnly tabIndex={-1} className={inputDisabledCls} />
                  <p className="text-xs text-gray-400 mt-2 ml-1">O CNPJ não pode ser alterado após o cadastro.</p>
                </div>
              </section>

              <section className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col gap-5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="border-b border-gray-100 pb-4 mb-1">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2.5">
                    <div className="p-1.5 bg-brand/10 rounded-lg text-brand">
                      <KeyRound size={16} />
                    </div>
                    Alterar Senha
                  </h3>
                </div>
                <div className="flex flex-col gap-4">
                  <Field label="Nova Senha" error={errors.novaSenha?.message}>
                    <SenhaInput reg={register('novaSenha')} placeholder="Mín. 8 caracteres" hasError={!!errors.novaSenha} />
                  </Field>
                  <Field label="Confirmar Nova Senha" error={errors.confirmarSenha?.message}>
                    <SenhaInput reg={register('confirmarSenha')} placeholder="Repita a nova senha" hasError={!!errors.confirmarSenha} />
                  </Field>
                </div>
                <p className="text-xs text-gray-400 mt-1">Deixe em branco para manter a senha atual.</p>
              </section>

            </div>

            {/* ── Zona de Perigo ── */}
            {onApagarConta && (
              <section className="bg-red-50/60 backdrop-blur-md rounded-3xl border border-red-100 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all hover:bg-red-50">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100/80 rounded-2xl p-3 shrink-0 text-red-600">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-900">Zona de Perigo</h3>
                    <p className="text-sm text-red-700/80 mt-1 max-w-md leading-relaxed font-medium">
                      Apagar sua conta é uma ação <b>irreversível</b>. Todos os seus dados, receitas e rótulos serão excluídos permanentemente.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApagarRequest}
                  className="w-full sm:w-auto shrink-0 bg-red-600 text-white hover:bg-red-700 py-3.5 px-6 rounded-xl border-0 text-sm font-bold shadow-md shadow-red-600/20 hover:shadow-red-600/40 transition-all cursor-pointer active:scale-95"
                >
                  Apagar Conta
                </button>
              </section>
            )}
              </div>
            )}

            {/* ── Ações Principais (Sempre visíveis no final) ── */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-gray-200/50">
              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="sm:w-36 py-3.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer active:scale-95"
                >
                  Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 bg-brand text-white py-3.5 px-6 rounded-xl border-0 text-base font-bold shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:-translate-y-0.5 transition-all active:scale-95 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : 'cursor-pointer'
                }`}
              >
                {isSubmitting ? 'Verificando...' : 'Salvar Alterações'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
