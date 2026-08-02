import { describe, expect, it } from 'vitest';

import { normalizePath, resolveRoute } from '../src/routes';

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
    for (const path of ['/', '/blog', '/formations', '/podcasts', '/videos', '/faq', '/a-propos', '/contact', '/agence']) {
      expect(resolveRoute(path), path).toBe('prerender');
    }
  });

  it('prerend les équivalents anglais', () => {
    for (const path of ['/en', '/en/blog', '/en/courses', '/en/podcasts', '/en/videos', '/en/faq', '/en/about', '/en/contact', '/en/agency']) {
      expect(resolveRoute(path), path).toBe('prerender');
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
