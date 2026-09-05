import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE SHELL PARLE AUX ROBOTS SUR TOUTES LES ROUTES QUE LE WORKER NE PRÉREND PAS.
 *
 * `index.html` a longtemps eu l'air inoffensif : le Worker retire ses balises et les
 * remplace (`prerender/rewriter.ts`), donc leurs erreurs semblaient sans effet. Elles ne
 * l'étaient pas — `/connexion`, `/inscription`, les devis et l'attrape-tout partent à
 * l'origine SANS pré-rendu, et c'est ce fichier-ci que les crawlers y lisent.
 *
 * Trois divergences y vivaient, chacune invisible :
 *
 *   · `og:title` disait « Maîtrisez le digital » quand `<title>` dit « Maîtrise… ». Le
 *     passage au tutoiement n'avait pas atteint les balises de partage — et la garde de
 *     voix ne pouvait pas le voir : elle ne lit que `src/i18n/locales/fr`, et ne cherche
 *     que les pronoms de politesse, jamais une forme verbale.
 *   · `og:image:width/height` annonçait 1200×630 pour une image mesurée à 1500×1000.
 *   · `theme-color` valait `#0c93e7`, une teinte qui n'existe NULLE PART dans le kit,
 *     pendant que le manifeste posait `#0057BC` — deux couleurs de barre système pour
 *     une seule marque, selon que le navigateur lit l'une ou l'autre source.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const root = join(__dirname, '..', '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

function meta(attribut: string, nom: string): string | null {
  const m = html.match(
    new RegExp(`<meta[^>]+${attribut}="${nom}"[^>]+content="([^"]*)"`, 'i'),
  );
  return m ? m[1] : null;
}

const titre = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;

describe('index.html — une seule voix pour la même page', () => {
  it('le relevé trouve bien les balises (sinon le test ne prouve rien)', () => {
    expect(titre).toBeTruthy();
    expect(meta('property', 'og:title')).toBeTruthy();
    expect(meta('name', 'description')).toBeTruthy();
  });

  it('og:title et twitter:title disent ce que dit <title>', () => {
    expect(meta('property', 'og:title')).toBe(titre);
    expect(meta('name', 'twitter:title')).toBe(titre);
  });

  it('og:description et twitter:description disent ce que dit la description', () => {
    const description = meta('name', 'description');
    expect(meta('property', 'og:description')).toBe(description);
    expect(meta('name', 'twitter:description')).toBe(description);
  });
});

describe('index.html — les valeurs mesurées et les valeurs du kit', () => {
  it('les dimensions annoncées sont celles que le Worker a mesurées', () => {
    // Une dimension fausse fait recadrer l'aperçu par la plateforme, ou l'ignorer.
    const constants = readFileSync(
      join(root, 'worker/apps/site/src/constants.ts'),
      'utf8',
    );
    const largeur = constants.match(/DEFAULT_OG_IMAGE_WIDTH\s*=\s*(\d+)/)?.[1];
    const hauteur = constants.match(/DEFAULT_OG_IMAGE_HEIGHT\s*=\s*(\d+)/)?.[1];
    expect(largeur, 'DEFAULT_OG_IMAGE_WIDTH introuvable').toBeTruthy();

    expect(meta('property', 'og:image:width')).toBe(largeur);
    expect(meta('property', 'og:image:height')).toBe(hauteur);
  });

  it('la couleur de thème est celle du manifeste, et c’est une teinte du kit', () => {
    const manifest = JSON.parse(
      readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8'),
    ) as { theme_color: string };
    const themeColor = meta('name', 'theme-color');

    expect(themeColor?.toUpperCase()).toBe(manifest.theme_color.toUpperCase());

    // Et la teinte doit exister dans le système, pas seulement concorder avec elle-même.
    const tokens = readFileSync(
      join(root, 'src/design-system/tokens.generated.ts'),
      'utf8',
    );
    expect(
      tokens.toUpperCase().includes(themeColor!.toUpperCase()),
      `${themeColor} n'est aucune couleur du kit`,
    ).toBe(true);
  });
});
