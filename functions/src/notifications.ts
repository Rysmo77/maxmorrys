import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// ── Auto-create notification on enrollment ──────────────────────────────────
export const onEnrollmentCreated = onDocumentCreated('enrollments/{enrollmentId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const userId = data.userId;
  const formationId = data.formationId;

  // Get formation title
  const formationSnap = await db.collection('formations').doc(formationId).get();
  const formationTitle = formationSnap.data()?.title || 'Formation';

  await db.collection(`notifications/${userId}/items`).add({
    userId,
    type: 'enrollment',
    title: 'Inscription confirmée',
    message: `Tu es inscrit à "${formationTitle}". Commence dès maintenant !`,
    read: false,
    createdAt: new Date().toISOString(),
    link: `/cours/${formationSnap.data()?.slug || ''}`,
  });
});

// ── Auto-create notification on certificate ──────────────────────────────────
export const onCertificateCreated = onDocumentCreated('certificates/{certId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  await db.collection(`notifications/${data.userId}/items`).add({
    userId: data.userId,
    type: 'certificate',
    title: 'Certificat disponible !',
    message: `Ton certificat pour "${data.formationTitle}" est prêt. Partage-le sur LinkedIn !`,
    read: false,
    createdAt: new Date().toISOString(),
    link: `/certificat/${data.certificateCode}`,
  });
});

// ── Streak reminder — runs daily at 8pm UTC ──────────────────────────────────
export const streakReminder = onSchedule('0 20 * * *', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const gamificationSnap = await db.collection('gamification').get();

  for (const doc of gamificationSnap.docs) {
    const data = doc.data();
    if (data.currentStreak > 0 && data.lastActiveDate !== today) {
      // User has a streak but hasn't been active today
      await db.collection(`notifications/${doc.id}/items`).add({
        userId: doc.id,
        type: 'system',
        title: `Ta série de ${data.currentStreak} jours est en danger !`,
        message: 'Complète une leçon avant minuit pour maintenir ta série.',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
});

// ── Course inactivity reminder — runs daily at 10am UTC ──────────────────────
export const courseReminder = onSchedule('0 10 * * *', async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString();

  // Find users with enrollments that haven't been updated in 3+ days
  const enrollmentsSnap = await db.collection('enrollments')
    .where('progress', '<', 100)
    .get();

  for (const enrollDoc of enrollmentsSnap.docs) {
    const data = enrollDoc.data();
    // Only notify if last activity was 3+ days ago
    const lastActivity = data.lastActivityAt || data.enrolledAt;
    if (lastActivity > cutoff) continue;

    // Check if we already sent a reminder recently
    const recentNotif = await db.collection(`notifications/${data.userId}/items`)
      .where('type', '==', 'system')
      .where('createdAt', '>', cutoff)
      .limit(1)
      .get();

    if (!recentNotif.empty) continue;

    const formationSnap = await db.collection('formations').doc(data.formationId).get();
    const title = formationSnap.data()?.title || 'ta formation';

    await db.collection(`notifications/${data.userId}/items`).add({
      userId: data.userId,
      type: 'system',
      title: `Continue ${title}`,
      message: `Tu n'as pas ouvert "${title}" depuis 3 jours. Reprends là où tu t'es arrêté !`,
      read: false,
      createdAt: new Date().toISOString(),
      link: `/cours/${formationSnap.data()?.slug || ''}`,
    });
  }
});
