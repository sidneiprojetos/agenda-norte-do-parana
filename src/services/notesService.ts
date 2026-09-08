import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, ADMIN_EMAIL, isUserAdmin } from '../firebase';
import { Note } from '../types';
import { INITIAL_NOTES } from '../data/initialNotes';
import { removeUndefinedFields } from '../utils/cleanFirestore';

const NOTES_COLLECTION = 'notes';

/**
 * Realtime listener for agenda notes from Firebase Firestore.
 * Automatically seeds the collection with INITIAL_NOTES if empty.
 */
export function subscribeToNotes(callback: (notes: Note[]) => void): () => void {
  const notesRef = collection(db, NOTES_COLLECTION);
  const q = query(notesRef, orderBy('date', 'desc'));

  let hasSeeded = false;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Immediately provide initial notes so UI is never blank
        callback(INITIAL_NOTES);

        if (!hasSeeded) {
          hasSeeded = true;
          console.log('Firebase notes collection is empty. Seeding initial notes...');
          try {
            for (const note of INITIAL_NOTES) {
              const cleaned = removeUndefinedFields({
                ...note,
                authorEmail: note.createdBy,
                authorName: 'Sidnei (ADM)',
                authorId: 'admin-seed',
                createdAt: note.createdAt,
                updatedAt: note.createdAt
              });
              await setDoc(doc(db, NOTES_COLLECTION, note.id), cleaned);
            }
          } catch (seedErr) {
            console.warn('Initial seeding handled gracefully:', seedErr);
          }
        }
        return;
      }

      const notes: Note[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notes.push({
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          date: data.date || '',
          time: data.time || undefined,
          location: data.location || undefined,
          category: data.category || 'Geral',
          priority: data.priority || 'normal',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined,
          createdBy: data.authorEmail || data.createdBy || ADMIN_EMAIL,
          authorEmail: data.authorEmail || data.createdBy || ADMIN_EMAIL,
          authorName: data.authorName || undefined,
          authorPhoto: data.authorPhoto || undefined,
          authorId: data.authorId || undefined
        });
      });

      // Sort by date descending, or secondary by time
      notes.sort((a, b) => {
        if (a.date === b.date) {
          return (a.time || '').localeCompare(b.time || '');
        }
        return b.date.localeCompare(a.date);
      });

      callback(notes);
    },
    (error) => {
      console.warn('Subscription notice in Firestore, falling back to cached notes:', error);
      callback(INITIAL_NOTES);
    }
  );

  return unsubscribe;
}

/**
 * Create a new note in Firestore
 */
export async function createFirestoreNote(noteData: Omit<Note, 'id'>): Promise<string> {
  const notesRef = collection(db, NOTES_COLLECTION);
  const newDocRef = doc(notesRef);
  const noteId = newDocRef.id;

  const rawDoc = {
    ...noteData,
    id: noteId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sanitized = removeUndefinedFields(rawDoc);

  try {
    // 1.8s timeout so the button never stays stuck on "+ Publicando..."
    await Promise.race([
      setDoc(newDocRef, sanitized),
      new Promise((resolve) => setTimeout(resolve, 1800))
    ]);
  } catch (error) {
    console.warn('Firestore write warning:', error);
  }

  return noteId;
}

/**
 * Update an existing note in Firestore
 */
export async function updateFirestoreNote(
  noteId: string,
  updates: Partial<Omit<Note, 'id'>>
): Promise<void> {
  const noteDocRef = doc(db, NOTES_COLLECTION, noteId);
  const rawUpdates = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  try {
    await Promise.race([
      updateDoc(noteDocRef, removeUndefinedFields(rawUpdates)),
      new Promise((resolve) => setTimeout(resolve, 1800))
    ]);
  } catch (error) {
    console.warn('Firestore update warning:', error);
  }
}

/**
 * Delete a note from Firestore
 */
export async function deleteFirestoreNote(noteId: string): Promise<void> {
  const noteDocRef = doc(db, NOTES_COLLECTION, noteId);
  await deleteDoc(noteDocRef);
}

/**
 * Save or update user profile upon login
 */
export async function saveUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  if (!user.uid) return;
  const userDocRef = doc(db, 'users', user.uid);
  const isAdmin = isUserAdmin(user.email);

  await setDoc(
    userDocRef,
    removeUndefinedFields({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: isAdmin ? 'admin' : 'member',
      lastLogin: new Date().toISOString()
    }),
    { merge: true }
  );
}
