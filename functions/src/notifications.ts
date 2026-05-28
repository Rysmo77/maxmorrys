import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
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

// ── Coach proactif Rysmo : félicitations à la complétion + cours suivant ─────
export const rysmoCoachNudge = onDocumentUpdated('enrollments/{enrollmentId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  // Ne se déclenche qu'au franchissement de 100% (transition unique → pas de doublon)
  if (before.progress >= 100 || after.progress < 100) return;

  const userId = after.userId;
  const formationSnap = await db.collection('formations').doc(after.formationId).get();
  const justFinished = formationSnap.data()?.title || 'ta formation';

  // Suggérer un cours suivant : une formation publiée pas encore suivie (même catégorie en priorité)
  let suggestion: { title: string; slug: string } | null = null;
  try {
    const category = formationSnap.data()?.category;
    const enrolledSnap = await db.collection('enrollments').where('userId', '==', userId).get();
    const enrolledIds = new Set(enrolledSnap.docs.map((d) => d.data().formationId));
    const publishedSnap = await db.collection('formations').where('status', '==', 'published').limit(50).get();
    const candidates = publishedSnap.docs.filter((d) => !enrolledIds.has(d.id));
    const sameCat = candidates.find((d) => d.data().category === category);
    const pick = sameCat || candidates[0];
    if (pick) suggestion = { title: pick.data().title, slug: pick.data().slug };
  } catch {
    // suggestion optionnelle
  }

  const message = suggestion
    ? `Bravo, tu as terminé "${justFinished}" ! Prêt pour la suite ? "${suggestion.title}" est un bon prochain pas. Demande à Rysmo un plan pour t'y mettre.`
    : `Bravo, tu as terminé "${justFinished}" ! Demande à Rysmo comment mettre en pratique ce que tu viens d'apprendre.`;

  await db.collection(`notifications/${userId}/items`).add({
    userId,
    type: 'system',
    title: 'Félicitations !',
    message,
    read: false,
    createdAt: new Date().toISOString(),
    link: suggestion ? `/formations/${suggestion.slug}` : '/mon-espace/tableau-de-bord',
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
  // Bound reads with limit(500) and orderBy lastActivityAt asc to process most inactive first
  const enrollmentsSnap = await db.collection('enrollments')
    .where('progress', '<', 100)
    .orderBy('lastActivityAt', 'asc')
    .limit(500)
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
