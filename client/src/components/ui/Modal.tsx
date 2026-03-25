import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-xl p-6 shadow-2xl border border-white/50 scale-in',
          'max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        {title && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-xl p-2 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-gray-100 hover:text-purple-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
