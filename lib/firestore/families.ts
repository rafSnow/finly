import { db } from "@/lib/firebase";
import { Family } from "@/types";
import {
	arrayRemove,
	arrayUnion,
	collection,
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
	Timestamp,
	updateDoc,
} from "firebase/firestore";

function mapFamilyDoc(id: string, data: Record<string, unknown>): Family {
	const createdAtRaw = data.createdAt as Timestamp | Date | undefined;

	return {
		id,
		memberIds: (data.memberIds as string[]) ?? [],
		createdBy: (data.createdBy as string) ?? "",
		createdAt:
			createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : (createdAtRaw ?? new Date()),
	};
}

export async function getFamilyByMember(uid: string): Promise<Family | null> {
	try {
		const userSnapshot = await getDoc(doc(db, "users", uid));
		if (!userSnapshot.exists()) {
			return null;
		}

		const userData = userSnapshot.data() as { familyId?: string };
		if (!userData.familyId) {
			return null;
		}

		const familySnapshot = await getDoc(doc(db, "families", userData.familyId));
		if (!familySnapshot.exists()) {
			return null;
		}

		return mapFamilyDoc(familySnapshot.id, familySnapshot.data());
	} catch (error) {
		console.error("Erro ao buscar família por membro:", error);
		return null;
	}
}

export async function createFamily(uid: string): Promise<Family> {
	const familyRef = doc(collection(db, "families"));

	try {
		await setDoc(familyRef, {
			memberIds: [uid],
			createdBy: uid,
			createdAt: serverTimestamp(),
		});

		await setDoc(
			doc(db, "users", uid),
			{
				familyId: familyRef.id,
			},
			{ merge: true },
		);

		return {
			id: familyRef.id,
			memberIds: [uid],
			createdBy: uid,
			createdAt: new Date(),
		};
	} catch (error) {
		console.error("Erro ao criar família:", error);
		throw error;
	}
}

export async function addMemberToFamily(familyId: string, uid: string): Promise<void> {
	try {
		const familyRef = doc(db, "families", familyId);
		await updateDoc(familyRef, {
			memberIds: arrayUnion(uid),
		});
	} catch (error) {
		console.error("Erro ao adicionar membro na família:", error);
		throw error;
	}
}

export async function removeMemberFromFamily(familyId: string, uid: string): Promise<void> {
	try {
		const familyRef = doc(db, "families", familyId);
		await updateDoc(familyRef, {
			memberIds: arrayRemove(uid),
		});
	} catch (error) {
		console.error("Erro ao remover membro da família:", error);
		throw error;
	}
}
