"use client";

import { useInsights } from "@/hooks/useInsights";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

interface AiInsightsProps {
  categoryNameMap: Map<string, string>;
}

export function AiInsights({ categoryNameMap }: AiInsightsProps) {
  const { insight, loading, error, generateInsight } = useInsights();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#111118] to-[#181124] p-6 shadow-2xl">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#7C3AED]/20 blur-3xl" />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-[#F1F0FF]">Consultor Finly AI</h3>
            <p className="text-xs text-[#A09DC0]">Análise inteligente do seu mês</p>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : insight ? (
          <div className="rounded-xl bg-white/5 p-4 text-sm leading-relaxed text-[#F1F0FF]">
            {insight}
          </div>
        ) : (
          <p className="text-sm text-[#8B88A0]">
            Descubra padrões nos seus gastos e receba dicas personalizadas para economizar mais neste mês.
          </p>
        )}

        {!insight && !error && (
          <button
            onClick={() => generateInsight(categoryNameMap)}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 font-semibold text-[#F1F0FF] transition-colors hover:bg-white/10 disabled:opacity-50 sm:w-auto sm:px-6"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analisando dados...
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-[#EC4899]" />
                Gerar Insight
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
