import Papa from "papaparse";
import { Category } from "@/types";

export interface DraftEntry {
  id: string;
  date: string;
  description: string;
  value: number;
  type: "income" | "expense";
  categoryId?: string;
  selected: boolean;
}

export function parseOFX(text: string): DraftEntry[] {
  const transactions: DraftEntry[] = [];
  
  const regexTrn = /<STMTTRN>[\s\S]*?<\/STMTTRN>/g;
  let match;

  while ((match = regexTrn.exec(text)) !== null) {
    const block = match[0];
    
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
    const amtMatch = block.match(/<TRNAMT>([\-\d\.]+)/);
    const memoMatch = block.match(/<MEMO>(.*)/);
    
    if (dateMatch && amtMatch && memoMatch) {
      const rawDate = dateMatch[1]; 
      const date = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
      
      const valStr = amtMatch[1];
      const rawValue = parseFloat(valStr);
      
      let description = memoMatch[1].trim();
      description = description.replace(/<\/MEMO>|<FITID>|<TRNTYPE>|<NAME>.*/g, '').trim();

      const type = rawValue < 0 ? "expense" : "income";
      const value = Math.abs(rawValue);

      transactions.push({
        id: Math.random().toString(36).substring(7),
        date,
        description,
        value,
        type,
        selected: true,
      });
    }
  }

  return transactions;
}

export function parseCSV(text: string): Promise<DraftEntry[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: DraftEntry[] = [];
        
        results.data.forEach((row: any) => {
          const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('data') || k.toLowerCase().includes('date'));
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc') || k.toLowerCase().includes('hist') || k.toLowerCase().includes('memo'));
          const valKey = Object.keys(row).find(k => k.toLowerCase().includes('valor') || k.toLowerCase().includes('amount'));

          if (dateKey && descKey && valKey) {
            let dateStr = row[dateKey];
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                 dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }

            let valStr = String(row[valKey]).replace(',', '.');
            const rawValue = parseFloat(valStr);
            if (isNaN(rawValue)) return;

            const type = rawValue < 0 ? "expense" : "income";
            const value = Math.abs(rawValue);

            transactions.push({
              id: Math.random().toString(36).substring(7),
              date: dateStr,
              description: row[descKey],
              value,
              type,
              selected: true,
            });
          }
        });

        resolve(transactions);
      },
      error: (err: any) => reject(err),
    });
  });
}

export function guessCategory(description: string, categories: Category[]): string | undefined {
  const descLower = description.toLowerCase();
  
  let match = categories.find(c => descLower.includes(c.name.toLowerCase()));
  if (match) return match.id;

  const keywords: Record<string, string[]> = {
    'Alimentação': ['ifood', 'z\u00e9 delivery', 'supermercado', 'restaurante', 'padaria', 'mcdonalds', 'burger king', 'assai', 'carrefour', 'pao de acucar'],
    'Transporte': ['uber', '99', 'posto', 'gasolina', 'ipiranga', 'shell'],
    'Lazer': ['cinema', 'spotify', 'netflix', 'ingressos', 'xbox', 'playstation', 'steam'],
    'Saúde': ['farmacia', 'drogasil', 'droga raia', 'hospital', 'consulta'],
    'Moradia': ['energia', 'enel', 'light', 'agua', 'sabesp', 'condominio', 'aluguel'],
    'Serviços': ['vivo', 'claro', 'tim', 'internet', 'tv'],
  };

  for (const [catName, words] of Object.entries(keywords)) {
    if (words.some(w => descLower.includes(w))) {
      const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (cat) return cat.id;
    }
  }

  return undefined;
}
