/**
 * CONFIGURAÇÃO VISUAL - ETIQUETA NUTRICIONAL
 * 
 * TAREFA 7: Integração com Backend
 * - GET /api/etiquetas/{id}/ -> Carregar configurações
 * - PATCH /api/etiquetas/{id}/ -> Salvar configurações
 * - Autenticação: Bearer Token
 * 
 * Tarefas concluídas: 1, 2, 3, 4, 5, 6, 7
 */

import React, { useState, useEffect } from 'react';
import { getSessao } from '../../services/auth';
import  api  from '../../services/api';

// ============================================
// TIPAGENS (TypeScript)
// ============================================

interface CampoDinamico {
  id: string;
  nome: string;
  valor: string;
  ativo: boolean;
}

interface ConfiguracoesEtiqueta {
  id?: number;
  layout: string;
  tamanho: string;
  template: string;
  campos: CampoDinamico[];
}

type LayoutType = 'vertical' | 'horizontal' | 'grade';
type TamanhoType = 'pequena' | 'media' | 'grande' | 'extra';
type TemplateType = 'claro' | 'escuro' | 'verde' | 'profissional';

// ID fixo da etiqueta (pode ser do usuário ou fixo)
const ETIQUETA_ID = 1;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ConfiguracaoVisual: React.FC = () => {
  // ==========================================
  // ESTADOS (STATES)
  // ==========================================
  
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
  
  // TAREFA 6: Estado para mensagens
  const [erros, setErros] = useState<{ tipo: string; mensagem: string; campoId?: string }[]>([]);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // ==========================================
  // FUNÇÕES DE INTEGRAÇÃO COM BACKEND (TAREFA 7)
  // ==========================================

  /**
   * Busca as configurações salvas no backend
   */
  const carregarConfiguracoes = async () => {
    setCarregando(true);
    try {
      const response = await api.get(`/etiquetas/${ETIQUETA_ID}/`);
      const data = response.data;
      
      // Aplica as configurações carregadas
      if (data.layout) setLayout(data.layout);
      if (data.tamanho) setTamanho(data.tamanho);
      if (data.template) setTemplate(data.template);
      if (data.campos && data.campos.length > 0) {
        setCampos(data.campos);
      }
      
      setMensagemSucesso('✅ Configurações carregadas com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      if (error.response?.status === 404) {
        // Etiqueta não existe ainda, tudo bem
        console.log('Nenhuma configuração salva ainda');
      } else {
        setErros([{ tipo: 'geral', mensagem: '❌ Erro ao carregar configurações' }]);
        setTimeout(() => setErros([]), 3000);
      }
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Salva as configurações no backend
   */
  const salvarConfiguracoes = async () => {
    setSalvando(true);
    setErros([]);
    
    const dados: ConfiguracoesEtiqueta = {
      layout,
      tamanho,
      template,
      campos: campos.filter(c => c.ativo),
    };
    
    try {
      await api.patch(`/etiquetas/${ETIQUETA_ID}/`, dados);
      setMensagemSucesso('✅ Configurações salvas com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      setErros([{ tipo: 'geral', mensagem: '❌ Erro ao salvar configurações. Tente novamente.' }]);
      setTimeout(() => setErros([]), 3000);
    } finally {
      setSalvando(false);
    }
  };

  // TAREFA 7: Carrega as configurações ao iniciar
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  // TAREFA 5: Detecta quando a tela redimensiona
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // TAREFA 6: Limpa mensagem de sucesso após 3 segundos
  useEffect(() => {
    if (mensagemSucesso) {
      const timer = setTimeout(() => setMensagemSucesso(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensagemSucesso]);

  // TAREFA 6: Limpa mensagens de erro após 3 segundos
  useEffect(() => {
    if (erros.length > 0) {
      const timer = setTimeout(() => setErros([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [erros]);

  // ==========================================
  // FUNÇÕES DA TAREFA 1 (Edição de campos)
  // ==========================================
  
  const adicionarCampo = () => {
    if (!novoCampoNome.trim()) {
      setErros([{ tipo: 'nome', mensagem: '❌ O nome do campo é obrigatório' }]);
      setTimeout(() => setErros([]), 3000);
      return;
    }
    
    const novoCampo: CampoDinamico = {
      id: Date.now().toString(),
      nome: novoCampoNome.trim(),
      valor: novoCampoValor.trim() || '---',
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

  // ==========================================
  // FUNÇÕES DA TAREFA 3 (Tamanho)
  // ==========================================
  
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

  // ==========================================
  // FUNÇÕES DA TAREFA 4 (Templates)
  // ==========================================
  
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

  // ==========================================
  // FUNÇÕES DA TAREFA 2 (Layout)
  // ==========================================
  
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

  // ==========================================
  // RENDERIZAÇÃO DA TELA
  // ==========================================
  
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
      
      {/* TAREFA 7: Indicador de carregamento */}
      {carregando && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⏳ Carregando configurações salvas...
        </div>
      )}
      
      {/* TAREFA 6: Exibe mensagens de erro e sucesso */}
      {erros.map((erro, index) => (
        <div key={index} style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#ffebee',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#c62828'
        }}>
          {erro.mensagem}
        </div>
      ))}
      
      {mensagemSucesso && (
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
      )}
      
      {/* ========================================== */}
      {/* SEÇÃO 1: EDIÇÃO DINÂMICA DE CAMPOS (TAREFA 1) */}
      {/* ========================================== */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
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

      {/* ========================================== */}
      {/* SEÇÃO 2: SELEÇÃO DE LAYOUT (TAREFA 2) */}
      {/* ========================================== */}
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
      </div>

      {/* ========================================== */}
      {/* SEÇÃO 3: TAMANHO DA ETIQUETA (TAREFA 3) */}
      {/* ========================================== */}
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
      </div>

      {/* ========================================== */}
      {/* SEÇÃO 4: TEMPLATES (TAREFA 4) */}
      {/* ========================================== */}
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

      {/* ========================================== */}
      {/* SEÇÃO 5: BOTÃO SALVAR (TAREFA 7) */}
      {/* ========================================== */}
      <div style={{ 
        marginBottom: '30px', 
        display: 'flex', 
        justifyContent: 'center'
      }}>
        <button
          onClick={salvarConfiguracoes}
          disabled={salvando}
          style={{
            padding: '12px 30px',
            backgroundColor: '#04585a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: salvando ? 'not-allowed' : 'pointer',
            opacity: salvando ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {salvando ? '💾 Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>

      {/* ========================================== */}
      {/* SEÇÃO 6: PREVIEW EM TEMPO REAL */}
      {/* ========================================== */}
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