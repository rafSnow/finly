import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = React.useId();

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.1] bg-[#111118] p-6 shadow-[0_-8px_48px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300 sm:max-w-md sm:rounded-2xl sm:shadow-[0_8px_48px_rgba(0,0,0,0.8)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="text-lg font-semibold text-[#F1F0FF]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B6890] transition-all duration-200 hover:bg-white/5 hover:text-[#F1F0FF]"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="my-4 border-t border-white/[0.07]" />
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
