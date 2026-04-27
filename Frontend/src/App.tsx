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
import { PostRegisterPlans } from './pages/PostRegisterPlans';
import { UsuarioLogado, Receita, Ingrediente } from './types';
import { login, registrar, getSessao, encerrarSessao, atualizarPerfil, requestPasswordReset, validateResetCode, resetPassword, apagarConta } from './services/auth';
import { listarAlimentos, salvarAlimento, excluirAlimento } from './services/alimentos';
import { salvarReceita, excluirReceita, listarReceitas } from './services/receitas';
import { calcularCustosReceita, calcularNutrientesTotais, calcularDadosNutricionaisPorPorcao } from './utils/calculations';
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
  | 'adm'
  | 'boas-vindas';


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
  const [rascunhoReceita, setRascunhoReceita] = useState<Receita | undefined>(undefined);

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
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Verifica sessão ativa via cookies
  useEffect(() => {
    const checkSession = async () => {
      const sessao = await getSessao();
      if (sessao) {
         setUsuario(sessao);
      }
    };
    checkSession();
  }, []);

  // Carrega os alimentos do backend quando o usuário loga
  useEffect(() => {
    if (!usuario) return;

    const fetchIngredientes = async () => {
      try {
        const dadosBackend = await listarAlimentos();
        const parseados: Ingrediente[] = dadosBackend.map((item: any) => ({
          id: item.id,
          tacoId: item.numero,
          nome: item.descricao,
          unidade: item.unidade_medida || 'g',
          preco: parseFloat(item.preco) || 0,
          dadosNutricionais: {
            calorias: parseFloat(item.energia_kcal) || 0,
            proteinas: parseFloat(item.proteina) || 0,
            carboidratos: parseFloat(item.carboidrato) || 0,
            gorduras: parseFloat(item.lipideos) || 0,
            acucares_totais: parseFloat(item.acucares_totais) || 0,
            acucares_adicionados: parseFloat(item.acucares_adicionados) || 0,
            gorduras_saturadas: parseFloat(item.saturados) || 0,
            gorduras_trans: parseFloat(item.AG18_1t) + parseFloat(item.AG18_2t) || 0,
            fibras: parseFloat(item.fibra_alimentar) || 0,
            sodio: parseFloat(item.sodio) || 0,
            vitaminas: parseFloat(item.vitaminas) || 0,
            minerais: parseFloat(item.minerais) || 0,
          },
          createdAt: new Date(),
        }));
        setIngredientes(parseados);
      } catch (err) {
        console.error("Erro ao listar alimentos:", err);
      }
    };

    fetchIngredientes();
  }, [usuario]);

  // Carrega as receitas do backend quando o usuário loga ou os ingredientes mudam
  useEffect(() => {
    if (!usuario || ingredientes.length === 0) return;

    const fetchReceitas = async () => {
      try {
        const dadosBackend = await listarReceitas();
        const parseadas: Receita[] = dadosBackend.map((r: any) => {
          // Busca os dados nutricionais completos de cada ingrediente para calcular o total da receita
          const ingredientesComNutrientes = r.ingredientes.map((ing: any) => {
            const base = ingredientes.find(i => i.tacoId === ing.alimento);
            return {
              quantidade: parseFloat(ing.quantidade),
              dadosNutricionais: base?.dadosNutricionais || {
                calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
                acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
                gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
              }
            };
          });

          const nutriTotais = calcularNutrientesTotais(ingredientesComNutrientes);
          const nutriPorPorcao = calcularDadosNutricionaisPorPorcao(nutriTotais, r.porcoes);
          const custos = calcularCustosReceita(
            r.ingredientes.map((ing: any) => ({ 
              quantidade: parseFloat(ing.quantidade), 
              preco: parseFloat(ing.preco_personalizado) 
            })),
            r.porcoes,
            parseFloat(r.margem_lucro)
          );

          return {
            id: String(r.id),
            nome: r.nome,
            descricao: r.descricao,
            porcoes: r.porcoes,
            margemLucro: parseFloat(r.margem_lucro),
            ingredientes: r.ingredientes.map((ing: any) => ({
              tacoId: ing.alimento,
              nome: ing.nome,
              quantidade: parseFloat(ing.quantidade),
              preco: parseFloat(ing.preco_personalizado)
            })),
            custoTotal: custos.custoTotal,
            custoPorPorcao: custos.custoPorPorcao,
            precoSugerido: custos.precoSugerido,
            dadosNutricionaisTotais: nutriTotais,
            dadosNutricionaisPorPorcao: nutriPorPorcao,
            createdAt: new Date(r.criado_em)
          };
        });
        setReceitas(parseadas);
      } catch (err) {
        console.error("Erro ao listar receitas:", err);
      }
    };

    fetchReceitas();
  }, [usuario, ingredientes]);

  const handleLogin = async (data: { email: string; senha: string }): Promise<boolean> => {
    const logado = await login(data.email, data.senha);
    if (!logado) return false;
    setUsuario(logado);
    setTelaAtiva(logado.role === 'admin' ? 'adm' : 'dashboard');
    return true;
  };

  const handleRegistro = async (
    dados: { email: string; senha: string; nomeEmpresarial?: string; nomeFantasia?: string; cnpj?: string; inscricaoEstadual?: string; telefone?: string },
    tipo: 'pf' | 'pj'
  ) => {
    const response = await registrar(dados, tipo);
    if (response.sucesso) {
      // Tenta logar automaticamente após o registro bem-sucedido
      const logado = await login(dados.email, dados.senha);
      if (logado) {
        setUsuario(logado);
        if (rascunhoReceita) {
          setTelaAtiva('criar-receita');
        } else {
          setTelaAtiva('boas-vindas');
        }
      } else {
        // Se falhar o login automático, manda pro login manual
        setTelaAtiva('login');
      }
    } else {
      alert(response.erro || "Erro ao registrar");
    }
  };



  const handleAssinarPlano = (planoId: 'profissional' | 'empresarial') => {
    setPlanoPreSelecionado(planoId);
    setTelaAtiva('pagamento');
  };

  const handleSalvarReceita = async (receita: Partial<Receita>) => {
    try {
      const salva = await salvarReceita(receita);
      
      const ingredientesComNutrientes = salva.ingredientes.map((ing: any) => {
        const base = ingredientes.find(i => i.tacoId === ing.alimento);
        return {
          quantidade: parseFloat(ing.quantidade),
          dadosNutricionais: base?.dadosNutricionais || {
            calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
            acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
            gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
          }
        };
      });

      const nutriTotais = calcularNutrientesTotais(ingredientesComNutrientes);
      const nutriPorPorcao = calcularDadosNutricionaisPorPorcao(nutriTotais, salva.porcoes);
      const custos = calcularCustosReceita(
        salva.ingredientes.map((ing: any) => ({ 
          quantidade: parseFloat(ing.quantidade), 
          preco: parseFloat(ing.preco_personalizado) 
        })),
        salva.porcoes,
        parseFloat(salva.margem_lucro)
      );

      const parseada: Receita = {
        id: String(salva.id),
        nome: salva.nome,
        descricao: salva.descricao,
        porcoes: salva.porcoes,
        margemLucro: parseFloat(salva.margem_lucro),
        ingredientes: salva.ingredientes.map((ing: any) => ({
          tacoId: ing.alimento,
          nome: ing.nome,
          quantidade: parseFloat(ing.quantidade),
          preco: parseFloat(ing.preco_personalizado)
        })),
        custoTotal: custos.custoTotal,
        custoPorPorcao: custos.custoPorPorcao,
        precoSugerido: custos.precoSugerido,
        dadosNutricionaisTotais: nutriTotais,
        dadosNutricionaisPorPorcao: nutriPorPorcao,
        createdAt: new Date(salva.criado_em)
      };

      setReceitas((prev) =>
        prev.some((r) => r.id === parseada.id)
          ? prev.map((r) => (r.id === parseada.id ? parseada : r))
          : [...prev, parseada]
      );
      setReceitaEmEdicao(undefined);
      setTelaAtiva('receitas');
    } catch (err: any) {
      console.error("Erro ao salvar receita:", err);
      if (err.response?.status === 401) {
        alert("Sua sessão expirou. Por favor, faça login novamente para salvar.");
        setTelaAtiva('login');
      } else {
        alert("Falha ao salvar a receita no servidor. Verifique os dados e tente novamente.");
      }
    }
  };

  const handleRemoverReceita = async (id: string, senha?: string) => {
    try {
      if (!usuario || !senha) return;
      
      // Validação redundante de senha
      const validado = await login(usuario.email, senha);
      if (!validado) {
        alert("Senha incorreta. A exclusão foi cancelada.");
        return;
      }

      await excluirReceita(id);
      setReceitas((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Erro ao excluir receita:", err);
      alert("Erro ao excluir receita no servidor.");
    }
  };

  const handleSalvarIngrediente = async (ingrediente: Ingrediente) => {
    try {
      const itemSalvo = await salvarAlimento(ingrediente, ingrediente.tacoId);
      const ingredienteParseado: Ingrediente = {
        id: itemSalvo.id,
        tacoId: itemSalvo.numero,
        nome: itemSalvo.descricao,
        unidade: itemSalvo.unidade_medida || 'g',
        preco: parseFloat(itemSalvo.preco) || 0,
        dadosNutricionais: {
          calorias: parseFloat(itemSalvo.energia_kcal) || 0,
          proteinas: parseFloat(itemSalvo.proteina) || 0,
          carboidratos: parseFloat(itemSalvo.carboidrato) || 0,
          gorduras: parseFloat(itemSalvo.lipideos) || 0,
          acucares_totais: parseFloat(itemSalvo.acucares_totais) || 0,
          acucares_adicionados: parseFloat(itemSalvo.acucares_adicionados) || 0,
          gorduras_saturadas: parseFloat(itemSalvo.saturados) || 0,
          gorduras_trans: parseFloat(itemSalvo.AG18_1t) + parseFloat(itemSalvo.AG18_2t) || 0,
          fibras: parseFloat(itemSalvo.fibra_alimentar) || 0,
          sodio: parseFloat(itemSalvo.sodio) || 0,
          vitaminas: parseFloat(itemSalvo.vitaminas) || 0,
          minerais: parseFloat(itemSalvo.minerais) || 0,
        },
        createdAt: new Date(),
      };

      setIngredientes((prev) =>
        prev.some((i) => i.id === ingredienteParseado.id)
          ? prev.map((i) => (i.id === ingredienteParseado.id ? ingredienteParseado : i))
          : [...prev, ingredienteParseado]
      );

      // Se houver rascunho de receita, volta para ela
      if (rascunhoReceita) {
        setTelaAtiva('criar-receita');
      }
    } catch (err) {
      console.error("Erro ao salvar ingrediente:", err);
      alert("Falha ao salvar o ingrediente no servidor.");
      throw err;
    }
  };

  const handleRemoverIngrediente = async (id: string, senha?: string) => {
    try {
      if (!usuario || !senha) return;

      // Validação redundante de senha
      const validado = await login(usuario.email, senha);
      if (!validado) {
        alert("Senha incorreta. A exclusão foi cancelada.");
        return;
      }

      await excluirAlimento(Number(id));
      setIngredientes((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Erro ao remover ingrediente:", err);
      alert("Falha ao remover o ingrediente no servidor.");
    }
  };

  const handleSair = async () => {
    await encerrarSessao();
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
            receitaInicial={receitaEmEdicao || rascunhoReceita}
            onSalvar={(r) => {
              handleSalvarReceita(r);
              setRascunhoReceita(undefined);
            }}
            onSolicitarCadastro={(dados, rascunho) => {
              setRascunhoReceita(rascunho);
              setIngredienteEmEdicao(dados as Ingrediente);
              setTelaAtiva('cadastro-ingrediente');
            }}
            onCancelar={() => {
              setReceitaEmEdicao(undefined);
              setRascunhoReceita(undefined);
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
            onVerLista={() => { setIngredienteEmEdicao(undefined); setTelaAtiva('lista-ingredientes'); }}
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
        return (
          <ForgotMyPassword 
            onVoltar={() => setTelaAtiva('login')} 
            onEnviarEmail={requestPasswordReset}
            onVerificarCodigo={validateResetCode}
            onRedefinirSenha={resetPassword}
          />
        );
      case 'boas-vindas':
        return (
          <PostRegisterPlans
            usuario={usuario}
            onNavegar={setTelaAtiva}
            onAssinarPlano={(planoId) => {
              setPlanoSelecionado(planoId);
              setTelaAtiva('pagamento');
            }}
          />
        );
      case 'perfil':
        return (
          <Profile
            dadosIniciais={usuario ? {
              nomeEmpresarial: usuario.empresa?.razao_social || usuario.nome,
              nomeFantasia:    usuario.empresa?.nome_fantasia || usuario.nome,
              cnpj:            usuario.empresa?.cnpj || '',
              inscricaoEstadual: usuario.empresa?.inscricao_estadual || '',
              telefone:        usuario.empresa?.telefone || '',
              email:           usuario.email,
            } : undefined}
            onSalvar={async (dados, senhaAtual) => {
              if (!usuario) return false;
              // Valida a senha usando o fluxo de login
              const senhaValida = await login(usuario.email, senhaAtual);
              if (!senhaValida) return false;

              const sucesso = await atualizarPerfil({ ...dados, cnpj: usuario.empresa?.cnpj });
              if (sucesso) {
                 const novaSessao = await getSessao();
                 if (novaSessao) setUsuario(novaSessao);
              }
              return sucesso;
            }}
            onVoltar={() => setTelaAtiva('home')}
            onUpgrade={() => setTelaAtiva('pagamento')}
            onApagarConta={async (senhaAtual) => {
              if (!usuario) return false;
              // Valida a senha usando o fluxo de login
              const senhaValida = await login(usuario.email, senhaAtual);
              if (!senhaValida) return false;

              const sucesso = await apagarConta();
              if (sucesso) {
                setUsuario(null);
                setTelaAtiva('home');
                return true;
              } else {
                alert("Erro ao apagar a conta. Tente novamente.");
                return false;
              }
            }}
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
