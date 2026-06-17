import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle, Tag, FileText, MessageCircle, TrendingUp } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

// ── Segurança ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_TAGS_RE     = /<[^>]*>/g;
const INJECT_CHARS_RE  = /["\\<>`]/;

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS    = 30_000; // 30 segundos

/** Remove caracteres de controle e tags HTML de texto livre */
function sanitizeTexto(value: string): string {
  return value.replace(CONTROL_CHARS_RE, '').replace(HTML_TAGS_RE, '').trim();
}

/** Remove apenas bytes nulos de senhas (preserva todos os demais caracteres) */
function sanitizeSenha(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x00/g, '');
}

const schema = z.object({
  email: z
    .string()
    .min(1, 'E-mail obrigatório')
    .max(254, 'E-mail muito longo')
    .email('E-mail inválido')
    .refine((v) => !INJECT_CHARS_RE.test(v), 'E-mail contém caracteres inválidos')
    .transform((v) => sanitizeTexto(v).toLowerCase()),
  senha: z
    .string()
    .min(6, 'Senha deve ter ao menos 6 caracteres')
    .max(128, 'Senha muito longa')
    .transform(sanitizeSenha),
});

type FormLogin = z.infer<typeof schema>;

interface LoginProps {
  onEntrar?: (data: FormLogin) => Promise<boolean>;
  onCriarConta?: () => void;
  onEsqueciSenha?: () => void;
}

// ── Painel decorativo direito ─────────────────────────────────────────────────
const beneficios = [
  { icon: Tag, titulo: 'Sugestão de preço de venda', desc: 'Calcule automaticamente o valor ideal para seus produtos.' },
  { icon: FileText, titulo: 'Tabela nutricional ANVISA', desc: 'Gere rótulos precisos e totalmente dentro das normas.' },
  { icon: MessageCircle, titulo: 'Suporte por WhatsApp', desc: 'Tire suas dúvidas rapidamente de forma humanizada.' },
  { icon: TrendingUp, titulo: 'Relatório de custo e margem', desc: 'Acompanhe a lucratividade e o custo de produção de perto.' },
];

function PainelDireito() {
  return (
    <div className="relative hidden md:flex md:w-1/2 flex-col items-center justify-center overflow-hidden select-none slide-bg-receitas">
      {/* Blobs decorativos de fundo */}
      <div className="carousel-blob-bg-1" />
      <div className="carousel-blob-bg-2" />
      <div className="carousel-blob-bg-3" />

      <div className="relative z-10 flex flex-col items-center px-10 gap-6 w-full text-center overflow-y-auto py-8">
        <div className="fade-slide-in flex flex-col gap-4 w-full max-w-xs">

          <div className="mb-2 text-center w-full">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Bem-vindo(a) à</p>
            <h2 className="text-white text-2xl font-bold leading-snug">Cozinha da Nutri</h2>
          </div>

          {beneficios.map(({ icon: Icon, titulo, desc }) => (
            <div
              key={titulo}
              className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-start gap-3 text-left border border-white/20 transition-transform hover:-translate-y-0.5"
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

export function Login({ onEntrar, onCriarConta, onEsqueciSenha }: LoginProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(
    !RECAPTCHA_SITE_KEY ? 'dev' : null
  );
  const [captchaKey, setCaptchaKey] = useState(0);

  // Proteção contra brute force (client-side — a proteção real deve estar no backend)
  const [tentativas, setTentativas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  const estaBloqueado = bloqueadoAte !== null && Date.now() < bloqueadoAte;

  useEffect(() => {
    if (!bloqueadoAte) return;
    const tick = setInterval(() => {
      const restante = Math.ceil((bloqueadoAte - Date.now()) / 1000);
      if (restante <= 0) {
        setBloqueadoAte(null);
        setTentativas(0);
        setTempoRestante(0);
      } else {
        setTempoRestante(restante);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [bloqueadoAte]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormLogin>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormLogin) => {
    if (estaBloqueado || !captchaToken) return;
    setErroLogin(null);

    let sucesso = false;
    try {
      if (onEntrar) sucesso = await onEntrar(data);
    } finally {
      setCaptchaKey((k) => k + 1);
      setCaptchaToken(!RECAPTCHA_SITE_KEY ? 'dev' : null);
    }

    if (!sucesso) {
      setErroLogin('E-mail ou senha inválidos.');
      const proxTentativas = tentativas + 1;
      if (proxTentativas >= MAX_TENTATIVAS) {
        setTentativas(MAX_TENTATIVAS);
        setBloqueadoAte(Date.now() + BLOQUEIO_MS);
      } else {
        setTentativas(proxTentativas);
      }
    } else {
      setTentativas(0);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="w-full flex flex-1 min-h-0">

        {/* LEFT — Painel decorativo */}
        <PainelDireito />

        {/* RIGHT — Login card */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 overflow-y-auto">

          <div className="w-full max-w-xs">

            <div className="text-center mb-7">
              <img src="/logo.svg" alt="Cozinha da Nutri" className="h-16 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Acesse sua conta</p>


              <p className="text-center text-sm text-gray-500 mt-5">
              Não possui uma conta?{' '}
              <button type="button" onClick={onCriarConta} className="bg-transparent border-0 cursor-pointer text-brand font-semibold text-sm p-0">
                Crie gratuitamente
              </button>
            </p>


            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              {erroLogin && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-2">
                  <AlertCircle size={18} />
                  {erroLogin}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="seu@email.com"
                  maxLength={254}
                  className={`w-full px-3 py-3 border rounded-lg text-sm outline-none box-border ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <input
                    {...register('senha')}
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    maxLength={128}
                    spellCheck={false}
                    className={`w-full px-3 py-3 pr-10 border rounded-lg text-sm outline-none box-border ${errors.senha ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((p) => !p)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0 flex items-center text-gray-400 z-10"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
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

              {estaBloqueado && (
                <p className="text-red-500 text-xs text-center font-medium">
                  Muitas tentativas. Tente novamente em {tempoRestante}s.
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !captchaToken || estaBloqueado}
                className={`w-full bg-brand text-white py-3 px-6 rounded-lg border-0 text-base font-semibold mt-1 transition-opacity ${isSubmitting || !captchaToken || estaBloqueado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {estaBloqueado ? `Bloqueado (${tempoRestante}s)` : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-3">
              Esqueceu sua senha?{' '}
              <button type="button" onClick={onEsqueciSenha} className="bg-transparent border-0 cursor-pointer text-brand font-semibold text-sm p-0">
                Clique aqui
              </button>
            </p>

            

          </div>
        </div>
      </div>
      <div className="h-px bg-white w-full" />
    </div>
  );
}
