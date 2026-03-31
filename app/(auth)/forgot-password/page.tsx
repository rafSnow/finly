"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPassword(email);
      setMessage(
        "Se este e-mail estiver cadastrado, você receberá as instruções em breve.",
      );
    } catch {
      setError("Ocorreu um erro ao tentar recuperar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] bg-[radial-gradient(ellipse_at_top,#1E1040_0%,#0A0A0F_60%)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#111118] p-8 shadow-[0_8px_48px_rgba(0,0,0,0.7)]">
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-[#F1F0FF]">
          Recuperar Senha
        </h1>
        <p className="mb-7 text-center text-sm text-[#6B6890]">Enviaremos instrucoes para redefinir o acesso</p>

        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}
        {message && (
          <p className="mb-4 text-center text-sm text-emerald-400">{message}</p>
        )}

        <form onSubmit={handleReset}>
          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={loading} className="mt-4">
            Enviar instruções
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-[#7C3AED] transition-colors duration-200 hover:text-[#8B5CF6]"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
