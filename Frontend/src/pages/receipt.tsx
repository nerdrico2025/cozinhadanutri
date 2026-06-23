import { CheckCircle, Printer, LifeBuoy, Mail, Phone, Calendar, Hash, Building2, CreditCard, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ReceiptProps {
  onSuporte?: () => void;
  onDashboard?: () => void;
}

export function Receipt({ onSuporte, onDashboard }: ReceiptProps): JSX.Element {
  const [dadosSimulados] = useState({
    numeroRecibo: 'REC-' + Math.floor(Math.random() * 100000000) + '-MP',
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    plano: 'Plano Profissional (Anual)',
    empresa: 'Minha Empresa Ltda',
    metodoPagamento: 'PIX',
    valor: 'R$ 290,00',
    contatoEmail: 'suporte@cozinhadanutri.com.br',
    contatoTelefone: '(11) 99999-9999'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 print:py-0 print:bg-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto w-full">
        
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
          
          {/* Header Sucesso */}
          <div className="bg-[#04585a] px-8 py-10 text-center text-white print:bg-white print:text-black print:border-b print:border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/20 rounded-full print:bg-green-100 print:text-green-600">
                <CheckCircle size={48} className="text-white print:text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Pagamento Concluído!</h1>
            <p className="text-white/80 text-sm print:text-gray-500">Sua assinatura foi ativada com sucesso.</p>
          </div>

          {/* Dados do Recibo */}
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Valor Pago</p>
                <p className="text-3xl font-extrabold text-gray-900">{dadosSimulados.valor}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Nº do Recibo</p>
                <p className="text-sm font-mono font-medium text-gray-900 flex items-center gap-1 justify-end">
                  <Hash size={14} className="text-gray-400" />
                  {dadosSimulados.numeroRecibo}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Data e Hora</p>
                  <p className="text-sm font-semibold text-gray-900">{dadosSimulados.data} às {dadosSimulados.hora}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Empresa</p>
                  <p className="text-sm font-semibold text-gray-900">{dadosSimulados.empresa}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Plano Assinado</p>
                  <p className="text-sm font-semibold text-gray-900">{dadosSimulados.plano}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Forma de Pagamento</p>
                  <p className="text-sm font-semibold text-gray-900">{dadosSimulados.metodoPagamento}</p>
                </div>
              </div>
            </div>

            {/* Avisos */}
            <div className="bg-gray-50 rounded-xl p-5 mb-2 border border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Política de Cancelamento:</strong> Você pode cancelar sua assinatura a qualquer momento através do seu painel de configurações. De acordo com o Art. 49 do CDC, você tem garantia de reembolso de 7 dias após a contratação.
              </p>
            </div>

            {/* Ações / Botões print:hidden */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 mt-8 print:hidden">
              <button 
                onClick={handlePrint}
                className="flex-1 flex justify-center items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
              >
                <Printer size={16} />
                Imprimir Recibo
              </button>
              
              <button 
                onClick={onDashboard}
                className="flex-1 flex justify-center items-center gap-2 bg-[#04585a] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#04585a]/90 transition text-sm shadow-sm"
              >
                Ir para o Dashboard
                <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>

        {/* Rodapé do Recibo e Contatos */}
        <div className="mt-8 text-center print:hidden">
          <p className="text-sm text-gray-500 font-medium mb-4">Precisa de ajuda com o seu pagamento?</p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <Mail size={14} className="text-[#04585a]" />
              {dadosSimulados.contatoEmail}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <Phone size={14} className="text-[#04585a]" />
              {dadosSimulados.contatoTelefone}
            </div>
          </div>
          
          <button 
            onClick={onSuporte}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#04585a] hover:text-[#04585a]/80 transition underline underline-offset-4"
          >
            <LifeBuoy size={16} />
            Falar com o Suporte
          </button>
        </div>

      </div>
    </div>
  );
}
