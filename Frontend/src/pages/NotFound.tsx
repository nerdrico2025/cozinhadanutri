import { Home, ArrowLeft, Search } from 'lucide-react';

interface NotFoundProps {
  onVoltar: () => void;
  onIrParaHome: () => void;
}

export function NotFound({ onVoltar, onIrParaHome }: NotFoundProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-24 text-center">
      {/* Ilustração GIF */}
      
     {/*  <div className="relative mb-8">
        <div className="absolute inset-0 bg-teal-50 rounded-full scale-150 blur-2xl opacity-60"></div>
        <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-teal-900/5 border border-teal-50">
          <Search size={64} className="text-teal-600 animate-pulse" />
      </div> */}

      <div className="relative mb-8 max-w-[300px]">
        <img 
          src="/404_not_found.gif" 
          alt="404 Not Found" 
          className="w-full h-auto rounded-3xl"
        />
      </div>

      <h1 className="text-8xl font-black text-[#04585a] mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
        Página não encontrada!
      </h2>
      <p className="text-gray-500 max-w-md mx-auto mb-12 text-lg leading-relaxed">
        Parece que você tentou acessar uma página que não existe ou foi movida. 
        Não se preocupe, vamos te levar de volta para a cozinha.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={onVoltar}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>
        <button
          onClick={onIrParaHome}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#04585a] text-white font-black hover:bg-[#054a4c] transition-all shadow-lg shadow-[#04585a]/20 group"
        >
          <Home size={20} className="group-hover:scale-110 transition-transform" />
          Ir para o Início
        </button>
      </div>

      
    </div>
  );
}
