import type { ClubDigitosPost, ClubPostCategory } from '../../types';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LIRE UN MESSAGE DU CLUB, QUEL QUE SOIT SON ÉCRIVAIN.
 *
 * ⛔ L'application écrivait `club_posts` dans un autre format que le site : `text` au lieu de
 * `content`, `likes: 0` au lieu d'un tableau d'uid, `comments` au lieu de `commentsCount`,
 * et des rubriques « Entraide/Outils/Victoires/Questions ». Le fil appelle
 * `post.likes.includes(uid)` : un seul message mobile suffisait à le faire TOMBER.
 *
 * L'application écrit désormais le format du site (`worker/apps/api/src/lib/club-posts.ts`) ;
 * cette lecture rattrape ce qui a pu être écrit avant. Elle est la seule porte de lecture
 * (`getClubPosts`), donc le fil, l'administration et leurs compteurs en profitent tous.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const CATEGORIE_DEPUIS_APP: Readonly<Record<string, ClubPostCategory>> = {
  Entraide: 'general',
  Questions: 'question',
  Outils: 'ressource',
  Victoires: 'temoignage',
};

const CATEGORIES: readonly ClubPostCategory[] = [
  'general', 'question', 'ressource', 'temoignage', 'opportunite', 'discussion',
];

const enListe = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

export function normaliserPostClub(brut: Record<string, unknown> & { id: string }): ClubDigitosPost {
  const categorie = typeof brut.category === 'string'
    ? (CATEGORIES as readonly string[]).includes(brut.category)
      ? (brut.category as ClubPostCategory)
      : CATEGORIE_DEPUIS_APP[brut.category] ?? 'general'
    : 'general';
  const commentaires = typeof brut.commentsCount === 'number' ? brut.commentsCount
    : typeof brut.comments === 'number' ? brut.comments : 0;
  return {
    ...(brut as unknown as ClubDigitosPost),
    content: typeof brut.content === 'string' ? brut.content
      : typeof brut.text === 'string' ? brut.text : '',
    likes: enListe(brut.likes),
    reposts: enListe(brut.reposts),
    commentsCount: commentaires,
    type: brut.type === 'discussion' ? 'discussion' : 'post',
    category: categorie,
  };
}
