import { db } from "@/lib/firebase";
import { Goal } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

/**
 * Cria uma nova meta de gastos.
 * @param familyId - ID da família
 * @param goal - Dados da meta (sem id)
 * @returns Promise com o ID da meta criada
 */
export async function createGoal(
  familyId: string,
  goal: Omit<Goal, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "families", familyId, "goals"), goal);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    throw error;
  }
}

/**
 * Busca todas as metas de uma família.
 * @param familyId - ID da família
 * @returns Promise com array de metas
 */
export async function getGoalsByFamily(familyId: string): Promise<Goal[]> {
  try {
    const snapshot = await getDocs(
      collection(db, "families", familyId, "goals")
    );
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Goal));
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return [];
  }
}

/**
 * Atualiza uma meta.
 * @param familyId - ID da família
 * @param goalId - ID da meta
 * @param updates - Campos a atualizar
 */
export async function updateGoal(
  familyId: string,
  goalId: string,
  updates: Partial<Goal>
): Promise<void> {
  try {
    const docRef = doc(db, "families", familyId, "goals", goalId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    throw error;
  }
}

/**
 * Deleta uma meta.
 * @param familyId - ID da família
 * @param goalId - ID da meta
 */
export async function deleteGoal(
  familyId: string,
  goalId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, "families", familyId, "goals", goalId));
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    throw error;
  }
}
