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
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <Header />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
