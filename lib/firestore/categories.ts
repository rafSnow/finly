import { db } from "@/lib/firebase";
import { Category } from "@/types";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	limit,
	query,
	serverTimestamp,
	Timestamp,
	updateDoc,
	where,
} from "firebase/firestore";

const DEFAULT_CATEGORIES: Array<Pick<Category, "name" | "type">> = [
	{ name: "Alimentação", type: "expense" },
	{ name: "Transporte", type: "expense" },
	{ name: "Saúde", type: "expense" },
	{ name: "Lazer", type: "expense" },
	{ name: "Moradia", type: "expense" },
	{ name: "Educação", type: "expense" },
	{ name: "Salário", type: "income" },
	{ name: "Outros", type: "both" },
];

function mapCategoryDoc(id: string, familyId: string, data: Record<string, unknown>): Category {
	const createdAtRaw = data.createdAt as Timestamp | Date | undefined;

	return {
		id,
		familyId,
		name: (data.name as string) ?? "",
		type: ((data.type as Category["type"]) ?? "both"),
		createdAt:
			createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : (createdAtRaw ?? new Date()),
		isDefault: Boolean(data.isDefault),
	};
}

export async function getCategories(familyId: string): Promise<Category[]> {
	try {
		const snapshot = await getDocs(collection(db, "families", familyId, "categories"));
		return snapshot.docs.map((categoryDoc) =>
			mapCategoryDoc(categoryDoc.id, familyId, categoryDoc.data()),
		);
	} catch (error) {
		console.error("Erro ao listar categorias:", error);
		return [];
	}
}

export async function createCategory(
	familyId: string,
	data: Omit<Category, "id" | "familyId" | "createdAt">,
): Promise<Category> {
	try {
		const payload = {
			name: data.name.trim(),
			type: data.type,
			isDefault: data.isDefault,
			createdAt: serverTimestamp(),
		};

		const docRef = await addDoc(collection(db, "families", familyId, "categories"), payload);

		return {
			id: docRef.id,
			familyId,
			name: payload.name,
			type: payload.type,
			isDefault: payload.isDefault,
			createdAt: new Date(),
		};
	} catch (error) {
		console.error("Erro ao criar categoria:", error);
		throw error;
	}
}

export async function updateCategory(
	familyId: string,
	categoryId: string,
	data: Partial<Pick<Category, "name" | "type">>,
): Promise<void> {
	try {
		const updates: Partial<Pick<Category, "name" | "type">> = {};

		if (typeof data.name === "string") {
			updates.name = data.name.trim();
		}
		if (data.type) {
			updates.type = data.type;
		}

		await updateDoc(doc(db, "families", familyId, "categories", categoryId), updates);
	} catch (error) {
		console.error("Erro ao atualizar categoria:", error);
		throw error;
	}
}

export async function deleteCategory(
	familyId: string,
	categoryId: string,
): Promise<{ success: boolean; reason?: "has_entries" }> {
	try {
		const entriesRef = collection(db, "families", familyId, "entries");
		const linkedEntriesQuery = query(
			entriesRef,
			where("categoryId", "==", categoryId),
			limit(1),
		);
		const linkedEntriesSnapshot = await getDocs(linkedEntriesQuery);

		if (!linkedEntriesSnapshot.empty) {
			return { success: false, reason: "has_entries" };
		}

		await deleteDoc(doc(db, "families", familyId, "categories", categoryId));
		return { success: true };
	} catch (error) {
		console.error("Erro ao excluir categoria:", error);
		throw error;
	}
}

export async function createDefaultCategories(familyId: string): Promise<void> {
	try {
		const existing = await getCategories(familyId);
		if (existing.length > 0) {
			return;
		}

		await Promise.all(
			DEFAULT_CATEGORIES.map((category) =>
				addDoc(collection(db, "families", familyId, "categories"), {
					...category,
					isDefault: true,
					createdAt: serverTimestamp(),
				}),
			),
		);
	} catch (error) {
		console.error("Erro ao criar categorias padrão:", error);
		throw error;
	}
}
