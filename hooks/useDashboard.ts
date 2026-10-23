"use client";

import { useAuth } from "@/hooks/useAuth";
import { getDashboardData } from "@/lib/firestore/dashboard";
import { DashboardSummary, PeriodFilter } from "@/types";
import { useQuery } from "@tanstack/react-query";

const EMPTY_SUMMARY: DashboardSummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

export function useDashboard(filters: PeriodFilter) {
  const { family, loading: authLoading } = useAuth();
  const familyId = family?.id;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard", familyId, filters.month, filters.year],
    queryFn: async () => {
      if (!familyId) {
        return {
          summary: EMPTY_SUMMARY,
          categoryBreakdown: [],
          partnerSummaries: [],
        };
      }

      return getDashboardData(familyId, {
        month: filters.month,
        year: filters.year,
      });
    },
    enabled: !authLoading && !!familyId,
  });

  return {
    summary: data?.summary ?? EMPTY_SUMMARY,
    categoryBreakdown: data?.categoryBreakdown ?? [],
    partnerSummaries: data?.partnerSummaries ?? [],
    loading: isLoading || authLoading,
    error: error ? (error as Error).message : null,
    refresh: refetch,
  };
}
