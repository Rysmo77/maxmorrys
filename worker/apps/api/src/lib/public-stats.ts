import type { Firestore } from '@mm/firestore-rest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE MIROIR PUBLIC DES CHIFFRES DU CLUB — ce qui rend un engagement vérifiable.
 *
 * `/club-des-digitos` annonce « deux sessions en direct par mois ». C'est un ENGAGEMENT
 * COMMERCIAL, et il était affiché seul : un visiteur n'avait aucun moyen de savoir s'il est
 * tenu, parce que l'agenda lui est fermé. `club_events` exige un abonnement actif en lecture
 * (`firestore.rules`), une agrégation passe par la même règle, et cette fermeture est VOULUE —
 * ce qui se dit dans le Club appartient à ceux qui y sont.
 *
 * Le compte de service, lui, lit hors des règles. Il compte donc ici, et dénormalise le seul
 * chiffre qu'un inconnu a besoin de voir : combien de sessions ont RÉELLEMENT eu lieu sur une
 * fenêtre datée. La promesse et son exécution s'affichent alors côte à côte.
 *
 * ⚠️ CE DOCUMENT NE PORTERA JAMAIS DE PREUVE SOCIALE. Ni nombre de membres, ni note, ni avis,
 * ni témoignage : ce sont les interdits absolus du design system, et ils ne tombent pas parce
 * qu'un document est public. Le compte de membres existe — il vit dans `leaderboard/global`,
 * réservé aux connectés, et il n'en sort pas. Ce qu'on publie ici est ce que J'AI FAIT, pas ce
 * que d'autres pensent de moi. La différence est toute la raison d'être de ce fichier.
 *
 * ⚠️ ON NE COMPTE QUE LE PASSÉ. Une session programmée pour la semaine prochaine n'a pas été
 * tenue ; l'inclure ferait d'une promesse un fait accompli, ce qui est exactement le
 * mécanisme que ce miroir existe pour empêcher. La borne haute est donc le jour courant,
 * exclu — une session d'aujourd'hui peut ne pas avoir encore eu lieu.
 *
 * ⚠️ LE CHAMP `date` EST UNE CHAÎNE `YYYY-MM-DD` (saisie par `<Field type="date">`), pas un
 * horodatage. La comparaison lexicographique EST la comparaison chronologique dans ce format,
 * et c'est la seule raison pour laquelle deux bornes de plage fonctionnent ici. Changer le
 * format du champ casserait ce comptage en silence — il rendrait zéro, pas une erreur.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** La fenêtre glissante, en jours. Publiée dans le document : la phrase du site la lit. */
const FENETRE_JOURS = 90;

export interface BilanStatsPubliques {
  sessionsTenues: number;
  fenetreJours: number;
}

/** `YYYY-MM-DD` en UTC — le même format que celui saisi à l'administration. */
function jourISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function rebuildPublicClubStats(db: Firestore): Promise<BilanStatsPubliques> {
  const maintenant = new Date();
  const debut = new Date(maintenant);
  debut.setUTCDate(debut.getUTCDate() - FENETRE_JOURS);

  const sessionsTenues = await db.count({
    collection: 'club_events',
    where: [
      { field: 'date', op: '>=', value: jourISO(debut) },
      { field: 'date', op: '<', value: jourISO(maintenant) },
    ],
  });

  /*
   * `set` sans `merge` : le document ne porte que ces trois champs et se réécrit entièrement à
   * chaque exécution. Une fusion laisserait survivre un champ retiré du code — c'est-à-dire un
   * chiffre que plus personne ne calcule, servi comme s'il était frais.
   */
  await db.set('public_stats/club', {
    liveSessionsHeld: sessionsTenues,
    windowDays: FENETRE_JOURS,
    asOf: maintenant.toISOString(),
  });

  return { sessionsTenues, fenetreJours: FENETRE_JOURS };
}
