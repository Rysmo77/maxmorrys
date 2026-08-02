import { describe, expect, it } from 'vitest';

import { injectMeta } from '../src/prerender/rewriter';
import type { PageMeta } from '../src/prerender/types';

// Copie conforme de `index.html`. À resynchroniser si le shell change.
import shellHtml from './fixtures/shell.html?raw';

/**
 * Ces tests protègent la parité SEO du portage du prerender vers HTMLRewriter.
 *
 * Le risque de cette phase n'est pas une panne — c'est une balise perdue, qui ne
 * se voit nulle part et coûte du trafic organique pendant des semaines.
 */

const META: PageMeta = {
  title: 'Blog Marketing Digital — Articles et Conseils | Max-Morrys',
  description: 'Articles, analyses et conseils pratiques en marketing digital.',
  ogType: 'website',
  ogImage: 'https://media.maxmorrys.me/uploads/cover.jpg',
  canonical: 'https://maxmorrys.me/blog',
  h1: 'Blog Marketing Digital',
  bodyText: 'Premier paragraphe.\n\nSecond paragraphe.',
  lang: 'fr',
  altFr: 'https://maxmorrys.me/blog',
  altEn: 'https://maxmorrys.me/en/blog',
  breadcrumbs: [
    { name: 'Accueil', url: 'https://maxmorrys.me/' },
    { name: 'Blog', url: 'https://maxmorrys.me/blog' },
  ],
};

async function render(meta: PageMeta): Promise<string> {
  const shell = new Response(shellHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  return injectMeta(shell, meta).text();
}

function countOf(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

describe('injection des métadonnées par HTMLRewriter', () => {
  it('remplace le titre sans en laisser deux', async () => {
    const html = await render(META);
    expect(countOf(html, '<title>')).toBe(1);
    expect(html).toContain(`<title>${META.title}</title>`);
    expect(html).not.toContain('Max-Morrys | Maîtrisez le digital, accélérez votre croissance');
  });

  it('remplace les balises que la fonction actuelle retire', async () => {
    const html = await render(META);

    for (const tag of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) {
      expect(countOf(html, `property="${tag}"`), `${tag} dupliqué ou absent`).toBe(1);
    }
    for (const tag of ['twitter:title', 'twitter:description', 'twitter:image']) {
      expect(countOf(html, `name="${tag}"`), `${tag} dupliqué ou absent`).toBe(1);
    }
    expect(countOf(html, 'name="description"')).toBe(1);
    expect(html).toContain(`content="${META.ogImage}"`);
    // L'ancienne og:image (Firebase Storage) doit avoir disparu.
    expect(html).not.toContain('firebasestorage.googleapis.com');
  });

  it('laisse dupliquées les balises que la fonction actuelle ne retire pas', async () => {
    // `stripDefaultMeta` ne cible ni og:image:width/height, ni og:locale,
    // ni og:site_name, ni twitter:card/site : la production en sert donc deux
    // exemplaires. Un sélecteur `meta[property^="og:"]` casserait cette parité.
    const html = await render(META);
    for (const tag of ['og:image:width', 'og:image:height', 'og:locale', 'og:site_name']) {
      expect(countOf(html, `property="${tag}"`), `${tag} devrait rester dupliqué`).toBe(2);
    }
    expect(countOf(html, 'name="twitter:card"')).toBe(2);
    expect(countOf(html, 'name="twitter:site"')).toBe(2);
  });

  it('préserve les balises de vérification de propriété du domaine', async () => {
    // Les perdre coûterait Search Console et la vérification Meta.
    const html = await render(META);
    expect(html).toContain('name="google-site-verification"');
    expect(html).toContain('name="facebook-domain-verification"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('rel="manifest"');
  });

  it('pose canonical et les alternates hreflang', async () => {
    const html = await render(META);
    expect(countOf(html, 'rel="canonical"')).toBe(1);
    expect(html).toContain('<link rel="canonical" href="https://maxmorrys.me/blog" />');
    expect(html).toContain('hreflang="fr" href="https://maxmorrys.me/blog"');
    expect(html).toContain('hreflang="en" href="https://maxmorrys.me/en/blog"');
    expect(html).toContain('hreflang="x-default" href="https://maxmorrys.me/blog"');
  });

  it('injecte le corps SEO dans #root', async () => {
    const html = await render(META);
    expect(html).toContain('<div data-prerendered-seo="true">');
    expect(html).toContain('<h1>Blog Marketing Digital</h1>');
    expect(html).toContain('<p>Premier paragraphe.</p>');
    expect(html).toContain('<p>Second paragraphe.</p>');
    // Le div hydraté par React doit rester en place.
    expect(html).toContain('<div id="root">');
  });

  it('bascule l attribut lang en anglais', async () => {
    const html = await render({ ...META, lang: 'en' });
    expect(html).toContain('lang="en"');
    expect(html).toContain('content="en_US"');
  });

  it('ajoute robots noindex pour une route inconnue', async () => {
    const html = await render({ ...META, noIndex: true });
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
  });

  it('n injecte pas de corps SEO quand il n y a ni h1 ni texte', async () => {
    const html = await render({ ...META, h1: undefined, bodyText: undefined });
    expect(html).not.toContain('data-prerendered-seo');
    expect(html).toContain('<div id="root"></div>');
  });

  it('émet le JSON-LD du fil d Ariane', async () => {
    const html = await render(META);
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"position":1');
    // `<` échappé dans le JSON-LD, pour ne pas fermer le script.
    expect(html).not.toMatch(/<script type="application\/ld\+json">[^<]*<\/(?!script)/);
  });

  it('échappe les guillemets des attributs', async () => {
    const html = await render({ ...META, title: 'Titre "cité" & <balise>' });
    expect(html).toContain('<title>Titre &quot;cité&quot; &amp; &lt;balise&gt;</title>');
  });
});
