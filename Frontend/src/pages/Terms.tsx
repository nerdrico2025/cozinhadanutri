import { ArrowLeft, FileText } from 'lucide-react';

interface TermsProps {
  onVoltar: () => void;
}

export function Terms({ onVoltar }: TermsProps) {
  const lastUpdated = "11 de maio de 2026";
  const version = "1.0";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#04585a]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-10 fade-slide-in">
          <button 
            type="button"
            onClick={onVoltar} 
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#04585a] transition-colors mb-6 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/60 shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#04585a]/10 p-3.5 rounded-2xl text-[#04585a] shadow-inner">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Termos de Uso</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Versão {version} | Vigência a partir de {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-gray-200/50 p-8 md:p-12 prose prose-gray max-w-none fade-slide-in" style={{ animationDelay: '0.1s' }}>
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ao acessar ou utilizar a plataforma Cozinha da Nutri, disponível em aplicação web e/ou mobile, você declara ter lido, compreendido e concordado com todos os termos e condições descritos neste documento.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Caso não concorde com qualquer disposição destes Termos de Uso, pedimos que não utilize a plataforma. O uso continuado após alterações nos Termos implica a aceitação das novas condições.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              2. Descrição do Serviço
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri é uma plataforma SaaS (Software as a Service) voltada para pequenos negócios de alimentação, oferecendo as seguintes funcionalidades:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Cadastro de ingredientes com dados nutricionais integrados à base TACO (NEPA/UNICAMP);</li>
              <li>Criação de fichas técnicas padronizadas de receitas;</li>
              <li>Cálculo automático de custo de produção e sugestão de preço de venda;</li>
              <li>Geração de rótulo nutricional no padrão ANVISA (RDC 429/2020 e IN 75/2020);</li>
              <li>Impressão de etiquetas personalizadas para produtos alimentícios.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              A plataforma destina-se a empreendedores do setor alimentício, como marmitarias, confeitarias, hamburguerias e pequenos produtores de alimentos embalados.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              3. Cadastro e Conta de Usuário
            </h2>
            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">3.1 Requisitos de cadastro</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Para utilizar a plataforma é necessário criar uma conta de usuário, fornecendo nome completo, endereço de e-mail válido e senha segura. O usuário deve ter no mínimo 18 (dezoito) anos de idade ou representar uma pessoa jurídica legalmente constituída.
            </p>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">3.2 Responsabilidades do usuário</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              O usuário é integralmente responsável por:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Manter a confidencialidade de suas credenciais de acesso;</li>
              <li>Todas as atividades realizadas em sua conta;</li>
              <li>Notificar imediatamente a Cozinha da Nutri em caso de uso não autorizado ou suspeita de violação de segurança;</li>
              <li>Garantir que todas as informações fornecidas no cadastro sejam verdadeiras e atualizadas.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">3.3 Suspensão e encerramento</h3>
            <p className="text-gray-600 leading-relaxed">
              A Cozinha da Nutri reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem prejuízo de outras medidas cabíveis.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              4. Uso Aceitável da Plataforma
            </h2>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">4.1 Usos permitidos</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              A plataforma pode ser utilizada exclusivamente para fins lícitos relacionados à gestão de receitas, fichas técnicas e rotulagem de produtos alimentícios no contexto de atividades profissionais ou empresariais do usuário.
            </p>

            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">4.2 Condutas proibidas</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              É expressamente vedado ao usuário:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a]">
              <li>Utilizar a plataforma para fins ilegais ou que violem a legislação brasileira vigente;</li>
              <li>Compartilhar credenciais de acesso com terceiros não autorizados;</li>
              <li>Tentar acessar sistemas, dados ou áreas restritas da plataforma sem autorização;</li>
              <li>Realizar engenharia reversa, descompilar ou extrair o código-fonte da plataforma;</li>
              <li>Utilizar robôs, scrapers ou outros meios automatizados para acessar ou coletar dados da plataforma;</li>
              <li>Publicar ou transmitir conteúdo falso, enganoso ou que infrinja direitos de terceiros;</li>
              <li>Interferir no funcionamento adequado dos servidores ou redes da plataforma.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              5. Dados Nutricionais e Responsabilidade Técnica
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A base nutricional utilizada pela plataforma é derivada da Tabela Brasileira de Composição de Alimentos (TACO), desenvolvida pela NEPA/UNICAMP, referência pública e amplamente reconhecida no Brasil.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              O usuário reconhece que:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a]">
              <li>Os dados nutricionais gerados são estimativas baseadas na composição média dos alimentos e podem variar conforme a procedência, safra e método de preparo dos ingredientes;</li>
              <li>O rótulo nutricional gerado pela plataforma serve como base de referência, e a responsabilidade pela conformidade regulatória final com a ANVISA é integralmente do usuário;</li>
              <li>A Cozinha da Nutri não substitui a consultoria de nutricionista habilitado para fins de declaração nutricional obrigatória em produtos sujeitos à vigilância sanitária.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              6. Propriedade Intelectual
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Todo o conteúdo da plataforma, incluindo mas não se limitando a textos, interfaces, logotipos, ícones, algoritmos e base de dados própria, é de propriedade exclusiva da Cozinha da Nutri ou de seus licenciantes, protegido pelas leis brasileiras de propriedade intelectual (Lei n.º 9.279/1996, Lei n.º 9.610/1998).
            </p>
            <p className="text-gray-600 leading-relaxed">
              O usuário mantém a propriedade sobre os dados e receitas que cadastrar na plataforma, concedendo à Cozinha da Nutri licença limitada para armazenar e processar essas informações com a finalidade de prestação do serviço.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              7. Planos e Pagamentos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri poderá oferecer planos gratuitos e/ou pagos. As condições específicas de cada plano, incluindo funcionalidades disponíveis, limites de uso e valores, serão detalhadas na página de preços da plataforma.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nos planos pagos, aplicam-se as seguintes condições:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a]">
              <li>O pagamento deverá ser realizado antecipadamente, conforme periodicidade contratada (mensal ou anual);</li>
              <li>Em caso de cancelamento, o acesso permanece ativo até o fim do período já pago;</li>
              <li>Não há reembolso proporcional de períodos não utilizados, salvo disposição expressa em contrário.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              8. Limitação de Responsabilidade
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri envida seus melhores esforços para garantir a disponibilidade e precisão da plataforma, mas não garante que o serviço estará livre de interrupções, erros ou falhas técnicas.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri não se responsabiliza por:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a]">
              <li>Danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso da plataforma;</li>
              <li>Decisões de precificação ou comerciais tomadas pelo usuário com base nas informações geradas;</li>
              <li>Autuações, multas ou penalidades impostas por órgãos regulatórios em razão de rótulos ou fichas técnicas elaborados pelo usuário;</li>
              <li>Perda de dados causada por falhas de terceiros, incluindo serviços de hospedagem e infraestrutura.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              9. Alterações nos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri pode alterar estes Termos de Uso a qualquer momento. Alterações relevantes serão comunicadas ao usuário por e-mail ou notificação na plataforma com antecedência mínima de 15 (quinze) dias.
            </p>
            <p className="text-gray-600 leading-relaxed">
              O uso continuado da plataforma após o prazo de comunicação implica a aceitação automática dos novos termos.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              10. Lei Aplicável e Foro
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para a resolução de quaisquer litígios decorrentes deste instrumento, fica eleito o foro da comarca de domicílio do usuário, nos termos do art. 101, I, do Código de Defesa do Consumidor (Lei n.º 8.078/1990), salvo quando aplicável o art. 22 do Código de Processo Civil.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              11. Contato
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Para dúvidas, solicitações ou comunicações relacionadas a estes Termos de Uso, entre em contato pelo e-mail: <a href="mailto:contato@cozinhadanutri.com.br" className="text-[#04585a] hover:underline font-semibold">contato@cozinhadanutri.com.br</a>
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-400 font-medium">Cozinha da Nutri — Todos os direitos reservados</p>
          </div>

        </article>
      </div>
    </div>
  );
}
