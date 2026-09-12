import { getDb, ADMIN_EMAIL } from '../firebase';
import { Division, AuditActor } from '../types';
import { INITIAL_DIVISIONS } from '../data/initialDivisions';
import { removeUndefinedFields } from '../utils/cleanFirestore';
import { logAuditEntry } from './auditService';

const DIVISIONS_COLLECTION = 'divisions';

async function firestore() {
  const db = await getDb();
  const { collection, doc, setDoc, addDoc, deleteDoc, onSnapshot, query, orderBy, getDoc } =
    await import('firebase/firestore');
  return {
    db,
    collection,
    doc,
    setDoc,
    addDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    getDoc
  };
}

function defaultDivisions(): Division[] {
  return INITIAL_DIVISIONS.map((name, index) => ({
    id: `div-default-${index + 1}`,
    name,
    createdAt: '2025-01-01T00:00:00.000Z',
    createdBy: ADMIN_EMAIL
  }));
}

/**
 * Realtime listener for divisions from Firebase Firestore.
 * Seeds the collection with INITIAL_DIVISIONS exactly once (guarded by an
 * `appMeta/divisionsSeed` flag), so the initial divisions never come back
 * after an admin deletes them.
 */
export async function subscribeToDivisions(
  callback: (divisions: Division[]) => void
): Promise<() => void> {
  const { db, collection, query, orderBy, onSnapshot, setDoc, doc, getDoc } = await firestore();
  const divisionsRef = collection(db, DIVISIONS_COLLECTION);
  const q = query(divisionsRef, orderBy('name', 'asc'));
  const seedFlagRef = doc(db, 'appMeta', 'divisionsSeed');

  let seedHandledThisSession = false;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const divisions: Division[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id.startsWith('_')) return;
        const data = docSnap.data();
        divisions.push({
          id: docSnap.id,
          name: data.name || '',
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy || undefined,
          createdByName: data.createdByName || undefined
        });
      });

      if (divisions.length > 0) {
        callback(divisions);
        return;
      }

      if (seedHandledThisSession) {
        callback(divisions);
        return;
      }
      seedHandledThisSession = true;

      try {
        const flag = await getDoc(seedFlagRef);
        if (flag.exists()) {
          callback(divisions);
          return;
        }

        callback(defaultDivisions());

        for (const name of INITIAL_DIVISIONS) {
          const id = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          await setDoc(doc(db, DIVISIONS_COLLECTION, id), {
            name,
            createdAt: new Date().toISOString(),
            createdBy: ADMIN_EMAIL
          });
        }
        await setDoc(seedFlagRef, {
          seeded: true,
          seededAt: new Date().toISOString()
        });
      } catch (seedErr) {
        console.warn('Initial division seeding handled gracefully:', seedErr);
        callback(divisions);
      }
    },
    (error) => {
      console.warn('Subscription notice in Firestore, falling back to default divisions:', error);
      callback(defaultDivisions());
    }
  );

  return unsubscribe;
}

/**
 * Create a new division in Firestore (admin only by Firestore rules).
 */
export async function createDivision(
  name: string,
  actor?: AuditActor
): Promise<string> {
  const { db, collection, addDoc } = await firestore();
  const divisionsRef = collection(db, DIVISIONS_COLLECTION);
  const docRef = await addDoc(
    divisionsRef,
    removeUndefinedFields({
      name,
      createdAt: new Date().toISOString(),
      createdBy: actor?.email || ADMIN_EMAIL,
      createdByName: actor?.name
    })
  );

  await logAuditEntry({
    action: 'division_create',
    entityType: 'division',
    entityId: docRef.id,
    entityTitle: name,
    actorUid: actor?.uid,
    actorName: actor?.name,
    actorEmail: actor?.email,
    details: 'Criou uma nova divisão'
  });

  return docRef.id;
}

/**
 * Delete a division from Firestore (admin only by Firestore rules).
 * Notes that already reference this division keep their label.
 */
export async function deleteDivision(
  divisionId: string,
  name: string,
  actor?: AuditActor
): Promise<void> {
  const { db, doc, deleteDoc } = await firestore();
  await deleteDoc(doc(db, DIVISIONS_COLLECTION, divisionId));

  await logAuditEntry({
    action: 'division_delete',
    entityType: 'division',
    entityId: divisionId,
    entityTitle: name,
    actorUid: actor?.uid,
    actorName: actor?.name,
    actorEmail: actor?.email,
    details: 'Excluiu uma divisão'
  });
}