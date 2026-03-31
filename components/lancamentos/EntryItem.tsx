"use client";

import { formatCurrency, formatShortDate } from "@/lib/utils/format";
import { Entry } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, Repeat2 } from "lucide-react";

interface EntryItemProps {
  entry: Entry;
  categoryName: string;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntryItem({ entry, categoryName, onEdit, onDelete }: EntryItemProps) {
  const isIncome = entry.type === "income";

  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] py-3.5 last:border-0">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
          isIncome ? "bg-emerald-500/15" : "bg-red-500/15"
        }`}
      >
        {isIncome ? (
          <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
        ) : (
          <ArrowDownCircle className="h-5 w-5 text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F1F0FF]">{categoryName}</p>
        <p className="mt-0.5 truncate text-xs text-[#6B6890]">
          {entry.description || formatShortDate(entry.date)}
          {entry.isRecurring ? (
            <span className="ml-1 inline-flex items-center gap-1">
              <Repeat2 className="h-3 w-3" /> Recorrente
            </span>
          ) : null}
        </p>
      </div>
      <p
        className={`whitespace-nowrap text-sm font-semibold ${
          isIncome ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(entry.value)}
      </p>
      <details className="relative">
        <summary
          className="flex h-8 w-8 list-none items-center justify-center rounded-lg text-[#6B6890] transition-colors duration-200 hover:bg-white/[0.05] hover:text-[#A09DC0]"
          aria-label="Abrir acoes do lancamento"
        >
          ⋮
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-32 rounded-xl border border-white/10 bg-[#1A1A26] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#A09DC0] transition-colors duration-200 hover:bg-white/5 hover:text-[#F1F0FF]"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-red-400 transition-colors duration-200 hover:bg-red-500/10"
          >
            Excluir
          </button>
        </div>
      </details>
    </div>
  );
}
