"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAccounts, useAccountBalance } from "@/hooks/useAccounts";
import { Account } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, MoreVertical, Pencil, Plus, Trash, Wallet, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

import Link from "next/link";

function AccountCard({ account, onEdit, onDelete }: { account: Account; onEdit: (a: Account) => void; onDelete: (a: Account) => void }) {
  const { balance, loading } = useAccountBalance(account.id);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-white/5 bg-[#111118] transition-colors hover:bg-white/[0.02]">
      <Link href={`/contas/detalhes?id=${account.id}`} className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A26] ${account.accountType === "credit" ? "text-orange-500" : account.accountType === "investment" ? "text-emerald-500" : "text-[#7C3AED]"}`}>
              {account.accountType === "credit" ? <CreditCard size={20} /> : account.accountType === "investment" ? <TrendingUp size={20} /> : <Wallet size={20} />}
            </div>
            <div>
              <h3 className="font-medium text-[#F1F0FF]">{account.name}</h3>
              {account.accountType === "credit" && (
                <p className="text-xs text-[#6B6890]">Vence dia {account.dueDay}</p>
              )}
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowOptions(!showOptions);
              }}
              className="rounded-lg p-2 text-[#6B6890] transition-colors hover:bg-white/5 hover:text-[#F1F0FF]"
            >
              <MoreVertical size={16} />
            </button>
            
            {showOptions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowOptions(false);
                  }}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-xl border border-white/5 bg-[#1A1A26] py-1 shadow-xl">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOptions(false);
                      onEdit(account);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#A09DC0] transition-colors hover:bg-white/5 hover:text-[#F1F0FF]"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOptions(false);
                      onDelete(account);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash size={14} />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-[#6B6890]">{account.accountType === "credit" ? "Fatura atual (aprox.)" : account.accountType === "investment" ? "Patrimônio" : "Saldo atual"}</p>
          <p className={`mt-1 text-2xl font-bold ${account.accountType === "credit" || balance >= 0 ? "text-[#F1F0FF]" : "text-red-400"}`}>
            {loading ? "..." : formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </Link>
    </div>
  );
}

const accountBaseSchema = z.object({
  name: z.string().min(1, "O nome da conta é obrigatório").max(50, "Máximo de 50 caracteres"),
  accountType: z.enum(["checking", "credit", "investment"]),
  closingDay: z.coerce.number().min(1).max(31).optional(),
  dueDay: z.coerce.number().min(1).max(31).optional(),
});

const accountSchema = accountBaseSchema.superRefine((data, ctx) => {
  if (data.accountType === "credit") {
    if (!data.closingDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Obrigatório", path: ["closingDay"] });
    }
    if (!data.dueDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Obrigatório", path: ["dueDay"] });
    }
  }
});

type AccountFormValues = z.infer<typeof accountBaseSchema>;

export default function ContasPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
  });

  const accountType = watch("accountType");

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      reset({ 
        name: account.name,
        accountType: account.accountType || "checking",
        closingDay: account.closingDay,
        dueDay: account.dueDay
      });
    } else {
      setEditingAccount(null);
      reset({ name: "", accountType: "checking" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    reset();
  };

  const onSubmit = async (values: AccountFormValues) => {
    try {
      if (editingAccount) {
        await updateAccount({ 
          id: editingAccount.id, 
          name: values.name,
          accountType: values.accountType,
          closingDay: values.closingDay ?? undefined,
          dueDay: values.dueDay ?? undefined,
        });
      } else {
        await createAccount({
          name: values.name,
          accountType: values.accountType,
          closingDay: values.closingDay ?? undefined,
          dueDay: values.dueDay ?? undefined,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar conta", error);
    }
  };

  const handleDelete = async (account: Account) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      try {
        await deleteAccount(account.id);
      } catch (error) {
        console.error("Erro ao excluir conta", error);
      }
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F0FF]">Contas</h1>
          <p className="mt-1 text-sm text-[#A09DC0]">
            Gerencie suas contas e carteiras
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus size={18} />
          Nova Conta
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-[#6B6890]">Carregando contas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A1A26] text-[#7C3AED]">
            <Wallet size={24} />
          </div>
          <h3 className="mb-1 text-lg font-medium text-[#F1F0FF]">
            Nenhuma conta
          </h3>
          <p className="mb-6 max-w-sm text-sm text-[#A09DC0]">
            Cadastre suas contas correntes, poupanças ou carteiras para melhor organizar seus lançamentos.
          </p>
          <Button onClick={() => handleOpenModal()} variant="secondary" className="gap-2">
            <Plus size={18} />
            Adicionar Conta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAccount ? "Editar Conta" : "Nova Conta"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-6">
          <div className="mb-6 space-y-4">
            <Input
              label="Nome da Conta"
              placeholder="Ex: Nubank, Carteira..."
              {...register("name")}
              error={errors.name?.message}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#A09DC0]">Tipo de Conta</label>
              <select
                {...register("accountType")}
                className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-[#F1F0FF] outline-none transition-colors focus:border-[#7C3AED]"
              >
                <option value="checking">Conta Corrente / Carteira</option>
                <option value="credit">Cartão de Crédito</option>
                <option value="investment">Investimento</option>
              </select>
            </div>

            {accountType === "credit" && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Dia de Fechamento"
                  type="number"
                  min="1"
                  max="31"
                  {...register("closingDay")}
                  error={errors.closingDay?.message}
                />
                <Input
                  label="Dia de Vencimento"
                  type="number"
                  min="1"
                  max="31"
                  {...register("dueDay")}
                  error={errors.dueDay?.message}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" loading={isSubmitting}>
              Salvar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
