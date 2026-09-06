import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';
import { abonnementActif } from './club';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClubAgenda` — les séances à venir, et si tu y es inscrite.
 *
 * Abonnement vérifié d'abord, comme partout dans le Club.
 *
 * ── DEUX COLLECTIONS, UNE SEULE LISTE ────────────────────────────────────────────────
 * `club_sessions` (les directs) et `club_events` (les ateliers en présentiel) ont la même
 * forme à l'écran mais des règles distinctes en base. On les fusionne ici plutôt que de
 * demander à l'écran de faire deux appels et de trier lui-même : la logique de tri par
 * date vivrait alors dans le client, où elle serait refaite à chaque nouvelle surface.
 *
 * ── L'INSCRIPTION EST LUE, PAS DEVINÉE ───────────────────────────────────────────────
 * Chaque séance porte `registrations/{uid}` en sous-collection. On lit l'existence du
 * document plutôt qu'un compteur : un compteur dirait combien, jamais QUI — et c'est
 * « qui » que l'écran affiche.
 *
 * ⚠️ LE COMPTE DE PLACES N'EST PAS INVENTÉ. Il n'est renvoyé que si la base porte les
 * deux nombres. Une jauge approximative sur un atelier à douze places décide à la place
 * de quelqu'un de s'inscrire tout de suite ou d'attendre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function enJour(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jour = JOURS[d.getUTCDay()];
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
}

export async function appClubAgenda(_data: unknown, context: CallContext): Promise<Reponse<'appClubAgenda'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) return { vue: null, releveA };

  const maintenant = new Date().toISOString();
  const aVenir = (collection: string) => context.db.query({
    collection,
    where: [{ field: 'startsAt', op: '>=', value: maintenant }],
    orderBy: [{ field: 'startsAt', direction: 'asc' }],
    limit: 20,
  }).catch(() => [] as DocSnapshot[]);

  const [sessions, evenements] = await Promise.all([
    aVenir('club_sessions'),
    aVenir('club_events'),
  ]);

  /*
   * ⚠️ `as const` N'EST PAS DÉCORATIF, ET IL NE CHANGE RIEN AU CORPS SERVI.
   *
   * `collection`, `territoire` et `glyphe` sont des ENSEMBLES FERMÉS du contrat des vues, et
   * `collection` REPART au serveur : `reserverSession` le reçoit et le revalide. Sans ces
   * annotations, TypeScript élargit les trois littéraux en `string`, et la vue ne tient plus
   * son propre contrat — c'est le compilateur qui l'a dit, pas une relecture.
   *
   * Les annotations de type sont effacées à la construction : les octets servis sont les mêmes.
   */
  const toutes = [
    ...sessions.map((d) => ({ doc: d, collection: 'club_sessions', territoire: 'transforme', glyphe: 'chat' } as const)),
    ...evenements.map((d) => ({ doc: d, collection: 'club_events', territoire: 'digitalise', glyphe: 'users' } as const)),
  ]
    .filter(({ doc }) => asText(doc.data.title))
    .sort((a, b) => (asText(a.doc.data.startsAt) ?? '').localeCompare(asText(b.doc.data.startsAt) ?? ''));

  /* Une lecture par séance pour savoir si l'on y est inscrit. C'est borné par la limite
     ci-dessus (20 par collection) et c'est ce qui permet de dire « tu es inscrite »
     plutôt qu'un compteur anonyme. */
  const inscriptions = await Promise.all(
    toutes.map(({ doc, collection }) =>
      context.db.get(`${collection}/${doc.id}/registrations/${auth.uid}`).catch(() => null)),
  );

  return {
    vue: toutes.map(({ doc, collection, territoire, glyphe }, i) => {
      const prises = toNumber(doc.data.registeredCount, -1);
      const total = toNumber(doc.data.capacity, -1);
      return {
        id: doc.id,
        collection,
        jour: enJour(asText(doc.data.startsAt)),
        titre: asText(doc.data.title) as string,
        horaire: asText(doc.data.schedule) ?? null,
        glyphe,
        territoire,
        inscrite: inscriptions[i] !== null,
        // Les deux nombres, ou rien. Une jauge à moitié relevée n'aide personne à décider.
        places: prises >= 0 && total > 0 ? `${prises} / ${total} places` : null,
      };
    }),
    releveA,
  };
}
