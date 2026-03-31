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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log("🔐 [useAuth] onAuthStateChanged triggered", firebaseUser?.uid);
        
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            console.log("✅ [useAuth] Token obtido:", firebaseUser.uid);
            Cookies.set("firebase-token", token, { expires: 7 });

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName,
            });
            console.log("✅ [useAuth] User state atualizado");

            try {
              console.log("📖 [useAuth] Lendo documento de usuário:", firebaseUser.uid);
              const userSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
              console.log("✅ [useAuth] Snapshot recebido, exists:", userSnapshot.exists());
              
              const userData = userSnapshot.exists()
                ? (userSnapshot.data() as { familyId?: string })
                : null;
              
              console.log("📊 [useAuth] Dados do usuário:", { 
                exists: userSnapshot.exists(), 
                hasData: !!userData,
                familyId: userData?.familyId 
              });

              if (!userData?.familyId) {
                console.log("⚠️ [useAuth] Usuário não tem familyId");
                setFamily(null);
                setLoading(false);
                return;
              }

              console.log("📖 [useAuth] Lendo documento de família:", userData.familyId);
              const familySnapshot = await getDoc(doc(db, "families", userData.familyId));
              console.log("✅ [useAuth] Snapshot da família recebido, exists:", familySnapshot.exists());
              
              if (!familySnapshot.exists()) {
                console.log("⚠️ [useAuth] Documento da família não existe");
                setFamily(null);
                setLoading(false);
                return;
              }

              const familyData = { id: familySnapshot.id, ...familySnapshot.data() } as Family;
              console.log("✅ [useAuth] Família carregada:", familyData.id);
              setFamily(familyData);
            } catch (firestoreError) {
              console.error("❌ [useAuth] Erro ao carregar dados do Firestore:", {
                error: firestoreError,
                message: firestoreError instanceof Error ? firestoreError.message : "Unknown",
                code: firestoreError && typeof firestoreError === 'object' ? (firestoreError as any).code : "No code",
                uid: firebaseUser.uid
              });
              setFamily(null);
              // Não quebrar a autenticação se o Firestore falhar
            } finally {
              setLoading(false);
            }
          } catch (tokenError) {
            console.error("❌ [useAuth] Erro ao obter token:", tokenError);
            setLoading(false);
          }
        } else {
          console.log("🔓 [useAuth] Usuário deslogged");
          Cookies.remove("firebase-token");
          setUser(null);
          setFamily(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ [useAuth] Erro ao carregar estado de autenticacao:", {
          error,
          message: error instanceof Error ? error.message : "Unknown"
        });
        setFamily(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("🛑 [useAuth] Cleanup - unsubscribing from auth state");
      unsubscribe();
    };
  }, []);

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
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass,
    );
    const newUser = userCredential.user;

    // Operações de pós-cadastro não devem invalidar criação do usuário no Auth.
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
