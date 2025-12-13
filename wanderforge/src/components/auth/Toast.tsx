import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...currentToasts]));
};

export const toast = {
  success: (message: string) => {
    const id = Date.now().toString();
    currentToasts = [...currentToasts, { id, message, type: 'success' }];
    notifyListeners();
    setTimeout(() => toast.dismiss(id), 4000);
  },
  error: (message: string) => {
    const id = Date.now().toString();
    currentToasts = [...currentToasts, { id, message, type: 'error' }];
    notifyListeners();
    setTimeout(() => toast.dismiss(id), 4000);
  },
  warning: (message: string) => {
    const id = Date.now().toString();
    currentToasts = [...currentToasts, { id, message, type: 'warning' }];
    notifyListeners();
    setTimeout(() => toast.dismiss(id), 4000);
  },
  info: (message: string) => {
    const id = Date.now().toString();
    currentToasts = [...currentToasts, { id, message, type: 'info' }];
    notifyListeners();
    setTimeout(() => toast.dismiss(id), 4000);
  },
  dismiss: (id: string) => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notifyListeners();
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg ${colors[t.type]}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{t.message}</p>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
