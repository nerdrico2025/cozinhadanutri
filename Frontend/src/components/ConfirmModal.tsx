import { useState, useEffect } from 'react';
import { AlertTriangle, X, Trash2, Lock, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requirePassword?: boolean;
  children?: React.ReactNode;
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
  requirePassword = false,
  children
}: ConfirmModalProps) {
  const [password, setPassword] = useState('');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(requirePassword ? password : undefined);
    setPassword('');
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 size={24} className="text-red-600" />,
          iconBg: 'bg-red-100',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/30',
          focusRing: 'focus:border-red-500 focus:ring-red-500/20'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} className="text-amber-600" />,
          iconBg: 'bg-amber-100',
          confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500/30',
          focusRing: 'focus:border-amber-500 focus:ring-amber-500/20'
        };
      case 'info':
      default:
        return {
          icon: <Info size={24} className="text-teal-600" />,
          iconBg: 'bg-teal-100',
          confirmBtn: 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500/30',
          focusRing: 'focus:border-teal-500 focus:ring-teal-500/20'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-4 transition-opacity">
      <div 
        className="bg-white rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] max-w-[440px] w-full border border-gray-100/50 transform transition-all animate-in zoom-in-95 duration-200 ease-out flex flex-col relative"
      >
        <div className="px-6 py-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          {/* Icon */}
          <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${styles.iconBg} mx-auto sm:mx-0`}>
            {styles.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            
            {message && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {message}
              </p>
            )}

            {children && (
              <div className="mb-4 text-left">
                {children}
              </div>
            )}

            {requirePassword && (
              <div className="mb-2 mt-4 text-left">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Confirme sua senha para continuar
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha de acesso"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm outline-none transition-all focus:bg-white focus:ring-2 ${styles.focusRing}`}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={() => { onClose(); setPassword(''); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={requirePassword && !password}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold border border-transparent shadow-sm focus:outline-none focus:ring-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${styles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
        
        {/* Close Top-Right Button */}
        <button 
          onClick={() => { onClose(); setPassword(''); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-0 cursor-pointer p-1 rounded-md hover:bg-gray-100 hidden sm:block"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
