"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFamily } from "@/hooks/useFamily";
import { getCategories } from "@/lib/firestore/categories";
import { Category } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { useEntries } from "@/hooks/useEntries";
import { parseCSV, parseOFX, guessCategory, DraftEntry } from "@/lib/utils/importParser";
import { getEntriesByDateRange } from "@/lib/firestore/entries";
import { categorizeTransactionsWithAI } from "@/lib/utils/aiCategorizer";
import { Modal } from "@/components/ui/Modal";
import { Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { UploadCloud, CheckCircle, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";

export default function ImportarExtratoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { family } = useFamily();
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    if (family?.id) {
      getCategories(family.id).then(setCategories).catch(console.error);
    }
  }, [family?.id]);

  const { accounts } = useAccounts();
  const { addBatch } = useEntries({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

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
      const unmapped = drafts.filter(d => !d.categoryId).map(d => ({
        id: d.id,
        description: d.description,
        type: d.type
      }));
      
      if (unmapped.length === 0) {
        showToast("Todas as transações já possuem categoria ou não há nada para categorizar!", "info");
        setAiLoading(false);
        return;
      }

      const mapping = await categorizeTransactionsWithAI(unmapped, categories, apiKey);
      
      setDrafts(prev => prev.map(d => {
        if (mapping[d.id]) {
          return { ...d, categoryId: mapping[d.id] };
        }
        return d;
      }));
      
      setShowApiKeyModal(false);
      showToast("Categorização via IA concluída!", "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao categorizar com IA. Verifique sua chave da API.", "error");
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
        parsedEntries = await parseCSV(text);
      } else {
        showToast("Formato não suportado. Por favor, envie um .ofx ou .csv.", "error");
        return;
      }

      if (parsedEntries.length > 0) {
        const dates = parsedEntries.map(d => new Date(d.date + "T12:00:00").getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999);

        const existingEntries = await getEntriesByDateRange(family.id, minDate, maxDate, accountId);
        
        parsedEntries = parsedEntries.filter(draft => {
          const isDuplicate = existingEntries.some(existing => {
            const existingDate = existing.date.toISOString().split("T")[0];
            return existingDate === draft.date &&
                   existing.description === draft.description &&
                   existing.value === draft.value;
          });
          return !isDuplicate;
        });
      }

      if (parsedEntries.length === 0) {
        showToast("Nenhuma nova transação encontrada (todas já foram importadas ou o arquivo está vazio).", "info");
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const entriesWithCategories = parsedEntries.map(e => ({
        ...e,
        categoryId: guessCategory(e.description, categories)
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
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d));
  };

  const updateCategory = (id: string, catId: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, categoryId: catId } : d));
  };

  const updateDescription = (id: string, desc: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, description: desc } : d));
  };

  const deleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleSave = async () => {
    if (!accountId) {
      showToast("Selecione uma conta para atribuir estes lançamentos.", "info");
      return;
    }

    const toSave = drafts.filter(d => d.selected);
    if (toSave.length === 0) return;

    setLoading(true);
    try {
      const payload = toSave.map(d => ({
        type: d.type,
        value: d.value,
        description: d.description,
        date: new Date(d.date + "T12:00:00"),
        categoryId: d.categoryId || "",
        accountId: accountId,
        isCredit: accounts.find(a => a.id === accountId)?.accountType === "credit",
        isRecurring: false,
        isInstallment: false
      }));

      await addBatch(payload);
      showToast("Lançamentos importados com sucesso!", "success");
      router.push("/lancamentos");
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar lançamentos.", "error");
      setLoading(false);
    }
  };

  const selectedCount = drafts.filter(d => d.selected).length;

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
          <p className="text-sm text-[#A09DC0]">Adicione transações em lote via OFX ou CSV</p>
        </div>
      </div>

      {step === 1 && (
        <div className="mx-auto max-w-lg space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A09DC0]">Conta de Destino</label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full"
              options={[
                { value: "", label: "Selecione uma conta..." },
                ...accounts.map(acc => ({ value: acc.id, label: acc.name }))
              ]}
            />
            <p className="text-xs text-[#6B6890]">Todas as transações importadas serão atribuídas a esta conta.</p>
          </div>

          <div 
            onClick={() => accountId ? fileInputRef.current?.click() : showToast('Selecione uma conta primeiro', 'info')}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors ${accountId ? 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10' : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'}`}
          >
            <UploadCloud size={48} className="mb-4 text-[#8B5CF6]" />
            <p className="mb-1 text-center font-medium text-[#F1F0FF]">
              Clique ou arraste um arquivo
            </p>
            <p className="text-center text-sm text-[#A09DC0]">
              Formatos suportados: .ofx, .csv
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
              Lendo arquivo...
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[#A09DC0]">
              <span className="font-bold text-[#F1F0FF]">{selectedCount}</span> transações selecionadas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleCategorizeAI(geminiKey)}
                disabled={aiLoading || drafts.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 px-4 py-2.5 text-sm font-medium text-[#8B5CF6] transition-colors hover:bg-[#8B5CF6]/20 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span className="hidden sm:inline">Categorizar com IA</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading || selectedCount === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#7C3AED] disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Importar Lançamentos
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111118]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.07] bg-white/[0.02] text-xs uppercase text-[#6B6890]">
                  <tr>
                    <th className="px-4 py-3"></th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold text-right">Valor</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {drafts.map((draft) => (
                    <tr key={draft.id} className={`transition-colors hover:bg-white/[0.02] ${!draft.selected ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={draft.selected} 
                          onChange={() => toggleSelect(draft.id)}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#8B5CF6] focus:ring-[#8B5CF6] focus:ring-offset-gray-900"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#A09DC0]">
                        {draft.date.split("-").reverse().join("/")}
                      </td>
                      <td className="min-w-[200px] px-4 py-3">
                        <Input 
                          value={draft.description} 
                          onChange={(e) => updateDescription(draft.id, e.target.value)}
                          className="h-8 bg-transparent text-sm border-white/10"
                        />
                      </td>
                      <td className="min-w-[150px] px-4 py-3">
                        <Select
                          value={draft.categoryId || ""}
                          onChange={(e) => updateCategory(draft.id, e.target.value)}
                          className="h-8 bg-transparent text-sm border-white/10"
                          options={[
                            { value: "", label: "Sem categoria" },
                            ...categories
                              .filter(c => c.type === draft.type)
                              .map(c => ({ value: c.id, label: c.name }))
                          ]}
                        />
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${draft.type === "income" ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {formatCurrency(draft.value)}
                      </td>
                      <td className="px-4 py-3 text-right">
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
        <div className="space-y-4 px-1 pb-2 mt-4">
          <p className="text-sm text-[#A09DC0]">
            Para usar a categorização inteligente, informe sua chave de API do Google Gemini. Ela será salva apenas no seu navegador.
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
