import {
  collection, doc, getDocs, getDoc, setDoc, query, where, orderBy,
  getCountFromServer,
} from 'firebase/firestore';
import { getCollection, createDoc, setDocById, deleteDocById, updateDocById, db } from './helpers';
import type { Transaction, Coupon, Announcement } from '../../types';

// ── Site Settings ─────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const snap = await getDoc(doc(db, 'settings', 'site'));
  return snap.exists() ? snap.data() : {};
}

export async function saveSiteSettings(data: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db, 'settings', 'site'), data, { merge: true });
}

// ── Newsletter ────────────────────────────────────────────────────────────────

export async function getNewsletterCount(): Promise<number> {
  const snap = await getDocs(collection(db, 'newsletter'));
  return snap.size;
}

// ── Platform stats ────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [
    usersSnap, formationsSnap, blogSnap, messagesSnap, enrollmentsSnap, newsletterSnap,
    publishedFormationsSnap, publishedPostsSnap, newMessagesSnap,
    agencyLeadsSnap, newAgencyLeadsSnap,
  ] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'formations')),
    getCountFromServer(collection(db, 'blog')),
    getCountFromServer(collection(db, 'messages')),
    getCountFromServer(collection(db, 'enrollments')),
    getCountFromServer(collection(db, 'newsletter')),
    getCountFromServer(query(collection(db, 'formations'), where('status', '==', 'published'))),
    getCountFromServer(query(collection(db, 'blog'), where('status', '==', 'published'))),
    getCountFromServer(query(collection(db, 'messages'), where('status', '==', 'new'))),
    getCountFromServer(collection(db, 'agency_leads')),
    getCountFromServer(query(collection(db, 'agency_leads'), where('status', '==', 'new'))),
  ]);
  return {
    users: usersSnap.data().count,
    formations: formationsSnap.data().count,
    publishedFormations: publishedFormationsSnap.data().count,
    articles: blogSnap.data().count,
    publishedPosts: publishedPostsSnap.data().count,
    messages: messagesSnap.data().count,
    newMessages: newMessagesSnap.data().count,
    enrollments: enrollmentsSnap.data().count,
    subscribers: newsletterSnap.data().count,
    agencyLeads: agencyLeadsSnap.data().count,
    newAgencyLeads: newAgencyLeadsSnap.data().count,
  };
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  return getCollection<Transaction>('transactions', orderBy('createdAt', 'desc'));
}

export async function updateTransactionStatus(id: string, status: Transaction['status']): Promise<void> {
  return updateDocById('transactions', id, { status });
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function getAllCoupons(): Promise<Coupon[]> {
  return getCollection<Coupon>('coupons', orderBy('createdAt', 'desc'));
}

export async function saveCoupon(data: Omit<Coupon, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('coupons', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('coupons', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteCoupon(id: string): Promise<void> {
  return deleteDocById('coupons', id);
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function getAllAnnouncements(): Promise<Announcement[]> {
  return getCollection<Announcement>('announcements', orderBy('startDate', 'desc'));
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const today = new Date().toISOString().split('T')[0];
  // No orderBy — avoids composite index on active+startDate
  const all = await getCollection<Announcement>('announcements', where('active', '==', true));
  return all
    .filter((a) => a.startDate <= today && (!a.endDate || a.endDate >= today))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function saveAnnouncement(data: Omit<Announcement, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('announcements', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('announcements', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  return deleteDocById('announcements', id);
}
