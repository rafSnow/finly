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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type UseEntriesResult = {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  createEntry: (data: CreateEntryInput) => Promise<void>;
  createRecurringEntries: (
    data: CreateEntryInput,
    interval: RecurrenceInterval,
    count: number,
    isInstallment?: boolean
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
  const queryClient = useQueryClient();

  const filterMonth = filters.month;
  const filterYear = filters.year;
  const filterType = filters.type;
  const filterCategoryId = filters.categoryId;

  const {
    data: entries = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "entries",
      family?.id,
      filterMonth,
      filterYear,
      filterType,
      filterCategoryId,
    ],
    queryFn: async () => {
      if (!family?.id) return [];
      return getEntries(family.id, {
        month: filterMonth,
        year: filterYear,
        type: filterType,
        categoryId: filterCategoryId,
      });
    },
    enabled: !!family?.id,
  });

  const invalidateEntries = () => {
    queryClient.invalidateQueries({ queryKey: ["entries", family?.id] });
  };

  const createEntryMutation = useMutation({
    mutationFn: async (data: CreateEntryInput) => {
      if (!family?.id) throw new Error("Família não encontrada.");
      await createEntryService(family.id, data);
    },
    onSuccess: invalidateEntries,
  });

  const createRecurringMutation = useMutation({
    mutationFn: async (payload: {
      data: CreateEntryInput;
      interval: RecurrenceInterval;
      count: number;
      isInstallment?: boolean;
    }) => {
      if (!family?.id) throw new Error("Família não encontrada.");
      await createRecurringEntriesService(
        family.id,
        payload.data,
        payload.interval,
        payload.count,
        payload.isInstallment
      );
    },
    onSuccess: invalidateEntries,
  });

  const updateEntryMutation = useMutation({
    mutationFn: async (payload: {
      entryId: string;
      data: Partial<Entry>;
      scope: RecurringScope;
    }) => {
      if (!family?.id) throw new Error("Família não encontrada.");
      if (payload.scope === "this") {
        await updateEntryService(family.id, payload.entryId, payload.data);
      } else {
        const selectedEntry =
          entries.find((entry) => entry.id === payload.entryId) ||
          (await getEntryById(family.id, payload.entryId));

        if (!selectedEntry) throw new Error("Lançamento não encontrado.");
        await updateRecurringEntriesService(
          family.id,
          selectedEntry,
          payload.scope,
          payload.data
        );
      }
    },
    onSuccess: invalidateEntries,
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (payload: {
      entryId: string;
      scope: RecurringScope;
    }) => {
      if (!family?.id) throw new Error("Família não encontrada.");
      if (payload.scope === "this") {
        await deleteEntryService(family.id, payload.entryId);
      } else {
        const selectedEntry =
          entries.find((entry) => entry.id === payload.entryId) ||
          (await getEntryById(family.id, payload.entryId));

        if (!selectedEntry) throw new Error("Lançamento não encontrado.");
        await deleteRecurringEntriesService(
          family.id,
          selectedEntry,
          payload.scope
        );
      }
    },
    onSuccess: invalidateEntries,
  });

  const createEntry = async (data: CreateEntryInput) => {
    try {
      await createEntryMutation.mutateAsync(data);
    } catch (e) {
      throw new Error(getFriendlyErrorMessage(e));
    }
  };

  const createRecurringEntries = async (
    data: CreateEntryInput,
    interval: RecurrenceInterval,
    count: number,
    isInstallment?: boolean
  ) => {
    try {
      await createRecurringMutation.mutateAsync({ data, interval, count, isInstallment });
    } catch (e) {
      throw new Error(getFriendlyErrorMessage(e));
    }
  };

  const updateEntry = async (
    entryId: string,
    data: Partial<Entry>,
    scope: RecurringScope = "this"
  ) => {
    try {
      await updateEntryMutation.mutateAsync({ entryId, data, scope });
    } catch (e) {
      throw new Error(getFriendlyErrorMessage(e));
    }
  };

  const deleteEntry = async (
    entryId: string,
    scope: RecurringScope = "this"
  ) => {
    try {
      await deleteEntryMutation.mutateAsync({ entryId, scope });
    } catch (e) {
      throw new Error(getFriendlyErrorMessage(e));
    }
  };

  return {
    entries,
    loading: isLoading,
    error: error ? getFriendlyErrorMessage(error) : null,
    createEntry,
    createRecurringEntries,
    updateEntry,
    deleteEntry,
  };
}
