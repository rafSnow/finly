"use client";

import { PartnerSummary, SplitMethod } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFamily } from "@/hooks/useFamily";
import { ArrowRightLeft, Scale } from "lucide-react";

type PartnerBreakdownProps = {
  data: PartnerSummary[];
};

export function PartnerBreakdown({ data }: PartnerBreakdownProps) {
  const { family, updateSplitMethod } = useFamily();
  const splitMethod: SplitMethod = family?.splitMethod ?? "50_50";

  const handleToggleSplit = async (next: SplitMethod) => {
    if (next === splitMethod) return;
    try {
      await updateSplitMethod(next);
    } catch (e) {
      console.error("Erro ao atualizar divisão:", e);
    }
  };

  const totalSharedExpense = data.reduce(
    (sum, p) => sum + (p.sharedExpensePaid ?? p.totalExpense),
    0,
  );
  const totalCoupleIncome = data.reduce((sum, p) => sum + p.totalIncome, 0);

  // Calcula quanto cada parceiro deveria pagar das despesas conjuntas e o saldo de acerto
  const partnerCalculations = data.map((partner) => {
    const sharedPaid = partner.sharedExpensePaid ?? partner.totalExpense;
    const personalPaid = partner.personalExpensePaid ?? 0;

    let targetRatio = data.length > 0 ? 1 / data.length : 0.5;
    if (splitMethod === "proportional" && totalCoupleIncome > 0) {
      targetRatio = partner.totalIncome / totalCoupleIncome;
    }

    const fairShare = totalSharedExpense * targetRatio;
    const settlementBalance = sharedPaid - fairShare; // > 0 tem a receber, < 0 deve pagar

    return {
      ...partner,
      sharedPaid,
      personalPaid,
      targetRatio: targetRatio * 100,
      fairShare,
      settlementBalance,
    };
  });

  // Se houver 2 membros, identifica quem deve transferir para quem
  let settlementMessage: {
    fromName: string;
    toName: string;
    amount: number;
  } | null = null;

  if (partnerCalculations.length === 2 && totalSharedExpense > 0) {
    const [p1, p2] = partnerCalculations;
    if (Math.abs(p1.settlementBalance) >= 0.05) {
      if (p1.settlementBalance < 0) {
        settlementMessage = {
          fromName: p1.name,
          toName: p2.name,
          amount: Math.abs(p1.settlementBalance),
        };
      } else {
        settlementMessage = {
          fromName: p2.name,
          toName: p1.name,
          amount: Math.abs(p2.settlementBalance),
        };
      }
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#F1F0FF]">Divisão e Resumo do Casal</h3>
          <p className="text-xs text-[#6B6890]">
            Despesas conjuntas do período: <strong className="text-[#A09DC0]">{formatCurrency(totalSharedExpense)}</strong>
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-[#1A1A26] p-1">
          <button
            type="button"
            onClick={() => handleToggleSplit("50_50")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              splitMethod === "50_50"
                ? "bg-[#7C3AED] text-white shadow-sm"
                : "text-[#A09DC0] hover:text-[#F1F0FF]"
            }`}
          >
            50% / 50%
          </button>
          <button
            type="button"
            onClick={() => handleToggleSplit("proportional")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              splitMethod === "proportional"
                ? "bg-[#7C3AED] text-white shadow-sm"
                : "text-[#A09DC0] hover:text-[#F1F0FF]"
            }`}
          >
            Proporcional à Renda
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Sem dados"
          description="Nenhum lançamento no período selecionado para calcular a divisão."
        />
      ) : (
        <div className="space-y-3">
          {partnerCalculations.map((partner) => (
            <div key={partner.uid} className="rounded-xl border border-white/[0.06] bg-[#1A1A26] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-sm font-bold text-white">
                    {partner.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F1F0FF]">{partner.name}</p>
                    <p className="text-[11px] text-[#6B6890]">
                      Quota ideal ({splitMethod === "proportional" ? "pela renda" : "meio a meio"}):{" "}
                      <strong className="text-[#A09DC0]">{formatPercentage(partner.targetRatio, 0)}</strong> ({formatCurrency(partner.fairShare)})
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#7C3AED]/15 px-2.5 py-0.5 text-xs font-medium text-[#8B5CF6]">
                  Pagou {formatPercentage(partner.expenseContribution)}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-xs">
                <div>
                  <span className="block text-[#6B6890]">Receitas</span>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(partner.totalIncome)}
                  </span>
                </div>
                <div>
                  <span className="block text-[#6B6890]">Gastos Conjuntos</span>
                  <span className="font-semibold text-red-400">
                    {formatCurrency(partner.sharedPaid)}
                  </span>
                </div>
                <div>
                  <span className="block text-[#6B6890]">Gastos Individuais</span>
                  <span className="font-semibold text-[#A09DC0]">
                    {formatCurrency(partner.personalPaid)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {partnerCalculations.length === 2 && totalSharedExpense > 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#7C3AED]/30 bg-gradient-to-r from-[#7C3AED]/15 to-[#4F46E5]/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#8B5CF6]">
                {settlementMessage ? <ArrowRightLeft size={18} /> : <Scale size={18} />}
              </div>
              <div className="text-xs leading-relaxed text-[#A09DC0]">
                <p className="font-semibold text-[#F1F0FF]">Acerto de Contas do Mês</p>
                {settlementMessage ? (
                  <p className="mt-0.5">
                    Para equilibrar os gastos conjuntos ({splitMethod === "proportional" ? "proporcional à renda" : "50/50"}),{" "}
                    <strong className="text-[#F1F0FF]">{settlementMessage.fromName}</strong> deve transferir{" "}
                    <strong className="text-emerald-400">{formatCurrency(settlementMessage.amount)}</strong> para{" "}
                    <strong className="text-[#F1F0FF]">{settlementMessage.toName}</strong>.
                  </p>
                ) : (
                  <p className="mt-0.5 text-emerald-400">
                    As despesas conjuntas do casal já estão perfeitamente equilibradas neste mês!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
