"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccounts, createAccount, updateAccount, deleteAccount, getAccountBalance } from "@/lib/firestore/accounts";
import { useAuth } from "@/hooks/useAuth";

export function useAccounts() {
  const { family, loading: authLoading } = useAuth();
  const familyId = family?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["accounts", familyId],
    queryFn: async () => {
      if (!familyId) return [];
      return getAccounts(familyId);
    },
    enabled: !authLoading && !!familyId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; accountType?: "checking" | "credit" | "investment"; closingDay?: number; dueDay?: number }) => {
      if (!familyId) throw new Error("Família não encontrada");
      return createAccount(familyId, payload.name, payload.accountType, payload.closingDay, payload.dueDay);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", familyId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; accountType?: "checking" | "credit" | "investment"; closingDay?: number; dueDay?: number }) => {
      if (!familyId) throw new Error("Família não encontrada");
      return updateAccount(familyId, payload.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", familyId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!familyId) throw new Error("Família não encontrada");
      return deleteAccount(familyId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", familyId] });
    },
  });

  return {
    accounts: query.data ?? [],
    loading: query.isLoading || authLoading,
    error: query.error ? (query.error as Error).message : null,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
  };
}

export function useAccountBalance(accountId: string) {
  const { family } = useAuth();
  const familyId = family?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["accountBalance", familyId, accountId],
    queryFn: async () => {
      if (!familyId || !accountId) return 0;
      return getAccountBalance(familyId, accountId);
    },
    enabled: !!familyId && !!accountId,
  });

  return {
    balance: data ?? 0,
    loading: isLoading,
  };
}
