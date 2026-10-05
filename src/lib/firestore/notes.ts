import {
  collection, doc, getDocs, addDoc, setDoc, deleteDoc,
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

/**
 * ⛔ PAS DE `orderBy('updatedAt')` CÔTÉ SERVEUR, ET C'EST VOULU. Firestore EXCLUT d'une requête
 * triée tout document qui n'a pas le champ de tri — et l'application écrivait ses notes sans
 * `updatedAt` (ni `content`, mais `text`). Elles n'apparaissaient donc jamais ici. On lit
 * tout (une personne a quelques dizaines de notes), on rattrape l'ancien format, on trie ici.
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'notes'));
  return snap.docs
    .map((d) => normaliserNote(d.id, d.data()))
    .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
}

/** Une note du site ou de l'application, ramenée au format du site. */
export function normaliserNote(id: string, data: Record<string, unknown>): Note {
  const texte = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : '');
  const contenu = texte('content') || texte('text');
  return {
    ...(data as Partial<Note>),
    id,
    content: contenu,
    title: texte('title') || texte('lessonLabel') || contenu.split('\n')[0].slice(0, 80),
    createdAt: texte('createdAt'),
    updatedAt: texte('updatedAt') || texte('createdAt'),
  };
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
