import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Lock, KeyRound,
  CheckCircle2, AlertCircle, ShieldCheck, X,
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
  };
  /** Recebe os dados do perfil + a senha atual para confirmação; retorne true se ok */
  onSalvar?: (dados: FormProfile, senhaAtual: string) => Promise<boolean> | boolean;
  onVoltar?: () => void;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-3 border rounded-lg text-sm outline-none box-border ${hasError ? 'border-red-500' : 'border-gray-300'}`;

const inputDisabledCls =
  'w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed box-border outline-none';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
        className={`${inputCls(hasError)} pr-10`}
      />
      <button
        type="button"
        onClick={() => setMostrar((p) => !p)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0 flex items-center text-gray-400 z-10"
        tabIndex={-1}
      >
        {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-5 animate-[fadeSlideIn_0.25s_ease_forwards]">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 rounded-xl p-2.5">
              <ShieldCheck size={22} className="text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Confirmar alterações</h2>
              <p className="text-xs text-gray-500 mt-0.5">Digite sua senha atual para confirmar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="bg-transparent border-0 cursor-pointer text-gray-400 hover:text-gray-600 transition p-0 mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Erro vindo do servidor */}
        {erroExterno && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" />
            {erroExterno}
          </div>
        )}

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
          <Field label="Senha atual" error={errors.senhaAtual?.message}>
            <div className="relative">
              <input
                {...register('senhaAtual')}
                type={mostrar ? 'text' : 'password'}
                placeholder="Digite sua senha atual"
                maxLength={128}
                spellCheck={false}
                autoComplete="current-password"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                className={`${inputCls(!!errors.senhaAtual)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setMostrar((p) => !p)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0 flex items-center text-gray-400 z-10"
                tabIndex={-1}
              >
                {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-lg border-0 text-sm font-semibold text-white bg-brand transition-opacity ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
export function Profile({ dadosIniciais, onSalvar, onVoltar }: ProfileProps) {
  const [feedback, setFeedback]       = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const [pendingData, setPendingData] = useState<FormProfile | null>(null);
  const [erroModal, setErroModal]     = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormProfile>({
      resolver: zodResolver(schemaProfile),
      defaultValues: {
        nomeEmpresarial:   dadosIniciais?.nomeEmpresarial   ?? '',
        nomeFantasia:      dadosIniciais?.nomeFantasia      ?? '',
        inscricaoEstadual: dadosIniciais?.inscricaoEstadual ?? '',
        telefone:          dadosIniciais?.telefone          ?? '',
        email:             dadosIniciais?.email             ?? '',
        novaSenha:         '',
        confirmarSenha:    '',
      },
    });

  // Primeiro submit: guarda os dados e abre o modal
  const onSubmit = useCallback((data: FormProfile) => {
    setFeedback(null);
    setErroModal(null);
    setPendingData(data);
  }, []);

  // Segundo passo: confirma com senha atual
  const handleConfirmar = useCallback(async (senhaAtual: string) => {
    if (!pendingData) return;
    setErroModal(null);
    try {
      const ok = onSalvar ? await onSalvar(pendingData, senhaAtual) : true;
      if (ok) {
        setFeedback({ tipo: 'sucesso', mensagem: 'Dados atualizados com sucesso!' });
        reset({ ...pendingData, novaSenha: '', confirmarSenha: '' });
        setPendingData(null);
      } else {
        setErroModal('Senha incorreta. Verifique e tente novamente.');
      }
    } catch {
      setErroModal('Erro inesperado. Tente novamente.');
    }
  }, [pendingData, onSalvar, reset]);

  const handleCancelarModal = useCallback(() => {
    setPendingData(null);
    setErroModal(null);
  }, []);

  return (
    <>
      {/* Modal de confirmação */}
      {pendingData && (
        <ModalConfirmacao
          onConfirmar={handleConfirmar}
          onCancelar={handleCancelarModal}
          erroExterno={erroModal}
        />
      )}

      <div className="min-h-screen bg-gray-100 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">

          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="Cozinha da Nutri" className="h-14 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Gerencie os dados da sua conta</p>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
                feedback.tipo === 'sucesso'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              {feedback.tipo === 'sucesso'
                ? <CheckCircle2 size={16} className="shrink-0" />
                : <AlertCircle size={16} className="shrink-0" />
              }
              {feedback.mensagem}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

            {/* ── Seção: Dados Empresariais ── */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-brand inline-block" />
                Dados Empresariais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Field label="Inscrição Estadual" error={errors.inscricaoEstadual?.message}>
                <input
                  {...register('inscricaoEstadual')}
                  onChange={(e) => {
                    const v = e.target.value;
                    const normalizado = /^\d+$/.test(v) ? v.slice(0, 14) : v;
                    setValue('inscricaoEstadual', normalizado, { shouldValidate: true });
                  }}
                  placeholder='"Isento" ou número da IE (até 14 dígitos)'
                  maxLength={14}
                  inputMode="text"
                  required
                  className={inputCls(!!errors.inscricaoEstadual)}
                />
              </Field>
            </section>

            {/* ── Seção: Contato ── */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-brand inline-block" />
                Contato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Field label="E-mail" error={errors.email?.message}>
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

            {/* ── Seção: Dados imutáveis ── */}
            <section className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                <Lock size={13} />
                Dados imutáveis
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">CNPJ</label>
                <input value={dadosIniciais?.cnpj ?? ''} readOnly tabIndex={-1} className={inputDisabledCls} />
              </div>
            </section>

            {/* ── Seção: Alterar senha ── */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <KeyRound size={13} />
                Alterar senha
                <span className="font-normal text-gray-400">(deixe em branco para manter a atual)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nova Senha" error={errors.novaSenha?.message}>
                  <SenhaInput reg={register('novaSenha')} placeholder="Mín. 8 caracteres" hasError={!!errors.novaSenha} />
                </Field>
                <Field label="Confirmar Nova Senha" error={errors.confirmarSenha?.message}>
                  <SenhaInput reg={register('confirmarSenha')} placeholder="Repita a nova senha" hasError={!!errors.confirmarSenha} />
                </Field>
              </div>
            </section>

            {/* ── Ações ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="sm:w-32 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer"
                >
                  Voltar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold transition-opacity ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                Salvar alterações
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
