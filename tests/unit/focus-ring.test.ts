import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ANNEAU DE FOCUS EST CELUI DU SYSTÈME, ET IL N'Y EN A PAS D'AUTRE.
 *
 * `brand/states.css` déclare l'anneau une fois pour tout le produit :
 *
 *     :where(a, button, input, textarea, select, summary, [tabindex]):focus-visible {
 *       outline: none;
 *       box-shadow: 0 0 0 2px var(--surface-page), 0 0 0 4px var(--mm-bleu);
 *     }
 *
 * Double anneau — un clair, un de marque — pour rester lisible sur n'importe quel fond,
 * verre et dégradé compris, avec sa variante nuit sous `.dk`.
 *
 * ⚠️ CE SÉLECTEUR EST EN `:where()`, DONC À SPÉCIFICITÉ ZÉRO. C'est délibéré — il ne doit
 * jamais gagner contre un composant qui a une bonne raison de faire autrement — mais ça
 * veut dire que **n'importe quelle classe le bat**. Une seule utilitaire suffit :
 * `focus:ring-2` pose un `box-shadow` et remplace l'anneau du système par celui de
 * Tailwind, `rgb(59 130 246 / .5)` — une couleur qui n'existe dans aucun jeton et qui ne
 * bascule pas sous `.dk`.
 *
 * Vingt-six sites le faisaient au 01/09/2026, dont seize avec `focus:` et non
 * `focus-visible:` : l'anneau apparaissait donc aussi **au clic souris**, ce que le
 * système évite exprès.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES DEUX SEULES RÉPONSES ADMISES
 *
 * 1. **Ne rien écrire.** L'élément est un `a`, `button`, `input`, `textarea`, `select`,
 *    `summary` ou porte `tabindex` → l'anneau s'applique tout seul, dans les deux thèmes.
 * 2. **`mm-on-color`** quand le fond est coloré ou sombre en permanence (popup en
 *    `--night-2`, bouton en aplat de marque) : le kit y passe l'anneau en blanc doublé
 *    d'encre. À poser sur un PARENT pour les champs — la règle ne vise l'élément
 *    lui-même que pour `button` et `a`.
 *
 * `focus-within:ring-*` tombe sous la même interdiction : le système n'a pas de recette
 * d'anneau de groupe, et un anneau de conteneur doublait celui de l'élément focalisé à
 * l'intérieur — deux cercles concentriques qui ne disent rien de plus qu'un seul. Un
 * changement de bordure marque le groupe sans entrer en concurrence.
 *
 * ⚠️ ET LE NOM DE LA CLASSE NE S'ÉCRIT PAS DANS UN COMMENTAIRE DE `src/`. Le scanner de
 * Tailwind ne lit pas les commentaires : il extrait toute chaîne qui ressemble à une
 * classe, y compris celle qu'on cite pour expliquer qu'on l'a RETIRÉE — et la règle
 * revient dans le bundle, morte mais présente. C'est pourquoi ce test dépouille les
 * commentaires avant de chercher : il vise les usages, pas les explications.
 *
 * Ce test interdit la troisième voie.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SRC = resolve(__dirname, '../../src');

/** Les utilitaires qui posent un `box-shadow` au focus, donc écrasent l'anneau. */
const BANNED = /\bfocus(?:-visible|-within)?:(?:ring|shadow)-[A-Za-z0-9/[\]().,_%#-]+/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.tsx') || full.endsWith('.ts') ? [full] : [];
  });
}

/** Retire commentaires de bloc et de ligne : plusieurs en CITENT un, pour l'expliquer. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('focus — aucun anneau concurrent de celui du système', () => {
  const offenders: string[] = [];

  for (const file of walk(SRC)) {
    for (const hit of stripComments(readFileSync(file, 'utf8')).match(BANNED) ?? []) {
      offenders.push(`${relative(SRC, file)} → ${hit}`);
    }
  }

  it('ne trouve aucun focus:ring-* ni focus:shadow-* dans src/', () => {
    expect(
      offenders,
      'Ces classes posent un box-shadow au focus et battent l\'anneau du système '
      + '(déclaré en :where(), donc à spécificité zéro). Deux réponses seulement : '
      + 'ne rien écrire, ou `mm-on-color` sur fond coloré. Voir brand/states.css.\n\n'
      + offenders.join('\n'),
    ).toEqual([]);
  });
});

describe('focus — la recette du kit est toujours en place', () => {
  const states = readFileSync(
    resolve(__dirname, '../../src/design-system/css/brand/states.css'),
    'utf8',
  );

  it('déclare l\'anneau sur :focus-visible, jamais sur :focus', () => {
    expect(states).toContain(':focus-visible');
    /* `:focus` nu poserait l'anneau au clic souris. Le kit s'en garde ; si une
       resynchronisation le réintroduisait, ce test le dirait. */
    expect(states).not.toMatch(/:where\([^)]*\):focus\s*\{/);
  });

  it('fournit la variante pour fond coloré', () => {
    expect(states).toContain('mm-on-color');
  });

  it('double l\'anneau, pour rester visible sur n\'importe quel fond', () => {
    expect(states).toMatch(/box-shadow:\s*0 0 0 2px[^;]*,\s*0 0 0 4px/);
  });
});
