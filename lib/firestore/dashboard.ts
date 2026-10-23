import { db } from "@/lib/firebase";
import {
  Category,
  CategoryBreakdown,
  DashboardSummary,
  Entry,
  PartnerSummary,
  PeriodFilter,
} from "@/types";
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function periodRange(period: PeriodFilter): { start: Date; end: Date } {
  const start = new Date(period.year, period.month - 1, 1, 0, 0, 0, 0);
  const end = new Date(period.year, period.month, 1, 0, 0, 0, 0);
  return { start, end };
}

function mapEntry(data: Record<string, unknown>): Entry {
  return {
    id: "",
    familyId: (data.familyId as string) ?? "",
    type: ((data.type as Entry["type"]) ?? "expense"),
    value: Number(data.value ?? 0),
    categoryId: (data.categoryId as string) ?? "",
    date: new Date(),
    description: (data.description as string | undefined) ?? undefined,
    ownerId: (data.ownerId as string) ?? "",
    recurrenceId: (data.recurrenceId as string | undefined) ?? undefined,
    recurrenceIndex:
      typeof data.recurrenceIndex === "number"
        ? data.recurrenceIndex
        : undefined,
    isRecurring: Boolean(data.isRecurring),
    isCredit: Boolean(data.isCredit),
    isTransfer: Boolean(data.isTransfer),
    transferId: (data.transferId as string | undefined) ?? undefined,
    destinationAccountId: (data.destinationAccountId as string | undefined) ?? undefined,
    isPaid: data.isPaid === undefined ? true : Boolean(data.isPaid),
    isShared: data.isShared === undefined ? true : Boolean(data.isShared),
    createdAt: new Date(),
  };
}

async function getPeriodEntries(
  familyId: string,
  period: PeriodFilter,
): Promise<Entry[]> {
  const { start, end } = periodRange(period);

  const entriesQuery = query(
    collection(db, "families", familyId, "entries"),
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<", Timestamp.fromDate(end)),
  );

  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs.map((entryDoc) => {
    const entry = mapEntry(entryDoc.data());
    entry.id = entryDoc.id;
    return entry;
  });
}

async function getCategoriesMap(
  familyId: string,
): Promise<Map<string, Category>> {
  const categoriesSnapshot = await getDocs(
    collection(db, "families", familyId, "categories"),
  );

  return new Map(
    categoriesSnapshot.docs.map((categoryDoc) => [
      categoryDoc.id,
      {
        id: categoryDoc.id,
        familyId,
        name: String(categoryDoc.data().name ?? "Categoria"),
        type: ((categoryDoc.data().type as Category["type"]) ?? "both"),
        createdAt: new Date(),
        isDefault: Boolean(categoryDoc.data().isDefault),
      },
    ]),
  );
}

async function getFamilyMemberProfiles(
  familyId: string,
): Promise<Array<{ uid: string; name: string }>> {
  try {
    const familySnapshot = await getDoc(doc(db, "families", familyId));
    if (!familySnapshot.exists()) {
      return [];
    }

    const familyData = familySnapshot.data() as { memberIds?: string[] };
    const memberIds = familyData.memberIds ?? [];
    if (memberIds.length === 0) {
      return [];
    }

    const userDocs = await Promise.all(
      memberIds.map((uid) => getDoc(doc(db, "users", uid))),
    );

    return userDocs.map((userDoc, index) => {
      const fallbackName = `Usuário ${index + 1}`;
      if (!userDoc.exists()) {
        return { uid: memberIds[index], name: fallbackName };
      }
      const data = userDoc.data() as { name?: string };
      return {
        uid: memberIds[index],
        name: data.name ?? fallbackName,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar perfis dos membros:", error);
    throw error;
  }
}

export function computeSummaryFromEntries(entries: Entry[]): DashboardSummary {
  const incomes = entries.filter(
    (entry) => entry.type === "income" && !entry.isTransfer,
  );
  const expenses = entries.filter(
    (entry) => entry.type === "expense" && !entry.isTransfer,
  );

  const totalIncome = incomes.reduce((sum, entry) => sum + entry.value, 0);
  const totalExpense = expenses.reduce((sum, entry) => sum + entry.value, 0);

  const paidIncome = incomes
    .filter((entry) => entry.isPaid !== false)
    .reduce((sum, entry) => sum + entry.value, 0);
  const pendingIncome = incomes
    .filter((entry) => entry.isPaid === false)
    .reduce((sum, entry) => sum + entry.value, 0);

  const paidExpense = expenses
    .filter((entry) => entry.isPaid !== false)
    .reduce((sum, entry) => sum + entry.value, 0);
  const pendingExpense = expenses
    .filter((entry) => entry.isPaid === false)
    .reduce((sum, entry) => sum + entry.value, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    paidIncome,
    paidExpense,
    pendingIncome,
    pendingExpense,
    realizedBalance: paidIncome - paidExpense,
  };
}

function computeCategoryBreakdownFromEntries(
  entries: Entry[],
  categoriesMap: Map<string, Category>,
): CategoryBreakdown[] {
  const expenseEntries = entries.filter(
    (entry) => entry.type === "expense" && !entry.isTransfer,
  );
  const totalExpense = expenseEntries.reduce((sum, entry) => sum + entry.value, 0);

  if (totalExpense <= 0) {
    return [];
  }

  const grouped = expenseEntries.reduce<Map<string, number>>((acc, entry) => {
    const current = acc.get(entry.categoryId) ?? 0;
    acc.set(entry.categoryId, current + entry.value);
    return acc;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([categoryId, total]) => {
      const category = categoriesMap.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? "Sem categoria",
        total,
        percentage: (total / totalExpense) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function computePartnerSummariesFromEntries(
  entries: Entry[],
  memberProfiles: Array<{ uid: string; name: string }>,
): PartnerSummary[] {
  if (memberProfiles.length === 0) {
    return [];
  }

  const totalCoupleExpense = entries
    .filter((entry) => entry.type === "expense" && !entry.isTransfer)
    .reduce((sum, entry) => sum + entry.value, 0);

  const totalCoupleIncome = entries
    .filter((entry) => entry.type === "income" && !entry.isTransfer)
    .reduce((sum, entry) => sum + entry.value, 0);

  return memberProfiles.map((member) => {
    const memberEntries = entries.filter((entry) => entry.ownerId === member.uid);
    const totalIncome = memberEntries
      .filter((entry) => entry.type === "income" && !entry.isTransfer)
      .reduce((sum, entry) => sum + entry.value, 0);

    const memberExpenses = memberEntries.filter(
      (entry) => entry.type === "expense" && !entry.isTransfer,
    );
    const memberExpense = memberExpenses.reduce((sum, entry) => sum + entry.value, 0);

    const sharedExpensePaid = memberExpenses
      .filter((entry) => entry.isShared !== false)
      .reduce((sum, entry) => sum + entry.value, 0);

    const personalExpensePaid = memberExpenses
      .filter((entry) => entry.isShared === false)
      .reduce((sum, entry) => sum + entry.value, 0);

    return {
      uid: member.uid,
      name: member.name,
      totalIncome,
      totalExpense: memberExpense,
      expenseContribution:
        totalCoupleExpense > 0 ? (memberExpense / totalCoupleExpense) * 100 : 0,
      sharedExpensePaid,
      personalExpensePaid,
      incomeContribution:
        totalCoupleIncome > 0 ? (totalIncome / totalCoupleIncome) * 100 : 0,
    };
  });
}

export async function getDashboardData(
  familyId: string,
  filters: PeriodFilter,
): Promise<{
  summary: DashboardSummary;
  categoryBreakdown: CategoryBreakdown[];
  partnerSummaries: PartnerSummary[];
}> {
  const [entries, categoriesMap, memberProfiles] = await Promise.all([
    getPeriodEntries(familyId, filters),
    getCategoriesMap(familyId),
    getFamilyMemberProfiles(familyId),
  ]);

  return {
    summary: computeSummaryFromEntries(entries),
    categoryBreakdown: computeCategoryBreakdownFromEntries(entries, categoriesMap),
    partnerSummaries: computePartnerSummariesFromEntries(entries, memberProfiles),
  };
}

export async function getSummary(
  familyId: string,
  filters: PeriodFilter,
): Promise<DashboardSummary> {
  const entries = await getPeriodEntries(familyId, filters);
  return computeSummaryFromEntries(entries);
}

export async function getEntriesByCategory(
  familyId: string,
  filters: PeriodFilter,
): Promise<CategoryBreakdown[]> {
  const [entries, categoriesMap] = await Promise.all([
    getPeriodEntries(familyId, filters),
    getCategoriesMap(familyId),
  ]);
  return computeCategoryBreakdownFromEntries(entries, categoriesMap);
}

export async function getPartnerSummaries(
  familyId: string,
  filters: PeriodFilter,
): Promise<PartnerSummary[]> {
  const [entries, memberProfiles] = await Promise.all([
    getPeriodEntries(familyId, filters),
    getFamilyMemberProfiles(familyId),
  ]);
  return computePartnerSummariesFromEntries(entries, memberProfiles);
}
