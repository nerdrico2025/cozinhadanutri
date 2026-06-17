const API_BASE = import.meta.env.VITE_API_URL as string;

export type PlanoId = 'profissional' | 'empresarial';
export type MetodoPagamento = 'pix' | 'cartao';

export interface PagamentoPayload {
  nome: string;
  email: string;
  cpf: string;
  valor: number;
  metodoPagamento: 'pix' | 'cartao';
}

export interface PreferenciaResposta {
  paymentId: string;
  checkoutUrl?: string; // URL of the Asaas checkout (invoice link)
  pixQrCode?: string; // Payload of the QR Code if PIX
  pixCopyPaste?: string; // Payload copy paste if PIX
}

export interface StatusPagamentoResposta {
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  statusDetail?: string;
  planoId: PlanoId;
  transactionId: string;
  valorPago: number;
  dataAprovacao?: string;
}

export async function criarPagamento(
  payload: PagamentoPayload
): Promise<PreferenciaResposta> {
  const res = await fetch(`${API_BASE}/api/payments/payment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    const message = erro.errors?.[0]?.description || erro.message || 'Erro ao criar cobrança no Asaas.';
    throw new Error(message);
  }

  return res.json() as Promise<PreferenciaResposta>;
}

export async function consultarStatusPagamento(
  paymentId: string
): Promise<StatusPagamentoResposta> {
  const res = await fetch(`${API_BASE}/api/payments/status/${encodeURIComponent(paymentId)}/`);

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(
      (erro as { message?: string }).message ?? 'Erro ao consultar status da cobrança.'
    );
  }

  return res.json() as Promise<StatusPagamentoResposta>;
}
