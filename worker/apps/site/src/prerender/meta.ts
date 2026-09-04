import { SITE_NAME, SITE_URL, TWITTER_HANDLE } from '../constants';
import { escapeHtml } from './html';
import { enPath } from './segments';
import type { PageMeta } from './types';

/**
 * Port verbatim de `buildMetaInjection` / `buildSeoBody`.
 *
 * Le formatage compte : le séparateur `\n    ` entre lignes et l'indentation du
 * corps SEO font partie de la sortie comparée par le test de parité.
 */

export function buildMetaInjection(meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.canonical);
  const img = escapeHtml(meta.ogImage);
  const lines: string[] = [];

  lines.push(`<title>${t}</title>`);
  lines.push(`<meta name="description" content="${d}" />`);
  lines.push(`<link rel="canonical" href="${u}" />`);

  // Alternates hreflang (SEO multilingue).
  if (meta.altFr && meta.altEn) {
    lines.push(`<link rel="alternate" hreflang="fr" href="${escapeHtml(meta.altFr)}" />`);
    lines.push(`<link rel="alternate" hreflang="en" href="${escapeHtml(meta.altEn)}" />`);
    lines.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(meta.altFr)}" />`);
  }
  if (meta.noIndex) {
    lines.push('<meta name="robots" content="noindex, nofollow" />');
  }

  lines.push(`<meta property="og:title" content="${t}" />`);
  lines.push(`<meta property="og:description" content="${d}" />`);
  lines.push(`<meta property="og:type" content="${escapeHtml(meta.ogType)}" />`);
  lines.push(`<meta property="og:url" content="${u}" />`);
  lines.push(`<meta property="og:image" content="${img}" />`);
  /*
   * LES DIMENSIONS NE SONT ÉMISES QUE QUAND ELLES SONT CONNUES.
   *
   * Elles étaient codées en dur à 1200×630 pour toutes les pages, ce qui décrivait une image
   * qui n'existe nulle part : l'image par défaut fait 1500×1000, les pochettes de podcast
   * 640×640, les vignettes YouTube 1280×720. Les couvertures d'article, elles, font 1408×768
   * et s'en approchaient — d'où le fait que le défaut ne se voyait que sur les autres pages.
   *
   * Sans ces balises, Facebook télécharge l'image et la mesure lui-même : le premier passage
   * du robot peut rendre une petite carte, les suivants la bonne. Avec de FAUSSES balises, il
   * recadre au format annoncé À CHAQUE FOIS. Mieux vaut donc l'absence que le mensonge.
   */
  if (meta.ogImageWidth && meta.ogImageHeight) {
    lines.push(`<meta property="og:image:width" content="${meta.ogImageWidth}" />`);
    lines.push(`<meta property="og:image:height" content="${meta.ogImageHeight}" />`);
  }
  // Le texte alternatif manquait entièrement à la sortie que voient les robots.
  if (meta.ogImageAlt) {
    lines.push(`<meta property="og:image:alt" content="${escapeHtml(meta.ogImageAlt)}" />`);
  }
  lines.push(`<meta property="og:locale" content="${meta.lang === 'en' ? 'en_US' : 'fr_FR'}" />`);
  lines.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  lines.push('<meta name="twitter:card" content="summary_large_image" />');
  lines.push(`<meta name="twitter:site" content="${TWITTER_HANDLE}" />`);
  lines.push(`<meta name="twitter:title" content="${t}" />`);
  lines.push(`<meta name="twitter:description" content="${d}" />`);
  lines.push(`<meta name="twitter:image" content="${img}" />`);
  if (meta.ogImageAlt) {
    lines.push(`<meta name="twitter:image:alt" content="${escapeHtml(meta.ogImageAlt)}" />`);
  }

  if (meta.publishedAt) {
    lines.push(
      `<meta property="article:published_time" content="${escapeHtml(meta.publishedAt)}" />`,
    );
  }
  if (meta.modifiedAt) {
    lines.push(`<meta property="article:modified_time" content="${escapeHtml(meta.modifiedAt)}" />`);
  }

  // Blocs JSON-LD.
  if (meta.jsonLd) {
    const blocks = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    for (const data of blocks) {
      lines.push(
        `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
      );
    }
  }

  // Fil d'Ariane JSON-LD.
  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    const breadcrumbJson = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(breadcrumbJson).replace(/</g, '\\u003c')}</script>`,
    );
  }

  return lines.join('\n    ');
}

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES LIENS QUE LE CORPS PRÉRENDU N'AVAIT PAS.
 *
 * Le corps SEO se réduisait à un `<h1>` et un paragraphe : ZÉRO `<a href>`. Un robot qui
 * n'exécute pas JavaScript — et c'est le cas de tous les auditeurs, de la plupart des
 * agrégateurs, et de Googlebot au premier passage avant rendu — arrivait donc sur
 * l'accueil et n'avait NULLE PART où aller. L'audit du 03/09/2026 le dit dans son
 * vocabulaire : « dead-end pages » et « orphan pages » sur `/` et `/en`, et rien d'autre
 * dans le rapport — le robot n'a jamais atteint les 132 autres URL du sitemap.
 *
 * C'est le défaut le plus cher des six signalés : un sitemap seul déclare des pages, un
 * maillage les RECOMMANDE. Sans lien entrant, chaque page part de zéro.
 *
 * CE N'EST PAS DU CONTENU POUR ROBOTS. Chacune de ces destinations est déjà dans l'en-tête
 * (`SITE_NAV`) ou le pied de page (`footerLinks`) de la page rendue : les libellés sont
 * ceux de `nav.json` et `footer.json`, mot pour mot. React remplace ce bloc à l'hydratation
 * par la vraie navigation, vers les mêmes adresses.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Chemin FR canonique + libellé dans les deux langues. Miroir de l'en-tête et du pied de page. */
const SEO_NAV: ReadonlyArray<{ path: string; fr: string; en: string }> = [
  { path: '/', fr: 'Accueil', en: 'Home' },
  { path: '/a-propos', fr: 'Je suis Max-Morrys', en: "I'm Max-Morrys" },
  { path: '/formations', fr: 'Je te forme', en: "I'll train you" },
  { path: '/blog', fr: "Je t'informe", en: "I'll keep you posted" },
  { path: '/podcast-et-videos', fr: 'Je te transforme', en: "I'll push you further" },
  { path: '/club-des-digitos', fr: 'Le Club des Digitos', en: 'The Digitos Club' },
  { path: '/presence-digitale', fr: 'Je te digitalise', en: "I'll get you online" },
  { path: '/agence', fr: 'Agence', en: 'Agency' },
  { path: '/faq', fr: 'FAQ', en: 'Frequently asked questions' },
  { path: '/contact', fr: 'Contact', en: 'Talk to me' },
  { path: '/verifier', fr: 'Vérifier un certificat', en: 'Verify a certificate' },
  { path: '/legal/mentions-legales', fr: 'Mentions légales', en: 'Legal notice' },
  { path: '/legal/confidentialite', fr: 'Confidentialité', en: 'Privacy' },
  { path: '/legal/cgv', fr: 'CGV', en: 'Terms of Sale' },
  { path: '/legal/cgu', fr: 'CGU', en: 'Terms of Use' },
  { path: '/legal/cookies', fr: 'Cookies', en: 'Cookies' },
];

/**
 * Le maillage interne du corps prérendu, dans la langue de la page.
 *
 * Les URL sont ABSOLUES : c'est la même raison que pour les `canonical` et les alternates —
 * le pré-rendu est servi aussi bien par `maxmorrys.me` que par l'origine Firebase, et un
 * lien relatif y désignerait deux pages différentes.
 *
 * La page courante est retirée : un auto-lien n'apporte rien et brouille le comptage des
 * liens internes des auditeurs.
 */
function buildSeoNav(meta: PageMeta): string {
  const lang = meta.lang === 'en' ? 'en' : 'fr';
  // `altFr` porte le chemin FR canonique de CETTE page, déjà calculé pour les hreflang.
  const currentFr = meta.altFr ? meta.altFr.slice(SITE_URL.length) || '/' : undefined;

  const items = SEO_NAV.filter((entry) => entry.path !== currentFr).map((entry) => {
    const href = `${SITE_URL}${lang === 'en' ? enPath(entry.path) : entry.path}`;
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(entry[lang])}</a></li>`;
  });

  const label = lang === 'en' ? 'Site navigation' : 'Navigation du site';
  return `<nav aria-label="${label}">
        <ul>
          ${items.join('\n          ')}
        </ul>
      </nav>`;
}

export function buildSeoBody(meta: PageMeta): string {
  if (!meta.h1 && !meta.bodyText) return '';

  const h1 = meta.h1 ? `<h1>${escapeHtml(meta.h1)}</h1>` : '';
  const paragraphs = (meta.bodyText || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('\n      ');

  // C'est ce div que voient les robots ; React hydrate #root et le remplace.
  return `<div data-prerendered-seo="true">
      ${h1}
      ${paragraphs}
      ${buildSeoNav(meta)}
    </div>`;
}
