import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';
import { abonnementActif } from './club';
import { listeDesBloques } from '../bloquerMembre';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClubFil` — LE MUR DU CLUB, ET CE QUI Y EST ÉCRIT PAR DES GENS.
 *
 * ⚠️ ABONNEMENT VÉRIFIÉ D'ABORD, comme dans `club.ts` et pour la même raison :
 * `firestore.rules` garde `club_posts` derrière `hasActiveClubSub()`, et le compte de
 * service ne la traverse pas — il l'ignore. Sans cette ligne, tout ce que les membres
 * écrivent devient lisible par n'importe quel compte gratuit.
 *
 * ── ET UN SECOND RISQUE, PROPRE À CETTE COLLECTION ───────────────────────────────────
 * Chaque message porte `userName` EN CLAIR. C'est le contenu du produit où fabriquer coûte
 * le plus cher : un message inventé met des phrases dans la bouche de quelqu'un, avec son
 * nom, son métier, son quartier. D'où deux précautions ici :
 *
 *   · un message sans auteur nommé n'est PAS rendu — mieux vaut un fil plus court qu'une
 *     ligne signée « undefined » ;
 *   · l'identifiant de l'auteur ne sort jamais. L'écran a besoin d'un nom et d'initiales,
 *     pas d'un uid — et un uid qui circule finit par servir de clé à quelqu'un.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** « SK » depuis « Seynabou K. ». Calculé, jamais stocké : un nom qui change les change. */
function initiales(nom: string): string {
  return nom.trim().split(/\s+/).map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase();
}

/** « il y a 2 h », « hier », « il y a 3 j ». Une date ISO ne se lit pas dans un fil. */
function depuis(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const minutes = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return jours === 1 ? 'hier' : `il y a ${jours} j`;
}

export async function appClubFil(_data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) return { vue: null, releveA };

  /*
    ⚠️ ON LIT 60 POUR EN RENDRE 40, ET CE N'EST PAS UNE MARGE DE CONFORT.

    Les messages des comptes bloqués sont retirés APRÈS la lecture — Firestore ne sait pas
    filtrer sur « n'est pas dans cette liste ». Lire 40 pour en rendre 35 ferait rétrécir le
    fil de quelqu'un qui bloque cinq comptes bavards, sans qu'il puisse relier les deux : un
    filtre qui se lit comme une panne. On lit large, on filtre, on coupe à 40.
  */
  const [messages, missions, bloques] = await Promise.all([
    context.db.query({
      collection: 'club_posts',
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 60,
    }),
    context.db.query({
      collection: 'club_opportunities',
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 1,
    }),
    listeDesBloques(context, auth.uid),
  ]);

  const mission = missions[0];

  return {
    vue: {
      /* La mission en tête du fil, ou rien. Un budget inventé fixe une attente de revenu
         chez quelqu'un qui organise son temps dessus. */
      mission: mission && asText(mission.data.title) ? {
        meta: [
          asText(mission.data.type) ?? 'Mission',
          asText(mission.data.location),
          depuis(asText(mission.data.createdAt)),
        ].filter(Boolean).join(' · '),
        titre: asText(mission.data.title) ?? '',
        budget: typeof mission.data.budget === 'number' ? mission.data.budget : null,
        note: 'Budget annoncé par la personne qui publie',
      } : null,

      fil: messages
        .filter((m: DocSnapshot) => asText(m.data.userName) && asText(m.data.text))
        .filter((m: DocSnapshot) => !bloques.has(asText(m.data.userId) ?? ''))
        .slice(0, 40)
        .map((m: DocSnapshot) => {
          const auteur = asText(m.data.userName) as string;
          return {
            id: m.id,
            auteur,
            initiales: initiales(auteur),
            categorie: asText(m.data.category) ?? 'Entraide',
            quand: depuis(asText(m.data.createdAt)),
            texte: asText(m.data.text) as string,
            aime: toNumber(m.data.likes, 0),
            republie: toNumber(m.data.reposts, 0),
            commente: toNumber(m.data.comments, 0),
          };
        }),
    },
    releveA,
  };
}
