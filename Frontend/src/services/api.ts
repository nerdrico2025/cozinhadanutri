import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true, // Importante para enviar os cookies HttpOnly
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com erros comuns, como 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Exemplo: se der 401 e não estivermos na rota de login, podemos redirecionar ou limpar dados
    const url: string = error.config?.url ?? '';
    if (error.response && error.response.status === 401 && !url.includes('/api/login/')) {
      console.error('Não autorizado ou sessão expirada');
      // Limpa tokens inválidos
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return Promise.reject(error);
  }
);

export default api;