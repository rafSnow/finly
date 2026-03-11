import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  if (!firebaseConfig.apiKey) {
    throw new Error(
      '[Finly] Firebase não configurado. Crie o arquivo .env.local com as variáveis NEXT_PUBLIC_FIREBASE_*. Consulte .env.local.example.'
    );
  }
  return initializeApp(firebaseConfig);
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

function ensureInitialized(): { auth: Auth; db: Firestore } {
  if (!_app) {
    _app = getFirebaseApp();
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  }
  return { auth: _auth!, db: _db! };
}

export function getFirebaseAuth(): Auth {
  return ensureInitialized().auth;
}

export function getFirebaseDb(): Firestore {
  return ensureInitialized().db;
}

// Direct exports — only safe in client components ('use client')
export const auth: Auth =
  typeof window !== 'undefined' ? getFirebaseAuth() : (undefined as unknown as Auth);

export const db: Firestore =
  typeof window !== 'undefined' ? getFirebaseDb() : (undefined as unknown as Firestore);
