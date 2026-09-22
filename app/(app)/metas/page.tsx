"use client";

import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { useToast } from "@/hooks/useToast";
import { getCategories } from "@/lib/firestore/categories";
import { formatCurrency } from "@/lib/utils/format";
import { Category, Goal } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Controller } from "react-hook-form";

const goalSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  limitInput: z.string().min(1, "Informe o limite."),
});
type GoalFormValues = z.infer<typeof goalSchema>;

function parseCurrencyToNumber(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export default function Metas() {
  const { family } = useAuth();
  const { showToast } = useToast();
  const { goals, loading, error, createGoal, updateGoal, deleteGoal } = useGoals();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { categoryId: "", limitInput: "" },
  });

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
        setCategories(list.filter((category) => category.type !== "income"));
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [family?.id]);

  const categoryNameMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const openCreateModal = () => {
    setEditingGoal(null);
    reset({ categoryId: "", limitInput: formatCurrency(0) });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    reset({ categoryId: goal.categoryId, limitInput: formatCurrency(goal.limit) });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const onFormSubmit = async (values: GoalFormValues) => {
    try {
      const limitVal = parseCurrencyToNumber(values.limitInput);
      if (limitVal <= 0) {
        showToast("O limite deve ser maior que zero.", "info");
        return;
      }

      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          categoryId: values.categoryId,
          limit: limitVal,
          period: "monthly",
        });
        showToast("Meta salva com sucesso", "success");
      } else {
        await createGoal({
          categoryId: values.categoryId,
          limit: limitVal,
          period: "monthly",
        });
        showToast("Meta salva com sucesso", "success");
      }
      setIsModalOpen(false);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erro ao salvar meta.";
      showToast(message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingGoalId) {
      return;
    }

    try {
      setDeleting(true);
      await deleteGoal(deletingGoalId);
      showToast("Meta excluida", "success");
      setDeletingGoalId(null);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir a meta.";
      showToast(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#F1F0FF]">Metas</h2>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-[#7C3AED] px-5 py-3 font-semibold text-white transition-all duration-200 hover:bg-[#6D28D9] active:scale-[0.98]"
        >
          Nova meta
        </button>
      </div>

      {loading || categoriesLoading ? (
        <div className="space-y-3">
          <Skeleton variant="card" height="h-24" />
          <Skeleton variant="card" height="h-24" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!loading && goals.length === 0 ? (
        <EmptyState
          title="Nenhuma meta cadastrada ainda"
          description="Crie uma meta mensal por categoria"
          action={{
            label: "Nova meta",
            onClick: openCreateModal,
          }}
        />
      ) : null}

      {!loading && goals.length > 0 ? (
        <div>
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="mb-3 rounded-2xl border border-white/[0.07] bg-[#111118] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-[#F1F0FF]">
                {categoryNameMap.get(goal.categoryId) ?? "Categoria"}
                </p>
                <span className="rounded-full bg-[#7C3AED]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8B5CF6]">
                  Mensal
                </span>
              </div>
              <p className="text-lg font-bold text-[#F1F0FF]">
                {formatCurrency(goal.limit)}
                <span className="text-sm font-normal text-[#6B6890]">/mes</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => openEditModal(goal)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => setDeletingGoalId(goal.id)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? "Editar meta" : "Nova meta"}
      >
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Select
            label="Categoria"
            {...register("categoryId")}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            error={errors.categoryId?.message}
          />

          <label className="mb-1.5 block text-center text-sm font-medium text-[#A09DC0]">Limite mensal</label>
          <Controller
            name="limitInput"
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
          {errors.limitInput ? <p className="mb-4 text-center text-sm text-red-400">{errors.limitInput.message}</p> : null}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button type="submit" loading={isSubmitting}>
              Salvar
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={closeModal}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deletingGoalId)}
        title="Excluir meta"
        description="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingGoalId(null)}
      />
    </div>
  );
}
