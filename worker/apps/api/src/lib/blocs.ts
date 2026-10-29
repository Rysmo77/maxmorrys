/**
 * LES BLOCS — une seule description du contenu, deux rendus : HTML et texte.
 *
 * Les gabarits existants écrivent leur HTML (par les primitives de `email-design.ts`) PUIS
 * leur version texte, à la main, à côté. Deux rédactions du même courrier, c'est l'occasion
 * qu'elles divergent : un paragraphe ajouté d'un côté seulement, un lien qui n'existe que
 * dans le HTML. Les gabarits marketing et les campagnes passent donc par cette liste de
 * blocs, rendue des deux façons par le même code.
 *
 * C'est aussi le format STRUCTURÉ qu'acceptent la route de campagne (`marketingRoute.ts`) :
 * un agent ou n8n décrit des blocs, le Worker les met en page — impossible de sortir du
 * design system, puisqu'on ne fournit pas de HTML.
 */
import * as DS from './email-design';

export type Bloc =
  | { type: 'titre'; texte: string }
  | { type: 'surTitre'; texte: string }
  | { type: 'paragraphe'; texte: string; sourdine?: boolean }
  | { type: 'mention'; texte: string }
  | { type: 'encadre'; texte: string }
  | { type: 'encart'; surTitre: string; valeur: string; note?: string }
  | { type: 'bouton'; libelle: string; url: string }
  | { type: 'filet' };

export const TYPES_DE_BLOC = ['titre', 'surTitre', 'paragraphe', 'mention', 'encadre', 'encart', 'bouton', 'filet'] as const;

/** Le HTML de la carte. Chaque primitive échappe ce qu'elle reçoit. */
export function blocsEnHtml(blocs: Bloc[]): string {
  return blocs
    .map((b) => {
      switch (b.type) {
        case 'titre': return DS.titre(b.texte);
        case 'surTitre': return DS.surTitre(b.texte);
        case 'paragraphe': return DS.paragraphe(b.texte, b.sourdine === true);
        case 'mention': return DS.mention(b.texte);
        case 'encadre': return DS.encadre(b.texte);
        case 'encart': return DS.encart(b.surTitre, b.valeur, b.note);
        case 'bouton': return DS.bouton(b.libelle, b.url);
        case 'filet': return DS.filet();
      }
    })
    .join('\n');
}

/**
 * La version texte.
 *
 * Le bouton devient « Libellé : URL » sur sa propre ligne : un client texte rend l'URL
 * cliquable, et le libellé dit où elle mène. Le filet devient une ligne vide de plus — un
 * trait de tirets se lit comme une signature dans certains clients, qui coupent la suite.
 */
export function blocsEnTexte(blocs: Bloc[], langue: 'fr' | 'en' = 'fr'): string {
  // Typographie : espace insécable avant les deux-points en français, aucune en anglais.
  const deuxPoints = langue === 'fr' ? '\u00A0: ' : ': ';
  const lignes: string[] = [];
  for (const b of blocs) {
    switch (b.type) {
      case 'titre': lignes.push(b.texte, ''); break;
      case 'surTitre': lignes.push(b.texte.toUpperCase()); break;
      case 'paragraphe':
      case 'mention':
      case 'encadre': lignes.push(b.texte, ''); break;
      case 'encart': lignes.push(`${b.surTitre}${deuxPoints}${b.valeur}`, ...(b.note ? [b.note] : []), ''); break;
      case 'bouton': lignes.push(`${b.libelle}${deuxPoints}${b.url}`, ''); break;
      case 'filet': lignes.push(''); break;
    }
  }
  return lignes.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Le nombre de boutons des blocs — un courrier n’en porte qu’un (CTA unique). */
export function compterBoutons(blocs: Bloc[]): number {
  return blocs.filter((b) => b.type === 'bouton').length;
}
