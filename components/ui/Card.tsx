import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  const isInteractive = Boolean(props.onClick);

  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-[#111118] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-200 ${
        isInteractive
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
