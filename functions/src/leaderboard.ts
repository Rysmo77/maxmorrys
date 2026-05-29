import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const TOP_N = 20;

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  rank: number;
}

/**
 * Rebuilds the public leaderboard aggregate at `leaderboard/global`.
 * Reads gamification + users via the Admin SDK (bypasses client rules that
 * forbid reading other members' profiles), then writes a denormalized,
 * signed-in-readable top list. Keeps individual gamification docs private.
 */
async function rebuildLeaderboard(): Promise<number> {
  const snap = await db.collection('gamification').orderBy('xp', 'desc').limit(TOP_N).get();

  const entries: LeaderboardEntry[] = [];
  let rank = 1;
  for (const d of snap.docs) {
    const g = d.data();
    const userSnap = await db.collection('users').doc(d.id).get();
    const u = userSnap.data() ?? {};
    entries.push({
      userId: d.id,
      displayName: u.displayName || (u.email ? String(u.email).split('@')[0] : 'Membre'),
      photoURL: u.photoURL || '',
      xp: g.xp ?? 0,
      level: g.level ?? 1,
      rank: rank++,
    });
  }

  // Active member count for public social proof (kept in the same public doc,
  // since club_subscriptions itself is admin-read-only).
  let activeMembers = 0;
  try {
    const countSnap = await db.collection('club_subscriptions').where('status', '==', 'active').count().get();
    activeMembers = countSnap.data().count;
  } catch {
    activeMembers = entries.length;
  }

  await db.doc('leaderboard/global').set({
    entries,
    activeMembers,
    updatedAt: new Date().toISOString(),
  });

  return entries.length;
}

// Scheduled rebuild every 30 minutes.
export const rebuildLeaderboardScheduled = onSchedule('*/30 * * * *', async () => {
  await rebuildLeaderboard();
});

// Admin-triggered manual rebuild (for seeding / immediate refresh).
export const rebuildLeaderboardManual = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
    const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
    if (callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs.');
    }
    const count = await rebuildLeaderboard();
    return { success: true, count };
  },
);
