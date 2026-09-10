import { initializeApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Active configuration: prioritizes Vercel / .env environment variables if provided
export const activeFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

// Initialize Firebase App
export const app = initializeApp(activeFirebaseConfig);

// Lazy Firestore client: only loads 'firebase/firestore' when first needed (after login)
let firestorePromise: Promise<Firestore> | null = null;

export function getDb(): Promise<Firestore> {
  if (!firestorePromise) {
    firestorePromise = import('firebase/firestore').then(({ getFirestore }) => {
      const customDbId =
        import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
        (!import.meta.env.VITE_FIREBASE_PROJECT_ID
          ? (firebaseConfig as Record<string, string>).firestoreDatabaseId
          : undefined);
      return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
    });
  }
  return firestorePromise;
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider for Gmail login
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const ADMIN_EMAIL = 'imc.sidnei@gmail.com';
export const ADMIN_EMAILS = ['imc.sidnei@gmail.com'];

/**
 * Checks if an email is administrator with unrestricted access
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
}

/**
 * Handle Google Sign-In with fallback between Popup and Redirect for iframes
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (popupError: unknown) {
    const err = popupError as { code?: string };
    console.warn('Popup blocked or error, trying redirect:', popupError);
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      // In iframes, popup might be blocked; if so, attempt redirect
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error('Redirect sign in error:', redirectError);
        throw redirectError;
      }
    }
    throw popupError;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Maps Firebase Auth error codes to user-friendly pt-BR messages.
 */
export function getAuthErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string };
  if (
    err?.code === 'auth/unauthorized-domain' ||
    err?.code === 'auth/operation-not-allowed'
  ) {
    return 'Este domínio precisa ser autorizado nas configurações de autenticação do Firebase.';
  }
  if (
    err?.code === 'auth/popup-closed-by-user' ||
    err?.code === 'auth/cancelled-popup-request'
  ) {
    return 'Login cancelado. Tente novamente.';
  }
  if (err?.code === 'auth/network-request-failed') {
    return 'Falha de conexão com os servidores do Google. Verifique sua internet.';
  }
  return err?.message || 'Não foi possível autenticar com o Google. Tente novamente.';
}
