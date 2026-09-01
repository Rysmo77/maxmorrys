import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'URL DES FONTES EST ÉCRITE À DEUX ENDROITS, ET C'EST VOULU.
 *
 * · `src/design-system/css/tokens/fonts.css` — copie LITTÉRALE du kit (AD-1), avec son
 *   `@import`. On n'y touche pas : `ds:sync` la régénère, et `ds:check` échoue si elle
 *   s'écarte du kit d'un octet.
 * · `index.html` — la même URL en `<link rel="preload">`, pour que la requête parte dès
 *   l'analyse du HTML au lieu d'attendre que `index.css` soit téléchargé puis analysé.
 *
 * LA DUPLICATION EST LE MÉCANISME, PAS LE DÉFAUT : le navigateur ne déduplique la
 * requête que si les deux URL sont identiques **au caractère près**. Une différence
 * d'ordre de paramètres, une graisse en plus, un `display=swap` oublié — et le produit
 * télécharge DEUX feuilles Google au lieu d'une, ce qui est pire que de n'en précharger
 * aucune.
 *
 * Ce test est donc la contrepartie obligatoire de la duplication. Sans lui, la seule
 * chose qui maintenait les deux alignées était l'attention de qui édite.
 *
 * Il attrape aussi la régression d'origine : `index.html` chargeait **Inter**, que plus
 * aucune règle du dépôt ne référence, pendant que le kit déclarait trois autres familles.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const root = resolve(__dirname, '../..');
const fontsCss = readFileSync(resolve(root, 'src/design-system/css/tokens/fonts.css'), 'utf8');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');

/** L'URL telle que le kit l'écrit, dans son `@import`. */
function kitUrl(): string {
  const m = fontsCss.match(/@import\s+url\(["']([^"']+)["']\)/);
  if (!m) throw new Error("tokens/fonts.css ne contient plus d'@import de fonte");
  return m[1];
}

/** Les URL de fonte déclarées dans le HTML, `&amp;` redécodé. */
function htmlFontUrls(): string[] {
  return [...indexHtml.matchAll(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/g)]
    .map((m) => m[1].replace(/&amp;/g, '&'));
}

describe('fontes — le HTML et le kit chargent exactement la même feuille', () => {
  it('le kit déclare bien une URL de fonte', () => {
    expect(kitUrl()).toContain('fonts.googleapis.com/css2');
  });

  it('le HTML en déclare au moins une', () => {
    expect(htmlFontUrls().length).toBeGreaterThan(0);
  });

  it('chaque URL du HTML est identique à celle du kit, au caractère près', () => {
    const expected = kitUrl();
    for (const url of htmlFontUrls()) {
      expect(
        url,
        'Le navigateur ne déduplique que sur une URL identique. Une divergence fait '
        + 'télécharger deux feuilles au lieu d\'une.',
      ).toBe(expected);
    }
  });

  it('ne charge aucune famille absente des jetons du kit', () => {
    /* Les familles réellement déclarées par le kit, extraites de ses variables. */
    const declared = [...fontsCss.matchAll(/--f-[a-z]+:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(declared.length).toBeGreaterThan(0);

    for (const url of htmlFontUrls()) {
      for (const family of [...url.matchAll(/family=([^:&]+)/g)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, ' '))) {
        expect(
          declared,
          `Le HTML charge « ${family} », qu'aucune variable --f-* du kit ne référence. `
          + "C'est une requête bloquante pour zéro pixel rendu.",
        ).toContain(family);
      }
    }
  });
});
