import { useState } from 'react';
import { AlertCircle, X, Trash2, Lock } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requirePassword?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  requirePassword = false
}: ConfirmModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(requirePassword ? password : undefined);
    setPassword('');
  };

  const colors = {
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      button: 'bg-red-500 hover:bg-red-600 shadow-red-200',
      light: 'bg-red-100',
      focus: 'focus:ring-red-500/20 focus:border-red-500',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
      light: 'bg-amber-100',
      focus: 'focus:ring-amber-500/20 focus:border-amber-500',
    },
    info: {
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      button: 'bg-teal-600 hover:bg-teal-700 shadow-teal-200',
      light: 'bg-teal-100',
      focus: 'focus:ring-teal-500/20 focus:border-teal-500',
    }
  };

  const style = colors[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 ${style.bg} rounded-full opacity-50`} />
        
        <button 
          onClick={() => { onClose(); setPassword(''); }}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="relative z-10">
          <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${style.light} ${style.icon} mb-6`}>
            {variant === 'danger' ? <Trash2 size={32} /> : <AlertCircle size={32} />}
          </div>
          
          <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">
            {title}
          </h3>
          
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            {message}
          </p>

          {requirePassword && (
            <div className="mb-8">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Confirme sua senha para continuar
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm outline-none transition-all ${style.focus}`}
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirm}
              disabled={requirePassword && !password}
              className={`flex-1 py-4 rounded-2xl text-white text-sm font-black transition-all shadow-lg border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${style.button}`}
            >
              {confirmText}
            </button>
            
            <button
              onClick={() => { onClose(); setPassword(''); }}
              className="flex-1 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
