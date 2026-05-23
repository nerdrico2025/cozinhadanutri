import React, { useState, useEffect } from 'react';

interface CampoDinamico {
  id: string;
  nome: string;
  valor: string;
  ativo: boolean;
}

interface MensagemErro {
  campoId?: string;
  tipo: 'nome' | 'valor' | 'geral';
  mensagem: string;
}

type LayoutType = 'vertical' | 'horizontal' | 'grade';
type TamanhoType = 'pequena' | 'media' | 'grande' | 'extra';
type TemplateType = 'claro' | 'escuro' | 'verde' | 'profissional';

const ConfiguracaoVisual: React.FC = () => {
  const [campos, setCampos] = useState<CampoDinamico[]>([
    { id: '1', nome: 'Calorias', valor: '200 kcal', ativo: true },
    { id: '2', nome: 'Proteínas', valor: '15g', ativo: true },
    { id: '3', nome: 'Carboidratos', valor: '25g', ativo: true },
    { id: '4', nome: 'Gorduras', valor: '8g', ativo: true },
  ]);

  const [novoCampoNome, setNovoCampoNome] = useState('');
  const [novoCampoValor, setNovoCampoValor] = useState('');
  const [layout, setLayout] = useState<LayoutType>('vertical');
  const [tamanho, setTamanho] = useState<TamanhoType>('media');
  const [template, setTemplate] = useState<TemplateType>('claro');
  const [isMobile, setIsMobile] = useState(false);
  
  // TAREFA 6: Estado para mensagens de erro
  const [erros, setErros] = useState<MensagemErro[]>([]);

  // TAREFA 6: Estado para mensagens de sucesso
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // TAREFA 5: Detecta quando a tela redimensiona
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // TAREFA 6: Função para limpar mensagem de sucesso após 3 segundos
  useEffect(() => {
    if (mensagemSucesso) {
      const timer = setTimeout(() => setMensagemSucesso(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensagemSucesso]);

  // TAREFA 6: Função para limpar mensagens de erro após 3 segundos
  useEffect(() => {
    if (erros.length > 0) {
      const timer = setTimeout(() => setErros([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [erros]);

  // TAREFA 6: Valida se o nome é válido (apenas letras, números e espaços)
  const validarNome = (nome: string): boolean => {
    const regex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\d]+$/;
    return regex.test(nome);
  };

  // TAREFA 6: Valida se o valor tem formato correto (número + unidade)
  const validarValor = (valor: string): boolean => {
    const regex = /^\d+(\.\d+)?\s*(kcal|g|mg|ml|unidade|porção)$/i;
    return regex.test(valor);
  };

  // TAREFA 6: Verifica se já existe um campo com o mesmo nome
  const verificarNomeDuplicado = (nome: string, idIgnorar?: string): boolean => {
    return campos.some(campo => 
      campo.nome.toLowerCase() === nome.toLowerCase() && campo.id !== idIgnorar
    );
  };

  // TAREFA 6: Adiciona uma mensagem de erro
  const adicionarErro = (tipo: 'nome' | 'valor' | 'geral', mensagem: string, campoId?: string) => {
    setErros(prev => [...prev, { tipo, mensagem, campoId }]);
  };

  // TAREFA 6: Versão melhorada de adicionar campo com validações
  const adicionarCampo = () => {
    // Limpa erros anteriores
    setErros([]);
    
    // Validação 1: Nome não pode estar vazio
    if (!novoCampoNome.trim()) {
      adicionarErro('nome', '❌ O nome do campo é obrigatório');
      return;
    }
    
    // Validação 2: Nome não pode ter caracteres especiais
    if (!validarNome(novoCampoNome)) {
      adicionarErro('nome', '❌ Use apenas letras, números e espaços no nome');
      return;
    }
    
    // Validação 3: Nome não pode ser duplicado
    if (verificarNomeDuplicado(novoCampoNome)) {
      adicionarErro('nome', `❌ Já existe um campo com o nome "${novoCampoNome}"`);
      return;
    }
    
    // Validação 4: Valor deve ter formato correto (se não estiver vazio)
    if (novoCampoValor.trim() && !validarValor(novoCampoValor)) {
      adicionarErro('valor', '❌ Use formato: número + unidade (ex: 200 kcal, 15g, 5mg)');
      return;
    }
    
    // Se passou em todas as validações, adiciona o campo
    const novoCampo: CampoDinamico = {
      id: Date.now().toString(),
      nome: novoCampoNome.trim(),
      valor: novoCampoValor.trim() || '---',
      ativo: true,
    };
    
    setCampos([...campos, novoCampo]);
    setNovoCampoNome('');
    setNovoCampoValor('');
    setMensagemSucesso(`✅ Campo "${novoCampoNome}" adicionado com sucesso!`);
  };

  // TAREFA 6: Versão melhorada de atualizar campo com validações
  const atualizarCampo = (id: string, chave: keyof CampoDinamico, valor: string) => {
    // Limpa erros anteriores deste campo
    setErros(prev => prev.filter(e => e.campoId !== id));
    
    const campoAtual = campos.find(c => c.id === id);
    if (!campoAtual) return;
    
    if (chave === 'nome') {
      // Validação do nome
      if (!validarNome(valor) && valor.trim() !== '') {
        adicionarErro('nome', '❌ Use apenas letras, números e espaços', id);
        return;
      }
      
      // Validação de nome duplicado
      if (verificarNomeDuplicado(valor, id)) {
        adicionarErro('nome', `❌ Já existe um campo com o nome "${valor}"`, id);
        return;
      }
    }
    
    if (chave === 'valor' && valor.trim() !== '') {
      // Validação do valor
      if (!validarValor(valor)) {
        adicionarErro('valor', '❌ Use formato: número + unidade (ex: 200 kcal)', id);
        return;
      }
    }
    
    // Se passou nas validações, atualiza
    setCampos(campos.map(campo => 
      campo.id === id ? { ...campo, [chave]: valor } : campo
    ));
  };

  const removerCampo = (id: string) => {
    const campoRemovido = campos.find(c => c.id === id);
    setCampos(campos.filter(campo => campo.id !== id));
    setMensagemSucesso(`🗑️ Campo "${campoRemovido?.nome}" removido com sucesso!`);
  };

  const toggleAtivo = (id: string) => {
    setCampos(campos.map(campo =>
      campo.id === id ? { ...campo, ativo: !campo.ativo } : campo
    ));
  };

  const getTamanhoWidth = (): string => {
    if (isMobile) return '100%';
    
    switch (tamanho) {
      case 'pequena': return '250px';
      case 'media': return '350px';
      case 'grande': return '450px';
      case 'extra': return '550px';
      default: return '350px';
    }
  };

  const getTemplateStyle = (): React.CSSProperties => {
    switch (template) {
      case 'escuro':
        return {
          backgroundColor: '#1a1a2e',
          border: '2px solid #16213e',
          color: '#ffffff',
        };
      case 'verde':
        return {
          backgroundColor: '#e8f5e9',
          border: '2px solid #4caf50',
          color: '#2e7d32',
        };
      case 'profissional':
        return {
          backgroundColor: '#0d47a1',
          border: '2px solid #1565c0',
          color: '#ffffff',
        };
      default:
        return {
          backgroundColor: '#ffffff',
          border: '2px solid #333333',
          color: '#333333',
        };
    }
  };

  const getLayoutStyle = (): React.CSSProperties => {
    const currentLayout = isMobile ? 'vertical' : layout;
    
    switch (currentLayout) {
      case 'horizontal':
        return {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          justifyContent: 'space-between',
        };
      case 'grade':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
        };
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        };
    }
  };

  const getCampoStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: '8px',
      padding: '10px',
    };

    const currentLayout = isMobile ? 'vertical' : layout;

    if (currentLayout === 'vertical') {
      return {
        ...baseStyle,
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: template === 'escuro' ? '1px solid #444' : '1px solid #eee',
      };
    }
    
    return {
      ...baseStyle,
      backgroundColor: template === 'escuro' ? '#2d2d44' : 
                      template === 'verde' ? '#c8e6c9' :
                      template === 'profissional' ? '#1565c0' : '#f9f9f9',
      color: template === 'escuro' || template === 'profissional' ? '#fff' : '#333',
      border: '1px solid #ddd',
    };
  };

  const renderCampo = (campo: CampoDinamico) => {
    const campoStyle = getCampoStyle();
    const currentLayout = isMobile ? 'vertical' : layout;
    
    if (currentLayout === 'vertical') {
      return (
        <div key={campo.id} style={campoStyle}>
          <strong>{campo.nome}:</strong>
          <span>{campo.valor}</span>
        </div>
      );
    }
    
    return (
      <div key={campo.id} style={campoStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{campo.nome}</div>
        <div>{campo.valor}</div>
      </div>
    );
  };

  // TAREFA 6: Componente para exibir erros
  const ExibirErros = () => {
    if (erros.length === 0) return null;
    return (
      <div style={{
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#ffebee',
        border: '1px solid #ff4444',
        borderRadius: '8px',
        color: '#c62828'
      }}>
        {erros.map((erro, index) => (
          <div key={index} style={{ marginBottom: index < erros.length - 1 ? '5px' : 0 }}>
            {erro.mensagem}
          </div>
        ))}
      </div>
    );
  };

  // TAREFA 6: Componente para exibir sucesso
  const ExibirSucesso = () => {
    if (!mensagemSucesso) return null;
    return (
      <div style={{
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: '8px',
        color: '#2e7d32'
      }}>
        {mensagemSucesso}
      </div>
    );
  };

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ 
        color: '#333', 
        marginBottom: '20px',
        fontSize: isMobile ? '1.5rem' : '2rem',
        textAlign: 'center'
      }}>
        Configuração Visual - Etiqueta Nutricional
      </h1>
      
      {/* TAREFA 6: Exibe mensagens de erro e sucesso */}
      <ExibirErros />
      <ExibirSucesso />
      
      {/* Seção de edição dinâmica */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>📝 Edição Dinâmica de Campos</h2>
        
        {/* TAREFA 6: Dicas de formato */}
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          💡 Dicas de formato:
          <ul style={{ margin: '5px 0 0 20px', fontSize: '12px' }}>
            <li>Nome: use apenas letras e números (ex: Fibras, Vitamina C)</li>
            <li>Valor: número + unidade (ex: 200 kcal, 15g, 5mg, 2 porções)</li>
            <li>Unidades aceitas: kcal, g, mg, ml, unidade, porção</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Campos atuais:</h3>
          {campos.map(campo => (
            <div key={campo.id} style={{ 
              border: '1px solid #ddd', 
              padding: '10px', 
              marginBottom: '10px',
              borderRadius: '4px',
              backgroundColor: campo.ativo ? '#fff' : '#e0e0e0'
            }}>
              {/* TAREFA 6: Exibe erro específico do campo se houver */}
              {erros.filter(e => e.campoId === campo.id).map((erro, idx) => (
                <div key={idx} style={{ color: '#ff4444', fontSize: '12px', marginBottom: '5px' }}>
                  {erro.mensagem}
                </div>
              ))}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <input
                  type="text"
                  value={campo.nome}
                  onChange={(e) => atualizarCampo(campo.id, 'nome', e.target.value)}
                  style={{ 
                    padding: '8px', 
                    flex: 1,
                    width: isMobile ? '100%' : 'auto',
                    border: `1px solid ${erros.some(e => e.campoId === campo.id && e.tipo === 'nome') ? '#ff4444' : '#ccc'}`,
                    borderRadius: '4px'
                  }}
                  placeholder="Nome do campo"
                />
                <input
                  type="text"
                  value={campo.valor}
                  onChange={(e) => atualizarCampo(campo.id, 'valor', e.target.value)}
                  style={{ 
                    padding: '8px', 
                    flex: 1,
                    width: isMobile ? '100%' : 'auto',
                    border: `1px solid ${erros.some(e => e.campoId === campo.id && e.tipo === 'valor') ? '#ff4444' : '#ccc'}`,
                    borderRadius: '4px'
                  }}
                  placeholder="Valor (ex: 200 kcal)"
                />
                <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                  <button 
                    onClick={() => toggleAtivo(campo.id)}
                    style={{
                      padding: '8px 15px',
                      flex: 1,
                      backgroundColor: campo.ativo ? '#4CAF50' : '#999',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {campo.ativo ? '✓ Ativo' : '✗ Inativo'}
                  </button>
                  <button 
                    onClick={() => removerCampo(campo.id)} 
                    style={{ 
                      padding: '8px 15px',
                      flex: 1,
                      backgroundColor: '#ff4444', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ borderTop: '2px solid #ddd', paddingTop: '20px' }}>
          <h3>➕ Adicionar novo campo:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            <input
              type="text"
              placeholder="Nome do campo (ex: Fibras)"
              value={novoCampoNome}
              onChange={(e) => setNovoCampoNome(e.target.value)}
              style={{ 
                padding: '10px', 
                flex: 1,
                width: isMobile ? '100%' : 'auto',
                border: `1px solid ${erros.some(e => e.tipo === 'nome') ? '#ff4444' : '#ccc'}`,
                borderRadius: '4px'
              }}
            />
            <input
              type="text"
              placeholder="Valor (ex: 5g)"
              value={novoCampoValor}
              onChange={(e) => setNovoCampoValor(e.target.value)}
              style={{ 
                padding: '10px', 
                flex: 1,
                width: isMobile ? '100%' : 'auto',
                border: `1px solid ${erros.some(e => e.tipo === 'valor') ? '#ff4444' : '#ccc'}`,
                borderRadius: '4px'
              }}
            />
            <button 
              onClick={adicionarCampo} 
              style={{ 
                padding: '10px 20px',
                width: isMobile ? '100%' : 'auto',
                backgroundColor: '#2196F3', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Adicionar Campo
            </button>
          </div>
        </div>
      </div>

      {isMobile && (
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          📱 Modo celular ativo: Layout forçado para vertical e etiqueta em 100% da largura
        </div>
      )}

      {/* Seção de seleção de layout */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>🎨 Escolha o Layout</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setLayout('vertical')} style={{ 
            padding: '10px 20px', 
            flex: isMobile ? '1' : 'auto',
            backgroundColor: layout === 'vertical' ? '#4CAF50' : '#ddd', 
            color: layout === 'vertical' ? 'white' : '#333', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}>📋 Vertical</button>
          <button onClick={() => setLayout('horizontal')} style={{ 
            padding: '10px 20px', 
            flex: isMobile ? '1' : 'auto',
            backgroundColor: layout === 'horizontal' ? '#4CAF50' : '#ddd', 
            color: layout === 'horizontal' ? 'white' : '#333', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}>↔️ Horizontal</button>
          <button onClick={() => setLayout('grade')} style={{ 
            padding: '10px 20px', 
            flex: isMobile ? '1' : 'auto',
            backgroundColor: layout === 'grade' ? '#4CAF50' : '#ddd', 
            color: layout === 'grade' ? 'white' : '#333', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}>🔲 Grade</button>
        </div>
        {isMobile && (
          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
            ℹ️ No celular, o layout sempre será VERTICAL
          </p>
        )}
      </div>

      {/* Seção de seleção de tamanho */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>📏 Tamanho da Etiqueta</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setTamanho('pequena')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: tamanho === 'pequena' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Pequena</button>
          <button onClick={() => setTamanho('media')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: tamanho === 'media' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Média</button>
          <button onClick={() => setTamanho('grande')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: tamanho === 'grande' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Grande</button>
          <button onClick={() => setTamanho('extra')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: tamanho === 'extra' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Extra</button>
        </div>
        {isMobile && (
          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
            📱 No celular, a etiqueta ocupa 100% da largura
          </p>
        )}
      </div>

      {/* Seção de seleção de templates */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>🎨 Templates</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setTemplate('claro')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: template === 'claro' ? '#4CAF50' : '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>⬜ Claro</button>
          <button onClick={() => setTemplate('escuro')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: template === 'escuro' ? '#4CAF50' : '#1a1a2e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>⬛ Escuro</button>
          <button onClick={() => setTemplate('verde')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: template === 'verde' ? '#4CAF50' : '#e8f5e9', color: '#2e7d32', border: '1px solid #4caf50', borderRadius: '5px', cursor: 'pointer' }}>🟢 Verde</button>
          <button onClick={() => setTemplate('profissional')} style={{ padding: '10px 15px', flex: isMobile ? '1' : 'auto', backgroundColor: template === 'profissional' ? '#4CAF50' : '#0d47a1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🔵 Profissional</button>
        </div>
      </div>

      {/* Preview em tempo real */}
      <div style={{ 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>👁️ Preview da Etiqueta</h2>
        <div style={{ 
          ...getTemplateStyle(),
          padding: '20px',
          borderRadius: '8px',
          width: getTamanhoWidth(),
          transition: 'all 0.3s ease',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            textAlign: 'center',
            borderBottom: `2px solid ${template === 'escuro' ? '#fff' : '#333'}`,
            paddingBottom: '10px'
          }}>
            Informações Nutricionais
          </h3>
          <div style={getLayoutStyle()}>
            {campos.filter(c => c.ativo).map(campo => renderCampo(campo))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoVisual;