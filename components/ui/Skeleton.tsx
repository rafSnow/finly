interface SkeletonProps {
  variant: "card" | "line" | "circle";
  width?: string;
  height?: string;
}

export function Skeleton({ variant, width = "w-full", height }: SkeletonProps) {
  const variantClass = {
    card: "rounded-xl",
    line: "rounded-xl",
    circle: "rounded-full",
  }[variant];

  const fallbackHeight = height ?? (variant === "line" ? "h-4" : variant === "circle" ? "h-10" : "h-24");

  return (
    <div
      className={`bg-gradient-to-r from-[#1A1A26] via-[#22223A] to-[#1A1A26] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] ${variantClass} ${width} ${fallbackHeight}`}
    />
  );
}
