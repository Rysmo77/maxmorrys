import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, documentId,
  arrayUnion, arrayRemove, getCountFromServer, increment,
  type QueryConstraint, type Unsubscribe, type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { BlogPost, Formation, User, ContactMessage, Enrollment, AppNotification } from '../types';

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
    const bCreatedAt = (b as Formation & { createdAt?: string }).createdAt ?? '';
    return bCreatedAt.localeCompare(da);
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

const ALLOWED_PROFILE_FIELDS = ['displayName', 'firstName', 'lastName', 'phone', 'avatar', 'bio', 'preferences'] as const;

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => v !== undefined && (ALLOWED_PROFILE_FIELDS as readonly string[]).includes(k))
  );
  if (Object.keys(clean).length === 0) return;
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
  const [
    usersSnap, formationsSnap, blogSnap, messagesSnap, enrollmentsSnap, newsletterSnap,
    publishedFormationsSnap, publishedPostsSnap, newMessagesSnap,
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
  const certificateCode = `MM-${crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase()}`;
  await setDocById('certificates', certId, {
    userId,
    formationId,
    formationTitle,
    issuedAt: new Date().toISOString(),
    certificateCode,
  } as Certificate);
  return certId;
}

export async function getUserMessages(userId: string): Promise<import('../types').ContactMessage[]> {
  const data = await getCollection<import('../types').ContactMessage>('messages', where('userId', '==', userId));
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

// ── Club des Digitos ──────────────────────────────────────────────────────────

import type {
  ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent,
  ClubDigitosSession, ClubDigitosInfo, ClubDigitosComment,
  ClubEventRegistration, ClubSessionRegistration,
} from '../types';

export async function getClubSubscription(userId: string): Promise<ClubDigitosSubscription | null> {
  return getDocById<ClubDigitosSubscription>('club_subscriptions', userId);
}

export async function activateClubSubscription(
  userId: string, userEmail: string, userName: string, autoRenew: boolean,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  await setDocById('club_subscriptions', userId, {
    userId,
    userEmail,
    userName,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    autoRenew,
    status: 'pending',
    amount: 10000,
  } as DocumentData);
}

export async function updateClubSubscriptionStatus(
  userId: string, status: ClubDigitosSubscription['status'],
): Promise<void> {
  return updateDocById('club_subscriptions', userId, { status });
}

export async function getAllClubSubscriptions(): Promise<ClubDigitosSubscription[]> {
  const data = await getCollection<ClubDigitosSubscription>('club_subscriptions');
  return data.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// Club Posts
export async function getClubPosts(limitN = 50): Promise<ClubDigitosPost[]> {
  const data = await getCollection<ClubDigitosPost>('club_posts');
  return data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limitN);
}

export async function createClubPost(
  data: Omit<ClubDigitosPost, 'id' | 'likes' | 'reposts' | 'commentsCount' | 'createdAt'>,
): Promise<string> {
  return createDoc('club_posts', {
    ...data,
    likes: [],
    reposts: [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  } as DocumentData);
}

export async function deleteClubPost(id: string): Promise<void> {
  return deleteDocById('club_posts', id);
}

export async function likeClubPost(postId: string, userId: string, liked: boolean): Promise<void> {
  await updateDoc(doc(db, 'club_posts', postId), {
    likes: liked ? arrayUnion(userId) : arrayRemove(userId),
  });
}

export async function repostClubPost(postId: string, userId: string, reposted: boolean): Promise<void> {
  await updateDoc(doc(db, 'club_posts', postId), {
    reposts: reposted ? arrayUnion(userId) : arrayRemove(userId),
  });
}

// Club Comments (subcollection under club_posts)
export async function getClubComments(postId: string): Promise<ClubDigitosComment[]> {
  const data = await getCollection<ClubDigitosComment>(`club_posts/${postId}/comments`);
  return data.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addClubComment(
  postId: string,
  data: Omit<ClubDigitosComment, 'id' | 'postId' | 'createdAt'>,
): Promise<string> {
  const id = await createDoc(`club_posts/${postId}/comments`, {
    ...data,
    postId,
    createdAt: new Date().toISOString(),
  });
  // Increment commentsCount on the post
  await updateDoc(doc(db, 'club_posts', postId), {
    commentsCount: increment(1),
  });
  return id;
}

export async function deleteClubComment(postId: string, commentId: string): Promise<void> {
  await deleteDocById(`club_posts/${postId}/comments`, commentId);
  await updateDoc(doc(db, 'club_posts', postId), {
    commentsCount: increment(-1),
  });
}

// Club Events
export async function getClubEvents(): Promise<ClubDigitosEvent[]> {
  const data = await getCollection<ClubDigitosEvent>('club_events');
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveClubEvent(
  data: Omit<ClubDigitosEvent, 'id'> & { id?: string },
): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('club_events', id, rest as DocumentData);
    return id;
  }
  return createDoc('club_events', rest as DocumentData);
}

export async function deleteClubEvent(id: string): Promise<void> {
  return deleteDocById('club_events', id);
}

// Club Live Sessions
export async function getClubSessions(): Promise<ClubDigitosSession[]> {
  const data = await getCollection<ClubDigitosSession>('club_sessions');
  return data.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function saveClubSession(
  data: Omit<ClubDigitosSession, 'id'> & { id?: string },
): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('club_sessions', id, rest as DocumentData);
    return id;
  }
  return createDoc('club_sessions', rest as DocumentData);
}

export async function deleteClubSession(id: string): Promise<void> {
  return deleteDocById('club_sessions', id);
}

// Club Exclusive Infos
export async function getClubExclusiveInfos(): Promise<ClubDigitosInfo[]> {
  const data = await getCollection<ClubDigitosInfo>('club_infos');
  return data.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function saveClubInfo(
  data: Omit<ClubDigitosInfo, 'id'> & { id?: string },
): Promise<string> {
  const { id, likes, ...rest } = data;
  if (id) {
    // Use updateDoc to preserve the existing likes array
    await updateDoc(doc(db, 'club_infos', id), rest as DocumentData);
    return id;
  }
  return createDoc('club_infos', { likes: likes ?? [], ...rest } as DocumentData);
}

export async function deleteClubInfo(id: string): Promise<void> {
  return deleteDocById('club_infos', id);
}

export async function likeClubInfo(infoId: string, userId: string, liked: boolean): Promise<void> {
  await updateDoc(doc(db, 'club_infos', infoId), {
    likes: liked ? arrayUnion(userId) : arrayRemove(userId),
  });
}

// Club Event Registrations
export async function registerForClubEvent(
  eventId: string, userId: string, userName: string, userEmail?: string,
): Promise<void> {
  await setDoc(doc(db, 'club_events', eventId, 'registrations', userId), {
    eventId, userId, userName, userEmail: userEmail ?? '', registeredAt: new Date().toISOString(),
  });
}

export async function unregisterFromClubEvent(eventId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, 'club_events', eventId, 'registrations', userId));
}

export async function isRegisteredForEvent(eventId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'club_events', eventId, 'registrations', userId));
  return snap.exists();
}

export async function getEventRegistrations(eventId: string): Promise<ClubEventRegistration[]> {
  return getCollection<ClubEventRegistration>(`club_events/${eventId}/registrations`);
}

// Club Session Registrations
export async function registerForClubSession(
  sessionId: string, userId: string, userName: string, userEmail?: string,
): Promise<void> {
  await setDoc(doc(db, 'club_sessions', sessionId, 'registrations', userId), {
    sessionId, userId, userName, userEmail: userEmail ?? '', registeredAt: new Date().toISOString(),
  });
}

export async function unregisterFromClubSession(sessionId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, 'club_sessions', sessionId, 'registrations', userId));
}

export async function isRegisteredForSession(sessionId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'club_sessions', sessionId, 'registrations', userId));
  return snap.exists();
}

export async function getSessionRegistrations(sessionId: string): Promise<ClubSessionRegistration[]> {
  return getCollection<ClubSessionRegistration>(`club_sessions/${sessionId}/registrations`);
}

// ── Notifications ──────────────────────────────────────────────────────────

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
  await Promise.all(unread.map((n) => markNotificationRead(userId, n.id)));
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
