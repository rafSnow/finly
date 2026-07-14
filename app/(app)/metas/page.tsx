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

const goalSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  limit: z.number().positive("Informe um valor de limite valido."),
});
type GoalFormValues = z.infer<typeof goalSchema>;

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
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { categoryId: "", limit: undefined },
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
    reset({ categoryId: "", limit: undefined });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    reset({ categoryId: goal.categoryId, limit: goal.limit });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const onFormSubmit = async (values: GoalFormValues) => {
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          categoryId: values.categoryId,
          limit: values.limit,
          period: "monthly",
        });
        showToast("Meta salva com sucesso", "success");
      } else {
        await createGoal({
          categoryId: values.categoryId,
          limit: values.limit,
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

          <Input
            label="Limite mensal"
            type="number"
            min={0}
            step="0.01"
            {...register("limit", { valueAsNumber: true })}
            error={errors.limit?.message}
          />

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
        description="Deseja excluir esta meta?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingGoalId(null)}
      />
    </div>
  );
}
