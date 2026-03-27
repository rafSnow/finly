"use client";

import {
  EntryForm,
  EntryFormSubmitPayload,
} from "@/components/lancamentos/EntryForm";
import { useEntries } from "@/hooks/useEntries";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

export default function NovoLancamento() {
  const router = useRouter();
  const { showToast } = useToast();
  const now = new Date();
  const { createEntry, createRecurringEntries } = useEntries({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const handleSubmit = async ({
    data,
    recurring,
  }: EntryFormSubmitPayload): Promise<void> => {
    try {
      if (recurring) {
        await createRecurringEntries(data, recurring.interval, recurring.count);
      } else {
        await createEntry(data);
      }

      showToast("Lancamento salvo com sucesso", "success");
      router.push("/lancamentos");
    } catch {
      showToast("Nao foi possivel salvar o lancamento.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold text-[#F1F0FF]">Novo lançamento</h2>
      <EntryForm onSubmit={handleSubmit} onCancel={() => router.push("/lancamentos")} />
    </div>
  );
}
