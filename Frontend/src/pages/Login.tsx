import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface SlideImage {
  src: string;
  alt: string;
  style: React.CSSProperties;
}

interface Slide {
  key: string;
  bgClass: string;
  images: SlideImage[];
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    key: 'receitas',
    bgClass: 'slide-bg-receitas',
    images: [
      { src: '/login_img1.svg', alt: 'Receita principal', style: { width: 340, height: 340, borderRadius: '20px', transform: 'translate(-16px, 32px) rotate(-12deg)', zIndex: 1 } },
      { src: '/login_img2.svg', alt: 'Rótulo',            style: { width: 230, height: 230, borderRadius: '20px', transform: 'translate(140px, -130px) rotate(10deg)', zIndex: 2 } },
      { src: '/login_img3.svg', alt: 'Anvisa',            style: { width: 185, height: 185, borderRadius: '20px', transform: 'translate(-138px, -125px) rotate(6deg)', zIndex: 3 } },
    ],
    title: 'Crie Receitas Incríveis',
    description: 'Monte e gerencie receitas com cálculo nutricional automático baseado na tabela TACO.',
  },
  {
    key: 'rotulo',
    bgClass: 'slide-bg-rotulo',
    images: [
      { src: '/login_img4.svg', alt: 'Rótulo principal',  style: { width: 340, height: 340, borderRadius: '20px', transform: 'translate(16px, 28px) rotate(8deg)',    zIndex: 1 } },
      { src: '/login_img5.svg', alt: 'Receita',           style: { width: 220, height: 220, borderRadius: '20px', transform: 'translate(-148px, -125px) rotate(-14deg)', zIndex: 2 } },
      { src: '/login_img7.svg', alt: 'Anvisa',            style: { width: 192, height: 192, borderRadius: '20px', transform: 'translate(138px, -138px) rotate(-8deg)', zIndex: 3 } },
    ],
    title: 'Rótulo Nutricional',
    description: 'Gere rótulos nutricionais completos em conformidade com as normas da ANVISA.',
  },
  {
    key: 'anvisa',
    bgClass: 'slide-bg-anvisa',
    images: [
      { src: '/login_img8.svg', alt: 'Anvisa principal',  style: { width: 340, height: 340, borderRadius: '20px', transform: 'translate(0px, 26px) rotate(-6deg)', zIndex: 1 } },
    ],
    title: 'Conformidade ANVISA',
    description: 'Todos os dados seguem os padrões exigidos pela Agência Nacional de Vigilância Sanitária.',
  },
  {
    key: 'precificacao',
    bgClass: 'slide-bg-precificacao',
    images: [
      { src: '/login_img9.svg',  alt: 'Precificação principal', style: { width: 340, height: 340, borderRadius: '20px', transform: 'translate(-12px, 30px) rotate(-8deg)',  zIndex: 1 } },
      { src: '/login_img10.svg', alt: 'Custo',                  style: { width: 220, height: 220, borderRadius: '20px', transform: 'translate(140px, -132px) rotate(12deg)', zIndex: 2 } },
      { src: '/login_img11.svg', alt: 'Lucro',                  style: { width: 192, height: 192, borderRadius: '20px', transform: 'translate(-135px, -130px) rotate(-9deg)', zIndex: 3 } },
    ],
    title: 'Precificação Inteligente',
    description: 'Calcule automaticamente o custo de produção e defina preços com margem de lucro ideal para o seu negócio.',
  },
];

function Carousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  const resetTimer = useCallback((fn: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    fn();
    timerRef.current = setInterval(next, 4000);
  }, [next]);

  useEffect(() => {
    timerRef.current = setInterval(next, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next]);

  const slide = slides[current];

  return (
    <div className={`relative flex flex-col items-center justify-center h-full w-full overflow-hidden select-none transition-all duration-500 ${slide.bgClass}`}>
      {/* Blobs decorativos de fundo */}
      <div className="carousel-blob-bg-1" />
      <div className="carousel-blob-bg-2" />
      <div className="carousel-blob-bg-3" />

      {/* Conteúdo principal */}
      <div key={slide.key} className="fade-slide-in relative z-10 flex flex-col items-center justify-center gap-7 px-10">
        {/* Blob arredondado com trio de imagens desalinhadas */}
        <div className="carousel-blob-main" style={{ position: 'relative', overflow: 'visible' }}>
          {slide.images.map((img) => (
            <div
              key={img.src}
              style={{
                position: 'absolute',
                overflow: 'hidden',
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.25))',
                ...img.style,
              }}
            >
              <img
                src={img.src}
                alt={img.alt}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="text-center px-6 py-4 rounded-2xl" style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)' }}>
          <h2 className="text-white text-3xl font-extrabold mb-2 drop-shadow-lg tracking-tight">{slide.title}</h2>
          <p className="text-white text-base font-medium leading-relaxed drop-shadow">{slide.description}</p>
        </div>
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => resetTimer(prev)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/35 text-white rounded-full p-1.5 border-0 cursor-pointer transition-colors z-20"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => resetTimer(next)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/35 text-white rounded-full p-1.5 border-0 cursor-pointer transition-colors z-20"
        aria-label="Próximo slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 flex gap-2 z-20">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => resetTimer(() => setCurrent(i))}
            className={`border-0 cursor-pointer p-0 rounded-full transition-all h-2 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/45'}`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

export function Login({ onEntrar, onCriarConta, onEsqueciSenha }: LoginProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  // Proteção contra brute force (client-side — a proteção real deve estar no backend)
  const [tentativas, setTentativas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);

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

    let sucesso = false;
    try {
      if (onEntrar) sucesso = await onEntrar(data);
    } finally {
      setCaptchaKey((k) => k + 1);
      setCaptchaToken(null);
    }

    if (!sucesso) {
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

        {/* LEFT — Carousel */}
        <div className="hidden md:flex md:w-1/2">
          <Carousel />
        </div>

        {/* RIGHT — Login card */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-gray-100 overflow-y-auto">

          <div className="w-full max-w-xs">

            <div className="text-center mb-7">
              <img src="/logo.svg" alt="Cozinha da Nutri" className="h-16 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Acesse sua conta</p>


              <p className="text-center text-sm text-gray-500 mt-5">
              Não possui uma conta?{' '}
              <button type="button" onClick={onCriarConta} className="bg-transparent border-0 cursor-pointer text-brand font-semibold text-sm p-0">
                Clique aqui
              </button>
            </p>


            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
