import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface PrivacyProps {
  onVoltar: () => void;
}

export function Privacy({ onVoltar }: PrivacyProps) {
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
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Política de Privacidade</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Versão {version} | Vigência a partir de {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-gray-200/50 p-8 md:p-12 prose prose-gray max-w-none fade-slide-in" style={{ animationDelay: '0.1s' }}>
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              1. Introdução e Controlador de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri respeita e protege a privacidade de seus usuários. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos os dados pessoais dos usuários da plataforma, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei n.º 13.709/2018) e demais legislações aplicáveis.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Controlador dos Dados:</strong> Cozinha da Nutri (identificação completa será incluída conforme formalização jurídica da empresa).
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Encarregado de Dados (DPO):</strong> Para comunicações relacionadas à proteção de dados, o canal de contato é: <a href="mailto:privacidade@cozinhadanutri.com.br" className="text-[#04585a] hover:underline font-semibold">privacidade@cozinhadanutri.com.br</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              2. Dados Pessoais Coletados
            </h2>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">2.1 Dados fornecidos diretamente pelo usuário</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ao se cadastrar e utilizar a plataforma, o usuário fornece:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>CNPJ;</li>
              <li>Inscrição Estadual;</li>
              <li>Razão Social;</li>
              <li>Nome de fantasia;</li>
              <li>Endereço de e-mail;</li>
              <li>Telefone;</li>
              <li>Endereço Comercial;</li>
              <li>Senha (armazenada de forma criptografada — nunca em texto simples);</li>
              <li>Informações do negócio, como nome do estabelecimento e segmento de atuação (opcionais);</li>
              <li>Dados de receitas, ingredientes, fichas técnicas e produtos cadastrados.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">2.2 Dados coletados automaticamente</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Durante o uso da plataforma, coletamos automaticamente:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Endereço IP e dados de localização aproximada;</li>
              <li>Tipo de dispositivo, navegador e sistema operacional;</li>
              <li>Páginas acessadas, funcionalidades utilizadas e duração das sessões;</li>
              <li>Logs de acesso, erros e eventos de uso.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mb-2 mt-4">2.3 Dados de pagamento</h3>
            <p className="text-gray-600 leading-relaxed">
              Para usuários de planos pagos, os dados de pagamento (cartão de crédito, dados bancários) são processados exclusivamente por gateways de pagamento certificados PCI-DSS. A Cozinha da Nutri não armazena dados financeiros em seus servidores.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              3. Finalidades do Tratamento de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Os dados pessoais coletados são utilizados para as seguintes finalidades:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Prestação dos serviços contratados, incluindo autenticação, armazenamento de receitas e geração de rótulos;</li>
              <li>Comunicação com o usuário sobre sua conta, atualizações e novidades da plataforma;</li>
              <li>Cobrança e gestão de planos pagos;</li>
              <li>Melhoria contínua da plataforma por meio de análise de uso e comportamento (dados anonimizados);</li>
              <li>Atendimento a obrigações legais e regulatórias;</li>
              <li>Prevenção a fraudes e segurança da plataforma.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Não utilizamos dados pessoais para venda a terceiros, publicidade de terceiros ou qualquer finalidade incompatível com as descritas acima.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              4. Base Legal para o Tratamento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              O tratamento dos dados pessoais pela Cozinha da Nutri está fundamentado nas seguintes bases legais previstas na LGPD:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a]">
              <li><strong>Execução de contrato:</strong> para prestar os serviços contratados pelo usuário (art. 7.º, V, LGPD);</li>
              <li><strong>Cumprimento de obrigação legal:</strong> para atender exigências fiscais, trabalhistas e regulatórias (art. 7.º, II, LGPD);</li>
              <li><strong>Legítimo interesse:</strong> para melhorar os serviços, garantir a segurança e prevenir fraudes (art. 7.º, IX, LGPD);</li>
              <li><strong>Consentimento:</strong> para envio de comunicações de marketing, quando aplicável (art. 7.º, I, LGPD).</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              5. Compartilhamento de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Cozinha da Nutri pode compartilhar dados pessoais com terceiros apenas nas seguintes hipóteses:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Prestadores de serviços essenciais para a operação da plataforma, como serviços de hospedagem em nuvem (Railway/Render), autenticação e gateways de pagamento, sempre sob acordos de confidencialidade e conformidade com a LGPD;</li>
              <li>Autoridades públicas, quando exigido por lei, ordem judicial ou regulatória;</li>
              <li>Parceiros comerciais, somente com o consentimento expresso do usuário.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Não vendemos, alugamos ou cedemos dados pessoais a anunciantes ou corretores de dados.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              6. Retenção e Exclusão de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Os dados pessoais são retidos pelo período necessário para a prestação dos serviços e cumprimento de obrigações legais. Após o encerramento da conta, os dados são retidos por até 5 (cinco) anos para fins de cumprimento de obrigações legais e fiscais, conforme legislação brasileira aplicável.
            </p>
            <p className="text-gray-600 leading-relaxed">
              O usuário pode solicitar a exclusão de seus dados pessoais a qualquer momento, observados os prazos legais de retenção obrigatória. A solicitação deve ser enviada para: <a href="mailto:privacidade@cozinhadanutri.com.br" className="text-[#04585a] hover:underline font-semibold">privacidade@cozinhadanutri.com.br</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              7. Direitos dos Titulares de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nos termos da LGPD, o usuário (titular dos dados) tem os seguintes direitos, que podem ser exercidos a qualquer momento:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li><strong>Confirmação:</strong> saber se tratamos seus dados pessoais;</li>
              <li><strong>Acesso:</strong> obter uma cópia dos dados pessoais que mantemos sobre você;</li>
              <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade com a LGPD;</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado para transferência a outro fornecedor;</li>
              <li><strong>Revogação do consentimento:</strong> retirar o consentimento para tratamentos baseados nessa base legal;</li>
              <li><strong>Oposição:</strong> opor-se a tratamentos realizados com fundamento em outras bases legais;</li>
              <li><strong>Informação sobre compartilhamento:</strong> saber com quais entidades seus dados foram compartilhados.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Para exercer seus direitos, entre em contato pelo e-mail: <a href="mailto:privacidade@cozinhadanutri.com.br" className="text-[#04585a] hover:underline font-semibold">privacidade@cozinhadanutri.com.br</a>. Responderemos no prazo de 15 (quinze) dias úteis.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              8. Segurança dos Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Adotamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida, incluindo:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Autenticação com tokens JWT e senhas criptografadas com hashing seguro (bcrypt ou similar);</li>
              <li>Comunicação via HTTPS com certificado SSL/TLS;</li>
              <li>Controle de acesso baseado em perfis de usuário;</li>
              <li>Monitoramento de acessos e logs de segurança;</li>
              <li>Backups periódicos dos dados armazenados.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Em caso de incidente de segurança que possa afetar seus dados, notificaremos os titulares e a Autoridade Nacional de Proteção de Dados (ANPD) nos prazos previstos pela LGPD.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              9. Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A plataforma utiliza cookies e tecnologias similares para:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a] mb-4">
              <li>Manter a sessão do usuário autenticado;</li>
              <li>Registrar preferências de uso;</li>
              <li>Analisar o desempenho e uso da plataforma (dados agregados e anonimizados).</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              O usuário pode gerenciar as preferências de cookies por meio das configurações do seu navegador. A desativação de cookies essenciais pode comprometer o funcionamento da plataforma.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              10. Menores de Idade
            </h2>
            <p className="text-gray-600 leading-relaxed">
              A plataforma Cozinha da Nutri é destinada a usuários maiores de 18 (dezoito) anos. Não coletamos intencionalmente dados pessoais de menores de idade. Caso identificarmos tal situação, as informações serão removidas imediatamente.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              11. Transferência Internacional de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed">
              O armazenamento e processamento dos dados pode ocorrer em servidores localizados fora do Brasil (ex: provedores de nuvem como Railway ou Render). Nesses casos, garantimos que as transferências sejam realizadas em conformidade com a LGPD, mediante a adoção de salvaguardas adequadas, incluindo cláusulas contratuais padrão.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              12. Alterações nesta Política
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças na legislação, nos serviços ou nas práticas de privacidade da Cozinha da Nutri. Alterações relevantes serão comunicadas com antecedência mínima de 15 (quinze) dias por e-mail ou notificação na plataforma.
            </p>
            <p className="text-gray-600 leading-relaxed">
              A versão mais recente estará sempre disponível na plataforma.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#04585a] rounded-full inline-block"></span>
              13. Contato e Encarregado de Dados
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Para dúvidas, solicitações relacionadas aos seus dados pessoais, ou para exercer seus direitos como titular, entre em contato:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc pl-5 marker:text-[#04585a]">
              <li><strong>E-mail geral:</strong> <a href="mailto:contato@cozinhadanutri.com.br" className="text-[#04585a] hover:underline font-semibold">contato@cozinhadanutri.com.br</a></li>
              <li><strong>E-mail privacidade/DPO:</strong> <a href="mailto:privacidade@cozinhadanutri.com.br" className="text-[#04585a] hover:underline font-semibold">privacidade@cozinhadanutri.com.br</a></li>
            </ul>
          </section>

          <div className="pt-8 mt-12 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-400 font-medium">Cozinha da Nutri — Todos os direitos reservados</p>
          </div>

        </article>
      </div>
    </div>
  );
}
