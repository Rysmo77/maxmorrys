import { where, type DocumentData } from 'firebase/firestore';
import { getCollection, setDocById, deleteDocById, updateDocById } from './helpers';
import type { Enrollment } from '../../types';

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
