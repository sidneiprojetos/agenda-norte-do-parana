import { getDb } from '../firebase';
import { AuditLog } from '../types';
import { removeUndefinedFields } from '../utils/cleanFirestore';

const AUDIT_COLLECTION = 'auditLogs';
const MAX_LOGS = 800;
const AUDIT_LOG_RETENTION_DAYS = 180;

async function firestore() {
  const db = await getDb();
  const { collection, addDoc, query, orderBy, limit, where, onSnapshot, getDocs, deleteDoc, doc } =
    await import('firebase/firestore');
  return {
    db,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    where,
    onSnapshot,
    getDocs,
    deleteDoc,
    doc
  };
}

/**
 * Append a new entry to the audit log collection. Logging failures are
 * non-blocking (best effort) so CRUD operations never break because of it.
 * Each entry carries an `expireAt` Firestore timestamp so the Firestore TTL
 * policy (180 days) removes it automatically.
 */
export async function logAuditEntry(
  entry: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<string | null> {
  try {
    const { db, collection, addDoc } = await firestore();
    const logsRef = collection(db, AUDIT_COLLECTION);
    const raw = removeUndefinedFields({
      ...entry,
      timestamp: new Date().toISOString(),
      expireAt: new Date(Date.now() + AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    });
    Object.keys(raw).forEach((key) => {
      if (raw[key] === null) delete raw[key];
    });
    const docRef = await addDoc(logsRef, raw);
    return docRef.id;
  } catch (err) {
    console.warn('Falha ao registrar evento no log de auditoria:', err);
    return null;
  }
}

/**
 * Realtime listener for the most recent audit entries, newest first.
 */
export async function subscribeToAuditLogs(
  callback: (logs: AuditLog[]) => void
): Promise<() => void> {
  const { db, collection, query, orderBy, limit, onSnapshot } = await firestore();
  const logsRef = collection(db, AUDIT_COLLECTION);
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(MAX_LOGS));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: AuditLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        logs.push({
          id: docSnap.id,
          action: (data.action as AuditLog['action']) || 'create',
          entityType: (data.entityType as AuditLog['entityType']) || 'note',
          entityId: data.entityId || undefined,
          entityTitle: data.entityTitle || undefined,
          actorUid: data.actorUid || undefined,
          actorName: data.actorName || undefined,
          actorEmail: data.actorEmail || undefined,
          details: data.details || undefined,
          timestamp: data.timestamp || new Date().toISOString()
        });
      });
      callback(logs);
    },
    (error) => {
      console.warn('Falha ao escutar log de auditoria:', error);
    }
  );
}

/**
 * App-level cleanup: removes audit logs whose `expireAt` timestamp is in
 * the past (older than 180 days). Runs in a batch of up to 100 docs
 * per invocation to avoid heavy snapshots. Designed to be called when an
 * admin opens the Auditoria dashboard.
 */
const CLEANUP_BATCH_SIZE = 100;

export async function cleanupExpiredAuditLogs(): Promise<number> {
  try {
    const { db, collection, query, where, limit, getDocs, deleteDoc, doc } = await firestore();
    const logsRef = collection(db, AUDIT_COLLECTION);
    const q = query(logsRef, where('expireAt', '<=', new Date()), limit(CLEANUP_BATCH_SIZE));
    const snapshot = await getDocs(q);
    let removed = 0;
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, AUDIT_COLLECTION, d.id));
      removed++;
    }
    return removed;
  } catch (err) {
    console.warn('Falha na limpeza de logs de auditoria expirados:', err);
    return 0;
  }
}