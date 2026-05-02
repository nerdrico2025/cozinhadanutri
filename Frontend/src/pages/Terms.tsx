import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface TermsProps {
  onVoltar: () => void;
}

export function Terms({ onVoltar }: TermsProps) {
  const lastUpdated = "01 de Maio de 2026";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-10 fade-slide-in">
          <button 
            type="button"
            onClick={onVoltar} 
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand transition-colors mb-6 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/60 shadow-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-brand/10 p-3.5 rounded-2xl text-brand shadow-inner">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Termos e Condições de Uso</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Última atualização: {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-gray-200/50 p-8 md:p-12 prose prose-gray max-w-none fade-slide-in" style={{ animationDelay: '0.1s' }}>
          
          <p className="text-gray-600 font-medium text-lg leading-relaxed mb-8">
            Bem-vindo ao <strong>Cozinha da Nutri</strong>. Ao acessar e utilizar o nosso sistema ("Plataforma"), você concorda expressamente com as condições estipuladas neste termo. Leia atentamente as disposições abaixo antes de prosseguir com o seu cadastro e uso dos nossos serviços.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A utilização do Cozinha da Nutri está condicionada à aceitação plena e sem reservas de todos os termos, condições e diretrizes aqui estabelecidos. O uso contínuo da Plataforma após qualquer modificação nestes Termos de Uso constituirá a aceitação tácita de tais mudanças por parte do usuário.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              2. Natureza dos Serviços
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              O Cozinha da Nutri é um software como serviço (SaaS) que fornece ferramentas tecnológicas para auxiliar profissionais de nutrição e empresas do ramo alimentício na gestão de fichas técnicas, cálculo de informações nutricionais e geração de rótulos com base em bancos de dados oficiais (como TACO, IBGE, entre outros).
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6 flex gap-4 items-start">
              <CheckCircle2 className="text-amber-600 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-bold text-amber-900 m-0 mb-1">Isenção de Responsabilidade Profissional</h4>
                <p className="text-sm text-amber-800 m-0 leading-relaxed">
                  A Plataforma <strong>não substitui a avaliação técnica, médica ou nutricional humana</strong>. Todos os cálculos gerados pelo sistema são aproximações matemáticas baseadas nos dados inseridos pelo Usuário. A veracidade, conformidade regulatória (ANVISA) e aplicação dos rótulos gerados são de responsabilidade <strong>exclusiva e integral do profissional ou empresa (Usuário)</strong> que opera o sistema. O Cozinha da Nutri não se responsabiliza por eventuais danos à saúde de consumidores finais decorrentes de erros nos dados cadastrados pelo Usuário.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              3. Cadastro e Obrigações do Usuário
            </h2>
            <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-brand">
              <li>O Usuário compromete-se a fornecer dados verdadeiros, exatos e atualizados durante o cadastro (incluindo CNPJ regular, razão social e contatos).</li>
              <li>A conta é pessoal, intransferível e de responsabilidade exclusiva do titular.</li>
              <li>O Usuário é o único responsável por manter a confidencialidade de sua senha de acesso. O Cozinha da Nutri não se responsabiliza por acessos indevidos resultantes do compartilhamento de credenciais.</li>
              <li>O Usuário deve notificar imediatamente a equipe de suporte caso suspeite de violação de segurança em sua conta.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              4. Propriedade Intelectual
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Todos os direitos de propriedade intelectual relativos ao Cozinha da Nutri — incluindo, mas não se limitando a, código-fonte, design, logotipos, marcas, algoritmos e interface gráfica — são de titularidade exclusiva do Cozinha da Nutri. É expressamente proibida a cópia, engenharia reversa, distribuição ou modificação não autorizada de qualquer elemento da Plataforma.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Os dados e receitas inseridos pelo Usuário na Plataforma pertencem exclusivamente ao Usuário. O Cozinha da Nutri não reivindica propriedade sobre as fórmulas e receitas cadastradas em contas privadas.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              5. Planos, Pagamentos e Cancelamento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Plataforma pode ser oferecida em modalidades gratuitas e pagas (assinaturas). Os valores, frequências de cobrança e recursos disponíveis estarão sempre transparentes no painel de "Planos".
            </p>
            <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-brand">
              <li>O cancelamento da assinatura pode ser realizado a qualquer momento pelo painel do usuário, evitando renovações futuras.</li>
              <li>Em caso de solicitação de exclusão definitiva da conta ("Apagar Conta"), todos os dados, receitas e rótulos do Usuário serão apagados de forma irreversível de nossos bancos de dados, sem possibilidade de recuperação.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              6. Modificações na Plataforma e nestes Termos
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              O Cozinha da Nutri reserva-se o direito de atualizar, modificar ou descontinuar funcionalidades da Plataforma a qualquer momento, visando sempre a melhoria do serviço. Caso haja alterações significativas nestes Termos de Uso, os Usuários serão notificados por e-mail ou por um aviso claro na própria Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              7. Foro e Legislação Aplicável
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Para a solução de eventuais controvérsias oriundas deste instrumento, fica eleito o foro da Comarca da sede da empresa operadora do Cozinha da Nutri, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}
