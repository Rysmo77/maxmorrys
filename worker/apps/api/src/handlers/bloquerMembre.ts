import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { asText } from '../lib/values';
import { abonnementActif } from './app/club';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `bloquerMembre` — L'EXIGENCE 1.2 D'APPLE, ET LA RAISON POUR LAQUELLE ELLE EXISTE.
 *
 * La guideline App Store 1.2 demande quatre choses de toute application qui publie du contenu
 * généré par ses utilisateurs : un filtrage à la publication, un SIGNALEMENT, la capacité de
 * BLOQUER un membre abusif, et un contact publié. Le Club publie du contenu de membre à
 * membre ; il en tenait zéro sur quatre en pratique — le signalement existait mais son écran
 * était inatteignable, et le blocage n'existait nulle part.
 *
 * ── ON DÉSIGNE UN CONTENU, PAS UNE PERSONNE ─────────────────────────────────────────────
 * `clubFil.ts` pose la règle en toutes lettres : « l'identifiant de l'auteur ne sort jamais.
 * L'écran a besoin d'un nom et d'initiales, pas d'un uid — et un uid qui circule finit par
 * servir de clé à quelqu'un. »
 *
 * Bloquer demande pourtant de désigner quelqu'un. La sortie est que le client envoie
 * l'identifiant du CONTENU — un message, un sujet, une annonce, tous déjà présents dans les
 * vues — et que le SERVEUR résolve l'auteur. L'invariant tient, et aucune vue existante n'a
 * besoin de porter un champ de plus.
 *
 * ── UNE LISTE FERMÉE, JAMAIS UN CHEMIN CONCATÉNÉ ────────────────────────────────────────
 * Même précaution que `clubListe.ts` : `type` est comparé à une table, jamais interpolé dans
 * une adresse de collection. Un `collection: \`club_${type}\`` accepterait `../users`.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Où lire l'auteur, selon ce qu'on désigne. Fermée par construction. */
const CIBLES = {
  membre: { collection: 'club_profiles', champ: null },
  message: { collection: 'club_posts', champ: 'userId' },
  discussion: { collection: 'club_discussions', champ: 'userId' },
  opportunite: { collection: 'club_opportunities', champ: 'userId' },
} as const;

type TypeCible = keyof typeof CIBLES;

/** Au-delà, ce n'est plus une liste de gens qu'on évite : c'est autre chose. */
const PLAFOND = 200;

export async function bloquerMembre(data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) {
    throw new HttpsError('permission-denied', 'Réservé aux membres du Club.');
  }

  const { cible, bloquer } = (data ?? {}) as {
    cible?: { type?: unknown; id?: unknown };
    bloquer?: unknown;
  };
  const type = cible?.type;
  const id = cible?.id;

  if (typeof type !== 'string' || !(type in CIBLES)) {
    throw new HttpsError('invalid-argument', 'Cible inconnue.');
  }
  if (typeof id !== 'string' || id === '' || id.includes('/')) {
    throw new HttpsError('invalid-argument', 'Cible non désignée.');
  }
  if (typeof bloquer !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Il faut dire si on bloque ou si on débloque.');
  }

  const regle = CIBLES[type as TypeCible];
  const document = await context.db.get(`${regle.collection}/${id}`);
  if (!document) throw new HttpsError('not-found', 'Ce contenu n’existe plus.');

  const vise = regle.champ === null ? document.id : asText(document.data[regle.champ]);
  if (!vise) throw new HttpsError('not-found', 'Ce contenu n’a pas d’auteur nommé.');

  /* Même refus que le signalement : se bloquer soi-même n'est pas une erreur de saisie, c'est
     un état qui rendrait le fil vide sans que personne ne comprenne pourquoi. */
  if (vise === auth.uid) {
    throw new HttpsError('failed-precondition', 'On ne se bloque pas soi-même.');
  }

  const existant = await context.db.get(`club_blocks/${auth.uid}`);
  const actuels = Array.isArray(existant?.data.bloques)
    ? (existant.data.bloques as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const ensemble = new Set(actuels);

  if (bloquer) {
    if (!ensemble.has(vise) && ensemble.size >= PLAFOND) {
      throw new HttpsError('resource-exhausted', 'Trop de comptes bloqués.');
    }
    ensemble.add(vise);
  } else {
    ensemble.delete(vise);
  }

  await context.db.set(`club_blocks/${auth.uid}`, {
    userId: auth.uid,
    bloques: [...ensemble],
    updatedAt: new Date().toISOString(),
  });

  /* On rend l'état et le COMPTE, jamais la liste : elle est déjà connue de son propriétaire,
     et la renvoyer à chaque écriture la ferait transiter sans raison. */
  return { bloque: ensemble.has(vise), combien: ensemble.size };
}

/** Les uids bloqués par quelqu'un. Lecture partagée par les vues du Club. */
export async function listeDesBloques(context: CallContext, uid: string): Promise<Set<string>> {
  const document = await context.db.get(`club_blocks/${uid}`);
  const bloques = Array.isArray(document?.data.bloques)
    ? (document.data.bloques as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  return new Set(bloques);
}
