import React, { useState } from 'react';

interface CampoDinamico {
  id: string;
  nome: string;
  valor: string;
  ativo: boolean;
}

const ConfiguracaoVisual: React.FC = () => {
  const [campos, setCampos] = useState<CampoDinamico[]>([
    { id: '1', nome: 'Calorias', valor: '200 kcal', ativo: true },
    { id: '2', nome: 'Proteínas', valor: '15g', ativo: true },
  ]);

  const [novoCampoNome, setNovoCampoNome] = useState('');
  const [novoCampoValor, setNovoCampoValor] = useState('');

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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Configuração Visual - Etiqueta Nutricional</h1>
      
      {/* Seção de edição dinâmica */}
      <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h2>📝 Edição Dinâmica de Campos</h2>
        
        {/* Lista de campos existentes */}
        <div style={{ marginBottom: '20px' }}>
          <h3>Campos atuais:</h3>
          {campos.map(campo => (
            <div key={campo.id} style={{ 
              border: '1px solid #eee', 
              padding: '10px', 
              marginBottom: '10px',
              borderRadius: '4px',
              backgroundColor: campo.ativo ? '#fff' : '#f5f5f5'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={campo.nome}
                  onChange={(e) => atualizarCampo(campo.id, 'nome', e.target.value)}
                  style={{ padding: '5px', flex: 1 }}
                  placeholder="Nome do campo"
                />
                <input
                  type="text"
                  value={campo.valor}
                  onChange={(e) => atualizarCampo(campo.id, 'valor', e.target.value)}
                  style={{ padding: '5px', flex: 1 }}
                  placeholder="Valor"
                />
                <button onClick={() => toggleAtivo(campo.id)}>
                  {campo.ativo ? '✓ Ativo' : '✗ Inativo'}
                </button>
                <button onClick={() => removerCampo(campo.id)} style={{ backgroundColor: '#ff4444', color: 'white' }}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Formulário para adicionar novo campo */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <h3>➕ Adicionar novo campo:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Nome do campo (ex: Fibras)"
              value={novoCampoNome}
              onChange={(e) => setNovoCampoNome(e.target.value)}
              style={{ padding: '8px', flex: 1 }}
            />
            <input
              type="text"
              placeholder="Valor (ex: 5g)"
              value={novoCampoValor}
              onChange={(e) => setNovoCampoValor(e.target.value)}
              style={{ padding: '8px', flex: 1 }}
            />
            <button onClick={adicionarCampo} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
              Adicionar Campo
            </button>
          </div>
        </div>
      </div>

      {/* Preview simples */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h2>👁️ Preview da Etiqueta</h2>
        <div style={{ border: '2px solid #333', padding: '15px', maxWidth: '300px' }}>
          <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Informações Nutricionais</h3>
          {campos.filter(c => c.ativo).map(campo => (
            <div key={campo.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '5px 0',
              borderBottom: '1px solid #eee'
            }}>
              <strong>{campo.nome}:</strong>
              <span>{campo.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoVisual;