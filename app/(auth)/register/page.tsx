"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { createFamily, getFamilyByMember } from "@/lib/firestore/families";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("E-mail inválido.").min(1, "O e-mail é obrigatório."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória."),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "As senhas não coincidem.",
      path: ["confirmPassword"],
    });
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onFormSubmit = async (values: RegisterFormValues) => {
    setError("");

    try {
      const userCredential = await signUp(values.email, values.password, values.name);
      const existingFamily = await getFamilyByMember(userCredential.user.uid);
      if (!existingFamily) {
        await createFamily(userCredential.user.uid);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorCode =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: unknown }).code)
          : "";

      if (errorCode === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else if (errorCode.startsWith("auth/")) {
        setError("Erro ao criar conta. Tente novamente.");
      } else {
        setError("Falha ao finalizar seu cadastro, mas sua conta pode ter sido criada. Tente entrar.");
      }
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (googleError) {
      if (googleError instanceof Error && googleError.message === "popup_closed_by_user") {
        return;
      }

      if (googleError instanceof Error) {
        setError(googleError.message);
      } else {
        setError("Nao foi possivel entrar com Google.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] bg-[radial-gradient(ellipse_at_top,#1E1040_0%,#0A0A0F_60%)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#111118] p-8 shadow-[0_8px_48px_rgba(0,0,0,0.7)]">
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-[#F1F0FF]">
          Criar Conta
        </h1>
        <p className="mb-7 text-center text-sm text-[#6B6890]">Comece a organizar suas financas hoje</p>
        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <Input
            label="Nome"
            type="text"
            {...register("name")}
            error={errors.name?.message}
          />
          <Input
            label="E-mail"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Senha"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Input
            label="Confirmar Senha"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={isSubmitting} className="mt-4">
            Cadastrar
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-xs font-medium text-[#6B6890]">ou</span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          className="w-full rounded-xl border border-white/10 bg-[#1A1A26] px-5 py-3 font-medium text-[#F1F0FF] transition-all duration-200 hover:border-white/[0.2] hover:bg-[#22223A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center justify-center gap-2">
            {googleLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.95 2.3 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.05 6.24C12.5 13.4 17.75 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.55c0-1.64-.15-3.22-.43-4.73H24v9h12.7c-.55 2.98-2.23 5.5-4.75 7.18l7.31 5.67C43.71 37.58 46.5 31.6 46.5 24.55z"/>
                <path fill="#FBBC05" d="M10.61 28.54A14.48 14.48 0 0 1 9.5 24c0-1.57.27-3.09.76-4.54l-8.05-6.24A23.92 23.92 0 0 0 0 24c0 3.86.92 7.5 2.56 10.78l8.05-6.24z"/>
                <path fill="#34A853" d="M24 48c6.4 0 11.77-2.1 15.7-5.72l-7.31-5.67c-2.03 1.36-4.63 2.16-8.39 2.16-6.25 0-11.5-3.9-13.39-9.23l-8.05 6.24C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continuar com Google
          </span>
        </button>

        <div className="mt-6 text-center text-sm">
          <span className="text-[#6B6890]">Já tem uma conta? </span>
          <Link
            href="/login"
            className="font-medium text-[#7C3AED] transition-colors duration-200 hover:text-[#8B5CF6]"
          >
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}
