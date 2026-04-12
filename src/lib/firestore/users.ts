import { orderBy, type DocumentData } from 'firebase/firestore';
import { getCollection, getDocById, updateDocById, setDocById } from './helpers';
import type { User } from '../../types';

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
