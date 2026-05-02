import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

interface PrivacyProps {
  onVoltar: () => void;
}

export function Privacy({ onVoltar }: PrivacyProps) {
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
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Política de Privacidade</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Última atualização: {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-gray-200/50 p-8 md:p-12 prose prose-gray max-w-none fade-slide-in" style={{ animationDelay: '0.1s' }}>
          
          <p className="text-gray-600 font-medium text-lg leading-relaxed mb-8">
            A sua privacidade é nossa prioridade. O <strong>Cozinha da Nutri</strong> tem o compromisso de proteger os seus dados pessoais em total conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> e o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>. Esta política explica de forma clara como coletamos, usamos, armazenamos e protegemos as suas informações.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              1. Quais dados coletamos?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Coletamos as informações estritamente necessárias para a prestação dos nossos serviços de software (SaaS).
            </p>
            <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-brand">
              <li><strong>Dados Cadastrais e Empresariais:</strong> Nome empresarial, nome fantasia, CNPJ, Inscrição Estadual, e-mail, telefone e endereço completo. Esses dados são fornecidos diretamente por você ou obtidos automaticamente através de APIs oficiais públicas (como a base da Receita Federal) para agilizar o cadastro.</li>
              <li><strong>Dados de Acesso:</strong> Senha criptografada (em *hash*, que não pode ser lida por nossa equipe).</li>
              <li><strong>Dados de Navegação e Auditoria:</strong> Endereço IP, horários de login, dispositivo utilizado e logs de ações críticas na plataforma, para fins de segurança e prevenção a fraudes (exigência do Marco Civil da Internet).</li>
              <li><strong>Dados do Cliente Final (Pacientes/Consumidores):</strong> O usuário pode, eventualmente, armazenar na plataforma cálculos ou fichas destinados a terceiros. Esses dados ficam armazenados sob a custódia do usuário (controlador), atuando o Cozinha da Nutri apenas como processador desses dados.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              2. Como utilizamos os seus dados?
            </h2>
            <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-brand">
              <li>Para criação da sua conta e liberação de acesso às funcionalidades do sistema;</li>
              <li>Para comunicação de avisos importantes, suporte técnico, recuperação de senhas e alertas sobre a assinatura;</li>
              <li>Para faturamento, emissão de notas fiscais (caso o serviço seja pago) e cumprimento de obrigações tributárias;</li>
              <li>Para segurança, auditoria e identificação de anomalias no uso do sistema.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              3. Com quem compartilhamos os dados?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nós <strong>não vendemos, alugamos ou comercializamos</strong> seus dados pessoais em hipótese alguma. O compartilhamento ocorre apenas quando estritamente necessário para a operação do sistema, envolvendo terceiros que também operam sob rígidos padrões de segurança:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-brand">
              <li><strong>Provedores de Infraestrutura:</strong> Servidores em nuvem (Cloud) onde os dados são hospedados (ex: AWS, Google Cloud).</li>
              <li><strong>Serviços de E-mail:</strong> Plataformas terceirizadas utilizadas para o envio de e-mails de recuperação de senha e notificações (ex: EmailJS).</li>
              <li><strong>Autoridades Legais:</strong> Podemos compartilhar dados em resposta a ordens judiciais ou para o cumprimento de obrigações legais impostas por leis brasileiras.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              4. Como protegemos os seus dados?
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-4 flex gap-4 items-start">
              <Lock className="text-gray-600 shrink-0 mt-0.5" size={24} />
              <div>
                <p className="text-sm text-gray-700 m-0 leading-relaxed">
                  Utilizamos protocolos de criptografia e tecnologias modernas de segurança. Todas as comunicações entre o seu navegador e nossos servidores ocorrem via canais seguros. Nossas senhas são submetidas a processos de hash irreversível (tecnologia PBKDF2/Bcrypt) em bancos de dados relacionais isolados.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              5. Seus Direitos (De acordo com a LGPD)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Você é o único dono dos seus dados. A qualquer momento, você pode:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-brand">
              <li><strong>Acessar e Corrigir:</strong> Você mesmo pode atualizar todos os seus dados cadastrais acessando a aba "Meu Perfil" no painel.</li>
              <li><strong>Portabilidade e Download:</strong> Solicitar uma cópia dos dados que processamos sobre você.</li>
              <li><strong>Exclusão (Direito ao Esquecimento):</strong> Você pode usar o botão "Apagar Conta" no seu painel para excluir permanentemente todos os seus dados pessoais, receitas e rótulos do nosso sistema (sujeito à retenção dos dados exigidos por lei para registros fiscais ou logs do Marco Civil).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-brand rounded-full inline-block"></span>
              6. Contato e Encarregado de Dados (DPO)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              Caso tenha dúvidas sobre nossa política ou deseje exercer os seus direitos perante a LGPD, entre em contato conosco através do canal de atendimento do nosso site ou envie um e-mail para nossa equipe de suporte e conformidade.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}
