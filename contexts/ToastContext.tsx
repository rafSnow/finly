"use client";

import { Toast } from "@/components/ui/Toast";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 3;
const TIMEOUTS: Record<Toast["type"], number> = {
  success: 3000,
  error: 5000,
  info: 4000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();

    setToasts((current) => {
      const next = [...current, { id, type, message }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });

    window.setTimeout(() => {
      removeToast(id);
    }, TIMEOUTS[type]);
  }, [removeToast]);

  const contextValue = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-3 left-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 space-y-2 sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-sm sm:translate-x-0">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext deve ser usado dentro de ToastProvider.");
  }
  return context;
}
