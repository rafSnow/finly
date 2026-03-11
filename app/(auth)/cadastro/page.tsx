'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/store/toastStore';
import { signUpSchema, type SignUpFormData } from '@/types/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function CadastroPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      await signUp(data.name, data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao criar conta.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-500">Finly</h1>
          <p className="mt-2 text-neutral-600">Crie sua conta</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Senha"
              isPassword
              placeholder="Mínimo 8 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar senha"
              isPassword
              placeholder="Repita a senha"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" loading={loading} className="w-full">
              Criar conta
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-600">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-brand-500 hover:text-brand-600">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
