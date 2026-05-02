import api from './api';
import { Receita } from '../types';

export const listarReceitas = async () => {
  const response = await api.get('/api/receitas/');
  return response.data;
};

export const salvarReceita = async (receita: Partial<Receita>) => {
  // Converte do formato do frontend para o formato do backend
  const payload = {
    nome: receita.nome,
    descricao: receita.descricao,
    porcoes: receita.porcoes,
    margem_lucro: receita.margemLucro,
    ingredientes: receita.ingredientes?.map(ing => ({
      alimento: ing.tacoId, // O backend espera o ID do alimento
      quantidade: ing.quantidade,
      preco_personalizado: ing.preco
    }))
  };

  if (receita.id && !isNaN(Number(receita.id))) {
    const response = await api.put(`/api/receitas/${receita.id}/`, payload);
    return response.data;
  } else {
    const response = await api.post('/api/receitas/', payload);
    return response.data;
  }
};

export const excluirReceita = async (id: string | number) => {
  await api.delete(`/api/receitas/${id}/`);
};
