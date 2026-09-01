import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, onSnapshot, serverTimestamp,
  type QueryConstraint, type Unsubscribe, type DocumentData,
} from 'firebase/firestore';
import { db } from '../../config/db';
import { captureError } from '../sentry';

// ── Generic helpers ──────────────────────────────────────────────────────────

export async function getCollection<T>(col: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  try {
    const q = query(collection(db, col), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch (error: unknown) {
    captureError(error, { context: `getCollection(${col})` });
    throw error;
  }
}

export async function getDocById<T>(col: string, id: string): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, col, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  } catch (error: unknown) {
    captureError(error, { context: `getDocById(${col}, ${id})` });
    throw error;
  }
}

export async function createDoc<T extends DocumentData>(col: string, data: T): Promise<string> {
  try {
    const ref = await addDoc(collection(db, col), { ...data, createdAt: new Date().toISOString() });
    return ref.id;
  } catch (error: unknown) {
    captureError(error, { context: `createDoc(${col})` });
    throw error;
  }
}

export async function setDocById<T extends DocumentData>(col: string, id: string, data: T): Promise<void> {
  try {
    await setDoc(doc(db, col, id), data, { merge: true });
  } catch (error: unknown) {
    captureError(error, { context: `setDocById(${col}, ${id})` });
    throw error;
  }
}

export async function updateDocById(col: string, id: string, data: Partial<DocumentData>): Promise<void> {
  try {
    await updateDoc(doc(db, col, id), data);
  } catch (error: unknown) {
    captureError(error, { context: `updateDocById(${col}, ${id})` });
    throw error;
  }
}

export async function deleteDocById(col: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, col, id));
  } catch (error: unknown) {
    captureError(error, { context: `deleteDocById(${col}, ${id})` });
    throw error;
  }
}

export function subscribeCollection<T>(
  col: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, col), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
  }, (error) => {
    captureError(error, { context: `subscribeCollection(${col})` });
    onError?.(error);
  });
}

// Re-export serverTimestamp for use in components
export { serverTimestamp };

// Re-export db for modules that need direct Firestore access
export { db };
