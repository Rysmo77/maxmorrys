import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { abonnementActif } from './app/club';
import { asText } from '../lib/values';
import { CATEGORIE_EN_BASE, commentairesDuMessage, compte, libelleDeCategorie, messageEnBase, texteDuMessage, type CategorieApp } from '../lib/club-posts';
import { FORME_ID_CLIENT } from '../lib/notes-format';
import type { Sortie } from '../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `posterAuClub` — écrire sur le mur, et les trois choses que l'auteur ne décide pas.
 *
 * ⚠️ ABONNEMENT VÉRIFIÉ D'ABORD. `firestore.rules` exige `hasActiveClubSub()` pour créer
 * un post ; le compte de service ne la traverse pas. Sans cette ligne, n'importe quel
 * compte gratuit pourrait écrire sur le mur d'un espace payant.
 *
 * ── CE QUE L'APPELANT NE FOURNIT PAS, ET POURQUOI ────────────────────────────────────
 * La règle Firestore a été durcie un jour parce qu'elle laissait l'auteur réécrire son
 * document entier. Trois champs lui échappent désormais, et ils lui échappent ici aussi :
 *
 *   `userId`   pris dans le JETON. La règle exige `request.auth.uid ==
 *              request.resource.data.userId` ; le prendre dans la charge utile
 *              permettrait de signer un message du nom de quelqu'un d'autre.
 *   `userName` LU DANS LE PROFIL, jamais transmis. C'est le champ qui s'affiche en
 *              clair sur le mur : accepter celui de l'appelant, c'est accepter qu'il
 *              choisisse sous quel nom il parle.
 *   `likes` / `reposts` / `comments`  initialisés à zéro. La règle interdit à l'auteur
 *              de les réécrire — c'est-à-dire à la seule personne qui a intérêt à les
 *              gonfler.
 *
 * ── ET UN MESSAGE VIDE N'EST PAS UN MESSAGE ─────────────────────────────────────────
 * On refuse plutôt que d'écrire une ligne signée qui ne dit rien. Sur un mur, une entrée
 * vide au nom de quelqu'un est plus embarrassante qu'une erreur.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const MAX = 2_000;

export async function posterAuClub(data: unknown, context: CallContext): Promise<Sortie<'posterAuClub'>> {
  const auth = requireAuth(context);

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) {
    throw new HttpsError('permission-denied', 'Le Club est réservé aux membres actifs.');
  }

  const { texte, categorie, idClient } = (data ?? {}) as { texte?: unknown; categorie?: unknown; idClient?: unknown };
  if (idClient !== undefined && (typeof idClient !== 'string' || !FORME_ID_CLIENT.test(idClient))) {
    throw new HttpsError('invalid-argument', 'idClient doit être un UUID.');
  }
  if (typeof texte !== 'string' || texte.trim() === '') {
    throw new HttpsError('invalid-argument', 'Un message vide ne se publie pas.');
  }
  if (texte.length > MAX) {
    throw new HttpsError('invalid-argument', `Ce message dépasse ${MAX} caractères.`);
  }
  /* La catégorie est comparée à une liste fermée : elle sert de filtre à l'écran, et une
     valeur libre créerait des catégories fantômes que personne ne peut plus sélectionner. */
  const rubrique: CategorieApp = typeof categorie === 'string' && categorie in CATEGORIE_EN_BASE
    ? (categorie as CategorieApp) : 'Entraide';

  const profil = await context.db.get(`users/${auth.uid}`);
  const nom = asText(profil?.data.displayName);
  if (!nom) {
    /* Un message doit être SIGNÉ. Publier « undefined » sur un mur est le défaut que la
       lecture évite déjà en filtrant les auteurs manquants ; on ne l'introduit pas ici. */
    throw new HttpsError('failed-precondition', 'Ton profil n’a pas de nom affiché.');
  }

  /*
   * ⭐ `idClient` REND LA PUBLICATION REJOUABLE — la file hors ligne renvoie un message dont
   * la première tentative a pu ARRIVER sans que la réponse revienne. Mais un message, à la
   * différence d'une note, porte les cœurs des AUTRES : le réécrire les effacerait. Un
   * document déjà présent est donc RENDU tel quel, jamais réécrit — et refusé s'il n'est pas
   * de la même personne.
   */
  const id = typeof idClient === 'string' ? idClient : crypto.randomUUID();
  if (typeof idClient === 'string') {
    const deja = await context.db.get(`club_posts/${id}`);
    if (deja) {
      if (asText(deja.data.userId) !== auth.uid) throw new HttpsError('invalid-argument', 'idClient déjà pris.');
      const auteur = asText(deja.data.userName) ?? nom;
      return {
        message: {
          id,
          auteur,
          initiales: auteur.trim().split(/\s+/).map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase(),
          categorie: libelleDeCategorie(deja.data.category),
          quand: "à l'instant",
          texte: texteDuMessage(deja.data) ?? texte.trim(),
          aime: compte(deja.data.likes),
          republie: compte(deja.data.reposts),
          commente: commentairesDuMessage(deja.data),
        },
      };
    }
  }
  const maintenant = new Date().toISOString();

  await context.db.commit([
    /* ⛔ AU FORMAT DU SITE (`lib/club-posts.ts`). L'ancien `likes: 0` faisait tomber le fil
       du site, qui appelle `likes.includes(uid)`. */
    context.db.buildWrite(`club_posts/${id}`, messageEnBase({
      uid: auth.uid, nom, texte: texte.trim(), categorie: rubrique, maintenant,
    }), { mask: false }),
  ]);

  return {
    message: {
      id,
      auteur: nom,
      initiales: nom.trim().split(/\s+/).map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase(),
      categorie: rubrique,
      quand: "à l'instant",
      texte: texte.trim(),
      aime: 0,
      republie: 0,
      commente: 0,
    },
  };
}
