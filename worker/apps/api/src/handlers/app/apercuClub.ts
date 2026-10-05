import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import { commentairesDuMessage } from '../../lib/club-posts';
import type { ApercuOngletOnglet, Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * CE QU'IL Y A DERRIÈRE CHAQUE CADENAS DU CLUB — COMPTÉ, POUR QUELQU'UN QUI N'EST PAS MEMBRE.
 *
 * L'écran verrouillé du kit remplace le flou par des compteurs RÉELS. Aucune vue ne les
 * servait : ils affichaient « non relevé ». Celle-ci les compte.
 *
 * ⛔ C'EST LA SEULE VUE DU CLUB QUI NE VÉRIFIE PAS L'ABONNEMENT, ET ELLE NE SERT QUE DES
 * NOMBRES. Aucun texte, aucun nom, aucun identifiant de membre : des comptes agrégés sur tout
 * le Club. `worker-vues-natives.test.ts` la dispense NOMMÉMENT de `abonnementActif` et
 * refuse qu'elle lise un champ de contenu.
 *
 * Les LIBELLÉS viennent d'ici, avec les nombres : un libellé qui promet ce qu'on ne mesure
 * pas (« dans ta vague » pour quelqu'un qui n'a pas de vague) serait un relevé mensonger.
 * Un compte qui échoue vaut `null` — l'écran écrit « non relevé », jamais un zéro inventé.
 *
 * Les lectures sont BORNÉES (`LIMITE`) : au-delà, un compte DISTINCT ou une somme serait
 * partiel. Le libellé ne prétend donc rien de plus que ce que la borne permet.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const LIMITE = 500;
const JOUR = 24 * 60 * 60 * 1000;

type Compteur = { n: number | null; l: string };

async function sur<T>(promesse: Promise<T>): Promise<T | null> {
  try {
    return await promesse;
  } catch {
    return null;
  }
}

const distincts = (docs: DocSnapshot[] | null, champ: string): number | null =>
  docs === null ? null : new Set(docs.map((d) => asText(d.data[champ])).filter(Boolean)).size;

export async function appApercuClub(_data: unknown, context: CallContext): Promise<Reponse<'appApercuClub'>> {
  requireAuth(context);
  const maintenant = new Date();
  const releveA = maintenant.toISOString();
  const semaine = new Date(maintenant.getTime() - 7 * JOUR).toISOString();
  const trenteJours = new Date(maintenant.getTime() - 30 * JOUR).toISOString();
  const debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1)).toISOString();
  const finMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 1)).toISOString();
  const db = context.db;

  const [
    postsSemaine, discussions, discussionsCount, plusLongue, profils, profilsCount, abonnes,
    sessionsMois, aVenir, ateliers, opportunites, budgetBas, budgetHaut, infos, infosRecentes,
    parrainages,
  ] = await Promise.all([
    sur(db.query({ collection: 'club_posts', where: [{ field: 'createdAt', op: '>=', value: semaine }], select: ['category', 'commentsCount', 'comments'], limit: LIMITE })),
    sur(db.query({ collection: 'club_discussions', select: ['category'], limit: LIMITE })),
    sur(db.count({ collection: 'club_discussions' })),
    sur(db.query({ collection: 'club_discussions', orderBy: [{ field: 'replyCount', direction: 'desc' }], select: ['replyCount'], limit: 1 })),
    sur(db.query({ collection: 'club_profiles', select: ['city'], limit: LIMITE })),
    sur(db.count({ collection: 'club_profiles' })),
    sur(db.query({ collection: 'club_subscriptions', where: [{ field: 'status', op: '==', value: 'active' }], select: ['startedAt'], limit: LIMITE })),
    sur(db.count({ collection: 'club_sessions', where: [{ field: 'startsAt', op: '>=', value: debutMois }, { field: 'startsAt', op: '<', value: finMois }] })),
    sur(db.query({ collection: 'club_sessions', where: [{ field: 'startsAt', op: '>=', value: releveA }], select: ['capacity', 'registeredCount'], limit: 100 })),
    sur(db.count({ collection: 'club_events', where: [{ field: 'startsAt', op: '>=', value: releveA }] })),
    sur(db.count({ collection: 'club_opportunities' })),
    sur(db.query({ collection: 'club_opportunities', orderBy: [{ field: 'budget', direction: 'asc' }], select: ['budget'], limit: 1 })),
    sur(db.query({ collection: 'club_opportunities', orderBy: [{ field: 'budget', direction: 'desc' }], select: ['budget'], limit: 1 })),
    sur(db.count({ collection: 'club_infos' })),
    sur(db.count({ collection: 'club_infos', where: [{ field: 'publishedAt', op: '>=', value: trenteJours }] })),
    sur(db.count({ collection: 'referrals' })),
  ]);

  const nombre = (d: DocSnapshot | undefined, champ: string): number | null =>
    d && typeof d.data[champ] === 'number' ? (d.data[champ] as number) : null;

  /* Les places restantes : seulement les sessions qui DÉCLARENT une capacité. Une session sans
     plafond n'a pas de « places restantes », et la compter pour zéro mentirait. */
  const places = aVenir === null ? null : aVenir
    .filter((s) => typeof s.data.capacity === 'number')
    .reduce((n, s) => n + Math.max(0, (s.data.capacity as number) - (typeof s.data.registeredCount === 'number' ? s.data.registeredCount : 0)), 0);

  const arrivesCeMois = abonnes === null ? null
    : abonnes.filter((a) => (asText(a.data.startedAt) ?? '') >= debutMois).length;
  const vagues = abonnes === null ? null
    : new Set(abonnes.map((a) => (asText(a.data.startedAt) ?? '').slice(0, 7)).filter(Boolean)).size;

  const onglet = (nom: ApercuOngletOnglet, compteurs: Compteur[]) => ({ onglet: nom, compteurs });

  return {
    vue: {
      onglets: [
        onglet('Fil', [
          { n: postsSemaine?.length ?? null, l: 'publications cette semaine' },
          { n: postsSemaine === null ? null : postsSemaine.reduce((n, p) => n + commentairesDuMessage(p.data), 0), l: 'réponses cette semaine' },
          { n: distincts(postsSemaine, 'category'), l: 'rubriques actives' },
        ]),
        onglet('Discussions', [
          { n: discussionsCount, l: 'sujets' },
          { n: distincts(discussions, 'category'), l: 'rubriques' },
          { n: nombre(plusLongue?.[0], 'replyCount'), l: 'réponses au plus long' },
        ]),
        onglet('Membres', [
          { n: profilsCount, l: 'fiches remplies' },
          { n: abonnes?.length ?? null, l: 'membres actifs' },
          { n: distincts(profils, 'city'), l: 'villes' },
        ]),
        onglet('Agenda', [
          { n: sessionsMois, l: 'sessions ce mois' },
          { n: places, l: 'places restantes' },
          { n: ateliers, l: 'ateliers à venir' },
        ]),
        onglet('Classement', [
          { n: abonnes?.length ?? null, l: 'membres actifs' },
          { n: arrivesCeMois, l: 'arrivés ce mois' },
          { n: vagues, l: "vagues d'arrivée" },
        ]),
        onglet('Opportunités', [
          { n: opportunites, l: 'publiées' },
          { n: nombre(budgetBas?.[0], 'budget'), l: 'budget le plus bas (F)' },
          { n: nombre(budgetHaut?.[0], 'budget'), l: 'le plus haut (F)' },
        ]),
        onglet('Informations', [
          { n: infos, l: 'infos publiées' },
          { n: infosRecentes, l: 'ces 30 derniers jours' },
        ]),
        onglet('Parrainage', [
          { n: parrainages, l: 'parrainages enregistrés' },
        ]),
      ],
    },
    releveA,
  };
}
