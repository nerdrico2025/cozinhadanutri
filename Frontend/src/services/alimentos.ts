import api from './api';
import { Ingrediente } from '../types';

export const buscarAlimentosBackend = async (descricao: string) => {
  const response = await api.get(`/api/alimentos/?descricao=${encodeURIComponent(descricao)}`);
  return response.data;
};

export const listarAlimentos = async () => {
  const response = await api.get('/api/alimentos/?salvos=true');
  return response.data;
};

export const salvarAlimento = async (ingrediente: Partial<Ingrediente>, numeroExistente?: number) => {
  // Converte de "Ingrediente" do frontend para o formato do backend "Alimento"
  const payload = {
    descricao: ingrediente.nome,
    unidade_medida: ingrediente.unidade,
    preco: ingrediente.preco,
    energia_kcal: ingrediente.dadosNutricionais?.calorias || 0,
    proteina: ingrediente.dadosNutricionais?.proteinas || 0,
    carboidrato: ingrediente.dadosNutricionais?.carboidratos || 0,
    lipideos: ingrediente.dadosNutricionais?.gorduras || 0,
    acucares_totais: ingrediente.dadosNutricionais?.acucares_totais || 0,
    acucares_adicionados: ingrediente.dadosNutricionais?.acucares_adicionados || 0,
    saturados: ingrediente.dadosNutricionais?.gorduras_saturadas || 0,
    AG18_1t: ingrediente.dadosNutricionais?.gorduras_trans || 0, // Using AG18_1t to store trans as the backend has it
    fibra_alimentar: ingrediente.dadosNutricionais?.fibras || 0,
    sodio: ingrediente.dadosNutricionais?.sodio || 0,
    vitaminas: ingrediente.dadosNutricionais?.vitaminas || 0,
    minerais: ingrediente.dadosNutricionais?.minerais || 0,
    numero: numeroExistente || Math.floor(Math.random() * 900000) + 10000,
  };

  if (ingrediente.id && !String(ingrediente.id).includes('-')) {
    // É um ID numérico do backend (já existe no banco)
    const response = await api.put(`/api/alimentos/${ingrediente.id}/`, payload);
    return response.data;
  } else {
    // Criar novo
    const response = await api.post('/api/alimentos/', payload);
    return response.data;
  }
};

export const excluirAlimento = async (id: number) => {
  await api.delete(`/api/alimentos/${id}/`);
};
