"use client";

import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { GoalProgressList } from "@/components/dashboard/GoalProgressList";
import { PartnerBreakdown } from "@/components/dashboard/PartnerBreakdown";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { usePeriod } from "@/hooks/usePeriod";
import { useGoals } from "@/hooks/useGoals";
import { getCategories } from "@/lib/firestore/categories";
import { Category, PeriodFilter } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { AiInsights } from "@/components/dashboard/AiInsights";

export default function Dashboard() {
  const { family } = useAuth();

  const { period, setPeriod, mounted } = usePeriod();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const { summary, categoryBreakdown, partnerSummaries, loading, error } =
    useDashboard(period);
  const { goals, loading: goalsLoading } = useGoals();

  useEffect(() => {
    const loadCategories = async () => {
      if (!family?.id) {
        setCategories([]);
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      try {
        const list = await getCategories(family.id);
        setCategories(list);
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [family?.id]);

  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const goalProgress = useMemo(
    () =>
      goals.map((goal) => {
        const categoryData = categoryBreakdown.find(
          (item) => item.categoryId === goal.categoryId,
        );
        const spent = categoryData?.total ?? 0;

        return {
          goal,
          categoryName: categoryNameMap.get(goal.categoryId) ?? "Categoria",
          spent,
          progress: goal.limit > 0 ? (spent / goal.limit) * 100 : 0,
        };
      }),
    [categoryBreakdown, categoryNameMap, goals],
  );

  const isLoading = loading || goalsLoading || categoriesLoading;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F1F0FF]">Dashboard</h2>
        <Link 
          href="/relatorios"
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-[#F1F0FF] transition-colors hover:bg-white/10"
        >
          <FileBarChart size={16} />
          Relatórios
        </Link>
      </div>

      <PeriodSelector value={period} onChange={setPeriod} />

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton variant="card" height="h-20" />
            <Skeleton variant="card" height="h-20" />
            <Skeleton variant="card" height="h-20" />
          </div>
          <Skeleton variant="card" height="h-56" />
          <Skeleton variant="line" height="h-5" />
          <Skeleton variant="line" height="h-5" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {!isLoading ? (
        <>
          <AiInsights categoryNameMap={categoryNameMap} />
          <SummaryCards summary={summary} />
          <AccountsOverview period={period} />
          <CategoryChart data={categoryBreakdown} />
          <GoalProgressList items={goalProgress} />
          <PartnerBreakdown data={partnerSummaries} />
        </>
      ) : null}
    </div>
  );
}
