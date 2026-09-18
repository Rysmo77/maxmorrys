import { describe, expect, it } from 'vitest';

import { normalizePath, resolveRoute, shouldNoIndex } from '../src/routes';

/**
 * Ces attentes ont été relevées sur la production avant le portage, en
 * interrogeant `maxmorrys.me` avec un user-agent de crawler. Elles figent le
 * comportement des rewrites Firebase, y compris ses irrégularités.
 */
describe('routage — miroir des rewrites Firebase', () => {
  it('achemine les flux SEO', () => {
    expect(resolveRoute('/sitemap.xml')).toBe('sitemap');
    expect(resolveRoute('/rss.xml')).toBe('rss');
    expect(resolveRoute('/catalog.csv')).toBe('catalog');
  });

  it('prerend les pages statiques déclarées', () => {
    for (const path of ['/', '/blog', '/formations', '/podcasts', '/videos', '/faq', '/a-propos', '/contact']) {
      expect(resolveRoute(path), path).toBe('prerender');
    }
  });

  it('prerend les équivalents anglais', () => {
    for (const path of ['/en', '/en/blog', '/en/courses', '/en/podcasts', '/en/videos', '/en/faq', '/en/about', '/en/contact']) {
      expect(resolveRoute(path), path).toBe('prerender');
    }
  });

  /*
   * LES PAGES NEUVES N'EXISTENT POUR LES MOTEURS QUE PARCE QU'ELLES SONT ICI.
   *
   * `SEOHead.tsx` écrit après hydratation, dans un DOM qu'aucun robot social ne construit
   * et que Googlebot ne voit qu'au second passage. Une route de la refonte absente de
   * cette table n'est pas « moins bien référencée » : elle est servie sous le titre, la
   * description et l'`og:url` de la page d'accueil — c'est-à-dire en doublon contre `/`.
   */
  it('prerend les cinq routes de la refonte, et leurs jumelles anglaises', () => {
    for (const path of [
      '/conception',
      '/conception/commerces-et-tpe',
      '/conception/projets-sur-mesure',
      '/conception/realisations',
      '/apprendre',
      '/en/design',
      '/en/design/shops-and-small-business',
      '/en/design/custom-projects',
      '/en/design/work',
      '/en/learning',
    ]) {
      expect(resolveRoute(path), path).toBe('prerender');
    }
  });

  it('prerend une fiche de réalisation, dans les deux langues', () => {
    expect(resolveRoute('/conception/realisations/une-plateforme')).toBe('prerender');
    expect(resolveRoute('/en/design/work/a-platform')).toBe('prerender');
  });

  /*
   * ⚠️ LE PIÈGE DU LOT, ET IL EST SILENCIEUX.
   *
   * `resolveRoute` décide AVANT tout relais vers l'origine. Tant que `/agence` figurait
   * dans `PRERENDER_EXACT`, le Worker servait la page et la 301 déclarée dans
   * `firebase.json` n'était jamais lue : les deux fichiers auraient été justes séparément,
   * et la redirection obligatoire du CDC n'aurait existé pour personne.
   */
  it('ne prerend plus les deux adresses devenues des 301', () => {
    for (const path of ['/agence', '/presence-digitale', '/en/agency', '/en/local-presence']) {
      expect(resolveRoute(path), `${path} est prérendue : sa 301 ne partira jamais`).toBe('origin');
    }
  });

  it('prerend les pages de contenu, à toute profondeur', () => {
    expect(resolveRoute('/blog/mon-article')).toBe('prerender');
    expect(resolveRoute('/formations/tunnel-de-vente')).toBe('prerender');
    expect(resolveRoute('/en/courses/sales-funnel')).toBe('prerender');
    // `**` traverse les slashes : vérifié sur /blog/x/y en production.
    expect(resolveRoute('/blog/x/y')).toBe('prerender');
  });

  it('tolère le slash final, comme le glob Firebase', () => {
    expect(resolveRoute('/blog/')).toBe('prerender');
    expect(resolveRoute('/en/')).toBe('prerender');
    expect(resolveRoute('/legal/')).toBe('prerender');
  });

  it('laisse /legal à l origine — seul /legal/** est déclaré', () => {
    expect(resolveRoute('/legal')).toBe('origin');
    expect(resolveRoute('/legal/mentions-legales')).toBe('prerender');
  });

  it('est sensible à la casse, comme les rewrites', () => {
    expect(resolveRoute('/EN/blog')).toBe('origin');
    expect(resolveRoute('/Blog')).toBe('origin');
  });

  it('laisse à l origine tout ce qui n est pas déclaré', () => {
    for (const path of ['/mon-espace', '/connexion', '/admin/articles', '/assets/index-a1b2.js', '/manifest.webmanifest']) {
      expect(resolveRoute(path), path).toBe('origin');
    }
  });

  it('normalise les slashes finaux en préservant la racine', () => {
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('//')).toBe('/');
    expect(normalizePath('/blog//')).toBe('/blog');
    expect(normalizePath('/blog')).toBe('/blog');
  });
});

/**
 * CE QUI PART À L'ORIGINE SANS PRÉ-RENDU PORTE LES MÉTADONNÉES DE L'ACCUEIL.
 *
 * Relevé sur la production en se présentant comme `facebookexternalhit` :
 * `/connexion` répondait avec le `<title>` et l'`og:url` de `/`, sans canonical ni
 * robots. Le `noIndex` posé par `SEOHead` n'existe qu'après hydratation — donc pour
 * personne. Plusieurs URL présentaient ainsi aux moteurs l'identité de la page d'accueil.
 */
describe('shouldNoIndex', () => {
  it('couvre les pages d authentification, dans les deux langues', () => {
    for (const path of [
      '/connexion',
      '/inscription',
      '/mot-de-passe-oublie',
      '/en/sign-in',
      '/en/signup',
      '/en/forgot-password',
    ]) {
      expect(shouldNoIndex(path), path).toBe(true);
    }
  });

  it('couvre les devis, qui portent une référence client dans l URL', () => {
    expect(shouldNoIndex('/conception/commerces-et-tpe/devis/ABC123')).toBe(true);
    expect(shouldNoIndex('/en/design/shops-and-small-business/quote/ABC123')).toBe(true);
    // Les deux anciennes adresses restent couvertes : elles sont redirigées AUJOURD'HUI,
    // mais retirer la route Cloudflare les rend à nouveau servies par l'hébergement.
    expect(shouldNoIndex('/presence-digitale/devis/ABC123')).toBe(true);
    expect(shouldNoIndex('/en/local-presence/quote/ABC123')).toBe(true);
  });

  it('ne touche à aucune page publique', () => {
    for (const path of [
      '/',
      '/blog',
      '/formations',
      '/conception',
      '/conception/commerces-et-tpe',
      '/conception/projets-sur-mesure',
      '/conception/realisations',
      '/apprendre',
      '/en',
      '/en/design',
      '/en/learning',
      '/faq',
    ]) {
      expect(shouldNoIndex(path), path).toBe(false);
    }
  });

  it('n attrape pas une page dont le nom commence comme un devis', () => {
    // `/conception/commerces-et-tpe` est publique et vendeuse : la confondre avec un devis
    // la ferait désindexer, ce qui est exactement l'inverse du but.
    expect(shouldNoIndex('/conception/commerces-et-tpe')).toBe(false);
    expect(shouldNoIndex('/conception/commerces-et-tpe/devis')).toBe(false);
  });

  it('tolère le slash final, comme le reste du routage', () => {
    expect(shouldNoIndex('/connexion/')).toBe(true);
  });

  it('laisse les chemins déjà interdits par robots.txt hors de la liste', () => {
    // Un chemin dont l'exploration est interdite n'est jamais récupéré : son en-tête
    // ne serait jamais lu. L'y ajouter donnerait l'illusion d'une protection de plus.
    for (const path of ['/admin', '/mon-espace', '/checkout', '/paiement', '/403']) {
      expect(shouldNoIndex(path), path).toBe(false);
    }
  });
});
