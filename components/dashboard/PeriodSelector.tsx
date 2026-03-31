import { PeriodFilter } from "@/types";
import { formatMonthYear } from "@/lib/utils/format";

type PeriodSelectorProps = {
  value: PeriodFilter;
  onChange: (next: PeriodFilter) => void;
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const previous = () => {
    const date = new Date(value.year, value.month - 2, 1);
    onChange({ month: date.getMonth() + 1, year: date.getFullYear() });
  };

  const next = () => {
    const date = new Date(value.year, value.month, 1);
    onChange({ month: date.getMonth() + 1, year: date.getFullYear() });
  };

  return (
    <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#111118] px-5 py-3.5">
      <button
        type="button"
        onClick={previous}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-[#1A1A26] text-[#A09DC0] transition-all duration-200 hover:bg-[#22223A] hover:text-[#F1F0FF]"
        aria-label="Periodo anterior"
      >
        &lt;
      </button>
      <p className="text-base font-semibold capitalize text-[#F1F0FF]">
        {formatMonthYear(value.month, value.year)}
      </p>
      <button
        type="button"
        onClick={next}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-[#1A1A26] text-[#A09DC0] transition-all duration-200 hover:bg-[#22223A] hover:text-[#F1F0FF]"
        aria-label="Proximo periodo"
      >
        &gt;
      </button>
    </div>
  );
}
