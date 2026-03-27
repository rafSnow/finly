"use client";

import { EntryItem } from "@/components/lancamentos/EntryItem";
import { formatShortDate } from "@/lib/utils/format";
import { Category, Entry } from "@/types";

interface EntryListProps {
  entries: Entry[];
  categories: Category[];
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

function dateGroupKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatGroupLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return formatShortDate(date);
}

export function EntryList({ entries, categories, onEdit, onDelete }: EntryListProps) {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  const grouped = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    const key = dateGroupKey(entry.date);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {});

  const orderedKeys = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="space-y-3">
      {orderedKeys.map((key) => (
        <section key={key}>
          <h3 className="mb-1 px-0 py-2 text-xs font-semibold uppercase tracking-wider text-[#6B6890]">
            {formatGroupLabel(key)}
          </h3>
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111118] px-4">
            {grouped[key].map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                categoryName={categoryMap.get(entry.categoryId) ?? "Categoria"}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
