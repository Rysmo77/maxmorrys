import { where, type DocumentData } from 'firebase/firestore';
import { getCollection, setDocById, deleteDocById, updateDocById } from './helpers';
import type { Enrollment } from '../../types';

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  return getCollection<Enrollment>('enrollments', where('userId', '==', userId));
}

export async function createEnrollment(userId: string, formationId: string): Promise<void> {
  const id = `${userId}_${formationId}`;
  const now = new Date().toISOString();
  await setDocById('enrollments', id, {
    userId,
    formationId,
    enrolledAt: now,
    lastActivityAt: now,
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

/**
 * Enregistre la progression d'une inscription.
 *
 * `maxProgress` est le repère de progression la plus haute atteinte : il ne redescend
 * jamais, même quand l'apprenant décoche une leçon. C'est lui qui borne l'attribution de
 * l'XP d'apprentissage à une fois par palier — voir `Enrollment.maxProgress`.
 */
export async function updateEnrollmentProgress(
  enrollmentId: string,
  completedLessons: string[],
  progress: number,
  previousMaxProgress = 0,
): Promise<void> {
  return updateDocById('enrollments', enrollmentId, {
    completedLessons,
    progress,
    maxProgress: Math.max(progress, previousMaxProgress),
    lastActivityAt: new Date().toISOString(),
  });
}
