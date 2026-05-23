import React, { useState } from 'react';

interface CampoDinamico {
  id: string;
  nome: string;
  valor: string;
  ativo: boolean;
}

type LayoutType = 'vertical' | 'horizontal' | 'grade';

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

  // Estilos para cada layout
  const getLayoutStyle = (): React.CSSProperties => {
    switch (layout) {
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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px',
        };
      default: // vertical
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        };
    }
  };

  const getCampoStyle = (): React.CSSProperties => {
    switch (layout) {
      case 'horizontal':
        return {
          flex: '1',
          minWidth: '150px',
          border: '1px solid #eee',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        };
      case 'grade':
        return {
          border: '1px solid #eee',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        };
      default:
        return {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid #eee',
        };
    }
  };

  const renderCampo = (campo: CampoDinamico) => {
    if (layout === 'vertical') {
      return (
        <div key={campo.id} style={getCampoStyle()}>
          <strong>{campo.nome}:</strong>
          <span>{campo.valor}</span>
        </div>
      );
    }
    
    return (
      <div key={campo.id} style={getCampoStyle()}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{campo.nome}</div>
        <div>{campo.valor}</div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Configuração Visual - Etiqueta Nutricional
      </h1>
      
      {/* Seção de edição dinâmica */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>📝 Edição Dinâmica de Campos</h2>
        
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={campo.nome}
                  onChange={(e) => atualizarCampo(campo.id, 'nome', e.target.value)}
                  style={{ 
                    padding: '8px', 
                    flex: 1,
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
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder="Valor"
                />
                <button 
                  onClick={() => toggleAtivo(campo.id)}
                  style={{
                    padding: '8px 15px',
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
          ))}
        </div>
        
        <div style={{ borderTop: '2px solid #ddd', paddingTop: '20px' }}>
          <h3>➕ Adicionar novo campo:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nome do campo (ex: Fibras)"
              value={novoCampoNome}
              onChange={(e) => setNovoCampoNome(e.target.value)}
              style={{ 
                padding: '10px', 
                flex: 1,
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
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button 
              onClick={adicionarCampo} 
              style={{ 
                padding: '10px 20px',
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

      {/* Seção de seleção de layout */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>🎨 Escolha o Layout</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setLayout('vertical')}
            style={{
              padding: '10px 20px',
              backgroundColor: layout === 'vertical' ? '#4CAF50' : '#ddd',
              color: layout === 'vertical' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📋 Vertical (Empilhado)
          </button>
          <button
            onClick={() => setLayout('horizontal')}
            style={{
              padding: '10px 20px',
              backgroundColor: layout === 'horizontal' ? '#4CAF50' : '#ddd',
              color: layout === 'horizontal' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ↔️ Horizontal (Lado a lado)
          </button>
          <button
            onClick={() => setLayout('grade')}
            style={{
              padding: '10px 20px',
              backgroundColor: layout === 'grade' ? '#4CAF50' : '#ddd',
              color: layout === 'grade' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔲 Grade (2 colunas)
          </button>
        </div>
      </div>

      {/* Preview em tempo real */}
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0 }}>👁️ Preview da Etiqueta</h2>
        <div style={{ 
          border: '2px solid #333', 
          padding: '20px', 
          backgroundColor: 'white',
          borderRadius: '8px',
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            textAlign: 'center',
            borderBottom: '2px solid #333',
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