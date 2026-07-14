import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "A chave da API do Gemini (GEMINI_API_KEY) não está configurada no .env.local." },
        { status: 500 }
      );
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const { summary, categoryBreakdown, goalsProgress } = body;

    const prompt = `
      Você é o "Assistente Finly", um consultor financeiro inteligente, direto e muito amigável.
      Seu tom é motivador e humano, usando emojis moderadamente. Responda em português (BR).
      Sua tarefa é analisar o cenário financeiro atual do mês do usuário e fornecer 1 ou 2 parágrafos curtos de insight. Não use tabelas ou listas gigantescas, apenas dicas pontuais e observações sábias de leitura rápida.

      DADOS DO MÊS ATUAL:
      - Total de Receitas: R$ ${summary.totalIncome}
      - Total de Despesas: R$ ${summary.totalExpense}
      - Saldo Restante: R$ ${summary.balance}

      DESPESAS POR CATEGORIA:
      ${categoryBreakdown.map((c: any) => `- ${c.categoryName}: R$ ${c.total}`).join("\n")}

      STATUS DAS METAS ESTABELECIDAS:
      ${goalsProgress.length > 0 
        ? goalsProgress.map((g: any) => `- ${g.categoryName}: Gasto R$ ${g.spent} (Meta: R$ ${g.goalLimit}) - ${g.progress.toFixed(0)}% utilizado.`).join("\n")
        : "O usuário não definiu metas mensais ainda."
      }

      Baseado nos dados acima, crie um insight inteligente. Seja conciso (máx. 150 palavras).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ insight: response.text });
  } catch (error: any) {
    console.error("Erro no Consultor IA:", error);
    return NextResponse.json(
      { error: "Desculpe, não consegui processar seus dados no momento." },
      { status: 500 }
    );
  }
}
