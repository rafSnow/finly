'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { sendPasswordReset } from '@/lib/firebase/auth';
import { useToastStore } from '@/store/toastStore';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/types/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ open, onClose }: ResetPasswordModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await sendPasswordReset(data.email);
      addToast({
        type: 'success',
        message: 'E-mail de recuperação enviado. Verifique sua caixa de entrada.',
      });
      reset();
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao enviar e-mail de recuperação.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header>
        <h2 className="text-lg font-semibold text-neutral-900">Recuperar senha</h2>
      </Modal.Header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <p className="mb-4 text-sm text-neutral-600">
            Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
          </p>
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Enviar link
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
