"use client";

import {
  EntryForm,
  EntryFormSubmitPayload,
} from "@/components/lancamentos/EntryForm";
import { RecurringScopeModal } from "@/components/lancamentos/RecurringScopeModal";
import { useAuth } from "@/hooks/useAuth";
import { useEntries } from "@/hooks/useEntries";
import { useToast } from "@/hooks/useToast";
import { getEntryById } from "@/lib/firestore/entries";
import { Entry } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function normalizeDescription(value?: string): string {
  return (value ?? "").trim();
}

function getUpdateDataFromPayload(
  currentEntry: Entry,
  payload: EntryFormSubmitPayload,
): Partial<Entry> {
  const nextData: Partial<Entry> = {};

  if (payload.data.type !== currentEntry.type) {
    nextData.type = payload.data.type;
  }
  if (payload.data.value !== currentEntry.value) {
    nextData.value = payload.data.value;
  }
  if (payload.data.categoryId !== currentEntry.categoryId) {
    nextData.categoryId = payload.data.categoryId;
  }
  if (payload.data.date.getTime() !== currentEntry.date.getTime()) {
    nextData.date = payload.data.date;
  }

  const currentDescription = normalizeDescription(currentEntry.description);
  const nextDescription = normalizeDescription(payload.data.description);
  if (currentDescription !== nextDescription) {
    nextData.description = nextDescription;
  }

  return nextData;
}

export default function EditarLancamento() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { family } = useAuth();
  const { showToast } = useToast();

  const now = new Date();
  const { updateEntry } = useEntries({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingData, setPendingData] = useState<Partial<Entry> | null>(null);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);

  useEffect(() => {
    const loadEntry = async () => {
      if (!family?.id || !params?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const found = await getEntryById(family.id, params.id);
        if (!found) {
          setError("Lançamento não encontrado.");
          setEntry(null);
          return;
        }

        setEntry(found);
        setError(null);
      } catch (loadError) {
        console.error("Erro ao carregar lançamento:", loadError);
        setError("Não foi possível carregar o lançamento.");
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, [family?.id, params?.id]);

  const handleSubmit = async (payload: EntryFormSubmitPayload): Promise<void> => {
    if (!entry) {
      return;
    }

    const updateData = getUpdateDataFromPayload(entry, payload);

    if (entry.isRecurring) {
      setPendingData(updateData);
      setScopeModalOpen(true);
      return;
    }

    try {
      await updateEntry(entry.id, updateData, "this");
      showToast("Lancamento salvo com sucesso", "success");
      router.push("/lancamentos");
    } catch {
      showToast("Nao foi possivel salvar o lancamento.", "error");
    }
  };

  const handleScopeSelect = async (
    scope: "this" | "this_and_following" | "all",
  ) => {
    if (!entry || !pendingData) {
      return;
    }

    try {
      await updateEntry(entry.id, pendingData, scope);
      showToast("Lancamento salvo com sucesso", "success");
      setScopeModalOpen(false);
      setPendingData(null);
      router.push("/lancamentos");
    } catch {
      showToast("Nao foi possivel salvar o lancamento.", "error");
    }
  };

  if (loading) {
    return <p className="text-[#A09DC0]">Carregando lançamento...</p>;
  }

  if (!entry || error) {
    return (
      <div className="space-y-3">
        <p className="text-red-400">{error ?? "Lançamento não encontrado."}</p>
        <button
          type="button"
          onClick={() => router.push("/lancamentos")}
          className="text-sm text-[#8B5CF6] transition-colors duration-200 hover:text-[#F1F0FF]"
        >
          Voltar para lançamentos
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-semibold text-[#F1F0FF]">Editar lançamento</h2>
      <EntryForm
        initialData={entry}
        submitLabel="Salvar alterações"
        canConfigureRecurrence={false}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/lancamentos")}
      />

      <RecurringScopeModal
        isOpen={scopeModalOpen}
        onClose={() => {
          setScopeModalOpen(false);
          setPendingData(null);
        }}
        title="Alterar recorrência"
        actionLabel="Alterar"
        onSelect={handleScopeSelect}
      />
    </div>
  );
}
