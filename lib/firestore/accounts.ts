import { db } from "@/lib/firebase";
import { Account } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
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
        accountType: data.accountType as "checking" | "credit" | "investment" | undefined,
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
  accountType: "checking" | "credit" | "investment" = "checking",
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
): Promise<{ success: boolean; reason?: "has_entries" }> {
  try {
    const entriesRef = collection(db, "families", familyId, "entries");
    const [sourceSnap, destSnap] = await Promise.all([
      getDocs(query(entriesRef, where("accountId", "==", accountId), limit(1))),
      getDocs(query(entriesRef, where("destinationAccountId", "==", accountId), limit(1))),
    ]);

    if (!sourceSnap.empty || !destSnap.empty) {
      return { success: false, reason: "has_entries" };
    }

    await deleteDoc(doc(db, "families", familyId, "accounts", accountId));
    return { success: true };
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
    const transferOutQuery = query(
      collection(db, "families", familyId, "entries"),
      where("accountId", "==", accountId),
      where("type", "==", "transfer")
    );
    const transferInQuery = query(
      collection(db, "families", familyId, "entries"),
      where("destinationAccountId", "==", accountId),
      where("type", "==", "transfer")
    );

    const [incomesSnap, expensesSnap, transferOutSnap, transferInSnap] = await Promise.all([
      getAggregateFromServer(incomesQuery, { total: sum("value") }),
      getAggregateFromServer(expensesQuery, { total: sum("value") }),
      getAggregateFromServer(transferOutQuery, { total: sum("value") }),
      getAggregateFromServer(transferInQuery, { total: sum("value") }),
    ]);

    const totalIn = (incomesSnap.data().total || 0) + (transferInSnap.data().total || 0);
    const totalOut = (expensesSnap.data().total || 0) + (transferOutSnap.data().total || 0);

    return totalIn - totalOut;
  } catch (error) {
    console.error("Erro ao buscar saldo da conta:", error);
    return 0;
  }
}
