'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/lib/firebase/auth';
import { getFirebaseDb } from '@/lib/firebase/client';
import { useToastStore } from '@/store/toastStore';
import { profileSchema, type ProfileFormData } from '@/types/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function PerfilPage() {
  const { user } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      photoURL: '',
      currency: 'BRL',
    },
  });

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const userDoc = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        reset({
          name: data.name || user.displayName || '',
          photoURL: data.photoURL || '',
          currency: data.currency || 'BRL',
        });
      }
    };
    loadProfile();
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(data.name, data.photoURL || undefined);
      await updateDoc(doc(getFirebaseDb(), 'users', user.uid), {
        name: data.name,
        photoURL: data.photoURL || null,
        currency: data.currency,
      });
      addToast({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao atualizar perfil.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') return;
    setDeleteLoading(true);
    try {
      // Calls fn-deleteUser Cloud Function (stub in Phase 1)
      addToast({
        type: 'info',
        message: 'Funcionalidade de exclusão será ativada em breve.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao excluir conta.',
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Perfil</h2>

      <Card variant="outlined">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Seu nome"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="URL da foto de perfil"
            placeholder="https://exemplo.com/foto.jpg"
            error={errors.photoURL?.message}
            {...register('photoURL')}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currency" className="text-sm font-medium text-neutral-800">
              Moeda padrão
            </label>
            <select
              id="currency"
              className="flex w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...register('currency')}
            >
              <option value="BRL">BRL — Real Brasileiro</option>
              <option value="USD">USD — Dólar Americano</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <Button type="submit" loading={loading}>
            Salvar alterações
          </Button>
        </form>
      </Card>

      <Card variant="outlined" className="border-danger-500/30">
        <h3 className="text-lg font-semibold text-danger-500">Zona de perigo</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Ao excluir sua conta, seus dados pessoais serão anonimizados conforme a LGPD. Esta ação
          não pode ser desfeita.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setShowDeleteModal(true)}
          type="button"
        >
          Excluir minha conta
        </Button>
      </Card>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Header>
          <h2 className="text-lg font-semibold text-danger-500">Excluir conta</h2>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2 text-sm text-neutral-600">
            Esta ação é irreversível. Seus dados pessoais serão anonimizados conforme a LGPD.
          </p>
          <p className="mb-4 text-sm text-neutral-800">
            Digite <strong>EXCLUIR</strong> para confirmar:
          </p>
          <Input
            placeholder="EXCLUIR"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} type="button">
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={deleteLoading}
            disabled={deleteConfirmation !== 'EXCLUIR'}
            onClick={handleDeleteAccount}
            type="button"
          >
            Confirmar exclusão
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
