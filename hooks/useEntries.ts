"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  createEntry as createEntryService,
  createRecurringEntries as createRecurringEntriesService,
  deleteEntry as deleteEntryService,
  deleteRecurringEntries as deleteRecurringEntriesService,
  getEntries,
  getEntryById,
  updateEntry as updateEntryService,
  updateRecurringEntries as updateRecurringEntriesService,
} from "@/lib/firestore/entries";
import {
  CreateEntryInput,
  Entry,
  EntryFilters,
  RecurrenceInterval,
  RecurringScope,
} from "@/types";
import { useCallback, useEffect, useState } from "react";

type UseEntriesResult = {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  createEntry: (data: CreateEntryInput) => Promise<void>;
  createRecurringEntries: (
    data: CreateEntryInput,
    interval: RecurrenceInterval,
    count: number,
  ) => Promise<void>;
  updateEntry: (
    entryId: string,
    data: Partial<Entry>,
    scope?: RecurringScope,
  ) => Promise<void>;
  deleteEntry: (entryId: string, scope?: RecurringScope) => Promise<void>;
};

function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("permission")) {
    return "Você não tem permissão para executar esta ação.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function useEntries(filters: EntryFilters): UseEntriesResult {
  const { family } = useAuth();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterMonth = filters.month;
  const filterYear = filters.year;
  const filterType = filters.type;
  const filterCategoryId = filters.categoryId;

  const loadEntries = useCallback(async () => {
    if (!family?.id) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await getEntries(family.id, {
        month: filterMonth,
        year: filterYear,
        type: filterType,
        categoryId: filterCategoryId,
      });
      setEntries(list);
    } catch (loadError) {
      console.error("Erro ao carregar lançamentos:", loadError);
      setError("Não foi possível carregar os lançamentos.");
    } finally {
      setLoading(false);
    }
  }, [family?.id, filterCategoryId, filterMonth, filterType, filterYear]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const createEntry = async (data: CreateEntryInput): Promise<void> => {
    if (!family?.id) {
      setError("Família não encontrada para criar lançamento.");
      return;
    }

    setError(null);
    try {
      await createEntryService(family.id, data);
      await loadEntries();
    } catch (createError) {
      console.error("Erro ao criar lançamento:", createError);
      setError(getFriendlyErrorMessage(createError));
      throw createError;
    }
  };

  const createRecurringEntries = async (
    data: CreateEntryInput,
    interval: RecurrenceInterval,
    count: number,
  ): Promise<void> => {
    if (!family?.id) {
      setError("Família não encontrada para criar lançamento.");
      return;
    }

    setError(null);
    try {
      await createRecurringEntriesService(family.id, data, interval, count);
      await loadEntries();
    } catch (createError) {
      console.error("Erro ao criar lançamentos recorrentes:", createError);
      setError(getFriendlyErrorMessage(createError));
      throw createError;
    }
  };

  const updateEntry = async (
    entryId: string,
    data: Partial<Entry>,
    scope: RecurringScope = "this",
  ): Promise<void> => {
    if (!family?.id) {
      setError("Família não encontrada para atualizar lançamento.");
      return;
    }

    setError(null);
    try {
      if (scope === "this") {
        await updateEntryService(family.id, entryId, data);
      } else {
        const selectedEntry =
          entries.find((entry) => entry.id === entryId) ||
          (await getEntryById(family.id, entryId));

        if (!selectedEntry) {
          throw new Error("Lançamento não encontrado.");
        }

        await updateRecurringEntriesService(family.id, selectedEntry, scope, data);
      }

      await loadEntries();
    } catch (updateError) {
      console.error("Erro ao atualizar lançamento:", updateError);
      setError(getFriendlyErrorMessage(updateError));
      throw updateError;
    }
  };

  const deleteEntry = async (
    entryId: string,
    scope: RecurringScope = "this",
  ): Promise<void> => {
    if (!family?.id) {
      setError("Família não encontrada para excluir lançamento.");
      return;
    }

    setError(null);
    try {
      if (scope === "this") {
        await deleteEntryService(family.id, entryId);
      } else {
        const selectedEntry =
          entries.find((entry) => entry.id === entryId) ||
          (await getEntryById(family.id, entryId));

        if (!selectedEntry) {
          throw new Error("Lançamento não encontrado.");
        }

        await deleteRecurringEntriesService(family.id, selectedEntry, scope);
      }

      await loadEntries();
    } catch (deleteError) {
      console.error("Erro ao excluir lançamento:", deleteError);
      setError(getFriendlyErrorMessage(deleteError));
      throw deleteError;
    }
  };

  return {
    entries,
    loading,
    error,
    createEntry,
    createRecurringEntries,
    updateEntry,
    deleteEntry,
  };
}
