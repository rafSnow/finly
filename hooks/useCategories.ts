"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  createCategory as createCategoryService,
  createDefaultCategories,
  deleteCategory as deleteCategoryService,
  getCategories,
  updateCategory as updateCategoryService,
} from "@/lib/firestore/categories";
import { Category } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function useCategories(options?: { ensureDefaults?: boolean }) {
  const { family, loading: authLoading } = useAuth();
  const familyId = family?.id;
  const queryClient = useQueryClient();
  const ensureDefaults = options?.ensureDefaults ?? false;

  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories", familyId],
    queryFn: async () => {
      if (!familyId) return [];
      let list = await getCategories(familyId);
      if (list.length === 0 && ensureDefaults) {
        await createDefaultCategories(familyId);
        list = await getCategories(familyId);
      }
      return list;
    },
    enabled: !authLoading && !!familyId,
  });

  const categoryNameMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["categories", familyId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", familyId] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Category, "id" | "familyId" | "createdAt">) => {
      if (!familyId) throw new Error("Família não encontrada.");
      return createCategoryService(familyId, data);
    },
    onSuccess: invalidateCategories,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      categoryId: string;
      data: Partial<Pick<Category, "name" | "type">>;
    }) => {
      if (!familyId) throw new Error("Família não encontrada.");
      await updateCategoryService(familyId, payload.categoryId, payload.data);
    },
    onSuccess: invalidateCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!familyId) throw new Error("Família não encontrada.");
      return deleteCategoryService(familyId, categoryId);
    },
    onSuccess: invalidateCategories,
  });

  return {
    categories,
    categoryNameMap,
    loading: isLoading || authLoading,
    error: error ? (error as Error).message : null,
    createCategory: createMutation.mutateAsync,
    updateCategory: (categoryId: string, data: Partial<Pick<Category, "name" | "type">>) =>
      updateMutation.mutateAsync({ categoryId, data }),
    deleteCategory: deleteMutation.mutateAsync,
    refresh: refetch,
  };
}
