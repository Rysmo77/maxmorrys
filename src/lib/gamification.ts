import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { GamificationProfile } from '../types/gamification';
import { getLevelFromXP, BADGES, XP_REWARDS } from '../types/gamification';

const GAMIFICATION_COL = 'gamification';

export async function getGamificationProfile(userId: string): Promise<GamificationProfile | null> {
  const snap = await getDoc(doc(db, GAMIFICATION_COL, userId));
  return snap.exists() ? (snap.data() as GamificationProfile) : null;
}

export async function initGamificationProfile(userId: string): Promise<GamificationProfile> {
  const profile: GamificationProfile = {
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    badges: [],
  };
  await setDoc(doc(db, GAMIFICATION_COL, userId), profile);
  return profile;
}

export async function addXP(userId: string, amount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const ref = doc(db, GAMIFICATION_COL, userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = await initGamificationProfile(userId);
    const newXP = profile.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    await updateDoc(ref, { xp: newXP, level: newLevel });
    return { newXP, newLevel, leveledUp: newLevel > 1 };
  }

  const data = snap.data() as GamificationProfile;
  const newXP = data.xp + amount;
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > data.level;

  await updateDoc(ref, { xp: newXP, level: newLevel });
  return { newXP, newLevel, leveledUp };
}

export async function updateStreak(userId: string): Promise<{ currentStreak: number; isNew: boolean }> {
  const ref = doc(db, GAMIFICATION_COL, userId);
  const snap = await getDoc(ref);

  const today = new Date().toISOString().slice(0, 10);

  if (!snap.exists()) {
    await initGamificationProfile(userId);
    await updateDoc(ref, { currentStreak: 1, lastActiveDate: today });
    return { currentStreak: 1, isNew: true };
  }

  const data = snap.data() as GamificationProfile;
  const lastDate = data.lastActiveDate;

  if (lastDate === today) {
    return { currentStreak: data.currentStreak, isNew: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    newStreak = data.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, data.longestStreak);
  await updateDoc(ref, {
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
  });

  return { currentStreak: newStreak, isNew: true };
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  const ref = doc(db, GAMIFICATION_COL, userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await initGamificationProfile(userId);
  }

  const data = (await getDoc(ref)).data() as GamificationProfile;
  if (data.badges.includes(badgeId)) return false;

  await updateDoc(ref, {
    badges: [...data.badges, badgeId],
  });
  return true;
}

export async function getLeaderboard(limitCount = 20): Promise<{ userId: string; xp: number; level: number }[]> {
  const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
  const q = query(collection(db, GAMIFICATION_COL), orderBy('xp', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    userId: d.id,
    xp: d.data().xp ?? 0,
    level: d.data().level ?? 1,
  }));
}
