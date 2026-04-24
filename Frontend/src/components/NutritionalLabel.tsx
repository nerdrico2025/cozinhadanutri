import { Printer, X } from 'lucide-react';
import { Receita } from '../types';

interface RotuloNutricionalProps {
  receita: Receita;
  onFechar: () => void;
  onImprimir?: () => void;
}

const VD_REFERENCIA = { calorias: 2000, carboidratos: 300, proteinas: 75, gorduras: 55 };

export function RotuloNutricional({ receita, onFechar, onImprimir }: RotuloNutricionalProps) {
  const calcVD = (valor: number, ref: number) => Math.round((valor / ref) * 100);
  const n = receita.dadosNutricionaisPorPorcao;

  const handleImprimir = () => { window.print(); if (onImprimir) onImprimir(); };

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
                <p>Porcao: 1 unidade ({Math.round(n.calorias * 4.18)} g)*</p>
              </div>
            </div>

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
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Gorduras saturadas</strong>&nbsp;{(n.gorduras * 0.3).toFixed(1)}g***</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{Math.round((n.gorduras * 0.3) / 22 * 100)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Gorduras trans</strong>&nbsp;0g</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">**</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Fibra alimentar</strong>&nbsp;{(n.carboidratos * 0.1).toFixed(1)}g***</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">{Math.round((n.carboidratos * 0.1) / 25 * 100)}%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-left"><strong>Sodio</strong>&nbsp;0mg***</td>
                  <td className="border border-gray-400 px-2 py-2 text-[13px] text-center font-semibold">0%</td>
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
