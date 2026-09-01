import { doc, getDoc, setDoc, runTransaction, collection, query, orderBy, limit, getDocs, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/db';
import type { GamificationProfile } from '../types/gamification';
import { getLevelFromXP } from '../types/gamification';

const GAMIFICATION_COL = 'gamification';

const DEFAULT_PROFILE: GamificationProfile = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  badges: [],
};

export async function getGamificationProfile(userId: string): Promise<GamificationProfile | null> {
  const snap = await getDoc(doc(db, GAMIFICATION_COL, userId));
  return snap.exists() ? (snap.data() as GamificationProfile) : null;
}

export async function initGamificationProfile(userId: string): Promise<GamificationProfile> {
  await setDoc(doc(db, GAMIFICATION_COL, userId), DEFAULT_PROFILE);
  return { ...DEFAULT_PROFILE };
}

export async function addXP(userId: string, amount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const ref = doc(db, GAMIFICATION_COL, userId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists() ? (snap.data() as GamificationProfile) : { ...DEFAULT_PROFILE };

    const newXP = data.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > data.level;

    if (snap.exists()) {
      transaction.update(ref, { xp: newXP, level: newLevel });
    } else {
      transaction.set(ref, { ...DEFAULT_PROFILE, xp: newXP, level: newLevel });
    }

    return { newXP, newLevel, leveledUp };
  });
}

export async function updateStreak(userId: string): Promise<{ currentStreak: number; isNew: boolean }> {
  const ref = doc(db, GAMIFICATION_COL, userId);
  const today = new Date().toISOString().slice(0, 10);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists()) {
      transaction.set(ref, { ...DEFAULT_PROFILE, currentStreak: 1, lastActiveDate: today });
      return { currentStreak: 1, isNew: true };
    }

    const data = snap.data() as GamificationProfile;

    if (data.lastActiveDate === today) {
      return { currentStreak: data.currentStreak, isNew: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const newStreak = data.lastActiveDate === yesterdayStr ? data.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, data.longestStreak);

    transaction.update(ref, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
    });

    return { currentStreak: newStreak, isNew: true };
  });
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  const ref = doc(db, GAMIFICATION_COL, userId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists()) {
      transaction.set(ref, { ...DEFAULT_PROFILE, badges: [badgeId] });
      return true;
    }

    const data = snap.data() as GamificationProfile;
    if (data.badges.includes(badgeId)) return false;

    transaction.update(ref, { badges: [...data.badges, badgeId] });
    return true;
  });
}

export async function getLeaderboard(limitCount = 20): Promise<{ userId: string; xp: number; level: number }[]> {
  const q = query(collection(db, GAMIFICATION_COL), orderBy('xp', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    userId: d.id,
    xp: d.data().xp ?? 0,
    level: d.data().level ?? 1,
  }));
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  rank: number;
}

/**
 * Reads the public leaderboard aggregate maintained server-side
 * (Cloud Function `rebuildLeaderboard*`). Safe for any signed-in member —
 * individual gamification docs stay private.
 */
/**
 * Lecture mémoïsée de l'agrégat `leaderboard/global`.
 *
 * Classement et nombre de membres vivent dans le MÊME document, et quatre
 * composants du Club le lisent au même montage — `ClubTab` deux fois de suite,
 * pour l'un puis pour l'autre. Une promesse partagée ramène le tout à une seule
 * lecture, et un TTL court suffit : l'agrégat est reconstruit côté serveur.
 */
const LEADERBOARD_TTL_MS = 60_000;
let leaderboardDoc: Promise<DocumentSnapshot> | null = null;
let leaderboardAt = 0;

function readLeaderboardDoc(): Promise<DocumentSnapshot> {
  const now = Date.now();
  if (!leaderboardDoc || now - leaderboardAt > LEADERBOARD_TTL_MS) {
    leaderboardAt = now;
    leaderboardDoc = getDoc(doc(db, 'leaderboard', 'global')).catch((error: unknown) => {
      // Ne pas mémoriser un échec : la prochaine lecture doit retenter.
      leaderboardDoc = null;
      throw error;
    });
  }
  return leaderboardDoc;
}

export async function getClubLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await readLeaderboardDoc();
  if (!snap.exists()) return [];
  return (snap.data().entries ?? []) as LeaderboardEntry[];
}

/** Public Club stats (active member count) from the same aggregate doc. */
export async function getClubActiveMemberCount(): Promise<number> {
  const snap = await readLeaderboardDoc();
  return snap.exists() ? (snap.data().activeMembers ?? 0) : 0;
}
