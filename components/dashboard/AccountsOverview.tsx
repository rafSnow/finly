import { useAccounts, useAccountBalance } from "@/hooks/useAccounts";
import { useEntries } from "@/hooks/useEntries";
import { Account, PeriodFilter } from "@/types";
import { CreditCard, Wallet } from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function AccountRow({ account, period }: { account: Account; period: PeriodFilter }) {
  const { balance, loading: loadingBalance } = useAccountBalance(account.id);
  const { entries, loading: loadingEntries } = useEntries({ month: period.month, year: period.year });

  const isCredit = account.accountType === "credit";
  const loading = isCredit ? loadingEntries : loadingBalance;

  let displayValue = 0;
  if (isCredit) {
    const accountEntries = entries.filter((e) => e.accountId === account.id || e.destinationAccountId === account.id);
    displayValue = accountEntries.reduce((sum, e) => sum + e.value, 0);
  } else {
    displayValue = balance;
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A1A26] ${isCredit ? "text-orange-500" : "text-[#7C3AED]"}`}>
          {isCredit ? <CreditCard size={14} /> : <Wallet size={14} />}
        </div>
        <span className="text-sm font-medium text-[#F1F0FF]">{account.name}</span>
      </div>
      <span className={`text-sm font-bold ${isCredit || displayValue >= 0 ? "text-[#F1F0FF]" : "text-red-400"}`}>
        {loading ? "..." : formatCurrency(isCredit ? displayValue : Math.abs(displayValue))}
      </span>
    </div>
  );
}

export function AccountsOverview({ period }: { period: PeriodFilter }) {
  const { accounts, loading } = useAccounts();

  if (loading) return null;
  if (accounts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
      <h3 className="mb-4 text-sm font-medium text-[#A09DC0]">Minhas Contas</h3>
      <div className="space-y-1 divide-y divide-white/5">
        {accounts.map((account) => (
          <AccountRow key={account.id} account={account} period={period} />
        ))}
      </div>
    </div>
  );
}
