"use client";

import { useAccounts, useAccountBalance } from "@/hooks/useAccounts";
import { useEntries } from "@/hooks/useEntries";
import { formatCurrency } from "@/lib/utils/format";
import { Account, PeriodFilter } from "@/types";
import { CreditCard, Wallet, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";
import Link from "next/link";

function AccountRow({ account, period }: { account: Account; period: PeriodFilter }) {
  const { balance, loading: loadingBalance } = useAccountBalance(account.id);
  const { entries, loading: loadingEntries } = useEntries({ month: period.month, year: period.year });

  const isCredit = account.accountType === "credit";
  const isInvestment = account.accountType === "investment";
  const loading = isCredit ? loadingEntries : loadingBalance;

  let displayValue = 0;
  if (isCredit) {
    const accountEntries = entries.filter(
      (e) => e.accountId === account.id || e.destinationAccountId === account.id
    );
    const expenses = accountEntries
      .filter((e) => e.accountId === account.id && e.type === "expense" && !e.isTransfer)
      .reduce((sum, e) => sum + e.value, 0);
    const incomes = accountEntries
      .filter((e) => e.accountId === account.id && e.type === "income" && !e.isTransfer)
      .reduce((sum, e) => sum + e.value, 0);
    const payments = accountEntries
      .filter((e) => e.destinationAccountId === account.id && (e.type === "transfer" || e.isTransfer))
      .reduce((sum, e) => sum + e.value, 0);
    displayValue = Math.max(0, expenses - incomes - payments);
  } else {
    displayValue = balance;
  }

  return (
    <Link
      href={`/contas/detalhes?id=${account.id}`}
      className="flex items-center justify-between py-2.5 transition-colors hover:bg-white/[0.02] rounded-lg px-1"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A26] ${
            isCredit ? "text-orange-500" : isInvestment ? "text-emerald-500" : "text-[#7C3AED]"
          }`}
        >
          {isCredit ? <CreditCard size={14} /> : isInvestment ? <TrendingUp size={14} /> : <Wallet size={14} />}
        </div>
        <div>
          <span className="text-sm font-medium text-[#F1F0FF]">{account.name}</span>
          {isCredit && (
            <span className="ml-2 text-[11px] text-[#6B6890]">Fatura</span>
          )}
        </div>
      </div>
      <span className={`text-sm font-bold ${isCredit || displayValue >= 0 ? "text-[#F1F0FF]" : "text-red-400"}`}>
        {loading ? "..." : formatCurrency(displayValue)}
      </span>
    </Link>
  );
}

export function AccountsOverview({ period }: { period: PeriodFilter }) {
  const { accounts, loading } = useAccounts();
  const router = useRouter();

  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#A09DC0]">Minhas Contas</h3>
        <Link href="/contas" className="text-xs font-medium text-[#8B5CF6] hover:text-[#F1F0FF]">
          Ver todas
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton variant="line" height="h-8" />
          <Skeleton variant="line" height="h-8" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta"
          description="Você ainda não tem contas cadastradas."
          action={{
            label: "Adicionar Conta",
            onClick: () => router.push("/contas")
          }}
        />
      ) : (
        <div className="space-y-1 divide-y divide-white/5">
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} period={period} />
          ))}
        </div>
      )}
    </div>
  );
}
