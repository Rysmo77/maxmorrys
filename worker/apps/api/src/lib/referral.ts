import type { Firestore } from '@mm/firestore-rest';
import { asText, toNumber } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA RÉCOMPENSE DU PARRAIN — portée depuis `functions/src/referrals.ts`.
 *
 * ⚠️ CE QUI ÉTAIT CASSÉ, ET DEPUIS QUAND
 *
 * L'écran de parrainage du Club est complet et vivant : code généré, lien de partage,
 * boutons WhatsApp/X/Telegram, prix filleul affiché à 16 915 F, et la remise de 15 %
 * réellement appliquée côté serveur au moment du débit. Tout fonctionne — sauf la
 * contrepartie.
 *
 * La collection `referrals` n'était écrite que par `onReferralConversion`, un déclencheur
 * Firestore. Depuis le passage au plan Spark le 13/08/2026, il ne reste AUCUNE Cloud
 * Function déployée. Conséquence, invisible depuis l'interface :
 *
 *   · le parrain ne reçoit ni les 100 XP, ni le badge « Ambassadeur » ;
 *   · `getMyReferrals()` interroge une collection que plus rien n'alimente, donc le
 *     compteur « filleuls convertis » de l'écran affiche 0 À VIE, quoi que fasse le membre ;
 *   · le badge Ambassadeur est l'un des huit, sur dix, qu'aucun code n'attribue plus.
 *
 * Un dispositif d'acquisition entièrement construit et chiffré, qui ne rend rien.
 *
 * ⚠️ POURQUOI ICI, ET PAS AILLEURS. Workers ne sait pas s'abonner aux événements de la base :
 * un déclencheur Firestore n'est pas portable tel quel. C'est donc l'ACTION qui provoque le
 * changement qui doit appeler ce module — l'activation de l'abonnement dans le webhook de
 * paiement. Même forme que `notifyOnPublish`, et pour la même raison.
 *
 * ⚠️ NE JETTE JAMAIS. Ce module est appelé depuis le webhook Bictorys : une exception y
 * provoquerait un non-200, donc une RELIVRAISON par Bictorys sur un paiement déjà encaissé.
 * Même règle que `sendEmail`. Une récompense perdue se rattrape ; un double débit, non.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** XP versés au parrain à la conversion d'un filleul. */
const REFERRER_XP = 100;

/**
 * Paliers de niveau — MIROIR de `getLevelFromXP` (`src/types/gamification.ts`).
 *
 * ⚠️ Les trois projets TypeScript du dépôt ne peuvent pas s'importer entre eux : cette
 * duplication est structurelle, pas négligente. `test/referral.test.ts` la verrouille sur les
 * dix bornes du client.
 */
const PALIERS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];

export function niveauDepuisXp(xp: number): number {
  let niveau = 1;
  for (let i = 0; i < PALIERS.length; i += 1) if (xp >= PALIERS[i]) niveau = i + 1;
  return Math.min(niveau, 10);
}

/** Ce que l'appelant peut journaliser. `raison` dit pourquoi rien n'a été versé. */
export interface ResultatParrainage {
  recompense: boolean;
  raison?: 'pasDeParrain' | 'dejaRecompense' | 'codeInconnu' | 'autoParrainage' | 'erreur';
  parrainId?: string;
}

/**
 * Récompense le parrain d'un filleul dont l'abonnement vient de devenir actif.
 *
 * Idempotent par `referralRewarded` sur le document du FILLEUL : c'est lui qui ne peut être
 * converti qu'une fois, alors qu'un parrain peut l'être autant de fois qu'il parraine.
 */
export async function recompenserParrain(
  db: Firestore,
  filleulId: string,
): Promise<ResultatParrainage> {
  try {
    const filleul = await db.get(`users/${filleulId}`);
    const code = asText(filleul?.data.referredByCode);
    if (!code) return { recompense: false, raison: 'pasDeParrain' };
    if (filleul?.data.referralRewarded === true) {
      return { recompense: false, raison: 'dejaRecompense' };
    }

    const parrains = await db.query({
      collection: 'users',
      where: [{ field: 'referralCode', op: '==', value: code }],
      limit: 1,
    });
    if (parrains.length === 0) return { recompense: false, raison: 'codeInconnu' };

    const parrainId = parrains[0].id;
    if (!parrainId || parrainId === filleulId) {
      return { recompense: false, raison: 'autoParrainage' };
    }

    /* XP et badge dans une transaction : deux lecteurs concurrents ne doivent pas écraser
       l'un des deux versements si le parrain convertit deux filleuls en même temps. */
    await db.runTransaction(async (tx) => {
      const actuel = await tx.get(`gamification/${parrainId}`);
      const xp = toNumber(actuel?.data.xp) + REFERRER_XP;
      const badgesActuels = Array.isArray(actuel?.data.badges)
        ? (actuel.data.badges as unknown[]).filter((b): b is string => typeof b === 'string')
        : [];
      const badges = badgesActuels.includes('ambassadeur')
        ? badgesActuels
        : [...badgesActuels, 'ambassadeur'];
      tx.set(`gamification/${parrainId}`, { xp, level: niveauDepuisXp(xp), badges }, { merge: true });
    });

    await db.add('referrals', {
      referrerId: parrainId,
      refereeId: filleulId,
      refereeName: asText(filleul?.data.displayName) ?? '',
      status: 'converted',
      createdAt: new Date().toISOString(),
    });
    /* Posé EN DERNIER : si l'une des écritures précédentes échoue, le marqueur reste absent
       et un rejeu rattrapera la récompense plutôt que de la perdre. */
    await db.update(`users/${filleulId}`, { referralRewarded: true });

    return { recompense: true, parrainId };
  } catch (error: unknown) {
    console.error('Parrainage : récompense non versée', error);
    return { recompense: false, raison: 'erreur' };
  }
}
