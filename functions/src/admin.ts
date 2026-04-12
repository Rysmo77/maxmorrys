import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const adminCreateUser = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    // Verify caller is admin
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { email, password, displayName, firstName, lastName, phone, role } = request.data as {
      email: string;
      password: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
    };

    if (!email || !password || !displayName) {
      throw new HttpsError('invalid-argument', 'Email, mot de passe et nom sont obligatoires.');
    }
    const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_RE.test(email.trim())) {
      throw new HttpsError('invalid-argument', 'Format d\'email invalide.');
    }
    if (password.length < 8) {
      throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 8 caractères.');
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password, displayName });

    // Create Firestore document
    const newUser = {
      uid: userRecord.uid,
      email,
      displayName,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      role: (role === 'admin' ? 'student' : (role as 'student' | 'support')) || 'student',
      createdAt: new Date().toISOString(),
      preferences: { theme: 'system', language: 'fr', newsletter: false },
    };
    await admin.firestore().doc(`users/${userRecord.uid}`).set(newUser);

    return { uid: userRecord.uid, success: true };
  }
);

export const adminManageEnrollment = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { action, userId, formationId } = request.data as {
      action: 'create' | 'delete';
      userId: string;
      formationId: string;
    };

    if (!userId || !formationId) {
      throw new HttpsError('invalid-argument', 'userId et formationId sont obligatoires.');
    }

    const enrollmentId = `${userId}_${formationId}`;
    const enrollmentRef = admin.firestore().doc(`enrollments/${enrollmentId}`);

    if (action === 'create') {
      const existing = await enrollmentRef.get();
      if (existing.exists) {
        throw new HttpsError('already-exists', 'Cet utilisateur est déjà inscrit à cette formation.');
      }
      await enrollmentRef.set({
        id: enrollmentId,
        userId,
        formationId,
        enrolledAt: new Date().toISOString(),
        progress: 0,
        completedLessons: [],
        certificateIssued: false,
      });
      return { success: true, enrollmentId };
    } else if (action === 'delete') {
      await enrollmentRef.delete();
      return { success: true };
    } else {
      throw new HttpsError('invalid-argument', 'Action invalide. Utilisez "create" ou "delete".');
    }
  }
);
