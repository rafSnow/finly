import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  const generatedId = React.useId();
  const inputId = props.id ?? generatedId;

  return (
    <div className={`mb-4 flex flex-col ${className}`}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-[#A09DC0]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-[#1A1A26] px-4 py-3 text-[#F1F0FF] outline-none transition-all duration-200 placeholder:text-[#6B6890] focus:border-[#7C3AED] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.2)] ${
          error ? "border-red-500/60" : "border-white/8"
        }`}
        {...props}
      />
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}
