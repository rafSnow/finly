"use client";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] text-[#A09DC0]">
        Carregando...
      </div>
    );
  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0F] pb-20">
      <Header />
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-32">{children}</main>
      <BottomNav />
    </div>
  );
}
