import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * LA SOUS-NAVIGATION N'AVAIT JAMAIS PORTÉ QUE DEUX PUCES.
 *
 * `SubNav` sert le pôle média et le Club depuis leur fusion : deux étages, deux puces. La
 * refonte en deux pistes (17/09/2026) l'emmène à TROIS (`/conception*`) et QUATRE
 * (`/apprendre` et les quatre territoires) — sans que personne ne mesure ce que ça coûte.
 *
 * ── LE RELEVÉ, 18/09/2026 ──────────────────────────────────────────────────────────────────
 * Chrome en métriques d'appareil émulées (jamais un redimensionnement de fenêtre, dont le
 * chrome mange des pixels), `document.fonts.ready` attendu avant toute lecture — sans quoi
 * les métriques de repli donnent des largeurs de texte fausses, et c'est du texte qu'on mesure.
 *
 *   route                   appareil   demandé / offert   fenêtre obtenue
 *   /apprendre                 390        440 / 354            458      ⛔
 *   /apprendre                 430        440 / 394            458      ⛔
 *   /conception                390        375 / 354            393      ⛔
 *   /en/learning               390        393 / 354            420      ⛔
 *   /podcast-et-videos (2)     390        354 / 354            390      témoin, tient
 *
 * LE SYMPTÔME N'ÉTAIT PAS UNE BARRE DE DÉFILEMENT. Sans mécanisme de débordement, le
 * navigateur élargit la fenêtre visuelle pour absorber le dépassement : sur un téléphone de
 * 390 px, `/apprendre` s'affichait à 458, c'est-à-dire **tout le contenu 15 % plus petit que
 * dessiné**, sur toutes les pages des deux pistes.
 *
 * Et avant d'en arriver là, les puces se COMPRIMAIENT : à 320 px, les deux puces du témoin
 * passaient de 354 à 284 px de large — dans une pilule dont la hauteur est figée à 42 px,
 * donc avec un texte qui sort de sa forme. Aucune mesure de débordement ne pouvait le voir.
 *
 * ── APRÈS ──────────────────────────────────────────────────────────────────────────────────
 * 54 des 56 combinaisons (8 routes × 7 largeurs) rendent une fenêtre égale à l'appareil.
 * Les deux restantes — `/en/learning` à 375 et 390 — relèvent d'un débordement ANTÉRIEUR et
 * distinct, identique avant et après ce correctif, et qui n'est pas la sous-navigation : sa
 * rangée y est bien contrainte à 354 px. Il est consigné à part.
 *
 * ── CE QUE CE TEST GARDE ───────────────────────────────────────────────────────────────────
 * Le dépôt n'a aucun harnais de rendu (`project-context.md` : 147 fichiers `.tsx`, zéro test
 * de composant, `@testing-library` non installé — l'ajouter est une décision, pas un détail).
 * Ce test garde donc la SOURCE : les quatre lignes sans lesquelles la mesure ci-dessus
 * revient. C'est la même réponse que `display-fit.test.ts` et `tailwind-radius-collision.test.ts`
 * apportent à des défauts de même nature.
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Le code sans ses commentaires.
 *
 * ⚠️ Écrit APRÈS que ce test se soit pris les pieds dans son propre tapis : l'en-tête de
 * `SubNav` explique pourquoi il n'emploie PAS `scrollIntoView()`, et l'assertion qui
 * l'interdisait lisait cette phrase comme un usage. C'est le mode d'échec classique d'un
 * nettoyage — ce qui reste, c'est un commentaire qui CITE ce qu'on a retiré. Deux autres
 * suites du dépôt s'en protègent déjà de la même façon.
 */
function sansCommentaires(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const SOURCE = sansCommentaires(readFileSync('src/design-system/react/navigation/SubNav.tsx', 'utf8'));

describe('sous-navigation — le débordement mesuré ne peut pas revenir', () => {
  /*
   * `overflow-x: auto` NE PROMET RIEN POSÉ SEUL : un élément de flex ou de grille garde
   * `min-width: auto`, donc il s'élargit à son contenu au lieu de déborder de lui-même — et
   * c'est la PAGE qui s'élargit. `ChipRow` porte le même triplet, pour la même raison, après
   * l'avoir mesuré sur `/en/faq`.
   */
  it.each([
    ["overflowX: 'auto'", 'la rangée défile'],
    ['minWidth: 0', "sans quoi `overflow-x` ne contraint rien dans un conteneur flex"],
    ["maxWidth: '100%'", 'sans quoi la rangée déborde de son parent'],
  ])('la rangée porte %s — %s', (fragment) => {
    expect(SOURCE).toContain(fragment);
  });

  it('les puces ne se compriment plus', () => {
    // `flex: 0 0 auto` sur le <li> : sans lui, les puces rétrécissent jusqu'à casser leur
    // texte, et la rangée ne déborde jamais — donc ne défile jamais.
    expect(SOURCE).toMatch(/<li[\s\S]{0,120}flex: '0 0 auto'/);
  });

  it('un libellé de puce ne se replie pas dans une hauteur figée', () => {
    // La pilule fait 42 px de haut, écrits en dur. Un libellé qui se replie en sort.
    expect(SOURCE).toMatch(/whiteSpace: 'nowrap'/);
  });

  it('un seul mécanisme : pas de repli EN PLUS du défilement', () => {
    /*
     * Les deux se neutralisent, et `flex-wrap` pousserait le héros d'une cinquantaine de
     * pixels sur huit pages et deux langues. Le choix est le défilement ; qu'il reste seul.
     */
    expect(SOURCE).not.toMatch(/flexWrap:\s*'wrap'/);
  });

  it("l'étage courant est ramené dans le champ sans emporter la page", () => {
    /*
     * Une barre de repérage qui cache l'entrée où l'on se trouve ne repère plus rien : à
     * 360 px, la quatrième puce est hors champ à l'arrivée. Mais `scrollIntoView()` fait
     * défiler TOUS les ancêtres défilables, donc la page — on ouvrirait la page à quelques
     * centaines de pixels du haut sans que rien ne l'explique. D'où l'arithmétique.
     */
    expect(SOURCE).toContain('scrollLeft');
    expect(SOURCE).not.toContain('scrollIntoView');
  });
});
