"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { useAccounts } from "@/hooks/useAccounts";
import { getCategories } from "@/lib/firestore/categories";
import {
  Category,
  CreateEntryInput,
  Entry,
  RecurrenceInterval,
} from "@/types";
import { useEffect, useMemo, useState, useId } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const entrySchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  valueInput: z.string().min(1, "Informe o valor."),
  accountId: z.string().min(1, "Selecione uma conta."),
  destinationAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  dateInput: z.string().min(1, "Informe uma data."),
  description: z.string().max(200, "Máximo de 200 caracteres.").optional(),
  repetitionType: z.enum(["none", "recurring", "installment"]),
  recurrenceInterval: z.enum(["weekly", "monthly", "yearly"]).optional(),
  recurrenceCount: z.number().min(2, "Mínimo 2").max(60, "Máximo 60").optional(),
}).superRefine((data, ctx) => {
  if (data.type !== "transfer" && !data.categoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione uma categoria.", path: ["categoryId"] });
  }
  if (data.type === "transfer") {
    if (!data.destinationAccountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione a conta destino.", path: ["destinationAccountId"] });
    } else if (data.destinationAccountId === data.accountId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A conta destino deve ser diferente.", path: ["destinationAccountId"] });
    }
  }
  if (data.repetitionType !== "none") {
    if (!data.recurrenceInterval) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o intervalo.", path: ["recurrenceInterval"] });
    }
    if (!data.recurrenceCount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a quantidade.", path: ["recurrenceCount"] });
    }
  }
});

type EntryFormValues = z.infer<typeof entrySchema>;

export type EntryFormSubmitPayload = {
  data: CreateEntryInput;
  recurring?: {
    interval: RecurrenceInterval;
    count: number;
    isInstallment: boolean;
  };
};

interface EntryFormProps {
  initialData?: Entry;
  onSubmit: (payload: EntryFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  canConfigureRecurrence?: boolean;
}

function parseCurrencyToNumber(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
  const { accounts, loading: accountsLoading } = useAccounts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      type: initialData?.type ?? "expense",
      valueInput: formatCurrency(initialData?.value ?? 0),
      accountId: initialData?.accountId ?? "",
      destinationAccountId: initialData?.destinationAccountId ?? "",
      categoryId: initialData?.categoryId ?? "",
      dateInput: formatDateInput(initialData?.date ?? new Date()),
      description: initialData?.description ?? "",
      repetitionType: initialData?.isInstallment
        ? "installment"
        : initialData?.isRecurring
        ? "recurring"
        : "none",
      recurrenceInterval: "monthly",
      recurrenceCount: 2,
    },
  });

  const type = watch("type");
  const categoryId = watch("categoryId");
  const repetitionType = watch("repetitionType");
  const description = watch("description") ?? "";

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
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCategories();
  }, [family?.id]);

  useEffect(() => {
    if (!categoryId || categoriesLoading || categories.length === 0 || type === "transfer") return;
    const selected = categories.find((c) => c.id === categoryId);
    if (!selected) return;
    if (selected.type !== "both" && selected.type !== type) {
      setValue("categoryId", "", { shouldValidate: true });
    }
  }, [categories, categoriesLoading, categoryId, type, setValue]);

  const filteredCategories = useMemo(() => {
    const valid = categories.filter((c) => c.type === "both" || c.type === type);
    if (!categoryId) return valid;
    if (valid.some((c) => c.id === categoryId)) return valid;
    const selected = categories.find((c) => c.id === categoryId);
    if (selected) return [selected, ...valid];
    return [
      { id: categoryId, name: "Categoria atual", type: "both", familyId: "", createdAt: new Date(), isDefault: false },
      ...valid,
    ];
  }, [categories, categoryId, type]);

  const onFormSubmit = async (values: EntryFormValues) => {
    const numValue = parseCurrencyToNumber(values.valueInput);
    if (numValue <= 0) {
      // Manual error if 0 since zod checks string presence
      return;
    }

    const payload: EntryFormSubmitPayload = {
      data: {
        type: values.type,
        value: numValue,
        accountId: values.accountId,
        destinationAccountId: values.destinationAccountId,
        categoryId: values.type === "transfer" ? "" : (values.categoryId || ""),
        date: new Date(`${values.dateInput}T00:00:00`),
        description: values.description?.trim(),
      },
    };

    if (values.repetitionType !== "none" && values.recurrenceInterval && values.recurrenceCount) {
      payload.recurring = {
        interval: values.recurrenceInterval,
        count: values.recurrenceCount,
        isInstallment: values.repetitionType === "installment",
      };
    }

    await onSubmit(payload);
  };

  const descriptionId = useId();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto px-5 py-6">
      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-[#1A1A26] p-1">
        <button
          type="button"
          className={`py-2.5 text-center text-sm font-medium transition-all duration-200 ${
            type === "expense" ? "rounded-lg bg-red-500/20 text-red-400" : "rounded-lg text-[#6B6890]"
          }`}
          onClick={() => setValue("type", "expense")}
        >
          Despesa
        </button>
        <button
          type="button"
          className={`py-2.5 text-center text-sm font-medium transition-all duration-200 ${
            type === "income" ? "rounded-lg bg-emerald-500/20 text-emerald-400" : "rounded-lg text-[#6B6890]"
          }`}
          onClick={() => setValue("type", "income")}
        >
          Receita
        </button>
        <button
          type="button"
          className={`py-2.5 text-center text-sm font-medium transition-all duration-200 ${
            type === "transfer" ? "rounded-lg bg-indigo-500/20 text-indigo-400" : "rounded-lg text-[#6B6890]"
          }`}
          onClick={() => {
             setValue("type", "transfer");
             setValue("categoryId", "");
          }}
        >
          Transf.
        </button>
      </div>

      <label className="mb-1.5 block text-center text-sm font-medium text-[#A09DC0]">Valor</label>
      <Controller
        name="valueInput"
        control={control}
        render={({ field }) => (
          <input
            {...field}
            onChange={(e) => {
              const val = parseCurrencyToNumber(e.target.value);
              field.onChange(formatCurrency(val));
            }}
            className="mb-6 w-full border-b-2 border-white/10 bg-transparent py-3 text-center text-4xl font-bold text-[#F1F0FF] outline-none transition-colors duration-200 focus:border-[#7C3AED]"
          />
        )}
      />
      {errors.valueInput ? <p className="mb-4 text-center text-sm text-red-400">{errors.valueInput.message}</p> : null}

      <div className="mb-4 space-y-4 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
        <Select
          label={type === "transfer" ? "Conta Origem" : "Conta"}
          {...register("accountId")}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          disabled={accountsLoading}
          error={errors.accountId?.message}
        />

        {type === "transfer" ? (
          <Select
            label="Conta Destino"
            {...register("destinationAccountId")}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            disabled={accountsLoading}
            error={errors.destinationAccountId?.message}
          />
        ) : (
          <Select
            label="Categoria"
            {...register("categoryId")}
            options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
            disabled={categoriesLoading}
            error={errors.categoryId?.message}
          />
        )}

        <Input
          label="Data"
          type="date"
          {...register("dateInput")}
          error={errors.dateInput?.message}
        />

        <div>
          <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-medium text-[#A09DC0]">
            Descricao
          </label>
          <textarea
            id={descriptionId}
            {...register("description")}
            maxLength={200}
            rows={3}
            className={`w-full rounded-xl border bg-[#1A1A26] px-4 py-3 text-[#F1F0FF] outline-none transition-all duration-200 placeholder:text-[#6B6890] focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)] ${
              errors.description ? "border-red-500/60" : "border-white/8"
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.description ? (
              <p className="text-xs text-red-400">{errors.description.message}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-[#6B6890]">{description.length}/200</p>
          </div>
        </div>

        {canConfigureRecurrence ? (
          <div className="py-1">
            <Select
              label="Tipo de Repetição"
              {...register("repetitionType")}
              options={[
                { value: "none", label: "Não repete" },
                { value: "recurring", label: "Recorrente (Ex: Assinatura)" },
                { value: "installment", label: "Parcelado (Ex: Cartão)" },
              ]}
            />
          </div>
        ) : null}

        {canConfigureRecurrence && repetitionType !== "none" ? (
          <div className="mt-3 space-y-3 rounded-xl border border-white/6 bg-[#1A1A26] p-4">
            <Select
              label="Intervalo"
              {...register("recurrenceInterval")}
              options={[
                { value: "weekly", label: "Semanal" },
                { value: "monthly", label: "Mensal" },
                { value: "yearly", label: "Anual" },
              ]}
              error={errors.recurrenceInterval?.message}
            />
            <Input
              label={repetitionType === "installment" ? "Número de Parcelas" : "Repetições"}
              type="number"
              min={2}
              max={60}
              {...register("recurrenceCount", { valueAsNumber: true })}
              error={errors.recurrenceCount?.message}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
