import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const REFERRER_XP = 100;

function levelFromXp(xp: number): number {
  const t = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
  let lvl = 1;
  for (let i = 0; i < t.length; i++) if (xp >= t[i]) lvl = i + 1;
  return Math.min(lvl, 10);
}

/**
 * Rewards a referrer when their referee's Club subscription becomes active.
 * Idempotent via `referralRewarded` on the referee user doc.
 */
export const onReferralConversion = onDocumentWritten('club_subscriptions/{uid}', async (event) => {
  const after = event.data?.after.data();
  const before = event.data?.before.data();
  if (!after || after.status !== 'active') return;
  if (before && before.status === 'active') return; // was already active

  const refereeId = event.params.uid as string;
  const userRef = db.doc(`users/${refereeId}`);
  const userSnap = await userRef.get();
  const u = userSnap.data();
  if (!u?.referredByCode || u.referralRewarded) return;

  const refSnap = await db.collection('users').where('referralCode', '==', u.referredByCode).limit(1).get();
  if (refSnap.empty) return;
  const referrerId = refSnap.docs[0].id;
  if (referrerId === refereeId) return;

  // Award referrer: XP + Ambassadeur badge
  const gamRef = db.doc(`gamification/${referrerId}`);
  await db.runTransaction(async (t) => {
    const g = await t.get(gamRef);
    const data = g.exists ? g.data()! : { xp: 0, level: 1, currentStreak: 0, longestStreak: 0, lastActiveDate: '', badges: [] };
    const newXp = (data.xp ?? 0) + REFERRER_XP;
    const badges: string[] = data.badges ?? [];
    if (!badges.includes('ambassadeur')) badges.push('ambassadeur');
    t.set(gamRef, { ...data, xp: newXp, level: levelFromXp(newXp), badges }, { merge: true });
  });

  // Record the conversion + mark referee rewarded (prevents double reward)
  await db.collection('referrals').add({
    referrerId,
    refereeId,
    refereeName: u.displayName ?? '',
    status: 'converted',
    createdAt: new Date().toISOString(),
  });
  await userRef.update({ referralRewarded: true });
});
