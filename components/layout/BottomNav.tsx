"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
  Tag,
  Target,
  Wallet,
  TrendingUp,
  Menu,
  X
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Lançamentos", path: "/lancamentos", icon: ArrowLeftRight },
    { name: "Contas", path: "/contas", icon: Wallet },
    { name: "Metas", path: "/metas", icon: Target },
  ];

  const moreTabs = [
    { name: "Categorias", path: "/categorias", icon: Tag },
    { name: "Patrimônio", path: "/patrimonio", icon: TrendingUp },
    { name: "Ajustes", path: "/ajustes", icon: Settings },
  ];

  return (
    <>
      {/* Overlay do Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Menu Adicional */}
      {isMenuOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-48 rounded-2xl border border-white/[0.07] bg-[#111118] p-2 shadow-2xl">
          {moreTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.path);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                href={tab.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-[#8B5CF6]" : "text-[#A09DC0] hover:bg-white/5 hover:text-[#F1F0FF]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[#0A0A0F]/90 pb-safe backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl">
          {mainTabs.map((tab) => {
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
          
          {/* Botão Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-3 py-2 text-[10px] font-medium tracking-wide transition-colors duration-200 ${
              isMenuOpen ? "text-[#8B5CF6]" : "text-[#6B6890] hover:text-[#A09DC0]"
            }`}
          >
            <span className="mb-0.5 h-1 w-1 rounded-full bg-transparent">
              {isMenuOpen ? <span className="block h-1 w-1 rounded-full bg-[#7C3AED]" /> : null}
            </span>
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="truncate text-[10px] font-medium tracking-wide">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
