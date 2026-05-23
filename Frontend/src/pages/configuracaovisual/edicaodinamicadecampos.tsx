import React, { useState, useEffect } from 'react';

interface CampoDinamico {
  id: string;
  nome: string;
  valor: string;
  ativo: boolean;
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
  
  // TAREFA 5: Estado para detectar se é celular
  const [isMobile, setIsMobile] = useState(false);

  // TAREFA 5: Detecta quando a tela redimensiona
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const adicionarCampo = () => {
    if (!novoCampoNome.trim()) return;
    
    const novoCampo: CampoDinamico = {
      id: Date.now().toString(),
      nome: novoCampoNome,
      valor: novoCampoValor || '---',
      ativo: true,
    };
    
    setCampos([...campos, novoCampo]);
    setNovoCampoNome('');
    setNovoCampoValor('');
  };

  const removerCampo = (id: string) => {
    setCampos(campos.filter(campo => campo.id !== id));
  };

  const atualizarCampo = (id: string, chave: keyof CampoDinamico, valor: string) => {
    setCampos(campos.map(campo => 
      campo.id === id ? { ...campo, [chave]: valor } : campo
    ));
  };

  const toggleAtivo = (id: string) => {
    setCampos(campos.map(campo =>
      campo.id === id ? { ...campo, ativo: !campo.ativo } : campo
    ));
  };

  // TAREFA 5: Largura responsiva (no celular sempre 100%)
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

  // TAREFA 5: Layout responsivo (no celular força vertical)
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
      
      {/* Seção de edição dinâmica */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>📝 Edição Dinâmica de Campos</h2>
        
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
                    border: '1px solid #ccc',
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
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder="Valor"
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
                border: '1px solid #ccc',
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
                border: '1px solid #ccc',
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

      {/* TAREFA 5: Mensagem informativa para celular */}
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