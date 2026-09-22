"use client";

import { useDashboard } from "./useDashboard";
import { useGoals } from "./useGoals";
import { useAuth } from "./useAuth";
import { useState } from "react";
import { GoogleGenAI } from "@google/genai";

export function useInsights() {
  const { family } = useAuth();
  const now = new Date();
  
  const { summary, categoryBreakdown } = useDashboard({ month: now.getMonth() + 1, year: now.getFullYear() });
  const { goals } = useGoals();
  
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async (categoryNameMap: Map<string, string>) => {
    if (!family) return;
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      // Formata breakdowns com nomes
      const formattedBreakdown = categoryBreakdown.map((cb) => ({
        categoryName: categoryNameMap.get(cb.categoryId) || "Categoria",
        total: cb.total,
      }));

      // Formata metas 
      const goalsProgress = goals.map((goal) => {
        const spent = categoryBreakdown.find((cb) => cb.categoryId === goal.categoryId)?.total || 0;
        return {
          categoryName: categoryNameMap.get(goal.categoryId) || "Categoria",
          spent,
          goalLimit: goal.limit,
          progress: goal.limit > 0 ? (spent / goal.limit) * 100 : 0
        };
      });

      const prompt = `
        Você é o "Assistente Finly", um consultor financeiro inteligente, direto e muito amigável.
        Seu tom é motivador e humano, usando emojis moderadamente. Responda em português (BR).
        Sua tarefa é analisar o cenário financeiro atual do mês do usuário e fornecer 1 ou 2 parágrafos curtos de insight. Não use tabelas ou listas gigantescas, apenas dicas pontuais e observações sábias de leitura rápida.

        DADOS DO MÊS ATUAL:
        - Total de Receitas: R$ ${summary.totalIncome}
        - Total de Despesas: R$ ${summary.totalExpense}
        - Saldo Restante: R$ ${summary.balance}

        DESPESAS POR CATEGORIA:
        ${formattedBreakdown.map((c: { categoryName: string, total: number }) => `- ${c.categoryName}: R$ ${c.total}`).join("\n")}

        STATUS DAS METAS ESTABELECIDAS:
        ${goalsProgress.length > 0 
          ? goalsProgress.map((g: { categoryName: string, spent: number, goalLimit: number, progress: number }) => `- ${g.categoryName}: Gasto R$ ${g.spent} (Meta: R$ ${g.goalLimit}) - ${g.progress.toFixed(0)}% utilizado.`).join("\n")
          : "O usuário não definiu metas mensais ainda."
        }

        Baseado nos dados acima, crie um insight inteligente. Seja conciso (máx. 150 palavras).
      `;

      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("A chave da API do Gemini não está configurada.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

      if (response.text) {
        setInsight(response.text);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Erro de conexão com o Assistente.");
      } else {
        setError("Erro de conexão com o Assistente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    insight,
    loading,
    error,
    generateInsight,
  };
}
