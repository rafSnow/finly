"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const tabs = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    { name: "Lançamentos", path: "/lancamentos", icon: "💸" },
    { name: "Metas", path: "/metas", icon: "🎯" },
    { name: "Categorias", path: "/categorias", icon: "🏷️" },
    { name: "Ajustes", path: "/ajustes", icon: "⚙️" },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around pb-safe">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center p-3 text-xs ${isActive ? "text-blue-600 font-bold" : "text-gray-500"}`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
