import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;

    return (
      <div className={cn("mb-4 flex flex-col", className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-[#A09DC0]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-xl border bg-[#1A1A26] px-4 py-3 pr-10 text-[#F1F0FF] outline-none transition-all duration-200 focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)]",
              error ? "border-red-500/60" : "border-white/8"
            )}
            {...props}
          >
            <option value="" disabled hidden>
              Selecione...
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6890]" />
        </div>
        {error && (
          <span className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
