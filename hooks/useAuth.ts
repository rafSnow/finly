import { auth, db } from "@/lib/firebase";
import { Family, User } from "@/types";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        Cookies.set("firebase-token", token, { expires: 7 });

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
        });

        const q = query(
          collection(db, "families"),
          where("memberIds", "array-contains", firebaseUser.uid),
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          setFamily({ id: docData.id, ...docData.data() } as Family);
        } else {
          setFamily(null);
        }
      } else {
        Cookies.remove("firebase-token");
        setUser(null);
        setFamily(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = (email: string, pass: string) =>
    signInWithEmailAndPassword(auth, email, pass);

  const signUp = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass,
    );
    const newUser = userCredential.user;

    // Atualiza o perfil no Auth
    await updateProfile(newUser, { displayName: name });

    // Cria o documento do usuário no Firestore
    await setDoc(doc(db, "users", newUser.uid), {
      name,
      email,
      createdAt: new Date(),
    });

    // Cria uma família inicial para o novo usuário
    const familyRef = doc(collection(db, "families"));
    await setDoc(familyRef, {
      memberIds: [newUser.uid],
      createdBy: newUser.uid,
      createdAt: new Date(),
    });

    return userCredential;
  };

  const signOut = () => firebaseSignOut(auth);

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  return { user, family, loading, signIn, signUp, signOut, resetPassword };
}
