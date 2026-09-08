import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider for Gmail login
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const ADMIN_EMAIL = 'imc.sidnei@gmail.com';
export const ADMIN_EMAILS = ['imc.sidnei@gmail.com', 'imc.sidnei@gamil.com'];

/**
 * Checks if an email is administrator with unrestricted access
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    ADMIN_EMAILS.includes(normalized) ||
    normalized.startsWith('imc.sidnei@')
  );
}

/**
 * Handle Google Sign-In with fallback between Popup and Redirect for iframes
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (popupError: any) {
    console.warn('Popup blocked or error, trying redirect:', popupError);
    if (
      popupError?.code === 'auth/popup-blocked' ||
      popupError?.code === 'auth/popup-closed-by-user' ||
      popupError?.code === 'auth/cancelled-popup-request'
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
