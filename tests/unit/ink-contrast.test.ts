import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES DEUX ÉCHELLES D'ENCRE COMPTENT TROIS CRANS, ET LE PLUS FAIBLE EST LE PLANCHER.
 *
 * Elles étaient ASYMÉTRIQUES au seul endroit qui compte — le cran faible, celui qui
 * porte le plus de texte :
 *
 *     nuit   #ECF0F5 16,9:1   #A2ADBB 8,5:1   #77828F  4,95:1   ✓
 *     clair  #0E1116 18,9:1   #5A6472 6,0:1   #98A1AE  2,61:1   ✗
 *
 * Tout ce que le mode clair rendait en `--text-faint` passait donc sous 4,5:1 : méta de
 * leçon, poids de fichier, pieds de relevé, textes d'exemple. La livraison des tableaux
 * de bord a remonté le jeton à `#68727F` — 4,88:1 — et l'écart est porté par
 * `overrides/ad-25-encre-plancher.css`.
 *
 * ⚠️ POURQUOI UN TEST EN PLUS DE LA RÈGLE `ds:check`. Celle-ci compare le jeton à une
 * valeur ATTENDUE, écrite à la main : elle attrape un éclaircissement, mais elle ne sait
 * pas ce que la valeur VAUT. Si le kit relivrait une troisième teinte, il faudrait
 * mettre les deux à jour et rien ne dirait laquelle est juste. Ce test-ci calcule le
 * ratio : il reste vrai quelle que soit la valeur.
 *
 * Il lit la cascade réelle — jetons puis overrides, l'ordre de `styles.css` — parce que
 * c'est la valeur EFFECTIVE qui atteint l'écran, pas celle du kit.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CSS_DIR = resolve(__dirname, '../../src/design-system/css');

function channel(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Les feuilles, dans l'ordre de la cascade : jetons et marque, PUIS overrides. */
function sheets(): string[] {
  const read = (sub: string) =>
    readdirSync(join(CSS_DIR, sub))
      .filter((f) => f.endsWith('.css'))
      .sort()
      .map((f) => readFileSync(join(CSS_DIR, sub, f), 'utf8'));
  return [...read('tokens'), ...read('brand'), ...read('overrides')];
}

/**
 * Valeur effective d'un jeton dans une portée. On suit les BLOCS : `tokens/dark.css`
 * déclare la valeur nuit dans un `.dk{…}`, sur une ligne qui ne porte pas le sélecteur.
 */
function token(name: string, scope: 'light' | 'dark'): string | null {
  let value: string | null = null;
  for (const css of sheets()) {
    let night = false;
    for (const line of css.split('\n')) {
      if (/^\s*(\.dk|:root:not\(\[data-theme)/.test(line)) night = true;
      const m = line.match(new RegExp(`${name}\\s*:\\s*(#[0-9A-Fa-f]{6})`));
      if (m && (night ? scope === 'dark' : scope === 'light')) value = m[1];
      if (night && /^\s*\}/.test(line)) night = false;
    }
  }
  return value;
}

/** Les fonds de référence de chaque portée. */
const PAPER = '#FFFFFF';
const NIGHT = '#0B0E13';

describe('encre — le cran faible tient le plancher dans les deux portées', () => {
  it('trouve bien les jetons (sinon le test ne prouve rien)', () => {
    expect(token('--ink-3', 'light')).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(token('--ink-3', 'dark')).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('`--ink-3` clair tient 4,5:1 sur papier', () => {
    const hex = token('--ink-3', 'light')!;
    const r = ratio(hex, PAPER);
    expect(r, `--ink-3 clair = ${hex} → ${r.toFixed(2)}:1 sur blanc. C'est le PLANCHER : `
      + 'tout ce que `--text-faint` rend en mode clair passe par lui.').toBeGreaterThanOrEqual(4.5);
  });

  it('`--ink-3` nuit tient 4,5:1 sur le fond nuit', () => {
    const hex = token('--ink-3', 'dark')!;
    const r = ratio(hex, NIGHT);
    expect(r, `--ink-3 nuit = ${hex} → ${r.toFixed(2)}:1 sur ${NIGHT}.`).toBeGreaterThanOrEqual(4.5);
  });

  it('les deux échelles restent symétriques — moins d\'un cran d\'écart', () => {
    const light = ratio(token('--ink-3', 'light')!, PAPER);
    const dark = ratio(token('--ink-3', 'dark')!, NIGHT);
    expect(
      Math.abs(light - dark),
      `clair ${light.toFixed(2)}:1 contre nuit ${dark.toFixed(2)}:1 — c'est l'asymétrie qui `
      + 'avait laissé le mode clair sous le plancher pendant que la nuit le tenait.',
    ).toBeLessThan(1);
  });

  it('`--surface-ink` est INVARIANT entre les deux portées', () => {
    /* Une carte sombre sur page claire ouvre sa propre portée `.dk` : si son fond lisait
       un jeton thématique, il basculerait avec ses textes et la carte se peindrait en
       blanc cassé — titre à 1,00:1. */
    expect(token('--surface-ink', 'light')).toBe(token('--surface-ink', 'dark'));
  });

  it('`--ink-2` tient aussi, dans les deux portées', () => {
    expect(ratio(token('--ink-2', 'light')!, PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token('--ink-2', 'dark')!, NIGHT)).toBeGreaterThanOrEqual(4.5);
  });
});
