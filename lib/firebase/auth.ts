import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type Unsubscribe,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './client';

const googleProvider = new GoogleAuthProvider();

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/operation-not-allowed': 'Operação não permitida.',
  'auth/weak-password': 'A senha é muito fraca.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'E-mail não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'Credenciais inválidas. Verifique seu e-mail e senha.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code: string }).code;
    return firebaseErrorMessages[code] || 'Ocorreu um erro. Tente novamente.';
  }
  return 'Ocorreu um erro inesperado.';
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(getFirebaseDb(), 'users', credential.user.uid), {
      name,
      email,
      currency: 'BRL',
      photoURL: null,
      createdAt: serverTimestamp(),
    });
    return credential;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
    const userDoc = doc(getFirebaseDb(), 'users', credential.user.uid);
    await setDoc(
      userDoc,
      {
        name: credential.user.displayName || '',
        email: credential.user.email || '',
        currency: 'BRL',
        photoURL: credential.user.photoURL || null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    return credential;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export function onAuthStateChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Usuário não autenticado.');
    await updateProfile(user, { displayName, photoURL: photoURL || null });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
