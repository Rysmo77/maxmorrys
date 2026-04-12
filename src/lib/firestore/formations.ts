import {
  collection, getDocs, query, where, orderBy, limit, startAfter, documentId,
  type DocumentData,
} from 'firebase/firestore';
import { getCollection, createDoc, setDocById, deleteDocById, db } from './helpers';
import type { Formation } from '../../types';

export async function getPublishedFormations(): Promise<Formation[]> {
  return getCollection<Formation>(
    'formations',
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
  );
}

export async function getPublishedFormationsPaginated(
  pageSize = 12,
  lastCreatedAt?: string,
): Promise<{ formations: Formation[]; hasMore: boolean }> {
  const constraints = [
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    ...(lastCreatedAt ? [startAfter(lastCreatedAt)] : []),
    limit(pageSize + 1),
  ];
  const data = await getCollection<Formation>('formations', ...constraints);
  const hasMore = data.length > pageSize;
  return { formations: data.slice(0, pageSize), hasMore };
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
