import {
  doc, getDoc, setDoc, deleteDoc, updateDoc,
  arrayUnion, arrayRemove, increment,
  orderBy, where, limit as firestoreLimit,
  type DocumentData,
} from 'firebase/firestore';
import { getCollection, getDocById, createDoc, setDocById, deleteDocById, updateDocById, db } from './helpers';
import type {
  ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent,
  ClubDigitosSession, ClubDigitosInfo, ClubDigitosComment, ClubDigitosChallenge,
  ClubEventRegistration, ClubSessionRegistration, ClubMemberProfile, ClubOpportunity,
} from '../../types';

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
    /*
     * ⚠️ Octroi gracieux par un administrateur : AUCUN franc n'est encaissé, le montant est
     * donc nul. Il portait le plein tarif auparavant, ce qui gonflait le chiffre d'affaires
     * du Club d'un abonnement fictif à chaque octroi. Un vrai paiement passe par
     * `createClubCharge`, côté serveur, qui écrit le montant réellement débité.
     */
    amount: 0,
  } as DocumentData);
}

export async function updateClubSubscriptionStatus(
  userId: string, status: ClubDigitosSubscription['status'],
): Promise<void> {
  return updateDocById('club_subscriptions', userId, { status });
}

export async function getAllClubSubscriptions(): Promise<ClubDigitosSubscription[]> {
  return getCollection<ClubDigitosSubscription>('club_subscriptions', orderBy('startedAt', 'desc'));
}

// Club Posts
export async function getClubPosts(limitN = 50): Promise<ClubDigitosPost[]> {
  return getCollection<ClubDigitosPost>('club_posts', orderBy('createdAt', 'desc'), firestoreLimit(limitN));
}

export async function createClubPost(
  data: Omit<ClubDigitosPost, 'id' | 'likes' | 'reposts' | 'commentsCount' | 'createdAt'>,
): Promise<string> {
  // Firestore rejects `undefined`; strip undefined keys before writing.
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  return createDoc('club_posts', {
    ...clean,
    likes: [],
    reposts: [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  } as DocumentData);
}

export async function voteClubPoll(postId: string, userId: string, optionIndex: number): Promise<void> {
  await updateDoc(doc(db, 'club_posts', postId), { [`pollVotes.${userId}`]: optionIndex });
}

export async function deleteClubPost(id: string): Promise<void> {
  return deleteDocById('club_posts', id);
}

export async function updateClubPost(id: string, data: Partial<ClubDigitosPost>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await updateDoc(doc(db, 'club_posts', id), clean as DocumentData);
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
  return getCollection<ClubDigitosEvent>('club_events', orderBy('date', 'asc'));
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
  return getCollection<ClubDigitosSession>('club_sessions', orderBy('scheduledAt', 'asc'));
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
  return getCollection<ClubDigitosInfo>('club_infos', orderBy('publishedAt', 'desc'));
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

// ── Challenges (défis hebdomadaires) ───────────────────────────────────────────
export async function getClubChallenges(): Promise<ClubDigitosChallenge[]> {
  return getCollection<ClubDigitosChallenge>('club_challenges', orderBy('startsAt', 'desc'));
}

export async function getActiveClubChallenge(): Promise<ClubDigitosChallenge | null> {
  const all = await getClubChallenges();
  const now = Date.now();
  const live = all.find((c) => c.active && new Date(c.startsAt).getTime() <= now && new Date(c.endsAt).getTime() >= now);
  return live ?? all.find((c) => c.active) ?? null;
}

export async function saveClubChallenge(
  data: Omit<ClubDigitosChallenge, 'id'> & { id?: string },
): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('club_challenges', id, rest as DocumentData);
    return id;
  }
  return createDoc('club_challenges', rest as DocumentData);
}

export async function deleteClubChallenge(id: string): Promise<void> {
  return deleteDocById('club_challenges', id);
}

// ── Annuaire des membres ───────────────────────────────────────────────────────
export async function getMyClubProfile(userId: string): Promise<ClubMemberProfile | null> {
  return getDocById<ClubMemberProfile>('club_profiles', userId);
}

export async function saveClubProfile(userId: string, data: Omit<ClubMemberProfile, 'id' | 'userId' | 'updatedAt'>): Promise<void> {
  await setDocById('club_profiles', userId, { ...data, userId, updatedAt: new Date().toISOString() } as DocumentData);
}

export async function getClubMemberProfiles(): Promise<ClubMemberProfile[]> {
  // `visible` est un booléen stocké : le filtre part au serveur (index à champ
  // unique, automatique et gratuit) au lieu de facturer les profils masqués.
  const visible = await getCollection<ClubMemberProfile>('club_profiles', where('visible', '==', true));
  return visible.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}

/** Admin : tous les profils, visibles ou non. */
export async function getAllClubProfiles(): Promise<ClubMemberProfile[]> {
  const all = await getCollection<ClubMemberProfile>('club_profiles');
  return all.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}

/** Admin : mise à jour partielle d'un profil membre (modération). */
export async function adminUpdateClubProfile(userId: string, data: Partial<ClubMemberProfile>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  await setDocById('club_profiles', userId, { ...clean, updatedAt: new Date().toISOString() } as DocumentData);
}

export async function deleteClubProfile(userId: string): Promise<void> {
  return deleteDocById('club_profiles', userId);
}

/** Keeps the directory snapshot in sync when the user edits socials elsewhere (e.g. ProfileTab).
 *  No-op if the member has no club profile yet (avoids creating phantom hidden profiles). */
export async function syncSocialsToClubProfile(userId: string, socials: Partial<ClubMemberProfile>): Promise<void> {
  const existing = await getDocById<ClubMemberProfile>('club_profiles', userId);
  if (!existing) return;
  const clean = Object.fromEntries(Object.entries(socials).filter(([, v]) => v !== undefined));
  await setDocById('club_profiles', userId, { ...clean, updatedAt: new Date().toISOString() } as DocumentData);
}

// ── Opportunités (job board) ───────────────────────────────────────────────────
export async function getClubOpportunities(): Promise<ClubOpportunity[]> {
  return getCollection<ClubOpportunity>('club_opportunities', orderBy('createdAt', 'desc'));
}

export async function createClubOpportunity(data: Omit<ClubOpportunity, 'id' | 'createdAt'>): Promise<string> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  return createDoc('club_opportunities', { ...clean, createdAt: new Date().toISOString() } as DocumentData);
}

export async function deleteClubOpportunity(id: string): Promise<void> {
  return deleteDocById('club_opportunities', id);
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
