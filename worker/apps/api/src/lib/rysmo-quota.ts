import type { Firestore } from '@mm/firestore-rest';
import { HttpsError } from '@mm/shared';

import {
  choisirAbonnementCourant,
  deciderRenouvellement,
  type AbonnementLu,
} from './rysmo-subscription';
import { toDate, toNumber, toStringOrNull } from './values';

/**
 * Les règles de quota Rysmo.
 *
 * ⚠️ Ce fichier disait « Port des règles de quota Rysmo (functions/src/rysmo.ts) ». Ce
 * fichier-là n'existe plus : `functions/` a été supprimé le 03/09/2026 avec le retour au
 * plan Spark. Le Worker porte désormais SEUL les constantes serveur, et le miroir client
 * (`src/lib/rysmo/quota.ts`) est le seul autre endroit où elles vivent.
 */

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

/**
 * Les abonnements Rysmo qui pèsent aujourd'hui : actifs ET en attente de paiement.
 *
 * ⚠️ LES `pending` SONT LUS, ET C'EST NÉCESSAIRE. Ils n'ouvrent aucun droit — mais ils
 * FERMENT le renouvellement, parce que deux liens de paiement ouverts sur la même échéance
 * sont deux débits possibles pour un seul mois. Les omettre ferait dire à l'écran « tu peux
 * reprendre » là où le serveur répond « un paiement est déjà en cours », et c'est exactement
 * l'écart écran/serveur que ce dépôt paie cher ailleurs.
 */
export async function lireAbonnementsRysmo(db: Firestore, uid: string): Promise<AbonnementLu[]> {
  return db.query({
    collection: 'rysmoSubscriptions',
    where: [
      { field: 'userId', op: '==', value: uid },
      { field: 'status', op: 'in', value: ['active', 'pending'] },
    ],
  });
}

export async function getActiveRysmoSubscription(
  db: Firestore,
  uid: string,
): Promise<string | null> {
  /*
   * ⚠️ PAS DE `limit: 1` ICI, ET C'EST UN CORRECTIF, PAS UNE OPTIMISATION MANQUÉE.
   *
   * Depuis que le renouvellement anticipé existe (`rysmo-subscription.ts`), DEUX documents
   * sont `active` en même temps pendant les cinq derniers jours d'un mois : celui qui court
   * et celui qui prend la suite. Une requête sans `orderBy` n'est pas ordonnée — `limit: 1`
   * en rendait donc un au hasard, et une fois sur deux c'était l'ANCIEN. S'il venait
   * d'expirer, cette fonction rendait `null` : la personne perdait son quota le lendemain du
   * jour où elle avait payé pour le garder, et elle aurait été la seule à le voir.
   *
   * `choisirAbonnementCourant` retient l'échéance la plus lointaine encore valide, ce qui est
   * la seule lecture qui décrive le droit réellement ouvert.
   */
  const courant = choisirAbonnementCourant(await lireAbonnementsRysmo(db, uid), new Date());
  return courant ? toStringOrNull(courant.data.plan) : null;
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
  /** Échéance de l'abonnement Rysmo+ courant, ISO. `null` s'il n'y en a pas. */
  expiresAt: string | null;
  /** La reprise est-elle ouverte ? Décidée par `deciderRenouvellement`, jamais recalculée. */
  canRenew: boolean;
}

/**
 * Détermine le plafond quotidien applicable à un utilisateur — et l'état de sa reprise.
 *
 * ⚠️ LA REPRISE EST DÉCIDÉE ICI, ET NULLE PART AILLEURS. `createRysmoSubscriptionCharge`
 * appelle la même `deciderRenouvellement` sur la même lecture : l'écran ne peut donc pas
 * proposer un bouton que le serveur refusera, ni le refuser quand le serveur l'accepterait.
 * Recalculer la fenêtre côté navigateur — même « juste pour l'affichage » — rouvrirait
 * précisément cet écart.
 */
export async function resolveQuotaLimits(db: Firestore, uid: string): Promise<QuotaLimits> {
  const maintenant = new Date();
  const [abonnements, clubActive] = await Promise.all([
    lireAbonnementsRysmo(db, uid),
    hasActiveClubSub(db, uid),
  ]);

  const courant = choisirAbonnementCourant(abonnements, maintenant);
  const plan = courant ? toStringOrNull(courant.data.plan) : null;
  const expiresAt = courant ? toStringOrNull(courant.data.expiresAt) : null;
  const canRenew = deciderRenouvellement(abonnements, maintenant).autorise;
  const etat = { expiresAt, canRenew };

  if (plan && SUBSCRIPTION_QUOTAS[plan]) {
    return {
      dailyLimit: SUBSCRIPTION_QUOTAS[plan],
      hasActiveSubscription: true,
      hasClubBonus: false,
      plan,
      ...etat,
    };
  }
  if (clubActive) {
    return {
      dailyLimit: BASE_DAILY_QUOTA + CLUB_BONUS_QUOTA,
      hasActiveSubscription: false,
      hasClubBonus: true,
      plan,
      ...etat,
    };
  }
  return {
    dailyLimit: BASE_DAILY_QUOTA,
    hasActiveSubscription: false,
    hasClubBonus: false,
    plan,
    ...etat,
  };
}

export interface QuotaUsage {
  dayCount: number;
  packBalance: number;
}

export interface QuotaSnapshot extends QuotaLimits {
  dayKey: string;
  dayCount: number;
  packBalance: number;
  source: 'pack' | 'subscription' | 'club' | 'free';
}

/**
 * Réserve une requête Rysmo de façon atomique.
 *
 * Ordre de consommation : **le pack prépayé d'abord**, puis le quota quotidien.
 * C'est délibéré — l'utilisateur qui a payé voit son crédit servir en premier.
 *
 * Lève `resource-exhausted` avec des détails structurés quand la limite est
 * atteinte : le client s'en sert pour proposer l'achat d'un pack.
 */
export async function reserveRequest(db: Firestore, uid: string): Promise<QuotaSnapshot> {
  const limits = await resolveQuotaLimits(db, uid);
  const path = `_ratelimits/rysmo_${uid}`;
  const dayKey = todayKey();

  return db.runTransaction<QuotaSnapshot>(async (tx) => {
    const snapshot = await tx.get(path);
    const current = snapshot?.data ?? {};
    const sameDay = current.dayKey === dayKey;
    const dayCount = sameDay ? toNumber(current.dayCount) : 0;
    const packBalance = toNumber(current.packBalance);

    let newDayCount = dayCount;
    let newPackBalance = packBalance;
    let source: QuotaSnapshot['source'] = 'free';

    if (packBalance > 0) {
      newPackBalance = packBalance - 1;
      source = 'pack';
    } else if (dayCount < limits.dailyLimit) {
      newDayCount = dayCount + 1;
      source = limits.hasActiveSubscription
        ? 'subscription'
        : limits.hasClubBonus
          ? 'club'
          : 'free';
    } else {
      throw new HttpsError(
        'resource-exhausted',
        limits.hasActiveSubscription
          ? `Tu as atteint ta limite quotidienne Rysmo+ (${limits.dailyLimit}/jour). Reviens demain ou upgrade vers Pro.`
          : `Tu as utilisé tes ${limits.dailyLimit} requêtes Rysmo du jour ! Achète un pack à partir de 500 XOF pour continuer maintenant.`,
        {
          reason: 'daily_limit',
          dailyLimit: limits.dailyLimit,
          hasActiveSubscription: limits.hasActiveSubscription,
          hasClubBonus: limits.hasClubBonus,
          upgradeUrl: '/mon-espace/rysmo-store',
        },
      );
    }

    tx.set(
      path,
      { dayKey, dayCount: newDayCount, packBalance: newPackBalance, lastReset: Date.now() },
      { merge: true },
    );

    return {
      ...limits,
      dayKey,
      dayCount: newDayCount,
      packBalance: newPackBalance,
      source,
    };
  });
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
