"use client";

import { useAuth } from "@/hooks/useAuth";
import { getYearlyReport, MonthlyReport } from "@/lib/firestore/reports";
import { useQuery } from "@tanstack/react-query";

export function useReports(year: number) {
  const { family, loading: authLoading } = useAuth();
  const familyId = family?.id;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reports", familyId, year],
    queryFn: async () => {
      if (!familyId) return [];
      return getYearlyReport(familyId, year);
    },
    enabled: !authLoading && !!familyId,
  });

  return {
    reports: data ?? ([] as MonthlyReport[]),
    loading: isLoading || authLoading,
    error: error ? (error as Error).message : null,
    refresh: refetch,
  };
}
