"use client";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const title = pathname.split("/")[1] || "Dashboard";

  return (
    <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <h1 className="text-xl font-bold text-center text-gray-800 capitalize">
        {title}
      </h1>
    </header>
  );
}
