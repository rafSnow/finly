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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type PartnerProfile = {
  uid: string;
  name: string;
  email: string;
};

async function getPartnerProfile(uid: string): Promise<PartnerProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data() as { name?: string; email?: string };
    return {
      uid,
      name: data.name ?? "Parceiro",
      email: data.email ?? "",
    };
  } catch (error) {
    console.error("Erro ao buscar perfil do parceiro:", error);
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
    if (snapshot.empty) return null;

    const inviteCode = snapshot.docs[0].id;
    return getInviteByCode(inviteCode);
  } catch (error) {
    console.error("Erro ao buscar convite enviado:", error);
    return null;
  }
}

export function useFamily() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["family_context", user?.uid, user?.email],
    queryFn: async () => {
      if (!user) {
        return {
          family: null,
          partner: null,
          pendingInvite: null,
          receivedInvite: null,
        };
      }

      const familyData = await getFamilyByMember(user.uid);
      let partnerProfile: PartnerProfile | null = null;

      if (familyData) {
        const partnerUid = familyData.memberIds.find((id) => id !== user.uid);
        if (partnerUid) {
          partnerProfile = await getPartnerProfile(partnerUid);
        }
      }

      const sentInvite = await getPendingSentInvite(user.uid);
      const incomingInvite = user.email ? await getInviteByEmail(user.email) : null;

      return {
        family: familyData,
        partner: partnerProfile,
        pendingInvite: sentInvite,
        receivedInvite: incomingInvite,
      };
    },
    enabled: !authLoading && !!user,
  });

  const invalidateContext = () => {
    queryClient.invalidateQueries({ queryKey: ["family_context", user?.uid, user?.email] });
  };

  const sendInviteMutation = useMutation({
    mutationFn: async (toEmail: string) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const targetEmail = toEmail.trim().toLowerCase();
      if (!targetEmail) throw new Error("E-mail do parceiro é obrigatório.");

      let activeFamily = data?.family;
      if (!activeFamily) {
        activeFamily = await createFamily(user.uid);
      }

      await createInvite(
        user.uid,
        user.displayName ?? "Usuario",
        user.email,
        targetEmail,
        activeFamily.id,
      );
    },
    onSuccess: invalidateContext,
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("Usuário não autenticado.");
      await acceptInviteService(code, user.uid);
    },
    onSuccess: invalidateContext,
  });

  const removePartnerMutation = useMutation({
    mutationFn: async () => {
      if (!user || !data?.family || !data?.partner) {
        throw new Error("Nenhum parceiro vinculado.");
      }
      await removeMemberFromFamily(data.family.id, data.partner.uid);
    },
    onSuccess: invalidateContext,
  });

  const cancelPendingInviteMutation = useMutation({
    mutationFn: async () => {
      if (!data?.pendingInvite) return;
      await cancelInvite(data.pendingInvite.id);
    },
    onSuccess: invalidateContext,
  });

  const declineReceivedInviteMutation = useMutation({
    mutationFn: async () => {
      if (!data?.receivedInvite) return;
      await declineInvite(data.receivedInvite.id);
    },
    onSuccess: invalidateContext,
  });

  return {
    family: data?.family ?? null,
    partner: data?.partner ?? null,
    pendingInvite: data?.pendingInvite ?? null,
    receivedInvite: data?.receivedInvite ?? null,
    loading: isLoading || authLoading,
    sendInvite: async (email: string) => sendInviteMutation.mutateAsync(email),
    acceptInvite: async (code: string) => acceptInviteMutation.mutateAsync(code),
    removePartner: async () => removePartnerMutation.mutateAsync(),
    cancelPendingInvite: async () => cancelPendingInviteMutation.mutateAsync(),
    declineReceivedInvite: async () => declineReceivedInviteMutation.mutateAsync(),
    refresh: refetch,
  };
}
