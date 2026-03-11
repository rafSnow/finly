'use client';

import { cn } from '@/lib/utils';
import { useToastStore, type ToastType } from '@/store/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success-500" />,
  error: <XCircle className="h-5 w-5 text-danger-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
  info: <Info className="h-5 w-5 text-brand-500" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-success-500 bg-success-100',
  error: 'border-danger-500 bg-danger-100',
  warning: 'border-warning-500 bg-warning-100',
  info: 'border-brand-500 bg-brand-50',
};

function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <>
      {/* Desktop — canto superior direito */}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] hidden flex-col gap-2 lg:flex"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 shadow-md',
                STYLES[toast.type]
              )}
              role="alert"
            >
              {ICONS[toast.type]}
              <span className="text-sm font-medium text-neutral-800">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-neutral-400 hover:text-neutral-600"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile — centro inferior */}
      <div
        className="pointer-events-none fixed bottom-20 left-4 right-4 z-[100] flex flex-col items-center gap-2 lg:hidden"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cn(
                'pointer-events-auto flex w-full items-center gap-3 rounded-lg border-l-4 px-4 py-3 shadow-md',
                STYLES[toast.type]
              )}
              role="alert"
            >
              {ICONS[toast.type]}
              <span className="text-sm font-medium text-neutral-800">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto text-neutral-400 hover:text-neutral-600"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

export { Toast };
