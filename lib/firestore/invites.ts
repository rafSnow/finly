import { db } from "@/lib/firebase";
import { Invite } from "@/types";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	query,
	serverTimestamp,
	setDoc,
	Timestamp,
	updateDoc,
	where,
} from "firebase/firestore";
import { addMemberToFamily } from "./families";

function nowDate(): Date {
	return new Date();
}

function isExpired(expiresAt: Date): boolean {
	return expiresAt.getTime() <= nowDate().getTime();
}

function mapInviteDoc(id: string, data: Record<string, unknown>): Invite {
	const createdAtRaw = data.createdAt as Timestamp | Date | undefined;
	const expiresAtRaw = data.expiresAt as Timestamp | Date | undefined;

	return {
		id,
		fromUid: (data.fromUid as string) ?? "",
		fromName: (data.fromName as string | undefined) ?? undefined,
		fromEmail: (data.fromEmail as string | undefined) ?? undefined,
		toEmail: (data.toEmail as string) ?? "",
		familyId: (data.familyId as string) ?? "",
		status: ((data.status as Invite["status"]) ?? "pending"),
		createdAt:
			createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : (createdAtRaw ?? new Date()),
		expiresAt:
			expiresAtRaw instanceof Timestamp ? expiresAtRaw.toDate() : (expiresAtRaw ?? new Date()),
	};
}

async function expireInviteIfNeeded(invite: Invite): Promise<Invite> {
	if (invite.status !== "pending" || !isExpired(invite.expiresAt)) {
		return invite;
	}

	await updateDoc(doc(db, "invites", invite.id), {
		status: "expired",
		updatedAt: serverTimestamp(),
	});

	return { ...invite, status: "expired" };
}

export async function createInvite(
	fromUid: string,
	fromName: string,
	fromEmail: string,
	toEmail: string,
	familyId: string,
): Promise<Invite> {
	const code = crypto.randomUUID();
	const createdAt = nowDate();
	const expiresAt = new Date(createdAt);
	expiresAt.setDate(expiresAt.getDate() + 7);

	const invite: Invite = {
		id: code,
		fromUid,
		fromName: fromName.trim(),
		fromEmail: fromEmail.trim().toLowerCase(),
		toEmail: toEmail.trim().toLowerCase(),
		familyId,
		status: "pending",
		createdAt,
		expiresAt,
	};

	try {
		await setDoc(doc(db, "invites", code), {
			fromUid: invite.fromUid,
			fromName: invite.fromName,
			fromEmail: invite.fromEmail,
			toEmail: invite.toEmail,
			familyId: invite.familyId,
			status: invite.status,
			createdAt: serverTimestamp(),
			expiresAt: Timestamp.fromDate(invite.expiresAt),
		});

		return invite;
	} catch (error) {
		console.error("Erro ao criar convite:", error);
		throw error;
	}
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
	try {
		const inviteRef = doc(db, "invites", code);
		const snapshot = await getDoc(inviteRef);
		if (!snapshot.exists()) {
			return null;
		}

		const invite = mapInviteDoc(snapshot.id, snapshot.data());
		const normalizedInvite = await expireInviteIfNeeded(invite);
		return normalizedInvite.status === "pending" ? normalizedInvite : null;
	} catch (error) {
		console.error("Erro ao buscar convite por código:", error);
		return null;
	}
}

export async function getInviteByEmail(email: string): Promise<Invite | null> {
	try {
		const emailNormalized = email.trim().toLowerCase();
		const q = query(
			collection(db, "invites"),
			where("toEmail", "==", emailNormalized),
			where("status", "==", "pending"),
			limit(1),
		);

		const snapshot = await getDocs(q);
		if (snapshot.empty) {
			return null;
		}

		const inviteDoc = snapshot.docs[0];
		const invite = mapInviteDoc(inviteDoc.id, inviteDoc.data());
		const normalizedInvite = await expireInviteIfNeeded(invite);
		return normalizedInvite.status === "pending" ? normalizedInvite : null;
	} catch (error) {
		console.error("Erro ao buscar convite por e-mail:", error);
		return null;
	}
}

export async function acceptInvite(code: string, uid: string): Promise<void> {
	const inviteRef = doc(db, "invites", code);

	try {
		const snapshot = await getDoc(inviteRef);
		if (!snapshot.exists()) {
			throw new Error("Convite não encontrado.");
		}

		const invite = mapInviteDoc(snapshot.id, snapshot.data());
		if (invite.status !== "pending") {
			throw new Error("Convite não está pendente.");
		}
		if (isExpired(invite.expiresAt)) {
			await updateDoc(inviteRef, {
				status: "expired",
				updatedAt: serverTimestamp(),
			});
			throw new Error("Convite expirado.");
		}

		await addMemberToFamily(invite.familyId, uid);
		await updateDoc(doc(db, "users", uid), {
			familyId: invite.familyId,
		});
		await updateDoc(inviteRef, {
			status: "accepted",
			acceptedBy: uid,
			acceptedAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Erro ao aceitar convite:", error);
		throw error;
	}
}

export async function cancelInvite(code: string): Promise<void> {
	try {
		await updateDoc(doc(db, "invites", code), {
			status: "expired",
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Erro ao cancelar convite:", error);
		throw error;
	}
}

export async function declineInvite(code: string): Promise<void> {
	try {
		await updateDoc(doc(db, "invites", code), {
			status: "expired",
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Erro ao recusar convite:", error);
		throw error;
	}
}
