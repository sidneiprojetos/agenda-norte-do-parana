import { getDb, ADMIN_EMAIL } from '../firebase';
import { Note } from '../types';
import { INITIAL_NOTES } from '../data/initialNotes';
import { removeUndefinedFields } from '../utils/cleanFirestore';

const NOTES_COLLECTION = 'notes';

async function firestore() {
  const db = await getDb();
  const { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } =
    await import('firebase/firestore');
  return {
    db,
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy
  };
}

/**
 * Realtime listener for agenda notes from Firebase Firestore.
 * Automatically seeds the collection with INITIAL_NOTES if empty.
 */
export async function subscribeToNotes(callback: (notes: Note[]) => void): Promise<() => void> {
  const { db, collection, query, orderBy, onSnapshot, setDoc, doc } = await firestore();
  const notesRef = collection(db, NOTES_COLLECTION);
  const q = query(notesRef, orderBy('date', 'asc'));

  let hasSeeded = false;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Immediately provide initial notes so UI is never blank
        callback(INITIAL_NOTES);

        if (!hasSeeded) {
          hasSeeded = true;
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

      // Sort by date ascending, or secondary by time
      notes.sort((a, b) => {
        if (a.date === b.date) {
          return (a.time || '').localeCompare(b.time || '');
        }
        return a.date.localeCompare(b.date);
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
  const { db, collection, doc, setDoc } = await firestore();
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

  await setDoc(newDocRef, sanitized);

  return noteId;
}

/**
 * Update an existing note in Firestore
 */
export async function updateFirestoreNote(
  noteId: string,
  updates: Partial<Omit<Note, 'id'>>
): Promise<void> {
  const { db, doc, updateDoc } = await firestore();
  const noteDocRef = doc(db, NOTES_COLLECTION, noteId);
  const rawUpdates = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(noteDocRef, removeUndefinedFields(rawUpdates));
}

/**
 * Delete a note from Firestore
 */
export async function deleteFirestoreNote(noteId: string): Promise<void> {
  const { db, doc, deleteDoc } = await firestore();
  const noteDocRef = doc(db, NOTES_COLLECTION, noteId);
  await deleteDoc(noteDocRef);
}