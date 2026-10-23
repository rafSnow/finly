import { auth, db } from "@/lib/firebase";
import {
  CreateEntryInput,
  Entry,
  EntryFilters,
  RecurrenceInterval,
  RecurringScope,
} from "@/types";
import {
  Timestamp,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  addDoc,
} from "firebase/firestore";

function getCurrentUserUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Usuário não autenticado.");
  }
  return uid;
}

function mapTimestampDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date();
}

function mapEntryDoc(id: string, data: Record<string, unknown>): Entry {
  return {
    id,
    familyId: (data.familyId as string) ?? "",
    type: ((data.type as Entry["type"]) ?? "expense"),
    value: Number(data.value ?? 0),
    categoryId: (data.categoryId as string) ?? "",
    accountId: (data.accountId as string | undefined) ?? undefined,
    date: mapTimestampDate(data.date),
    description: (data.description as string | undefined) ?? undefined,
    ownerId: (data.ownerId as string) ?? "",
    recurrenceId: (data.recurrenceId as string | undefined) ?? undefined,
    recurrenceIndex:
      typeof data.recurrenceIndex === "number"
        ? data.recurrenceIndex
        : undefined,
    isRecurring: Boolean(data.isRecurring),
    isInstallment: Boolean(data.isInstallment),
    installmentCount:
      typeof data.installmentCount === "number"
        ? data.installmentCount
        : undefined,
    isCredit: Boolean(data.isCredit),
    isTransfer: Boolean(data.isTransfer),
    transferId: (data.transferId as string | undefined) ?? undefined,
    destinationAccountId: (data.destinationAccountId as string | undefined) ?? undefined,
    createdAt: mapTimestampDate(data.createdAt),
  };
}

function addInterval(base: Date, interval: RecurrenceInterval, n: number): Date {
  const date = new Date(base);
  if (interval === "weekly") {
    date.setDate(date.getDate() + 7 * n);
  }
  if (interval === "monthly") {
    date.setMonth(date.getMonth() + n);
  }
  if (interval === "yearly") {
    date.setFullYear(date.getFullYear() + n);
  }
  return date;
}

function sanitizePartialEntry(
  data: Partial<Entry>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  if (data.type) {
    sanitized.type = data.type;
    sanitized.isTransfer = data.type === "transfer";
    if (data.type !== "transfer") {
      sanitized.destinationAccountId = null;
    }
  }
  if (typeof data.value === "number") {
    sanitized.value = data.value;
  }
  if (data.categoryId !== undefined) {
    sanitized.categoryId = data.categoryId || null;
  }
  if (data.accountId !== undefined) {
    sanitized.accountId = data.accountId || null;
  }
  if (data.destinationAccountId !== undefined) {
    sanitized.destinationAccountId = data.destinationAccountId || null;
  }
  if (data.date instanceof Date) {
    sanitized.date = Timestamp.fromDate(data.date);
  }
  if (typeof data.description === "string") {
    sanitized.description = data.description;
  }
  if (typeof data.isRecurring === "boolean") {
    sanitized.isRecurring = data.isRecurring;
  }
  if (typeof data.recurrenceId === "string") {
    sanitized.recurrenceId = data.recurrenceId;
  }
  if (typeof data.recurrenceIndex === "number") {
    sanitized.recurrenceIndex = data.recurrenceIndex;
  }
  if (typeof data.isInstallment === "boolean") {
    sanitized.isInstallment = data.isInstallment;
  }
  if (typeof data.installmentCount === "number") {
    sanitized.installmentCount = data.installmentCount;
  }
  if (typeof data.isCredit === "boolean") {
    sanitized.isCredit = data.isCredit;
  }

  return sanitized;
}

export async function getEntries(
  familyId: string,
  filters: EntryFilters,
): Promise<Entry[]> {
  try {
    const startDate = new Date(filters.year, filters.month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(filters.year, filters.month, 1, 0, 0, 0, 0);

    const constraints: QueryConstraint[] = [
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<", Timestamp.fromDate(endDate)),
    ];

    if (filters.type) {
      constraints.push(where("type", "==", filters.type));
    }
    if (filters.categoryId) {
      constraints.push(where("categoryId", "==", filters.categoryId));
    }

    constraints.push(orderBy("date", "desc"));

    const entriesQuery = query(
      collection(db, "families", familyId, "entries"),
      ...constraints,
    );
    const snapshot = await getDocs(entriesQuery);
    return snapshot.docs.map((entryDoc) =>
      mapEntryDoc(entryDoc.id, entryDoc.data()),
    );
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    throw error;
  }
}

export async function getEntriesByDateRange(
  familyId: string,
  startDate: Date,
  endDate: Date,
  accountId: string
): Promise<Entry[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate)),
    ];

    const entriesQuery = query(
      collection(db, "families", familyId, "entries"),
      ...constraints,
    );
    const snapshot = await getDocs(entriesQuery);
    return snapshot.docs
      .map((entryDoc) => mapEntryDoc(entryDoc.id, entryDoc.data()))
      .filter((entry) => entry.accountId === accountId || entry.destinationAccountId === accountId);
  } catch (error) {
    console.error("Erro ao buscar lançamentos por período:", error);
    throw error;
  }
}

export async function getEntryById(
  familyId: string,
  entryId: string,
): Promise<Entry | null> {
  try {
    const entryRef = doc(db, "families", familyId, "entries", entryId);
    const snapshot = await getDoc(entryRef);
    if (!snapshot.exists()) {
      return null;
    }
    return mapEntryDoc(snapshot.id, snapshot.data());
  } catch (error) {
    console.error("Erro ao buscar lançamento por ID:", error);
    throw error;
  }
}

export async function createEntry(
  familyId: string,
  data: CreateEntryInput,
): Promise<void> {
  const ownerId = getCurrentUserUid();

  try {
    let isCredit = false;
    if (data.accountId) {
      const accSnap = await getDoc(doc(db, "families", familyId, "accounts", data.accountId));
      if (accSnap.exists() && accSnap.data().accountType === "credit") {
        isCredit = true;
      }
    }

    await addDoc(collection(db, "families", familyId, "entries"), {
      familyId,
      type: data.type,
      value: data.value,
      categoryId: data.categoryId,
      accountId: data.accountId,
      destinationAccountId: data.destinationAccountId || null,
      date: Timestamp.fromDate(data.date),
      description: data.description?.trim() || "",
      ownerId,
      isRecurring: false,
      isCredit,
      isTransfer: data.type === "transfer",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
}

export async function createRecurringEntries(
  familyId: string,
  data: CreateEntryInput,
  interval: RecurrenceInterval,
  count: number,
  isInstallment: boolean = false
): Promise<void> {
  const ownerId = getCurrentUserUid();

  try {
    let isCredit = false;
    if (data.accountId) {
      const accSnap = await getDoc(doc(db, "families", familyId, "accounts", data.accountId));
      if (accSnap.exists() && accSnap.data().accountType === "credit") {
        isCredit = true;
      }
    }

    const batch = writeBatch(db);
    const recurrenceId = crypto.randomUUID();

    const totalCents = Math.round(data.value * 100);
    const baseInstallmentCents = isInstallment ? Math.floor(totalCents / count) : totalCents;
    const remainderCents = isInstallment ? totalCents - baseInstallmentCents * count : 0;

    for (let i = 0; i < count; i += 1) {
      const nextDate = addInterval(data.date, interval, i);
      const entryRef = doc(collection(db, "families", familyId, "entries"));
      const entryValue = isInstallment
        ? (baseInstallmentCents + (i === 0 ? remainderCents : 0)) / 100
        : data.value;

      batch.set(entryRef, {
        familyId,
        type: data.type,
        value: entryValue,
        categoryId: data.categoryId || null,
        accountId: data.accountId || null,
        destinationAccountId: data.destinationAccountId || null,
        date: Timestamp.fromDate(nextDate),
        description: data.description?.trim() || "",
        ownerId,
        recurrenceId,
        recurrenceIndex: i,
        isRecurring: !isInstallment,
        isInstallment,
        installmentCount: isInstallment ? count : null,
        isCredit,
        isTransfer: data.type === "transfer",
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Erro ao criar lançamentos recorrentes:", error);
    throw error;
  }
}

async function resolveCreditFlagIfAccountChanged(
  familyId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (typeof payload.accountId === "string" && payload.accountId) {
    const accSnap = await getDoc(doc(db, "families", familyId, "accounts", payload.accountId));
    payload.isCredit = accSnap.exists() && accSnap.data().accountType === "credit";
  }
}

export async function updateEntry(
  familyId: string,
  entryId: string,
  data: Partial<Entry>,
): Promise<void> {
  try {
    const payload = sanitizePartialEntry(data);
    if (Object.keys(payload).length === 0) {
      return;
    }

    await resolveCreditFlagIfAccountChanged(familyId, payload);

    await updateDoc(doc(db, "families", familyId, "entries", entryId), payload);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
}

export async function updateRecurringEntries(
  familyId: string,
  entry: Entry,
  scope: RecurringScope,
  data: Partial<Entry>,
): Promise<void> {
  if (scope === "this") {
    await updateEntry(familyId, entry.id, data);
    return;
  }

  if (!entry.recurrenceId) {
    throw new Error("Lançamento recorrente inválido.");
  }

  const payload = sanitizePartialEntry(data);
  if (Object.keys(payload).length === 0) {
    return;
  }

  try {
    await resolveCreditFlagIfAccountChanged(familyId, payload);

    const constraints = [where("recurrenceId", "==", entry.recurrenceId)];
    if (scope === "this_and_following") {
      constraints.push(where("recurrenceIndex", ">=", entry.recurrenceIndex ?? 0));
    }

    const recurringQuery = query(
      collection(db, "families", familyId, "entries"),
      ...constraints,
    );
    const snapshot = await getDocs(recurringQuery);

    const batch = writeBatch(db);
    snapshot.docs.forEach((entryDoc) => {
      batch.update(entryDoc.ref, payload);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro ao atualizar lançamentos recorrentes:", error);
    throw error;
  }
}

export async function deleteEntry(
  familyId: string,
  entryId: string,
): Promise<void> {
  try {
    await deleteDoc(doc(db, "families", familyId, "entries", entryId));
  } catch (error) {
    console.error("Erro ao excluir lançamento:", error);
    throw error;
  }
}

export async function deleteRecurringEntries(
  familyId: string,
  entry: Entry,
  scope: RecurringScope,
): Promise<void> {
  if (scope === "this") {
    await deleteEntry(familyId, entry.id);
    return;
  }

  if (!entry.recurrenceId) {
    throw new Error("Lançamento recorrente inválido.");
  }

  try {
    const constraints = [where("recurrenceId", "==", entry.recurrenceId)];
    if (scope === "this_and_following") {
      constraints.push(where("recurrenceIndex", ">=", entry.recurrenceIndex ?? 0));
    }

    const recurringQuery = query(
      collection(db, "families", familyId, "entries"),
      ...constraints,
    );
    const snapshot = await getDocs(recurringQuery);

    const batch = writeBatch(db);
    snapshot.docs.forEach((entryDoc) => {
      batch.delete(entryDoc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro ao excluir lançamentos recorrentes:", error);
    throw error;
  }
}

export async function addEntriesBatch(
  familyId: string,
  entries: Omit<Entry, "id" | "ownerId" | "familyId" | "createdAt">[]
): Promise<void> {
  const ownerId = getCurrentUserUid();
  const batch = writeBatch(db);
  const entriesRef = collection(db, "families", familyId, "entries");

  // O Firestore suporta ate 500 operacoes por batch, o que atende bem extratos
  entries.forEach((data) => {
    const newDocRef = doc(entriesRef);
    batch.set(newDocRef, {
      familyId,
      ownerId,
      type: data.type,
      value: data.value,
      categoryId: data.categoryId || "",
      accountId: data.accountId || "",
      date: Timestamp.fromDate(data.date),
      description: data.description?.trim() || "",
      isRecurring: false,
      isCredit: !!data.isCredit,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}
