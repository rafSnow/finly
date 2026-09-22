import { db } from "@/lib/firebase";
import { Account } from "@/types";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { getAccounts, getAccountBalance } from "./accounts";

export interface WealthHistory {
  month: string;
  totalAssets: number; // total checking + investment
  investmentAssets: number;
}

export async function getWealthTracking(familyId: string): Promise<{
  currentWealth: number;
  currentInvestments: number;
  history: WealthHistory[];
  accounts: (Account & { balance: number })[];
}> {
  // 1. Get all accounts and their current balances
  const accountsList = await getAccounts(familyId);
  const accountsWithBalance = await Promise.all(
    accountsList.map(async (acc) => ({
      ...acc,
      balance: await getAccountBalance(familyId, acc.id),
    }))
  );

  let currentWealth = 0;
  let currentInvestments = 0;
  for (const acc of accountsWithBalance) {
    if (acc.accountType === "investment") {
      currentInvestments += acc.balance;
      currentWealth += acc.balance;
    } else if (acc.accountType === "checking" || !acc.accountType) {
      currentWealth += acc.balance;
    }
  }

  // 2. To build a 6-month history, we need entries from the last 5 months
  // We walk backwards from current balances.
  const history: WealthHistory[] = [];
  const now = new Date();
  
  // Create an array of the last 6 months (including current)
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  months.reverse(); // oldest first [M-5, M-4, M-3, M-2, M-1, M0]

  const sixMonthsAgo = new Date(months[0].year, months[0].month - 1, 1);

  // Fetch all entries from 6 months ago until now
  const entriesQuery = query(
    collection(db, "families", familyId, "entries"),
    where("date", ">=", Timestamp.fromDate(sixMonthsAgo)),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(entriesQuery);
  const recentEntries = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      type: data.type,
      value: Number(data.value),
      accountId: data.accountId,
      destinationAccountId: data.destinationAccountId,
      date: data.date.toDate(),
    };
  });

  // 3. Walk backwards to calculate historical balances
  // We know the balance AT THE END of M0 (which is right now, currentWealth).
  // The balance at the end of M-1 = Balance at end of M0 - (Net flow during M0)
  
  let runningWealth = currentWealth;
  let runningInvestments = currentInvestments;

  // We will store the balances at the end of each month.
  // Because we are walking backwards from the present, we process months from M0 down to M-5.
  
  // We need to group entries by month/year to know the net flow.
  const netFlowByMonth = new Map<string, { totalFlow: number, investmentFlow: number }>();
  
  recentEntries.forEach(entry => {
    const d = entry.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (!netFlowByMonth.has(key)) {
      netFlowByMonth.set(key, { totalFlow: 0, investmentFlow: 0 });
    }
    const flow = netFlowByMonth.get(key)!;

    // Check if account is investment or checking
    const sourceAcc = accountsWithBalance.find(a => a.id === entry.accountId);
    const destAcc = accountsWithBalance.find(a => a.id === entry.destinationAccountId);

    if (entry.type === "income") {
      if (sourceAcc?.accountType !== "credit") {
        flow.totalFlow += entry.value;
        if (sourceAcc?.accountType === "investment") flow.investmentFlow += entry.value;
      }
    } else if (entry.type === "expense") {
       if (sourceAcc?.accountType !== "credit") {
        flow.totalFlow -= entry.value;
        if (sourceAcc?.accountType === "investment") flow.investmentFlow -= entry.value;
       }
    } else if (entry.type === "transfer") {
      // Transfer inside wealth (checking <-> investment) doesn't change totalWealth!
      // But it might change investmentFlow.
      if (sourceAcc?.accountType === "investment" && destAcc?.accountType !== "investment") {
         flow.investmentFlow -= entry.value;
      }
      if (destAcc?.accountType === "investment" && sourceAcc?.accountType !== "investment") {
         flow.investmentFlow += entry.value;
      }
      
      // If transferring to a credit card (paying bill), it reduces total wealth
      if (destAcc?.accountType === "credit") {
         flow.totalFlow -= entry.value;
         if (sourceAcc?.accountType === "investment") flow.investmentFlow -= entry.value;
      }
    }
  });

  const reversedMonths = [...months].reverse(); // [M0, M-1, M-2, ...]

  const historyResults: WealthHistory[] = [];

  for (const m of reversedMonths) {
    const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
    
    // The running variables represent the balance at the END of this month.
    historyResults.push({
      month: `${String(m.month).padStart(2, '0')}/${String(m.year).slice(-2)}`,
      totalAssets: runningWealth,
      investmentAssets: runningInvestments,
    });

    // To get the balance at the end of the PREVIOUS month, we subtract this month's net flow.
    const flow = netFlowByMonth.get(key) || { totalFlow: 0, investmentFlow: 0 };
    runningWealth -= flow.totalFlow;
    runningInvestments -= flow.investmentFlow;
  }

  // Reverse back so it's chronological (oldest to newest)
  historyResults.reverse();

  return {
    currentWealth,
    currentInvestments,
    history: historyResults,
    accounts: accountsWithBalance,
  };
}
