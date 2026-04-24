import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ForgotMyPassword } from './components/ForgotMyPassword';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Resgister';
import { Profile } from './pages/config_profile';
import { Planos } from './pages/Plans';
import { Payments } from './pages/Payments';
import { Support } from './pages/Support';
import { FAQ } from './pages/FAQ';
import { Dashboard } from './pages/Dashboard';
import { Adm } from './pages/Adm';
import { CriarReceita } from './components/CreateRecipe';
import { ListaReceitas } from './components/RecipeList';
import { CadastroIngrediente } from './components/IngredientRegistration';
import { ListaIngredientes } from './components/IngredientsList';
import { RotuloNutricional } from './components/NutritionalLabel';
import { UsuarioLogado, Receita, Ingrediente } from './types';
import { login } from './services/auth';
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
  const [planoPreSelecionado, setPlanoPreSelecionado] = useState<'profissional' | 'empresarial' | undefined>(undefined);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [receitaEmEdicao, setReceitaEmEdicao] = useState<Receita | undefined>(undefined);
  const [receitaParaRotulo, setReceitaParaRotulo] = useState<Receita | null>(null);
  const [ingredienteEmEdicao, setIngredienteEmEdicao] = useState<Ingrediente | undefined>(undefined);

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
    const logado = login(data.email, data.senha);
    if (!logado) return false;
    setUsuario(logado);
    setTelaAtiva(logado.role === 'admin' ? 'adm' : 'dashboard');
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
    setTelaAtiva('dashboard');
  };



  const handleAssinarPlano = (planoId: 'profissional' | 'empresarial') => {
    setPlanoPreSelecionado(planoId);
    setTelaAtiva('pagamento');
  };

  const handleSalvarReceita = (receita: Receita) => {
    setReceitas((prev) =>
      prev.some((r) => r.id === receita.id)
        ? prev.map((r) => (r.id === receita.id ? receita : r))
        : [...prev, receita]
    );
    setReceitaEmEdicao(undefined);
    setTelaAtiva('receitas');
  };

  const handleRemoverReceita = (id: string) => {
    setReceitas((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSalvarIngrediente = (ingrediente: Ingrediente) => {
    setIngredientes((prev) =>
      prev.some((i) => i.id === ingrediente.id)
        ? prev.map((i) => (i.id === ingrediente.id ? ingrediente : i))
        : [...prev, ingrediente]
    );
    setIngredienteEmEdicao(undefined);
    setTelaAtiva('lista-ingredientes');
  };

  const handleRemoverIngrediente = (id: string) => {
    setIngredientes((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSair = () => {
    setUsuario(null);
    setTelaAtiva('login');
  };

  const renderTela = () => {
    switch (telaAtiva) {
      case 'home':
        return <Home onIrParaRegister={() => setTelaAtiva('register')} />;
      case 'dashboard':
        return (
          <Dashboard
            onNavegar={setTelaAtiva}
            receitas={receitas}
            totalIngredientes={ingredientes.length}
          />
        );
      case 'criar-receita':
        return (
          <CriarReceita
            receitaInicial={receitaEmEdicao}
            onSalvar={handleSalvarReceita}
            onCancelar={() => {
              setReceitaEmEdicao(undefined);
              window.history.back();
            }}
          />
        );
      case 'receitas':
        return (
          <ListaReceitas
            receitas={receitas}
            onEditar={(r) => { setReceitaEmEdicao(r); setTelaAtiva('criar-receita'); }}
            onRemover={handleRemoverReceita}
            onGerarRotulo={(r) => setReceitaParaRotulo(r)}
          />
        );
      case 'cadastro-ingrediente':
        return (
          <CadastroIngrediente
            ingredienteInicial={ingredienteEmEdicao}
            onSalvar={handleSalvarIngrediente}
            onCancelar={() => {
              setIngredienteEmEdicao(undefined);
              window.history.back();
            }}
          />
        );
      case 'lista-ingredientes':
        return (
          <ListaIngredientes
            ingredientes={ingredientes}
            onEditar={(i) => { setIngredienteEmEdicao(i); setTelaAtiva('cadastro-ingrediente'); }}
            onRemover={handleRemoverIngrediente}
          />
        );
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
            onUpgrade={() => setTelaAtiva('pagamento')}
          />
        );
      case 'planos':
        return <Planos onNavegar={setTelaAtiva} onAssinarPlano={handleAssinarPlano} usuario={usuario} />;
      case 'suporte':
        return <Support />;
      case 'faq':
        return <FAQ onNavegar={setTelaAtiva} />;
      case 'pagamento':
        return (
          <Payments
            usuario={usuario}
            planoPreSelecionado={planoPreSelecionado}
            onVoltar={() => setTelaAtiva('planos')}
            onLogin={() => setTelaAtiva('login')}
          />
        );
      case 'adm':
        return <Adm />;
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
      {receitaParaRotulo && (
        <RotuloNutricional
          receita={receitaParaRotulo}
          onFechar={() => setReceitaParaRotulo(null)}
          onImprimir={() => window.print()}
        />
      )}
    </div>
  );
}

export default App;
