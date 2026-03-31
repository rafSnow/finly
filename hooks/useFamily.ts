"use client";

import { useAuth } from "@/hooks/useAuth";
import {
  createFamily,
  getFamilyByMember,
  removeMemberFromFamily,
} from "@/lib/firestore/families";
import {
  acceptInvite as acceptInviteService,
  cancelInvite,
  createInvite,
  declineInvite,
  getInviteByCode,
  getInviteByEmail,
} from "@/lib/firestore/invites";
import { db } from "@/lib/firebase";
import { Family, Invite } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

type PartnerProfile = {
  uid: string;
  name: string;
  email: string;
};

async function getPartnerProfile(uid: string): Promise<PartnerProfile | null> {
  try {
    console.log("📖 [useFamily] Buscando perfil do parceiro:", uid);
    const userDoc = await getDoc(doc(db, "users", uid));
    console.log("✅ [useFamily] Perfil do parceiro recebido", { uid, exists: userDoc.exists() });
    
    if (!userDoc.exists()) {
      console.log("⚠️ [useFamily] Documento do usuário não existe", uid);
      return null;
    }

    const data = userDoc.data() as { name?: string; email?: string };
    return {
      uid,
      name: data.name ?? "Parceiro",
      email: data.email ?? "",
    };
  } catch (error) {
    console.error("❌ [useFamily] Erro ao buscar perfil do parceiro:", {
      error,
      uid,
      message: error instanceof Error ? error.message : "Unknown"
    });
    return null;
  }
}

async function getPendingSentInvite(fromUid: string): Promise<Invite | null> {
  try {
    const invitesQuery = query(
      collection(db, "invites"),
      where("fromUid", "==", fromUid),
      where("status", "==", "pending"),
      limit(1),
    );
    const snapshot = await getDocs(invitesQuery);
    if (snapshot.empty) {
      return null;
    }

    const inviteCode = snapshot.docs[0].id;
    return getInviteByCode(inviteCode);
  } catch (error) {
    console.error("Erro ao buscar convite enviado:", error);
    return null;
  }
}

export function useFamily() {
  const { user, loading: authLoading } = useAuth();

  const [family, setFamily] = useState<Family | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [pendingInvite, setPendingInvite] = useState<Invite | null>(null);
  const [receivedInvite, setReceivedInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setFamily(null);
      setPartner(null);
      setPendingInvite(null);
      setReceivedInvite(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const familyData = await getFamilyByMember(user.uid);
      setFamily(familyData);

      if (familyData) {
        const partnerUid = familyData.memberIds.find((memberId) => memberId !== user.uid);
        if (partnerUid) {
          const profile = await getPartnerProfile(partnerUid);
          setPartner(profile);
        } else {
          setPartner(null);
        }
      } else {
        setPartner(null);
      }

      const sentInvite = await getPendingSentInvite(user.uid);
      setPendingInvite(sentInvite);

      const incomingInvite = user.email ? await getInviteByEmail(user.email) : null;
      setReceivedInvite(incomingInvite);
    } catch (error) {
      console.error("Erro ao carregar contexto familiar:", error);
      setFamily(null);
      setPartner(null);
      setPendingInvite(null);
      setReceivedInvite(null);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendInvite = async (toEmail: string): Promise<void> => {
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const targetEmail = toEmail.trim().toLowerCase();
    if (!targetEmail) {
      throw new Error("E-mail do parceiro é obrigatório.");
    }

    const activeFamily = family ?? (await createFamily(user.uid));
    if (!family) {
      setFamily(activeFamily);
    }

    await createInvite(
      user.uid,
      user.displayName ?? "Usuario",
      user.email,
      targetEmail,
      activeFamily.id,
    );
    await refresh();
  };

  const acceptInvite = async (code: string): Promise<void> => {
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    await acceptInviteService(code, user.uid);
    await refresh();
  };

  const removePartner = async (): Promise<void> => {
    if (!user || !family || !partner) {
      throw new Error("Nenhum parceiro vinculado.");
    }

    await removeMemberFromFamily(family.id, partner.uid);
    await refresh();
  };

  const cancelPendingInvite = async (): Promise<void> => {
    if (!pendingInvite) {
      return;
    }

    await cancelInvite(pendingInvite.id);
    await refresh();
  };

  const declineReceivedInvite = async (): Promise<void> => {
    if (!receivedInvite) {
      return;
    }

    await declineInvite(receivedInvite.id);
    await refresh();
  };

  return {
    family,
    partner,
    pendingInvite,
    receivedInvite,
    loading,
    sendInvite,
    acceptInvite,
    removePartner,
    cancelPendingInvite,
    declineReceivedInvite,
    refresh,
  };
}
