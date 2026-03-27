"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, OctagonAlert } from "lucide-react";
import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => cancelRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Modal isOpen={open} onClose={onCancel} title={title}>
      <div className="mb-4 flex justify-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            variant === "danger" ? "bg-red-500/15" : "bg-amber-500/15"
          }`}
        >
          {variant === "danger" ? (
            <OctagonAlert className="h-6 w-6 text-red-400" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          )}
        </div>
      </div>
      <p className="mb-5 text-center text-sm text-[#A09DC0]">{description}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={variant === "danger" ? "danger" : "secondary"}
          className={
            variant === "danger"
              ? "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 rounded-xl px-5 py-3 font-semibold transition-all duration-200"
              : ""
          }
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button
          ref={cancelRef}
          variant="secondary"
          disabled={loading}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
}
