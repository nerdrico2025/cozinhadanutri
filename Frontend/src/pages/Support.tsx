import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSupportConfig, SupportConfig } from '../services/supportService';

/* Ícone SVG real do WhatsApp */
function WhatsAppIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.5l5.816-1.452A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.645-.523-5.148-1.427l-.369-.217-3.448.861.924-3.352-.24-.384A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

/* Ícone SVG real de E-mail (envelope) */
function EmailIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="3"/>
      <polyline points="2,4 12,13 22,4"/>
    </svg>
  );
}

export function Support(): JSX.Element {
  const [config, setConfig] = useState<SupportConfig>(getSupportConfig());

  useEffect(() => {
    const handleUpdate = () => setConfig(getSupportConfig());
    window.addEventListener('support_updated', handleUpdate);
    return () => window.removeEventListener('support_updated', handleUpdate);
  }, []);

  const canais = [
    {
      titulo: 'E-mail',
      descricao: 'Envie sua dúvida por e-mail. Ideal para solicitações detalhadas ou questões que exigem análise mais cuidadosa.',
      contato: config.email,
      link: `mailto:${config.email}`,
      labelLink: 'Enviar e-mail',
      Icon: EmailIcon,
      iconBg: 'bg-[#04585a]/10',
      iconColor: 'text-[#04585a]',
      accentBorder: 'border-t-[#04585a]',
      btnClass: 'bg-[#04585a] hover:bg-[#04585a]/90 text-white',
      prazo: 'Resposta em até 48 horas úteis',
      PrazoIcon: Clock,
      prazoColor: 'text-gray-400',
    },
    {
      titulo: 'WhatsApp',
      descricao: 'Prefere algo mais rápido? Fale pelo WhatsApp para dúvidas ágeis e suporte em tempo real.',
      contato: config.whatsapp,
      link: `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`,
      labelLink: 'Abrir WhatsApp',
      Icon: WhatsAppIcon,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      accentBorder: 'border-t-green-500',
      btnClass: 'bg-green-500 hover:bg-green-600 text-white',
      prazo: 'Resposta em até 4 horas úteis',
      PrazoIcon: CheckCircle,
      prazoColor: 'text-green-500',
    },
  ];

  const horarios = [
    { dia: 'Segunda a Sexta', horario: config.horarios.segSex, ativo: config.horarios.segSex !== 'Sem atendimento' },
    { dia: 'Sábado', horario: config.horarios.sabado, ativo: config.horarios.sabado !== 'Sem atendimento' },
    { dia: 'Domingo e Feriados', horario: config.horarios.domingoFeriado, ativo: config.horarios.domingoFeriado !== 'Sem atendimento' },
  ];

  const prazosList = [
    { tipo: 'Dúvidas gerais', prazo: config.prazos.geral, Icon: CheckCircle, cor: 'text-[#04585a]', bg: 'bg-[#04585a]/10' },
    { tipo: 'Problemas técnicos', prazo: config.prazos.tecnico, Icon: AlertCircle, cor: 'text-amber-600', bg: 'bg-amber-50' },
    { tipo: 'Solicitações especiais', prazo: config.prazos.especial, Icon: Clock, cor: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-[80vh] bg-gray-50 py-16 px-4">

      {/* Cabeçalho */}
      <div className="text-center mb-14 max-w-xl mx-auto">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#04585a] bg-[#04585a]/10 px-4 py-1.5 rounded-full mb-4">
          Suporte
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
          Como podemos ajudar?
        </h1>
        <p className="text-base text-gray-500">
          Escolha o canal mais conveniente e nossa equipe responderá o quanto antes.
        </p>
      </div>

      {/* Canais de contato */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {canais.map((canal) => (
          <div
            key={canal.titulo}
            className={`bg-white rounded-2xl border border-gray-200 border-t-4 ${canal.accentBorder} shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 p-7`}
          >
            {/* Ícone + título */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${canal.iconBg}`}>
                <canal.Icon size={26} className={canal.iconColor} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{canal.titulo}</h2>
                <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${canal.prazoColor}`}>
                  <canal.PrazoIcon size={12} />
                  {canal.prazo}
                </p>
              </div>
            </div>

            {/* Descrição */}
            <p className="text-sm text-gray-500 leading-relaxed flex-1">{canal.descricao}</p>

            {/* Contato */}
            <div className={`flex items-center gap-2 text-sm font-semibold ${canal.iconColor}`}>
              <canal.Icon size={15} />
              {canal.contato}
            </div>

            {/* Botão */}
            <a
              href={canal.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 ${canal.btnClass}`}
            >
              <canal.Icon size={16} />
              {canal.labelLink}
            </a>
          </div>
        ))}
      </div>

      {/* Horários e prazos */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Horários de atendimento */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Clock size={20} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Horários de Atendimento</h2>
          </div>
          <ul className="flex flex-col divide-y divide-gray-100">
            {horarios.map(({ dia, horario, ativo }) => (
              <li key={dia} className="flex justify-between items-center py-3 text-sm">
                <span className="text-gray-600">{dia}</span>
                <span className={`font-semibold text-right ${ativo ? 'text-gray-900' : 'text-gray-400'}`}>
                  {horario}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
            Horários no fuso de Brasília (GMT-3). Fora do horário, respondemos no próximo dia útil.
          </p>
        </div>

        {/* Prazos de resposta */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-[#04585a]/10">
              <CheckCircle size={20} className="text-[#04585a]" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Prazos de Resposta</h2>
          </div>
          <ul className="flex flex-col gap-4">
            {prazosList.map(({ tipo, prazo, Icon, cor, bg }) => (
              <li key={tipo} className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
                  <Icon size={18} className={cor} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{tipo}</p>
                  <p className="text-xs text-gray-400">{prazo}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
            Prazos contados em dias úteis a partir da confirmação de recebimento da sua mensagem.
          </p>
        </div>
      </div>
    </div>
  );
}


