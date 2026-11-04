import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { filtrerLiensRysmo, jugerLien, PAGES_PUBLIQUES } from '../src/lib/rysmo-liens';

/**
 * Le filtre des liens de Rysmo. Les cas viennent du test à l'aveugle du 01/11/2026 :
 * Gemini y a inventé `/club/adhesion` et une adresse de leçon sur edu.maxmorrys.me, que
 * l'ancien filtre laissait passer ou TRONQUAIT en une autre adresse fausse.
 */

const SLUG_CM = 'devenir-community-manager-freelance-en-afrique';
const CATALOGUE = new Set([
  `/formations/${SLUG_CM}`,
  '/blog/seo-local-marketing-digital-senegal-cote-divoire',
]);

describe('les pages publiques reconnues', () => {
  it('sont toutes des pages réelles du Worker site (static-pages.ts), plus connexion et inscription', () => {
    const source = readFileSync(resolve(__dirname, '../../site/src/prerender/static-pages.ts'), 'utf8');
    const cles = new Set([...source.matchAll(/^ {2}'(\/[^']*)': \{/gm)].map((m) => m[1]));
    expect(cles.size).toBeGreaterThan(20);
    for (const page of PAGES_PUBLIQUES) {
      if (page === '/connexion' || page === '/inscription') continue;
      expect(cles, page).toContain(page);
    }
  });
});

describe('filtrerLiensRysmo', () => {
  it('Q7 : `/club/adhesion` inventé perd son URL, le texte reste', () => {
    expect(filtrerLiensRysmo("Tu peux t'inscrire ici : [Adhésion au Club des Digitos](/club/adhesion).", CATALOGUE))
      .toBe("Tu peux t'inscrire ici : Adhésion au Club des Digitos.");
  });

  it('Q4 : une adresse de leçon inventée sur edu. est retirée en entier, jamais tronquée', () => {
    const r = filtrerLiensRysmo(
      `lire la leçon [Créer sa fiche](https://edu.maxmorrys.me/formations/${SLUG_CM}/module-2/lecon-2-3) ce soir.`,
      CATALOGUE,
    );
    expect(r).toBe('lire la leçon Créer sa fiche ce soir.');
  });

  it('une URL nue inventée disparaît sans laisser de morceau', () => {
    const r = filtrerLiensRysmo('Va sur https://edu.maxmorrys.me/module-2/lecon-2-3. Bon courage !', CATALOGUE);
    expect(r).toBe('Va sur. Bon courage !');
    expect(r).not.toMatch(/maxmorrys|module|lecon/);
    const r2 = filtrerLiensRysmo(`Voir https://edu.maxmorrys.me/formations/${SLUG_CM}/module-2/lecon-2-3 maintenant`, CATALOGUE);
    expect(r2).toBe('Voir maintenant');
  });

  it("garde les vraies adresses : adhésion du Club, formation du catalogue, pages de la base", () => {
    expect(filtrerLiensRysmo('Adhésion : club.maxmorrys.me/adhesion.', CATALOGUE)).toBe('Adhésion : club.maxmorrys.me/adhesion.');
    expect(filtrerLiensRysmo(`[La formation](https://edu.maxmorrys.me/formations/${SLUG_CM})`, CATALOGUE))
      .toBe(`[La formation](https://edu.maxmorrys.me/formations/${SLUG_CM})`);
    expect(filtrerLiensRysmo(`[La formation](/formations/${SLUG_CM})`, CATALOGUE)).toBe(`[La formation](/formations/${SLUG_CM})`);
    expect(filtrerLiensRysmo('[CGV, article 6](https://maxmorrys.me/legal/cgv)', CATALOGUE)).toBe('[CGV, article 6](https://maxmorrys.me/legal/cgv)');
    expect(filtrerLiensRysmo('Rysmo vit sur edu.maxmorrys.me/assistant !', CATALOGUE)).toBe('Rysmo vit sur edu.maxmorrys.me/assistant !');
    expect(filtrerLiensRysmo('[Contact](/contact)', CATALOGUE)).toBe('[Contact](/contact)');
  });

  it("réécrit une adresse réelle mais mal placée vers son sous-domaine public", () => {
    expect(filtrerLiensRysmo('[Adhérer](https://maxmorrys.me/club-des-digitos/adhesion)', CATALOGUE))
      .toBe('[Adhérer](https://club.maxmorrys.me/adhesion)');
    expect(filtrerLiensRysmo(`[F](https://www.maxmorrys.me/formations/${SLUG_CM})`, CATALOGUE))
      .toBe(`[F](https://edu.maxmorrys.me/formations/${SLUG_CM})`);
  });

  it('une formation ou un article hors catalogue perd son URL (relative ou absolue)', () => {
    expect(filtrerLiensRysmo('[Formation SEO](/formations/seo-avance)', CATALOGUE)).toBe('Formation SEO');
    expect(filtrerLiensRysmo('[SEO](https://edu.maxmorrys.me/formations/seo-avance)', CATALOGUE)).toBe('SEO');
    expect(filtrerLiensRysmo('Lis /blog/article-invente et reviens', CATALOGUE)).toBe('Lis et reviens');
    expect(filtrerLiensRysmo('Lis /blog/seo-local-marketing-digital-senegal-cote-divoire !', CATALOGUE))
      .toBe('Lis /blog/seo-local-marketing-digital-senegal-cote-divoire !');
  });

  it('les sous-domaines sans pages (media., api.) ne sont jamais conservés', () => {
    expect(filtrerLiensRysmo('[Vidéo](https://media.maxmorrys.me/x.mp4)', CATALOGUE)).toBe('Vidéo');
  });

  it("ne touche ni aux liens externes, ni aux e-mails, ni à la typographie française", () => {
    const texte = 'Va sur [Google Business](https://business.google.com) ou écris à hello@maxmorrys.me : on te répond !';
    expect(filtrerLiensRysmo(texte, CATALOGUE)).toBe(texte);
    expect(jugerLien('https://business.google.com', CATALOGUE)).toBeNull();
  });

  it('garde l’indentation des listes', () => {
    const texte = '1. Étape\n   - détail\n2. Suite';
    expect(filtrerLiensRysmo(texte, CATALOGUE)).toBe(texte);
  });
});
