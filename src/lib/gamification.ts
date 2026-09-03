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

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ATTRIBUTION DES BADGES — huit sur dix ne se décrochaient jamais.
 *
 * `BADGES` en déclare dix, et `/mon-espace/succes` les affiche tous, verrouillés ou non.
 * Deux seulement avaient un attributeur : `contributeur` (dans `useClubData`) et
 * `ambassadeur` (dans une Cloud Function, donc morte depuis le plan Spark — désormais
 * reversée par le webhook de paiement).
 *
 * Les huit autres étaient des cases qui ne se décocheraient jamais, montrées à chaque
 * visite sur un écran dédié. Un catalogue de récompenses inatteignables coûte plus de
 * crédibilité qu'il n'apporte de motivation : c'est le contraire de ce qu'on attend d'un
 * dispositif de gamification.
 *
 * ⚠️ PILOTÉ PAR LES DONNÉES, PAS PAR UNE LISTE DE `if`. La règle de chaque badge est déjà
 * écrite dans `BADGES` — `requirementType` et `requirement`. Cette fonction les lit :
 * ajouter un badge au catalogue suffit donc à le rendre attribuable, sans toucher ici.
 * C'est ce qui empêche la situation de se reproduire.
 *
 * ⚠️ `posts` N'EST PAS TRAITÉ ICI, délibérément : `contributeur` et `ambassadeur` sont
 * attribués à la source, au moment de l'acte, là où le compteur est juste. Les compter
 * depuis le tableau de bord supposerait de relire tout le fil du Club à chaque ouverture.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
/*
  LA PARTIE PURE A DÉMÉNAGÉ DANS `src/types/gamification.ts`.

  Son commentaire disait déjà « partie PURE, testable sans Firestore » — l'intention était
  juste, l'emplacement la contredisait. Ce module importe `config/db`, qui importe
  `config/firebase`, qui LÈVE quand les variables d'environnement manquent. Un test qui
  importait `badgesMerites` faisait donc tomber tout le fichier, et il ne s'en est aperçu
  qu'en CI : en local, `.env.local` masque le défaut.

  Ré-exporté ici pour que les appelants existants ne bougent pas.
*/
import { badgesMerites, type BadgeStats } from '../types/gamification';

export { badgesMerites, type BadgeStats };

/**
 * Décerne tous les badges désormais mérités — UN PAR ÉCRITURE.
 *
 * ⚠️ LA BORNE VIENT DES RÈGLES, PAS D'UNE PRÉFÉRENCE. `firestore.rules` impose
 * `badges.size() <= resource.data.badges.size() + 1` sur `gamification/{userId}` : c'est
 * ce qui empêche un client de s'auto-décerner le catalogue entier, puisque ces badges
 * alimentent le classement et les récompenses. Une écriture groupée de plusieurs badges
 * serait donc REFUSÉE — silencieusement du point de vue de l'écran, qui n'affiche rien de
 * plus qu'avant. C'est exactement le piège qu'une première version de cette fonction avait
 * tendu.
 *
 * On boucle donc sur `awardBadge`, qui n'en pose qu'un et respecte la borne par
 * construction. Quelqu'un qui remplit cinq conditions d'un coup reçoit cinq écritures —
 * rare, et le prix de la règle qui protège le reste.
 *
 * Retourne les identifiants NOUVELLEMENT décernés, pour que l'appelant puisse le dire.
 */
export async function syncBadges(userId: string, stats: BadgeStats): Promise<string[]> {
  const merites = badgesMerites(stats);

  const nouveaux: string[] = [];
  for (const badge of merites) {
    // Séquentiel et non `Promise.all` : deux transactions concurrentes sur le même
    // document se relanceraient mutuellement, et la borne des règles est par écriture.
    if (await awardBadge(userId, badge.id)) nouveaux.push(badge.id);
  }
  return nouveaux;
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
