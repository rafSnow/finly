import { Goal } from "@/types";
import { formatCurrency } from "@/lib/utils/format";

type GoalProgress = {
  goal: Goal;
  categoryName: string;
  spent: number;
  progress: number;
};

type GoalProgressListProps = {
  items: GoalProgress[];
};

export function GoalProgressList({ items }: GoalProgressListProps) {
  return (
    <div className="mb-5 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
      <h3 className="mb-3 text-sm font-semibold text-[#F1F0FF]">Progresso das metas</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[#6B6890]">Nenhuma meta cadastrada.</p>
      ) : (
        <div>
          {items.map(({ goal, categoryName, spent, progress }) => {
            const cappedProgress = Math.min(progress, 100);
            const fillClass =
              progress >= 100 ? "bg-red-500" : progress >= 80 ? "bg-amber-400" : "bg-emerald-500";

            return (
              <div key={goal.id} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#A09DC0]">{categoryName}</span>
                  <span className="text-xs text-[#6B6890]">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#1A1A26]">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${fillClass}`}
                    style={{ width: `${cappedProgress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-[#6B6890]">
                  <span>{formatCurrency(spent)}</span>
                  <span>{formatCurrency(goal.limit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
