import {
  collection, doc, getDocs, addDoc, setDoc, deleteDoc,
  query, orderBy,
} from 'firebase/firestore';
import { db } from './helpers';

// ── Notes (user subcollection) ────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  formationId?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'notes'), orderBy('updatedAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
}

export async function saveNote(userId: string, note: Omit<Note, 'id'>, id?: string): Promise<string> {
  const now = new Date().toISOString();
  const data = { ...note, updatedAt: now };
  if (id) {
    await setDoc(doc(db, 'users', userId, 'notes', id), data, { merge: true });
    return id;
  }
  const ref = await addDoc(collection(db, 'users', userId, 'notes'), { ...data, createdAt: now });
  return ref.id;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
}
