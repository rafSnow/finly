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
    console.log("📖 [dashboard] Buscando membros da família:", familyId);
    const familySnapshot = await getDoc(doc(db, "families", familyId));
    console.log("✅ [dashboard] Family snapshot recebido", { familyId, exists: familySnapshot.exists() });
    
    if (!familySnapshot.exists()) {
      console.log("⚠️ [dashboard] Family não existe", familyId);
      return [];
    }

    const familyData = familySnapshot.data() as { memberIds?: string[] };
    const memberIds = familyData.memberIds ?? [];
    console.log("📊 [dashboard] IDs de membros encontrados:", { familyId, memberCount: memberIds.length, memberIds });
    
    if (memberIds.length === 0) {
      return [];
    }

    console.log("📖 [dashboard] Buscando perfis dos membros...");
    const userDocs = await Promise.all(
      memberIds.map((uid) => {
        console.log("  📖 Buscando usuário:", uid);
        return getDoc(doc(db, "users", uid));
      }),
    );
    console.log("✅ [dashboard] Perfis dos membros recebidos");

    return userDocs.map((userDoc, index) => {
      const fallbackName = `Usuário ${index + 1}`;
      if (!userDoc.exists()) {
        console.log(`  ⚠️ Usuário ${memberIds[index]} não existe`);
        return { uid: memberIds[index], name: fallbackName };
      }
      const data = userDoc.data() as { name?: string };
      const name = data.name ?? fallbackName;
      console.log(`  ✅ Usuário ${memberIds[index]}: ${name}`);
      return {
        uid: memberIds[index],
        name
      };
    });
  } catch (error) {
    console.error("❌ [dashboard] Erro ao buscar perfis dos membros:", {
      error,
      familyId,
      message: error instanceof Error ? error.message : "Unknown"
    });
    throw error;
  }
}

export async function getSummary(
  familyId: string,
  filters: PeriodFilter,
): Promise<DashboardSummary> {
  try {
    const entries = await getPeriodEntries(familyId, filters);

    const totalIncome = entries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.value, 0);

    const totalExpense = entries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.value, 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  } catch (error) {
    console.error("Erro ao buscar resumo do dashboard:", error);
    throw error;
  }
}

export async function getEntriesByCategory(
  familyId: string,
  filters: PeriodFilter,
): Promise<CategoryBreakdown[]> {
  try {
    const [entries, categoriesMap] = await Promise.all([
      getPeriodEntries(familyId, filters),
      getCategoriesMap(familyId),
    ]);

    const expenseEntries = entries.filter((entry) => entry.type === "expense");
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
  } catch (error) {
    console.error("Erro ao buscar despesas por categoria:", error);
    throw error;
  }
}

export async function getPartnerSummaries(
  familyId: string,
  filters: PeriodFilter,
): Promise<PartnerSummary[]> {
  try {
    console.log("📊 [dashboard] Iniciando busca de resumo dos parceiros", { familyId });
    
    const [entries, memberProfiles] = await Promise.all([
      getPeriodEntries(familyId, filters),
      getFamilyMemberProfiles(familyId),
    ]);

    console.log("✅ [dashboard] Dados carregados", { 
      entryCount: entries.length, 
      memberCount: memberProfiles.length 
    });

    if (memberProfiles.length === 0) {
      console.log("⚠️ [dashboard] Nenhum membro encontrado");
      return [];
    }

    const totalExpense = entries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.value, 0);

    console.log("📊 [dashboard] Despesa total:", totalExpense);

    const summaries = memberProfiles.map((member) => {
      const memberEntries = entries.filter((entry) => entry.ownerId === member.uid);
      const totalIncome = memberEntries
        .filter((entry) => entry.type === "income")
        .reduce((sum, entry) => sum + entry.value, 0);
      const memberExpense = memberEntries
        .filter((entry) => entry.type === "expense")
        .reduce((sum, entry) => sum + entry.value, 0);

      const summary = {
        uid: member.uid,
        name: member.name,
        totalIncome,
        totalExpense: memberExpense,
        expenseContribution:
          totalExpense > 0 ? (memberExpense / totalExpense) * 100 : 0,
      };
      
      console.log(`  📊 ${member.name}:`, summary);
      return summary;
    });
    
    console.log("✅ [dashboard] Resumo dos parceiros concluído");
    return summaries;
  } catch (error) {
    console.error("❌ [dashboard] Erro ao buscar resumo individual dos parceiros:", {
      error,
      familyId,
      message: error instanceof Error ? error.message : "Unknown"
    });
    throw error;
  }
}
