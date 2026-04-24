/**
 * Serviço de integração com Mercado Pago Checkout Pro
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing
 *
 * Fluxo:
 *  1. Frontend chama criarPreferencia() com o plano escolhido
 *  2. Backend (sua API) cria a preferência no MP e retorna { init_point }
 *  3. Frontend redireciona o usuário para o init_point (checkout MP)
 *  4. MP redireciona de volta para as URLs de retorno configuradas
 *
 * IMPORTANTE: A chave de acesso (access_token) NUNCA deve ficar no frontend.
 * Configure uma rota no seu backend para criar preferências.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export type PlanoId = 'profissional' | 'empresarial';

export type MetodoPagamento = 'pix' | 'cartao';

export interface PreferenciaPayload {
  planoId: PlanoId;
  planoNome: string;
  valor: number;
  usuarioEmail: string;
  usuarioNome: string;
  metodoPagamento: MetodoPagamento;
  parcelas?: number; // apenas quando metodoPagamento = 'cartao'
}

export interface PreferenciaResposta {
  preferenceId: string;
  initPoint: string;  // URL de checkout do Mercado Pago (produção)
  sandboxInitPoint: string; // URL de checkout para testes
}

export interface StatusPagamentoResposta {
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded';
  statusDetail: string;
  planoId: PlanoId;
  transactionId: string;
  valorPago: number;
  dataAprovacao?: string;
}

/**
 * Cria uma preferência de pagamento no Mercado Pago via backend.
 * O backend deve expor: POST /api/payments/preference
 */
export async function criarPreferencia(
  payload: PreferenciaPayload
): Promise<PreferenciaResposta> {
  const res = await fetch(`${API_BASE}/api/payments/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(
      (erro as { message?: string }).message ?? 'Erro ao criar preferência de pagamento.'
    );
  }

  return res.json() as Promise<PreferenciaResposta>;
}

/**
 * Consulta o status de um pagamento via backend.
 * O backend deve expor: GET /api/payments/status/:paymentId
 */
export async function consultarStatusPagamento(
  paymentId: string
): Promise<StatusPagamentoResposta> {
  const res = await fetch(`${API_BASE}/api/payments/status/${encodeURIComponent(paymentId)}`);

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(
      (erro as { message?: string }).message ?? 'Erro ao consultar status do pagamento.'
    );
  }

  return res.json() as Promise<StatusPagamentoResposta>;
}
