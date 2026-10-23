"use client";

import { formatCurrency } from "@/lib/utils/format";
import { Flame, Sparkles, Clock, Coins } from "lucide-react";
import { useMemo, useState } from "react";

interface FinancialIndependenceSimulatorProps {
  currentInvestments: number;
  currentWealth: number;
}

export function simulateFinancialIndependence(params: {
  initialCapital: number;
  monthlyContribution: number;
  desiredMonthlyIncome: number;
  annualRealRatePct: number;
  horizonYears: number;
}) {
  const {
    initialCapital,
    monthlyContribution,
    desiredMonthlyIncome,
    annualRealRatePct,
    horizonYears,
  } = params;

  const startCapital = Math.max(0, initialCapital);
  const monthlyRate = Math.pow(1 + annualRealRatePct / 100, 1 / 12) - 1;
  const totalMonths = horizonYears * 12;

  // Capital necessário para que o rendimento mensal real pague 100% da renda desejada perpetuamente
  const fireTargetCapital =
    monthlyRate > 0 ? desiredMonthlyIncome / monthlyRate : desiredMonthlyIncome * 300;

  // Projeção no horizonte escolhido (mês a mês)
  let balance = startCapital;
  for (let m = 0; m < totalMonths; m += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }

  const projectedTotal = balance;
  const totalContributed = startCapital + monthlyContribution * totalMonths;
  const totalInterestEarned = Math.max(0, projectedTotal - totalContributed);
  const passiveMonthlyIncomeAtHorizon = projectedTotal * monthlyRate;

  // Cálculo do tempo exato até atingir o fireTargetCapital (limite 60 anos = 720 meses)
  let monthsToFire: number | null = null;
  let simBalance = startCapital;
  if (simBalance >= fireTargetCapital) {
    monthsToFire = 0;
  } else if (monthlyContribution > 0 || (simBalance > 0 && monthlyRate > 0)) {
    for (let m = 1; m <= 720; m += 1) {
      simBalance = simBalance * (1 + monthlyRate) + monthlyContribution;
      if (simBalance >= fireTargetCapital) {
        monthsToFire = m;
        break;
      }
    }
  }

  return {
    monthlyRate,
    fireTargetCapital,
    projectedTotal,
    totalContributed,
    totalInterestEarned,
    passiveMonthlyIncomeAtHorizon,
    monthsToFire,
  };
}

export function FinancialIndependenceSimulator({
  currentInvestments,
  currentWealth,
}: FinancialIndependenceSimulatorProps) {
  const defaultInitial =
    currentInvestments > 0 ? currentInvestments : Math.max(0, currentWealth);

  const [monthlyContribution, setMonthlyContribution] = useState<number>(1500);
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState<number>(5000);
  const [annualRealRatePct, setAnnualRealRatePct] = useState<number>(6);
  const [horizonYears, setHorizonYears] = useState<number>(15);

  const result = useMemo(
    () =>
      simulateFinancialIndependence({
        initialCapital: defaultInitial,
        monthlyContribution,
        desiredMonthlyIncome,
        annualRealRatePct,
        horizonYears,
      }),
    [
      defaultInitial,
      monthlyContribution,
      desiredMonthlyIncome,
      annualRealRatePct,
      horizonYears,
    ]
  );

  const contributedSharePct =
    result.projectedTotal > 0
      ? Math.min(100, (result.totalContributed / result.projectedTotal) * 100)
      : 0;
  const interestSharePct = Math.max(0, 100 - contributedSharePct);

  const formatMonthsToYears = (months: number | null) => {
    if (months === null) return "Acima de 60 anos";
    if (months === 0) return "Meta já atingida!";
    const yrs = Math.floor(months / 12);
    const remMonths = months % 12;
    if (yrs === 0) return `${remMonths} meses`;
    if (remMonths === 0) return `${yrs} ${yrs === 1 ? "ano" : "anos"}`;
    return `${yrs}a e ${remMonths}m`;
  };

  return (
    <div className="mb-8 rounded-2xl border border-white/8 bg-[#111118] p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7C3AED] to-emerald-500 text-white">
            <Flame size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#F1F0FF]">
              Simulador de Independência Financeira (FIRE)
            </h3>
            <p className="text-xs text-[#6B6890]">
              Projeção de juros compostos partindo do patrimônio atual de{" "}
              <strong className="text-[#A09DC0]">
                {formatCurrency(defaultInitial)}
              </strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-[#1A1A26] p-1">
          {[5, 10, 15, 20, 30].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setHorizonYears(yr)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                horizonYears === yr
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "text-[#A09DC0] hover:text-white"
              }`}
            >
              {yr}a
            </button>
          ))}
        </div>
      </div>

      {/* Controles Interativos */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#1A1A26] p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-[#A09DC0]">
              Aporte Mensal do Casal
            </label>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(monthlyContribution)}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={20000}
            step={100}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full accent-[#7C3AED]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[#6B6890]">
            <span>R$ 100</span>
            <span>R$ 20.000/mês</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1A1A26] p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-[#A09DC0]">
              Renda Passiva Desejada
            </label>
            <span className="text-sm font-bold text-[#C4B5FD]">
              {formatCurrency(desiredMonthlyIncome)}/mês
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={30000}
            step={500}
            value={desiredMonthlyIncome}
            onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
            className="w-full accent-[#7C3AED]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[#6B6890]">
            <span>R$ 1.000</span>
            <span>R$ 30.000/mês</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1A1A26] p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-[#A09DC0]">
              Rentabilidade Real (acima da inflação)
            </label>
            <span className="text-sm font-bold text-[#F1F0FF]">
              {annualRealRatePct}% a.a.
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={12}
            step={0.5}
            value={annualRealRatePct}
            onChange={(e) => setAnnualRealRatePct(Number(e.target.value))}
            className="w-full accent-[#7C3AED]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-[#6B6890]">
            <span>3% (Conservador)</span>
            <span>12% (Arrojado)</span>
          </div>
        </div>
      </div>

      {/* Cards de Resultado */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-[#1A1A26]/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#A09DC0]">
            <Coins size={15} className="text-[#8B5CF6]" />
            Patrimônio em {horizonYears} anos
          </div>
          <p className="mt-2 text-2xl font-bold text-[#F1F0FF]">
            {formatCurrency(result.projectedTotal)}
          </p>
          <p className="mt-1 text-xs text-emerald-400">
            +{formatCurrency(result.totalInterestEarned)} só de juros compostos
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#1A1A26]/70 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#A09DC0]">
            <Sparkles size={15} className="text-emerald-400" />
            Renda Passiva Vitalícia em {horizonYears}a
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {formatCurrency(result.passiveMonthlyIncomeAtHorizon)}
            <span className="text-xs font-normal text-[#A09DC0]">/mês</span>
          </p>
          <p className="mt-1 text-xs text-[#6B6890]">
            Rendimento perpétuo sem consumir o principal
          </p>
        </div>

        <div className="rounded-xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#7C3AED]/15 to-transparent p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#C4B5FD]">
            <Clock size={15} />
            Tempo até a Independência
          </div>
          <p className="mt-2 text-2xl font-bold text-[#F1F0FF]">
            {formatMonthsToYears(result.monthsToFire)}
          </p>
          <p className="mt-1 text-xs text-[#A09DC0]">
            Meta FIRE: {formatCurrency(result.fireTargetCapital)}
          </p>
        </div>
      </div>

      {/* Barra de Composição (Aportes vs Juros Compostos) */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-[#A09DC0]">
            Esforço próprio (Inicial + Aportes):{" "}
            <strong className="text-[#F1F0FF]">
              {formatCurrency(result.totalContributed)} ({contributedSharePct.toFixed(0)}%)
            </strong>
          </span>
          <span className="text-emerald-400">
            Juros Compostos:{" "}
            <strong>
              {formatCurrency(result.totalInterestEarned)} ({interestSharePct.toFixed(0)}%)
            </strong>
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[#7C3AED] transition-all duration-300"
            style={{ width: `${contributedSharePct}%` }}
          />
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${interestSharePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
