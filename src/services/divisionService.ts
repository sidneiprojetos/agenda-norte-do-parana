import { getDb, ADMIN_EMAIL } from '../firebase';
import { Division, AuditActor, CategoryColor } from '../types';
import { INITIAL_DIVISIONS } from '../data/initialDivisions';
import { removeUndefinedFields } from '../utils/cleanFirestore';
import { logAuditEntry } from './auditService';
import { normalizeLabel } from '../utils/textUtils';

const DIVISIONS_COLLECTION = 'divisions';

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
  return {
    db,
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
  };
}

function defaultDivisions(): Division[] {
  return INITIAL_DIVISIONS.map((div, index) => ({
    id: `div-default-${index + 1}`,
    name: div.name,
    color: div.color,
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
      const seen = new Set<string>();
      snapshot.forEach((docSnap) => {
        if (docSnap.id.startsWith('_')) return;
        const data = docSnap.data();
        const norm = normalizeLabel(data.name || '');
        if (seen.has(norm)) return;
        seen.add(norm);
        divisions.push({
          id: docSnap.id,
          name: data.name || '',
          color: data.color || undefined,
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

        for (const div of INITIAL_DIVISIONS) {
          const id = div.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          await setDoc(doc(db, DIVISIONS_COLLECTION, id), {
            name: div.name,
            color: div.color,
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
  actor?: AuditActor,
  color?: CategoryColor
): Promise<string> {
  const { db, collection, addDoc, getDocs } = await firestore();
  const divisionsRef = collection(db, DIVISIONS_COLLECTION);
  const norm = normalizeLabel(name);
  const existing = await getDocs(divisionsRef);
  let duplicate = false;
  existing.forEach((d) => {
    if (normalizeLabel(String(d.data().name || '')) === norm) duplicate = true;
  });
  if (duplicate) throw new Error('DUPLICATE');
  const docRef = await addDoc(
    divisionsRef,
    removeUndefinedFields({
      name,
      color,
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
 * Rename a division in Firestore (admin only by Firestore rules).
 * Also updates every note that references the old name, so the agenda stays consistent.
 */
export async function updateDivision(
  divisionId: string,
  oldName: string,
  newName: string,
  actor?: AuditActor,
  color?: CategoryColor
): Promise<void> {
  const { db, doc, updateDoc, collection, query, where, getDocs } = await firestore();

  await updateDoc(doc(db, DIVISIONS_COLLECTION, divisionId), {
    name: newName,
    color: color || null,
    updatedAt: new Date().toISOString()
  });

  const notesRef = collection(db, 'notes');
  const snapshot = await getDocs(query(notesRef, where('division', '==', oldName)));
  for (const noteSnap of snapshot.docs) {
    await updateDoc(noteSnap.ref, { division: newName });
  }

  await logAuditEntry({
    action: 'division_update',
    entityType: 'division',
    entityId: divisionId,
    entityTitle: newName,
    actorUid: actor?.uid,
    actorName: actor?.name,
    actorEmail: actor?.email,
    details:
      oldName !== newName
        ? `Renomeou a divisão "${oldName}" para "${newName}"${snapshot.size > 0 ? ` e atualizou ${snapshot.size} anotação(ões)` : ''}`
        : color
          ? `Atualizou a cor da divisão "${newName}" para ${color}`
          : `Atualizou a divisão "${newName}"`
  });
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