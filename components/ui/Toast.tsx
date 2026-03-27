import { Toast as ToastType } from "@/contexts/ToastContext";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { ReactNode } from "react";

type ToastProps = {
  toast: ToastType;
  onClose: (id: string) => void;
};

const typeStyles: Record<ToastType["type"], string> = {
  success: "border-emerald-500/30",
  error: "border-red-500/30",
  info: "border-blue-500/30",
};

const typeIcons: Record<ToastType["type"], ReactNode> = {
  success: <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />,
  error: <XCircle className="mt-0.5 h-4 w-4 text-red-400" />,
  info: <Info className="mt-0.5 h-4 w-4 text-blue-400" />,
};

export function Toast({ toast, onClose }: ToastProps) {
  return (
    <div
      className={`animate-in slide-in-from-right duration-300 flex items-start gap-3 rounded-xl border bg-[#1A1A26] px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${typeStyles[toast.type]}`}
      role="status"
      aria-live="polite"
    >
      {typeIcons[toast.type]}
      <p className="flex-1 text-sm font-medium text-[#F1F0FF]">{toast.message}</p>
      <button
        type="button"
        className="rounded-lg p-1 text-[#6B6890] transition-all duration-200 hover:bg-white/5 hover:text-[#F1F0FF]"
        onClick={() => onClose(toast.id)}
        aria-label="Fechar notificacao"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
