import type { Note } from '../firestore/notes';

/*
 * PUR, SANS FIREBASE : `tests/unit/club-notes-formats.test.ts` l'importe, et la CI n'a pas
 * de `.env.local` — importer `firestore/notes.ts` y faisait échouer la configuration au chargement.
 */

/** Une note du site ou de l'application, ramenée au format du site. */
export function normaliserNote(id: string, data: Record<string, unknown>): Note {
  const texte = (k: string) => (typeof data[k] === 'string' ? (data[k] as string) : '');
  const contenu = texte('content') || texte('text');
  return {
    ...(data as Partial<Note>),
    id,
    content: contenu,
    title: texte('title') || texte('lessonLabel') || contenu.split('\n')[0].slice(0, 80),
    createdAt: texte('createdAt'),
    updatedAt: texte('updatedAt') || texte('createdAt'),
  };
}
