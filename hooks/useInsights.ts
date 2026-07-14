"use client";

import { useDashboard } from "./useDashboard";
import { useGoals } from "./useGoals";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { CategoryBreakdown } from "@/types";

interface InsightResponse {
  insight?: string;
  error?: string;
}

export function useInsights() {
  const { family } = useAuth();
  const now = new Date();
  
  const { summary, categoryBreakdown } = useDashboard({ month: now.getMonth() + 1, year: now.getFullYear() });
  const { goals } = useGoals();
  
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async (categoryNameMap: Map<string, string>) => {
    if (!family) return;
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      // Formata breakdowns com nomes
      const formattedBreakdown = categoryBreakdown.map((cb) => ({
        categoryName: categoryNameMap.get(cb.categoryId) || "Categoria",
        total: cb.total,
      }));

      // Formata metas 
      const goalsProgress = goals.map((goal) => {
        const spent = categoryBreakdown.find((cb) => cb.categoryId === goal.categoryId)?.total || 0;
        return {
          categoryName: categoryNameMap.get(goal.categoryId) || "Categoria",
          spent,
          goalLimit: goal.limit,
          progress: goal.limit > 0 ? (spent / goal.limit) * 100 : 0
        };
      });

      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          categoryBreakdown: formattedBreakdown,
          goalsProgress,
        }),
      });

      const data: InsightResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao gerar o insight.");
      }

      if (data.insight) {
        setInsight(data.insight);
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o Assistente.");
    } finally {
      setLoading(false);
    }
  };

  return {
    insight,
    loading,
    error,
    generateInsight,
  };
}
