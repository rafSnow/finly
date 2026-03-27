import { db } from "@/lib/firebase";
import { CreateGoalInput, Goal } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

function mapGoalDoc(
  id: string,
  familyId: string,
  data: Record<string, unknown>,
): Goal {
  const createdAtRaw = data.createdAt as Timestamp | Date | undefined;

  return {
    id,
    familyId,
    categoryId: String(data.categoryId ?? ""),
    limit: Number(data.limit ?? 0),
    period: "monthly",
    createdAt:
      createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : (createdAtRaw ?? new Date()),
  };
}

export async function getGoals(familyId: string): Promise<Goal[]> {
  try {
    const snapshot = await getDocs(collection(db, "families", familyId, "goals"));
    return snapshot.docs.map((goalDoc) =>
      mapGoalDoc(goalDoc.id, familyId, goalDoc.data()),
    );
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return [];
  }
}

export async function createGoal(
  familyId: string,
  data: CreateGoalInput,
): Promise<void> {
  try {
    await addDoc(collection(db, "families", familyId, "goals"), {
      familyId,
      categoryId: data.categoryId,
      limit: data.limit,
      period: data.period,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    throw error;
  }
}

export async function updateGoal(
  familyId: string,
  goalId: string,
  data: Partial<Goal>,
): Promise<void> {
  try {
    const payload: Partial<Pick<Goal, "categoryId" | "limit" | "period">> = {};

    if (typeof data.categoryId === "string") {
      payload.categoryId = data.categoryId;
    }
    if (typeof data.limit === "number") {
      payload.limit = data.limit;
    }
    if (data.period) {
      payload.period = data.period;
    }

    await updateDoc(doc(db, "families", familyId, "goals", goalId), payload);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    throw error;
  }
}

export async function deleteGoal(
  familyId: string,
  goalId: string,
): Promise<void> {
  try {
    await deleteDoc(doc(db, "families", familyId, "goals", goalId));
  } catch (error) {
    console.error("Erro ao excluir meta:", error);
    throw error;
  }
}
