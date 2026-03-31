"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { getCategories } from "@/lib/firestore/categories";
import { formatCurrency } from "@/lib/utils/format";
import {
  Category,
  CreateEntryInput,
  Entry,
  RecurrenceInterval,
} from "@/types";
import { useEffect, useMemo, useState } from "react";

type EntryFormSubmitPayload = {
  data: CreateEntryInput;
  recurring?: {
    interval: RecurrenceInterval;
    count: number;
  };
};

interface EntryFormProps {
  initialData?: Entry;
  onSubmit: (payload: EntryFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  canConfigureRecurrence?: boolean;
}

interface FormErrors {
  type?: string;
  value?: string;
  categoryId?: string;
  date?: string;
  description?: string;
  recurrenceInterval?: string;
  recurrenceCount?: string;
}

function parseCurrencyToNumber(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return 0;
  }
  return Number(digits) / 100;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EntryForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  canConfigureRecurrence = true,
}: EntryFormProps) {
  const { family } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [type, setType] = useState<Entry["type"]>(initialData?.type ?? "expense");
  const [valueInput, setValueInput] = useState(
    formatCurrency(initialData?.value ?? 0),
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [dateInput, setDateInput] = useState(
    formatDateInput(initialData?.date ?? new Date()),
  );
  const [description, setDescription] = useState(initialData?.description ?? "");

  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>(
    "monthly",
  );
  const [recurrenceCount, setRecurrenceCount] = useState<number>(2);

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const descriptionId = useMemo(() => `descricao-${crypto.randomUUID()}`, []);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    setType(initialData.type);
    setValueInput(formatCurrency(initialData.value));
    setCategoryId(initialData.categoryId);
    setDateInput(formatDateInput(initialData.date));
    setDescription(initialData.description ?? "");
    setIsRecurring(initialData.isRecurring ?? false);
    setErrors({});
  }, [initialData]);

  useEffect(() => {
    const loadCategories = async () => {
      if (!family?.id) {
        setCategories([]);
        setCategoriesLoading(false);
        return;
      }

      setCategoriesLoading(true);
      try {
        const list = await getCategories(family.id);
        setCategories(list);
      } catch (error) {
        console.error("Erro ao carregar categorias do formulário:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [family?.id]);

  useEffect(() => {
    if (!categoryId) {
      return;
    }

    if (categoriesLoading) {
      return;
    }

    if (categories.length === 0) {
      return;
    }

    const selected = categories.find((category) => category.id === categoryId);
    if (!selected) {
      return;
    }

    if (selected.type !== "both" && selected.type !== type) {
      setCategoryId("");
    }
  }, [categories, categoriesLoading, categoryId, type]);

  const filteredCategories = useMemo(() => {
    const validCategories = categories.filter(
      (category) => category.type === "both" || category.type === type,
    );

    if (!categoryId) {
      return validCategories;
    }

    const alreadyListed = validCategories.some((category) => category.id === categoryId);
    if (alreadyListed) {
      return validCategories;
    }

    const selectedCategory = categories.find((category) => category.id === categoryId);
    if (selectedCategory) {
      return [selectedCategory, ...validCategories];
    }

    return [{ id: categoryId, name: "Categoria atual", type: "both", familyId: "", createdAt: new Date(), isDefault: false }, ...validCategories];
  }, [categories, categoryId, type]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const value = parseCurrencyToNumber(valueInput);

    if (!type) {
      nextErrors.type = "Selecione o tipo do lançamento.";
    }
    if (!value || value <= 0) {
      nextErrors.value = "Informe um valor maior que zero.";
    }
    if (!categoryId) {
      nextErrors.categoryId = "Selecione uma categoria.";
    }

    const selectedDate = new Date(`${dateInput}T00:00:00`);
    if (!dateInput || Number.isNaN(selectedDate.getTime())) {
      nextErrors.date = "Informe uma data válida.";
    }

    if (description.length > 200) {
      nextErrors.description = "A descrição deve ter no máximo 200 caracteres.";
    }

    if (isRecurring) {
      if (!recurrenceInterval) {
        nextErrors.recurrenceInterval = "Selecione o intervalo.";
      }
      if (!Number.isInteger(recurrenceCount) || recurrenceCount < 2 || recurrenceCount > 60) {
        nextErrors.recurrenceCount = "Informe repetições entre 2 e 60.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const payload: EntryFormSubmitPayload = {
      data: {
        type,
        value: parseCurrencyToNumber(valueInput),
        categoryId,
        date: new Date(`${dateInput}T00:00:00`),
        description: description.trim(),
      },
    };

    if (isRecurring) {
      payload.recurring = {
        interval: recurrenceInterval,
        count: recurrenceCount,
      };
    }

    setSaving(true);
    try {
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-6">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#1A1A26] p-1">
          <button
            type="button"
            className={`py-2.5 text-center text-sm font-medium transition-all duration-200 ${
              type === "expense"
                ? "rounded-lg bg-red-500/20 text-red-400"
                : "rounded-lg text-[#6B6890]"
            }`}
            onClick={() => setType("expense")}
          >
            Despesa
          </button>
          <button
            type="button"
            className={`py-2.5 text-center text-sm font-medium transition-all duration-200 ${
              type === "income"
                ? "rounded-lg bg-emerald-500/20 text-emerald-400"
                : "rounded-lg text-[#6B6890]"
            }`}
            onClick={() => setType("income")}
          >
            Receita
          </button>
      </div>
        {errors.type ? <p className="text-sm text-red-500 mt-1">{errors.type}</p> : null}

      <label className="mb-1.5 block text-center text-sm font-medium text-[#A09DC0]">Valor</label>
      <input
        value={valueInput}
        onChange={(event) => {
          const nextValue = parseCurrencyToNumber(event.target.value);
          setValueInput(formatCurrency(nextValue));
        }}
        className="mb-6 w-full border-b-2 border-white/10 bg-transparent py-3 text-center text-4xl font-bold text-[#F1F0FF] outline-none transition-colors duration-200 focus:border-[#7C3AED]"
      />
      {errors.value ? <p className="mb-4 text-center text-sm text-red-400">{errors.value}</p> : null}

      <div className="mb-4 space-y-4 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
        <Select
          label="Categoria"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          options={filteredCategories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          disabled={categoriesLoading}
          error={errors.categoryId}
        />

        <Input
          label="Data"
          type="date"
          value={dateInput}
          onChange={(event) => setDateInput(event.target.value)}
          error={errors.date}
        />

        <div>
          <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-medium text-[#A09DC0]">
            Descricao
          </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={200}
          rows={3}
          className={`w-full rounded-xl border bg-[#1A1A26] px-4 py-3 text-[#F1F0FF] outline-none transition-all duration-200 placeholder:text-[#6B6890] focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)] ${
            errors.description ? "border-red-500/60" : "border-white/8"
          }`}
        />
          <div className="mt-1 flex items-center justify-between">
          {errors.description ? (
              <p className="text-xs text-red-400">{errors.description}</p>
          ) : (
            <span />
          )}
            <p className="text-xs text-[#6B6890]">{description.length}/200</p>
          </div>
        </div>

        {canConfigureRecurrence ? (
          <div className="py-1">
            <label className="flex items-center gap-3 text-sm text-[#A09DC0]">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(event) => setIsRecurring(event.target.checked)}
                className="h-4 w-4 rounded accent-[#7C3AED]"
            />
            Recorrente?
          </label>
          </div>
        ) : null}

        {canConfigureRecurrence && isRecurring ? (
          <div className="mt-3 space-y-3 rounded-xl border border-white/6 bg-[#1A1A26] p-4">
          <Select
            label="Intervalo"
            value={recurrenceInterval}
            onChange={(event) =>
              setRecurrenceInterval(event.target.value as RecurrenceInterval)
            }
            options={[
              { value: "weekly", label: "Semanal" },
              { value: "monthly", label: "Mensal" },
              { value: "yearly", label: "Anual" },
            ]}
            error={errors.recurrenceInterval}
          />
          <Input
            label="Repetições"
            type="number"
            min={2}
            max={60}
            value={String(recurrenceCount)}
            onChange={(event) => setRecurrenceCount(Number(event.target.value))}
            error={errors.recurrenceCount}
          />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export type { EntryFormSubmitPayload };
