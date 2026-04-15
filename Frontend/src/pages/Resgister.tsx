import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UtensilsCrossed, Tags, ShieldCheck, Zap, Clock, PiggyBank, Sparkles } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

// ── Segurança ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_TAGS_RE = /<[^>]*>/g;
const INJECT_CHARS_RE = /['";\\<>(){}[\]`]/;

/** Remove caracteres de controle e tags HTML */
function sanitizeTexto(v: string): string {
  return v.replace(CONTROL_CHARS_RE, '').replace(HTML_TAGS_RE, '').trim();
}
/** Remove apenas bytes nulos de senhas */
function sanitizeSenha(v: string): string {
  // eslint-disable-next-line no-control-regex
  return v.replace(/\x00/g, '');
}

const schemaPJ = z
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
    cnpj: z.string().regex(/^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/i, 'CNPJ inválido (AA.AAA.AAA/AAAA-00)'),
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
    senha: z.string().min(8, 'Mínimo de 8 caracteres').max(128, 'Senha muito longa').transform(sanitizeSenha),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.senha === d.confirmarSenha, { message: 'As senhas não coincidem', path: ['confirmarSenha'] });

type FormPJ = z.infer<typeof schemaPJ>;

function maskCNPJ(v: string) {
  const raw = v.replace(/[^A-Za-z0-9]/g, '').slice(0, 14).toUpperCase();
  if (raw.length <= 2)  return raw;
  if (raw.length <= 5)  return `${raw.slice(0, 2)}.${raw.slice(2)}`;
  if (raw.length <= 8)  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
}
function maskTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

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

function SenhaInput({ reg, placeholder, hasError, required }: { reg: object; placeholder: string; hasError?: boolean; required?: boolean }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="relative">
      <input
        {...reg}
        type={mostrar ? 'text' : 'password'}
        placeholder={placeholder}
        maxLength={128}
        spellCheck={false}
        required={required}
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
const beneficios = [
  { icon: Sparkles, titulo: 'Simples de Usar', desc: 'Interface intuitiva — sem treinamentos. Comece a usar no primeiro acesso.' },
  { icon: Zap, titulo: 'Resultados em Segundos', desc: 'Cálculos nutricionais e rótulos gerados instantaneamente, sem espera.' },
  { icon: PiggyBank, titulo: 'Economize Tempo e Dinheiro', desc: 'Elimine planilhas manuais e reduza horas de trabalho com automação inteligente.' },
  { icon: UtensilsCrossed, titulo: 'Receitas com Cálculo Nutricional', desc: 'Monte receitas completas com dados validados da tabela TACO.' },
  { icon: Tags, titulo: 'Rótulos Prontos para ANVISA', desc: 'Gere rótulos nutricionais conforme a legislação vigente, com um clique.' },
  { icon: Clock, titulo: 'Disponível 24h por Dia', desc: 'Acesse de qualquer lugar e a qualquer hora, no computador ou celular.' },
  { icon: ShieldCheck, titulo: 'Dados Seguros', desc: 'Suas informações são protegidas com criptografia e nunca compartilhadas.' },
];

function PainelDireito() {
  return (
    <div className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center overflow-hidden select-none slide-bg-receitas">
      {/* Blobs decorativos de fundo — mesma identidade do carrossel de Login */}
      <div className="carousel-blob-bg-1" />
      <div className="carousel-blob-bg-2" />
      <div className="carousel-blob-bg-3" />

      <div className="relative z-10 flex flex-col items-center px-10 gap-6 w-full text-center overflow-y-auto py-8">
        <div className="fade-slide-in flex flex-col gap-4 w-full max-w-xs">
          {beneficios.map(({ icon: Icon, titulo, desc }) => (
            <div
              key={titulo}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-start gap-3 text-left border border-white/20"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            >
              <div className="bg-white/20 rounded-xl p-2 shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{titulo}</p>
                <p className="text-white/75 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

function FormPessoaJuridica({ onCadastrar, onVerTermos }: { onCadastrar: (data: FormPJ) => void; onVerTermos?: () => void }) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormPJ>({ resolver: zodResolver(schemaPJ) });

  const onSubmit = useCallback((data: FormPJ) => {
    if (!captchaToken || !aceitouTermos) return;
    onCadastrar(data);
    setCaptchaKey((k) => k + 1);
    setCaptchaToken(null);
  }, [captchaToken, aceitouTermos, onCadastrar]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label="Razão Social" error={errors.nomeEmpresarial?.message}>
        <input {...register('nomeEmpresarial')} placeholder="Empresa Ltda." maxLength={200} required className={inputCls(!!errors.nomeEmpresarial)} />
      </Field>
      <Field label="Nome Fantasia" error={errors.nomeFantasia?.message}>
        <input {...register('nomeFantasia')} placeholder="Cozinha da Nutri" maxLength={150} required className={inputCls(!!errors.nomeFantasia)} />
      </Field>
      <Field label="CNPJ" error={errors.cnpj?.message}>
        <input {...register('cnpj')} onChange={(e) => setValue('cnpj', maskCNPJ(e.target.value), { shouldValidate: true })} placeholder="AA.AAA.AAA/AAAA-00" maxLength={18} required className={inputCls(!!errors.cnpj)} />
      </Field>
      <Field label="Inscrição Estadual" error={errors.inscricaoEstadual?.message}>
        <input
          {...register('inscricaoEstadual')}
          onChange={(e) => {
            const v = e.target.value;
            // Se for apenas dígitos, limita a 14; caso contrário permite (ex.: "Isento")
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
      <Field label="Telefone" error={errors.telefone?.message}>
        <input {...register('telefone')} onChange={(e) => setValue('telefone', maskTelefone(e.target.value), { shouldValidate: true })} placeholder="(00) 00000-0000" maxLength={15} required className={inputCls(!!errors.telefone)} />
      </Field>
      <Field label="E-mail" error={errors.email?.message}>
        <input {...register('email')} type="email" inputMode="email" placeholder="contato@empresa.com" maxLength={254} required className={inputCls(!!errors.email)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Senha" error={errors.senha?.message}>
          <SenhaInput reg={register('senha')} placeholder="Mínimo 8 caracteres" hasError={!!errors.senha} required />
        </Field>
        <Field label="Confirmar Senha" error={errors.confirmarSenha?.message}>
          <SenhaInput reg={register('confirmarSenha')} placeholder="Repita a senha" hasError={!!errors.confirmarSenha} required />
        </Field>
      </div>
      <div className="flex items-start gap-2.5">
        <input
          id="aceitar-termos-pj"
          type="checkbox"
          checked={aceitouTermos}
          onChange={(e) => setAceitouTermos(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-teal-700 cursor-pointer"
        />
        <label htmlFor="aceitar-termos-pj" className="text-sm text-gray-600 cursor-pointer leading-snug">
          Li e aceito as{' '}
          <button
            type="button"
            onClick={onVerTermos}
            className="text-brand font-semibold underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            Políticas e Termos de Uso
          </button>
        </label>
      </div>
      <div className="flex justify-center">
        {RECAPTCHA_SITE_KEY ? (
          <ReCAPTCHA
            key={captchaKey}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={(token: string | null) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
          />
        ) : (
          <p className="text-xs text-red-500">VITE_RECAPTCHA_SITE_KEY não configurada.</p>
        )}
      </div>
      <button
        type="submit"
        disabled={!captchaToken || !aceitouTermos}
        className={`w-full bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold mt-1 transition-opacity ${!captchaToken || !aceitouTermos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        Cadastrar
      </button>
    </form>
  );
}

interface RegisterProps {
  onJaTemConta?: () => void;
  onCadastroSucesso?: (dados: FormPJ, tipo: 'pj') => void;
  onVerTermos?: () => void;
}

export function Register({ onJaTemConta, onCadastroSucesso, onVerTermos }: RegisterProps) {
  const handleCadastrar = (data: FormPJ) => {
    if (onCadastroSucesso) onCadastroSucesso(data, 'pj');
    else console.log('Cadastro PJ:', data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full flex flex-1">

        {/* LEFT — Formulário */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 overflow-y-auto py-8 px-4">
          <div className="w-full max-w-sm">

            <div className="text-center mb-6">
              <img src="/logo.svg" alt="Cozinha da Nutri" className="h-14 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Crie sua conta gratuitamente</p>

              <p className="text-center text-sm text-gray-500 mt-5">
                Já possui uma conta?{' '}
                <button type="button" onClick={onJaTemConta} className="bg-transparent border-0 cursor-pointer text-brand font-semibold text-sm p-0">
                  Clique aqui
                </button>
              </p>


            </div>

            <FormPessoaJuridica onCadastrar={handleCadastrar} onVerTermos={onVerTermos} />

           {/*  <p className="text-center text-sm text-gray-500 mt-5">
              Já possui uma conta?{' '}
              <button type="button" onClick={onJaTemConta} className="bg-transparent border-0 cursor-pointer text-brand font-semibold text-sm p-0">
                Clique aqui
              </button>
            </p> */}

          </div>
        </div>

        {/* RIGHT — Painel decorativo */}
        <PainelDireito />

      </div>
      <div className="h-px bg-white w-full" />
    </div>
  );
}

