import { UsuarioLogado } from '../types';

const STORAGE_KEY = 'cdn_usuarios';
const SESSION_KEY = 'cdn_sessao';

interface UsuarioSessao extends UsuarioLogado {
  senha: string;
}

const usuariosFixos: UsuarioSessao[] = [
  { id: 'admin', nome: 'Administrador', email: 'admin@cozinhadanutri.com', senha: '12345678', role: 'admin' },
];

function carregarUsuarios(): UsuarioSessao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const salvos: UsuarioSessao[] = raw ? JSON.parse(raw) : [];
    return [...usuariosFixos, ...salvos];
  } catch {
    return [...usuariosFixos];
  }
}

function salvarUsuario(novo: UsuarioSessao): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const salvos: UsuarioSessao[] = raw ? JSON.parse(raw) : [];
    salvos.push(novo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(salvos));
  } catch {
    // se localStorage não estiver disponível, ignora
  }
}

export function login(email: string, senha: string): UsuarioLogado | null {
  const usuarios = carregarUsuarios();
  const encontrado = usuarios.find((u) => u.email === email && u.senha === senha);
  if (!encontrado) return null;
  const { senha: _s1, ...logado } = encontrado;
  void _s1;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(logado));
  } catch {
    // ignora
  }
  return logado;
}

export function registrar(
  dados: { email: string; senha: string; nomeCompleto?: string; nomeFantasia?: string },
  tipo: 'pf' | 'pj'
): { sucesso: false; erro: string } | { sucesso: true; usuario: UsuarioLogado } {
  const usuarios = carregarUsuarios();
  if (usuarios.some((u) => u.email === dados.email)) {
    return { sucesso: false, erro: 'Este e-mail já está cadastrado.' };
  }
  const nome = tipo === 'pf' ? (dados.nomeCompleto ?? 'Usuário') : (dados.nomeFantasia ?? 'Usuário');
  const novo: UsuarioSessao = { id: String(Date.now()), nome, email: dados.email, senha: dados.senha, role: 'user' };
  salvarUsuario(novo);
  const { senha: _s2, ...logado } = novo;
  void _s2;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(logado));
  } catch {
    // ignora
  }
  return { sucesso: true, usuario: logado };
}

export function getSessao(): UsuarioLogado | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UsuarioLogado) : null;
  } catch {
    return null;
  }
}

export function encerrarSessao(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignora
  }
}
