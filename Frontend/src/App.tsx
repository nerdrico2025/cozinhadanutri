import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ForgotMyPassword } from './components/ForgotMyPassword';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Resgister';
import { Profile } from './pages/config_profile';
import { UsuarioLogado } from './types';
import {Footer} from './components/Footer';
import './App.css';

type TelaAtiva =
  | 'home'
  | 'dashboard'
  | 'receitas'
  | 'criar-receita'
  | 'cadastro-ingrediente'
  | 'lista-ingredientes'
  | 'login'
  | 'register'
  | 'esqueci-senha'
  | 'perfil'
  | 'planos'
  | 'faq'
  | 'suporte'
  | 'termos'
  | 'pagamento'
  | 'adm';


const validTelas: TelaAtiva[] = [
  'home', 'login', 'register', 'esqueci-senha', 'perfil',
  'dashboard', 'receitas', 'criar-receita', 'cadastro-ingrediente',
  'lista-ingredientes', 'planos', 'faq', 'suporte', 'termos', 'pagamento', 'adm',
];

const getTelaFromHash = (): TelaAtiva => {
  const hash = window.location.hash.replace('#', '') as TelaAtiva;
  return validTelas.includes(hash) ? hash : 'home';
};

function App() {
  const [telaAtiva, setTelaAtivaState] = useState<TelaAtiva>(getTelaFromHash);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  const setTelaAtiva = (tela: TelaAtiva) => {
    window.history.pushState({ tela }, '', `#${tela}`);
    setTelaAtivaState(tela);
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.tela && validTelas.includes(event.state.tela)) {
        setTelaAtivaState(event.state.tela as TelaAtiva);
      } else {
        setTelaAtivaState(getTelaFromHash());
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = async (data: { email: string; senha: string }): Promise<boolean> => {
    // TODO: integrar com serviço de autenticação
    const usuarioMock: UsuarioLogado = {
      id: '1',
      nome: data.email.split('@')[0],
      email: data.email,
      role: 'user',
    };
    setUsuario(usuarioMock);
    setTelaAtiva('home');
    return true;
  };

  const handleRegistro = (
    dados: { email: string; senha: string; nomeCompleto?: string; nomeFantasia?: string },
    tipo: 'pf' | 'pj'
  ) => {
    void tipo;
    // TODO: integrar com serviço de registro
    const usuarioMock: UsuarioLogado = {
      id: '1',
      nome: dados.nomeCompleto ?? dados.nomeFantasia ?? dados.email.split('@')[0],
      email: dados.email,
      role: 'user',
    };
    setUsuario(usuarioMock);
    setTelaAtiva('home');
  };



  const handleSair = () => {
    setUsuario(null);
    setTelaAtiva('login');
  };

  const renderTela = () => {
    switch (telaAtiva) {
      case 'home':
        return <Home onIrParaRegister={() => setTelaAtiva('register')} />;
      case 'login':
        return (
          <Login
            onEntrar={handleLogin}
            onCriarConta={() => setTelaAtiva('register')}
            onEsqueciSenha={() => setTelaAtiva('esqueci-senha')}
          />
        );
      case 'register':
        return (
          <Register
            onJaTemConta={() => setTelaAtiva('login')}
            onCadastroSucesso={(dados, tipo) =>
              handleRegistro(
                dados as { email: string; senha: string; nomeCompleto?: string; nomeFantasia?: string },
                tipo
              )
            }
          />
        );
      case 'esqueci-senha':
        return <ForgotMyPassword onVoltar={() => setTelaAtiva('login')} />;
      case 'perfil':
        return (
          <Profile
            dadosIniciais={usuario ? {
              nomeEmpresarial: usuario.nome,
              nomeFantasia:    usuario.nome,
              cnpj:            '',
              inscricaoEstadual: '',
              telefone:        '',
              email:           usuario.email,
            } : undefined}
            onSalvar={async (_dados) => {
              // TODO: integrar com serviço de atualização de perfil
              return true;
            }}
            onVoltar={() => setTelaAtiva('home')}
          />
        );
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header telaAtiva={telaAtiva} onNavegar={setTelaAtiva} onSair={handleSair} usuario={usuario} />
      <main className="flex-1 w-full">
        {renderTela()}
      </main>
      <Footer onNavegar={setTelaAtiva} />
    </div>
  );
}

export default App;
