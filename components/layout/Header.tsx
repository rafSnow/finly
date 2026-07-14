"use client";
import { usePathname } from "next/navigation";
import { AlertsDropdown } from "./AlertsDropdown";

export function Header() {
  const pathname = usePathname();
  const title = pathname.split("/")[1] || "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.07] bg-[#0A0A0F]/80 px-5 py-4 backdrop-blur-md">
      <div className="flex flex-1 items-center justify-start">
        {/* Placeholder para balancear o título no centro se necessário */}
      </div>
      
      <h1 className="truncate text-center text-base font-semibold capitalize tracking-tight text-[#F1F0FF]">
        {title}
      </h1>

      <div className="flex flex-1 items-center justify-end">
        <AlertsDropdown />
      </div>
    </header>
  );
}
