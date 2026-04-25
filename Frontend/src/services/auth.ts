import api from './api';
import { UsuarioLogado } from '../types';

export const login = async (email: string, senha: string): Promise<UsuarioLogado | null> => {
  try {
    await api.post('/api/login/', { email, password: senha });
    // Após o login gerar os cookies, buscamos o perfil completo que tem os dados da empresa
    return await getSessao();
  } catch (error) {
    console.error('Erro no login', error);
    return null;
  }
};

export const registrar = async (
  dados: { email: string; senha: string; nomeEmpresarial?: string; nomeFantasia?: string; cnpj?: string; inscricaoEstadual?: string; telefone?: string },
  tipo: 'pf' | 'pj'
): Promise<{ sucesso: boolean; erro?: string; usuario?: UsuarioLogado }> => {
  try {
    const payload = {
      email: dados.email,
      password: dados.senha,
      username: dados.email.split('@')[0] + Math.floor(Math.random() * 1000), // Evita duplicação de username baseando-se no email
      razao_social: dados.nomeEmpresarial || dados.nomeFantasia || 'User',
      nome_fantasia: dados.nomeFantasia || 'User',
      cnpj: dados.cnpj || '00.000.000/0000-00', // Mock caso n venha pra evitar erro no DRF caso obrigatório
      inscricao_estadual: dados.inscricaoEstadual || '',
      telefone: dados.telefone || ''
    };
    
    const response = await api.post('/api/register/', payload);
    return { sucesso: true, usuario: response.data };
  } catch (error: any) {
    console.error('Erro no registro', error);
    let msg = 'Erro ao cadastrar';
    if (error.response?.data) {
       const errors = Object.values(error.response.data);
       if (errors.length > 0 && Array.isArray(errors[0])) {
           msg = errors[0][0] as string;
       }
    }
    return { sucesso: false, erro: msg };
  }
};

export const getSessao = async (): Promise<UsuarioLogado | null> => {
  try {
    const response = await api.get('/api/profile/');
    const user = response.data;
    return {
      id: user.id.toString(),
      nome: user.empresa?.nome_fantasia || user.username,
      email: user.email,
      role: 'user',
      empresa: user.empresa,
    };
  } catch (error) {
    return null;
  }
};

export const encerrarSessao = async (): Promise<void> => {
  try {
    await api.post('/api/logout/');
  } catch (error) {
    console.error('Erro no logout', error);
  }
};

export const atualizarPerfil = async (dados: any): Promise<boolean> => {
  try {
    const payload: any = {
      email: dados.email,
      username: dados.email.split('@')[0], // username can't be null in DRF
      empresa: {
        razao_social: dados.nomeEmpresarial,
        nome_fantasia: dados.nomeFantasia,
        inscricao_estadual: dados.inscricaoEstadual,
        telefone: dados.telefone,
        cnpj: dados.cnpj || ''
      }
    };
    
    if (dados.novaSenha) {
      payload.password = dados.novaSenha;
    }

    await api.patch('/api/profile/', payload);
    return true;
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error.response?.data || error.message);
    return false;
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    await api.post('/api/password-reset/request/', { email });
    return true;
  } catch (error) {
    return false;
  }
};

export const validateResetCode = async (email: string, codigo: string) => {
  try {
    await api.post('/api/password-reset/validate/', { email, codigo });
    return true;
  } catch (error) {
    return false;
  }
};

export const resetPassword = async (email: string, codigo: string, novaSenha: string) => {
  try {
    await api.post('/api/password-reset/confirm/', { email, codigo, novaSenha });
    return true;
  } catch (error) {
    return false;
  }
};
