import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * UNE FICHE N'EST PAS SON INDEX, ET `aria-current="page"` NE DOIT PAS PRÉTENDRE LE CONTRAIRE.
 *
 * `SubNav` allumait l'étage courant en posant `aria-current="page"` sur sa puce. Sur une
 * FICHE — un épisode, une vidéo, une réalisation — l'étage est bien celui-là, mais la page
 * affichée n'est pas l'index : un lecteur d'écran annonçait « Réalisations, lien, page
 * courante » à quelqu'un qui lisait la fiche d'un projet.
 *
 * `'true'` est la valeur HTML pour « élément courant d'un ensemble » sans être la page. C'est
 * exactement le cas d'une fiche, et c'est ce que `activeKind="section"` déclare.
 *
 * Rien ne change à l'écran : c'est une correction qui ne s'entend que dans une synthèse vocale,
 * donc la seule classe de défaut qu'une relecture visuelle ne rattrape jamais.
 */

const lire = (p: string) => readFileSync(p, 'utf8');

describe('sous-navigation — ce que l’entrée allumée prétend être', () => {
  it('`aria-current` n’est plus la constante « page »', () => {
    const source = lire('src/design-system/react/navigation/SubNav.tsx');
    expect(source).toMatch(/activeKind === 'section' \? 'true' : 'page'/);
  });

  /** Les trois fiches du produit qui montent une sous-navigation d'index. */
  it.each([
    ['src/pages/conception/RealisationDetail.tsx', 'une réalisation'],
    ['src/pages/PodcastDetail.tsx', 'un épisode'],
    ['src/pages/VideoDetail.tsx', 'une vidéo'],
  ])('%s déclare une SECTION, pas une page', (fichier) => {
    expect(lire(fichier)).toMatch(/activeKind="section"/);
  });

  it('la piste Conception sait faire passer la nuance', () => {
    // Le composant de piste est un intermédiaire : s'il avale la prop, les fiches ne peuvent
    // plus rien déclarer, et le défaut revient sans que les trois lignes ci-dessus bougent.
    expect(lire('src/components/navigation/PisteSubNav.tsx')).toMatch(/activeKind/);
  });
});
