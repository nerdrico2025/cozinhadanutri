import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, ChevronDown, Loader2 } from 'lucide-react';
import { Unidade, Ingrediente } from '../types';
import { buscarAlimentos, TacoFood } from '../services/tacoApi';

const ingredienteSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  unidade: z.enum(['g', 'kg', 'ml', 'l', 'unidade']),
  preco: z.number().min(0.01, 'Preco deve ser maior que zero'),
  calorias: z.number().min(0),
  proteinas: z.number().min(0),
  carboidratos: z.number().min(0),
  gorduras: z.number().min(0),
});

type IngredienteForm = z.infer<typeof ingredienteSchema>;

interface CadastroIngredienteProps {
  ingredienteInicial?: Ingrediente;
  onSalvar: (ingrediente: Ingrediente) => void;
  onCancelar: () => void;
}

const unidades: { value: Unidade; label: string }[] = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'unidade', label: 'Unidade' },
];

export function CadastroIngrediente({ ingredienteInicial, onSalvar, onCancelar }: CadastroIngredienteProps) {
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [sugestoesTaco, setSugestoesTaco] = useState<TacoFood[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [tacoIdSelecionado, setTacoIdSelecionado] = useState<number | undefined>(ingredienteInicial?.tacoId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<IngredienteForm>({
    resolver: zodResolver(ingredienteSchema),
    defaultValues: ingredienteInicial
      ? { nome: ingredienteInicial.nome, unidade: ingredienteInicial.unidade as 'g'|'kg'|'ml'|'l'|'unidade', preco: ingredienteInicial.preco, calorias: ingredienteInicial.dadosNutricionais.calorias, proteinas: ingredienteInicial.dadosNutricionais.proteinas, carboidratos: ingredienteInicial.dadosNutricionais.carboidratos, gorduras: ingredienteInicial.dadosNutricionais.gorduras }
      : { unidade: 'g' },
  });

  const buscarSugestoes = (nome: string) => {
    if (nome.length < 2) { setSugestoesTaco([]); setMostrarSugestoes(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCarregando(true); setErroApi(null);
      try {
        const resultados = await buscarAlimentos(nome);
        setSugestoesTaco(resultados);
        setMostrarSugestoes(resultados.length > 0);
      } catch {
        setErroApi('Nao foi possivel buscar na API TACO. Preencha os dados manualmente.');
        setSugestoesTaco([]); setMostrarSugestoes(false);
      } finally { setCarregando(false); }
    }, 400);
  };

  const aplicarDadosTaco = (alimento: TacoFood) => {
    setValue('nome', alimento.description);
    setValue('calorias', alimento.kcal ?? 0);
    setValue('proteinas', alimento.protein ?? 0);
    setValue('carboidratos', alimento.carbohydrate ?? 0);
    setValue('gorduras', alimento.lipids ?? 0);
    setTacoIdSelecionado(alimento.id);
    setMostrarSugestoes(false);
  };

  const onSubmit = (data: IngredienteForm) => {
    onSalvar({
      id: ingredienteInicial?.id ?? crypto.randomUUID(),
      tacoId: tacoIdSelecionado,
      nome: data.nome,
      unidade: data.unidade,
      preco: data.preco,
      dadosNutricionais: { calorias: data.calorias, proteinas: data.proteinas, carboidratos: data.carboidratos, gorduras: data.gorduras },
      createdAt: ingredienteInicial?.createdAt ?? new Date(),
    });
    setTacoIdSelecionado(undefined);
    reset();
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Plus size={22} color="#16a34a" />
        {ingredienteInicial ? 'Editar Ingrediente' : 'Cadastrar Ingrediente'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Nome */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Ingrediente</label>
          <div className="relative">
            <input
              type="text"
              {...register('nome')}
              onChange={(e) => { register('nome').onChange(e); buscarSugestoes(e.target.value); }}
              placeholder="Digite o nome do ingrediente..."
              className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#04585a]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {carregando ? <Loader2 size={18} className="text-[#04585a] animate-spin" /> : <Search size={18} className="text-gray-400" />}
            </span>
          </div>
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          {erroApi && <p className="text-yellow-600 text-xs mt-1">{erroApi}</p>}

          {mostrarSugestoes && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
              {sugestoesTaco.map((alimento) => (
                <button
                  key={alimento.id}
                  type="button"
                  onClick={() => aplicarDadosTaco(alimento)}
                  className="w-full text-left px-4 py-2 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center gap-2 text-sm"
                >
                  <span className="font-medium text-gray-800">{alimento.description}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{alimento.category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unidade + Preco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Medida</label>
            <div className="relative">
              <select
                {...register('unidade')}
                className="w-full px-3 py-3 pr-9 border border-gray-300 rounded-lg text-sm outline-none appearance-none focus:ring-2 focus:ring-[#04585a]"
              >
                {unidades.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </span>
            </div>
            {errors.unidade && <p className="text-red-500 text-xs mt-1">{errors.unidade.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preco por Unidade (R$)</label>
            <input
              type="number"
              step="0.01"
              {...register('preco', { valueAsNumber: true })}
              placeholder="0,00"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#04585a]"
            />
            {errors.preco && <p className="text-red-500 text-xs mt-1">{errors.preco.message}</p>}
          </div>
        </div>

        {/* Dados Nutricionais */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-base font-semibold text-gray-700 mb-3">Dados Nutricionais (por 100g)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([['calorias', 'Calorias (kcal)'], ['proteinas', 'Proteinas (g)'], ['carboidratos', 'Carboidratos (g)'], ['gorduras', 'Gorduras (g)']] as const).map(([field, lbl]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lbl}</label>
                <input
                  type="number"
                  step="0.1"
                  {...register(field, { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#04585a]"
                />
                {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Botoes */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg text-sm transition-colors"
          >
            Salvar Ingrediente
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
