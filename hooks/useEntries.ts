import { db } from "@/lib/firebase";
import { Entry } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

/**
 * Cria um novo lançamento no Firestore.
 * @param familyId - ID da família
 * @param entry - Dados do lançamento (sem id)
 * @returns Promise com o ID do lançamento criado
 */
export async function createEntry(
  familyId: string,
  entry: Omit<Entry, "id">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "families", familyId, "entries"), entry);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
}

/**
 * Busca todos os lançamentos de uma família.
 * @param familyId - ID da família
 * @returns Promise com array de lançamentos
 */
export async function getEntriesByFamily(familyId: string): Promise<Entry[]> {
  try {
    const snapshot = await getDocs(
      collection(db, "families", familyId, "entries")
    );
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Entry));
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return [];
  }
}

/**
 * Atualiza um lançamento.
 * @param familyId - ID da família
 * @param entryId - ID do lançamento
 * @param updates - Campos a atualizar
 */
export async function updateEntry(
  familyId: string,
  entryId: string,
  updates: Partial<Entry>
): Promise<void> {
  try {
    const docRef = doc(db, "families", familyId, "entries", entryId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    throw error;
  }
}

/**
 * Deleta um lançamento.
 * @param familyId - ID da família
 * @param entryId - ID do lançamento
 */
export async function deleteEntry(
  familyId: string,
  entryId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, "families", familyId, "entries", entryId));
  } catch (error) {
    console.error("Erro ao deletar lançamento:", error);
    throw error;
  }
}
