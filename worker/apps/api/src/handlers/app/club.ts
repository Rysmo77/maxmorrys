import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClub` — ET LE CONTRÔLE QUI N'EXISTE PLUS AILLEURS.
 *
 * ⚠️⚠️ C'EST LA VUE LA PLUS DANGEREUSE DU PORT, ET IL FAUT DIRE POURQUOI.
 *
 * `firestore.rules` protège tout le Club par une fonction :
 *
 *     function hasActiveClubSub() {
 *       return isSignedIn()
 *         && exists(/club_subscriptions/$(request.auth.uid))
 *         && get(/club_subscriptions/$(request.auth.uid)).data.status == 'active';
 *     }
 *
 * Elle garde `club_posts`, `club_events`, `club_infos`, `club_opportunities` — c'est-à-dire
 * TOUT ce que l'abonnement paie. Or ce handler lit avec un COMPTE DE SERVICE, qui ne passe
 * pas par les règles : `context.ts` le dit sans détour, « il n'y a pas de filet ».
 *
 * Donc si on oublie la vérification ci-dessous, le Club entier devient lisible par
 * n'importe quel compte connecté — un compte gratuit créé en trente secondes. Ce ne serait
 * pas une fuite discrète : c'est le produit payant, servi à qui le demande.
 *
 * La vérification est donc LA PREMIÈRE CHOSE que fait ce fichier, avant toute autre lecture,
 * et `tests/unit/worker-vues-natives.test.ts` refuse un handler `app/club*` qui ne
 * l'appellerait pas.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Vrai seulement si l'abonnement existe ET qu'il est actif. Reproduit `hasActiveClubSub`. */
export async function abonnementActif(context: CallContext, uid: string): Promise<DocSnapshot | null> {
  const abonnement = await context.db.get(`club_subscriptions/${uid}`);
  if (!abonnement) return null;
  return asText(abonnement.data.status) === 'active' ? abonnement : null;
}

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export async function appClub(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const abonnement = await abonnementActif(context, auth.uid);
  /*
   * Pas d'abonnement actif → `vue: null`. On ne jette PAS `permission-denied` : l'écran
   * n'est pas interdit, il est vide pour cette personne, et il doit pouvoir dire « le Club
   * est réservé aux membres » plutôt que d'afficher une erreur. La nuance décide de ce que
   * quelqu'un lit après avoir laissé expirer son accès.
   */
  if (!abonnement) return { vue: null, releveA };

  const debut = asText(abonnement.data.startedAt);
  const fin = asText(abonnement.data.expiresAt);

  const [sessions, opportunites, gamification] = await Promise.all([
    context.db.count({
      collection: `club_sessions_attendance`,
      where: [{ field: 'userId', op: '==', value: auth.uid }],
    }).catch(() => 0),
    context.db.count({ collection: 'club_opportunities' }).catch(() => 0),
    context.db.get(`gamification/${auth.uid}`),
  ]);

  const enClair = (iso: string | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : MOIS[d.getUTCMonth()];
  };
  const enDate = (iso: string | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const deux = (n: number) => String(n).padStart(2, '0');
    return `${deux(d.getUTCDate())}/${deux(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  };

  return {
    vue: {
      echeance: enDate(fin),
      depuis: enClair(debut),
      /* Le bilan est COMPTÉ, jamais estimé. Un `null` y reste `null` : trois tuiles qui
         affichent « non relevé » valent mieux qu'un zéro qu'on n'a pas mesuré. */
      bilan: [
        { n: sessions, l: 'sessions suivies' },
        { n: opportunites, l: 'opportunités vues' },
        { n: toNumber(gamification?.data.missionsWon, 0), l: 'missions décrochées' },
      ],
    },
    releveA,
  };
}
