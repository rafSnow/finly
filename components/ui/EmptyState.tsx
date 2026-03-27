import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#1A1A26] text-[#6B6890]">
          {icon}
        </div>
      ) : null}
      <p className="mb-1.5 text-base font-semibold text-[#F1F0FF]">{title}</p>
      {description ? <p className="mb-5 max-w-xs text-sm text-[#6B6890]">{description}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-xl bg-[#7C3AED] px-5 py-3 font-semibold text-white transition-all duration-200 hover:bg-[#6D28D9] active:scale-[0.98]"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
