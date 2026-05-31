/**
 * CONFIGURAÇÃO VISUAL - ETIQUETA NUTRICIONAL (MODELO ANVISA/TACO)
 * 
 * Campos obrigatórios segundo a RDC ANVISA:
 * - Valor Energético (kcal)
 * - Carboidratos (g)
 * - Açúcares Totais (g)
 * - Açúcares Adicionados (g)
 * - Proteínas (g)
 * - Gorduras Totais (g)
 * - Gorduras Saturadas (g)
 * - Gorduras Trans (g)
 * - Fibra Alimentar (g)
 * - Sódio (mg)
 * 
 * Tarefas concluídas: 1, 2, 3, 4, 5, 6, 7
 * Padrão de cores: #04585a (verde da marca)
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// ============================================
// TIPAGENS (TypeScript)
// ============================================

interface CampoDinamico {
  id: string;
  nome: string;
  valor: string;
  unidade: string;
  ativo: boolean;
}

interface ConfiguracoesEtiqueta {
  id?: number;
  layout: string;
  tamanho: string;
  campos: CampoDinamico[];
  porcoesEmbalagem: number;
  porcaoGramas: number;
  medidaCaseira: string;
}

type LayoutType = 'vertical' | 'horizontal' | 'grade';
type TamanhoType = 'pequena' | 'media' | 'grande' | 'extra';

const ETIQUETA_ID = 1;

// Cores da marca
const COR_PRIMARIA = '#04585a';
const COR_BORDA = '#04585a';
const FUNDO_BRANCO = '#ffffff';
const TEXTO_PADRAO = '#333333';

// Campos obrigatórios ANVISA/TACO
const CAMPOS_OBRIGATORIOS: CampoDinamico[] = [
  { id: '1', nome: 'Valor Energético', valor: '200', unidade: 'kcal', ativo: true },
  { id: '2', nome: 'Carboidratos', valor: '25', unidade: 'g', ativo: true },
  { id: '3', nome: 'Açúcares Totais', valor: '10', unidade: 'g', ativo: true },
  { id: '4', nome: 'Açúcares Adicionados', valor: '5', unidade: 'g', ativo: true },
  { id: '5', nome: 'Proteínas', valor: '15', unidade: 'g', ativo: true },
  { id: '6', nome: 'Gorduras Totais', valor: '8', unidade: 'g', ativo: true },
  { id: '7', nome: 'Gorduras Saturadas', valor: '3', unidade: 'g', ativo: true },
  { id: '8', nome: 'Gorduras Trans', valor: '0', unidade: 'g', ativo: true },
  { id: '9', nome: 'Fibras Alimentares', valor: '6', unidade: 'g', ativo: true },
  { id: '10', nome: 'Sódio', valor: '200', unidade: 'mg', ativo: true },
];

const ConfiguracaoVisual: React.FC = () => {
  const [campos, setCampos] = useState<CampoDinamico[]>(CAMPOS_OBRIGATORIOS);
  const [layout, setLayout] = useState<LayoutType>('vertical');
  const [tamanho, setTamanho] = useState<TamanhoType>('media');
  const [isMobile, setIsMobile] = useState(false);
  const [porcoesEmbalagem, setPorcoesEmbalagem] = useState(10);
  const [porcaoGramas, setPorcaoGramas] = useState(50);
  const [medidaCaseira, setMedidaCaseira] = useState('1 colher de sopa');
  
  const [erros, setErros] = useState<{ tipo: string; mensagem: string; campoId?: string }[]>([]);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Calcula %VD baseado nos valores de referência ANVISA
  const calcularVD = (valor: number, unidade: string): number => {
    const referencias: Record<string, number> = {
      kcal: 2000,
      g: 300,
      mg: 2400,
    };
    const ref = referencias[unidade] || 100;
    return (valor / ref) * 100;
  };

  const carregarConfiguracoes = async () => {
    setCarregando(true);
    try {
      const response = await api.get(`/etiquetas/${ETIQUETA_ID}/`);
      const data = response.data;
      if (data.layout) setLayout(data.layout);
      if (data.tamanho) setTamanho(data.tamanho);
      if (data.campos && data.campos.length > 0) setCampos(data.campos);
      if (data.porcoesEmbalagem) setPorcoesEmbalagem(data.porcoesEmbalagem);
      if (data.porcaoGramas) setPorcaoGramas(data.porcaoGramas);
      if (data.medidaCaseira) setMedidaCaseira(data.medidaCaseira);
      
      setMensagemSucesso('✅ Configurações carregadas com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      if ((error as any).response?.status === 404) {
        console.log('Nenhuma configuração salva ainda');
      } else {
        setErros([{ tipo: 'geral', mensagem: '❌ Erro ao carregar configurações' }]);
        setTimeout(() => setErros([]), 3000);
      }
    } finally {
      setCarregando(false);
    }
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    setErros([]);
    
    const dados = {
      layout,
      tamanho,
      campos,
      porcoesEmbalagem,
      porcaoGramas,
      medidaCaseira,
    };
    
    try {
      await api.patch(`/etiquetas/${ETIQUETA_ID}/`, dados);
      setMensagemSucesso('✅ Configurações salvas com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setErros([{ tipo: 'geral', mensagem: '❌ Erro ao salvar configurações. Tente novamente.' }]);
      setTimeout(() => setErros([]), 3000);
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => { carregarConfiguracoes(); }, []);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    if (mensagemSucesso) {
      const timer = setTimeout(() => setMensagemSucesso(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensagemSucesso]);
  useEffect(() => {
    if (erros.length > 0) {
      const timer = setTimeout(() => setErros([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [erros]);

  const getTamanhoWidth = (): string => {
    if (isMobile) return '100%';
    switch (tamanho) {
      case 'pequena': return '350px';
      case 'media': return '500px';
      case 'grande': return '700px';
      case 'extra': return '900px';
      default: return '500px';
    }
  };

  // Estilo fixo da etiqueta (padrão da marca)
  const getTemplateStyle = (): React.CSSProperties => {
    return {
      backgroundColor: FUNDO_BRANCO,
      border: `2px solid ${COR_BORDA}`,
      color: TEXTO_PADRAO,
    };
  };

  const renderPreview = () => {
    const camposAtivos = campos.filter(c => c.ativo);
    const valoresPorcao = camposAtivos.map(campo => {
      const valor = parseFloat(campo.valor);
      const valorPorcao = (valor * porcaoGramas) / 100;
      return { ...campo, valorPorcao, vd: calcularVD(valorPorcao, campo.unidade) };
    });

    return (
      <div style={{ 
        ...getTemplateStyle(),
        padding: '20px',
        borderRadius: '8px',
        width: getTamanhoWidth(),
        transition: 'all 0.3s ease',
        margin: '0 auto',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }}>
        <h3 style={{ textAlign: 'center', margin: '0 0 10px 0', borderBottom: `2px solid ${COR_BORDA}`, paddingBottom: '8px', color: COR_PRIMARIA }}>
          INFORMAÇÃO NUTRICIONAL
        </h3>
        <div style={{ marginBottom: '10px', fontSize: '10px' }}>
          <div>Porções por embalagem: {porcoesEmbalagem}</div>
          <div>Porção: {porcaoGramas}g ({medidaCaseira})</div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: `1px solid ${COR_BORDA}`, padding: '4px' }}></th>
              <th style={{ textAlign: 'center', borderBottom: `1px solid ${COR_BORDA}`, padding: '4px' }}>100g</th>
              <th style={{ textAlign: 'center', borderBottom: `1px solid ${COR_BORDA}`, padding: '4px' }}>{porcaoGramas}g</th>
              <th style={{ textAlign: 'center', borderBottom: `1px solid ${COR_BORDA}`, padding: '4px' }}>%VD*</th>
            </tr>
          </thead>
          <tbody>
            {valoresPorcao.map((campo) => (
              <tr key={campo.id}>
                <td style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '4px' }}>{campo.nome} ({campo.unidade})</td>
                <td style={{ textAlign: 'center', borderBottom: '1px solid #eee', padding: '4px' }}>{parseFloat(campo.valor).toFixed(1)}</td>
                <td style={{ textAlign: 'center', borderBottom: '1px solid #eee', padding: '4px' }}>{campo.valorPorcao.toFixed(1)}</td>
                <td style={{ textAlign: 'center', borderBottom: '1px solid #eee', padding: '4px' }}>{campo.vd.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ fontSize: '8px', marginTop: '10px', textAlign: 'center' }}>
          *Percentual de valores diários fornecidos pela porção.
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ color: COR_PRIMARIA, marginBottom: '20px', fontSize: isMobile ? '1.5rem' : '2rem', textAlign: 'center' }}>
        Configuração Visual - Etiqueta Nutricional (ANVISA)
      </h1>
      
      {carregando && <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '20px' }}>⏳ Carregando...</div>}
      {erros.map((erro, idx) => <div key={idx} style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#ffebee', border: '1px solid #ff4444', borderRadius: '8px', color: '#c62828' }}>{erro.mensagem}</div>)}
      {mensagemSucesso && <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '8px', color: '#2e7d32' }}>{mensagemSucesso}</div>}
      
      {/* Informações da Embalagem */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: isMobile ? '15px' : '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0, color: COR_PRIMARIA }}>📦 Informações da Embalagem</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>Porções por embalagem:</label>
            <input type="number" value={porcoesEmbalagem} onChange={(e) => setPorcoesEmbalagem(Number(e.target.value))} style={{ padding: '8px', marginLeft: '10px', width: '80px', border: `1px solid ${COR_PRIMARIA}`, borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>Porção (g):</label>
            <input type="number" value={porcaoGramas} onChange={(e) => setPorcaoGramas(Number(e.target.value))} style={{ padding: '8px', marginLeft: '10px', width: '80px', border: `1px solid ${COR_PRIMARIA}`, borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>Medida caseira:</label>
            <input type="text" value={medidaCaseira} onChange={(e) => setMedidaCaseira(e.target.value)} style={{ padding: '8px', marginLeft: '10px', width: '150px', border: `1px solid ${COR_PRIMARIA}`, borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Edição dos Campos Obrigatórios */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: isMobile ? '15px' : '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0, color: COR_PRIMARIA }}>📝 Valores Nutricionais (por 100g)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {campos.map(campo => (
            <div key={campo.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: `1px solid ${COR_PRIMARIA}` }}>
              <span style={{ width: '120px', fontWeight: 'bold' }}>{campo.nome}</span>
              <input type="number" value={campo.valor} onChange={(e) => {
                const novoValor = e.target.value;
                setCampos(campos.map(c => c.id === campo.id ? { ...c, valor: novoValor } : c));
              }} style={{ padding: '6px', width: '80px', border: `1px solid ${COR_PRIMARIA}`, borderRadius: '4px' }} step="0.1" />
              <span>{campo.unidade}</span>
              <button onClick={() => setCampos(campos.map(c => c.id === campo.id ? { ...c, ativo: !c.ativo } : c))} style={{ padding: '4px 8px', backgroundColor: campo.ativo ? COR_PRIMARIA : '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {campo.ativo ? '✓' : '✗'}
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          💡 Valores baseados em 100g do produto. O sistema calcula automaticamente os valores para a porção e o %VD.
        </p>
      </div>

      {/* Seção Layout */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: isMobile ? '15px' : '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0, color: COR_PRIMARIA }}>🎨 Layout</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setLayout('vertical')} style={{ padding: '10px 20px', backgroundColor: layout === 'vertical' ? COR_PRIMARIA : '#ddd', color: layout === 'vertical' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>📋 Padrão</button>
        </div>
      </div>

      {/* Seção Tamanho */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: isMobile ? '15px' : '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0, color: COR_PRIMARIA }}>📏 Tamanho da Etiqueta</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setTamanho('pequena')} style={{ padding: '10px 15px', backgroundColor: tamanho === 'pequena' ? COR_PRIMARIA : '#ddd', color: tamanho === 'pequena' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Pequena (350px)</button>
          <button onClick={() => setTamanho('media')} style={{ padding: '10px 15px', backgroundColor: tamanho === 'media' ? COR_PRIMARIA : '#ddd', color: tamanho === 'media' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Média (500px)</button>
          <button onClick={() => setTamanho('grande')} style={{ padding: '10px 15px', backgroundColor: tamanho === 'grande' ? COR_PRIMARIA : '#ddd', color: tamanho === 'grande' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Grande (700px)</button>
          <button onClick={() => setTamanho('extra')} style={{ padding: '10px 15px', backgroundColor: tamanho === 'extra' ? COR_PRIMARIA : '#ddd', color: tamanho === 'extra' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Extra (900px)</button>
        </div>
      </div>

      {/* SEÇÃO 4: CORES DA ETIQUETA - APENAS PADRÃO DA MARCA */}
      <div style={{ 
        marginBottom: '30px', 
        border: '1px solid #ddd', 
        padding: isMobile ? '15px' : '20px', 
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2 style={{ marginTop: 0, color: COR_PRIMARIA }}>🎨 Cores da Etiqueta</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button style={{ 
            padding: '10px 20px', 
            backgroundColor: COR_PRIMARIA, 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Padrão (verde da marca)
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
          ✅ Etiqueta no padrão institucional da marca
        </p>
      </div>

      {/* Botão Salvar */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={salvarConfiguracoes} disabled={salvando} style={{ padding: '12px 30px', backgroundColor: COR_PRIMARIA, color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
          {salvando ? '💾 Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>

      {/* Preview */}
      <div style={{ border: '1px solid #ddd', padding: isMobile ? '15px' : '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginTop: 0, color: COR_PRIMARIA }}>👁️ Preview da Etiqueta</h2>
        {renderPreview()}
      </div>
    </div>
  );
};

export default ConfiguracaoVisual;