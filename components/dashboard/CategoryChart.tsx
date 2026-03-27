"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { CategoryBreakdown } from "@/types";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type CategoryChartProps = {
  data: CategoryBreakdown[];
};

const CHART_COLORS = [
  "#7C3AED",
  "#6366F1",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
];

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="mb-5 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#F1F0FF]">Despesas por categoria</h3>
        <EmptyState
          title="Nenhuma despesa neste periodo"
          description="Adicione lancamentos para visualizar o grafico por categoria"
        />
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#F1F0FF]">Despesas por categoria</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="categoryName" outerRadius={90}>
              {data.map((item, index) => (
                <Cell key={item.categoryId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#111118",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                color: "#F1F0FF",
              }}
              formatter={(value) =>
                formatCurrency(typeof value === "number" ? value : Number(value ?? 0))
              }
              labelFormatter={(_, payload) => payload?.[0]?.payload?.categoryName ?? ""}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3">
        {data.map((item, index) => (
          <div
            key={item.categoryId}
            className="flex items-center justify-between border-b border-white/[0.05] py-2 last:border-0"
          >
            <div className="flex items-center">
              <span
                className="mr-2.5 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-sm text-[#A09DC0]">{item.categoryName}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-[#F1F0FF]">{formatCurrency(item.total)}</span>
              <span className="ml-2 text-xs text-[#6B6890]">{formatPercentage(item.percentage)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
