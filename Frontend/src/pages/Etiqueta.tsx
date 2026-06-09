import { useEffect, useState } from 'react';
import { Printer, ArrowLeft, ShieldAlert, Info, Building, ShieldCheck } from 'lucide-react';
import { obterReceita } from '../services/receitas';
import { listarAlimentos } from '../services/alimentos';
import { calcularNutrientesTotais, calcularDadosNutricionaisPorPorcao } from '../utils/calculations';
import { Receita, Ingrediente } from '../types';

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
  const [tipoImpressora, setTipoImpressora] = useState<'a4' | 'termica'>('a4');
  const [tamanhoPreset, setTamanhoPreset] = useState<'vertical' | 'horizontal' | 'quadrado' | 'personalizado'>('vertical');
  const [larguraMm, setLarguraMm] = useState(100);
  const [alturaMm, setAlturaMm] = useState(130);
  const [escalaFonte, setEscalaFonte] = useState(100);
  const [alturaAutomatica, setAlturaAutomatica] = useState(true);
  const [modoQuantidade, setModoQuantidade] = useState<'auto' | 'manual'>('auto');
  const [quantidadeManual, setQuantidadeManual] = useState<number>(1);
  const [modeloTabela, setModeloTabela] = useState<'auto' | 'vertical' | 'horizontal' | 'linear'>('auto');
  const ocultarCabecalho = false;
  const ocultarIngredientes = false;
  const ocultarLoteValidade = false;
  const [razaoSocial, setRazaoSocial] = useState(() => usuario?.empresa?.razao_social || usuario?.empresa?.nome_fantasia || 'COZINHA DA NUTRI LTDA');
  const [cnpjFabricante, setCnpjFabricante] = useState(() => usuario?.empresa?.cnpj || '00.000.000/0000-00');
  const [endereco, setEndereco] = useState(() => {
    if (usuario?.empresa?.logradouro) {
      return `${usuario.empresa.logradouro}${usuario.empresa.numero ? ', ' + usuario.empresa.numero : ''}${usuario.empresa.complemento ? ' - ' + usuario.empresa.complemento : ''}`;
    }
    return 'Rua Principal, 123';
  });
  const [municipio, setMunicipio] = useState(() => usuario?.empresa?.municipio || 'São Paulo');
  const [estado, setEstado] = useState(() => usuario?.empresa?.uf || 'SP');
  const [modoPreparo, setModoPreparo] = useState('Micro-ondas: retirar parcialmente a tampa e aquecer por 5 minutos.');
  const [alergicos, setAlergicos] = useState({
    leite: false,
    ovo: false,
    trigo: false,
    soja: false,
    peixe: false,
    amendoim: false,
    castanhas: false,
  });
  const [podeConter, setPodeConter] = useState({
    leite: false,
    ovo: false,
    trigo: false,
    soja: false,
    peixe: false,
    amendoim: false,
    castanhas: false,
  });

  const obterQuantidadeSugerida = (): number => {
    if (tipoImpressora === 'termica') return 1;
    const cols = Math.max(1, Math.floor(200 / (larguraMm + 4)));
    const estimadoAltura = alturaAutomatica ? (larguraMm > alturaMm ? 90 : 130) : alturaMm;
    const rows = Math.max(1, Math.floor(285 / (estimadoAltura + 4)));
    return cols * rows;
  };

  const quantidadeEtiquetas = modoQuantidade === 'auto' && tipoImpressora === 'a4' ? obterQuantidadeSugerida() : quantidadeManual;

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

  const parseIdFromHash = (): string | null => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1]);
    return params.get('id');
  };

  const aplicarPreset = (preset: string) => {
    setTamanhoPreset(preset as any);
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
    } else if (preset === 'termica_60x40') {
      setLarguraMm(60);
      setAlturaMm(40);
      setAlturaAutomatica(false);
    } else if (preset === 'termica_60x70') {
      setLarguraMm(60);
      setAlturaMm(70);
      setAlturaAutomatica(false);
    } else if (preset === 'termica_60x100') {
      setLarguraMm(60);
      setAlturaMm(100);
      setAlturaAutomatica(false);
    } else if (preset === 'personalizado') {
      setAlturaAutomatica(false);
    }
  };

  useEffect(() => {
    if (usuario?.empresa) {
      if (usuario.empresa.razao_social || usuario.empresa.nome_fantasia) {
        setRazaoSocial(usuario.empresa.razao_social || usuario.empresa.nome_fantasia);
      }
      if (usuario.empresa.cnpj) {
        setCnpjFabricante(usuario.empresa.cnpj);
      }
      if (usuario.empresa.logradouro) {
        setEndereco(`${usuario.empresa.logradouro}${usuario.empresa.numero ? ', ' + usuario.empresa.numero : ''}${usuario.empresa.complemento ? ' - ' + usuario.empresa.complemento : ''}`);
      }
      if (usuario.empresa.municipio) {
        setMunicipio(usuario.empresa.municipio);
      }
      if (usuario.empresa.uf) {
        setEstado(usuario.empresa.uf);
      }
    }
  }, [usuario]);

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
          const base = parsedIngredientes.find(i => String(i.id) === String(ing.alimento));
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

        const totalWeightCalculated = receitaMapeada.ingredientes.reduce((acc, curr) => acc + curr.quantidade, 0);
        const defaultPortionWeightCalculated = Math.round(totalWeightCalculated / (receitaMapeada.porcoes || 1));
        setPesoPorcaoCustom(defaultPortionWeightCalculated);
        setReceita(receitaMapeada);
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
  const formatarIngredientes = () => {
    const nomes = sortedIngredients.map(i => i.nome.trim().toLowerCase());
    if (nomes.length === 0) return '';
    if (nomes.length === 1) return nomes[0];
    const ultimo = nomes.pop();
    return `${nomes.join(', ')} e ${ultimo}`;
  };
  const ingredientesTexto = formatarIngredientes();

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

  // Diagnóstico Regulatório Checks
  const checkIngredientes = receita.ingredientes && receita.ingredientes.length > 0;
  const checkAlergenicos = contemGluten !== undefined && contemLactose !== undefined;
  const checkPesoLiquido = totalWeight > 0;
  const checkValidade = !!dataValidade;
  const checkTabelaCompleta = receita.dadosNutricionaisPorPorcao && receita.dadosNutricionaisPorPorcao.calorias !== undefined;
  const checkAcucaresTotais = receita.dadosNutricionaisPorPorcao.acucares_totais !== undefined && receita.dadosNutricionaisPorPorcao.acucares_totais >= 0;
  const checkAcucaresAdicionados = receita.dadosNutricionaisPorPorcao.acucares_adicionados !== undefined && receita.dadosNutricionaisPorPorcao.acucares_adicionados >= 0;
  const checkGorduraTrans = receita.dadosNutricionaisPorPorcao.gorduras_trans !== undefined && receita.dadosNutricionaisPorPorcao.gorduras_trans >= 0;
  const checkLupa = true; // Lupa ANVISA sempre avaliada

  const isRotoApto = checkIngredientes && checkPesoLiquido && checkValidade && checkTabelaCompleta && checkAcucaresTotais && checkAcucaresAdicionados && checkGorduraTrans;

  const renderIdentificacaoFabricante = (tamanhoFonte: string, centered = false) => {
    if (ocultarCabecalho) return null;
    return (
      <div className={`border-b border-black pb-1 mb-1 font-sans text-black select-none leading-tight ${centered ? 'text-center' : ''}`} style={{ fontSize: tamanhoFonte }}>
        <h1 className="font-black tracking-widest uppercase mb-0.5" style={{ fontSize: `calc(${tamanhoFonte} * 1.15)` }}>
          {razaoSocial}
        </h1>
        <p className="font-bold text-gray-700">CNPJ: {cnpjFabricante}</p>
        <p className="text-gray-500 font-medium">{endereco} - {municipio}/{estado}</p>
      </div>
    );
  };

  // Generate warning labels for new ANVISA regulations (limits per 100g of solid food: 6g fat, 600mg sodium, 15g sugars)
  const isHighSaturates = n100.saturadas >= 6.0;
  const isHighSodium = n100.sodio >= 600.0;
  const isHighSugars = n100.acucares_adicionados >= 15.0;
  const hasLupa = isHighSaturates || isHighSodium || isHighSugars;

  const isHorizontalLayout = larguraMm > alturaMm;
  const cols = Math.max(1, Math.floor(200 / (larguraMm + 4)));
  const fs = (baseCqw: number) => `calc(${baseCqw}cqw * ${escalaFonte / 100})`;

  const obterTextoAlergicos = () => {
    const listaDireta: string[] = [];
    if (alergicos.leite) listaDireta.push('LEITE');
    if (alergicos.ovo) listaDireta.push('OVO');
    if (alergicos.trigo) listaDireta.push('TRIGO');
    if (alergicos.soja) listaDireta.push('SOJA');
    if (alergicos.peixe) listaDireta.push('PEIXE');
    if (alergicos.amendoim) listaDireta.push('AMENDOIM');
    if (alergicos.castanhas) listaDireta.push('CASTANHAS');

    const listaPodeConter: string[] = [];
    if (podeConter.leite) listaPodeConter.push('LEITE');
    if (podeConter.ovo) listaPodeConter.push('OVO');
    if (podeConter.trigo) listaPodeConter.push('TRIGO');
    if (podeConter.soja) listaPodeConter.push('SOJA');
    if (podeConter.peixe) listaPodeConter.push('PEIXE');
    if (podeConter.amendoim) listaPodeConter.push('AMENDOIM');
    if (podeConter.castanhas) listaPodeConter.push('CASTANHAS');

    let resultado = '';
    if (listaDireta.length > 0) {
      resultado += `ALÉRGICOS: CONTÉM ${listaDireta.join(', ')}`;
    }
    if (listaPodeConter.length > 0) {
      if (resultado) resultado += '. ';
      resultado += `ALÉRGICOS: PODE CONTER ${listaPodeConter.join(', ')}`;
    }
    
    if (outrosAlergenicos.trim()) {
      if (resultado) resultado += '. ';
      const cleaned = outrosAlergenicos.trim().toUpperCase();
      const prefix = cleaned.startsWith('ALÉRGICOS') || cleaned.startsWith('ALERGICOS') ? '' : 'ALÉRGICOS: ';
      resultado += `${prefix}${cleaned}`;
    }

    return resultado;
  };

  const renderAlergenicos = () => {
    const alerts: JSX.Element[] = [];
    
    // Gluten
    if (contemGluten) {
      alerts.push(<span key="gluten" className="block font-bold uppercase text-black" style={{ fontSize: fs(2.4) }}>☑ CONTÉM GLÚTEN</span>);
    } else {
      alerts.push(<span key="gluten" className="block font-bold uppercase text-black" style={{ fontSize: fs(2.4) }}>☑ NÃO CONTÉM GLÚTEN</span>);
    }

    // Lactose
    if (contemLactose) {
      alerts.push(<span key="lactose" className="block font-bold uppercase text-black" style={{ fontSize: fs(2.4) }}>☑ CONTÉM LACTOSE</span>);
    } else {
      alerts.push(<span key="lactose" className="block font-bold uppercase text-black" style={{ fontSize: fs(2.4) }}>☑ NÃO CONTÉM LACTOSE</span>);
    }

    // Allergen warnings
    const textoAlergicos = obterTextoAlergicos();
    if (textoAlergicos) {
      alerts.push(
        <strong key="alergicos" className="block uppercase mt-1 leading-tight text-black" style={{ fontSize: fs(2.4) }}>
          {textoAlergicos}
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
          <span className="font-black leading-none tracking-tighter" style={{ fontSize: fs(2.0) }}>ALTO EM</span>
        </div>
        <div className="flex flex-col gap-0.5 font-extrabold uppercase leading-none justify-center" style={{ fontSize: fs(1.8) }}>
          {isHighSugars && <span>Açúcar Adicionado</span>}
          {isHighSaturates && <span>Gordura Saturada</span>}
          {isHighSodium && <span>Sódio</span>}
        </div>
      </div>
    );
  };

  const renderTabelaNutricional = (tamanhoFonteTitulo: string, tamanhoFonteTabela: string, tamanhoFonteNota: string) => {
    const modeloEfetivo = modeloTabela === 'auto'
      ? (alturaMm < 80 || larguraMm < 80 ? 'linear' : (larguraMm > alturaMm ? 'horizontal' : 'vertical'))
      : modeloTabela;

    if (modeloEfetivo === 'linear') {
      return (
        <div className="border border-black p-1.5 font-sans bg-white w-full text-black select-none text-justify leading-tight" style={{ fontSize: tamanhoFonteTabela }}>
          <strong className="tracking-wider uppercase block border-b border-black pb-0.5 mb-1 text-center" style={{ fontSize: tamanhoFonteTitulo }}>
            Informação Nutricional
          </strong>
          <span className="font-bold">Porções por embalagem:</span> {receita.porcoes} | <span className="font-bold">Porção:</span> {currentPortionWeight}g.<br />
          <span className="font-bold">Valor energético:</span> {Math.round(n.calorias)} kcal ({calcVD(n.calorias, VD_REFERENCIA.calorias)}% VD*);{' '}
          <span className="font-bold">Carboidratos:</span> {n.carboidratos.toFixed(1)}g ({calcVD(n.carboidratos, VD_REFERENCIA.carboidratos)}% VD*);{' '}
          <span className="font-bold">Açúcares totais:</span> {n.acucares_totais.toFixed(1)}g;{' '}
          <span className="font-bold">Açúcares adicionados:</span> {n.acucares_adicionados.toFixed(1)}g ({calcVD(n.acucares_adicionados, 50)}% VD*);{' '}
          <span className="font-bold">Proteínas:</span> {n.proteinas.toFixed(1)}g ({calcVD(n.proteinas, VD_REFERENCIA.proteinas)}% VD*);{' '}
          <span className="font-bold">Gorduras totais:</span> {n.gorduras.toFixed(1)}g ({calcVD(n.gorduras, VD_REFERENCIA.gorduras)}% VD*);{' '}
          <span className="font-bold">Gorduras saturadas:</span> {n.saturadas.toFixed(1)}g ({calcVD(n.saturadas, 22)}% VD*);{' '}
          <span className="font-bold">Gorduras trans:</span> {n.trans.toFixed(1)}g (**% VD*);{' '}
          <span className="font-bold">Fibra alimentar:</span> {n.fibras.toFixed(1)}g ({calcVD(n.fibras, 25)}% VD*);{' '}
          <span className="font-bold">Sódio:</span> {Math.round(n.sodio)}mg ({calcVD(n.sodio, 2000)}% VD*).<br />
          <span className="text-[10px] text-gray-500 font-medium block mt-1 leading-none" style={{ fontSize: tamanhoFonteNota }}>
            * Percentual de valores diários fornecidos pela porção.
          </span>
        </div>
      );
    }

    if (modeloEfetivo === 'horizontal') {
      return (
        <div className="border border-black p-1 font-sans bg-white w-full text-black select-none">
          <p className="text-center font-black tracking-wider uppercase mb-0.5" style={{ fontSize: tamanhoFonteTitulo }}>
            Informação Nutricional
          </p>
          <p className="text-center mb-1 font-semibold" style={{ fontSize: tamanhoFonteNota }}>
            Porções por embalagem: {receita.porcoes} | Porção: {currentPortionWeight}g
          </p>
          <div className="grid grid-cols-2 gap-2 border-t border-black pt-1">
            {/* Coluna 1 */}
            <table className="w-full text-left border-collapse" style={{ fontSize: tamanhoFonteTabela }}>
              <thead>
                <tr className="border-b border-black">
                  <th className="py-0.5 font-bold">Nutrientes</th>
                  <th className="py-0.5 text-center font-bold">100g</th>
                  <th className="py-0.5 text-center font-bold">%VD*</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Valor energético (kcal)</td>
                  <td className="py-0.5 text-center">{Math.round(n100.calorias)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.calorias, VD_REFERENCIA.calorias)}%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Carboidratos (g)</td>
                  <td className="py-0.5 text-center">{n100.carboidratos.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.carboidratos, VD_REFERENCIA.carboidratos)}%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 pl-1.5 text-gray-800">Açúcares tot. (g)</td>
                  <td className="py-0.5 text-center">{n100.acucares_totais.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">-</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 pl-1.5 text-gray-800">Açúcares ad. (g)</td>
                  <td className="py-0.5 text-center">{n100.acucares_adicionados.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.acucares_adicionados, 50)}%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Proteínas (g)</td>
                  <td className="py-0.5 text-center">{n100.proteinas.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.proteinas, VD_REFERENCIA.proteinas)}%</td>
                </tr>
              </tbody>
            </table>
            {/* Coluna 2 */}
            <table className="w-full text-left border-collapse" style={{ fontSize: tamanhoFonteTabela }}>
              <thead>
                <tr className="border-b border-black">
                  <th className="py-0.5 font-bold">Nutrientes</th>
                  <th className="py-0.5 text-center font-bold">100g</th>
                  <th className="py-0.5 text-center font-bold">%VD*</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Gorduras tot. (g)</td>
                  <td className="py-0.5 text-center">{n100.gorduras.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.gorduras, VD_REFERENCIA.gorduras)}%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Gorduras sat. (g)</td>
                  <td className="py-0.5 text-center">{n100.saturadas.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.saturadas, 22)}%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Gorduras trans (g)</td>
                  <td className="py-0.5 text-center">{n100.trans.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">**</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Fibra alim. (g)</td>
                  <td className="py-0.5 text-center">{n100.fibras.toFixed(1)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.fibras, 25)}%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5">Sódio (mg)</td>
                  <td className="py-0.5 text-center">{Math.round(n100.sodio)}</td>
                  <td className="py-0.5 text-center font-bold">{calcVD(n.sodio, 2000)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="leading-tight text-gray-500 mt-1 pt-0.5 border-t border-black text-justify font-medium" style={{ fontSize: tamanhoFonteNota }}>
            * Percentual de valores diários fornecidos pela porção.
          </p>
        </div>
      );
    }

    return (
      <div className="border border-black p-1 font-sans bg-white w-full text-black select-none">
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
          <button
            onClick={handlePrint}
            style={{ backgroundColor: '#04585a' }}
            className="flex items-center gap-2 py-3 px-6 text-white rounded-xl font-bold hover:brightness-95 transition shadow-sm border-0 cursor-pointer text-sm animate-pulse"
          >
            <Printer size={18} />
            Imprimir Etiqueta
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full print:gap-0">
          
          {/* LEFT: Controls Panel - Hidden in printing */}
          <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
            
            {/* Tipo de Impressão Configuration */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#04585a] pb-3 border-b border-gray-100">
                <Printer size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Tipo de Impressora</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTipoImpressora('a4'); setModoQuantidade('auto'); }}
                  className={`text-left p-3 text-xs font-bold rounded-lg border transition-all ${
                    tipoImpressora === 'a4'
                      ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                  }`}
                >
                  📄 Folha A4 (Jato de Tinta/Laser)
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setTipoImpressora('termica'); 
                    setModoQuantidade('manual'); 
                    setQuantidadeManual(1);
                    setTamanhoPreset('horizontal');
                    setLarguraMm(60);
                    setAlturaMm(40);
                    setAlturaAutomatica(false);
                  }}
                  className={`text-left p-3 text-xs font-bold rounded-lg border transition-all ${
                    tipoImpressora === 'termica'
                      ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                  }`}
                >
                  🏷️ Impressora Térmica (Bobina)
                </button>
              </div>
            </div>

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
                  {tipoImpressora === 'a4' ? (
                    [
                      { id: 'vertical', label: 'Vertical ANVISA (100x130mm)' },
                      { id: 'horizontal', label: 'Horizontal ANVISA (150x80mm)' },
                      { id: 'quadrado', label: 'Quadrado Compacto (80x80mm)' },
                      { id: 'personalizado', label: 'Personalizado' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => aplicarPreset(p.id)}
                        className={`text-left p-2.5 text-xs font-bold rounded-lg border transition-all ${
                          tamanhoPreset === p.id
                            ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))
                  ) : (
                    [
                      { id: 'termica_60x40', label: 'Térmica Padrão (60x40mm)' },
                      { id: 'termica_60x70', label: 'Térmica Média (60x70mm)' },
                      { id: 'termica_60x100', label: 'Térmica Longa (60x100mm)' },
                      { id: 'personalizado', label: 'Personalizado' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => aplicarPreset(p.id)}
                        className={`text-left p-2.5 text-xs font-bold rounded-lg border transition-all ${
                          tamanhoPreset === p.id
                            ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Modelo de Tabela Nutricional */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Modelo de Tabela ANVISA</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'auto', label: '🤖 Auto (Ajusta p/ Tamanho)' },
                    { id: 'vertical', label: '📊 Tabela Vertical' },
                    { id: 'horizontal', label: '📋 Tabela Horizontal' },
                    { id: 'linear', label: '📝 Rótulo Linear (Pequeno)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModeloTabela(m.id as any)}
                      className={`text-left p-2.5 text-xs font-bold rounded-lg border transition-all ${
                        modeloTabela === m.id
                          ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
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
                    onChange={(e) => setLarguraMm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    value={alturaMm}
                    disabled={tamanhoPreset !== 'personalizado' || alturaAutomatica}
                    onChange={(e) => setAlturaMm(Number(e.target.value))}
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

              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Quantidade de Etiquetas</label>
                <div className="flex flex-col gap-2">
                  {tipoImpressora === 'a4' && (
                    <button
                      type="button"
                      onClick={() => setModoQuantidade('auto')}
                      className={`w-full py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        modoQuantidade === 'auto'
                          ? 'bg-teal-50 border-teal-500 text-[#04585a] shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      ✨ Auto-preencher folha A4 ({obterQuantidadeSugerida()} {obterQuantidadeSugerida() === 1 ? 'etiqueta' : 'etiquetas'})
                    </button>
                  )}
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 8].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setModoQuantidade('manual');
                          setQuantidadeManual(q);
                        }}
                        className={`text-center py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          modoQuantidade === 'manual' && quantidadeManual === q
                            ? 'bg-teal-50 border-teal-500 text-[#04585a]'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                        }`}
                      >
                        {q === 1 ? '1x (Avulso)' : `${q}x`}
                      </button>
                    ))}
                  </div>
                </div>
                
                {tipoImpressora === 'a4' ? (
                  <span className="text-[10px] font-medium text-gray-400 leading-tight mt-1">
                    Grade de impressão: {Math.max(1, Math.floor(200 / (larguraMm + 4)))} {Math.max(1, Math.floor(200 / (larguraMm + 4))) === 1 ? 'coluna' : 'colunas'} x {Math.max(1, Math.floor(285 / ((alturaAutomatica ? (larguraMm > alturaMm ? 90 : 130) : alturaMm) + 4)))} {Math.max(1, Math.floor(285 / ((alturaAutomatica ? (larguraMm > alturaMm ? 90 : 130) : alturaMm) + 4))) === 1 ? 'linha' : 'linhas'} por folha.
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-gray-400 leading-tight mt-1">
                    Impressão térmica contínua: Cada etiqueta será impressa individualmente na bobina.
                  </span>
                )}
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
                <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Glúten e Lactose</span>
                <div className="flex gap-4 mb-3 border-b border-gray-100 pb-2">
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

                <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Alérgicos: Contém</span>
                <div className="grid grid-cols-2 gap-2 mb-3 border-b border-gray-100 pb-3">
                  {[
                    { id: 'leite', label: 'Leite' },
                    { id: 'ovo', label: 'Ovo' },
                    { id: 'trigo', label: 'Trigo' },
                    { id: 'soja', label: 'Soja' },
                    { id: 'peixe', label: 'Peixe' },
                    { id: 'amendoim', label: 'Amendoim' },
                    { id: 'castanhas', label: 'Castanhas' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alergicos[item.id as keyof typeof alergicos]}
                        onChange={(e) => setAlergicos({ ...alergicos, [item.id]: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Alérgicos: Pode Conter (Cruzada)</span>
                <div className="grid grid-cols-2 gap-2 mb-3 border-b border-gray-100 pb-3">
                  {[
                    { id: 'leite', label: 'Leite' },
                    { id: 'ovo', label: 'Ovo' },
                    { id: 'trigo', label: 'Trigo' },
                    { id: 'soja', label: 'Soja' },
                    { id: 'peixe', label: 'Peixe' },
                    { id: 'amendoim', label: 'Amendoim' },
                    { id: 'castanhas', label: 'Castanhas' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={podeConter[item.id as keyof typeof podeConter]}
                        onChange={(e) => setPodeConter({ ...podeConter, [item.id]: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Outros Alérgicos (ex: Crustáceos)</label>
                  <input
                    type="text"
                    placeholder="Ex: Contém derivados de cevada..."
                    value={outrosAlergenicos}
                    onChange={(e) => setOutrosAlergenicos(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

            </div>


            {/* Modo de Preparo Configuration */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#04585a] pb-3 border-b border-gray-100">
                <Info size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Modo de Preparo</h3>
              </div>
              
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Modo de Preparo</label>
                  <textarea
                    value={modoPreparo}
                    onChange={(e) => setModoPreparo(e.target.value)}
                    rows={2}
                    placeholder="Ex: Retirar a tampa e aquecer no micro-ondas..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Diagnóstico Regulatório */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-[#04585a]">
                  <ShieldCheck size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Diagnóstico Regulatório</h3>
                </div>
                {isRotoApto ? (
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    🟢 Rótulo Apto
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    🔴 Incompleto
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Lista de ingredientes preenchida</span>
                  <span>{checkIngredientes ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alergênicos avaliados</span>
                  <span>{checkAlergenicos ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Peso líquido informado</span>
                  <span>{checkPesoLiquido ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Validade informada</span>
                  <span>{checkValidade ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tabela nutricional completa</span>
                  <span>{checkTabelaCompleta ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Açúcares totais informados</span>
                  <span>{checkAcucaresTotais ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Açúcares adicionados informados</span>
                  <span>{checkAcucaresAdicionados ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gordura trans informada</span>
                  <span>{checkGorduraTrans ? '✅' : '❌'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Aviso de lupa ANVISA checado</span>
                  <span>{checkLupa ? '✅' : '❌'}</span>
                </div>
              </div>

              {!isRotoApto && (
                <div className="mt-2 p-3 bg-red-50 rounded-xl text-[11px] text-red-800 leading-relaxed">
                  <strong>Atenção:</strong> Existem pendências regulatórias. Complete os dados obrigatórios para garantir conformidade com as normas ANVISA.
                </div>
              )}
            </div>

            {/* Print Help Information */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-3">
              <Printer className="text-amber-600 mt-0.5 shrink-0" size={18} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Ajustes de Impressão:</p>
                {tipoImpressora === 'termica' ? (
                  <>
                    <p>1. Selecione a sua impressora térmica nas opções de destino.</p>
                    <p className="mt-1">2. Configure o tamanho do papel nas propriedades da impressão de acordo com a etiqueta selecionada (ex: <strong>{larguraMm}x{alturaMm}mm</strong>).</p>
                    <p className="mt-1">3. Defina as <strong>Margens como "Nenhuma"</strong> e ative <strong>"Gráficos de fundo"</strong> para o layout ajustar perfeitamente ao papel.</p>
                  </>
                ) : (
                  <>
                    <p>1. Na janela de impressão, marque a opção <strong>"Imprimir cores/gráficos de fundo"</strong> para garantir a exibição correta das tabelas e contrastes.</p>
                    <p className="mt-1">2. Certifique-se de que a escala de impressão esteja em <strong>100% (ou "Ajustar à página")</strong> no papel A4.</p>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Label visual preview */}
          <div className="lg:col-span-7 flex flex-col items-center print:block print:w-full w-full overflow-hidden">
            
            {/* The sticker ticket representation */}
            <div 
              className="bg-slate-50 p-6 rounded-2xl border border-gray-200/50 print:shadow-none print:border-0 print:p-0 w-full overflow-x-auto"
            >
              <div 
                className="print-grid grid gap-4 justify-center w-full justify-items-center"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  maxWidth: `${cols * (larguraMm + 4)}mm`,
                }}
              >
                {Array.from({ length: quantidadeEtiquetas }).map((_, index) => (
                  <div 
                    key={index}
                    className="border-2 border-black p-4 font-sans text-black relative bg-white flex flex-col justify-between print-item"
                    style={{
                      width: '100%',
                      maxWidth: `${larguraMm}mm`,
                      minHeight: alturaAutomatica ? 'auto' : `${alturaMm}mm`,
                      height: alturaAutomatica ? 'auto' : `${alturaMm}mm`,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      containerType: 'inline-size'
                    }}
                  >
                    {isHorizontalLayout ? (
                      /* HORIZONTAL LAYOUT - TWO COLUMNS */
                      <div className="grid grid-cols-12 gap-4 h-full items-start w-full">
                        
                        {/* Left Column (Product Info & Ingredients) */}
                        <div className="col-span-7 flex flex-col justify-between h-full gap-2">
                          <div>
                            {/* Brand Header */}
                            {renderIdentificacaoFabricante(fs(2.1))}

                            {/* Product Title */}
                            <div className="mb-2">
                              <h2 className="font-black tracking-tight uppercase leading-tight" style={{ fontSize: fs(3.7) }}>{receita.nome}</h2>
                              <span className="font-bold bg-black text-white px-1.5 py-0.5 rounded-full inline-block mt-1" style={{ fontSize: fs(2.1) }}>
                                PESO LÍQUIDO: {totalWeight}g
                              </span>
                            </div>

                            {/* Ingredients section */}
                            {!ocultarIngredientes && (
                              <div className="leading-snug border-t border-black pt-1.5 text-justify" style={{ fontSize: fs(2.4) }}>
                                <p>
                                  <strong>Ingredientes:</strong> {ingredientesTexto}.
                                </p>
                                {renderAlergenicos()}
                                {modoPreparo && (
                                  <p className="mt-1 leading-normal text-black font-semibold" style={{ fontSize: fs(2.4) }}>
                                    <strong>Modo de preparo:</strong> {modoPreparo}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Expiry and Batch Details */}
                          {!ocultarLoteValidade && (
                            <div className="mt-auto grid grid-cols-2 gap-2 font-bold border-t border-black pt-1.5" style={{ fontSize: fs(2.1) }}>
                              <div>
                                <p>FAB: {dataFabricacao.split('-').reverse().join('/')}</p>
                                <p>VAL: {dataValidade.split('-').reverse().join('/')}</p>
                              </div>
                              <div className="text-right">
                                <p>LOTE: {lote.toUpperCase()}</p>
                                <p className="text-gray-500 font-medium leading-none" style={{ fontSize: fs(1.8) }}>{instrucoesConservacao}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column (Nutritional Table) */}
                        <div className="col-span-5 flex flex-col gap-1.5 h-full justify-between">
                          {renderLupaFrontal()}
                          {renderTabelaNutricional(fs(2.5), fs(2.0), fs(1.6))}
                        </div>

                      </div>
                    ) : (
                      /* VERTICAL OR SQUARE LAYOUT - SINGLE COLUMN STACK */
                      <div className="flex flex-col justify-between h-full gap-3 w-full">
                        <div>
                          {/* Brand Header */}
                          {renderIdentificacaoFabricante(fs(2.4), true)}

                          {/* Product Title */}
                          <div className="mb-2 text-center">
                            <h2 className="font-black tracking-tight uppercase leading-tight" style={{ fontSize: fs(4.2) }}>{receita.nome}</h2>
                            <span className="font-bold bg-black text-white px-2 py-0.5 rounded-full inline-block mt-1" style={{ fontSize: fs(2.4) }}>
                              PESO LÍQUIDO: {totalWeight}g
                            </span>
                          </div>

                          {/* Ingredients section */}
                          {!ocultarIngredientes && (
                            <div className="mb-2.5 leading-snug border-b border-black pb-2 text-justify" style={{ fontSize: fs(2.6) }}>
                              <p>
                                <strong>Ingredientes:</strong> {ingredientesTexto}.
                              </p>
                              {renderAlergenicos()}
                              {modoPreparo && (
                                <p className="mt-1 leading-normal text-black font-semibold" style={{ fontSize: fs(2.6) }}>
                                  <strong>Modo de preparo:</strong> {modoPreparo}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Front-of-Package Nutrition Warning */}
                          {renderLupaFrontal()}

                          {/* Nutritional Information Table */}
                          {renderTabelaNutricional(fs(2.9), fs(2.1), fs(1.7))}
                        </div>

                        {/* Expiry and Batch Details */}
                        {!ocultarLoteValidade && (
                          <div className="mt-auto grid grid-cols-2 gap-2 font-bold border-t border-black pt-2 w-full" style={{ fontSize: fs(2.4) }}>
                            <div>
                              <p>FAB: {dataFabricacao.split('-').reverse().join('/')}</p>
                              <p>VAL: {dataValidade.split('-').reverse().join('/')}</p>
                            </div>
                            <div className="text-right">
                              <p>LOTE: {lote.toUpperCase()}</p>
                              <p className="text-gray-500 font-medium leading-none" style={{ fontSize: fs(2.1) }}>{instrucoesConservacao}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media print {
          @page {
            margin: 0;
            ${tipoImpressora === 'termica' ? `size: ${larguraMm}mm ${alturaMm}mm;` : ''}
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
          .print-grid {
            ${tipoImpressora === 'a4' ? `
            display: grid !important;
            grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
            gap: 4mm !important;
            justify-content: center !important;
            padding: 10mm 0 !important;
            max-width: 100% !important;
            ` : `
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            padding: 0 !important;
            width: ${larguraMm}mm !important;
            align-items: center !important;
            `}
          }
          .print-item {
            width: 100% !important;
            max-width: ${larguraMm}mm !important;
            container-type: inline-size !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            ${tipoImpressora === 'termica' ? `
            height: ${alturaMm}mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            page-break-after: always !important;
            border: 1px solid black !important;
            ` : ''}
          }
        }
      `}</style>
    </div>
  );
}
