/**
 * Échappement HTML repris tel quel des Cloud Functions.
 *
 * ⚠️ L'apostrophe n'est **pas** échappée — les valeurs ne sont injectées que dans
 * des attributs délimités par des guillemets doubles. Ajouter `&#39;` produirait
 * un HTML différent de l'actuel et ferait échouer le test de parité.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Retire la syntaxe markdown pour extraire un corps en texte brut. */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '') // blocs de code
    .replace(/`[^`]*`/g, '') // code inline
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // liens → texte
    .replace(/^#{1,6}\s+/gm, '') // titres
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // gras/italique
    .replace(/^>\s+/gm, '') // citations
    .replace(/^[-*+]\s+/gm, '') // puces
    .replace(/^\d+\.\s+/gm, '') // listes numérotées
    .replace(/\n{3,}/g, '\n\n') // regroupement des sauts de ligne
    .trim();
}
