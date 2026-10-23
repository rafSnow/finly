"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFamily } from "@/hooks/useFamily";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useEntries } from "@/hooks/useEntries";
import {
  parseCSV,
  parseOFX,
  guessCategory,
  saveLearnedCategoryRules,
  DraftEntry,
} from "@/lib/utils/importParser";
import { getEntriesByDateRange } from "@/lib/firestore/entries";
import { categorizeTransactionsWithAI } from "@/lib/utils/aiCategorizer";
import { Modal } from "@/components/ui/Modal";
import {
  Sparkles,
  UploadCloud,
  CheckCircle,
  Trash2,
  ArrowLeft,
  Loader2,
  Users,
  User,
  BrainCircuit,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";

export default function ImportarExtratoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { family } = useFamily();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { addBatch } = useEntries({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [accountId, setAccountId] = useState("");
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) setGeminiKey(savedKey);
  }, []);

  const { showToast } = useToast();

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isCreditCard = selectedAccount?.accountType === "credit";

  const handleCategorizeAI = async (keyToUse: string) => {
    const apiKey = keyToUse || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    if (keyToUse && keyToUse !== process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      localStorage.setItem("gemini_api_key", keyToUse);
    }

    setAiLoading(true);
    try {
      const unmapped = drafts
        .filter((d) => !d.categoryId)
        .map((d) => ({
          id: d.id,
          description: d.description,
          type: d.type,
        }));

      if (unmapped.length === 0) {
        showToast(
          "Todas as transações já possuem categoria atribuída!",
          "info"
        );
        setAiLoading(false);
        return;
      }

      const mapping = await categorizeTransactionsWithAI(
        unmapped,
        categories,
        apiKey
      );

      setDrafts((prev) =>
        prev.map((d) => {
          if (mapping[d.id]) {
            return { ...d, categoryId: mapping[d.id] };
          }
          return d;
        })
      );

      setShowApiKeyModal(false);
      showToast("Categorização via IA concluída!", "success");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      showToast(`Erro da IA: ${msg}`, "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!family?.id) {
      showToast("Família não encontrada.", "error");
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      let parsedEntries: DraftEntry[] = [];

      if (file.name.toLowerCase().endsWith(".ofx")) {
        parsedEntries = parseOFX(text);
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        parsedEntries = await parseCSV(text, { isCreditCard });
      } else {
        showToast(
          "Formato não suportado. Por favor, envie um .ofx ou .csv.",
          "error"
        );
        return;
      }

      if (parsedEntries.length > 0) {
        const dates = parsedEntries.map((d) =>
          new Date(d.date + "T12:00:00").getTime()
        );
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999);

        const existingEntries = await getEntriesByDateRange(
          family.id,
          minDate,
          maxDate,
          accountId
        );

        parsedEntries = parsedEntries.filter((draft) => {
          const isDuplicate = existingEntries.some((existing) => {
            const existingDate = existing.date.toISOString().split("T")[0];
            return (
              existingDate === draft.date &&
              existing.description === draft.description &&
              Math.abs(existing.value - draft.value) < 0.01
            );
          });
          return !isDuplicate;
        });
      }

      if (parsedEntries.length === 0) {
        showToast(
          "Nenhuma nova transação encontrada (todas já foram importadas ou o arquivo está vazio).",
          "info"
        );
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const entriesWithCategories = parsedEntries.map((entry) => ({
        ...entry,
        categoryId: guessCategory(entry.description, categories, family.id),
      }));

      setDrafts(entriesWithCategories);
      setStep(2);
    } catch (err) {
      console.error(err);
      showToast("Erro ao processar o arquivo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const toggleShared = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isShared: !d.isShared } : d))
    );
  };

  const toggleType = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              type: d.type === "expense" ? "income" : "expense",
              categoryId: undefined,
            }
          : d
      )
    );
  };

  const updateCategory = (id: string, catId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, categoryId: catId } : d))
    );
  };

  const updateDescription = (id: string, desc: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, description: desc } : d))
    );
  };

  const deleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSave = async () => {
    if (!accountId) {
      showToast("Selecione uma conta para atribuir estes lançamentos.", "info");
      return;
    }

    const toSave = drafts.filter((d) => d.selected);
    if (toSave.length === 0) return;

    setLoading(true);
    try {
      // Salva regras aprendidas na memória inteligente da família
      saveLearnedCategoryRules(
        family?.id,
        toSave.map((d) => ({
          description: d.description,
          categoryId: d.categoryId,
        }))
      );

      const fallbackCategory = categories[0]?.id ?? "";

      const payload = toSave.map((d) => ({
        type: d.type,
        value: d.value,
        description: d.description,
        date: new Date(d.date + "T12:00:00"),
        categoryId: d.categoryId || fallbackCategory,
        accountId: accountId,
        isCredit: isCreditCard,
        isPaid: true,
        isShared: d.isShared,
        isRecurring: false,
        isInstallment: false,
      }));

      await addBatch(payload);
      showToast(
        `${toSave.length} lançamentos importados e categorias memorizadas!`,
        "success"
      );
      router.push("/lancamentos");
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar lançamentos.", "error");
      setLoading(false);
    }
  };

  const selectedDrafts = drafts.filter((d) => d.selected);
  const selectedCount = selectedDrafts.length;
  const autoCategorizedCount = selectedDrafts.filter((d) => Boolean(d.categoryId)).length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link
          href="/lancamentos"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-[#A09DC0] transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-[#F1F0FF]">Importar Extrato</h2>
          <p className="text-sm text-[#A09DC0]">
            Adicione transações em lote via OFX ou CSV com memória inteligente de categorias
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="mx-auto max-w-lg space-y-6">
          <div className="space-y-2">
            <Select
              label="Conta ou Cartão de Destino"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full"
              options={[
                { value: "", label: "Selecione uma conta..." },
                ...accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.name} (${
                    acc.accountType === "credit"
                      ? "Cartão de Crédito"
                      : acc.accountType === "investment"
                      ? "Investimento"
                      : "Conta Corrente"
                  })`,
                })),
              ]}
            />
            <p className="text-xs text-[#6B6890]">
              {isCreditCard
                ? "Modo Fatura de Cartão ativo: compras positivas em CSVs (ex: Nubank) serão identificadas automaticamente como despesas."
                : "Todas as transações importadas serão atribuídas a esta conta com detecção anti-duplicidade."}
            </p>
          </div>

          <div
            onClick={() =>
              accountId
                ? fileInputRef.current?.click()
                : showToast("Selecione uma conta primeiro", "info")
            }
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors ${
              accountId
                ? "border-white/20 bg-white/5 hover:border-[#8B5CF6]/60 hover:bg-white/10"
                : "cursor-not-allowed border-white/10 bg-white/5 opacity-50"
            }`}
          >
            <UploadCloud size={48} className="mb-4 text-[#8B5CF6]" />
            <p className="mb-1 text-center font-medium text-[#F1F0FF]">
              Clique para selecionar seu arquivo .OFX ou .CSV
            </p>
            <p className="text-center text-xs text-[#A09DC0]">
              Compatível com Nubank, Itaú, Bradesco, Inter, Santander, BB, C6 e XP
            </p>
            <input
              type="file"
              accept=".ofx,.csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#A09DC0]">
              <Loader2 size={16} className="animate-spin" />
              Processando transações e aplicando regras inteligentes...
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#111118] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#A09DC0]">
                <span className="font-bold text-[#F1F0FF]">{selectedCount}</span>{" "}
                transações selecionadas
              </p>
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <BrainCircuit size={14} />
                {autoCategorizedCount} de {selectedCount} categorizadas automaticamente (regras + histórico)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategorizeAI(geminiKey)}
                disabled={aiLoading || drafts.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 px-4 py-2.5 text-sm font-medium text-[#8B5CF6] transition-colors hover:bg-[#8B5CF6]/20 disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>Categorizar restantes com IA</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading || selectedCount === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Importar ({selectedCount})
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111118]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.07] bg-white/[0.02] text-xs uppercase text-[#6B6890]">
                  <tr>
                    <th className="px-3 py-3"></th>
                    <th className="px-3 py-3 font-semibold">Data</th>
                    <th className="px-3 py-3 font-semibold">Descrição</th>
                    <th className="px-3 py-3 font-semibold">Categoria</th>
                    <th className="px-3 py-3 font-semibold text-center">Divisão</th>
                    <th className="px-3 py-3 font-semibold text-right">Valor</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {drafts.map((draft) => (
                    <tr
                      key={draft.id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        !draft.selected ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={draft.selected}
                          onChange={() => toggleSelect(draft.id)}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#8B5CF6] focus:ring-[#8B5CF6]"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-[#A09DC0]">
                        {draft.date.split("-").reverse().join("/")}
                      </td>
                      <td className="min-w-[190px] px-3 py-3">
                        <Input
                          value={draft.description}
                          onChange={(e) =>
                            updateDescription(draft.id, e.target.value)
                          }
                          className="h-8 border-white/10 bg-transparent text-sm"
                        />
                      </td>
                      <td className="min-w-[160px] px-3 py-3">
                        <Select
                          value={draft.categoryId || ""}
                          onChange={(e) =>
                            updateCategory(draft.id, e.target.value)
                          }
                          className="h-8 border-white/10 bg-transparent text-sm"
                          options={[
                            { value: "", label: "Selecionar..." },
                            ...categories
                              .filter(
                                (c) =>
                                  c.type === "both" || c.type === draft.type
                              )
                              .map((c) => ({ value: c.id, label: c.name })),
                          ]}
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        {draft.type === "expense" ? (
                          <button
                            type="button"
                            onClick={() => toggleShared(draft.id)}
                            title={
                              draft.isShared
                                ? "Despesa Conjunta (Casa) — clique para tornar Individual"
                                : "Despesa Individual — clique para tornar Conjunta"
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                              draft.isShared
                                ? "bg-[#7C3AED]/15 text-[#C4B5FD]"
                                : "bg-white/5 text-[#A09DC0]"
                            }`}
                          >
                            {draft.isShared ? (
                              <>
                                <Users size={12} />
                                Casal
                              </>
                            ) : (
                              <>
                                <User size={12} />
                                Indiv.
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-[#6B6890]">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleType(draft.id)}
                          title="Clique para alternar entre Despesa e Receita"
                          className={`font-medium transition-opacity hover:opacity-80 ${
                            draft.type === "income"
                              ? "text-[#10B981]"
                              : "text-[#EF4444]"
                          }`}
                        >
                          {draft.type === "income" ? "+ " : "- "}
                          {formatCurrency(draft.value)}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => deleteDraft(draft.id)}
                          className="text-[#6B6890] hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title="Chave da API do Google Gemini"
      >
        <div className="mt-4 space-y-4 px-1 pb-2">
          <p className="text-sm text-[#A09DC0]">
            Para usar a categorização inteligente com IA, informe sua chave de API do Google Gemini. Ela será salva apenas no seu navegador.
          </p>
          <Input
            label="API Key"
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleCategorizeAI(geminiKey)}
              disabled={!geminiKey}
              className="flex-1 rounded-xl bg-[#8B5CF6] py-2 font-medium text-white hover:bg-[#7C3AED] disabled:opacity-50"
            >
              Salvar e Categorizar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
