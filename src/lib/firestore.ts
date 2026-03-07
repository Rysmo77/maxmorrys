import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, documentId,
  type QueryConstraint, type Unsubscribe, type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { BlogPost, Formation, User, ContactMessage, Enrollment } from '../types';

// ── Generic helpers ──────────────────────────────────────────────────────────

export async function getCollection<T>(col: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

export async function getDocById<T>(col: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

export async function createDoc<T extends DocumentData>(col: string, data: T): Promise<string> {
  const ref = await addDoc(collection(db, col), { ...data, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function setDocById<T extends DocumentData>(col: string, id: string, data: T): Promise<void> {
  await setDoc(doc(db, col, id), data, { merge: true });
}

export async function updateDocById(col: string, id: string, data: Partial<DocumentData>): Promise<void> {
  await updateDoc(doc(db, col, id), data);
}

export async function deleteDocById(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id));
}

export function subscribeCollection<T>(
  col: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
): Unsubscribe {
  const q = query(collection(db, col), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
  });
}

// ── Blog ─────────────────────────────────────────────────────────────────────

export async function getPublishedPosts(limitN = 50): Promise<BlogPost[]> {
  const data = await getCollection<BlogPost>('blog', where('status', '==', 'published'));
  return data
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limitN);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const results = await getCollection<BlogPost>('blog', where('slug', '==', slug), where('status', '==', 'published'), limit(1));
  return results[0] ?? null;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  return getCollection<BlogPost>('blog', orderBy('publishedAt', 'desc'));
}

export async function savePost(data: Omit<BlogPost, 'id'>, id?: string): Promise<string> {
  if (id) {
    await setDocById('blog', id, data as DocumentData);
    return id;
  }
  return createDoc('blog', data as DocumentData);
}

export async function deletePost(id: string): Promise<void> {
  return deleteDocById('blog', id);
}

// ── Formations ───────────────────────────────────────────────────────────────

export async function getPublishedFormations(): Promise<Formation[]> {
  // No orderBy — avoids composite index requirement; sort client-side
  const data = await getCollection<Formation>('formations', where('status', '==', 'published'));
  return data.sort((a, b) => {
    const da = (a as Formation & { createdAt?: string }).createdAt ?? '';
    const db_ = (b as Formation & { createdAt?: string }).createdAt ?? '';
    return db_.localeCompare(da);
  });
}

export async function getFormationBySlug(slug: string): Promise<Formation | null> {
  const results = await getCollection<Formation>('formations', where('slug', '==', slug), where('status', '==', 'published'), limit(1));
  return results[0] ?? null;
}

export async function getAllFormations(): Promise<Formation[]> {
  return getCollection<Formation>('formations', orderBy('createdAt', 'desc'));
}

export async function saveFormation(data: Omit<Formation, 'id'>, id?: string): Promise<string> {
  if (id) {
    await setDocById('formations', id, data as DocumentData);
    return id;
  }
  return createDoc('formations', data as DocumentData);
}

export async function deleteFormation(id: string): Promise<void> {
  return deleteDocById('formations', id);
}

export async function getFormationsByIds(ids: string[]): Promise<Formation[]> {
  if (ids.length === 0) return [];
  // Firestore 'in' operator supports up to 30 items; slice to be safe
  const snap = await getDocs(query(collection(db, 'formations'), where(documentId(), 'in', ids.slice(0, 30))));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Formation));
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  return getCollection<User>('users', orderBy('createdAt', 'desc'));
}

export async function getUserById(uid: string): Promise<User | null> {
  return getDocById<User>('users', uid);
}

export async function updateUserRole(uid: string, role: 'student' | 'admin' | 'support'): Promise<void> {
  return updateDocById('users', uid, { role });
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  return updateDocById('users', uid, clean as Partial<DocumentData>);
}

export async function adminUpdateUser(uid: string, data: Partial<User>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await setDocById('users', uid, clean as DocumentData);
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function subscribeMessages(callback: (msgs: ContactMessage[]) => void): Unsubscribe {
  return subscribeCollection<ContactMessage>('messages', [orderBy('sentAt', 'desc')], callback);
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
  return updateDocById('messages', id, { status });
}

export async function deleteMessage(id: string): Promise<void> {
  return deleteDocById('messages', id);
}

// ── Enrollments ───────────────────────────────────────────────────────────────

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  return getCollection<Enrollment>('enrollments', where('userId', '==', userId));
}

export async function createEnrollment(userId: string, formationId: string): Promise<void> {
  const id = `${userId}_${formationId}`;
  await setDocById('enrollments', id, {
    userId,
    formationId,
    enrolledAt: new Date().toISOString(),
    progress: 0,
    completedLessons: [],
    certificateIssued: false,
  } as DocumentData);
}

export async function getAllEnrollments(): Promise<Enrollment[]> {
  return getCollection<Enrollment>('enrollments');
}

export async function deleteEnrollment(id: string): Promise<void> {
  return deleteDocById('enrollments', id);
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  completedLessons: string[],
  progress: number,
): Promise<void> {
  return updateDocById('enrollments', enrollmentId, { completedLessons, progress });
}

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
  const [users, formations, blog, messages, enrollments, newsletter] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'formations')),
    getDocs(collection(db, 'blog')),
    getDocs(collection(db, 'messages')),
    getDocs(collection(db, 'enrollments')),
    getDocs(collection(db, 'newsletter')),
  ]);
  const newMessages = messages.docs.filter((d) => d.data().status === 'new').length;
  const publishedPosts = blog.docs.filter((d) => d.data().status === 'published').length;
  const publishedFormations = formations.docs.filter((d) => d.data().status === 'published').length;
  return {
    users: users.size,
    formations: formations.size,
    publishedFormations,
    articles: blog.size,
    publishedPosts,
    messages: messages.size,
    newMessages,
    enrollments: enrollments.size,
    subscribers: newsletter.size,
  };
}

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

// ── Certificates ──────────────────────────────────────────────────────────────

import type { Certificate } from '../types';

export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  return getCollection<Certificate>('certificates', where('userId', '==', userId));
}

export async function issueCertificate(userId: string, formationId: string, formationTitle: string): Promise<string> {
  const certId = `${userId}_${formationId}`;
  const existing = await getDocById<Certificate>('certificates', certId);
  if (existing) return certId;
  const certificateCode = `MM-${Date.now().toString(36).toUpperCase()}`;
  await setDocById('certificates', certId, {
    userId,
    formationId,
    formationTitle,
    issuedAt: new Date().toISOString(),
    certificateCode,
  } as Certificate);
  return certId;
}

export async function getUserMessages(email: string): Promise<import('../types').ContactMessage[]> {
  const data = await getCollection<import('../types').ContactMessage>('messages', where('email', '==', email));
  return data.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

// ── Podcasts ──────────────────────────────────────────────────────────────────

import type { Podcast, Video, Appointment } from '../types';

export async function getAllPodcasts(): Promise<Podcast[]> {
  return getCollection<Podcast>('podcasts', orderBy('publishedAt', 'desc'));
}

export async function getPublishedPodcasts(): Promise<Podcast[]> {
  const data = await getCollection<Podcast>('podcasts', where('status', '==', 'published'));
  return data.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPodcastBySlug(slug: string): Promise<Podcast | null> {
  const results = await getCollection<Podcast>('podcasts', where('slug', '==', slug), where('status', '==', 'published'));
  return results[0] ?? null;
}

export async function savePodcast(data: Omit<Podcast, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('podcasts', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('podcasts', rest as Parameters<typeof createDoc>[1]);
}

export async function deletePodcast(id: string): Promise<void> {
  return deleteDocById('podcasts', id);
}

// ── Videos ───────────────────────────────────────────────────────────────────

export async function getAllVideos(): Promise<Video[]> {
  return getCollection<Video>('videos', orderBy('publishedAt', 'desc'));
}

export async function getPublishedVideos(): Promise<Video[]> {
  const data = await getCollection<Video>('videos', where('status', '==', 'published'));
  return data.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const results = await getCollection<Video>('videos', where('slug', '==', slug), where('status', '==', 'published'));
  return results[0] ?? null;
}

export async function saveVideo(data: Omit<Video, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('videos', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('videos', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteVideo(id: string): Promise<void> {
  return deleteDocById('videos', id);
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<import('../types').Transaction[]> {
  return getCollection<import('../types').Transaction>('transactions', orderBy('createdAt', 'desc'));
}

export async function updateTransactionStatus(id: string, status: import('../types').Transaction['status']): Promise<void> {
  return updateDocById('transactions', id, { status });
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function getAllCoupons(): Promise<import('../types').Coupon[]> {
  return getCollection<import('../types').Coupon>('coupons', orderBy('createdAt', 'desc'));
}

export async function saveCoupon(data: Omit<import('../types').Coupon, 'id'> & { id?: string }): Promise<string> {
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

export async function getAllAnnouncements(): Promise<import('../types').Announcement[]> {
  return getCollection<import('../types').Announcement>('announcements', orderBy('startDate', 'desc'));
}

export async function getActiveAnnouncements(): Promise<import('../types').Announcement[]> {
  const today = new Date().toISOString().split('T')[0];
  // No orderBy — avoids composite index on active+startDate
  const all = await getCollection<import('../types').Announcement>('announcements', where('active', '==', true));
  return all
    .filter((a) => a.startDate <= today && (!a.endDate || a.endDate >= today))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function saveAnnouncement(data: Omit<import('../types').Announcement, 'id'> & { id?: string }): Promise<string> {
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

// ── FAQ ───────────────────────────────────────────────────────────────────────

export async function getAllFAQ(): Promise<import('../types').FAQ[]> {
  return getCollection<import('../types').FAQ>('faq', orderBy('order', 'asc'));
}

export async function saveFAQItem(data: Omit<import('../types').FAQ, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('faq', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('faq', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteFAQItem(id: string): Promise<void> {
  return deleteDocById('faq', id);
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function getAllAppointments(): Promise<Appointment[]> {
  return getCollection<Appointment>('appointments', orderBy('date', 'desc'));
}

export async function saveAppointment(data: Omit<Appointment, 'id' | 'status' | 'createdAt'>): Promise<string> {
  return createDoc('appointments', {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  } as Parameters<typeof createDoc>[1]);
}

export async function updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
  return updateDocById('appointments', id, { status });
}

// ── Testimonials ──────────────────────────────────────────────────────────────

export async function getAllTestimonials(): Promise<import('../types').Testimonial[]> {
  return getCollection<import('../types').Testimonial>('testimonials', orderBy('featured', 'desc'));
}

export async function getFeaturedTestimonials(): Promise<import('../types').Testimonial[]> {
  return getCollection<import('../types').Testimonial>('testimonials', where('featured', '==', true));
}

export async function saveTestimonial(data: Omit<import('../types').Testimonial, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('testimonials', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('testimonials', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteTestimonial(id: string): Promise<void> {
  return deleteDocById('testimonials', id);
}

export async function getMyTestimonial(userId: string): Promise<import('../types').Testimonial | null> {
  const results = await getCollection<import('../types').Testimonial>('testimonials', where('userId', '==', userId), limit(1));
  return results[0] ?? null;
}

export async function submitTestimonial(data: {
  userId: string;
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
}): Promise<string> {
  return createDoc('testimonials', {
    ...data,
    company: '',
    featured: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  } as Parameters<typeof createDoc>[1]);
}

// Export serverTimestamp for use in components
export { serverTimestamp };
