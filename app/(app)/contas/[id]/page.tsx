"use client";

import { useAccounts, useAccountBalance } from "@/hooks/useAccounts";
import { useEntries } from "@/hooks/useEntries";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Wallet } from "lucide-react";
import { EntryItem } from "@/components/lancamentos/EntryItem";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEntry } from "@/lib/firestore/entries";

const payInvoiceSchema = z.object({
  accountId: z.string().min(1, "Selecione uma conta"),
  date: z.string().min(1, "A data é obrigatória"),
});
type PayInvoiceForm = z.infer<typeof payInvoiceSchema>;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function ContaDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { accounts, loading: loadingAccounts } = useAccounts();
  const account = accounts.find((a) => a.id === params?.id);
  const { balance, loading: loadingBalance } = useAccountBalance(params?.id ?? "");

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentMonthState, setCurrentMonthState] = useState(new Date().getMonth() + 1); // for filters
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const { family } = useAuth();

  const { entries, loading: loadingEntries, deleteEntry } = useEntries({
    month: currentMonth,
    year: currentYear,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PayInvoiceForm>({
    resolver: zodResolver(payInvoiceSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    }
  });

  const accountEntries = entries.filter((e) => e.accountId === account?.id);
  const checkingAccounts = accounts.filter(a => a.accountType !== "credit");

  if (loadingAccounts) {
    return <div className="p-8 text-[#A09DC0]">Carregando...</div>;
  }

  if (!account) {
    return (
      <div className="p-8">
        <p className="text-red-400 mb-4">Conta não encontrada.</p>
        <button onClick={() => router.push("/contas")} className="text-[#8B5CF6]">Voltar</button>
      </div>
    );
  }

  const isCredit = account.accountType === "credit";
  const totalFatura = accountEntries.reduce((sum, e) => sum + e.value, 0);
  
  const handlePayInvoice = async (values: PayInvoiceForm) => {
    if (!family?.id) return;
    try {
      await createEntry(family.id, {
        type: "expense",
        value: totalFatura,
        categoryId: "", // maybe create a "Fatura de Cartão" category in the future
        accountId: values.accountId,
        date: new Date(values.date),
        description: `Pagamento Fatura ${account.name}`,
      });

      // Aqui poderíamos marcar os entries como 'pagos', mas para MVP, o lançamento na corrente já regula o saldo real.
      setIsPayModalOpen(false);
      reset();
      alert("Fatura paga com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao pagar fatura.");
    }
  };

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/contas")}
          className="rounded-lg p-2 text-[#6B6890] transition-colors hover:bg-white/5 hover:text-[#F1F0FF]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A1A26] ${isCredit ? "text-orange-500" : "text-[#7C3AED]"}`}>
          {isCredit ? <CreditCard size={24} /> : <Wallet size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F1F0FF]">{account.name}</h1>
          <p className="text-sm text-[#A09DC0]">
            {isCredit ? `Cartão de Crédito • Vence dia ${account.dueDay}` : "Conta Corrente / Carteira"}
          </p>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between rounded-2xl border border-white/5 bg-[#111118] p-6">
        <div>
          <p className="text-sm font-medium text-[#6B6890]">
            {isCredit ? "Fatura do Mês (aprox.)" : "Saldo Atual"}
          </p>
          <p className={`mt-1 text-3xl font-bold ${isCredit || balance >= 0 ? "text-[#F1F0FF]" : "text-red-400"}`}>
            {loadingBalance ? "..." : formatCurrency(isCredit ? totalFatura : Math.abs(balance))}
          </p>
        </div>
        {isCredit && (
          <Button onClick={() => setIsPayModalOpen(true)}>
            Pagar Fatura
          </Button>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#F1F0FF]">Movimentações do Mês</h2>
        <div className="rounded-2xl border border-white/5 bg-[#111118] p-5">
          {loadingEntries ? (
            <p className="text-[#A09DC0]">Carregando...</p>
          ) : accountEntries.length === 0 ? (
            <p className="text-[#A09DC0]">Nenhuma movimentação encontrada neste mês.</p>
          ) : (
            accountEntries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                categoryName="-"
                onEdit={(e) => router.push(`/lancamentos/${e.id}/editar`)}
                onDelete={(e) => {
                  if (confirm("Excluir lançamento?")) {
                    deleteEntry(e.id, "this");
                  }
                }}
              />
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pagar Fatura"
      >
        <form onSubmit={handleSubmit(handlePayInvoice)} className="px-5 py-6">
          <div className="mb-6 space-y-4">
            <p className="text-sm text-[#A09DC0]">
              O pagamento da fatura criará uma despesa na conta selecionada no valor de <strong className="text-[#F1F0FF]">{formatCurrency(totalFatura)}</strong>.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#A09DC0]">Conta de Origem</label>
              <select
                {...register("accountId")}
                className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-[#F1F0FF] outline-none transition-colors focus:border-[#7C3AED]"
              >
                <option value="">Selecione uma conta...</option>
                {checkingAccounts.map(acc => (
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
