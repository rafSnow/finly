"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
  Tag,
  Target,
  Wallet,
  TrendingUp,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const tabs = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Contas", path: "/contas", icon: Wallet },
    { name: "Lançamentos", path: "/lancamentos", icon: ArrowLeftRight },
    { name: "Metas", path: "/metas", icon: Target },
    { name: "Categorias", path: "/categorias", icon: Tag },
    { name: "Patrimônio", path: "/patrimonio", icon: TrendingUp },
    { name: "Ajustes", path: "/ajustes", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[#0A0A0F]/90 pb-safe backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium tracking-wide transition-colors duration-200 ${
              isActive ? "text-[#8B5CF6]" : "text-[#6B6890] hover:text-[#A09DC0]"
            }`}
          >
            <span className="mb-0.5 h-1 w-1 rounded-full bg-transparent">
              {isActive ? <span className="block h-1 w-1 rounded-full bg-[#7C3AED]" /> : null}
            </span>
            <Icon className="h-4 w-4" />
            <span className="truncate text-[10px] font-medium tracking-wide">{tab.name}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
