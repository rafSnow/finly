import { auth, db } from "@/lib/firebase";
import Cookies from "js-cookie";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

async function reauthenticateCurrentUser(user: User, password: string): Promise<void> {
  const hasGoogleProvider = user.providerData.some((provider) => provider.providerId === "google.com");

  if (hasGoogleProvider) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }

  if (!user.email || !password) {
    throw new Error("Informe sua senha atual para confirmar a exclusao da conta.");
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function deleteAllUserData(uid: string, familyId: string, password: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error("Usuario autenticado invalido para exclusao.");
  }

  try {
    await reauthenticateCurrentUser(currentUser, password);

    const ownedEntriesSnapshot = await getDocs(
      query(collection(db, "families", familyId, "entries"), where("ownerId", "==", uid)),
    );
    if (!ownedEntriesSnapshot.empty) {
      const entriesBatch = writeBatch(db);
      ownedEntriesSnapshot.docs.forEach((entryDoc) => entriesBatch.delete(entryDoc.ref));
      await entriesBatch.commit();
    }

    const sentInvitesSnapshot = await getDocs(
      query(collection(db, "invites"), where("fromUid", "==", uid)),
    );
    if (!sentInvitesSnapshot.empty) {
      const invitesBatch = writeBatch(db);
      sentInvitesSnapshot.docs.forEach((inviteDoc) => invitesBatch.delete(inviteDoc.ref));
      await invitesBatch.commit();
    }

    const familyRef = doc(db, "families", familyId);
    const familyBatch = writeBatch(db);
    familyBatch.update(familyRef, { memberIds: arrayRemove(uid) });
    await familyBatch.commit();

    const familySnapshot = await getDoc(familyRef);
    const memberIds = familySnapshot.exists()
      ? ((familySnapshot.data() as { memberIds?: string[] }).memberIds ?? [])
      : [];

    if (familySnapshot.exists() && memberIds.length === 0) {
      const [entriesAll, categoriesAll, goalsAll] = await Promise.all([
        getDocs(collection(db, "families", familyId, "entries")),
        getDocs(collection(db, "families", familyId, "categories")),
        getDocs(collection(db, "families", familyId, "goals")),
      ]);

      const cleanupBatch = writeBatch(db);
      entriesAll.docs.forEach((entryDoc) => cleanupBatch.delete(entryDoc.ref));
      categoriesAll.docs.forEach((categoryDoc) => cleanupBatch.delete(categoryDoc.ref));
      goalsAll.docs.forEach((goalDoc) => cleanupBatch.delete(goalDoc.ref));
      await cleanupBatch.commit();

      await deleteDoc(familyRef);
    }

    await deleteDoc(doc(db, "users", uid));
    await deleteUser(currentUser);

    Cookies.remove("firebase-token");
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    throw new Error("Nao foi possivel excluir sua conta. Tente novamente.");
  }
}
