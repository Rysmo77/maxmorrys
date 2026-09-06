import type { DocSnapshot } from '@mm/firestore-rest';

import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../../context';
import { asText, toNumber } from '../../lib/values';
import { abonnementActif } from './club';
import { listeDesBloques } from '../bloquerMembre';
import type { ReponseAppClubListe } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appClubListe` — LES TROIS LISTES QUI RESTAIENT, DERRIÈRE LA MÊME PORTE.
 *
 * Un seul handler pour `discussions`, `opportunites` et `membre` : ils partagent le même
 * contrôle d'abonnement, le même besoin de dater, et le même risque — TOUS LES TROIS
 * PORTENT DES NOMS DE PERSONNES.
 *
 * ⚠️ ABONNEMENT VÉRIFIÉ D'ABORD, comme partout dans le Club. `firestore.rules` garde ces
 * collections derrière `hasActiveClubSub()`, et le compte de service ne la traverse pas.
 *
 * ── LE PARAMÈTRE `onglet` NE PEUT PAS ÊTRE UN CHEMIN ─────────────────────────────────
 * Il est comparé à une liste fermée, jamais concaténé dans une adresse de collection. Un
 * `collection: \`club_${onglet}\`` accepterait `../users` et lirait ce qu'il veut : c'est
 * la faille classique de ce motif, et elle n'a pas l'air d'une faille en se relisant.
 *
 * ── ET UNE FICHE DE MEMBRE NE DIT PAS TOUT CE QU'ELLE SAIT ───────────────────────────
 * `club_profiles` peut porter un téléphone ou une adresse. L'écran n'en montre aucun, et
 * le serveur n'en envoie aucun : ce qui ne quitte pas le serveur ne fuite pas. Un champ
 * transmis « au cas où » finit toujours par s'afficher quelque part.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const ONGLETS = ['discussions', 'opportunites', 'membre'] as const;
type Onglet = (typeof ONGLETS)[number];

function initiales(nom: string): string {
  return nom.trim().split(/\s+/).map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase();
}

function depuis(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const heures = Math.floor((Date.now() - d.getTime()) / 3_600_000);
  if (heures < 1) return "à l'instant";
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  return jours === 1 ? 'hier' : `il y a ${jours} j`;
}

export async function appClubListe(data: unknown, context: CallContext): Promise<ReponseAppClubListe> {
  const auth = requireAuth(context);
  const releveA = new Date().toISOString();

  const { onglet, id } = (data ?? {}) as { onglet?: unknown; id?: unknown };
  if (typeof onglet !== 'string' || !(ONGLETS as readonly string[]).includes(onglet)) {
    throw new HttpsError('invalid-argument', 'Onglet inconnu.');
  }

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) return { vue: null, releveA };

  /* Bloquer quelqu'un doit valoir sur TOUT le Club, pas seulement sur le fil : croiser le
     même nom sur une discussion la minute d'après annulerait le geste. */
  const bloques = await listeDesBloques(context, auth.uid);

  if (onglet === ('discussions' satisfies Onglet)) {
    const sujets = await context.db.query({
      collection: 'club_discussions',
      orderBy: [{ field: 'lastReplyAt', direction: 'desc' }],
      limit: 40,
    });
    return {
      vue: sujets
        .filter((s: DocSnapshot) => asText(s.data.title) && asText(s.data.userName))
        .filter((s: DocSnapshot) => !bloques.has(asText(s.data.userId) ?? ''))
        .map((s: DocSnapshot) => {
          const auteur = asText(s.data.userName) as string;
          return {
            id: s.id,
            categorie: asText(s.data.category) ?? 'Entraide',
            titre: asText(s.data.title) as string,
            auteur,
            initiales: initiales(auteur),
            quand: depuis(asText(s.data.lastReplyAt) ?? asText(s.data.createdAt)),
            reponses: toNumber(s.data.replyCount, 0),
            resolu: s.data.resolved === true,
          };
        }),
      releveA,
    };
  }

  if (onglet === ('opportunites' satisfies Onglet)) {
    const offres = await context.db.query({
      collection: 'club_opportunities',
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 40,
    });
    return {
      vue: offres
        .filter((o: DocSnapshot) => asText(o.data.title))
        .filter((o: DocSnapshot) => !bloques.has(asText(o.data.userId) ?? ''))
        .map((o: DocSnapshot) => ({
          id: o.id,
          type: asText(o.data.type) ?? 'Mission',
          titre: asText(o.data.title) as string,
          lieu: asText(o.data.location) ?? null,
          quand: depuis(asText(o.data.createdAt)),
          // Un budget inventé fixe une attente de revenu chez quelqu'un qui organise
          // son temps dessus. Absent tant qu'il n'est pas annoncé.
          budget: typeof o.data.budget === 'number' ? o.data.budget : null,
          par: asText(o.data.publisherName) ?? null,
        })),
      releveA,
    };
  }

  // ── `membre` ────────────────────────────────────────────────────────────────────────
  /*
    ⚠️ CETTE FICHE ÉTAIT INATTEIGNABLE, ET LE SIGNALEMENT AVEC ELLE.
    Elle exigeait un `id` — l'uid du membre — que AUCUN écran ne passait : le fil, l'onglet
    Club et la planche poussaient tous vers `/club/membre` sans paramètre. La vue jetait
    donc `invalid-argument`, l'écran sortait par sa branche courte, et le bouton « Signaler
    ce profil » n'était jamais rendu. Sur les quatre exigences de la guideline 1.2, le
    signalement comptait pour zéro.

    On peut maintenant désigner la fiche par le CONTENU (`message`), et c'est le serveur qui
    résout l'auteur — l'uid ne circule toujours pas.
  */
  const { message } = (data ?? {}) as { message?: unknown };
  let cible = typeof id === 'string' && id !== '' ? id : null;
  if (cible === null && typeof message === 'string' && message !== '' && !message.includes('/')) {
    const post = await context.db.get(`club_posts/${message}`);
    cible = post ? asText(post.data.userId) ?? null : null;
  }
  if (cible === null) {
    throw new HttpsError('invalid-argument', 'Membre non désigné.');
  }
  const fiche = await context.db.get(`club_profiles/${cible}`);
  const nom = fiche ? asText(fiche.data.userName) : null;
  if (!fiche || !nom) return { vue: null, releveA };

  return {
    vue: {
      nom,
      initiales: initiales(nom),
      metier: asText(fiche.data.job) ?? null,
      ville: asText(fiche.data.city) ?? null,
      depuis: (() => {
        const d = asText(fiche.data.joinedAt);
        const clair = depuis(d);
        return clair ? `membre ${clair}` : null;
      })(),
      presentation: asText(fiche.data.bio) ?? null,
      formations: Array.isArray(fiche.data.formations)
        ? (fiche.data.formations as unknown[]).map(String) : [],
      contributions: toNumber(fiche.data.contributions, 0),
      /* L'état du blocage, pour que l'écran propose « Débloquer » plutôt que « Bloquer ».
         Un bouton qui rebloque quelqu'un de déjà bloqué ne dit rien de son effet. */
      bloque: bloques.has(cible),
      /* L'identifiant de la fiche, pour que le geste de blocage puisse la DÉSIGNER. C'est
         l'exception assumée à « l'uid ne sort jamais » : il ne s'agit plus d'un auteur croisé
         dans une liste mais de la personne dont on regarde la fiche, à sa demande explicite —
         et sans lui, on ne peut ni bloquer ni débloquer depuis cet écran. */
      id: cible,
      /* ⚠️ NI TÉLÉPHONE NI ADRESSE, jamais. Ils peuvent exister dans le document ; ils ne
         sortent pas d'ici. L'écran l'écrit déjà à ses lecteurs — le serveur le tient. */
    },
    releveA,
  };
}
