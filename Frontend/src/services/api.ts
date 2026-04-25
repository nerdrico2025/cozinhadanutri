import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // Importante para enviar os cookies HttpOnly
});

// Interceptor para lidar com erros comuns, como 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Exemplo: se der 401 e não estivermos na rota de login, podemos redirecionar ou limpar dados
    if (error.response && error.response.status === 401) {
      console.error('Não autorizado ou sessão expirada');
      // Opcional: emitir evento ou redirecionar
    }
    return Promise.reject(error);
  }
);

export default api;
