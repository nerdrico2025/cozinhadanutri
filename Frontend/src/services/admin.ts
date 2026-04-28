import api from './api';

export interface UsuarioAdmin {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  receitas_count: number;
  rotulos_count: number;
  empresa: {
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    inscricao_estadual: string;
    telefone: string;
    plano: string;
  };
}

export interface AtividadeAdmin {
  id: number;
  usuario_nome: string;
  empresa_nome: string;
  acao: string;
  tipo: 'login' | 'logout' | 'cadastro' | 'receita' | 'rotulo' | 'ingrediente' | 'plano';
  data_hora: string;
}

export const listarUsuariosAdmin = async (): Promise<UsuarioAdmin[]> => {
  try {
    const response = await api.get('/api/admin/users/');
    return response.data;
  } catch (error) {
    console.error('Erro ao listar usuários admin:', error);
    return [];
  }
};

export const atualizarUsuarioAdmin = async (id: string, dados: { is_active?: boolean; plano?: string }): Promise<boolean> => {
  try {
    await api.patch(`/api/admin/users/${id}/`, dados);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar usuário admin:', error);
    return false;
  }
};

export const listarAtividadesAdmin = async (): Promise<AtividadeAdmin[]> => {
  try {
    const response = await api.get('/api/admin/activities/');
    return response.data;
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    return [];
  }
};
