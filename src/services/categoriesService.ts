import { getDb, ADMIN_EMAIL } from '../firebase';
import { Category, AuditActor } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialCategories';
import { removeUndefinedFields } from '../utils/cleanFirestore';
import { logAuditEntry } from './auditService';

const CATEGORIES_COLLECTION = 'categories';

async function firestore() {
  const db = await getDb();
  const {
    collection,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    where,
    getDoc,
    getDocs
  } = await import('firebase/firestore');
  return { db, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where, getDoc, getDocs };
}

function defaultCategories(): Category[] {
  return INITIAL_CATEGORIES.map((c, index) => ({
    id: `cat-default-${index + 1}`,
    name: c.name,
    color: c.color,
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: ADMIN_EMAIL
  }));
}

export async function subscribeToCategories(
  callback: (categories: Category[]) => void
): Promise<() => void> {
  const { db, collection, query, orderBy, onSnapshot, setDoc, doc, getDoc } = await firestore();
  const ref = collection(db, CATEGORIES_COLLECTION);
  const q = query(ref, orderBy('name', 'asc'));
  const seedFlagRef = doc(db, 'appMeta', 'categoriesSeed');

  let seedHandledThisSession = false;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const categories: Category[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id.startsWith('_')) return;
        const data = docSnap.data();
        categories.push({
          id: docSnap.id,
          name: data.name || '',
          color: data.color || 'sky',
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy || undefined,
          createdByName: data.createdByName || undefined
        });
      });

      if (categories.length > 0) {
        callback(categories);
        return;
      }

      if (seedHandledThisSession) {
        callback(categories);
        return;
      }
      seedHandledThisSession = true;

      try {
        const flag = await getDoc(seedFlagRef);
        if (flag.exists()) {
          callback(categories);
          return;
        }

        callback(defaultCategories());

        for (const c of INITIAL_CATEGORIES) {
          const id = c.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          await setDoc(doc(db, CATEGORIES_COLLECTION, id), {
            name: c.name,
            color: c.color,
            createdAt: new Date().toISOString(),
            createdBy: ADMIN_EMAIL
          });
        }
        await setDoc(seedFlagRef, { seeded: true, seededAt: new Date().toISOString() });
      } catch (seedErr) {
        console.warn('Initial category seeding handled gracefully:', seedErr);
        callback(categories);
      }
    },
    (error) => {
      console.warn('Subscription notice in Firestore, falling back to default categories:', error);
      callback(defaultCategories());
    }
  );

  return unsubscribe;
}

export async function createCategory(
  name: string,
  color: string,
  actor?: AuditActor
): Promise<string> {
  const { db, collection, addDoc } = await firestore();
  const ref = collection(db, CATEGORIES_COLLECTION);
  const docRef = await addDoc(
    ref,
    removeUndefinedFields({
      name,
      color,
      createdAt: new Date().toISOString(),
      createdBy: actor?.email || ADMIN_EMAIL,
      createdByName: actor?.name
    })
  );

  await logAuditEntry({
    action: 'category_create',
    entityType: 'category',
    entityId: docRef.id,
    entityTitle: name,
    actorUid: actor?.uid,
    actorName: actor?.name,
    actorEmail: actor?.email,
    details: `Criou a categoria "${name}"`
  });

  return docRef.id;
}

/**
 * Update a category (name/color) in Firestore (admin only by Firestore rules).
 * Also updates every note that references the old name, so the agenda stays consistent.
 */
export async function updateCategory(
  categoryId: string,
  oldName: string,
  newName: string,
  color: string,
  actor?: AuditActor
): Promise<void> {
  const { db, doc, updateDoc, collection, query, where, getDocs } = await firestore();

  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
    name: newName,
    color,
    updatedAt: new Date().toISOString()
  });

  const notesRef = collection(db, 'notes');
  const snapshot = await getDocs(query(notesRef, where('category', '==', oldName)));
  for (const noteSnap of snapshot.docs) {
    await updateDoc(noteSnap.ref, { category: newName });
  }

  await logAuditEntry({
    action: 'category_update',
    entityType: 'category',
    entityId: categoryId,
    entityTitle: newName,
    actorUid: actor?.uid,
    actorName: actor?.name,
    actorEmail: actor?.email,
    details: `Renomeou a categoria "${oldName}" para "${newName}"${snapshot.size > 0 ? ` e atualizou ${snapshot.size} anotação(ões)` : ''}`
  });
}

export async function deleteCategory(
  categoryId: string,
  name: string,
  actor?: AuditActor
): Promise<void> {
  const { db, doc, deleteDoc } = await firestore();
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));

  await logAuditEntry({
    action: 'category_delete',
    entityType: 'category',
    entityId: categoryId,
    entityTitle: name,
    actorUid: actor?.uid,
    actorName: actor?.name,
    actorEmail: actor?.email,
    details: `Excluiu a categoria "${name}"`
  });
}
