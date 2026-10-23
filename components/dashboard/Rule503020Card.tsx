"use client";

import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { CategoryBreakdown, DashboardSummary } from "@/types";
import { ShieldCheck, Sparkles, PiggyBank, Info } from "lucide-react";
import { useMemo } from "react";

interface Rule503020CardProps {
  summary: DashboardSummary;
  categoryBreakdown: CategoryBreakdown[];
}

const ESSENTIAL_KEYWORDS = [
  "moradia",
  "aluguel",
  "condominio",
  "alimentacao",
  "mercado",
  "supermercado",
  "saude",
  "farmacia",
  "transporte",
  "combustivel",
  "educacao",
  "escola",
  "faculdade",
  "energia",
  "agua",
  "luz",
  "internet",
  "contas",
  "imposto",
  "seguro",
];

const INVESTMENT_KEYWORDS = [
  "investimento",
  "investimentos",
  "poupanca",
  "reserva",
  "previdencia",
  "aporte",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function classify503020(
  summary: DashboardSummary,
  categoryBreakdown: CategoryBreakdown[]
) {
  let essentialsTotal = 0;
  let lifestyleTotal = 0;
  let explicitInvestmentTotal = 0;

  for (const item of categoryBreakdown) {
    const normName = normalizeText(item.categoryName);
    if (INVESTMENT_KEYWORDS.some((kw) => normName.includes(kw))) {
      explicitInvestmentTotal += item.total;
    } else if (ESSENTIAL_KEYWORDS.some((kw) => normName.includes(kw))) {
      essentialsTotal += item.total;
    } else {
      lifestyleTotal += item.total;
    }
  }

  const income = summary.totalIncome;
  const unspentSavings = Math.max(0, income - (essentialsTotal + lifestyleTotal + explicitInvestmentTotal));
  const futureTotal = explicitInvestmentTotal + unspentSavings;

  const base = income > 0 ? income : essentialsTotal + lifestyleTotal + futureTotal;

  const essentialsPct = base > 0 ? (essentialsTotal / base) * 100 : 0;
  const lifestylePct = base > 0 ? (lifestyleTotal / base) * 100 : 0;
  const futurePct = income > 0 ? (futureTotal / income) * 100 : 0;

  return {
    income,
    essentialsTotal,
    lifestyleTotal,
    futureTotal,
    essentialsTarget: income * 0.5,
    lifestyleTarget: income * 0.3,
    futureTarget: income * 0.2,
    essentialsPct,
    lifestylePct,
    futurePct,
  };
}

export function Rule503020Card({ summary, categoryBreakdown }: Rule503020CardProps) {
  const metrics = useMemo(
    () => classify503020(summary, categoryBreakdown),
    [summary, categoryBreakdown]
  );

  const hasIncome = metrics.income > 0;
  const hasAnyData = metrics.income > 0 || summary.totalExpense > 0;

  if (!hasAnyData) {
    return null;
  }

  const getDiagnosticMessage = () => {
    if (!hasIncome) {
      return "Cadastre as receitas do casal neste mês para calcular os tetos ideais de 50% (Essenciais), 30% (Estilo de Vida) e 20% (Futuro).";
    }
    if (metrics.futurePct >= 20 && metrics.essentialsPct <= 55) {
      return `Excelente equilíbrio! Vocês estão preservando ${metrics.futurePct.toFixed(
        0
      )}% da renda para o futuro (meta: 20%) e mantendo os custos fixos sob controle.`;
    }
    if (metrics.essentialsPct > 55) {
      return `Os gastos essenciais absorveram ${metrics.essentialsPct.toFixed(
        0
      )}% da renda (ideal: até 50%). Avaliem renegociar contratos fixos ou otimizar contas de consumo.`;
    }
    if (metrics.lifestylePct > 35) {
      return `Os gastos com Estilo de Vida chegaram a ${metrics.lifestylePct.toFixed(
        0
      )}% da renda (ideal: até 30%). Reduzir pequenos excessos liberará mais caixa para os sonhos do casal.`;
    }
    return `Restam ${formatCurrency(
      Math.max(0, metrics.futureTarget - metrics.futureTotal)
    )} de economia neste mês para vocês atingirem a meta ideal de 20% de poupança.`;
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#F1F0FF]">
            Termômetro 50 / 30 / 20 do Casal
          </h3>
          <p className="text-xs text-[#6B6890]">
            Distribuição inteligente da renda entre Necessidades, Desejos e Futuro
          </p>
        </div>
        {hasIncome && (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[#7C3AED]/15 px-3 py-1 text-xs font-medium text-[#C4B5FD] sm:mt-0">
            Base: {formatCurrency(metrics.income)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* 50% Essenciais */}
        <div className="rounded-xl border border-white/8 bg-[#1A1A26] p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <ShieldCheck size={15} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F1F0FF]">50% Essenciais</p>
                <p className="text-[10px] text-[#6B6890]">Moradia, Mercado, Saúde</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                metrics.essentialsPct <= 50
                  ? "bg-emerald-500/15 text-emerald-400"
                  : metrics.essentialsPct <= 60
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {metrics.essentialsPct.toFixed(0)}%
            </span>
          </div>

          <p className="text-lg font-bold text-[#F1F0FF]">
            {formatCurrency(metrics.essentialsTotal)}
          </p>
          {hasIncome && (
            <p className="mt-0.5 text-[11px] text-[#A09DC0]">
              Teto ideal: {formatCurrency(metrics.essentialsTarget)}
            </p>
          )}

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.essentialsPct <= 50
                  ? "bg-emerald-400"
                  : metrics.essentialsPct <= 60
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{
                width: `${Math.min(100, (metrics.essentialsPct / 50) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 30% Estilo de Vida */}
        <div className="rounded-xl border border-white/8 bg-[#1A1A26] p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7C3AED]/15 text-[#C4B5FD]">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F1F0FF]">30% Estilo de Vida</p>
                <p className="text-[10px] text-[#6B6890]">Lazer, Conforto, Outros</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                metrics.lifestylePct <= 30
                  ? "bg-emerald-500/15 text-emerald-400"
                  : metrics.lifestylePct <= 40
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {metrics.lifestylePct.toFixed(0)}%
            </span>
          </div>

          <p className="text-lg font-bold text-[#F1F0FF]">
            {formatCurrency(metrics.lifestyleTotal)}
          </p>
          {hasIncome && (
            <p className="mt-0.5 text-[11px] text-[#A09DC0]">
              Teto ideal: {formatCurrency(metrics.lifestyleTarget)}
            </p>
          )}

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.lifestylePct <= 30
                  ? "bg-[#8B5CF6]"
                  : metrics.lifestylePct <= 40
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{
                width: `${Math.min(100, (metrics.lifestylePct / 30) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 20% Futuro & Poupança */}
        <div className="rounded-xl border border-white/8 bg-[#1A1A26] p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <PiggyBank size={15} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F1F0FF]">20% Futuro & Metas</p>
                <p className="text-[10px] text-[#6B6890]">Saldo Poupado / Investido</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                metrics.futurePct >= 20
                  ? "bg-emerald-500/15 text-emerald-400"
                  : metrics.futurePct >= 10
                  ? "bg-amber-500/15 text-amber-300"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {metrics.futurePct.toFixed(0)}%
            </span>
          </div>

          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(metrics.futureTotal)}
          </p>
          {hasIncome && (
            <p className="mt-0.5 text-[11px] text-[#A09DC0]">
              Meta mínima: {formatCurrency(metrics.futureTarget)}
            </p>
          )}

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{
                width: `${Math.min(100, (metrics.futurePct / 20) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-xs text-[#A09DC0]">
        <Info size={15} className="mt-0.5 shrink-0 text-[#8B5CF6]" />
        <p>{getDiagnosticMessage()}</p>
      </div>
    </Card>
  );
}
