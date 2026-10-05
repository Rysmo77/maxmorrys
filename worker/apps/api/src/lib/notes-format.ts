/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * UNE NOTE, DEUX ÉCRIVAINS — ET LE FORMAT DU SITE EN BASE.
 *
 * ⛔ Le site écrit `users/{uid}/notes` en `{ title, content, formationId?, createdAt,
 * updatedAt }` et LIT `orderBy('updatedAt')` (`src/lib/firestore/notes.ts`). L'application
 * écrivait `{ text, lessonId, lessonLabel, createdAt }` — sans `updatedAt`. Firestore EXCLUT
 * d'une requête triée tout document qui n'a pas le champ de tri : les notes prises dans
 * l'application n'apparaissaient JAMAIS sur le site, et celles du site arrivaient vides dans
 * l'application, qui lisait `text`. Constaté le 05/10/2026.
 *
 * On écrit le format du site (plus `lessonId`/`lessonLabel`, que l'application exploite), et
 * on lit les deux : des notes à l'ancien format existent peut-être déjà.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Un identifiant fourni par le client : un UUID, et rien d'autre ne passe dans un chemin. */
export const FORME_ID_CLIENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function noteEnBase(args: {
  texte: string; lessonId: string | null; lessonLabel: string | null; maintenant: string;
}): Record<string, unknown> {
  return {
    /* Le site affiche un titre : la leçon quand on la connaît, sinon le début du texte. */
    title: args.lessonLabel ?? args.texte.split('\n')[0].slice(0, 80),
    content: args.texte,
    lessonId: args.lessonId,
    lessonLabel: args.lessonLabel,
    createdAt: args.maintenant,
    updatedAt: args.maintenant,
  };
}

export function texteDeNote(data: Record<string, unknown>): string {
  if (typeof data.content === 'string' && data.content !== '') return data.content;
  return typeof data.text === 'string' ? data.text : '';
}
