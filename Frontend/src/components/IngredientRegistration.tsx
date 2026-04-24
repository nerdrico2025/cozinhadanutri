import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search, ChevronDown, Loader2, ArrowLeft,
  PackagePlus, DollarSign, Flame, Beef, Wheat, Droplets,
} from 'lucide-react';
import { Unidade, Ingrediente } from '../types';
import { buscarAlimentos, TacoFood } from '../services/tacoApi';

const ingredienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  unidade: z.enum(['g', 'kg', 'ml', 'l', 'unidade']),
  preco: z.number().min(0.01, 'Preço deve ser maior que zero'),
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

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 border rounded-lg text-sm outline-none box-border transition-colors ${
    hasError
      ? 'border-red-400 bg-red-50 focus:border-red-500'
      : 'border-gray-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand/20'
  }`;

export function CadastroIngrediente({ ingredienteInicial, onSalvar, onCancelar }: CadastroIngredienteProps) {
  const [sugestoesTaco, setSugestoesTaco] = useState<TacoFood[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [tacoIdSelecionado, setTacoIdSelecionado] = useState<number | undefined>(ingredienteInicial?.tacoId);
  const [salvando, setSalvando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<IngredienteForm>({
    resolver: zodResolver(ingredienteSchema),
    defaultValues: ingredienteInicial
      ? {
          nome: ingredienteInicial.nome,
          unidade: ingredienteInicial.unidade as 'g' | 'kg' | 'ml' | 'l' | 'unidade',
          preco: ingredienteInicial.preco,
          calorias: ingredienteInicial.dadosNutricionais.calorias,
          proteinas: ingredienteInicial.dadosNutricionais.proteinas,
          carboidratos: ingredienteInicial.dadosNutricionais.carboidratos,
          gorduras: ingredienteInicial.dadosNutricionais.gorduras,
        }
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
        setErroApi('Não foi possível buscar na API TACO. Preencha os dados manualmente.');
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
    setSalvando(true);
    try {
      onSalvar({
        id: ingredienteInicial?.id ?? crypto.randomUUID(),
        tacoId: tacoIdSelecionado,
        nome: data.nome,
        unidade: data.unidade,
        preco: data.preco,
        dadosNutricionais: {
          calorias: data.calorias,
          proteinas: data.proteinas,
          carboidratos: data.carboidratos,
          gorduras: data.gorduras,
        },
        createdAt: ingredienteInicial?.createdAt ?? new Date(),
      });
      setTacoIdSelecionado(undefined);
      reset();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header sticky ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors focus:outline-none"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <span className="text-gray-200 select-none">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                <PackagePlus size={15} className="text-brand" />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {ingredienteInicial ? 'Editar Ingrediente' : 'Novo Ingrediente'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelar}
              className="hidden sm:block px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={salvando}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                salvando
                  ? 'bg-brand/40 cursor-not-allowed'
                  : 'bg-brand hover:brightness-110 cursor-pointer'
              }`}
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : null}
              {salvando ? 'Salvando…' : 'Salvar Ingrediente'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Corpo ─────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

          {/* Seção 1 — Identificação */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <h2 className="text-sm font-semibold text-gray-800">Identificação</h2>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Busca TACO */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nome do Ingrediente <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    {...register('nome')}
                    onChange={(e) => {
                      register('nome').onChange(e);
                      buscarSugestoes(e.target.value);
                    }}
                    onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                    onFocus={() => sugestoesTaco.length > 0 && setMostrarSugestoes(true)}
                    placeholder="Digite para pesquisar na tabela TACO…"
                    className={`${inputCls(!!errors.nome)} pl-9 pr-8`}
                  />
                  {carregando && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                {erroApi && <p className="text-yellow-600 text-xs mt-1">{erroApi}</p>}
                {tacoIdSelecionado && (
                  <p className="text-brand text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                    Vinculado à tabela TACO (ID {tacoIdSelecionado})
                  </p>
                )}

                {mostrarSugestoes && sugestoesTaco.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                    {sugestoesTaco.map((alimento) => (
                      <button
                        key={alimento.id}
                        type="button"
                        onMouseDown={() => aplicarDadosTaco(alimento)}
                        className="w-full text-left px-4 py-2.5 hover:bg-brand/5 border-0 bg-transparent cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-b-0"
                      >
                        <span className="text-sm text-gray-800 truncate">{alimento.description}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{alimento.category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Unidade + Preço */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Unidade de Medida
                  </label>
                  <div className="relative">
                    <select
                      {...register('unidade')}
                      className={`${inputCls(!!errors.unidade)} appearance-none pr-8`}
                    >
                      {unidades.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.unidade && <p className="text-red-500 text-xs mt-1">{errors.unidade.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Preço por Unidade (R$) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      step="0.01"
                      min={0.01}
                      {...register('preco', { valueAsNumber: true })}
                      placeholder="0,00"
                      className={`${inputCls(!!errors.preco)} pl-8`}
                    />
                  </div>
                  {errors.preco && <p className="text-red-500 text-xs mt-1">{errors.preco.message}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 — Dados Nutricionais */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <h2 className="text-sm font-semibold text-gray-800">
                  Dados Nutricionais
                  <span className="ml-2 text-xs font-normal text-gray-400">por 100g</span>
                </h2>
              </div>
              {tacoIdSelecionado && (
                <span className="text-xs bg-brand/8 text-brand px-2 py-0.5 rounded-full font-medium">
                  Preenchido via TACO
                </span>
              )}
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  { field: 'calorias',     label: 'Calorias',     unit: 'kcal', Icon: Flame,    color: 'text-brand-orange', bg: 'bg-brand-orange/8' },
                  { field: 'proteinas',    label: 'Proteínas',    unit: 'g',    Icon: Beef,     color: 'text-rose-500',     bg: 'bg-rose-50'        },
                  { field: 'carboidratos', label: 'Carboidratos', unit: 'g',    Icon: Wheat,    color: 'text-amber-500',    bg: 'bg-amber-50'       },
                  { field: 'gorduras',     label: 'Gorduras',     unit: 'g',    Icon: Droplets, color: 'text-sky-500',      bg: 'bg-sky-50'         },
                ] as const).map(({ field, label, unit, Icon, color, bg }) => (
                  <div key={field}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon size={12} className={color} />
                      </span>
                      {label}
                      <span className="text-gray-300 font-normal normal-case">({unit})</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      {...register(field, { valueAsNumber: true })}
                      placeholder="0"
                      className={inputCls(!!errors[field])}
                    />
                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message}</p>}
                  </div>
                ))}
              </div>

              {!tacoIdSelecionado && (
                <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                  Pesquise um alimento acima para preencher automaticamente os dados nutricionais.
                </p>
              )}
            </div>
          </section>

          {/* Ações */}
          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-0 text-sm font-semibold text-white transition-all focus:outline-none ${
                salvando ? 'bg-brand/40 cursor-not-allowed' : 'bg-brand hover:brightness-110 cursor-pointer'
              }`}
            >
              {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
              {salvando ? 'Salvando…' : 'Salvar Ingrediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
