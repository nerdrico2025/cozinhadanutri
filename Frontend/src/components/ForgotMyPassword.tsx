import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

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

// ── Schemas ───────────────────────────────────────────────────────────────────
const schemaEmail = z.object({
  email: z
    .string()
    .min(1, 'E-mail obrigatório')
    .max(254, 'E-mail muito longo')
    .email('E-mail inválido')
    .refine((v) => !INJECT_CHARS_RE.test(v), 'E-mail contém caracteres inválidos')
    .transform((v) => sanitizeTexto(v).toLowerCase()),
});

const schemaCodigo = z.object({
  codigo: z
    .string()
    .min(6, 'Código deve ter 6 dígitos')
    .max(6, 'Código deve ter 6 dígitos')
    .regex(/^\d{6}$/, 'Informe apenas os 6 dígitos numéricos'),
});

const schemaSenha = z
  .object({
    novaSenha: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .max(128, 'Senha muito longa')
      .transform(sanitizeSenha),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

type FormEmail  = z.infer<typeof schemaEmail>;
type FormCodigo = z.infer<typeof schemaCodigo>;
type FormSenha  = z.infer<typeof schemaSenha>;
type Etapa = 'email' | 'codigo' | 'senha' | 'sucesso';

export interface ForgotMyPasswordProps {
  onVoltar?: () => void;
  /** Deve enviar o e-mail com o código; retorne true se ok, false se falhou */
  onEnviarEmail?: (email: string) => Promise<boolean> | boolean;
  /** Deve validar o código; retorne true se válido */
  onVerificarCodigo?: (email: string, codigo: string) => Promise<boolean> | boolean;
  /** Deve redefinir a senha; retorne true se ok */
  onRedefinirSenha?: (email: string, codigo: string, novaSenha: string) => Promise<boolean> | boolean;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-3 border rounded-lg text-sm outline-none box-border ${hasError ? 'border-red-500' : 'border-gray-300'}`;

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

// ── Painel decorativo direito ─────────────────────────────────────────────────
const passos = [
  {
    num: '1',
    titulo: 'Informe seu e-mail',
    desc: 'Digite o e-mail cadastrado na sua conta.',
    etapa: 'email' as Etapa,
  },
  {
    num: '2',
    titulo: 'Confirme o código',
    desc: 'Insira o código de 6 dígitos enviado para seu e-mail.',
    etapa: 'codigo' as Etapa,
  },
  {
    num: '3',
    titulo: 'Crie uma nova senha',
    desc: 'Escolha uma senha segura com no mínimo 8 caracteres.',
    etapa: 'senha' as Etapa,
  },
];

const ordemEtapas: Etapa[] = ['email', 'codigo', 'senha', 'sucesso'];

function PainelDireito({ etapa }: { etapa: Etapa }) {
  const idxAtual = ordemEtapas.indexOf(etapa);
  return (
    <div className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center overflow-hidden select-none slide-bg-anvisa">
      {/* Blobs decorativos de fundo — mesma identidade do carrossel de Login */}
      <div className="carousel-blob-bg-1" />
      <div className="carousel-blob-bg-2" />
      <div className="carousel-blob-bg-3" />

      <div className="relative z-10 flex flex-col items-center px-10 gap-8 w-full text-center">
        <p className="fade-slide-in text-white font-bold text-xl drop-shadow">Recuperação de Senha</p>
        <div className="fade-slide-in flex flex-col gap-4 w-full max-w-xs">
          {passos.map(({ num, titulo, desc, etapa: etapaPasso }) => {
            const idxPasso = ordemEtapas.indexOf(etapaPasso);
            const ativo     = idxPasso === idxAtual;
            const concluido = idxPasso < idxAtual;
            return (
              <div
                key={num}
                className={`rounded-2xl p-4 flex items-start gap-3 text-left transition-all border ${
                  ativo ? 'bg-white/25 backdrop-blur-sm border-white/30' : 'bg-white/10 border-white/10'
                }`}
                style={{ boxShadow: ativo ? '0 4px 20px rgba(0,0,0,0.15)' : undefined }}
              >
                <div
                  className={`rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                    ativo      ? 'bg-white text-brand' :
                    concluido  ? 'bg-green-400 text-white' :
                                 'bg-white/20 text-white'
                  }`}
                >
                  {concluido ? '✓' : num}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${ativo ? 'text-white' : 'text-white/70'}`}>{titulo}</p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${ativo ? 'text-white/80' : 'text-white/50'}`}>{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Formulários por etapa ─────────────────────────────────────────────────────
function EtapaEmail({
  onSubmit,
  onVoltar,
}: {
  onSubmit: (email: string) => Promise<void>;
  onVoltar?: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormEmail>({
    resolver: zodResolver(schemaEmail),
  });
  const submit = async (data: FormEmail) => { await onSubmit(data.email); };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-gray-500 mb-1">
        Informe o e-mail cadastrado na sua conta. Enviaremos um código de verificação.
      </p>
      <Field label="E-mail" error={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          maxLength={254}
          className={inputCls(!!errors.email)}
        />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold mt-1 transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isSubmitting ? 'Enviando...' : 'Enviar código'}
      </button>
      <button
        type="button"
        onClick={onVoltar}
        className="flex items-center justify-center gap-1 w-full bg-transparent border-0 cursor-pointer text-gray-500 text-sm p-0 mt-1 hover:text-brand transition-colors"
      >
        <ArrowLeft size={14} /> Voltar ao login
      </button>
    </form>
  );
}

function EtapaCodigo({
  email,
  onSubmit,
  onReenviar,
}: {
  email: string;
  onSubmit: (codigo: string) => Promise<void>;
  onReenviar: () => Promise<void>;
}) {
  const [reenviando, setReenviando] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormCodigo>({
    resolver: zodResolver(schemaCodigo),
  });
  const submit = async (data: FormCodigo) => { await onSubmit(data.codigo); };

  const handleReenviar = async () => {
    setReenviando(true);
    await onReenviar();
    setReenviando(false);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-gray-500 mb-1">
        Enviamos um código de 6 dígitos para <span className="font-semibold text-gray-700">{email}</span>.
        Verifique sua caixa de entrada.
      </p>
      <Field label="Código de verificação" error={errors.codigo?.message}>
        <input
          {...register('codigo')}
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          autoComplete="one-time-code"
          className={`${inputCls(!!errors.codigo)} text-center tracking-widest text-lg font-mono`}
        />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold mt-1 transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isSubmitting ? 'Verificando...' : 'Verificar código'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Não recebeu?{' '}
        <button
          type="button"
          onClick={handleReenviar}
          disabled={reenviando}
          className="bg-transparent border-0 cursor-pointer text-brand font-semibold text-sm p-0 disabled:opacity-50"
        >
          {reenviando ? 'Reenviando...' : 'Reenviar código'}
        </button>
      </p>
    </form>
  );
}

function EtapaSenha({ onSubmit }: { onSubmit: (novaSenha: string) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormSenha>({
    resolver: zodResolver(schemaSenha),
  });
  const submit = async (data: FormSenha) => { await onSubmit(data.novaSenha); };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-gray-500 mb-1">
        Escolha uma nova senha segura com no mínimo 8 caracteres.
      </p>
      <Field label="Nova senha" error={errors.novaSenha?.message}>
        <SenhaInput reg={register('novaSenha')} placeholder="Mínimo 8 caracteres" hasError={!!errors.novaSenha} />
      </Field>
      <Field label="Confirmar nova senha" error={errors.confirmarSenha?.message}>
        <SenhaInput reg={register('confirmarSenha')} placeholder="Repita a nova senha" hasError={!!errors.confirmarSenha} />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold mt-2 transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar nova senha'}
      </button>
    </form>
  );
}

function EtapaSucesso({ onVoltar }: { onVoltar?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <CheckCircle2 size={56} className="text-green-500" />
      <div>
        <h2 className="text-lg font-bold text-gray-800">Senha redefinida!</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sua senha foi alterada com sucesso. Faça login com a nova senha.
        </p>
      </div>
      <button
        type="button"
        onClick={onVoltar}
        className="w-full bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold cursor-pointer"
      >
        Ir para o login
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function ForgotMyPassword({
  onVoltar,
  onEnviarEmail,
  onVerificarCodigo,
  onRedefinirSenha,
}: ForgotMyPasswordProps) {
  const [etapa, setEtapa] = useState<Etapa>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleEnviarEmail = async (emailDigitado: string) => {
    setErro(null);
    const ok = onEnviarEmail ? await onEnviarEmail(emailDigitado) : true;
    if (ok) {
      setEmail(emailDigitado);
      setEtapa('codigo');
    } else {
      setErro('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.');
    }
  };

  const handleVerificarCodigo = async (codigoDigitado: string) => {
    setErro(null);
    const ok = onVerificarCodigo ? await onVerificarCodigo(email, codigoDigitado) : true;
    if (ok) {
      setCodigo(codigoDigitado);
      setEtapa('senha');
    } else {
      setErro('Código inválido ou expirado. Verifique e tente novamente.');
    }
  };

  const handleReenviar = async () => {
    setErro(null);
    const ok = onEnviarEmail ? await onEnviarEmail(email) : true;
    if (!ok) setErro('Não foi possível reenviar o código. Tente novamente.');
  };

  const handleRedefinirSenha = async (novaSenha: string) => {
    setErro(null);
    const ok = onRedefinirSenha ? await onRedefinirSenha(email, codigo, novaSenha) : true;
    if (ok) {
      setEtapa('sucesso');
    } else {
      setErro('Não foi possível redefinir a senha. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full flex flex-1">

        {/* LEFT — Formulário */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 py-8 px-4">
          <div className="w-full max-w-xs">

            <div className="text-center mb-7">
              <img src="/logo.svg" alt="Cozinha da Nutri" className="h-16 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {etapa === 'email'  && 'Esqueceu sua senha?'}
                {etapa === 'codigo' && 'Verifique seu e-mail'}
                {etapa === 'senha'  && 'Crie uma nova senha'}
                {etapa === 'sucesso' && 'Tudo certo!'}
              </p>
            </div>

            {erro && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-red-600 text-xs text-center">{erro}</p>
              </div>
            )}

            {etapa === 'email' && (
              <EtapaEmail onSubmit={handleEnviarEmail} onVoltar={onVoltar} />
            )}
            {etapa === 'codigo' && (
              <EtapaCodigo
                email={email}
                onSubmit={handleVerificarCodigo}
                onReenviar={handleReenviar}
              />
            )}
            {etapa === 'senha' && (
              <EtapaSenha onSubmit={handleRedefinirSenha} />
            )}
            {etapa === 'sucesso' && (
              <EtapaSucesso onVoltar={onVoltar} />
            )}

          </div>
        </div>

        {/* RIGHT — Painel decorativo */}
        <PainelDireito etapa={etapa} />

      </div>
      <div className="h-px bg-white w-full" />
    </div>
  );
}
