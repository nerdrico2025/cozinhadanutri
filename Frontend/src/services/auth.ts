import api from './api';
import { UsuarioLogado } from '../types';

export const login = async (email: string, senha: string): Promise<UsuarioLogado | null> => {
  try {
    const response = await api.post('/api/login/', { email, password: senha });
    const { access, refresh } = response.data;
    
    // Salva os tokens no localStorage
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    
    // Após o login, busca o perfil completo
    return await getSessao();
  } catch (error) {
    console.error('Erro no login', error);
    return null;
  }
};

export const registrar = async (
  dados: { email: string; senha: string; nomeEmpresarial?: string; nomeFantasia?: string; cnpj?: string; inscricaoEstadual?: string; telefone?: string },
  _tipo: 'pf' | 'pj'
): Promise<{ sucesso: boolean; erro?: string; usuario?: UsuarioLogado }> => {
  try {
    const payload = {
      email: dados.email,
      password: dados.senha,
      username: dados.email.split('@')[0] + Math.floor(Math.random() * 1000),
      razao_social: dados.nomeEmpresarial || dados.nomeFantasia || 'User',
      nome_fantasia: dados.nomeFantasia || 'User',
      cnpj: (dados.cnpj || '00000000000000').replace(/\D/g, '').slice(0, 14),
      inscricao_estadual: dados.inscricaoEstadual || '',
      telefone: dados.telefone || ''
    };
    
    const response = await api.post('/api/register/', payload);
    return { sucesso: true, usuario: response.data };
  } catch (error) {
    console.error('Erro no registro', error);
    let msg = 'Erro ao cadastrar';
    // @ts-expect-error - error.response existe em erros de axios
    if (error.response?.data) {
      // @ts-expect-error - error.response existe em erros de axios
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
/*     console.log('DADOS DO PERFIL RECEBIDOS:', user); */
    let planoAtual: 'gratis' | 'profissional' | 'empresarial' = 'gratis';
    const planoId = user.empresa?.plano;
    if (planoId === 2) {
      planoAtual = 'profissional';
    } else if (planoId === 3) {
      planoAtual = 'empresarial';
    }

    return {
      id: user.id.toString(),
      nome: user.empresa?.nome_fantasia || user.username,
      email: user.email,
      role: user.is_superuser ? 'admin' : 'user',
      planoAtual: planoAtual,
      empresa: user.empresa,
    };
  } catch {
    return null;
  }
};

export const encerrarSessao = async (): Promise<void> => {
  try {
    await api.post('/api/logout/');
  } catch {
    console.error('Erro no logout');
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

export const atualizarPerfil = async (dados: any): Promise<boolean> => {
  try {
    const payload: any = {
      email: dados.email,
      username: dados.email.split('@')[0],
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

    await api.patch('/api/profile/update/', payload);
    return true;
  } catch (error) {
    // @ts-expect-error - error.response existe em erros de axios
    console.error('Erro ao atualizar perfil:', error.response?.data || error.message);
    return false;
  }
};

export const resetPassword = async (email: string, codigo?: string, novaSenha?: string): Promise<boolean> => {
  try {
    const payload: any = { email };
    if (codigo && novaSenha) {
      payload.codigo = codigo;
      payload.nova_senha = novaSenha;
    }
    await api.post('/api/password-reset/', payload);
    return true;
  } catch {
    console.error('Erro na recuperação de senha');
    return false;
  }
};

export const apagarConta = async (): Promise<boolean> => {
  try {
    await api.delete('/api/delete/');
    return true;
  } catch {
    console.error('Erro ao apagar conta');
    return false;
  }
};