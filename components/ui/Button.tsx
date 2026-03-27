import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading,
    children,
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  const baseStyle =
    "w-full rounded-xl px-5 py-3 flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_32px_rgba(124,58,237,0.45)] active:scale-[0.98]",
    secondary:
      "bg-[#1A1A26] hover:bg-[#22223A] text-[#F1F0FF] font-medium border border-white/[0.1] hover:border-white/[0.2] active:scale-[0.98]",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/20 hover:border-red-500/40",
    ghost:
      "bg-transparent hover:bg-white/5 text-[#A09DC0] hover:text-[#F1F0FF] px-4 py-2",
  };

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  );
});
