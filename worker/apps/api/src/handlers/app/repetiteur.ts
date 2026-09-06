import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { readQuotaUsage, resolveQuotaLimits } from '../../lib/rysmo-quota';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appRepetiteur` — LE QUOTA, LA MÉMOIRE, ET CE QUI A DÉJÀ ÉTÉ DIT.
 *
 * Le quota est LU, jamais estimé, et il réutilise `lib/rysmo-quota` — le même module que
 * `getRysmoQuota` sert au web. Le recalculer ici en donnerait une seconde version, et deux
 * comptes de quota qui divergent, c'est quelqu'un à qui l'on refuse une question qu'il lui
 * restait.
 *
 * ── LA MÉMOIRE EST CE QUE LE PRODUIT SAIT DE QUELQU'UN ───────────────────────────────
 * Chaque ligne est une phrase à la première personne — « tu vends des cosmétiques aux
 * Almadies ». Ce n'est pas de la donnée technique : c'est ce que le répétiteur a retenu, et
 * l'écran existe pour qu'on puisse le LIRE et l'effacer. En inventer une seule serait dire
 * à quelqu'un qu'on a retenu de lui une chose qu'il n'a jamais dite.
 *
 * D'où la règle appliquée ici : une entrée sans texte n'est pas rendue, et sa date
 * d'apprentissage l'accompagne toujours — un fait sans date ne se conteste pas.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function depuisLe(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : `depuis le ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
}

export async function appRepetiteur(_data: unknown, context: CallContext): Promise<Reponse<'appRepetiteur'>> {
  const { uid } = requireAuth(context);
  const releveA = new Date().toISOString();

  const [limites, usage, memoire, echanges] = await Promise.all([
    resolveQuotaLimits(context.db, uid),
    readQuotaUsage(context.db, uid),
    context.db.query({
      collection: `users/${uid}/rysmo_memory`,
      orderBy: [{ field: 'learnedAt', direction: 'desc' }],
      limit: 50,
    }).catch(() => [] as DocSnapshot[]),
    context.db.query({
      collection: `users/${uid}/rysmo_messages`,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 30,
    }).catch(() => [] as DocSnapshot[]),
  ]);

  return {
    vue: {
      /* `utilise` et `total` sont ceux du serveur, pas une soustraction faite ici : le
         plafond dépend du forfait, et un client qui le déduirait se tromperait au premier
         changement d'offre. */
      quota: { utilise: usage.dayCount, total: limites.dailyLimit },

      memoire: memoire
        .filter((m: DocSnapshot) => asText(m.data.text))
        .map((m: DocSnapshot) => ({
          id: m.id,
          fait: asText(m.data.text) as string,
          depuis: depuisLe(asText(m.data.learnedAt)),
        })),

      /* L'ordre est inversé : la requête descend pour prendre les plus récents, l'écran
         monte pour les lire dans le sens d'une conversation. */
      echange: echanges
        .filter((e: DocSnapshot) => asText(e.data.text))
        .reverse()
        .map((e: DocSnapshot) => ({
          id: e.id,
          de: asText(e.data.role) === 'user' ? 'me' : 'ai',
          texte: asText(e.data.text) as string,
        })),
    },
    releveA,
  };
}
