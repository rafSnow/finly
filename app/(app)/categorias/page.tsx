"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { useFamily } from "@/hooks/useFamily";
import { useToast } from "@/hooks/useToast";
import {
  createCategory,
  createDefaultCategories,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/firestore/categories";
import { Category } from "@/types";
import { getCategoryIcon } from "@/lib/utils/categoryIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "O nome da categoria é obrigatório.").trim(),
  type: z.enum(["expense", "income", "both"]),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryType = Category["type"];

const TYPE_OPTIONS = [
  { value: "expense", label: "Despesa" },
  { value: "income", label: "Receita" },
  { value: "both", label: "Ambos" },
];

export default function Categorias() {
  const { family, loading: familyLoading } = useFamily();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", type: "expense" },
  });

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === activeTab),
    [activeTab, categories],
  );

  const loadCategories = useCallback(async () => {
    if (!family) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      let list = await getCategories(family.id);
      if (list.length === 0) {
        await createDefaultCategories(family.id);
        list = await getCategories(family.id);
      }
      setCategories(list);
    } catch (loadError) {
      console.error("Erro ao carregar categorias:", loadError);
      setError("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }, [family]);

  useEffect(() => {
    if (familyLoading) {
      return;
    }

    loadCategories();
  }, [familyLoading, loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ name: "", type: "expense" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({ name: category.name, type: category.type });
    setIsModalOpen(true);
  };

  const onFormSubmit = async (values: CategoryFormValues) => {
    if (!family) return;
    setError("");

    try {
      if (editingCategory) {
        await updateCategory(family.id, editingCategory.id, {
          name: values.name,
          type: values.type,
        });
      } else {
        await createCategory(family.id, {
          name: values.name,
          type: values.type,
          isDefault: false,
        });
      }
      setIsModalOpen(false);
      showToast("Categoria salva", "success");
      await loadCategories();
    } catch (saveError) {
      console.error("Erro ao salvar categoria:", saveError);
      setError("Não foi possível salvar a categoria.");
      showToast("Nao foi possivel salvar a categoria.", "error");
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) {
      return;
    }

    if (!family) {
      return;
    }

    setError("");
    try {
      setDeleting(true);
      const result = await deleteCategory(family.id, categoryToDelete.id);
      if (!result.success && result.reason === "has_entries") {
        setError("Esta categoria possui lançamentos e não pode ser excluída");
        showToast("Esta categoria possui lancamentos e nao pode ser excluida", "error");
        return;
      }

      showToast("Categoria excluida", "success");
      setCategoryToDelete(null);
      await loadCategories();
    } catch (deleteError) {
      console.error("Erro ao excluir categoria:", deleteError);
      setError("Não foi possível excluir a categoria.");
      showToast("Nao foi possivel excluir a categoria.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || familyLoading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="card" height="h-24" />
        <Skeleton variant="card" height="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[#F1F0FF]">Categorias</h2>
        <Button onClick={openCreateModal} className="w-auto px-4 py-2">
          Nova categoria
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-3 rounded-xl bg-[#1A1A26] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          className={`rounded-lg py-2 text-center text-xs font-medium ${
            activeTab === "expense"
              ? "bg-[#111118] text-[#F1F0FF] shadow-sm"
              : "text-[#6B6890]"
          }`}
        >
          Despesas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("income")}
          className={`rounded-lg py-2 text-center text-xs font-medium ${
            activeTab === "income"
              ? "bg-[#111118] text-[#F1F0FF] shadow-sm"
              : "text-[#6B6890]"
          }`}
        >
          Receitas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("both")}
          className={`rounded-lg py-2 text-center text-xs font-medium ${
            activeTab === "both"
              ? "bg-[#111118] text-[#F1F0FF] shadow-sm"
              : "text-[#6B6890]"
          }`}
        >
          Ambos
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria encontrada"
          description="Crie sua primeira categoria para organizar lancamentos"
          action={{
            label: "Nova categoria",
            onClick: openCreateModal,
          }}
        />
      ) : (
        <Card>
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-[#6B6890]">Nenhuma categoria neste filtro.</p>
          ) : (
            <ul>
              {filteredCategories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-3.5 last:border-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div 
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1A1A26]"
                    >
                      {(() => {
                        const Icon = getCategoryIcon(category.name, category.type === "income");
                        return (
                          <Icon 
                            className={`h-5 w-5 ${
                              category.type === "expense"
                                ? "text-red-400"
                                : category.type === "income"
                                  ? "text-emerald-400"
                                  : "text-[#8B5CF6]"
                            }`} 
                          />
                        );
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#F1F0FF]">{category.name}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          category.type === "expense"
                            ? "bg-red-500/10 text-red-400"
                            : category.type === "income"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-[#7C3AED]/10 text-[#8B5CF6]"
                        }`}
                      >
                        {TYPE_OPTIONS.find((option) => option.value === category.type)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(category)}
                      className="text-sm text-[#A09DC0] transition-colors duration-200 hover:text-[#F1F0FF]"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(category)}
                      className="text-sm text-red-400 transition-colors duration-200 hover:text-red-300"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Editar categoria" : "Nova categoria"}
      >
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Input
            label="Nome"
            {...register("name")}
            error={errors.name?.message}
          />
          <Select
            label="Tipo"
            {...register("type")}
            options={TYPE_OPTIONS}
            error={errors.type?.message}
          />
          <div className="mt-6 flex gap-2">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Salvar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(categoryToDelete)}
        title="Excluir categoria"
        description={categoryToDelete ? `Deseja excluir a categoria \"${categoryToDelete.name}\"?` : "Deseja excluir esta categoria?"}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
