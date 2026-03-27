"use client";

import { EntryList } from "@/components/lancamentos/EntryList";
import { RecurringScopeModal } from "@/components/lancamentos/RecurringScopeModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { useEntries } from "@/hooks/useEntries";
import { useToast } from "@/hooks/useToast";
import { getCategories } from "@/lib/firestore/categories";
import { formatMonthYear } from "@/lib/utils/format";
import { Category, Entry, EntryFilters, RecurringScope } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Lancamentos() {
  const router = useRouter();
  const { family } = useAuth();
  const { showToast } = useToast();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecurringDelete, setShowRecurringDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filters = useMemo<EntryFilters>(
    () => ({
      month,
      year,
      type: typeFilter === "all" ? undefined : typeFilter,
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
    }),
    [categoryFilter, month, typeFilter, year],
  );

  const { entries, loading, error, deleteEntry } = useEntries(filters);

  useEffect(() => {
    const loadCategories = async () => {
      if (!family?.id) {
        setCategories([]);
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      try {
        const list = await getCategories(family.id);
        setCategories(list);
      } catch (loadError) {
        console.error("Erro ao carregar categorias para filtro:", loadError);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [family?.id]);

  const filteredCategories = useMemo(() => {
    if (typeFilter === "all") {
      return categories;
    }

    return categories.filter(
      (category) => category.type === "both" || category.type === typeFilter,
    );
  }, [categories, typeFilter]);

  useEffect(() => {
    if (categoryFilter === "all") {
      return;
    }

    const stillAvailable = filteredCategories.some(
      (category) => category.id === categoryFilter,
    );

    if (!stillAvailable) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, filteredCategories]);

  const goPreviousMonth = () => {
    const date = new Date(year, month - 2, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const goNextMonth = () => {
    const date = new Date(year, month, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const handleEdit = (entry: Entry) => {
    router.push(`/lancamentos/${entry.id}/editar`);
  };

  const handleDeleteClick = (entry: Entry) => {
    setSelectedEntry(entry);
    if (entry.isRecurring) {
      setShowRecurringDelete(true);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const executeDelete = async (scope: RecurringScope) => {
    if (!selectedEntry) {
      return;
    }

    setDeleting(true);
    try {
      await deleteEntry(selectedEntry.id, scope);
      showToast("Lancamento excluido", "success");
      setShowDeleteConfirm(false);
      setShowRecurringDelete(false);
      setSelectedEntry(null);
    } catch (deleteError) {
      console.error("Erro ao excluir lançamento:", deleteError);
      showToast("Nao foi possivel excluir o lancamento.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <h2 className="text-lg font-semibold text-[#F1F0FF]">Lançamentos</h2>

      <div className="mb-5 space-y-4 rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#1A1A26] text-[#A09DC0] transition-all duration-200 hover:bg-[#22223A] hover:text-[#F1F0FF]"
            aria-label="Mes anterior"
          >
            &lt;
          </button>
          <p className="text-base font-semibold capitalize text-[#F1F0FF]">
            {formatMonthYear(month, year)}
          </p>
          <button
            type="button"
            onClick={goNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#1A1A26] text-[#A09DC0] transition-all duration-200 hover:bg-[#22223A] hover:text-[#F1F0FF]"
            aria-label="Proximo mes"
          >
            &gt;
          </button>
        </div>

        <div className="grid grid-cols-3 rounded-xl bg-[#1A1A26] p-1">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg py-2 text-center text-xs font-medium ${
              typeFilter === "all"
                ? "bg-[#111118] font-semibold text-[#F1F0FF] shadow-sm"
                : "text-[#6B6890]"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("expense")}
            className={`rounded-lg py-2 text-center text-xs font-medium ${
              typeFilter === "expense"
                ? "bg-[#111118] font-semibold text-[#F1F0FF] shadow-sm"
                : "text-[#6B6890]"
            }`}
          >
            Despesas
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("income")}
            className={`rounded-lg py-2 text-center text-xs font-medium ${
              typeFilter === "income"
                ? "bg-[#111118] font-semibold text-[#F1F0FF] shadow-sm"
                : "text-[#6B6890]"
            }`}
          >
            Receitas
          </button>
        </div>

        <Select
          label="Categoria"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          disabled={categoriesLoading}
          options={[
            { value: "all", label: "Todas" },
            ...filteredCategories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton variant="line" height="h-16" />
          <Skeleton variant="line" height="h-16" />
          <Skeleton variant="line" height="h-16" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!loading && entries.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento neste período"
          description="Adicione receitas ou despesas para acompanhar seu saldo"
          action={{
            label: "Criar primeiro lançamento",
            onClick: () => router.push("/lancamentos/novo"),
          }}
        />
      ) : null}

      {!loading && entries.length > 0 ? (
        <EntryList
          entries={entries}
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      ) : null}

      <Link
        href="/lancamentos/novo"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-3xl leading-none text-white shadow-[0_0_32px_rgba(124,58,237,0.5)] transition-all duration-200 hover:bg-[#6D28D9] active:scale-95"
        aria-label="Novo lancamento"
      >
        +
      </Link>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Excluir lançamento"
      >
        <p className="mb-4 text-sm text-[#A09DC0]">
          Confirma a exclusão deste lançamento?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" loading={deleting} onClick={() => executeDelete("this")}
          >
            Excluir
          </Button>
          <Button
            variant="secondary"
            disabled={deleting}
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancelar
          </Button>
        </div>
      </Modal>

      <RecurringScopeModal
        isOpen={showRecurringDelete}
        onClose={() => setShowRecurringDelete(false)}
        title="Excluir recorrência"
        actionLabel="Excluir"
        onSelect={executeDelete}
      />
    </div>
  );
}
