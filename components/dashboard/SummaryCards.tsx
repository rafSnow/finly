import { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

type SummaryCardsProps = {
  summary: DashboardSummary;
};

export function SummaryCards({ summary }: SummaryCardsProps) {
  const balancePositive = summary.balance >= 0;

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
          <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
        </div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#6B6890]">Receitas</p>
        <p className="text-base font-bold leading-tight text-emerald-400">
          {formatCurrency(summary.totalIncome)}
        </p>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
          <ArrowDownCircle className="h-5 w-5 text-red-400" />
        </div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#6B6890]">Despesas</p>
        <p className="text-base font-bold leading-tight text-red-400">
          {formatCurrency(summary.totalExpense)}
        </p>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
        <div
          className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${
            balancePositive ? "bg-blue-500/15" : "bg-red-500/15"
          }`}
        >
          <Wallet
            className={`h-5 w-5 ${balancePositive ? "text-blue-400" : "text-red-400"}`}
          />
        </div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#6B6890]">Saldo</p>
        <p className={`text-base font-bold leading-tight ${balancePositive ? "text-[#F1F0FF]" : "text-red-400"}`}>
          {formatCurrency(summary.balance)}
        </p>
      </div>
    </div>
  );
}
