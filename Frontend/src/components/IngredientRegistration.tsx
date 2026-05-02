import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search, ChevronDown, Loader2, ArrowLeft,
  PackagePlus, DollarSign, Flame, Beef, Wheat, Droplets, HelpCircle, AlertTriangle,
  CheckCircle2, List, PlusCircle
} from 'lucide-react';
import { Unidade, Ingrediente } from '../types';
import { buscarAlimentosBackend } from '../services/alimentos';

const numField = z.preprocess(
  (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
  z.number({ required_error: 'Campo não pode ficar vazio', invalid_type_error: 'Campo não pode ficar vazio' })
    .min(0, 'Inválido')
);

const ingredienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  unidade: z.enum(['g', 'kg', 'ml', 'l', 'unidade']),
  preco: z.preprocess(
    (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
    z.number({ required_error: 'Campo não pode ficar vazio', invalid_type_error: 'Campo não pode ficar vazio' })
      .min(0.01, 'Preço deve ser maior que zero')
  ),
  calorias: numField,
  proteinas: numField,
  carboidratos: numField,
  gorduras: numField,
  acucares_totais: numField,
  acucares_adicionados: numField,
  gorduras_saturadas: numField,
  gorduras_trans: numField,
  fibras: numField,
  sodio: numField,
  vitaminas: numField,
  minerais: numField,
});

type IngredienteForm = z.infer<typeof ingredienteSchema>;

interface CadastroIngredienteProps {
  ingredienteInicial?: Ingrediente;
  onSalvar: (ingrediente: Ingrediente) => Promise<void> | void;
  onCancelar: () => void;
  onVerLista?: () => void;
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

export function CadastroIngrediente({ ingredienteInicial, onSalvar, onCancelar, onVerLista }: CadastroIngredienteProps) {
  const [sugestoesTaco, setSugestoesTaco] = useState<any[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [tacoNumeroSelecionado, setTacoNumeroSelecionado] = useState<number | undefined>(ingredienteInicial?.tacoId);
  const [tacoDbId, setTacoDbId] = useState<string | number | undefined>(ingredienteInicial?.id);
  const [salvando, setSalvando] = useState(false);
  const [modalAcucarAberto, setModalAcucarAberto] = useState(false);
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [dadosParaSalvar, setDadosParaSalvar] = useState<IngredienteForm | null>(null);
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
          acucares_totais: ingredienteInicial.dadosNutricionais.acucares_totais || 0,
          acucares_adicionados: ingredienteInicial.dadosNutricionais.acucares_adicionados || 0,
          gorduras_saturadas: ingredienteInicial.dadosNutricionais.gorduras_saturadas || 0,
          gorduras_trans: ingredienteInicial.dadosNutricionais.gorduras_trans || 0,
          fibras: ingredienteInicial.dadosNutricionais.fibras || 0,
          sodio: ingredienteInicial.dadosNutricionais.sodio || 0,
          vitaminas: ingredienteInicial.dadosNutricionais.vitaminas || 0,
          minerais: ingredienteInicial.dadosNutricionais.minerais || 0,
        }
      : { unidade: 'g', calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, acucares_totais: 0, acucares_adicionados: 0, gorduras_saturadas: 0, gorduras_trans: 0, fibras: 0, sodio: 0, vitaminas: 0, minerais: 0 },
  });

  const buscarSugestoes = (nome: string) => {
    if (nome.length < 2) { setSugestoesTaco([]); setMostrarSugestoes(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCarregando(true); setErroApi(null);
      try {
        const resultados = await buscarAlimentosBackend(nome);
        setSugestoesTaco(resultados);
        setMostrarSugestoes(resultados.length > 0);
      } catch {
        setErroApi('Não foi possível buscar na API TACO. Preencha os dados manualmente.');
        setSugestoesTaco([]); setMostrarSugestoes(false);
      } finally { setCarregando(false); }
    }, 400);
  };

  const aplicarDadosTaco = (alimento: any) => {
    setValue('nome', alimento.descricao);
    setValue('calorias', parseFloat(alimento.energia_kcal) || 0);
    setValue('proteinas', parseFloat(alimento.proteina) || 0);
    setValue('carboidratos', parseFloat(alimento.carboidrato) || 0);
    setValue('gorduras', parseFloat(alimento.lipideos) || 0);
    setValue('acucares_totais', parseFloat(alimento.acucares_totais) || 0);
    setValue('acucares_adicionados', parseFloat(alimento.acucares_adicionados) || 0);
    setValue('gorduras_saturadas', parseFloat(alimento.saturados) || 0);
    
    const trans1 = parseFloat(alimento.AG18_1t) || 0;
    const trans2 = parseFloat(alimento.AG18_2t) || 0;
    setValue('gorduras_trans', trans1 + trans2);
    
    setValue('fibras', parseFloat(alimento.fibra_alimentar) || 0);
    setValue('sodio', parseFloat(alimento.sodio) || 0);
    setValue('vitaminas', parseFloat(alimento.vitaminas) || 0);
    setValue('minerais', parseFloat(alimento.minerais) || 0);
    setTacoNumeroSelecionado(alimento.numero);
    setTacoDbId(alimento.id);
    setMostrarSugestoes(false);
  };

  const onSubmit = (data: IngredienteForm) => {
    // Verifica se os campos de açúcares estão vazios ou zerados
    if (!data.acucares_totais && !data.acucares_adicionados) {
      setDadosParaSalvar(data);
      setModalAcucarAberto(true);
      return;
    }
    salvarFinal(data);
  };

  const salvarFinal = async (data: IngredienteForm) => {
    setSalvando(true);
    setModalAcucarAberto(false);
    try {
      await onSalvar({
        id: tacoDbId ?? ingredienteInicial?.id ?? '', // App.tsx vai lidar com isso e salvarAlimento também
        tacoId: tacoNumeroSelecionado,
        nome: data.nome,
        unidade: data.unidade,
        preco: data.preco,
        dadosNutricionais: {
          calorias: data.calorias,
          proteinas: data.proteinas,
          carboidratos: data.carboidratos,
          gorduras: data.gorduras,
          acucares_totais: data.acucares_totais || 0,
          acucares_adicionados: data.acucares_adicionados || 0,
          gorduras_saturadas: data.gorduras_saturadas || 0,
          gorduras_trans: data.gorduras_trans || 0,
          fibras: data.fibras || 0,
          sodio: data.sodio || 0,
          vitaminas: data.vitaminas || 0,
          minerais: data.minerais || 0,
        },
        createdAt: ingredienteInicial?.createdAt ?? new Date(),
      });
      setTacoNumeroSelecionado(undefined);
      setTacoDbId(undefined);
      reset();
      setModalSucessoAberto(true);
    } catch (err) {
      console.error(err);
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
                {tacoNumeroSelecionado && (
                  <p className="text-brand text-xs mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                    Vinculado à tabela TACO (Nº {tacoNumeroSelecionado})
                  </p>
                )}

                {mostrarSugestoes && sugestoesTaco.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                    {sugestoesTaco.map((alimento) => (
                      <button
                        key={alimento.numero || alimento.id}
                        type="button"
                        onMouseDown={() => aplicarDadosTaco(alimento)}
                        className="w-full text-left px-4 py-2.5 hover:bg-brand/5 border-0 bg-transparent cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-b-0"
                      >
                        <span className="text-sm text-gray-800 truncate">{alimento.descricao}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">TACO {alimento.numero}</span>
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
              {tacoNumeroSelecionado && (
                <span className="text-xs bg-brand/8 text-brand px-2 py-0.5 rounded-full font-medium">
                  Preenchido via TACO
                </span>
              )}
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  { field: 'calorias',             label: 'Valor Energético',  unit: 'kcal', Icon: Flame,    color: 'text-brand-orange', bg: 'bg-brand-orange/8' },
                  { field: 'carboidratos',         label: 'Carboidratos',      unit: 'g',    Icon: Wheat,    color: 'text-amber-500',    bg: 'bg-amber-50'       },
                  { field: 'acucares_totais',      label: 'Açúcares Totais',   unit: 'g',    Icon: Wheat,    color: 'text-amber-600',    bg: 'bg-amber-50'       },
                  { field: 'acucares_adicionados', label: 'Açúc. Adicionados', unit: 'g',    Icon: Wheat,    color: 'text-amber-700',    bg: 'bg-amber-50'       },
                  { field: 'proteinas',            label: 'Proteínas',         unit: 'g',    Icon: Beef,     color: 'text-rose-500',     bg: 'bg-rose-50'        },
                  { field: 'gorduras',             label: 'Gorduras Totais',   unit: 'g',    Icon: Droplets, color: 'text-sky-500',      bg: 'bg-sky-50'         },
                  { field: 'gorduras_saturadas',   label: 'Gord. Saturadas',   unit: 'g',    Icon: Droplets, color: 'text-sky-600',      bg: 'bg-sky-50'         },
                  { field: 'gorduras_trans',       label: 'Gorduras Trans',    unit: 'g',    Icon: Droplets, color: 'text-sky-700',      bg: 'bg-sky-50'         },
                  { field: 'fibras',               label: 'Fibras Alimentares',unit: 'g',    Icon: Wheat,    color: 'text-emerald-500',  bg: 'bg-emerald-50'     },
                  { field: 'sodio',                label: 'Sódio',             unit: 'mg',   Icon: PackagePlus,color: 'text-gray-500',   bg: 'bg-gray-100'       },
                  { field: 'vitaminas',            label: 'Vitaminas',         unit: 'g',    Icon: PackagePlus,color: 'text-purple-500', bg: 'bg-purple-50'      },
                  { field: 'minerais',             label: 'Minerais',          unit: 'g',    Icon: PackagePlus,color: 'text-indigo-500', bg: 'bg-indigo-50'      },
                ] as const).map(({ field, label, unit, Icon, color, bg }) => {
                  const isSugarField = field === 'acucares_totais' || field === 'acucares_adicionados';
                  const isReadOnly = tacoNumeroSelecionado && !isSugarField;
                  return (
                  <div key={field}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon size={12} className={color} />
                      </span>
                      {label}
                      <span className="text-gray-300 font-normal normal-case">({unit})</span>
                      {isSugarField && tacoNumeroSelecionado && (
                        <div className="group relative ml-auto flex items-center justify-center">
                          <HelpCircle size={14} className="text-brand/80 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 text-center">
                            A tabela TACO não possui este dado. Preencha manualmente, se desejar.
                          </div>
                        </div>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      {...register(field, { valueAsNumber: true })}
                      placeholder="0"
                      readOnly={isReadOnly}
                      className={`${inputCls(!!errors[field])} ${isReadOnly ? 'bg-gray-100 text-gray-400 cursor-not-allowed select-none' : ''}`}
                    />
                    {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]?.message}</p>}
                  </div>
                );})}
              </div>

              {!tacoNumeroSelecionado && (
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

      {/* Modal de Confirmação de Açúcares */}
      {modalAcucarAberto && dadosParaSalvar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4 mx-auto">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
              Atenção aos Açúcares
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              "Açúcares Totais" e "Açúc. Adicionados" não foram preenchidos. Deseja continuar e salvar assim mesmo?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalAcucarAberto(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => salvarFinal(dadosParaSalvar)}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:brightness-110 transition-colors focus:outline-none"
              >
                Sim, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {modalSucessoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-5 mx-auto">
              <CheckCircle2 className="text-emerald-600" size={30} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              Ingrediente salvo com sucesso!
            </h3>
            <p className="text-sm text-gray-600 text-center mb-8">
              O que você deseja fazer agora?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setModalSucessoAberto(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white text-sm font-bold hover:brightness-110 transition-colors focus:outline-none border-0 cursor-pointer"
              >
                <PlusCircle size={16} />
                Cadastrar mais ingredientes
              </button>
              {onVerLista && (
                <button
                  type="button"
                  onClick={() => {
                    setModalSucessoAberto(false);
                    onVerLista();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none cursor-pointer"
                >
                  <List size={16} />
                  Acessar lista de ingredientes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
