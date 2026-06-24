import { describe, it, expect } from 'vitest';
import {
  getLangFromPath,
  stripLangPrefix,
  localizedPath,
  toCanonicalPath,
  intlLocale,
  ogLocale,
} from '../../src/i18n/routing';
import { localizeSegments, canonicalizeSegments } from '../../src/i18n/segments';

describe('getLangFromPath', () => {
  it('détecte le français par défaut', () => {
    expect(getLangFromPath('/')).toBe('fr');
    expect(getLangFromPath('/formations')).toBe('fr');
    expect(getLangFromPath('/endroit')).toBe('fr'); // ne confond pas /en avec /endroit
  });
  it('détecte l\'anglais sous /en', () => {
    expect(getLangFromPath('/en')).toBe('en');
    expect(getLangFromPath('/en/formations')).toBe('en');
  });
});

describe('stripLangPrefix', () => {
  it('retire le préfixe /en', () => {
    expect(stripLangPrefix('/en')).toBe('/');
    expect(stripLangPrefix('/en/formations')).toBe('/formations');
    expect(stripLangPrefix('/en/blog/mon-article')).toBe('/blog/mon-article');
  });
  it('laisse les chemins fr inchangés', () => {
    expect(stripLangPrefix('/')).toBe('/');
    expect(stripLangPrefix('/formations')).toBe('/formations');
    expect(stripLangPrefix('/endroit')).toBe('/endroit');
  });
});

describe('localizedPath (préfixe, segment identique /blog)', () => {
  it('préfixe pour l\'anglais', () => {
    expect(localizedPath('/', 'en')).toBe('/en');
    expect(localizedPath('/blog', 'en')).toBe('/en/blog');
  });
  it('retire le préfixe pour le français', () => {
    expect(localizedPath('/en/blog', 'fr')).toBe('/blog');
    expect(localizedPath('/en', 'fr')).toBe('/');
  });
  it('est idempotent (pas de double préfixe)', () => {
    expect(localizedPath('/en/blog', 'en')).toBe('/en/blog');
    expect(localizedPath('/blog', 'fr')).toBe('/blog');
  });
});

describe('localizeSegments / canonicalizeSegments', () => {
  it('traduit les segments connus vers EN', () => {
    expect(localizeSegments('/formations', 'en')).toBe('/courses');
    expect(localizeSegments('/a-propos', 'en')).toBe('/about');
    expect(localizeSegments('/legal/mentions-legales', 'en')).toBe('/legal/legal-notice');
    expect(localizeSegments('/mon-espace/tableau-de-bord', 'en')).toBe('/my-space/dashboard');
  });
  it('ne traduit pas les params ni les slugs inconnus', () => {
    expect(localizeSegments('/formations/:slug', 'en')).toBe('/courses/:slug');
    expect(localizeSegments('/blog/mon-article-fr', 'en')).toBe('/blog/mon-article-fr');
  });
  it('FR = identité', () => {
    expect(localizeSegments('/formations', 'fr')).toBe('/formations');
  });
  it('pas de collision formations vs cours (player)', () => {
    expect(localizeSegments('/formations/:slug', 'en')).toBe('/courses/:slug');
    expect(localizeSegments('/cours/:slug', 'en')).toBe('/learn/:slug');
  });
  it('remappe EN -> FR', () => {
    expect(canonicalizeSegments('/courses')).toBe('/formations');
    expect(canonicalizeSegments('/learn/some-slug')).toBe('/cours/some-slug');
    expect(canonicalizeSegments('/my-space/settings')).toBe('/mon-espace/parametres');
  });
});

describe('toCanonicalPath', () => {
  it('renvoie le chemin FR canonique depuis une URL EN', () => {
    expect(toCanonicalPath('/en/courses')).toBe('/formations');
    expect(toCanonicalPath('/en/about')).toBe('/a-propos');
    expect(toCanonicalPath('/en/my-space/settings')).toBe('/mon-espace/parametres');
  });
  it('laisse les chemins FR inchangés', () => {
    expect(toCanonicalPath('/formations')).toBe('/formations');
    expect(toCanonicalPath('/')).toBe('/');
  });
});

describe('localizedPath avec segments', () => {
  it('FR -> EN traduit segment + préfixe', () => {
    expect(localizedPath('/formations', 'en')).toBe('/en/courses');
    expect(localizedPath('/a-propos', 'en')).toBe('/en/about');
    expect(localizedPath('/', 'en')).toBe('/en');
  });
  it('EN -> FR retire préfixe + remappe', () => {
    expect(localizedPath('/en/courses', 'fr')).toBe('/formations');
    expect(localizedPath('/en/my-space/settings', 'fr')).toBe('/mon-espace/parametres');
  });
  it('idempotent même langue', () => {
    expect(localizedPath('/en/courses', 'en')).toBe('/en/courses');
    expect(localizedPath('/formations', 'fr')).toBe('/formations');
  });
});

describe('locales Intl / OG', () => {
  it('renvoie les bonnes locales', () => {
    expect(intlLocale('fr')).toBe('fr-FR');
    expect(intlLocale('en')).toBe('en-US');
    expect(ogLocale('fr')).toBe('fr_FR');
    expect(ogLocale('en')).toBe('en_US');
  });
});
