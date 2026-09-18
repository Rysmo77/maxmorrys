import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UN PROJET CLIENT N'EST PAS UNE VENTURE, ET LE DESSIN NE SUFFIT PAS À LES SÉPARER.
 *
 * `src/lib/brand/clients.ts` et `ventures.ts` l'exigent en toutes lettres : « Aucune surface
 * de l'application ne doit mélanger les deux listes dans une même grille. » Un projet client
 * appartient à son client ; une venture est détenue au sein de MY ONOMA. Les confondre n'est
 * pas une imprécision de vitrine, c'est une revendication de propriété.
 *
 * Or au 18/09/2026, `/conception` rendait les deux familles avec le MÊME bloc JSX, recopié :
 * même panneau, même géométrie, même typographie. La seule chose qui les distinguait à
 * l'écran était le texte d'une étiquette — une constante qu'une page pouvait poser à la main,
 * donc se tromper à la main.
 *
 * Depuis, une coque privée porte le dessin et deux adaptateurs épinglent chacun leur
 * constante. Ce test garde le fait qui rend l'erreur inexprimable : **une page ne nomme plus
 * jamais la relation d'une venture.**
 */

const PAGES = 'src/pages';

function fichiersDe(dossier: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const p = join(dossier, e.name);
    if (e.isDirectory()) out.push(...fichiersDe(p));
    else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** Le code sans ses commentaires — un commentaire qui CITE la constante n'est pas un usage. */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

describe('la frontière entre un projet client et une venture', () => {
  const pages = fichiersDe(PAGES);

  it('le balayage voit bien les pages', () => {
    expect(pages.length).toBeGreaterThan(20);
  });

  it('aucune page ne nomme la relation d’une venture', () => {
    /*
     * `CLIENT_RELATION` reste permise sur la FICHE d'une réalisation : elle y décrit un objet
     * unique et non ambigu, celui que la page entière traite. `VENTURE_RELATION`, elle, n'a
     * aucune raison d'apparaître hors des cartes — et c'est l'appariement inverse, une venture
     * présentée comme un travail client, qui serait le plus coûteux.
     */
    const fautives = pages.filter((p) => /VENTURE_RELATION/.test(sansCommentaires(readFileSync(p, 'utf8'))));
    expect(
      fautives,
      'la relation d’une venture se pose dans son adaptateur de carte, pas dans une page',
    ).toEqual([]);
  });

  it('les deux adaptateurs épinglent chacun la leur', () => {
    const carte = readFileSync('src/components/conception/WorkCard.tsx', 'utf8');
    expect(carte).toMatch(/CLIENT_RELATION/);
    expect(carte).toMatch(/VENTURE_RELATION/);
  });
});
