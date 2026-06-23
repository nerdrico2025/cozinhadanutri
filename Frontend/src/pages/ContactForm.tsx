import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Mail, MessageSquare, Paperclip, Send, User, X } from 'lucide-react';
import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  mensagem: z
    .string()
    .min(10, 'Mensagem deve ter ao menos 10 caracteres')
    .max(2000, 'Máximo de 2000 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  onCancelar: () => void;
}

const rawRecaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
const RECAPTCHA_SITE_KEY = (
  rawRecaptchaKey && 
  rawRecaptchaKey.trim() !== '' && 
  rawRecaptchaKey.trim() !== 'sua_chave_publica_do_recaptcha' && 
  !rawRecaptchaKey.includes('EXEMPLO') &&
  !rawRecaptchaKey.includes('YOUR_')
) ? rawRecaptchaKey.trim() : undefined;

export function ContactForm({ onCancelar }: ContactFormProps): JSX.Element {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoErro, setArquivoErro] = useState<string>('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(
    !RECAPTCHA_SITE_KEY ? 'dev' : null
  );
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string>('');
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mensagemValue = watch('mensagem', '');

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setArquivoErro('');
    if (!file) { setArquivo(null); return; }
    if (!file.type.startsWith('image/')) {
      setArquivoErro('Apenas imagens são permitidas (JPG, PNG, WEBP…).');
      setArquivo(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setArquivoErro('O arquivo deve ter no máximo 5 MB.');
      setArquivo(null);
      e.target.value = '';
      return;
    }
    setArquivo(file);
  };

  const removerArquivo = (e: React.MouseEvent) => {
    e.preventDefault();
    setArquivo(null);
    setArquivoErro('');
  };

  const onSubmit = async (data: FormData) => {
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setErroEnvio('Por favor, confirme que você não é um robô.');
      return;
    }
    setEnviando(true);
    setErroEnvio('');
    try {
      const formData = new FormData();
      formData.append('nome', data.nome);
      formData.append('email', data.email);
      formData.append('mensagem', data.mensagem);
      formData.append('recaptcha', recaptchaToken || '');
      if (arquivo) formData.append('foto', arquivo);

      // TODO: substituir pelo endpoint real
      // await api.post('/suporte/contato/', formData);
      await new Promise<void>((resolve) => setTimeout(resolve, 900));

      setSucesso(true);
      reset();
      setArquivo(null);
      recaptchaRef.current?.reset();
      setRecaptchaToken(!RECAPTCHA_SITE_KEY ? 'dev' : null);
    } catch {
      setErroEnvio('Erro ao enviar mensagem. Tente novamente mais tarde.');
      recaptchaRef.current?.reset();
      setRecaptchaToken(!RECAPTCHA_SITE_KEY ? 'dev' : null);
    } finally {
      setEnviando(false);
    }
  };

  /* ── Tela de sucesso ── */
  if (sucesso) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-full bg-[#04585a]/10">
              <CheckCircle size={34} className="text-[#04585a]" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mensagem enviada!</h2>
          <p className="text-sm text-gray-500 mb-7 leading-relaxed">
            Recebemos sua mensagem e responderemos em breve no e-mail informado. Fique de olho na sua caixa de entrada.
          </p>
          <button
            onClick={onCancelar}
            className="bg-[#04585a] hover:bg-[#04585a]/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
          >
            Voltar ao suporte
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulário ── */
  return (
    <div className="min-h-[80vh] bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao suporte
          </button>
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#04585a] bg-[#04585a]/10 px-4 py-1.5 rounded-full mb-3">
            Contato por e-mail
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Envie sua mensagem</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Preencha o formulário com sua dúvida ou solicitação. Nossa equipe responde em até{' '}
            <strong className="text-gray-700">48 horas úteis</strong>. Se necessário, anexe uma
            imagem para ilustrar melhor o seu problema.
          </p>
        </div>

        {/* Card do formulário */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 flex flex-col gap-5"
          noValidate
        >

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <User size={14} className="text-[#04585a]" />
              Nome completo
            </label>
            <input
              type="text"
              {...register('nome')}
              placeholder="Seu nome completo"
              autoComplete="name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04585a]/30 focus:border-[#04585a] transition"
            />
            {errors.nome && (
              <p className="text-xs text-red-500">{errors.nome.message}</p>
            )}
          </div>

          {/* E-mail */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Mail size={14} className="text-[#04585a]" />
              E-mail
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04585a]/30 focus:border-[#04585a] transition"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Mensagem */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-[#04585a]" />
              Mensagem
            </label>
            <textarea
              {...register('mensagem')}
              rows={5}
              placeholder="Descreva sua dúvida ou problema em detalhes…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#04585a]/30 focus:border-[#04585a] transition"
            />
            <div className="flex justify-between items-center">
              {errors.mensagem ? (
                <p className="text-xs text-red-500">{errors.mensagem.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {(mensagemValue ?? '').length}/2000
              </span>
            </div>
          </div>

          {/* Anexo de imagem */}
          {/* <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Paperclip size={14} className="text-[#04585a]" />
              Foto / Anexo{' '}
              <span className="font-normal text-gray-400">(opcional · máx. 5 MB)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer border border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-[#04585a]/50 transition group">
              <Paperclip size={16} className="text-gray-400 shrink-0 group-hover:text-[#04585a] transition" />
              <span className="text-sm text-gray-500 truncate flex-1">
                {arquivo ? arquivo.name : 'Clique para selecionar uma imagem'}
              </span>
              {arquivo && (
                <button
                  type="button"
                  onClick={removerArquivo}
                  aria-label="Remover arquivo"
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X size={15} />
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleArquivo}
              />
            </label>
            {arquivoErro && <p className="text-xs text-red-500">{arquivoErro}</p>}
            {arquivo && !arquivoErro && (
              <p className="text-xs text-gray-400">
                {(arquivo.size / 1024 / 1024).toFixed(2)} MB selecionado
              </p>
            )}
          </div> */}

          {/* reCAPTCHA */}
          {RECAPTCHA_SITE_KEY && (
            <div className="flex flex-col gap-1.5">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>
          )}

          {/* Erro de envio */}
          {erroEnvio && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
              {erroEnvio}
            </p>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <X size={15} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-[#04585a] hover:bg-[#04585a]/90 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {enviando ? (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {enviando ? 'Enviando…' : 'Enviar mensagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}