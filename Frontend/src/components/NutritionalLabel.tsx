import { useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { Receita } from '../types';
import { gerarRotulo } from '../services/receitas';

interface RotuloNutricionalProps {
  receita: Receita;
  onFechar: () => void;
  onImprimir?: () => void;
}

const VD_REFERENCIA = { calorias: 2000, carboidratos: 300, proteinas: 75, gorduras: 55 };

export function RotuloNutricional({ receita, onFechar, onImprimir }: RotuloNutricionalProps) {
  const calcVD = (valor: number, ref: number) => Math.round((valor / ref) * 100);
  
  const [loading, setLoading] = useState(true);
  const [rotuloData, setRotuloData] = useState<any>(null);

  useEffect(() => {
    if (receita.id) {
      setLoading(true);
      gerarRotulo(receita.id).then((data) => {
        setRotuloData(data);
        setLoading(false);
      }).catch((err: any) => {
        console.error('Erro ao buscar rotulo do backend:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [receita.id]);

  const handleImprimir = () => { window.print(); if (onImprimir) onImprimir(); };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Use backend data if available, fallback to local recipe data (adjusted to absolute since backend gives total)
  const porcoes = receita.porcoes && receita.porcoes > 0 ? receita.porcoes : 1;
  const n = rotuloData ? {
    calorias: rotuloData.tabela_nutricional.energia_kcal / porcoes,
    carboidratos: rotuloData.tabela_nutricional.carboidratos / porcoes,
    proteinas: rotuloData.tabela_nutricional.proteinas / porcoes,
    gorduras: rotuloData.tabela_nutricional.gorduras_totais / porcoes,
    saturadas: rotuloData.tabela_nutricional.gorduras_saturadas / porcoes,
    trans: 0,
    fibras: rotuloData.tabela_nutricional.fibra_alimentar / porcoes,
    sodio: rotuloData.tabela_nutricional.sodio / porcoes,
    acucares_adicionados: (rotuloData.tabela_nutricional.acucares_adicionados || 0) / porcoes
  } : {
    calorias: receita.dadosNutricionaisPorPorcao.calorias,
    carboidratos: receita.dadosNutricionaisPorPorcao.carboidratos,
    proteinas: receita.dadosNutricionaisPorPorcao.proteinas,
    gorduras: receita.dadosNutricionaisPorPorcao.gorduras,
    saturadas: receita.dadosNutricionaisPorPorcao.gorduras_saturadas,
    trans: receita.dadosNutricionaisPorPorcao.gorduras_trans || 0,
    fibras: receita.dadosNutricionaisPorPorcao.fibras,
    sodio: receita.dadosNutricionaisPorPorcao.sodio,
    acucares_adicionados: receita.dadosNutricionaisPorPorcao.acucares_adicionados || 0
  };

  const totalWeight = receita.ingredientes 
    ? receita.ingredientes.reduce((acc, curr) => {
        const unit = curr.unidade || 'g';
        const weight = curr.quantidade * (unit === 'kg' || unit === 'l' ? 1000 : 1);
        return acc + weight;
      }, 0)
    : 0;
  const portionWeight = totalWeight > 0 ? Math.round(totalWeight / (receita.porcoes || 1)) : 100;

  const isLiquidHeuristic = 
    /suco|suqu|bebida|sopa|caldo|refri|cha|chá|leite|liquido|líquido|agua|água/i.test(receita.nome || '') ||
    /suco|suqu|bebida|sopa|caldo|refri|cha|chá|leite|liquido|líquido|agua|água/i.test(receita.descricao || '') ||
    (receita.ingredientes && receita.ingredientes.some(ing => ing.unidade === 'ml' || ing.unidade === 'l'));
  const tipoAlimento = isLiquidHeuristic ? 'liquido' : 'solido';

  const n100 = {
    saturadas: (n.saturadas / portionWeight) * 100,
    sodio: (n.sodio / portionWeight) * 100,
    acucares_adicionados: (n.acucares_adicionados / portionWeight) * 100
  };

  const isHighSaturates = tipoAlimento === 'solido' ? n100.saturadas >= 6.0 : n100.saturadas >= 3.0;
  const isHighSodium = tipoAlimento === 'solido' ? n100.sodio >= 600.0 : n100.sodio >= 300.0;
  const isHighSugars = tipoAlimento === 'solido' ? n100.acucares_adicionados >= 15.0 : n100.acucares_adicionados >= 7.5;
  const hasLupa = isHighSaturates || isHighSodium || isHighSugars;

  const renderLupaFrontal = () => {
    if (!hasLupa) return null;
    
    const segments: string[] = [];
    if (isHighSaturates) segments.push('gordurasaturada');
    if (isHighSugars) segments.push('acucaradicionado');
    if (isHighSodium) segments.push('sodio');
    
    const svgName = `lupa-${segments.join('-')}.svg`;
    
    return (
      <div className="mb-4 w-full flex justify-center no-print">
        <img 
          src={`/${svgName}`} 
          alt="Lupa ANVISA" 
          className="max-h-[50px] object-contain" 
        />
      </div>
    );
  };

  // Sort ingredients list by quantity descending (as per ANVISA standards)
  const sortedIngredients = receita.ingredientes 
    ? [...receita.ingredientes].sort((a, b) => b.quantidade - a.quantidade)
    : [];

  const formatarIngredientes = () => {
    const nomes = sortedIngredients.map(i => i.nome.trim().toLowerCase());
    if (nomes.length === 0) return '';
    if (nomes.length === 1) return nomes[0];
    const ultimo = nomes.pop();
    return `${nomes.join(', ')} e ${ultimo}`;
  };
  const ingredientesTexto = formatarIngredientes();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-[440px] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 no-print">
          <h2 className="text-lg font-bold text-gray-800">Rotulo Nutricional</h2>
          <div className="flex gap-1.5">
            <button
              onClick={handleImprimir}
              title="Imprimir"
              className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onFechar}
              title="Fechar"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conteudo */}
        <div className="p-6 print-area">
          <div className="border-2 border-black p-4 font-sans">
            {/* Titulo */}
            <div className="text-center mb-4">
              <p className="text-[17px] font-bold mb-1">INFORMACAO NUTRICIONAL</p>
              <div className="text-[13px]">
                <p className="font-semibold">{receita.nome}</p>
                <p>Porcao: 1 unidade ({portionWeight} g)*</p>
              </div>
            </div>

            {/* Lupa Frontal */}
            {renderLupaFrontal()}

            {/* Tabela */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-400 px-2 py-2 text-left text-[13px] font-bold bg-gray-100">Quantidade por porcao</th>
                  <th className="border border-gray-400 px-2 py-2 text-center text-[13px] font-bold bg-gray-100">%VD (**)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Valor energetico</strong>&nbsp;{Math.round(n.calorias)} kcal = {Math.round(n.calorias * 4.18)} kJ</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.calorias, VD_REFERENCIA.calorias)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Carboidratos</strong>&nbsp;{n.carboidratos.toFixed(1)}g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.carboidratos, VD_REFERENCIA.carboidratos)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Proteinas</strong>&nbsp;{n.proteinas.toFixed(1)}g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.proteinas, VD_REFERENCIA.proteinas)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Gorduras totais</strong>&nbsp;{n.gorduras.toFixed(1)}g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.gorduras, VD_REFERENCIA.gorduras)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Gorduras saturadas</strong>&nbsp;{n.saturadas.toFixed(1)}g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.saturadas, 22)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Gorduras trans</strong>&nbsp;{n.trans.toFixed(1)}g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">**</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Fibra alimentar</strong>&nbsp;{n.fibras.toFixed(1)}g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.fibras, 25)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Sodio</strong>&nbsp;{Math.round(n.sodio)}mg</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{calcVD(n.sodio, 2000)}%</td>
                </tr>
              </tbody>
            </table>

            {/* Rodape */}
            <div className="mt-4 text-[11px] leading-relaxed">
              <p><strong>*</strong> Valores aproximados baseados nos ingredientes utilizados.</p>
              <p><strong>**</strong> % Valores Diarios de referencia com base em uma dieta de 2000 kcal. Seus valores podem ser maiores ou menores conforme suas necessidades energeticas.</p>
              <p><strong>***</strong> Valores estimados. Consulte um nutricionista para valores precisos.</p>
            </div>

            {/* Info produto */}
            <div className="mt-4 pt-4 border-t border-gray-300 text-[11px]">
              <p><strong>Produto:</strong> {receita.nome}</p>
              <p><strong>Porcoes:</strong> {receita.porcoes} unidades</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              {receita.descricao && <p><strong>Descricao:</strong> {receita.descricao}</p>}
            </div>

            {/* Ingredientes */}
            {ingredientesTexto && (
              <div className="mt-4 pt-4 border-t border-gray-300 text-[11px] text-justify leading-relaxed">
                <p><strong>Ingredientes:</strong> {ingredientesTexto}.</p>
              </div>
            )}
          </div>

          {/* Rodape complementar */}
          <div className="mt-4 text-[11px] text-gray-500 leading-relaxed">
            <p><strong>Gerado pelo Sistema Cozinha da Nutri</strong></p>
            <p>Este rotulo segue as diretrizes da ANVISA para rotulagem nutricional.</p>
            <p>Consulte um nutricionista para informacoes detalhadas sobre composicao nutricional.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
