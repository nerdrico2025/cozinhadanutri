import { useEffect, useState } from 'react';
import { Printer, ArrowLeft, ShieldAlert, Info, Building } from 'lucide-react';
import { obterReceita } from '../services/receitas';
import { listarAlimentos } from '../services/alimentos';
import { calcularNutrientesTotais, calcularDadosNutricionaisPorPorcao } from '../utils/calculations';
import { Receita, Ingrediente } from '../types';
import { salvarConfiguracaoEtiqueta } from '../services/etiqueta';

interface EtiquetaProps {
  onVoltar: () => void;
  usuario: any;
}

const VD_REFERENCIA = { calorias: 2000, carboidratos: 300, proteinas: 50, gorduras: 55 };

export function Etiqueta({ onVoltar, usuario }: EtiquetaProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Recipe data
  const [receita, setReceita] = useState<Receita | null>(null);
  
  // Sizing and Layout configurations
  const [tamanhoPreset, setTamanhoPreset] = useState<'vertical' | 'horizontal' | 'quadrado' | 'personalizado'>('vertical');
  const [larguraMm, setLarguraMm] = useState(100);
  const [alturaMm, setAlturaMm] = useState(130);
  const [escalaFonte, setEscalaFonte] = useState(100);
  const [alturaAutomatica, setAlturaAutomatica] = useState(true);

  // Custom inputs for label configuration
  const [lote, setLote] = useState(() => 'LOT-' + Math.floor(Math.random() * 100000));
  const [dataFabricacao, setDataFabricacao] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataValidade, setDataValidade] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // 30 dias de validade default
    return d.toISOString().split('T')[0];
  });
  
  // Allergen states
  const [contemGluten, setContemGluten] = useState(false);
  const [contemLactose, setContemLactose] = useState(false);
  const [outrosAlergenicos, setOutrosAlergenicos] = useState('');
  const [instrucoesConservacao, setInstrucoesConservacao] = useState('Manter congelado a -18°C.');
  const [pesoPorcaoCustom, setPesoPorcaoCustom] = useState<number | ''>('');

  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [sucessoConfig, setSucessoConfig] = useState(false);

  const parseIdFromHash = (): string | null => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1]);
    return params.get('id');
  };

  const aplicarPreset = (preset: 'vertical' | 'horizontal' | 'quadrado' | 'personalizado') => {
    setTamanhoPreset(preset);
    if (preset === 'vertical') {
      setLarguraMm(100);
      setAlturaMm(130);
      setAlturaAutomatica(true);
    } else if (preset === 'horizontal') {
      setLarguraMm(150);
      setAlturaMm(80);
      setAlturaAutomatica(true);
    } else if (preset === 'quadrado') {
      setLarguraMm(80);
      setAlturaMm(80);
      setAlturaAutomatica(true);
    } else if (preset === 'personalizado') {
      setAlturaAutomatica(false);
    }
  };

  useEffect(() => {
    const id = parseIdFromHash();
    if (!id) {
      setError('ID da receita não especificado no endereço.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try getting recipe details
        const rData = await obterReceita(id);
        
        // Fetch foods list to map nutritional information
        const foods = await listarAlimentos();
        const parsedIngredientes: Ingrediente[] = foods.map((item: any) => ({
          id: item.id,
          tacoId: item.numero,
          nome: item.descricao,
          unidade: item.unidade_medida === 'un' ? 'unidade' : (item.unidade_medida || 'g'),
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

        // Calculate values just like App.tsx does
        const ingredientesComNutrientes = rData.ingredientes.map((ing: any) => {
          const base = parsedIngredientes.find(i => i.tacoId === ing.alimento);
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
        const nutriPorPorcao = calcularDadosNutricionaisPorPorcao(nutriTotais, rData.porcoes);

        const receitaMapeada: Receita = {
          id: String(rData.id),
          nome: rData.nome,
          descricao: rData.descricao,
          porcoes: rData.porcoes,
          margemLucro: parseFloat(rData.margem_lucro) || 0,
          ingredientes: rData.ingredientes.map((ing: any) => ({
            tacoId: ing.alimento,
            nome: ing.nome || 'Ingrediente',
            quantidade: parseFloat(ing.quantidade) || 0,
            preco: parseFloat(ing.preco_personalizado) || 0
          })),
          custoTotal: 0,
          custoPorPorcao: 0,
          precoSugerido: 0,
          dadosNutricionaisTotais: nutriTotais,
          dadosNutricionaisPorPorcao: nutriPorPorcao,
          createdAt: new Date(rData.criado_em)
        };

        setReceita(receitaMapeada);

        // Tenta carregar as configurações salvas no banco
        try {
          const config = await salvarConfiguracaoEtiqueta(id, {});
          if (config) {
            if (config.nome_personalizado) setLote(config.nome_personalizado);
            if (config.porcao) setPesoPorcaoCustom(config.porcao === '100g' ? '' : parseFloat(config.porcao) || '');
            if (config.tamanho_etiqueta) {
              aplicarPreset(config.tamanho_etiqueta as any);
            }
            if (config.informacoes_complementares) {
              try {
                const parsed = JSON.parse(config.informacoes_complementares);
                if (parsed.dataFabricacao) setDataFabricacao(parsed.dataFabricacao);
                if (parsed.dataValidade) setDataValidade(parsed.dataValidade);
                if (parsed.contemGluten !== undefined) setContemGluten(parsed.contemGluten);
                if (parsed.contemLactose !== undefined) setContemLactose(parsed.contemLactose);
                if (parsed.outrosAlergenicos) setOutrosAlergenicos(parsed.outrosAlergenicos);
                if (parsed.instrucoesConservacao) setInstrucoesConservacao(parsed.instrucoesConservacao);
                if (parsed.larguraMm) setLarguraMm(parsed.larguraMm);
                if (parsed.alturaMm) setAlturaMm(parsed.alturaMm);
                if (parsed.escalaFonte) setEscalaFonte(parsed.escalaFonte);
                if (parsed.alturaAutomatica !== undefined) setAlturaAutomatica(parsed.alturaAutomatica);
              } catch {
                // Fallback
              }
            }
          }
        } catch (configErr) {
          console.error('Erro ao obter configurações da etiqueta:', configErr);
        }
      } catch (err: any) {
        console.error('Erro ao buscar dados da receita:', err);
        setError('Não foi possível carregar a receita. Verifique se a receita existe.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSalvarConfiguracao = async () => {
    const id = parseIdFromHash();
    if (!id) return;

    setSalvandoConfig(true);
    setSucessoConfig(false);

    try {
      const payload = {
        nome_personalizado: lote,
        porcao: pesoPorcaoCustom !== '' ? `${pesoPorcaoCustom}g` : '100g',
        tamanho_etiqueta: tamanhoPreset,
        informacoes_complementares: JSON.stringify({
          dataFabricacao,
          dataValidade,
          contemGluten,
          contemLactose,
          outrosAlergenicos,
          instrucoesConservacao,
          larguraMm,
          alturaMm,
          escalaFonte,
          alturaAutomatica
        })
      };

      await salvarConfiguracaoEtiqueta(id, payload);
      setSucessoConfig(true);
      setTimeout(() => setSucessoConfig(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações da etiqueta:', err);
      alert('Erro ao salvar configurações no servidor.');
    } finally {
      setSalvandoConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-teal-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-semibold animate-pulse">Carregando dados da etiqueta...</p>
        </div>
      </div>
    );
  }

  if (error || !receita) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg border border-red-100 text-center">
          <div className="inline-flex p-4 bg-red-50 text-red-500 rounded-2xl mb-4">
            <ShieldAlert size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Erro de Carregamento</h3>
          <p className="text-gray-500 text-sm mb-6">{error || 'Receita não encontrada.'}</p>
          <button
            onClick={onVoltar}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#04585a] text-white rounded-xl font-bold hover:brightness-95 transition cursor-pointer border-0"
          >
            <ArrowLeft size={16} />
            Voltar para Receitas
          </button>
        </div>
      </div>
    );
  }

  // Calculate sorted ingredients list by quantity descending (as per ANVISA standards)
  const sortedIngredients = [...receita.ingredientes].sort((a, b) => b.quantidade - a.quantidade);
  const ingredientesTexto = sortedIngredients.map(i => i.nome.toLowerCase()).join(', ');

  // Calculate default weight per portion (total recipe weight / portions)
  const totalWeight = receita.ingredientes.reduce((acc, curr) => acc + curr.quantidade, 0);
  const defaultPortionWeight = Math.round(totalWeight / receita.porcoes);
  const currentPortionWeight = pesoPorcaoCustom !== '' && pesoPorcaoCustom > 0 ? pesoPorcaoCustom : defaultPortionWeight;

  // Scale nutritional values if custom portion weight is set
  const scaleFactor = pesoPorcaoCustom !== '' && pesoPorcaoCustom > 0 ? (pesoPorcaoCustom / defaultPortionWeight) : 1;

  const n = {
    calorias: receita.dadosNutricionaisPorPorcao.calorias * scaleFactor,
    carboidratos: receita.dadosNutricionaisPorPorcao.carboidratos * scaleFactor,
    acucares_totais: (receita.dadosNutricionaisPorPorcao.acucares_totais || 0) * scaleFactor,
    acucares_adicionados: (receita.dadosNutricionaisPorPorcao.acucares_adicionados || 0) * scaleFactor,
    proteinas: receita.dadosNutricionaisPorPorcao.proteinas * scaleFactor,
    gorduras: receita.dadosNutricionaisPorPorcao.gorduras * scaleFactor,
    saturadas: receita.dadosNutricionaisPorPorcao.gorduras_saturadas * scaleFactor,
    trans: receita.dadosNutricionaisPorPorcao.gorduras_trans * scaleFactor,
    fibras: receita.dadosNutricionaisPorPorcao.fibras * scaleFactor,
    sodio: receita.dadosNutricionaisPorPorcao.sodio * scaleFactor
  };

  const calcVD = (valor: number, ref: number) => Math.round((valor / ref) * 100);

  const n100 = {
    calorias: (n.calorias / currentPortionWeight) * 100,
    carboidratos: (n.carboidratos / currentPortionWeight) * 100,
    acucares_totais: (n.acucares_totais / currentPortionWeight) * 100,
    acucares_adicionados: (n.acucares_adicionados / currentPortionWeight) * 100,
    proteinas: (n.proteinas / currentPortionWeight) * 100,
    gorduras: (n.gorduras / currentPortionWeight) * 100,
    saturadas: (n.saturadas / currentPortionWeight) * 100,
    trans: (n.trans / currentPortionWeight) * 100,
    fibras: (n.fibras / currentPortionWeight) * 100,
    sodio: (n.sodio / currentPortionWeight) * 100
  };

  // Generate warning labels for new ANVISA regulations (limits per 100g of solid food: 6g fat, 600mg sodium, 15g sugars)
  const isHighSaturates = n100.saturadas >= 6.0;
  const isHighSodium = n100.sodio >= 600.0;
  const isHighSugars = n100.acucares_adicionados >= 15.0;
  const hasLupa = isHighSaturates || isHighSodium || isHighSugars;

  const isHorizontalLayout = larguraMm > alturaMm;

  const renderAlergenicos = () => {
    const alerts: JSX.Element[] = [];
    
    // Gluten
    if (contemGluten) {
      alerts.push(<strong key="gluten" className="block text-[9px] uppercase">CONTÉM GLÚTEN</strong>);
    } else {
      alerts.push(<strong key="gluten" className="block text-[9px] uppercase">NÃO CONTÉM GLÚTEN</strong>);
    }

    // Lactose
    if (contemLactose) {
      alerts.push(<strong key="lactose" className="block text-[9px] uppercase">CONTÉM LACTOSE</strong>);
    } else {
      alerts.push(<strong key="lactose" className="block text-[9px] uppercase">NÃO CONTÉM LACTOSE</strong>);
    }

    // Other custom allergens
    if (outrosAlergenicos.trim()) {
      const cleaned = outrosAlergenicos.trim().toUpperCase();
      const prefix = cleaned.startsWith('CONTÉM') || cleaned.startsWith('CONTEM') ? '' : 'CONTÉM ';
      alerts.push(
        <strong key="outros" className="block text-[9px] uppercase mt-0.5">
          ALÉRGICOS: {prefix}{cleaned}
        </strong>
      );
    }

    return <div className="mt-1 leading-normal">{alerts}</div>;
  };

  const renderLupaFrontal = () => {
    if (!hasLupa) return null;
    return (
      <div className="border border-black p-1 bg-white mb-2 flex items-center gap-1.5 font-sans text-black select-none w-full box-border">
        <div className="flex items-center gap-1 border-r border-black pr-1.5 shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-black stroke-[3.5] fill-none shrink-0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="9" r="5" />
            <line x1="18" y1="16" x2="14.5" y2="12.5" />
          </svg>
          <span className="text-[7.5px] font-black leading-none tracking-tighter">ALTO EM</span>
        </div>
        <div className="flex flex-col gap-0.5 text-[7px] font-extrabold uppercase leading-none justify-center">
          {isHighSugars && <span>Açúcar Adicionado</span>}
          {isHighSaturates && <span>Gordura Saturada</span>}
          {isHighSodium && <span>Sódio</span>}
        </div>
      </div>
    );
  };

  const renderTabelaNutricional = (tamanhoFonteTitulo: string, tamanhoFonteTabela: string, tamanhoFonteNota: string) => {
    return (
      <div className="border-2 border-black p-1 font-sans bg-white w-full text-black select-none">
        <p className="text-center font-black tracking-wider uppercase mb-0.5" style={{ fontSize: tamanhoFonteTitulo }}>
          Informação Nutricional
        </p>
        <p className="text-center mb-1 font-semibold" style={{ fontSize: tamanhoFonteNota }}>
          Porções por embalagem: {receita.porcoes} | Porção: {currentPortionWeight}g
        </p>

        <table className="w-full text-left border-collapse" style={{ fontSize: tamanhoFonteTabela }}>
          <thead>
            <tr className="border-b border-black">
              <th className="py-0.5 font-bold w-[40%]">Nutrientes</th>
              <th className="py-0.5 text-center font-bold w-[20%]">100 g</th>
              <th className="py-0.5 text-center font-bold w-[25%]">{currentPortionWeight} g</th>
              <th className="py-0.5 text-center font-bold w-[15%]">% VD*</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Valor energético (kcal)</td>
              <td className="py-0.5 text-center">{Math.round(n100.calorias)}</td>
              <td className="py-0.5 text-center">{Math.round(n.calorias)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.calorias, VD_REFERENCIA.calorias)}%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Carboidratos (g)</td>
              <td className="py-0.5 text-center">{n100.carboidratos.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.carboidratos.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.carboidratos, VD_REFERENCIA.carboidratos)}%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5 pl-2 text-gray-800">Açúcares totais (g)</td>
              <td className="py-0.5 text-center">{n100.acucares_totais.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.acucares_totais.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5 pl-2 text-gray-800">Açúcares adicionados (g)</td>
              <td className="py-0.5 text-center">{n100.acucares_adicionados.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.acucares_adicionados.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.acucares_adicionados, 50)}%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Proteínas (g)</td>
              <td className="py-0.5 text-center">{n100.proteinas.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.proteinas.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.proteinas, VD_REFERENCIA.proteinas)}%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Gorduras totais (g)</td>
              <td className="py-0.5 text-center">{n100.gorduras.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.gorduras.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.gorduras, VD_REFERENCIA.gorduras)}%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Gorduras saturadas (g)</td>
              <td className="py-0.5 text-center">{n100.saturadas.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.saturadas.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.saturadas, 22)}%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Gorduras trans (g)</td>
              <td className="py-0.5 text-center">{n100.trans.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.trans.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">**</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-0.5">Fibra alimentar (g)</td>
              <td className="py-0.5 text-center">{n100.fibras.toFixed(1)}</td>
              <td className="py-0.5 text-center">{n.fibras.toFixed(1)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.fibras, 25)}%</td>
            </tr>
            <tr>
              <td className="py-0.5">Sódio (mg)</td>
              <td className="py-0.5 text-center">{Math.round(n100.sodio)}</td>
              <td className="py-0.5 text-center">{Math.round(n.sodio)}</td>
              <td className="py-0.5 text-center font-bold">{calcVD(n.sodio, 2000)}%</td>
            </tr>
          </tbody>
        </table>

        <p className="leading-tight text-gray-500 mt-1 pt-0.5 border-t border-black text-justify font-medium" style={{ fontSize: tamanhoFonteNota }}>
          * Percentual de valores diários fornecidos pela porção.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:py-0 print:px-0 print:bg-white flex flex-col justify-start">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 print:gap-0 print:max-w-none">
        
        {/* Navigation Action Bar - Hidden in printing */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-200/50 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onVoltar}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-gray-600 transition"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Editor de Etiqueta</h2>
              <p className="text-xs text-gray-500 font-medium">Personalize e imprima as etiquetas para embalagem</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSalvarConfiguracao}
              disabled={salvandoConfig}
              className={`flex items-center gap-2 py-3 px-6 text-white rounded-xl font-bold transition shadow-sm border-0 cursor-pointer text-sm ${
                sucessoConfig ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {salvandoConfig ? 'Salvando...' : (sucessoConfig ? '✓ Salvo!' : 'Salvar Configuração')}
            </button>
            <button
              onClick={handlePrint}
              style={{ backgroundColor: '#04585a' }}
              className="flex items-center gap-2 py-3 px-6 text-white rounded-xl font-bold hover:brightness-95 transition shadow-sm border-0 cursor-pointer text-sm animate-pulse"
            >
              <Printer size={18} />
              Imprimir Etiqueta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full print:gap-0">
          
          {/* LEFT: Controls Panel - Hidden in printing */}
          <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
            
            {/* Label Presets & Sizing Configuration */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#04585a] pb-3 border-b border-gray-100">
                <Info size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Tamanho e Layout</h3>
              </div>

              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Preset de Tamanho</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'vertical', label: 'Vertical ANVISA (100x130mm)' },
                    { id: 'horizontal', label: 'Horizontal ANVISA (150x80mm)' },
                    { id: 'quadrado', label: 'Quadrado Compacto (80x80mm)' },
                    { id: 'personalizado', label: 'Personalizado' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => aplicarPreset(p.id as any)}
                      className={`text-left p-2.5 text-xs font-bold rounded-lg border transition-all ${
                        tamanhoPreset === p.id
                          ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    value={larguraMm}
                    disabled={tamanhoPreset !== 'personalizado'}
                    onChange={(e) => setLarguraMm(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    value={alturaMm}
                    disabled={tamanhoPreset !== 'personalizado' || alturaAutomatica}
                    onChange={(e) => setAlturaMm(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Auto height & Scale */}
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alturaAutomatica}
                    onChange={(e) => setAlturaAutomatica(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  Altura Automática (Evita cortar texto)
                </label>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase mb-1">
                    <span>Escala da Fonte</span>
                    <span className="text-[#04585a]">{escalaFonte}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={escalaFonte}
                    onChange={(e) => setEscalaFonte(Number(e.target.value))}
                    className="w-full accent-[#04585a]"
                  />
                </div>
              </div>
            </div>

            {/* Label Customization Configuration */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#04585a] pb-3 border-b border-gray-100">
                <Info size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Informações do Produto</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Lote</label>
                  <input
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Peso da Porção (g)</label>
                  <input
                    type="number"
                    placeholder={`${defaultPortionWeight}g`}
                    value={pesoPorcaoCustom}
                    onChange={(e) => setPesoPorcaoCustom(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fabricação</label>
                  <input
                    type="date"
                    value={dataFabricacao}
                    onChange={(e) => setDataFabricacao(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Validade</label>
                  <input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Conservação</label>
                <input
                  type="text"
                  value={instrucoesConservacao}
                  onChange={(e) => setInstrucoesConservacao(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Allergen Checkboxes */}
              <div className="pt-2">
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Informações Alérgicas</span>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contemGluten}
                      onChange={(e) => setContemGluten(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    Contém Glúten
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contemLactose}
                      onChange={(e) => setContemLactose(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    Contém Lactose
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Outros Alérgicos (ex: Soja, Castanhas)</label>
                  <input
                    type="text"
                    placeholder="Ex: Contém derivados de ovo..."
                    value={outrosAlergenicos}
                    onChange={(e) => setOutrosAlergenicos(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

            </div>

            {/* Print Help Information */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-3">
              <Building className="text-amber-600 mt-0.5 shrink-0" size={18} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Ajustes de Impressão:</p>
                <p>Na janela de impressão, marque a opção <strong>"Imprimir cores de fundo"</strong> (ou gráficos de fundo) para garantir a exibição correta das bordas e contrastes.</p>
                <p className="mt-1">Use folhas adesivas tamanho A4 ou impressoras de etiquetas térmicas dedicadas.</p>
              </div>
            </div>

          </div>

          {/* RIGHT: Label visual preview */}
          <div className="lg:col-span-7 flex justify-center print:block print:w-full">
            
            {/* The sticker ticket representation */}
            <div 
              className="bg-slate-50 p-6 rounded-2xl border border-gray-200/50 print:shadow-none print:border-0 print:p-0 flex items-start justify-center w-full"
            >
              <div 
                className="border-4 border-black p-4 font-sans text-black relative bg-white flex flex-col justify-between"
                style={{
                  width: `${larguraMm}mm`,
                  minHeight: alturaAutomatica ? 'auto' : `${alturaMm}mm`,
                  height: alturaAutomatica ? 'auto' : `${alturaMm}mm`,
                  fontSize: `${escalaFonte}%`,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {isHorizontalLayout ? (
                  /* HORIZONTAL LAYOUT - TWO COLUMNS */
                  <div className="grid grid-cols-12 gap-4 h-full items-start w-full">
                    
                    {/* Left Column (Product Info & Ingredients) */}
                    <div className="col-span-7 flex flex-col justify-between h-full gap-2">
                      <div>
                        {/* Brand Header */}
                        <div className="border-b-2 border-black pb-1 mb-1">
                          <h1 className="text-[10px] font-black tracking-widest uppercase mb-0.5">
                            {usuario?.empresa?.nome_fantasia || 'COZINHA DA NUTRI'}
                          </h1>
                          <p className="text-[8px] uppercase font-bold text-gray-500">
                            CNPJ: {usuario?.empresa?.cnpj ? usuario.empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : '00.000.000/0000-00'}
                          </p>
                        </div>

                        {/* Product Title */}
                        <div className="mb-2">
                          <h2 className="text-sm font-black tracking-tight uppercase leading-tight">{receita.nome}</h2>
                          <span className="text-[8px] font-bold bg-black text-white px-1.5 py-0.5 rounded-full inline-block mt-1">
                            PESO LÍQUIDO: {totalWeight}g
                          </span>
                        </div>

                        {/* Ingredients section */}
                        <div className="text-[9px] leading-snug border-t border-black pt-1.5 text-justify">
                          <p>
                            <strong>INGREDIENTES:</strong> {ingredientesTexto}.
                          </p>
                          {renderAlergenicos()}
                        </div>
                      </div>

                      {/* Expiry and Batch Details */}
                      <div className="mt-auto grid grid-cols-2 gap-2 text-[8px] font-bold border-t border-black pt-1.5">
                        <div>
                          <p>FAB: {dataFabricacao.split('-').reverse().join('/')}</p>
                          <p>VAL: {dataValidade.split('-').reverse().join('/')}</p>
                        </div>
                        <div className="text-right">
                          <p>LOTE: {lote.toUpperCase()}</p>
                          <p className="text-gray-500 text-[7px] font-medium leading-none">{instrucoesConservacao}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Nutritional Table) */}
                    <div className="col-span-5 flex flex-col gap-1.5 h-full justify-between">
                      {renderLupaFrontal()}
                      {renderTabelaNutricional('9.5px', '7.5px', '6px')}
                    </div>

                  </div>
                ) : (
                  /* VERTICAL OR SQUARE LAYOUT - SINGLE COLUMN STACK */
                  <div className="flex flex-col justify-between h-full gap-3 w-full">
                    <div>
                      {/* Brand Header */}
                      <div className="text-center border-b-2 border-black pb-1.5 mb-2.5">
                        <h1 className="text-xs font-black tracking-widest uppercase mb-0.5">
                          {usuario?.empresa?.nome_fantasia || 'COZINHA DA NUTRI'}
                        </h1>
                        <p className="text-[9px] uppercase font-bold text-gray-500">
                          CNPJ: {usuario?.empresa?.cnpj ? usuario.empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : '00.000.000/0000-00'}
                        </p>
                      </div>

                      {/* Product Title */}
                      <div className="mb-2 text-center">
                        <h2 className="text-base font-black tracking-tight uppercase leading-tight">{receita.nome}</h2>
                        <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded-full inline-block mt-1">
                          PESO LÍQUIDO: {totalWeight}g
                        </span>
                      </div>

                      {/* Ingredients section */}
                      <div className="mb-2.5 text-[10px] leading-snug border-b border-black pb-2 text-justify">
                        <p>
                          <strong>INGREDIENTES:</strong> {ingredientesTexto}.
                        </p>
                        {renderAlergenicos()}
                      </div>

                      {/* Front-of-Package Nutrition Warning */}
                      {renderLupaFrontal()}

                      {/* Nutritional Information Table */}
                      {renderTabelaNutricional('11px', '8px', '6.5px')}
                    </div>

                    {/* Expiry and Batch Details */}
                    <div className="mt-auto grid grid-cols-2 gap-2 text-[9px] font-bold border-t border-black pt-2 w-full">
                      <div>
                        <p>FAB: {dataFabricacao.split('-').reverse().join('/')}</p>
                        <p>VAL: {dataValidade.split('-').reverse().join('/')}</p>
                      </div>
                      <div className="text-right">
                        <p>LOTE: {lote.toUpperCase()}</p>
                        <p className="text-gray-500 text-[8px] font-medium leading-none">{instrucoesConservacao}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
          }
          header, footer, nav, .print-hidden, button, input, select {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:gap-0 {
            gap: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
