import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export interface MonthlyReport {
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export async function getYearlyReport(familyId: string, year: number): Promise<MonthlyReport[]> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const q = query(
    collection(db, "families", familyId, "entries"),
    where("date", ">=", startOfYear),
    where("date", "<=", endOfYear)
  );

  const snapshot = await getDocs(q);
  
  const monthlyData: MonthlyReport[] = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    income: 0,
    expense: 0,
    balance: 0,
  }));

  snapshot.forEach((doc) => {
    const data = doc.data();
    const entryDate = data.date.toDate();
    const monthIndex = entryDate.getMonth();
    
    // Ignorar gastos no crédito puro, pois eles viram "Fatura" e debitam o saldo na conta corrente.
    if (data.isCredit) return;

    if (data.type === "income") {
      monthlyData[monthIndex].income += data.value;
      monthlyData[monthIndex].balance += data.value;
    } else if (data.type === "expense") {
      monthlyData[monthIndex].expense += data.value;
      monthlyData[monthIndex].balance -= data.value;
    }
  });

  return monthlyData;
}
