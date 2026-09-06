import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';
import { abonnementActif } from './club';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClubClassement` — LE RANG, ET LA RÈGLE QUI LE REND SUPPORTABLE.
 *
 * ⚠️ LE CLASSEMENT EST PAR VAGUE D'ARRIVÉE, JAMAIS ABSOLU. Ce n'est pas un détail
 * d'affichage : un classement absolu mesurerait l'ancienneté, et quelqu'un qui arrive en
 * novembre ne rattraperait jamais quelqu'un arrivé en février. On ne compare donc qu'à
 * l'intérieur du même mois d'adhésion — c'est la règle que l'écran énonce, et elle est
 * appliquée ICI, pas devinée là-bas.
 *
 * Abonnement vérifié d'abord, comme partout dans le Club.
 *
 * ── UN RANG INVENTÉ CLASSE DES GENS LES UNS PAR RAPPORT AUX AUTRES ───────────────────
 * Il n'y a pas de version approximative d'une position. Un membre sans nom n'est pas rendu,
 * et l'identifiant ne sort jamais : la ligne a besoin d'un nom et d'un score, rien d'autre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function initiales(nom: string): string {
  return nom.trim().split(/\s+/).map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase();
}

export async function appClubClassement(_data: unknown, context: CallContext): Promise<Reponse<'appClubClassement'>> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) return { vue: null, releveA };

  const debut = asText(abonnement.data.startedAt);
  const d = debut ? new Date(debut) : null;
  if (!d || Number.isNaN(d.getTime())) return { vue: null, releveA };

  /*
   * LA VAGUE : tous ceux dont l'abonnement a démarré le même mois. La borne est calculée
   * ici plutôt que stockée — un champ « vague » figé se désynchroniserait le jour où une
   * date de début est corrigée à la main.
   */
  const debutMois = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
  const finMois = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString();

  const vague: DocSnapshot[] = await context.db.query({
    collection: 'club_subscriptions',
    where: [
      { field: 'status', op: '==', value: 'active' },
      { field: 'startedAt', op: '>=', value: debutMois },
      { field: 'startedAt', op: '<', value: finMois },
    ],
  });

  /* Les scores vivent dans `gamification`, un document par personne. On les lit en une
     fois : une lecture par membre ferait exploser le nombre de sous-requêtes du Worker. */
  const scores = await Promise.all(
    vague.map((v) => context.db.get(`gamification/${v.id}`).catch(() => null)),
  );

  const lignes = vague
    .map((v, i) => ({
      uid: v.id,
      nom: asText(scores[i]?.data.userName) ?? asText(v.data.userName) ?? null,
      points: toNumber(scores[i]?.data.xp, 0),
      semaine: toNumber(scores[i]?.data.xpThisWeek, 0),
    }))
    .filter((l): l is typeof l & { nom: string } => l.nom !== null)
    .sort((a, b) => b.points - a.points);

  const moi = lignes.findIndex((l) => l.uid === auth.uid);

  return {
    vue: {
      vague: `Arrivées en ${MOIS[d.getUTCMonth()]}`,
      rang: moi === -1 ? null : moi + 1,
      surCombien: lignes.length,
      points: moi === -1 ? 0 : lignes[moi].points,
      semaine: moi === -1 ? 0 : lignes[moi].semaine,
      lignes: lignes.slice(0, 10).map((l, i) => ({
        rang: i + 1,
        // « Toi » plutôt que son propre nom : c'est ce que l'écran cherche du regard.
        nom: l.uid === auth.uid ? 'Toi' : l.nom,
        initiales: l.uid === auth.uid ? '' : initiales(l.nom),
        points: l.points,
        moi: l.uid === auth.uid,
      })),
    },
    releveA,
  };
}
