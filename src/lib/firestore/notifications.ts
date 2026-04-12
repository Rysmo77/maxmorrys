import {
  collection, doc, addDoc, updateDoc, writeBatch,
  query, orderBy, limit, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getCollection, db } from './helpers';
import type { AppNotification } from '../../types';

export async function getUserNotifications(userId: string, max = 20): Promise<AppNotification[]> {
  return getCollection<AppNotification>(
    `notifications/${userId}/items`,
    orderBy('createdAt', 'desc'),
    limit(max),
  );
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, `notifications/${userId}/items`, notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const items = await getUserNotifications(userId, 50);
  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return;

  const batch = writeBatch(db);
  for (const n of unread) {
    batch.update(doc(db, `notifications/${userId}/items`, n.id), { read: true });
  }
  await batch.commit();
}

export async function createNotification(userId: string, data: Omit<AppNotification, 'id' | 'userId'>): Promise<string> {
  const ref = await addDoc(collection(db, `notifications/${userId}/items`), {
    ...data,
    userId,
  });
  return ref.id;
}

export function subscribeNotifications(userId: string, callback: (notifications: AppNotification[]) => void): Unsubscribe {
  const q = query(
    collection(db, `notifications/${userId}/items`),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
  }, () => {
    // Permission denied or collection doesn't exist yet — return empty
    callback([]);
  });
}
