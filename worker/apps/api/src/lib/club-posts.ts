/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * UN MESSAGE DU CLUB, DEUX ÉCRIVAINS — ET UN SEUL FORMAT EN BASE.
 *
 * ⛔ LE SITE ET L'APPLICATION ÉCRIVAIENT DEUX FORMATS DANS `club_posts` :
 *
 *   site (`src/lib/firestore/club.ts`)   content, likes: [uid…], reposts: [uid…], commentsCount,
 *                                         type: 'post', category ∈ general|question|ressource|…
 *   application (`posterAuClub`)          text, likes: 0, reposts: 0, comments: 0,
 *                                         category ∈ Entraide|Outils|Victoires|Questions
 *
 * Conséquences mesurées le 05/10/2026 :
 *   · le fil de l'application filtrait sur `text` : il écartait TOUT message publié depuis le
 *     site — un Club où l'application ne voyait que ses propres messages ;
 *   · le fil du site appelle `post.likes.includes(uid)` : sur un `likes: 0` écrit par
 *     l'application, l'appel lève, et le fil du site tombe au premier message mobile ;
 *   · les commentaires s'y comptaient sous deux noms, et l'application affichait toujours 0.
 *
 * Le format du SITE fait autorité (il est le plus ancien, il a ses règles et son digest). Ce
 * module l'écrit, et il LIT les deux — des messages au format de l'application peuvent déjà
 * exister en base. `src/lib/club/posts.ts` fait la même lecture tolérante côté site.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Les rubriques de l'application et leur équivalent en base. */
export const CATEGORIE_EN_BASE = {
  Entraide: 'general',
  Questions: 'question',
  Outils: 'ressource',
  Victoires: 'temoignage',
} as const;

export type CategorieApp = keyof typeof CATEGORIE_EN_BASE;

/** Le libellé que l'application affiche pour une catégorie de la base, quelle qu'en soit l'origine. */
const LIBELLE_DEPUIS_BASE: Readonly<Record<string, string>> = {
  general: 'Entraide',
  question: 'Questions',
  ressource: 'Outils',
  temoignage: 'Victoires',
  opportunite: 'Opportunités',
  discussion: 'Discussions',
};

export function libelleDeCategorie(brute: unknown): string {
  if (typeof brute !== 'string' || brute === '') return 'Entraide';
  return LIBELLE_DEPUIS_BASE[brute] ?? (brute in CATEGORIE_EN_BASE ? brute : 'Entraide');
}

/** Un compteur stocké en tableau d'uid (site) ou en nombre (ancien format de l'application). */
export function compte(valeur: unknown): number {
  if (Array.isArray(valeur)) return valeur.length;
  return typeof valeur === 'number' && Number.isFinite(valeur) && valeur > 0 ? Math.floor(valeur) : 0;
}

/** Le texte d'un message, quel que soit son écrivain. */
export function texteDuMessage(data: Record<string, unknown>): string | null {
  const t = typeof data.content === 'string' && data.content.trim() !== '' ? data.content
    : typeof data.text === 'string' && data.text.trim() !== '' ? data.text : null;
  return t;
}

export function commentairesDuMessage(data: Record<string, unknown>): number {
  return compte(data.commentsCount ?? data.comments);
}

/** Le document qu'écrit l'application — au format du SITE. */
export function messageEnBase(args: {
  uid: string; nom: string; texte: string; categorie: CategorieApp; maintenant: string;
}): Record<string, unknown> {
  return {
    userId: args.uid,
    userName: args.nom,
    content: args.texte,
    type: 'post',
    category: CATEGORIE_EN_BASE[args.categorie],
    likes: [],
    reposts: [],
    commentsCount: 0,
    createdAt: args.maintenant,
  };
}
