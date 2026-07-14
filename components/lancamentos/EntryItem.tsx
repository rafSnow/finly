"use client";

import { formatCurrency, formatShortDate } from "@/lib/utils/format";
import { Entry } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, Repeat2, Edit2, Trash2 } from "lucide-react";
import { motion, useAnimation, PanInfo } from "framer-motion";

interface EntryItemProps {
  entry: Entry;
  categoryName: string;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntryItem({ entry, categoryName, onEdit, onDelete }: EntryItemProps) {
  const isIncome = entry.type === "income";
  const controls = useAnimation();

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -60; // if dragged more than 60px to the left, snap open
    if (info.offset.x < threshold) {
      controls.start({ x: -120 }); // reveal both buttons (60px each)
    } else {
      controls.start({ x: 0 }); // snap closed
    }
  };

  const closeActions = () => {
    controls.start({ x: 0 });
  };

  return (
    <div className="relative border-b border-white/[0.05] last:border-0 overflow-hidden">
      {/* Background Actions Layer */}
      <div className="absolute right-0 top-0 bottom-0 flex h-full items-center justify-end">
        <button
          type="button"
          onClick={() => { closeActions(); onEdit(entry); }}
          className="flex h-full w-[60px] items-center justify-center bg-blue-500/20 text-blue-400 transition-colors hover:bg-blue-500/30"
          aria-label="Editar"
        >
          <Edit2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => { closeActions(); onDelete(entry); }}
          className="flex h-full w-[60px] items-center justify-center bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30"
          aria-label="Excluir"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Swipeable Foreground Layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="relative z-10 flex cursor-grab items-center gap-3 bg-[#111118] py-3.5 active:cursor-grabbing pr-4"
      >
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
            {entry.isInstallment && entry.installmentCount ? (
              <span className="ml-1 text-[#F1F0FF] font-medium">
                ({(entry.recurrenceIndex ?? 0) + 1}/{entry.installmentCount})
              </span>
            ) : null}
            {entry.isRecurring && !entry.isInstallment ? (
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
      </motion.div>
    </div>
  );
}
