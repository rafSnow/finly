"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  createGoal as createGoalService,
  deleteGoal as deleteGoalService,
  getGoals,
  updateGoal as updateGoalService,
} from "@/lib/firestore/goals";
import { CreateGoalInput, Goal } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useGoals() {
  const { family, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const familyId = family?.id;

  const loadGoals = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!familyId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await getGoals(familyId);
      setGoals(list);
    } catch {
      setError("Nao foi possivel carregar as metas.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, familyId]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const hasDuplicateCategory = useMemo(
    () => (categoryId: string, excludingGoalId?: string) =>
      goals.some(
        (goal) =>
          goal.categoryId === categoryId &&
          (!excludingGoalId || goal.id !== excludingGoalId),
      ),
    [goals],
  );

  const createGoal = async (input: CreateGoalInput) => {
    if (!familyId) {
      throw new Error("Familia nao encontrada.");
    }
    if (hasDuplicateCategory(input.categoryId)) {
      throw new Error("Ja existe uma meta para essa categoria.");
    }

    await createGoalService(familyId, input);
    await loadGoals();
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!familyId) {
      throw new Error("Familia nao encontrada.");
    }

    if (
      updates.categoryId &&
      hasDuplicateCategory(updates.categoryId, goalId)
    ) {
      throw new Error("Ja existe uma meta para essa categoria.");
    }

    await updateGoalService(familyId, goalId, updates);
    await loadGoals();
  };

  const deleteGoal = async (goalId: string) => {
    if (!familyId) {
      throw new Error("Familia nao encontrada.");
    }

    await deleteGoalService(familyId, goalId);
    await loadGoals();
  };

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh: loadGoals,
  };
}
