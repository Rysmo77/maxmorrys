import { HttpsError } from '@mm/shared';

import { type CallContext, requireAuth } from '../context';
import { abonnementActif } from './app/club';
import { asText } from '../lib/values';

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
const CATEGORIES = ['Entraide', 'Outils', 'Victoires', 'Questions'];

export async function posterAuClub(data: unknown, context: CallContext): Promise<unknown> {
  const auth = requireAuth(context);

  const abonnement = await abonnementActif(context, auth.uid);
  if (!abonnement) {
    throw new HttpsError('permission-denied', 'Le Club est réservé aux membres actifs.');
  }

  const { texte, categorie } = (data ?? {}) as { texte?: unknown; categorie?: unknown };
  if (typeof texte !== 'string' || texte.trim() === '') {
    throw new HttpsError('invalid-argument', 'Un message vide ne se publie pas.');
  }
  if (texte.length > MAX) {
    throw new HttpsError('invalid-argument', `Ce message dépasse ${MAX} caractères.`);
  }
  /* La catégorie est comparée à une liste fermée : elle sert de filtre à l'écran, et une
     valeur libre créerait des catégories fantômes que personne ne peut plus sélectionner. */
  const rubrique = typeof categorie === 'string' && CATEGORIES.includes(categorie)
    ? categorie : 'Entraide';

  const profil = await context.db.get(`users/${auth.uid}`);
  const nom = asText(profil?.data.displayName);
  if (!nom) {
    /* Un message doit être SIGNÉ. Publier « undefined » sur un mur est le défaut que la
       lecture évite déjà en filtrant les auteurs manquants ; on ne l'introduit pas ici. */
    throw new HttpsError('failed-precondition', 'Ton profil n’a pas de nom affiché.');
  }

  const id = crypto.randomUUID();
  const maintenant = new Date().toISOString();

  await context.db.commit([
    context.db.buildWrite(`club_posts/${id}`, {
      userId: auth.uid,
      userName: nom,
      text: texte.trim(),
      category: rubrique,
      likes: 0,
      reposts: 0,
      comments: 0,
      createdAt: maintenant,
    }, { mask: false }),
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
