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
  /*
   * `tutorName` — le nom que la personne donne à son répétiteur.
   *
   * Il manquait, et le manque était SILENCIEUX : `updateUserProfile` filtre par cette liste
   * puis, si rien ne reste, sort sans écrire ET SANS ERREUR. Un écran de renommage aurait
   * paru fonctionner — champ rempli, bouton pressé, aucun message — pour un nom qui ne
   * partait jamais.
   *
   * Tout le reste existait déjà : le champ sur le type `User`, `tutorName()` qui le lit à
   * treize endroits, `validateTutorName()` et ses suggestions, et la règle Firestore, qui
   * laisse le propriétaire écrire tout sauf `role` et `uid`. Cette ligne était la seule
   * porte fermée.
   */
  'tutorName',
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
