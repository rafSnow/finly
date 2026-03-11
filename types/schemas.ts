import { z } from 'zod';

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter ao menos 1 letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter ao menos 1 número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  photoURL: z.string().url('URL inválida').or(z.literal('')).optional(),
  currency: z.string().min(1, 'Selecione uma moeda'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
