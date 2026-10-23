import Papa from "papaparse";
import { Category } from "@/types";

export interface DraftEntry {
  id: string;
  date: string;
  description: string;
  value: number;
  type: "income" | "expense";
  categoryId?: string;
  isShared: boolean;
  selected: boolean;
}

/**
 * Converte strings monetárias brasileiras ("R$ -1.234,56", "-1234,56") ou internacionais ("-1234.56")
 * em número de ponto flutuante.
 */
export function parseFlexibleAmount(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const cleaned = String(raw)
    .replace(/[R$\s]/gi, "")
    .trim();
  if (!cleaned) return NaN;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Formato BR: 1.234,56 -> 1234.56
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }
  if (lastDot > lastComma && lastComma !== -1) {
    // Formato US com separador de milhar: 1,234.56 -> 1234.56
    return parseFloat(cleaned.replace(/,/g, ""));
  }
  return parseFloat(cleaned.replace(",", "."));
}

/**
 * Converte datas DD/MM/YYYY, DD-MM-YYYY ou YYYY-MM-DD para YYYY-MM-DD.
 */
export function normalizeDateString(raw: string): string {
  const trimmed = String(raw).trim().split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const slashParts = trimmed.split(/[\/\-]/);
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      return `${slashParts[0]}-${slashParts[1].padStart(2, "0")}-${slashParts[2].padStart(2, "0")}`;
    }
    const year = slashParts[2].length === 2 ? `20${slashParts[2]}` : slashParts[2];
    return `${year}-${slashParts[1].padStart(2, "0")}-${slashParts[0].padStart(2, "0")}`;
  }
  return trimmed;
}

export function parseOFX(text: string): DraftEntry[] {
  const transactions: DraftEntry[] = [];

  // Suporta OFX XML (<STMTTRN>...</STMTTRN>) e OFX SGML v1 (sem tag de fechamento)
  const blocks = text.split(/<STMTTRN>/i).slice(1);

  for (const rawBlock of blocks) {
    const block = rawBlock.split(/<\/STMTTRN>/i)[0];

    const dateMatch = block.match(/<DTPOSTED>\s*(\d{8})/i);
    const amtMatch = block.match(/<TRNAMT>\s*([\-+\d.,]+)/i);
    const memoMatch = block.match(/<MEMO>\s*([^\r\n<]+)/i);
    const nameMatch = block.match(/<NAME>\s*([^\r\n<]+)/i);

    if (dateMatch && amtMatch) {
      const rawDate = dateMatch[1];
      const date = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;

      const rawValue = parseFlexibleAmount(amtMatch[1]);
      if (isNaN(rawValue) || rawValue === 0) continue;

      const rawDesc = (memoMatch?.[1] || nameMatch?.[1] || "Transação OFX").trim();
      const description = rawDesc.replace(/<\/?(MEMO|NAME|FITID|TRNTYPE)>/gi, "").trim();

      const type = rawValue < 0 ? "expense" : "income";
      const value = Math.round(Math.abs(rawValue) * 100) / 100;

      transactions.push({
        id: Math.random().toString(36).substring(2, 9),
        date,
        description,
        value,
        type,
        isShared: true,
        selected: true,
      });
    }
  }

  return transactions;
}

export function parseCSV(
  text: string,
  options?: { isCreditCard?: boolean }
): Promise<DraftEntry[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: DraftEntry[] = [];
        const isCreditCard = options?.isCreditCard ?? false;

        results.data.forEach((row: unknown) => {
          if (!row || typeof row !== "object") return;
          const typedRow = row as Record<string, string | number>;
          const keys = Object.keys(typedRow);

          const dateKey = keys.find((k) =>
            /data|date|dt|vencimento|lancamento/i.test(k)
          );
          const descKey = keys.find((k) =>
            /desc|hist|memo|title|titulo|estabelecimento|nome|favorecido/i.test(k)
          );
          const valKey = keys.find((k) =>
            /valor|amount|value|total|quantia/i.test(k)
          );

          if (dateKey && descKey && valKey) {
            const dateStr = normalizeDateString(String(typedRow[dateKey]));
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

            const rawValue = parseFlexibleAmount(typedRow[valKey]);
            if (isNaN(rawValue) || rawValue === 0) return;

            const description = String(typedRow[descKey] ?? "").trim();
            if (!description) return;

            // Em CSVs de fatura de cartão (ex: Nubank date,title,amount), valores positivos são compras (expense)
            // e pagamentos recebidos na fatura costumam conter "pagamento recebido" ou valor negativo.
            let type: "income" | "expense";
            if (isCreditCard) {
              const isPaymentRow = /pagamento recebido|pagamento de fatura/i.test(description);
              if (isPaymentRow) return; // Ignora pagamento da própria fatura para não duplicar
              type = rawValue > 0 ? "expense" : "income";
            } else {
              type = rawValue < 0 ? "expense" : "income";
            }

            const value = Math.round(Math.abs(rawValue) * 100) / 100;

            transactions.push({
              id: Math.random().toString(36).substring(2, 9),
              date: dateStr,
              description,
              value,
              type,
              isShared: true,
              selected: true,
            });
          }
        });

        resolve(transactions);
      },
      error: (err: Error) => reject(err),
    });
  });
}

/**
 * Normaliza a descrição de um estabelecimento para criar uma chave de aprendizado estável.
 * Ex: "UBER *UBER *TRIP 12/05" -> "uber trip"
 */
export function normalizeMerchantKey(description: string): string {
  return description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(compra cartao|pix enviado|pix recebido|deb aut|pag\*|mp\*|parcela\s*\d+\/\d+)\b/g, " ")
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

const RULES_STORAGE_PREFIX = "finly_cat_rules_";

export function getLearnedCategoryRules(familyId?: string): Record<string, string> {
  if (typeof window === "undefined" || !familyId) return {};
  try {
    const raw = localStorage.getItem(`${RULES_STORAGE_PREFIX}${familyId}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveLearnedCategoryRules(
  familyId: string | undefined,
  entries: Array<{ description: string; categoryId?: string }>
): void {
  if (typeof window === "undefined" || !familyId) return;
  try {
    const current = getLearnedCategoryRules(familyId);
    for (const item of entries) {
      if (!item.categoryId) continue;
      const key = normalizeMerchantKey(item.description);
      if (key.length >= 3) {
        current[key] = item.categoryId;
      }
    }
    localStorage.setItem(`${RULES_STORAGE_PREFIX}${familyId}`, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

export function guessCategory(
  description: string,
  categories: Category[],
  familyId?: string
): string | undefined {
  const descLower = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Verifica regras aprendidas em importações anteriores da família
  const learnedRules = getLearnedCategoryRules(familyId);
  const merchantKey = normalizeMerchantKey(description);
  if (merchantKey && learnedRules[merchantKey]) {
    const exists = categories.some((c) => c.id === learnedRules[merchantKey]);
    if (exists) return learnedRules[merchantKey];
  }

  // 2. Match direto pelo nome da categoria
  const directMatch = categories.find((c) => {
    const catNorm = c.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return descLower.includes(catNorm);
  });
  if (directMatch) return directMatch.id;

  // 3. Dicionário inteligente de estabelecimentos brasileiros
  const keywords: Record<string, string[]> = {
    Alimentacao: [
      "ifood",
      "ze delivery",
      "rappi",
      "supermercado",
      "mercado",
      "atacadao",
      "restaurante",
      "padaria",
      "panificadora",
      "lanchonete",
      "mcdonalds",
      "mc donalds",
      "burger king",
      "outback",
      "assai",
      "carrefour",
      "pao de acucar",
      "extra",
      "hortifruti",
      "acougue",
      "cafe",
      "starbucks",
    ],
    Transporte: [
      "uber",
      "99app",
      "99 pop",
      "99*",
      "posto",
      "gasolina",
      "combustivel",
      "ipiranga",
      "shell",
      "petrobras",
      "sem parar",
      "veloe",
      "conectcar",
      "estacionamento",
      "pedagio",
      "metro",
      "bilhete unico",
    ],
    Lazer: [
      "cinema",
      "cinemark",
      "ingresso",
      "spotify",
      "netflix",
      "disney",
      "prime video",
      "hbo",
      "max",
      "youtube",
      "xbox",
      "playstation",
      "steam",
      "nintendo",
      "bar",
      "show",
      "hotel",
      "airbnb",
      "booking",
    ],
    Saude: [
      "farmacia",
      "drogaria",
      "drogasil",
      "droga raia",
      "pacheco",
      "pague menos",
      "panvel",
      "hospital",
      "clinica",
      "laboratorio",
      "consulta",
      "unimed",
      "amil",
      "bradesco saude",
      "sulamerica",
      "smartfit",
      "academia",
      "gympass",
      "wellhub",
    ],
    Moradia: [
      "energia",
      "enel",
      "light",
      "cpfl",
      "cemig",
      "copel",
      "celpe",
      "agua",
      "sabesp",
      "copasa",
      "cedae",
      "condominio",
      "aluguel",
      "iptu",
      "gas",
      "comgas",
      "vivo",
      "claro",
      "tim",
      "oi",
      "internet",
    ],
    Educacao: [
      "escola",
      "faculdade",
      "universidade",
      "curso",
      "alura",
      "udemy",
      "rocketseat",
      "livraria",
      "amazon",
      "saraiva",
      "mensalidade",
    ],
    Salario: [
      "salario",
      "remuneracao",
      "pagamento folha",
      "pro-labore",
      "adiantamento salarial",
      "dividendos",
      "rendimento",
    ],
  };

  for (const [catKey, words] of Object.entries(keywords)) {
    if (words.some((w) => descLower.includes(w))) {
      const cat = categories.find((c) => {
        const cNorm = c.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return cNorm === catKey.toLowerCase();
      });
      if (cat) return cat.id;
    }
  }

  return undefined;
}
