"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useFamily } from "@/hooks/useFamily";
import { useToast } from "@/hooks/useToast";
import { auth, db } from "@/lib/firebase";
import {
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Ajustes() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const {
    partner,
    pendingInvite,
    receivedInvite,
    loading: familyLoading,
    sendInvite,
    acceptInvite,
    removePartner,
    cancelPendingInvite,
    declineReceivedInvite,
  } = useFamily();

  const [error, setError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRemovePartnerConfirmOpen, setIsRemovePartnerConfirmOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const isGoogleUser = auth.currentUser?.providerData.some(
    (provider) => provider.providerId === "google.com",
  ) ?? false;

  useEffect(() => {
    setName(user?.displayName ?? "");
  }, [user?.displayName]);

  const initials = useMemo(() => {
    const source = (user?.displayName || user?.email || "U").trim();
    const parts = source.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }, [user?.displayName, user?.email]);

  const clearMessages = () => {
    setError("");
  };

  const handleSaveName = async () => {
    const authUser = auth.currentUser;
    if (!authUser || !user) {
      return;
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Nome e obrigatorio.");
      return;
    }

    clearMessages();
    setSavingName(true);
    try {
      await updateProfile(authUser, { displayName: normalizedName });
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: normalizedName,
          email: user.email,
        },
        { merge: true },
      );

      setEditingName(false);
      showToast("Nome atualizado", "success");
    } catch (saveError) {
      console.error("Erro ao atualizar nome:", saveError);
      showToast("Nao foi possivel atualizar o nome.", "error");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    const authUser = auth.currentUser;
    if (!authUser) {
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    clearMessages();
    setSavingPassword(true);
    try {
      await updatePassword(authUser, newPassword);
      setIsPasswordModalOpen(false);
      setNewPassword("");
      setConfirmNewPassword("");
      showToast("Senha alterada com sucesso", "success");
    } catch (changePasswordError) {
      console.error("Erro ao alterar senha:", changePasswordError);
      showToast("Nao foi possivel alterar a senha. Faca login novamente e tente de novo.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendInvite = async () => {
    clearMessages();
    setSendingInvite(true);
    try {
      await sendInvite(inviteEmail);
      const destination = inviteEmail;
      setInviteEmail("");
      showToast(`Convite enviado para ${destination}`, "success");
    } catch (sendError) {
      console.error("Erro ao enviar convite:", sendError);
      showToast("Nao foi possivel enviar o convite.", "error");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!receivedInvite) {
      return;
    }

    clearMessages();
    try {
      await acceptInvite(receivedInvite.id);
      showToast("Parceiro vinculado com sucesso", "success");
    } catch (acceptError) {
      console.error("Erro ao aceitar convite:", acceptError);
      showToast("Nao foi possivel aceitar o convite.", "error");
    }
  };

  const handleDeclineInvite = async () => {
    clearMessages();
    try {
      await declineReceivedInvite();
      showToast("Convite recusado", "info");
    } catch (declineError) {
      console.error("Erro ao recusar convite:", declineError);
      showToast("Nao foi possivel recusar o convite.", "error");
    }
  };

  const handleCancelInvite = async () => {
    clearMessages();
    try {
      await cancelPendingInvite();
      showToast("Convite cancelado", "info");
    } catch (cancelError) {
      console.error("Erro ao cancelar convite:", cancelError);
      showToast("Nao foi possivel cancelar o convite.", "error");
    }
  };

  const handleRemovePartner = async () => {
    clearMessages();
    try {
      await removePartner();
      showToast("Parceiro removido com sucesso", "success");
      setIsRemovePartnerConfirmOpen(false);
    } catch (removeError) {
      console.error("Erro ao remover parceiro:", removeError);
      showToast("Nao foi possivel remover o parceiro.", "error");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    const authUser = auth.currentUser;
    if (!authUser || !user) {
      setError("Usuario invalido para exclusao.");
      return;
    }

    if (!isGoogleUser && !currentPassword) {
      setError("Informe sua senha atual para confirmar.");
      return;
    }

    clearMessages();
    setDeletingAccount(true);
    try {
      await deleteAccount(currentPassword);

      setIsDeleteModalOpen(false);
      showToast("Conta excluida com sucesso", "success");
      router.push("/login");
    } catch (deleteError) {
      console.error("Erro ao excluir conta:", deleteError);
      if (deleteError instanceof Error) {
        showToast(deleteError.message, "error");
      } else {
        showToast("Nao foi possivel excluir a conta.", "error");
      }
    } finally {
      setDeletingAccount(false);
      setCurrentPassword("");
    }
  };

  if (!user || familyLoading) {
    return <p className="text-[#A09DC0]">Carregando ajustes...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-lg font-semibold text-[#F1F0FF]">Ajustes</h2>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Card>
        <h3 className="text-sm font-semibold text-[#F1F0FF] mb-3">Minha conta</h3>
        <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-xl font-bold text-white">
            {initials}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="space-y-2">
                <Input
                  label="Nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveName} loading={savingName} className="flex-1">
                    Salvar nome
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={savingName}
                    onClick={() => {
                      setEditingName(false);
                      setName(user.displayName ?? "");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-base font-semibold text-[#F1F0FF]">
                  {user.displayName || "Nao informado"}
                </p>
                <p className="mt-0.5 text-sm text-[#6B6890]">{user.email}</p>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="mt-2 text-sm font-medium text-[#8B5CF6] transition-colors duration-200 hover:text-[#F1F0FF]"
                >
                  Editar nome
                </button>
              </>
            )}
          </div>
        </div>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          Alterar senha
        </Button>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[#F1F0FF] mb-3">Meu parceiro</h3>

        {partner ? (
          <div className="mb-4 rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-r from-[#7C3AED]/10 to-[#4F46E5]/10 p-5">
            <p className="text-sm text-[#A09DC0]">Nome: <span className="font-semibold text-[#F1F0FF]">{partner.name}</span></p>
            <p className="mt-1 text-sm text-[#A09DC0]">E-mail: <span className="font-medium text-[#F1F0FF]">{partner.email}</span></p>
            <Button variant="danger" onClick={() => setIsRemovePartnerConfirmOpen(true)}>
              Remover parceiro
            </Button>
          </div>
        ) : pendingInvite ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-[#A09DC0]">
              Convite enviado para {pendingInvite.toEmail}. Aguardando aceite.
            </p>
            <Button variant="secondary" onClick={handleCancelInvite}>
              Cancelar convite
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <Input
              label="E-mail do parceiro"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <Button onClick={handleSendInvite} loading={sendingInvite}>
              Enviar convite
            </Button>
          </div>
        )}

        {receivedInvite && (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-[#1A1A26] p-4">
            <p className="text-sm font-medium text-[#F1F0FF]">
              Voce recebeu um convite de {receivedInvite.fromName || "Usuario"}
            </p>
            {receivedInvite.fromEmail && (
              <p className="mt-1 text-xs text-[#6B6890]">{receivedInvite.fromEmail}</p>
            )}
            <div className="mt-3 flex gap-2">
              <Button onClick={handleAcceptInvite} className="flex-1">
                Aceitar convite
              </Button>
              <Button variant="secondary" onClick={handleDeclineInvite} className="flex-1">
                Recusar
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-[#F1F0FF] mb-3">Conta</h3>
        <div className="mt-3 space-y-2">
          <Button variant="secondary" onClick={handleSignOut}>
            Sair
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            Excluir conta
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar senha"
      >
        <Input
          label="Nova senha"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <Input
          label="Confirmar nova senha"
          type="password"
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <Button onClick={handleChangePassword} loading={savingPassword} className="flex-1">
            Salvar
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={savingPassword}
            onClick={() => setIsPasswordModalOpen(false)}
          >
            Cancelar
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir conta"
      >
        <p className="text-sm text-[#A09DC0]">
          Esta acao e irreversivel. {isGoogleUser
            ? "Confirme para continuar."
            : "Informe sua senha atual para confirmar."}
        </p>
        {!isGoogleUser ? (
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        ) : null}
        <div className="flex gap-2 mt-4">
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            loading={deletingAccount}
            className="flex-1"
          >
            Confirmar exclusao
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={deletingAccount}
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancelar
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={isRemovePartnerConfirmOpen}
        title="Remover parceiro"
        description="Deseja remover o parceiro vinculado?"
        confirmLabel="Remover"
        loading={false}
        onConfirm={handleRemovePartner}
        onCancel={() => setIsRemovePartnerConfirmOpen(false)}
      />
    </div>
  );
}
