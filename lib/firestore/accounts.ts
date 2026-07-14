import { db } from "@/lib/firebase";
import { Account } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getAggregateFromServer,
  sum,
} from "firebase/firestore";

export async function getAccounts(familyId: string): Promise<Account[]> {
  try {
    const q = query(
      collection(db, "families", familyId, "accounts"),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        familyId,
        name: data.name as string,
        accountType: data.accountType as "checking" | "credit" | undefined,
        closingDay: typeof data.closingDay === "number" ? data.closingDay : undefined,
        dueDay: typeof data.dueDay === "number" ? data.dueDay : undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    throw error;
  }
}

export async function createAccount(
  familyId: string,
  name: string,
  accountType: "checking" | "credit" = "checking",
  closingDay?: number,
  dueDay?: number
): Promise<Account> {
  try {
    const docRef = await addDoc(collection(db, "families", familyId, "accounts"), {
      familyId,
      name,
      accountType,
      closingDay: closingDay ?? null,
      dueDay: dueDay ?? null,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      familyId,
      name,
      accountType,
      closingDay,
      dueDay,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    throw error;
  }
}

export async function updateAccount(
  familyId: string,
  accountId: string,
  data: Partial<Account>
): Promise<void> {
  try {
    const payload: Partial<Account> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.accountType !== undefined) payload.accountType = data.accountType;
    if (data.closingDay !== undefined) payload.closingDay = data.closingDay;
    if (data.dueDay !== undefined) payload.dueDay = data.dueDay;

    if (Object.keys(payload).length > 0) {
      await updateDoc(doc(db, "families", familyId, "accounts", accountId), payload);
    }
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    throw error;
  }
}

export async function deleteAccount(
  familyId: string,
  accountId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, "families", familyId, "accounts", accountId));
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    throw error;
  }
}

export async function getAccountBalance(
  familyId: string,
  accountId: string
): Promise<number> {
  try {
    const incomesQuery = query(
      collection(db, "families", familyId, "entries"),
      where("accountId", "==", accountId),
      where("type", "==", "income")
    );
    const expensesQuery = query(
      collection(db, "families", familyId, "entries"),
      where("accountId", "==", accountId),
      where("type", "==", "expense")
    );

    const [incomesSnap, expensesSnap] = await Promise.all([
      getAggregateFromServer(incomesQuery, { total: sum("value") }),
      getAggregateFromServer(expensesQuery, { total: sum("value") }),
    ]);

    return (incomesSnap.data().total || 0) - (expensesSnap.data().total || 0);
  } catch (error) {
    console.error("Erro ao buscar saldo da conta:", error);
    return 0; // fallback seguro para não quebrar a UI se as permissões falharem por falta de index
  }
}

