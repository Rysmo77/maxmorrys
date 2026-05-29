import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy,
} from 'firebase/firestore';
import { db, getCollection, deleteDocById } from './helpers';
import type { Conversation, DmMessage, DmReport } from '../../types';

/** Deterministic conversation id for a pair of users (order-independent). */
export function conversationId(a: string, b: string): string {
  return [a, b].sort().join('__');
}

export async function getOrCreateConversation(
  me: { id: string; name: string; photo?: string },
  other: { id: string; name: string; photo?: string },
): Promise<string> {
  const id = conversationId(me.id, other.id);
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [me.id, other.id],
      participantNames: { [me.id]: me.name, [other.id]: other.name },
      participantPhotos: { [me.id]: me.photo ?? '', [other.id]: other.photo ?? '' },
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
    });
  }
  return id;
}

export function listenConversations(uid: string, cb: (convs: Conversation[]) => void): () => void {
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation));
    list.sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
    cb(list);
  }, () => cb([]));
}

export function listenMessages(convId: string, cb: (msgs: DmMessage[]) => void): () => void {
  const q = query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DmMessage)));
  }, () => cb([]));
}

export async function sendDmMessage(convId: string, senderId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const now = new Date().toISOString();
  await addDoc(collection(db, 'conversations', convId, 'messages'), {
    senderId, text: trimmed, createdAt: now,
  });
  await updateDoc(doc(db, 'conversations', convId), { lastMessage: trimmed, lastMessageAt: now });
}

export async function reportDmMessage(
  convId: string, message: DmMessage, reporterId: string, reportedUserId: string,
): Promise<void> {
  await addDoc(collection(db, 'dm_reports'), {
    convId,
    messageId: message.id,
    text: message.text,
    reporterId,
    reportedUserId,
    status: 'open',
    createdAt: new Date().toISOString(),
  });
}

// ── Modération admin ───────────────────────────────────────────────────────
export async function getDmReports(): Promise<DmReport[]> {
  const all = await getCollection<DmReport>('dm_reports');
  return all.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function updateDmReportStatus(id: string, status: DmReport['status']): Promise<void> {
  await updateDoc(doc(db, 'dm_reports', id), { status });
}

export async function deleteDmReport(id: string): Promise<void> {
  return deleteDocById('dm_reports', id);
}

/** Admin : supprime un message signalé (modération ciblée). */
export async function deleteDmMessage(convId: string, msgId: string): Promise<void> {
  await deleteDoc(doc(db, 'conversations', convId, 'messages', msgId));
}
