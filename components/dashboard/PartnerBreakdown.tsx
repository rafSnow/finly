import { PartnerSummary } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";

type PartnerBreakdownProps = {
  data: PartnerSummary[];
};

export function PartnerBreakdown({ data }: PartnerBreakdownProps) {
  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
      <h3 className="mb-3 text-sm font-semibold text-[#F1F0FF]">Resumo por parceiro</h3>
      {data.length === 0 ? (
        <p className="text-sm text-[#6B6890]">Sem dados para o periodo selecionado.</p>
      ) : (
        <div className="space-y-2">
          {data.map((partner) => (
            <div key={partner.uid} className="rounded-xl border border-white/[0.06] bg-[#1A1A26] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-sm font-bold text-white">
                    {partner.name.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-[#F1F0FF]">{partner.name}</p>
                </div>
                <span className="rounded-full bg-[#7C3AED]/15 px-2 py-0.5 text-xs font-medium text-[#8B5CF6]">
                  {formatPercentage(partner.expenseContribution)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#6B6890]">Receitas</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(partner.totalIncome)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#6B6890]">Despesas</span>
                <span className="text-sm font-semibold text-red-400">
                  {formatCurrency(partner.totalExpense)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
