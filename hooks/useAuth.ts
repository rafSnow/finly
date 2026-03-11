'use client';

import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';
import type { User } from 'firebase/auth';
import { useCallback, useEffect } from 'react';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, loading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, [setUser]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await signUpWithEmail(name, email, password);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await firebaseSignInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut();
  }, []);

  return { user, loading, signUp, signIn, signInWithGoogle, signOut };
}
