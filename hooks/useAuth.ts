import { auth, db } from "@/lib/firebase";
import { deleteAllUserData } from "@/lib/firestore/deleteAccount";
import { Family, User } from "@/types";
import {
  AuthError,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

function isAuthError(error: unknown): error is AuthError {
  return typeof error === "object" && error !== null && "code" in error;
}

type AuthStoreState = {
  user: User | null;
  family: Family | null;
  loading: boolean;
};

let authStoreState: AuthStoreState = {
  user: null,
  family: null,
  loading: true,
};

const authStoreListeners = new Set<() => void>();
let isAuthObserverInitialized = false;

function updateAuthStore(next: Partial<AuthStoreState>) {
  authStoreState = { ...authStoreState, ...next };
  authStoreListeners.forEach((listener) => listener());
}

function initializeAuthObserver() {
  if (isAuthObserverInitialized) {
    return;
  }

  isAuthObserverInitialized = true;

  onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        Cookies.set("firebase-token", token, { expires: 7 });

        updateAuthStore({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName,
          },
        });

        try {
          const userSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userSnapshot.exists()
            ? (userSnapshot.data() as { familyId?: string })
            : null;

          if (!userData?.familyId) {
            updateAuthStore({ family: null, loading: false });
            return;
          }

          const familySnapshot = await getDoc(doc(db, "families", userData.familyId));
          if (!familySnapshot.exists()) {
            updateAuthStore({ family: null, loading: false });
            return;
          }

          updateAuthStore({
            family: { id: familySnapshot.id, ...familySnapshot.data() } as Family,
            loading: false,
          });
        } catch (firestoreError) {
          console.error("[useAuth] Erro ao carregar dados do Firestore:", firestoreError);
          updateAuthStore({ family: null, loading: false });
        }
      } else {
        Cookies.remove("firebase-token");
        updateAuthStore({ user: null, family: null, loading: false });
      }
    } catch (error) {
      console.error("[useAuth] Erro ao carregar estado de autenticacao:", error);
      updateAuthStore({ family: null, loading: false });
    }
  });
}

export function useAuth() {
  const [authState, setAuthState] = useState(authStoreState);

  useEffect(() => {
    initializeAuthObserver();

    const listener = () => setAuthState({ ...authStoreState });
    authStoreListeners.add(listener);

    return () => {
      authStoreListeners.delete(listener);
    };
  }, []);

  const { user, family, loading } = authState;

  const signIn = (email: string, pass: string) =>
    signInWithEmailAndPassword(auth, email, pass);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const signedUser = credential.user;
      const idToken = await signedUser.getIdToken();
      Cookies.set("firebase-token", idToken, { expires: 7 });

      const userRef = doc(db, "users", signedUser.uid);
      const userSnapshot = await getDoc(userRef);
      const existingUserData = userSnapshot.exists()
        ? (userSnapshot.data() as { familyId?: string })
        : null;

      if (!existingUserData?.familyId) {
        const familyRef = doc(collection(db, "families"));
        await setDoc(familyRef, {
          memberIds: [signedUser.uid],
          createdBy: signedUser.uid,
          createdAt: serverTimestamp(),
        });

        await setDoc(
          userRef,
          {
            name: signedUser.displayName ?? "Usuario",
            email: signedUser.email,
            familyId: familyRef.id,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (error) {
      if (isAuthError(error)) {
        if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        }
        if (error.code === "auth/popup-closed-by-user") {
          throw new Error("popup_closed_by_user");
        }
        if (error.code === "auth/account-exists-with-different-credential") {
          throw new Error("Este e-mail já está cadastrado com outro método de login.");
        }
      }

      throw new Error("Nao foi possivel entrar com Google.");
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;

    try {
      await updateProfile(newUser, { displayName: name });

      const familyRef = doc(collection(db, "families"));
      await setDoc(familyRef, {
        memberIds: [newUser.uid],
        createdBy: newUser.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "users", newUser.uid), {
        name,
        email,
        familyId: familyRef.id,
        createdAt: serverTimestamp(),
      });
    } catch (postSignUpError) {
      console.error("Post-signup setup failed:", postSignUpError);
    }

    return userCredential;
  };

  const signOut = () => firebaseSignOut(auth);

  const deleteAccount = async (password: string): Promise<void> => {
    if (!user?.uid || !family?.id) {
      throw new Error("Nao foi possivel localizar os dados da conta para exclusao.");
    }

    await deleteAllUserData(user.uid, family.id, password);
  };

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  return {
    user,
    family,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    deleteAccount,
    resetPassword,
  };
}
