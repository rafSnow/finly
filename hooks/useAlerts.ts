"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntries } from "@/hooks/useEntries";
import { useGoals } from "@/hooks/useGoals";
import { useDashboard } from "@/hooks/useDashboard";
import { getCategories } from "@/lib/firestore/categories";
import { Category } from "@/types";

export type AlertType = "warning" | "danger" | "info";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  date?: Date;
}

export function useAlerts() {
  const { family } = useAuth();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (family?.id) {
      getCategories(family.id).then(setCategories).catch(console.error);
    }
  }, [family?.id]);

  const { entries, loading: loadingEntries } = useEntries({ month: currentMonth, year: currentYear });
  const { goals, loading: loadingGoals } = useGoals();
  const { categoryBreakdown, loading: loadingDashboard } = useDashboard({ month: currentMonth, year: currentYear });

  const alerts = useMemo(() => {
    if (!family || categories.length === 0) return [];
    
    const newAlerts: Alert[] = [];

    // 1. Verificar Despesas Próximas (Até 3 dias)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExpenses = entries.filter((entry) => {
      if (entry.type !== "expense") return false;
      const entryDate = new Date(entry.date);
      // Conta as que estão vencendo de hoje até daqui a 3 dias
      return entryDate >= today && entryDate <= threeDaysFromNow;
    });

    upcomingExpenses.forEach((expense) => {
      const entryDate = new Date(expense.date);
      const diffTime = entryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let dayText = "";
      if (diffDays === 0) dayText = "hoje";
      else if (diffDays === 1) dayText = "amanhã";
      else dayText = `em ${diffDays} dias`;

      newAlerts.push({
        id: `upcoming-${expense.id}`,
        type: "warning",
        title: "Despesa Próxima",
        description: `${expense.description || "Lançamento"} vence ${dayText}.`,
        date: expense.date,
      });
    });

    // 2. Verificar Metas Atingindo 80% ou 100%
    goals.forEach((goal) => {
      const categoryData = categoryBreakdown.find((cb) => cb.categoryId === goal.categoryId);
      const spent = categoryData?.total || 0;
      const categoryName = categories.find((c) => c.id === goal.categoryId)?.name || "Categoria";

      if (goal.limit > 0) {
        const percentage = (spent / goal.limit) * 100;
        if (percentage >= 100) {
          newAlerts.push({
            id: `goal-100-${goal.id}`,
            type: "danger",
            title: "Limite Excedido",
            description: `Você ultrapassou 100% da sua meta de ${categoryName}.`,
          });
        } else if (percentage >= 80) {
          newAlerts.push({
            id: `goal-80-${goal.id}`,
            type: "warning",
            title: "Meta em Risco",
            description: `Atenção: você já atingiu ${percentage.toFixed(0)}% da meta de ${categoryName}.`,
          });
        }
      }
    });

    return newAlerts;
  }, [family, entries, goals, categoryBreakdown, categories]);

  return {
    alerts,
    loading: loadingEntries || loadingGoals || loadingDashboard,
  };
}
