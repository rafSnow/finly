"use client";

import { formatCurrency, formatShortDate } from "@/lib/utils/format";
import { Entry } from "@/types";
import { ArrowRightLeft, Repeat2, Edit2, Trash2, CheckCircle2, Clock, User } from "lucide-react";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";
import { motion, useAnimation, PanInfo } from "framer-motion";
import React from "react";

interface EntryItemProps {
  entry: Entry;
  categoryName: string;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
  onTogglePaid?: (entry: Entry) => void;
}

function CategoryIconRenderer({
  categoryName,
  isIncome,
  className,
}: {
  categoryName: string;
  isIncome: boolean;
  className?: string;
}) {
  const iconComponent = getCategoryIcon(categoryName, isIncome);
  return React.createElement(iconComponent, { className });
}

export function EntryItem({ entry, categoryName, onEdit, onDelete, onTogglePaid }: EntryItemProps) {
  const isIncome = entry.type === "income";
  const isTransfer = entry.type === "transfer" || entry.isTransfer;
  const isPaid = entry.isPaid ?? true;
  const isPersonal = entry.type === "expense" && entry.isShared === false;
  const controls = useAnimation();

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -60;
    if (info.offset.x < threshold) {
      controls.start({ x: -120 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const closeActions = () => {
    controls.start({ x: 0 });
  };

  return (
    <div className="group relative overflow-hidden border-b border-white/[0.05] last:border-0">
      {/* Background Actions Layer (Mobile Swipe) */}
      <div className="absolute bottom-0 right-0 top-0 flex h-full items-center justify-end">
        <button
          type="button"
          onClick={() => {
            closeActions();
            onEdit(entry);
          }}
          className="flex h-full w-[60px] items-center justify-center bg-blue-500/20 text-blue-400 transition-colors hover:bg-blue-500/30"
          aria-label="Editar"
        >
          <Edit2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            closeActions();
            onDelete(entry);
          }}
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
        className={`relative z-10 flex cursor-grab items-center gap-3 bg-[#111118] py-3.5 pr-2 active:cursor-grabbing ${
          !isPaid ? "opacity-90" : ""
        }`}
      >
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            isTransfer ? "bg-indigo-500/15" : isIncome ? "bg-emerald-500/15" : "bg-red-500/15"
          }`}
        >
          {isTransfer ? (
            <ArrowRightLeft className="h-5 w-5 text-indigo-400" />
          ) : (
            <CategoryIconRenderer
              categoryName={categoryName}
              isIncome={isIncome}
              className={`h-5 w-5 ${isIncome ? "text-emerald-400" : "text-red-400"}`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-[#F1F0FF]">
              {isTransfer ? "Transferência" : categoryName}
            </p>
            {!isPaid && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                <Clock className="h-2.5 w-2.5" />
                Pendente
              </span>
            )}
            {isPersonal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[#A09DC0]">
                <User className="h-2.5 w-2.5" />
                Individual
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B6890]">
            {entry.description || formatShortDate(entry.date)}
            {entry.isInstallment && entry.installmentCount ? (
              <span className="ml-1 font-medium text-[#F1F0FF]">
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

        {onTogglePaid && !isTransfer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePaid(entry);
            }}
            className={`rounded-lg p-1.5 transition-colors ${
              isPaid
                ? "text-emerald-400/70 hover:bg-emerald-500/15 hover:text-emerald-400"
                : "bg-amber-500/15 text-amber-400 hover:bg-emerald-500/20 hover:text-emerald-400"
            }`}
            title={isPaid ? "Marcar como pendente" : "Dar baixa (marcar como pago)"}
            aria-label={isPaid ? "Marcar como pendente" : "Dar baixa"}
          >
            {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
          </button>
        )}

        <p
          className={`whitespace-nowrap text-sm font-semibold ${
            isTransfer ? "text-indigo-400" : isIncome ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isTransfer ? "" : isIncome ? "+" : "-"}
          {formatCurrency(entry.value)}
        </p>

        {/* Desktop Hover Actions */}
        <div className="hidden items-center gap-1 pl-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(entry);
            }}
            className="rounded-lg p-1.5 text-[#A09DC0] transition-colors hover:bg-white/10 hover:text-[#F1F0FF]"
            aria-label="Editar lançamento"
            title="Editar"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry);
            }}
            className="rounded-lg p-1.5 text-[#A09DC0] transition-colors hover:bg-red-500/15 hover:text-red-400"
            aria-label="Excluir lançamento"
            title="Excluir"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
