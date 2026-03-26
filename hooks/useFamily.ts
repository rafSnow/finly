import { db } from "@/lib/firebase";
import { Family } from "@/types";
import { collection, doc, getDocs, getDoc, query, setDoc, where } from "firebase/firestore";

/**
 * Cria uma nova família no Firestore.
 * @param createdBy - UID do usuário que cria a família
 * @param memberIds - Array com IDs dos membros (incluindo o criador)
 * @returns Promise com o ID da família criada
 */
export async function createFamily(
  createdBy: string,
  memberIds: string[]
): Promise<string> {
  const familyRef = doc(collection(db, "families"));
  const newFamily: Omit<Family, "id"> = {
    memberIds,
    createdBy,
    createdAt: new Date(),
  };
  await setDoc(familyRef, newFamily);
  return familyRef.id;
}

/**
 * Busca uma família pelo ID.
 * @param familyId - ID da família
 * @returns Promise com os dados da família ou null
 */
export async function getFamily(familyId: string): Promise<Family | null> {
  try {
    const docRef = doc(db, "families", familyId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Family;
  } catch (error) {
    console.error("Erro ao buscar família:", error);
    return null;
  }
}

/**
 * Busca uma família onde o usuário é membro.
 * @param uid - UID do usuário
 * @returns Promise com os dados da família ou null
 */
export async function getFamilyByMember(uid: string): Promise<Family | null> {
  try {
    const q = query(
      collection(db, "families"),
      where("memberIds", "array-contains", uid)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Family;
  } catch (error) {
    console.error("Erro ao buscar família do usuário:", error);
    return null;
  }
}
