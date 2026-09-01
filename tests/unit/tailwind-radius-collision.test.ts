import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import config from '../../tailwind.config.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA PORTE QUI MANQUAIT — un jeton ne peut pas reprendre un suffixe que Tailwind
 * se réserve.
 *
 * Le défaut trouvé le 01/09/2026 : `borderRadius` déclarait un jeton `s`, et Tailwind
 * génère depuis la 3.3 des utilitaires DIRECTIONNELS `rounded-s` / `rounded-e`
 * (logiques) et `rounded-t/r/b/l`. Les deux règles sortaient pour la même classe, et
 * la directionnelle — émise en second — gagnait :
 *
 *     .rounded-s { border-radius: var(--r-s) }              ← 10 px sur 4 coins
 *     .rounded-s { border-start-start-radius: .25rem;
 *                  border-end-start-radius:   .25rem }      ← 4 px sur 2 coins ✔
 *
 * Seize classes du dépôt rendaient donc autre chose que ce qu'elles annonçaient.
 *
 * POURQUOI AUCUN CONTRÔLE NE LE VOYAIT. La classe existe, le typecheck passe, la
 * build passe, et `ds:check` rendait « 0 constat » — parce qu'il valide les SOURCES
 * du design system et leur copie littérale, jamais le CSS que Tailwind GÉNÈRE. Un
 * défaut qui naît à la compilation est invisible pour un vérificateur de sources.
 *
 * Ce test comble exactement ce trou : il compile la vraie configuration et regarde
 * ce qui SORT.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Les suffixes que le greffon `borderRadius` de Tailwind émet lui-même.
 * Un jeton qui reprend l'un d'eux produit deux règles pour une seule classe.
 */
const RESERVED = [
  's', 'e',                          // logiques : start, end
  't', 'r', 'b', 'l',                // physiques : top, right, bottom, left
  'ss', 'se', 'es', 'ee',            // coins logiques
  'tl', 'tr', 'br', 'bl',            // coins physiques
];

type RadiusScale = Record<string, string>;
const radius = (config.theme?.extend?.borderRadius ?? {}) as RadiusScale;
const keys = Object.keys(radius);

describe('borderRadius — aucun jeton ne reprend un suffixe réservé', () => {
  it('déclare au moins un jeton (sinon le test ne prouve rien)', () => {
    expect(keys.length).toBeGreaterThan(0);
  });

  it.each(keys)('« %s » n\'est pas un suffixe directionnel de Tailwind', (key) => {
    expect(RESERVED).not.toContain(key);
  });
});

describe('borderRadius — le CSS produit ne contient aucune règle en double', () => {
  /**
   * Le contrôle structurel ci-dessus repose sur une liste écrite à la main ; celui-ci
   * ne suppose rien et lit la sortie réelle. Si une version de Tailwind ajoute un
   * suffixe, c'est ce test-ci qui le dira.
   */
  it('émet exactement une règle par jeton', async () => {
    const probe = keys.map((k) => `rounded-${k}`).join(' ');

    const result = await postcss([
      tailwindcss({
        ...config,
        // On ne scanne pas `src/` : la sonde suffit, et le test reste rapide.
        content: [{ raw: probe, extension: 'html' }],
        corePlugins: { preflight: false },
      }),
    ]).process('@tailwind utilities;', { from: undefined });

    for (const key of keys) {
      const rules = result.css.match(
        new RegExp(`\\.rounded-${key.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*\\{[^}]*\\}`, 'g'),
      ) ?? [];

      expect(
        rules.length,
        `.rounded-${key} est émis ${rules.length} fois :\n${rules.join('\n')}\n\n`
        + 'Deux règles pour une même classe = la seconde gagne, et le jeton ne rend '
        + 'plus ce qu\'il déclare. Renommer le jeton (voir tailwind.config.js).',
      ).toBe(1);
    }
  }, 30_000);

  it('rend bien la variable du kit, et pas une valeur en dur', async () => {
    const result = await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: 'rounded-xs rounded-m rounded-xl rounded-pill', extension: 'html' }],
        corePlugins: { preflight: false },
      }),
    ]).process('@tailwind utilities;', { from: undefined });

    /* La sortie de PostCSS n'est pas minifiée : on compare sur une forme compacte,
       sinon l'assertion dépend de l'indentation du générateur. */
    const compact = result.css.replace(/\s+/g, '');

    expect(compact).toContain('.rounded-xs{border-radius:var(--r-s)}');
    expect(compact).toContain('.rounded-m{border-radius:var(--r-m)}');
    expect(compact).toContain('.rounded-xl{border-radius:var(--r-xl)}');
    expect(compact).toContain('.rounded-pill{border-radius:var(--r-pill)}');
  }, 30_000);
});
