import type { Firestore } from '@mm/firestore-rest';

import { toDate, toNumber, toStringOrNull } from './values';

/** Port des règles de quota Rysmo (functions/src/rysmo.ts). */

export const BASE_DAILY_QUOTA = 2;
/** Bonus Club des Digitos : 5 requêtes par jour au total. */
export const CLUB_BONUS_QUOTA = 3;
export const SUBSCRIPTION_QUOTAS: Record<string, number> = {
  lite: 20,
  pro: 100,
};

/** Africa/Dakar est à UTC+0 : la date UTC est la bonne clé de journée. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getActiveRysmoSubscription(
  db: Firestore,
  uid: string,
): Promise<string | null> {
  const found = await db.query({
    collection: 'rysmoSubscriptions',
    where: [
      { field: 'userId', op: '==', value: uid },
      { field: 'status', op: '==', value: 'active' },
    ],
    limit: 1,
  });
  if (found.length === 0) return null;

  const data = found[0].data;
  const expiresAt = toDate(data.expiresAt);
  if (expiresAt && expiresAt < new Date()) return null;
  return toStringOrNull(data.plan);
}

export async function hasActiveClubSub(db: Firestore, uid: string): Promise<boolean> {
  const snapshot = await db.get(`club_subscriptions/${uid}`);
  if (!snapshot) return false;
  if (snapshot.data.status !== 'active') return false;

  const expiresAt = toDate(snapshot.data.expiresAt);
  return !(expiresAt && expiresAt < new Date());
}

export interface QuotaLimits {
  dailyLimit: number;
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
  plan: string | null;
}

/** Détermine le plafond quotidien applicable à un utilisateur. */
export async function resolveQuotaLimits(db: Firestore, uid: string): Promise<QuotaLimits> {
  const [plan, clubActive] = await Promise.all([
    getActiveRysmoSubscription(db, uid),
    hasActiveClubSub(db, uid),
  ]);

  if (plan && SUBSCRIPTION_QUOTAS[plan]) {
    return {
      dailyLimit: SUBSCRIPTION_QUOTAS[plan],
      hasActiveSubscription: true,
      hasClubBonus: false,
      plan,
    };
  }
  if (clubActive) {
    return {
      dailyLimit: BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA,
      hasActiveSubscription: false,
      hasClubBonus: true,
      plan,
    };
  }
  return { dailyLimit: BASE_DAILY_QUOTA, hasActiveSubscription: false, hasClubBonus: false, plan };
}

export interface QuotaUsage {
  dayCount: number;
  packBalance: number;
}

/** Lit la consommation du jour, sans la modifier. */
export async function readQuotaUsage(db: Firestore, uid: string): Promise<QuotaUsage> {
  const snapshot = await db.get(`_ratelimits/rysmo_${uid}`);
  const data = snapshot?.data ?? {};
  const sameDay = data.dayKey === todayKey();

  return {
    dayCount: sameDay ? toNumber(data.dayCount) : 0,
    packBalance: toNumber(data.packBalance),
  };
}
