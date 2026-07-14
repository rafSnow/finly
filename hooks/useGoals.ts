"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  createGoal as createGoalService,
  deleteGoal as deleteGoalService,
  getGoals,
  updateGoal as updateGoalService,
} from "@/lib/firestore/goals";
import { CreateGoalInput, Goal } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function useGoals() {
  const { family, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const familyId = family?.id;

  const {
    data: goals = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["goals", familyId],
    queryFn: async () => {
      if (!familyId) return [];
      return getGoals(familyId);
    },
    enabled: !authLoading && !!familyId,
  });

  const invalidateGoals = () => {
    queryClient.invalidateQueries({ queryKey: ["goals", familyId] });
  };

  const hasDuplicateCategory = useMemo(
    () => (categoryId: string, excludingGoalId?: string) =>
      goals.some(
        (goal) =>
          goal.categoryId === categoryId &&
          (!excludingGoalId || goal.id !== excludingGoalId),
      ),
    [goals]
  );

  const createGoalMutation = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!familyId) throw new Error("Familia nao encontrada.");
      if (hasDuplicateCategory(input.categoryId)) {
        throw new Error("Ja existe uma meta para essa categoria.");
      }
      await createGoalService(familyId, input);
    },
    onSuccess: invalidateGoals,
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (payload: { goalId: string; updates: Partial<Goal> }) => {
      if (!familyId) throw new Error("Familia nao encontrada.");
      if (
        payload.updates.categoryId &&
        hasDuplicateCategory(payload.updates.categoryId, payload.goalId)
      ) {
        throw new Error("Ja existe uma meta para essa categoria.");
      }
      await updateGoalService(familyId, payload.goalId, payload.updates);
    },
    onSuccess: invalidateGoals,
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!familyId) throw new Error("Familia nao encontrada.");
      await deleteGoalService(familyId, goalId);
    },
    onSuccess: invalidateGoals,
  });

  const createGoal = async (input: CreateGoalInput) => {
    await createGoalMutation.mutateAsync(input);
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    await updateGoalMutation.mutateAsync({ goalId, updates });
  };

  const deleteGoal = async (goalId: string) => {
    await deleteGoalMutation.mutateAsync(goalId);
  };

  return {
    goals,
    loading: isLoading || authLoading,
    error: error ? (error as Error).message : null,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh: refetch,
  };
}
