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
    expect(html).not.toContain('Max-Morrys | Maîtrise le digital, accélère ta croissance');
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

  /*
   * CES SIX BALISES SORTAIENT EN DOUBLE, ET LE TEST L'EXIGEAIT.
   *
   * C'était juste : le portage se jugeait sur sa fidélité à la Cloud Function, qui laissait
   * le shell et réinjectait une seconde copie. Le portage est fait et servi ; la fidélité
   * n'est plus le critère, la justesse l'est. Le test dit donc maintenant l'inverse.
   */
  it('ne laisse plus aucune balise en double', async () => {
    const html = await render(META);
    for (const tag of ['og:locale', 'og:site_name']) {
      expect(countOf(html, `property="${tag}"`), `${tag} dupliqué`).toBe(1);
    }
    expect(countOf(html, 'name="twitter:card"')).toBe(1);
    expect(countOf(html, 'name="twitter:site"')).toBe(1);
  });

  it('attribue la carte X au compte réel de la marque', async () => {
    // `lib/brand` déclare `https://x.com/max_morrys`. L'injection annonçait `@maxmorrys`,
    // qui n'est pas ce compte, et le shell portait le bon : les deux cohabitaient.
    const html = await render(META);
    expect(html).toContain('<meta name="twitter:site" content="@max_morrys" />');
    expect(html).not.toContain('content="@maxmorrys"');
  });

  /*
   * LES DIMENSIONS DE L'IMAGE — le mensonge le plus discret de la sortie.
   *
   * `1200×630` était écrit en dur pour toutes les pages. L'image par défaut fait 1500×1000,
   * les pochettes de podcast 640×640, les vignettes YouTube 1280×720 (mesuré le 03/09/2026).
   * Facebook dimensionne la carte d'après ces nombres avant de télécharger l'image, puis
   * recadre au format annoncé : de fausses valeurs coupent l'image à chaque partage.
   */
  it('n annonce pas de dimensions quand elles sont inconnues', async () => {
    const html = await render(META);
    expect(countOf(html, 'property="og:image:width"')).toBe(0);
    expect(countOf(html, 'property="og:image:height"')).toBe(0);
    // Le 1200×630 du shell doit avoir été retiré, sinon le défaut survit au correctif.
    expect(html).not.toContain('content="630"');
  });

  it('annonce les dimensions réelles quand elles sont connues', async () => {
    const html = await render({ ...META, ogImageWidth: 1500, ogImageHeight: 1000 });
    expect(countOf(html, 'property="og:image:width"')).toBe(1);
    expect(html).toContain('<meta property="og:image:width" content="1500" />');
    expect(html).toContain('<meta property="og:image:height" content="1000" />');
  });

  it('décrit l image de partage', async () => {
    // Absent de la sortie vue par les robots : le `SEOHead` du client en posait un, mais
    // aucun crawler social n'exécute React.
    const html = await render({ ...META, ogImageAlt: 'Une couverture d article' });
    expect(html).toContain('<meta property="og:image:alt" content="Une couverture d article" />');
    expect(html).toContain('<meta name="twitter:image:alt" content="Une couverture d article" />');
  });

  it('n émet pas de balise alt vide', async () => {
    // Une balise vide signale un défaut technique au robot ; son absence ne dit rien.
    const html = await render(META);
    expect(html).not.toContain('og:image:alt');
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

  /*
   * LE MAILLAGE — ce qui manquait, et ce que l'audit du 03/09/2026 appelait
   * « dead-end pages » / « orphan pages ». Un corps prérendu sans un seul `<a href>`
   * arrête net tout robot qui n'exécute pas JavaScript : il voit l'accueil, et rien
   * d'autre du site n'existe pour lui.
   */
  it('le corps SEO porte des liens internes', async () => {
    const html = await render(META);
    expect(html).toContain('<nav aria-label="Navigation du site">');
    expect(html).toContain('href="https://maxmorrys.me/formations"');
    expect(html).toContain('href="https://maxmorrys.me/podcast-et-videos"');
    // Au moins une dizaine de destinations, sinon le maillage ne vaut rien.
    expect(countOf(html, '<li><a href=')).toBeGreaterThan(10);
  });

  it('ne se lie pas à elle-même', async () => {
    // META est la page /blog : elle ne doit pas figurer dans son propre maillage.
    const html = await render(META);
    expect(html).not.toContain('<li><a href="https://maxmorrys.me/blog">');
  });

  it('les liens du maillage sont absolus', async () => {
    // Le pré-rendu est servi par `maxmorrys.me` ET par l'origine Firebase : un href
    // relatif y désignerait deux pages différentes.
    const html = await render(META);
    const body = html.slice(html.indexOf('data-prerendered-seo'));
    expect(body).not.toMatch(/<li><a href="\/(?!\/)/);
  });

  it('le maillage bascule en anglais avec la page', async () => {
    const html = await render({ ...META, lang: 'en' });
    expect(html).toContain('<nav aria-label="Site navigation">');
    // Segments localisés, pas seulement le préfixe.
    expect(html).toContain('href="https://maxmorrys.me/en/courses"');
    expect(html).toContain('href="https://maxmorrys.me/en/podcast-and-videos"');
    expect(html).toContain('href="https://maxmorrys.me/en/digitos-club"');
    expect(html).not.toContain('href="https://maxmorrys.me/en/formations"');
  });

  it('échappe les guillemets des attributs', async () => {
    const html = await render({ ...META, title: 'Titre "cité" & <balise>' });
    expect(html).toContain('<title>Titre &quot;cité&quot; &amp; &lt;balise&gt;</title>');
  });
});
