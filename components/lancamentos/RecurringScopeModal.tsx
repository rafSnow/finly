"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RecurringScope } from "@/types";
import { CalendarRange, CopyPlus, Repeat } from "lucide-react";
import { ReactNode } from "react";

interface RecurringScopeModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSelect: (scope: RecurringScope) => void;
  actionLabel?: string;
}

export function RecurringScopeModal({
  isOpen,
  title,
  onClose,
  onSelect,
  actionLabel = "Aplicar",
}: RecurringScopeModalProps) {
  const options: Array<{
    scope: RecurringScope;
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      scope: "this",
      label: `${actionLabel} so este lancamento`,
      description: "Somente o item selecionado sera alterado.",
      icon: <CalendarRange className="h-4 w-4" />,
    },
    {
      scope: "this_and_following",
      label: `${actionLabel} este e os seguintes`,
      description: "Atualiza a partir deste lancamento.",
      icon: <Repeat className="h-4 w-4" />,
    },
    {
      scope: "all",
      label: `${actionLabel} todos os lancamentos`,
      description: "Aplica a mudanca em toda a recorrencia.",
      icon: <CopyPlus className="h-4 w-4" />,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-[#A09DC0]">
        Este lançamento faz parte de uma recorrência. Escolha onde aplicar a ação.
      </p>
      <div>
        {options.map((option) => (
          <button
            key={option.scope}
            type="button"
            onClick={() => onSelect(option.scope)}
            className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] p-4 text-left transition-all duration-200 hover:border-white/[0.14] hover:bg-[#1A1A26] last:mb-0"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1A1A26] text-[#8B5CF6]">
              {option.icon}
            </span>
            <span>
              <span className="block text-sm font-medium text-[#F1F0FF]">{option.label}</span>
              <span className="mt-0.5 block text-xs text-[#6B6890]">{option.description}</span>
            </span>
          </button>
        ))}
        <div className="mt-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
