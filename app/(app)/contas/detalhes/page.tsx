"use client";

import { useAccounts, useAccountBalance } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useEntries } from "@/hooks/useEntries";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, CreditCard, Wallet, TrendingUp } from "lucide-react";
import { EntryItem } from "@/components/lancamentos/EntryItem";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { usePeriod } from "@/hooks/usePeriod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/utils/format";
import { Entry } from "@/types";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";

const payInvoiceSchema = z.object({
  accountId: z.string().min(1, "Selecione uma conta"),
  date: z.string().min(1, "A data é obrigatória"),
});
type PayInvoiceForm = z.infer<typeof payInvoiceSchema>;

function DetalhesContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { accounts, loading: loadingAccounts } = useAccounts();
  const { categoryNameMap } = useCategories();
  const account = accounts.find((a) => a.id === id);
  const { balance, loading: loadingBalance } = useAccountBalance(id ?? "");

  const { period, setPeriod } = usePeriod();

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  const { entries, loading: loadingEntries, createEntry, updateEntry, deleteEntry } = useEntries({
    month: period.month,
    year: period.year,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PayInvoiceForm>({
    resolver: zodResolver(payInvoiceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    }
  });

  const accountEntries = entries.filter(
    (e) => e.accountId === account?.id || e.destinationAccountId === account?.id
  );
  const checkingAccounts = accounts.filter((a) => a.accountType !== "credit");

  if (loadingAccounts) {
    return <div className="py-8 text-[#A09DC0]">Carregando...</div>;
  }

  if (!account) {
    return (
      <div className="py-8">
        <p className="text-red-400 mb-4">Conta não encontrada.</p>
        <button onClick={() => router.push("/contas")} className="text-[#8B5CF6]">Voltar</button>
      </div>
    );
  }

  const isCredit = account.accountType === "credit";
  const isInvestment = account.accountType === "investment";

  const expensesInMonth = accountEntries
    .filter((e) => e.accountId === account.id && e.type === "expense" && !e.isTransfer)
    .reduce((sum, e) => sum + e.value, 0);

  const incomesInMonth = accountEntries
    .filter((e) => e.accountId === account.id && e.type === "income" && !e.isTransfer)
    .reduce((sum, e) => sum + e.value, 0);

  const paymentsInMonth = accountEntries
    .filter((e) => e.destinationAccountId === account.id && (e.type === "transfer" || e.isTransfer))
    .reduce((sum, e) => sum + e.value, 0);

  const faturaTotalMes = Math.max(0, expensesInMonth - incomesInMonth);
  const totalFaturaAberta = Math.max(0, faturaTotalMes - paymentsInMonth);

  const handlePayInvoice = async (values: PayInvoiceForm) => {
    if (totalFaturaAberta <= 0) {
      showToast("A fatura deste período já está quitada.", "info");
      return;
    }

    try {
      await createEntry({
        type: "transfer",
        value: totalFaturaAberta,
        categoryId: "",
        accountId: values.accountId,
        destinationAccountId: account.id,
        date: new Date(`${values.date}T12:00:00`),
        description: `Pagamento Fatura ${account.name}`,
      });

      setIsPayModalOpen(false);
      reset();
      showToast("Fatura paga com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showToast("Erro ao pagar fatura.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (entryToDelete) {
      setIsDeleting(true);
      try {
        await deleteEntry(entryToDelete.id, "this");
        showToast("Lançamento excluído com sucesso!", "success");
      } catch (error) {
        console.error(error);
        showToast("Erro ao excluir lançamento.", "error");
      } finally {
        setIsDeleting(false);
        setIsDeleteConfirmOpen(false);
        setEntryToDelete(null);
      }
    }
  };

  const handleTogglePaid = async (entry: Entry) => {
    try {
      const nextPaid = entry.isPaid === false ? true : false;
      await updateEntry(entry.id, { isPaid: nextPaid }, "this");
      showToast(
        nextPaid ? "Marcado como pago/recebido!" : "Marcado como pendente.",
        "success"
      );
    } catch {
      showToast("Erro ao atualizar status.", "error");
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/contas")}
          className="rounded-lg p-2 text-[#6B6890] transition-colors hover:bg-white/5 hover:text-[#F1F0FF]"
        >
          <ArrowLeft size={20} />
        </button>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A1A26] ${
            isCredit ? "text-orange-500" : isInvestment ? "text-emerald-500" : "text-[#7C3AED]"
          }`}
        >
          {isCredit ? <CreditCard size={24} /> : isInvestment ? <TrendingUp size={24} /> : <Wallet size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F1F0FF]">{account.name}</h1>
          <p className="text-sm text-[#A09DC0]">
            {isCredit
              ? `Cartão de Crédito • ${account.closingDay ? `Fecha dia ${account.closingDay} • ` : ""}Vence dia ${account.dueDay}`
              : isInvestment
              ? "Conta de Investimento"
              : "Conta Corrente / Carteira"}
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-[#111118] p-6">
        <div>
          <p className="text-sm font-medium text-[#6B6890]">
            {isCredit ? "Fatura em Aberto (Mês)" : "Saldo Atual"}
          </p>
          <p className={`mt-1 text-3xl font-bold ${isCredit || balance >= 0 ? "text-[#F1F0FF]" : "text-red-400"}`}>
            {loadingBalance ? "..." : formatCurrency(isCredit ? totalFaturaAberta : balance)}
          </p>
          {isCredit && paymentsInMonth > 0 && (
            <p className="mt-1 text-xs text-emerald-400">
              Gastos do mês: {formatCurrency(faturaTotalMes)} • Pago: {formatCurrency(paymentsInMonth)}
            </p>
          )}
        </div>
        {isCredit && totalFaturaAberta > 0 && (
          <Button onClick={() => setIsPayModalOpen(true)} className="sm:w-auto">
            Pagar Fatura
          </Button>
        )}
      </div>

      <PeriodSelector value={period} onChange={setPeriod} />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#F1F0FF]">Movimentações do Mês</h2>
        <div className="rounded-2xl border border-white/5 bg-[#111118] p-5">
          {loadingEntries ? (
            <div className="space-y-2">
              <Skeleton variant="line" height="h-16" />
              <Skeleton variant="line" height="h-16" />
            </div>
          ) : accountEntries.length === 0 ? (
            <EmptyState
              title="Nenhuma movimentação neste mês"
              description="Você ainda não adicionou nenhum lançamento para esta conta."
              action={{
                label: "Novo Lançamento",
                onClick: () => router.push("/lancamentos/novo")
              }}
            />
          ) : (
            accountEntries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                categoryName={categoryNameMap.get(entry.categoryId) ?? "Categoria"}
                onEdit={(e) => router.push(`/lancamentos/editar?id=${e.id}`)}
                onDelete={(e) => {
                  setEntryToDelete(e);
                  setIsDeleteConfirmOpen(true);
                }}
                onTogglePaid={handleTogglePaid}
              />
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={isDeleteConfirmOpen}
        title="Excluir lançamento"
        description="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setEntryToDelete(null);
        }}
      />

      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pagar Fatura"
      >
        <form onSubmit={handleSubmit(handlePayInvoice)} className="px-5 py-6">
          <div className="mb-6 space-y-4">
            <p className="text-sm text-[#A09DC0]">
              O pagamento da fatura registrará uma transferência da conta selecionada no valor de{" "}
              <strong className="text-[#F1F0FF]">{formatCurrency(totalFaturaAberta)}</strong>.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#A09DC0]">Conta de Origem</label>
              <select
                {...register("accountId")}
                className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-[#F1F0FF] outline-none transition-colors focus:border-[#7C3AED]"
              >
                <option value="">Selecione uma conta...</option>
                {checkingAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              {errors.accountId && <p className="text-xs text-red-400">{errors.accountId.message}</p>}
            </div>

            <Input
              label="Data do Pagamento"
              type="date"
              {...register("date")}
              error={errors.date?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" loading={isSubmitting}>
              Pagar Fatura
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPayModalOpen(false)}
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

export default function DetalhesConta() {
  return (
    <Suspense fallback={<div className="py-8 text-[#A09DC0]">Carregando...</div>}>
      <DetalhesContaContent />
    </Suspense>
  );
}
