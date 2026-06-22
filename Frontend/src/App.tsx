import { useState, useEffect } from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
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
import { NotFound } from './pages/NotFound';
import { CriarReceita } from './components/CreateRecipe';
import { ListaReceitas } from './components/RecipeList';
import { CreateMeal } from './components/CreateMeal';
import { MealList } from './components/MealList';
import { ExpenseControl } from './components/ExpenseControl';
import { Inventory } from './components/Inventory';
import { CadastroIngrediente } from './components/IngredientRegistration';
import { ListaIngredientes } from './components/IngredientsList';
import { RotuloNutricional } from './components/NutritionalLabel';
import { ProductionRegister } from './components/ProductionRegister';
import { Statistic } from './components/Statistic';
import { PostRegisterPlans } from './pages/PostRegisterPlans';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { UsuarioLogado, Receita, Ingrediente, Refeicao } from './types';
import { login, registrar, getSessao, encerrarSessao, atualizarPerfil, resetPassword, apagarConta } from './services/auth';
import { listarAlimentos, salvarAlimento, excluirAlimento } from './services/alimentos';
import { salvarReceita, excluirReceita, listarReceitas } from './services/receitas';
import { calcularCustosReceita, calcularNutrientesTotais, calcularDadosNutricionaisPorPorcao } from './utils/calculations';
import { Footer } from './components/Footer';
import ConfiguracaoVisual from './pages/configuracaovisual/edicaodinamicadecampos';
import { Etiqueta } from './pages/Etiqueta';
import { Sidebar } from './components/Sidebar';
import './App.css';


type TelaAtiva =
  | 'home'
  | 'dashboard'
  | 'receitas'
  | 'criar-receita'
  | 'cadastro-ingrediente'
  | 'lista-ingredientes'
  | 'estoque'
  | 'refeicao'
  | 'despesas'
  | 'producao'
  | 'estatisticas'
  | 'aulas'
  | 'login'
  | 'register'
  | 'esqueci-senha'
  | 'perfil'
  | 'planos'
  | 'faq'
  | 'suporte'
  | 'termos'
  | 'privacidade'
  | 'pagamento'
  | 'adm'
  | 'boas-vindas'
  | 'not-found'
  | 'configuracaovisual'
  | 'lista-refeicoes'
  | 'etiqueta';


const validTelas: TelaAtiva[] = [
  'home', 'login', 'register', 'esqueci-senha', 'perfil',
  'dashboard', 'receitas', 'criar-receita', 'cadastro-ingrediente',
  'lista-ingredientes', 'refeicao', 'lista-refeicoes', 'despesas', 'producao', 'estatisticas', 'aulas', 'planos', 'faq', 'suporte', 'termos', 'privacidade', 'pagamento', 'adm', 'boas-vindas', 'not-found', 'configuracaovisual', 'etiqueta'
];

const getTelaFromHash = (): TelaAtiva => {
  const hash = window.location.hash.replace('#', '').split('?')[0] as TelaAtiva;
  if (!hash) return 'home';
  return validTelas.includes(hash) ? hash : 'not-found';
};

function App() {
  const [telaAtiva, setTelaAtivaState] = useState<TelaAtiva>(getTelaFromHash);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [planoPreSelecionado, setPlanoPreSelecionado] = useState<'profissional' | 'empresarial' | undefined>(undefined);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(() => {
    try {
      const salvas = localStorage.getItem('refeicoes');
      return salvas ? JSON.parse(salvas) : [];
    } catch {
      return [];
    }
  });
  const [refeicaoEmEdicao, setRefeicaoEmEdicao] = useState<Refeicao | undefined>(undefined);
  const [rascunhoRefeicao, setRascunhoRefeicao] = useState<Refeicao | undefined>(undefined);
  const [receitaEmEdicao, setReceitaEmEdicao] = useState<Receita | undefined>(undefined);
  const [receitaParaRotulo, setReceitaParaRotulo] = useState<Receita | null>(null);
  const [ingredienteEmEdicao, setIngredienteEmEdicao] = useState<Ingrediente | undefined>(undefined);
  const [rascunhoReceita, setRascunhoReceita] = useState<Receita | undefined>(undefined);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [planoSelecionado, setPlanoSelecionado] = useState<'profissional' | 'empresarial' | undefined>(undefined);
  const [modalLimiteAberto, setModalLimiteAberto] = useState(false);

  const publicTelas: TelaAtiva[] = ['home', 'login', 'register', 'esqueci-senha', 'faq', 'suporte', 'termos', 'privacidade', 'not-found', 'planos'];

  const isDashboardScreen = !!usuario && [
    'dashboard', 'receitas', 'criar-receita', 'cadastro-ingrediente',
    'lista-ingredientes', 'estoque', 'refeicao', 'lista-refeicoes', 'despesas', 'producao', 'estatisticas', 'aulas', 'perfil'
  ].includes(telaAtiva);

  const setTelaAtiva = (tela: TelaAtiva) => {
    window.history.pushState({ tela }, '', `#${tela}`);
    setTelaAtivaState(tela);
  };

  useEffect(() => {
    const handlePopState = () => {
      setTelaAtivaState(getTelaFromHash());
    };
    
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Verifica sessão ativa via cookies
  const checkSession = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUsuario(null);
      setCarregandoSessao(false);
      return;
    }
    try {
      const sessao = await getSessao();
      if (sessao) {
         setUsuario(sessao);
      } else {
         setUsuario(null);
      }
    } catch (err) {
      setUsuario(null);
    } finally {
      setCarregandoSessao(false);
    }
  };

  useEffect(() => {
    checkSession();
    
    // Re-verifica sessão quando a aba ganha foco ou a sessão é atualizada (ex: troca de plano)
    const handleFocus = () => checkSession();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('session_updated', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('session_updated', handleFocus);
    };
  }, []);

  // Proteção de Rotas
  useEffect(() => {
    if (!carregandoSessao && !usuario && !publicTelas.includes(telaAtiva)) {
      setTelaAtiva('login');
    }
    
    // Se for admin e tentar acessar dashboard, manda pro adm
    if (!carregandoSessao && usuario?.role === 'admin' && telaAtiva === 'dashboard') {
      setTelaAtiva('adm');
    }
  }, [telaAtiva, usuario, carregandoSessao]);

  // Carrega os alimentos do backend quando o usuário loga
  useEffect(() => {
    if (!usuario) return;

    const fetchIngredientes = async () => {
      try {
        const dadosBackend = await listarAlimentos();
        const parseTacoVal = (val: any) => parseFloat(String(val || '0').replace(',', '.')) || 0;
        const parseados: Ingrediente[] = dadosBackend.map((item: any) => ({
          id: String(item.id),
          tacoId: item.numero,
          nome: item.descricao,
          unidade: item.unidade_medida === 'un' ? 'unidade' : (item.unidade_medida || 'g'),
          preco: parseTacoVal(item.preco),
          dadosNutricionais: {
            calorias: parseTacoVal(item.energia_kcal),
            proteinas: parseTacoVal(item.proteina),
            carboidratos: parseTacoVal(item.carboidrato),
            gorduras: parseTacoVal(item.lipideos),
            acucares_totais: parseTacoVal(item.acucares_totais),
            acucares_adicionados: parseTacoVal(item.acucares_adicionados),
            gorduras_saturadas: parseTacoVal(item.saturados),
            gorduras_trans: parseTacoVal(item.AG18_1t) + parseTacoVal(item.AG18_2t),
            fibras: parseTacoVal(item.fibra_alimentar),
            sodio: parseTacoVal(item.sodio),
            vitaminas: parseTacoVal(item.vitaminas),
            minerais: parseTacoVal(item.minerais),
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
            const base = ingredientes.find(i => String(i.id) === String(ing.alimento));
            return {
              quantidade: parseFloat(ing.quantidade),
              dadosNutricionais: base?.dadosNutricionais || {
                calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
                acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
                gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
              },
              unidade: base?.unidade || 'g'
            };
          });

          const nutriTotais = calcularNutrientesTotais(ingredientesComNutrientes);
          const nutriPorPorcao = calcularDadosNutricionaisPorPorcao(nutriTotais, r.porcoes);
          const custos = calcularCustosReceita(
            r.ingredientes.map((ing: any) => {
              const base = ingredientes.find(i => String(i.id) === String(ing.alimento));
              return { 
                quantidade: parseFloat(ing.quantidade), 
                preco: parseFloat(ing.preco_personalizado),
                unidade: base?.unidade || 'g'
              };
            }),
            r.porcoes,
            parseFloat(r.margem_lucro)
          );

          return {
            id: String(r.id),
            nome: r.nome,
            descricao: r.descricao,
            porcoes: r.porcoes,
            margemLucro: parseFloat(r.margem_lucro),
            ingredientes: r.ingredientes.map((ing: any) => {
              const base = ingredientes.find(i => String(i.id) === String(ing.alimento));
              return {
                tacoId: ing.alimento,
                nome: ing.nome,
                quantidade: parseFloat(ing.quantidade),
                preco: parseFloat(ing.preco_personalizado),
                unidade: base?.unidade || 'g'
              };
            }),
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
    console.log('USUARIO LOGADO:', logado.email, 'ROLE:', logado.role);
    
    // Ordem de prioridade no redirecionamento:
    if (planoPreSelecionado) {
      console.log('REDIRECIONANDO PARA: pagamento (plano pre-selecionado)');
      setTelaAtiva('pagamento');
    } else if (rascunhoReceita) {
      console.log('REDIRECIONANDO PARA: criar-receita (rascunho)');
      setTelaAtiva('criar-receita');
    } else if (logado.role === 'admin') {
      console.log('REDIRECIONANDO PARA: adm (admin)');
      setTelaAtiva('adm');
    } else {
      console.log('REDIRECIONANDO PARA: dashboard (user)');
      setTelaAtiva('dashboard');
    }
    
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
        if (planoPreSelecionado) {
          setTelaAtiva('pagamento');
        } else if (rascunhoReceita) {
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
        const base = ingredientes.find(i => String(i.id) === String(ing.alimento));
        return {
          quantidade: parseFloat(ing.quantidade),
          dadosNutricionais: base?.dadosNutricionais || {
            calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0,
            acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0,
            gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0
          },
          unidade: base?.unidade || 'g'
        };
      });

      const nutriTotais = calcularNutrientesTotais(ingredientesComNutrientes);
      const nutriPorPorcao = calcularDadosNutricionaisPorPorcao(nutriTotais, salva.porcoes);
      const custos = calcularCustosReceita(
        salva.ingredientes.map((ing: any) => {
          const base = ingredientes.find(i => String(i.id) === String(ing.alimento));
          return { 
            quantidade: parseFloat(ing.quantidade), 
            preco: parseFloat(ing.preco_personalizado),
            unidade: base?.unidade || 'g'
          };
        }),
        salva.porcoes,
        parseFloat(salva.margem_lucro)
      );

      const parseada: Receita = {
        id: String(salva.id),
        nome: salva.nome,
        descricao: salva.descricao,
        porcoes: salva.porcoes,
        margemLucro: parseFloat(salva.margem_lucro),
        ingredientes: salva.ingredientes.map((ing: any) => {
          const base = ingredientes.find(i => String(i.id) === String(ing.alimento));
          return {
            tacoId: ing.alimento,
            nome: ing.nome,
            quantidade: parseFloat(ing.quantidade),
            preco: parseFloat(ing.preco_personalizado),
            unidade: base?.unidade || 'g'
          };
        }),
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
      return true;
    } catch (err: any) {
      console.error("Erro ao salvar receita:", err);
      if (err.response?.status === 401) {
        alert("Sua sessão expirou. Por favor, faça login novamente para salvar.");
        setTelaAtiva('login');
      } else if (err.response?.status === 403 && err.response?.data?.erro === 'LIMIT_REACHED') {
        setModalLimiteAberto(true);
      } else {
        alert("Falha ao salvar a receita no servidor. Verifique os dados e tente novamente.");
      }
      return false;
    }
  };

  const handleRemoverReceita = async (id: string, senha?: string) => {
    try {
      if (!usuario) return;
      
      // Validação redundante de senha se ela for informada
      if (senha) {
        const validado = await login(usuario.email, senha);
        if (!validado) {
          alert("Senha incorreta. A exclusão foi cancelada.");
          return;
        }
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
      const parseTacoVal = (val: any) => parseFloat(String(val || '0').replace(',', '.')) || 0;
      const ingredienteParseado: Ingrediente = {
        id: String(itemSalvo.id),
        tacoId: itemSalvo.numero,
        nome: itemSalvo.descricao,
        unidade: itemSalvo.unidade_medida === 'un' ? 'unidade' : (itemSalvo.unidade_medida || 'g'),
        preco: parseTacoVal(itemSalvo.preco),
        dadosNutricionais: {
          calorias: parseTacoVal(itemSalvo.energia_kcal),
          proteinas: parseTacoVal(itemSalvo.proteina),
          carboidratos: parseTacoVal(itemSalvo.carboidrato),
          gorduras: parseTacoVal(itemSalvo.lipideos),
          acucares_totais: parseTacoVal(itemSalvo.acucares_totais),
          acucares_adicionados: parseTacoVal(itemSalvo.acucares_adicionados),
          gorduras_saturadas: parseTacoVal(itemSalvo.saturados),
          gorduras_trans: parseTacoVal(itemSalvo.AG18_1t) + parseTacoVal(itemSalvo.AG18_2t),
          fibras: parseTacoVal(itemSalvo.fibra_alimentar),
          sodio: parseTacoVal(itemSalvo.sodio),
          vitaminas: parseTacoVal(itemSalvo.vitaminas),
          minerais: parseTacoVal(itemSalvo.minerais),
        },
        createdAt: new Date(),
      };

      setIngredientes((prev) =>
        prev.some((i) => String(i.id) === String(ingredienteParseado.id))
          ? prev.map((i) => (String(i.id) === String(ingredienteParseado.id) ? ingredienteParseado : i))
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

  const handleRemoverIngrediente = async (id: string) => {
    try {
      if (!usuario) return;

      await excluirAlimento(Number(id));
      setIngredientes((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Erro ao remover ingrediente:", err);
      alert("Falha ao remover o ingrediente no servidor.");
    }
  };

  const handleAtualizarPrecoIngrediente = async (id: string, novoPreco: number) => {
    try {
      const ingrediente = ingredientes.find((i) => String(i.id) === String(id));
      if (!ingrediente) return;

      const itemSalvo = await salvarAlimento(
        {
          ...ingrediente,
          preco: novoPreco,
        },
        ingrediente.tacoId
      );

      const parseTacoVal = (val: any) => parseFloat(String(val || '0').replace(',', '.')) || 0;
      const ingredienteParseado: Ingrediente = {
        id: String(itemSalvo.id),
        tacoId: itemSalvo.numero,
        nome: itemSalvo.descricao,
        unidade: itemSalvo.unidade_medida === 'un' ? 'unidade' : (itemSalvo.unidade_medida || 'g'),
        preco: parseTacoVal(itemSalvo.preco),
        dadosNutricionais: {
          calorias: parseTacoVal(itemSalvo.energia_kcal),
          proteinas: parseTacoVal(itemSalvo.proteina),
          carboidratos: parseTacoVal(itemSalvo.carboidrato),
          gorduras: parseTacoVal(itemSalvo.lipideos),
          acucares_totais: parseTacoVal(itemSalvo.acucares_totais),
          acucares_adicionados: parseTacoVal(itemSalvo.acucares_adicionados),
          gorduras_saturadas: parseTacoVal(itemSalvo.saturados),
          gorduras_trans: parseTacoVal(itemSalvo.AG18_1t) + parseTacoVal(itemSalvo.AG18_2t),
          fibras: parseTacoVal(itemSalvo.fibra_alimentar),
          sodio: parseTacoVal(itemSalvo.sodio),
          vitaminas: parseTacoVal(itemSalvo.vitaminas),
          minerais: parseTacoVal(itemSalvo.minerais),
        },
        createdAt: ingrediente.createdAt || new Date(),
      };

      setIngredientes((prev) =>
        prev.map((i) => (String(i.id) === String(ingredienteParseado.id) ? ingredienteParseado : i))
      );
    } catch (err) {
      console.error("Erro ao atualizar preco do ingrediente:", err);
    }
  };


  const handleSair = async () => {
    await encerrarSessao();
    setUsuario(null);
    setTelaAtiva('login');
  };

  const handleSalvarRefeicao = (refeicao: Refeicao) => {
    setRefeicoes((prev) => {
      const novaLista = prev.some((r) => r.id === refeicao.id)
        ? prev.map((r) => (r.id === refeicao.id ? refeicao : r))
        : [...prev, refeicao];
      localStorage.setItem('refeicoes', JSON.stringify(novaLista));
      return novaLista;
    });
    setRefeicaoEmEdicao(undefined);
    setTelaAtiva('dashboard');
  };

  const renderTela = () => {
    if (carregandoSessao) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#04585a]"></div>
        </div>
      );
    }

    switch (telaAtiva) {
      case 'home':
        return <Home onIrParaRegister={() => setTelaAtiva('register')} onIrParaPlanos={() => setTelaAtiva('planos')} />;
      case 'refeicao':
        return (
          <CreateMeal
            refeicaoInicial={refeicaoEmEdicao || rascunhoRefeicao}
            receitasDisponiveis={receitas}
            onSalvar={(ref) => {
              handleSalvarRefeicao(ref);
              setRascunhoRefeicao(undefined);
            }}
            onCancelar={() => {
              setRefeicaoEmEdicao(undefined);
              setRascunhoRefeicao(undefined);
              window.history.back();
            }}
            onIrParaEstoque={() => setTelaAtiva('estoque')}
          />
        );
      case 'lista-refeicoes':
        return (
          <MealList
            refeicoes={refeicoes}
            receitasDisponiveis={receitas}
            onEditar={(ref) => {
              setRefeicaoEmEdicao(ref);
              setRascunhoRefeicao(undefined);
              setTelaAtiva('refeicao');
            }}
            onRemover={(id) => {
              const novaLista = refeicoes.filter((r) => r.id !== id);
              setRefeicoes(novaLista);
              localStorage.setItem('refeicoes', JSON.stringify(novaLista));
            }}
            onGerarRotulo={(ref) => {
              window.location.hash = `etiqueta?id=${ref.id}&tipo=refeicao`;
            }}
            onNovaRefeicao={() => {
              setRefeicaoEmEdicao(undefined);
              setRascunhoRefeicao(undefined);
              setTelaAtiva('refeicao');
            }}
          />
        );
      case 'despesas':
        return <ExpenseControl onVoltar={() => setTelaAtiva('dashboard')} />;
      case 'producao':
        return <ProductionRegister onVoltar={() => setTelaAtiva('dashboard')} refeicoes={refeicoes} />;
      case 'estoque':
        return (
          <Inventory
            onVoltar={() => setTelaAtiva('dashboard')}
            onIrParaIngredientes={() => setTelaAtiva('cadastro-ingrediente')}
            ingredientes={ingredientes}
            onAtualizarPrecoIngrediente={handleAtualizarPrecoIngrediente}
            onRemoverIngrediente={handleRemoverIngrediente}
          />
        );
      case 'estatisticas':
        return <Statistic onVoltar={() => setTelaAtiva('dashboard')} refeicoes={refeicoes} receitas={receitas} />;
      case 'aulas':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm max-w-md w-full text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Aulas e Mentorias ao Vivo</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Participe de nossas salas de suporte e mentorias em tempo real para tirar dúvidas sobre precificação, tabelas nutricionais e marketing para o seu negócio!
              </p>
              <button
                type="button"
                onClick={() => setTelaAtiva('dashboard')}
                className="w-full py-2.5 rounded-xl bg-[#04585a] hover:brightness-110 text-white font-semibold text-sm transition-all focus:outline-none cursor-pointer border-0"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <Dashboard
            onNavegar={setTelaAtiva}
            receitas={receitas}
            totalIngredientes={ingredientes.length}
            usuario={usuario}
          />
        );
      case 'criar-receita':
        return (
          <CriarReceita
            receitaInicial={receitaEmEdicao || rascunhoReceita}
            ingredientes={ingredientes}
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
            temIngredientes={ingredientes.length > 0}
            onEditar={(r) => { setReceitaEmEdicao(r); setTelaAtiva('criar-receita'); }}
            onRemover={handleRemoverReceita}
            onGerarRotulo={(r) => {
              window.location.hash = `etiqueta?id=${r.id}`;
            }}
            onNovaReceita={() => { setReceitaEmEdicao(undefined); setTelaAtiva('criar-receita'); }}
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
            onNovoIngrediente={() => { setIngredienteEmEdicao(undefined); setTelaAtiva('cadastro-ingrediente'); }}
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
            onVerTermos={() => setTelaAtiva('termos')}
            onVerPrivacidade={() => setTelaAtiva('privacidade')}
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
            onResetPassword={resetPassword}
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
      case 'not-found':
        return (
          <NotFound 
            onVoltar={() => window.history.back()} 
            onIrParaHome={() => setTelaAtiva('home')} 
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
              planoAtual:      usuario.planoAtual,
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
        return <Support usuario={usuario} />;
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
      case 'termos':
        return <Terms onVoltar={() => window.history.back()} />;
      case 'privacidade':
        return <Privacy onVoltar={() => window.history.back()} />;
      case 'adm':
        return <Adm />;
      case 'configuracaovisual':
        return <ConfiguracaoVisual />;
      case 'etiqueta':
        return (
          <Etiqueta
            onVoltar={() => {
              if (window.location.hash.includes('tipo=refeicao')) {
                setTelaAtiva('lista-refeicoes');
              } else {
                setTelaAtiva('receitas');
              }
            }}
            usuario={usuario}
          />
        );
      default:
        return <Home onIrParaRegister={() => setTelaAtiva('register')} onIrParaPlanos={() => setTelaAtiva('planos')} />;
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header telaAtiva={telaAtiva} onNavegar={setTelaAtiva} onSair={handleSair} usuario={usuario} />
      {isDashboardScreen && <Sidebar activeTela={telaAtiva} onNavegar={setTelaAtiva} />}
      <main className={`flex-1 w-full ${isDashboardScreen ? 'lg:pl-64' : ''}`}>
        {renderTela()}
      </main>
      {!isDashboardScreen && <Footer onNavegar={setTelaAtiva} />}
      {receitaParaRotulo && (
        <RotuloNutricional
          receita={receitaParaRotulo}
          onFechar={() => setReceitaParaRotulo(null)}
          onImprimir={() => window.print()}
        />
      )}
      
      {modalLimiteAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Lock size={24} className="text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Limite de receitas atingido</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Você atingiu o limite de 5 receitas do seu plano atual. Para continuar cadastrando e desbloquear ferramentas avançadas como rótulos personalizados e planilhas de custo, faça o upgrade para o plano <strong className="text-slate-800 font-semibold">Profissional</strong>.
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalLimiteAberto(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalLimiteAberto(false);
                    setTelaAtiva('pagamento');
                  }}
                  className="flex-[1.5] py-2.5 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-2 border-0 shadow-sm shadow-orange-600/20"
                >
                  Assinar plano Profissional
                  <ArrowUpRight size={16} className="text-orange-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;