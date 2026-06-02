import api from './api';

export interface ConfiguracaoEtiqueta {
  id?: number;
  nome_personalizado?: string;
  porcao?: string;
  informacoes_complementares?: string;
  tamanho_etiqueta?: string;
}

export interface EtiquetaData {
  id?: number;
  ficha?: number;
  nome_personalizado?: string;
  tamanho_porcao?: string;
  informacoes_complementares?: string;
  mostrar_sodio?: boolean;
  mostrar_acucar?: boolean;
}

/**
 * PUT /api/fichas-tecnicas/{id}/configuracao-etiqueta/
 * Retrieves or updates the label configuration for a recipe.
 */
export const salvarConfiguracaoEtiqueta = async (
  fichaId: number | string,
  dados: Partial<ConfiguracaoEtiqueta>
): Promise<ConfiguracaoEtiqueta> => {
  const response = await api.put(`/api/fichas-tecnicas/${fichaId}/configuracao-etiqueta/`, dados);
  return response.data;
};

/**
 * GET /api/etiquetas/{id}/
 * Retrieves details for a specific label.
 */
export const obterEtiqueta = async (etiquetaId: number | string): Promise<any> => {
  const response = await api.get(`/api/etiquetas/${etiquetaId}/`);
  return response.data;
};

/**
 * PATCH /api/etiquetas/{id}/
 * Partially updates details for a specific label.
 */
export const atualizarEtiqueta = async (
  etiquetaId: number | string,
  dados: Partial<EtiquetaData>
): Promise<any> => {
  const response = await api.patch(`/api/etiquetas/${etiquetaId}/`, dados);
  return response.data;
};
