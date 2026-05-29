import { orderBy, where, type DocumentData } from 'firebase/firestore';
import { getCollection, getDocById, updateDocById, setDocById } from './helpers';
import type { User, Referral } from '../../types';

export async function getAllUsers(): Promise<User[]> {
  return getCollection<User>('users', orderBy('createdAt', 'desc'));
}

export async function getUserById(uid: string): Promise<User | null> {
  return getDocById<User>('users', uid);
}

export async function updateUserRole(uid: string, role: 'student' | 'admin' | 'support'): Promise<void> {
  return updateDocById('users', uid, { role });
}

export const ALLOWED_PROFILE_FIELDS = [
  'displayName', 'firstName', 'lastName', 'phone', 'avatar', 'bio', 'preferences',
  'birthDate', 'whatsapp', 'linkedin', 'photoURL', 'onboardingCompleted',
  'referralCode', 'referredByCode',
  'city', 'website', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube',
] as const;

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

// ── Parrainage ──────────────────────────────────────────────────────────────
export async function getOrCreateReferralCode(uid: string): Promise<string> {
  const user = await getDocById<User>('users', uid);
  if (user?.referralCode) return user.referralCode;
  const code = (uid.slice(0, 3) + Math.random().toString(36).slice(2, 7)).toUpperCase();
  await updateUserProfile(uid, { referralCode: code });
  return code;
}

export async function getMyReferrals(uid: string): Promise<Referral[]> {
  return getCollection<Referral>('referrals', where('referrerId', '==', uid));
}
