import { GoogleGenAI } from "@google/genai";
import { Category } from "@/types";

export async function categorizeTransactionsWithAI(
  transactions: { id: string; description: string; type: "income" | "expense" }[],
  categories: Category[],
  apiKey: string
): Promise<Record<string, string>> {
  const ai = new GoogleGenAI({ apiKey });

  const categoriesContext = categories.map(c => `ID: ${c.id} | Nome: ${c.name} | Tipo: ${c.type}`).join("\n");
  const transactionsContext = transactions.map(t => `ID: ${t.id} | Descrição: ${t.description} | Tipo: ${t.type}`).join("\n");

  const prompt = `Você é um assistente financeiro. Mapeie cada transação abaixo para a categoria mais adequada dentre as categorias disponíveis.
Regras:
1. Responda APENAS com um objeto JSON válido, sem markdown, onde as chaves são os IDs das transações e os valores são os IDs das categorias escolhidas. Exemplo: {"t1": "cat1", "t2": "cat2"}.
2. Se nenhuma categoria for adequada, omita a transação do JSON.
3. Respeite o 'Tipo' (income/expense): uma transação 'income' só pode ir para uma categoria 'income'.

Categorias Disponíveis:
${categoriesContext}

Transações:
${transactionsContext}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
    const jsonStr = response.text || "{}";
    const mapped = JSON.parse(jsonStr.trim().replace(/^```json|```$/g, ""));
    return mapped as Record<string, string>;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return {};
  }
}
