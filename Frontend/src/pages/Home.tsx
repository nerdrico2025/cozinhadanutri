import { BookOpen, Calculator, FlaskConical, FileText, ChevronLeft, ChevronRight, Sparkles, Table, DollarSign, BarChart3, Video } from "lucide-react";
import { useState, useEffect } from "react";

type Funcionalidade = {
  titulo: string;
  descricao: string;
  Icon: React.ElementType;
  imagemUrl: string;
  imageAlt: string;
};

const funcionalidades: Funcionalidade[] = [
  {
    titulo: "Gestão de Receitas",
    descricao:
      "Crie e gerencie receitas completas com ingredientes, quantidades e informações de custo.",
    Icon: BookOpen,
    imagemUrl:
      "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=600&q=75",
    imageAlt: "Ingredientes e receitas",
  },
  {
    titulo: "Precificação Automática",
    descricao:
      "Calcule o custo real por porção e obtenha sugestões de preço com margem de lucro configurável.",
    Icon: Calculator,
    imagemUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=75",
    imageAlt: "Calculadora e finanças",
  },
  {
    titulo: "Dados Nutricionais TACO e IBGE",
    descricao:
      "Informações nutricionais precisas obtidas diretamente da Tabela Brasileira de Composição de Alimentos e da Tabela do IBGE.",
    Icon: FlaskConical,
    imagemUrl:
      "https://imgv2-1-f.scribdassets.com/img/document/38777470/original/e7af914de2/1?v=1",
    imageAlt: "Alimentos nutritivos coloridos",
  },
  {
    titulo: "Rótulo ANVISA",
    descricao:
      "Gere rótulos nutricionais no padrão exigido pela legislação brasileira vigente.",
    Icon: FileText,
    imagemUrl:
      "https://crn5.org.br/wp-content/uploads/2021/08/rotulo_0.jpg",
    imageAlt: "Rotulagem de produtos",
  },
  {
    titulo: "Tabela TDA",
    descricao:
      "Consulte a tabela de ingestão diária recomendada e adequações para planejamento nutricional.",
    Icon: Table,
    imagemUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=75",
    imageAlt: "Tabela de dados e estatísticas nutricionais",
  },
  {
    titulo: "Controle de Despesas",
    descricao:
      "Acompanhe despesas fixas e variáveis da sua produção para otimizar os lucros.",
    Icon: DollarSign,
    imagemUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=75",
    imageAlt: "Planejamento de despesas e finanças",
  },
  {
    titulo: "Relatórios Detalhados",
    descricao:
      "Visualize gráficos de margens, custos de ingredientes e histórico de precificação.",
    Icon: BarChart3,
    imagemUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=75",
    imageAlt: "Relatórios e gráficos estatísticos",
  },
  {
    titulo: "Aulas ao Vivo",
    descricao:
      "Aprenda com nutricionistas e especialistas em mentorias interativas de precificação e rotulagem.",
    Icon: Video,
    imagemUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=75",
    imageAlt: "Transmissão ao vivo de treinamento",
  },
];

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
    alt: "Ingredientes frescos para preparo de receitas",
  },
  {
    src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    alt: "Planejamento nutricional com alimentos saudáveis",
  },
  {
    src: "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=800&q=80",
    alt: "Rótulo Nutricional",
  },
];

const diferenciais = [
  {
    titulo: "Conformidade regulatória",
    descricao:
      "Rótulos gerados em conformidade com a RDC 429/2020 e IN 75/2020 da ANVISA.",
  },
  {
    titulo: "Base de dados TACO e IBGE",
    descricao:
      "Composição nutricional referenciada na Tabela Brasileira de Composição de Alimentos da UNICAMP e na Tabela Nutricional do IBGE.",
  },
  {
    titulo: "Controle de custo por porção",
    descricao:
      "Apropriação de custos por ingrediente com conversão de unidades e fator de correção.",
  },
];

type HomeProps = {
  onIrParaRegister?: () => void;
  onIrParaPlanos?: () => void;
};

export function Home({ onIrParaRegister, onIrParaPlanos }: HomeProps): JSX.Element {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const prev = () => setCurrentImage((i) => (i - 1 + heroImages.length) % heroImages.length);
  const next = () => setCurrentImage((i) => (i + 1) % heroImages.length);

  return (
    <div className="flex flex-col gap-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4 border-b border-gray-200 pb-10">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange">
            Plataforma de gestão nutricional
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-snug">
            Receitas, custos e <span className="text-brand-orange">rótulos nutricionais</span> em um único lugar
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            Solução voltada a nutricionistas e empreendedores que precisam de
            precisão técnica na elaboração de fichas técnicas e na conformidade
            com a legislação de rotulagem.
          </p>
        </div>

        <div className="relative rounded-lg overflow-hidden border border-gray-200 h-56 sm:h-64 lg:h-72 group">
          {heroImages.map((img, i) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === currentImage ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          <button
            onClick={prev}
            aria-label="Imagem anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} className="text-gray-700" />
          </button>
          <button
            onClick={next}
            aria-label="Próxima imagem"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} className="text-gray-700" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                aria-label={`Ir para imagem ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentImage ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

       {/* Propaganda / Promoção de Planos */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#034042] via-[#04585a] to-[#0a6c70] text-white p-8 sm:p-12 shadow-xl border border-teal-800 flex flex-col md:flex-row items-center justify-between gap-8 group">
        {/* Blobs decorativos com gradiente suave */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all duration-700"></div>
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-orange/10 transition-all duration-700"></div>
        
        <div className="flex flex-col gap-4 max-w-xl relative z-10 text-left">
          <div className="flex items-center gap-2 self-start bg-brand-orange/20 text-brand-orange text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-brand-orange/30">
            <Sparkles size={12} className="animate-pulse" />
            Planos Profissionais
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Leve o seu negócio para o <span className="text-brand-orange">próximo nível</span>
          </h3>
          <p className="text-sm text-teal-100 leading-relaxed">
            Desbloqueie a geração de rótulos nutricionais completos no padrão ANVISA, exportações em PDF/Excel, relatórios de margem de lucro, suporte prioritário e muito mais!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {[
              "Rótulo no padrão RDC 429/2020",
              "Exportações para PDF e Excel",
              "Custo por porção e margem de lucro",
              "Suporte especializado por WhatsApp"
            ].map((beneficio) => (
              <div key={beneficio} className="flex items-center gap-2 text-xs text-teal-50">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-teal-800/60 flex items-center justify-center text-brand-orange font-bold">✓</div>
                <span>{beneficio}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={onIrParaPlanos}
            className="bg-brand-orange hover:bg-orange-500 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 active:translate-y-0 active:brightness-95 transition-all duration-200"
          >
            Conhecer Planos e Preços
          </button>
          <span className="text-xs text-teal-200">Planos a partir de apenas R$ 39/mês</span>
        </div>
      </div>


      {/* CTA */}
      {/* <div className="flex flex-col items-center gap-2 -mt-8">
        <button
          onClick={onIrParaRegister}
          className="bg-brand-orange hover:brightness-90 active:brightness-75 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all"
        >
          Experimente gratuitamente
        </button>
        <p className="text-xs text-gray-400">Sem cartão de crédito</p>
      </div> */}

      {/* Funcionalidades */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-orange">
          Recursos principais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {funcionalidades.map(({ titulo, descricao, Icon, imagemUrl, imageAlt }) => (
            <div
              key={titulo}
              className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-orange-200 transition-all duration-300 hover:shadow-md min-h-[180px]"
            >
              {/* Imagem de fundo com baixa opacidade */}
              <img
                src={imagemUrl}
                alt={imageAlt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
              />

              {/* Overlay gradiente para garantir legibilidade total */}
              <div className="absolute inset-0 card-overlay" />

              {/* Acento laranja no topo ao hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-brand-orange" />

              {/* Conteúdo sobre as camadas */}
              <div className="relative z-10 p-6 flex flex-col gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded bg-brand-light text-brand-orange">
                  <Icon size={16} strokeWidth={2} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{titulo}</p>
                <p className="text-sm text-gray-800 leading-relaxed">{descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      {/* Diferenciais */}
      <div className="flex flex-col gap-6 pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-orange">
          Fundamentos técnicos
        </h2>
        <div className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {diferenciais.map(({ titulo, descricao }) => (
            <div key={titulo} className="bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8">
              <p className="text-sm font-semibold whitespace-nowrap text-brand">
                {titulo}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">{descricao}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
