/**
 * LE TITRE D'AFFICHAGE TIENT DANS L'ÉCRAN — LES DEUX GARDE-FOUS QUI L'ASSURENT.
 *
 * `SiteDisplay` écrit chaque ligne en `nowrap` : c'est AD-13, et c'est ce qui protège les
 * coupures voulues par l'auteur. La contrepartie, c'est qu'une ligne trop longue ne se replie
 * pas — elle POUSSE LA PAGE. Le défaut était mesuré, en production, sur six des huit routes
 * publiques à 375 px : le document s'élargissait à 495 px sur `/`, 509 sur `/agence`, 526 sur
 * `/podcast-et-videos`, 564 sur `/presence-digitale`. Toute la page défilait latéralement, sur
 * la largeur d'écran la plus répandue.
 *
 * Rien ne le voyait : ni le typecheck, ni le lint, ni le rendu au bureau — la seule largeur à
 * laquelle personne ne développe est justement celle-là.
 *
 * Deux mécanismes le referment, et ce fichier refuse qu'on les retire :
 *
 *   1 · LA TAILLE EST FLUIDE — un `clamp()` dont la borne basse vaut 62 % de la taille écrite,
 *       jamais moins de 22 px. Le pire cas relevé réclamait 1,49 fois sa colonne, soit un
 *       facteur maximal de 0,671 : desserrer le plancher au-delà rouvre le défaut.
 *   2 · SOUS 375 PX, LA LIGNE SE REPLIE — `--dsp-wrap`. En dessous, même 22 px ne suffit plus,
 *       et le système ne descend pas plus bas : c'est sa limite de lisibilité déclarée.
 *
 * ⚠️ Ce test est STATIQUE : il vérifie que les mécanismes sont en place, PAS que le rendu
 * tient. La seule preuve du rendu est une mesure au navigateur — relevée à 320, 360, 375, 390,
 * 430, 700, 900, 1080 et 1440 px sur douze routes, toutes au propre. Refaire ce relevé est le
 * geste à reproduire quand on touche à un titre long, pas relire ce fichier.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const TYPE = readFileSync(join(ROOT, 'src/components/site/SiteType.tsx'), 'utf8');
const CSS = readFileSync(join(ROOT, 'src/index.css'), 'utf8');

describe('titre d’affichage — la taille suit la largeur', () => {
  it('la taille est un clamp, pas une valeur figée', () => {
    /*
      `fontSize: `${size}px`` était la forme d'origine. Elle sert la même valeur à 320 px et à
      1920 : c'est exactement le défaut. Le test refuse le retour à une taille non bornée.
    */
    expect(TYPE).toMatch(/fontSize: `clamp\(/);
    expect(TYPE).not.toMatch(/fontSize: `\$\{size\}px`/);
  });

  it('le plancher reste sous le facteur maximal admissible', () => {
    const m = /size \* (0\.\d+)/.exec(TYPE);
    expect(m, 'le facteur de plancher doit rester lisible dans le code').not.toBeNull();
    const facteur = Number(m![1]);
    // 0,671 est la mesure ; au-delà, la plus longue ligne du site ressort de sa colonne.
    expect(facteur).toBeLessThanOrEqual(0.671);
    // Et sous 0,5 le titre cesserait d'être un titre : le héros passerait sous le paragraphe.
    expect(facteur).toBeGreaterThanOrEqual(0.5);
  });

  it('la borne haute est ancrée sur le point de rupture large', () => {
    // `size / 10.8` en `vw` vaut exactement `size` à 1080 px — le point de rupture `wide`.
    // Sans cet ancrage, le titre n'atteindrait jamais la taille écrite, ou la dépasserait.
    expect(TYPE).toMatch(/size \/ 10\.8/);
  });

  it('le plancher de lisibilité de 22 px tient', () => {
    expect(TYPE).toMatch(/Math\.max\(22,/);
  });
});

describe('titre d’affichage — le repli de dernier recours', () => {
  it('la ligne lit `--dsp-wrap` au lieu d’un `nowrap` figé', () => {
    expect(TYPE).toMatch(/var\(--dsp-wrap, nowrap\)/);
  });

  it('`--dsp-wrap` bascule sous 375 px, et nulle part ailleurs', () => {
    const bloc = /@media \(max-width: (\d+)px\)[^}]*\{\s*:root \{\s*--dsp-wrap: normal;/.exec(CSS);
    expect(bloc, '`--dsp-wrap` doit être déclaré dans une requête de largeur maximale').not.toBeNull();
    const borne = Number(bloc![1]);
    // Au-dessus de 374, on replierait des titres qui tiennent : la coupure écrite se perdrait
    // sans raison. En dessous, on laisserait 320 et 360 px défiler de côté.
    expect(borne).toBe(374);
  });

  it('`--dsp-wrap` n’est jamais posé en dur ailleurs', () => {
    // Un composant qui poserait `--dsp-wrap: normal` sur lui-même contournerait la règle
    // sans le dire — c'est `wrap` qui sert à ça, et il est explicite.
    const ailleurs = CSS.split('@media (max-width: 374px)')[0];
    expect(ailleurs).not.toMatch(/--dsp-wrap:/);
  });
});
