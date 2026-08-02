import { SITE_NAME } from '../constants';
import { escapeHtml } from './html';
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
  lines.push('<meta property="og:image:width" content="1200" />');
  lines.push('<meta property="og:image:height" content="630" />');
  lines.push(`<meta property="og:locale" content="${meta.lang === 'en' ? 'en_US' : 'fr_FR'}" />`);
  lines.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  lines.push('<meta name="twitter:card" content="summary_large_image" />');
  lines.push('<meta name="twitter:site" content="@maxmorrys" />');
  lines.push(`<meta name="twitter:title" content="${t}" />`);
  lines.push(`<meta name="twitter:description" content="${d}" />`);
  lines.push(`<meta name="twitter:image" content="${img}" />`);

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
    </div>`;
}
