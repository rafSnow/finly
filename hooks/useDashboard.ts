"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  getEntriesByCategory,
  getPartnerSummaries,
  getSummary,
} from "@/lib/firestore/dashboard";
import {
  CategoryBreakdown,
  DashboardSummary,
  PartnerSummary,
  PeriodFilter,
} from "@/types";
import { useCallback, useEffect, useState } from "react";

const EMPTY_SUMMARY: DashboardSummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
};

export function useDashboard(filters: PeriodFilter) {
  const { family, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [partnerSummaries, setPartnerSummaries] = useState<PartnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const familyId = family?.id;

  const loadDashboard = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!familyId) {
      setSummary(EMPTY_SUMMARY);
      setCategoryBreakdown([]);
      setPartnerSummaries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [summaryData, categoryData, partnerData] = await Promise.all([
        getSummary(familyId, filters),
        getEntriesByCategory(familyId, filters),
        getPartnerSummaries(familyId, filters),
      ]);

      setSummary(summaryData);
      setCategoryBreakdown(categoryData);
      setPartnerSummaries(partnerData);
    } catch {
      setError("Nao foi possivel carregar os dados do dashboard.");
      setSummary(EMPTY_SUMMARY);
      setCategoryBreakdown([]);
      setPartnerSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, familyId, filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    summary,
    categoryBreakdown,
    partnerSummaries,
    loading,
    error,
    refresh: loadDashboard,
  };
}
