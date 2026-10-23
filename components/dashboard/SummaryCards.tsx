import { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

type SummaryCardsProps = {
  summary: DashboardSummary;
};

export function SummaryCards({ summary }: SummaryCardsProps) {
  const balancePositive = summary.balance >= 0;
  const realizedBalance = summary.realizedBalance ?? summary.balance;
  const pendingIncome = summary.pendingIncome ?? 0;
  const pendingExpense = summary.pendingExpense ?? 0;
  const hasPending = pendingIncome > 0 || pendingExpense > 0;

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
        {pendingIncome > 0 && (
          <p className="mt-1.5 text-[11px] text-[#A09DC0]">
            Recebido: <span className="font-medium text-[#F1F0FF]">{formatCurrency(summary.paidIncome ?? 0)}</span> • A receber: <span className="font-medium text-amber-400">{formatCurrency(pendingIncome)}</span>
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
          <ArrowDownCircle className="h-5 w-5 text-red-400" />
        </div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#6B6890]">Despesas</p>
        <p className="text-base font-bold leading-tight text-red-400">
          {formatCurrency(summary.totalExpense)}
        </p>
        {pendingExpense > 0 && (
          <p className="mt-1.5 text-[11px] text-[#A09DC0]">
            Pago: <span className="font-medium text-[#F1F0FF]">{formatCurrency(summary.paidExpense ?? 0)}</span> • Pendente: <span className="font-medium text-amber-400">{formatCurrency(pendingExpense)}</span>
          </p>
        )}
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
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[#6B6890]">
          {hasPending ? "Saldo Projetado (Mês)" : "Saldo"}
        </p>
        <p className={`text-base font-bold leading-tight ${balancePositive ? "text-[#F1F0FF]" : "text-red-400"}`}>
          {formatCurrency(summary.balance)}
        </p>
        {hasPending && (
          <p className="mt-1.5 text-[11px] text-[#A09DC0]">
            Saldo realizado hoje:{" "}
            <span className={`font-medium ${realizedBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(realizedBalance)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
