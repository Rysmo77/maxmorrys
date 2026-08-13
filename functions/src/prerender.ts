import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { canonicalizeSegments, enPath } from './segments';
import { translateCached } from './translate';

const googleAiKey = defineSecret('GOOGLE_AI_API_KEY');
const SITE_URL = 'https://maxmorrys.me';
const SITE_NAME = 'Max-Morrys';
const DEFAULT_TITLE = 'Max-Morrys | Maîtrisez le digital, accélérez votre croissance';
const DEFAULT_DESCRIPTION =
  'Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l\'IA. Par Max-Morrys depuis Dakar.';
// Placeholder Firebase Storage en attendant l'upload du fichier OG dédié (1200×630).
const DEFAULT_OG_IMAGE = 'https://media.maxmorrys.me/Je-te-forme/2252.jpg';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface PageMeta {
  title: string;
  description: string;
  ogType: string;
  ogImage: string;
  canonical: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  h1?: string;
  bodyText?: string;
  publishedAt?: string;
  modifiedAt?: string;
  noIndex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  // i18n
  lang?: 'fr' | 'en';
  /** Alternates hreflang absolus (toujours en FR canonique pour altFr). */
  altFr?: string;
  altEn?: string;
}

// ── Static pages metadata ────────────────────────────────────────────────

const staticPages: Record<string, PageMeta> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/`,
    h1: 'Maîtrise le digital, accélère ta croissance',
    bodyText:
      'Max-Morrys propose des formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l\'IA. Plateforme éducative basée à Dakar, dédiée à la croissance digitale en Afrique francophone.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        sameAs: [
          'https://www.linkedin.com/in/maxmorrys',
          'https://www.youtube.com/@maxmorrys',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: 'fr',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/blog?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  },
  '/a-propos': {
    title: `À propos de Max-Morrys — Formateur en Marketing Digital | ${SITE_NAME}`,
    description:
      'Découvrez le parcours de Max-Morrys, formateur et consultant en marketing digital basé à Dakar. Expertise SEO, growth marketing et stratégie digitale pour l\'Afrique.',
    ogType: 'profile',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/a-propos`,
    h1: 'Je suis Max-Morrys',
    bodyText:
      'Formateur, consultant et créateur de contenu digital basé à Dakar. J\'aide les entreprises et entrepreneurs francophones à maîtriser le marketing digital, le SEO et l\'IA pour accélérer leur croissance.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'À propos', url: `${SITE_URL}/a-propos` },
    ],
  },
  '/blog': {
    title: `Blog Marketing Digital — Articles et Conseils | ${SITE_NAME}`,
    description:
      'Articles, analyses et conseils pratiques en marketing digital, SEO, IA et stratégie de croissance. Par Max-Morrys depuis Dakar.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/blog`,
    h1: 'Blog Marketing Digital',
    bodyText:
      'Retrouvez ici tous les articles de Max-Morrys sur le marketing digital, le SEO, l\'IA, le growth marketing et la stratégie digitale. Conseils pratiques pour entrepreneurs et entreprises africaines.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Blog', url: `${SITE_URL}/blog` },
    ],
  },
  '/formations': {
    title: `Formations Marketing Digital | ${SITE_NAME}`,
    description:
      'Formations pratiques en marketing digital, SEO et IA pour accélérer ta croissance. Cours en ligne accessibles depuis l\'Afrique et le monde entier.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/formations`,
    h1: 'Formations Marketing Digital',
    bodyText:
      'Découvre les formations Max-Morrys : marketing digital, SEO, growth, IA, contenu. Programmes pratiques avec missions, certificats et accompagnement personnalisé.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Formations', url: `${SITE_URL}/formations` },
    ],
  },
  '/podcasts': {
    title: `Podcasts Marketing Digital | ${SITE_NAME}`,
    description:
      'Écoute le podcast de Max-Morrys : stratégies marketing digital, SEO, IA et croissance en Afrique. Disponible sur Spotify, Apple Podcasts et Deezer.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/podcasts`,
    h1: 'Podcasts Marketing Digital',
    bodyText:
      'Le podcast Max-Morrys décrypte les stratégies marketing digital, le SEO, l\'IA et la croissance des marques en Afrique francophone. Nouveaux épisodes chaque semaine.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Podcasts', url: `${SITE_URL}/podcasts` },
    ],
  },
  '/videos': {
    title: `Vidéos Marketing Digital | ${SITE_NAME}`,
    description:
      'Regarde les vidéos de Max-Morrys sur le marketing digital, le SEO et l\'IA. Tutoriels pratiques et analyses sur YouTube.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/videos`,
    h1: 'Vidéos Marketing Digital',
    bodyText:
      'Les vidéos Max-Morrys : tutoriels marketing digital, analyses SEO, démonstrations IA, growth hacking. Contenu pratique en français pour entrepreneurs africains.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Vidéos', url: `${SITE_URL}/videos` },
    ],
  },
  '/faq': {
    title: `FAQ — Questions Fréquentes | ${SITE_NAME}`,
    description:
      'Retrouve les réponses aux questions les plus fréquentes sur les formations, le coaching et les services de Max-Morrys.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/faq`,
    h1: 'Questions fréquentes',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'FAQ', url: `${SITE_URL}/faq` },
    ],
  },
  // Max-Morrys Agency — practice BUILD de MY ONOMA, offre high-ticket.
  // ⚠️ Aucun tarif ici : la grille publique appartient à /presence-digitale.
  '/agence': {
    title: `Max-Morrys Agency — Produit, IA, Technologie & Marque | ${SITE_NAME}`,
    description:
      'Nous concevons les produits numériques, systèmes IA et expériences digitales dont les entreprises ont besoin pour avancer. Practice Product, AI, Technology & Brand de MY ONOMA, depuis Dakar.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/agence`,
    h1: 'Nous construisons les produits numériques qui font avancer les entreprises',
    bodyText:
      'Max-Morrys Agency est la practice Product, AI, Technology & Brand de MY ONOMA. Nous intervenons sur quatre expertises : Digital Product (SaaS, plateformes métier, applications web, marketplaces, portails, outils internes, MVP), AI Systems & Automation (automatisation de workflows, agents et assistants métier, intégrations LLM, produits augmentés par l\'IA), Technology & Infrastructure (architecture applicative et données, APIs et intégrations, authentification, paiement, tableaux de bord) et Brand & Executive Presence (positionnement, écosystème digital, architecture de contenu). Nous travaillons avec des fondateurs, des PME, des scale-ups, des institutions et des marques personnelles premium. Les missions de Growth, Revenue et Operations sont portées par Cléa Growth Office, practice sœur au sein de MY ONOMA. Les prestations contractualisées sous MY ONOMA sont réalisées par MY ONOMA SARL, à Dakar.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Agence', url: `${SITE_URL}/agence` },
    ],
  },
  // Offre « Digital Commerce Local » — déplacée depuis /agence, à contenu constant.
  // ⚠️ Les montants doivent rester alignés sur src/lib/presence/offer.ts.
  '/presence-digitale': {
    title: `Je digitalise ton commerce — Site, Google Maps, WhatsApp | ${SITE_NAME}`,
    description:
      'Ton commerce visible 24h/24, trouvé sur Google Maps et présent sur WhatsApp. Mise en place et accompagnement mensuel pour les commerces de Dakar, Abidjan et Cotonou. Packs à partir de 295 000 FCFA.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/presence-digitale`,
    h1: 'Tes clients te cherchent en ligne',
    bodyText:
      'J\'installe la présence digitale complète de ton commerce : site web, fiche Google Business Profile, catalogue produits sur WhatsApp, Facebook, Instagram et Google Merchant, mesure des visites et référencement local. Trois packs de mise en place : Présence Locale à 295 000 FCFA, Commerce Visible à 495 000 FCFA, Boutique Digitale à 895 000 FCFA. Ensuite, un accompagnement mensuel qui publie pour toi, tient ton catalogue à jour et t\'envoie un rapport chaque mois : Croissance Automatisée à 375 000 FCFA puis 175 000 FCFA par mois, ou Commerce 360 à 750 000 FCFA puis 225 000 FCFA par mois. Basé à Dakar, pour les commerces du Sénégal et d\'Afrique de l\'Ouest.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Présence Digitale', url: `${SITE_URL}/presence-digitale` },
    ],
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description:
      'Contacte Max-Morrys pour du coaching personnalisé, des formations en marketing digital, ou un partenariat. Basé à Dakar, Sénégal.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/contact`,
    h1: 'Contact',
    bodyText:
      'Contactez Max-Morrys par formulaire, email (hello@maxmorrys.me), téléphone (+221 77 604 19 85) ou WhatsApp pour discuter de coaching, formations sur-mesure ou partenariats.',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Contact', url: `${SITE_URL}/contact` },
    ],
  },
  '/legal/mentions-legales': {
    title: `Mentions légales | ${SITE_NAME}`,
    description: 'Mentions légales de Max-Morrys : éditeur, hébergeur et informations légales du site.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/mentions-legales`,
    h1: 'Mentions légales',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Mentions légales', url: `${SITE_URL}/legal/mentions-legales` },
    ],
  },
  '/legal/confidentialite': {
    title: `Politique de confidentialité | ${SITE_NAME}`,
    description: 'Politique de confidentialité et protection des données personnelles de Max-Morrys (RGPD).',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/confidentialite`,
    h1: 'Politique de confidentialité',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Confidentialité', url: `${SITE_URL}/legal/confidentialite` },
    ],
  },
  '/legal/cgv': {
    title: `Conditions Générales de Vente | ${SITE_NAME}`,
    description: 'Conditions Générales de Vente des formations et services Max-Morrys.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/cgv`,
    h1: 'Conditions Générales de Vente',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'CGV', url: `${SITE_URL}/legal/cgv` },
    ],
  },
  '/legal/cookies': {
    title: `Politique de cookies | ${SITE_NAME}`,
    description: 'Politique de gestion des cookies et traceurs sur le site Max-Morrys.',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    canonical: `${SITE_URL}/legal/cookies`,
    h1: 'Politique de cookies',
    breadcrumbs: [
      { name: 'Accueil', url: `${SITE_URL}/` },
      { name: 'Cookies', url: `${SITE_URL}/legal/cookies` },
    ],
  },
};

// ── Dynamic content meta lookup ──────────────────────────────────────────

/** Résout un doc publié par slug (ou slug_en en anglais). */
async function resolveBySlug(
  col: string,
  slug: string,
  lang: 'fr' | 'en',
): Promise<FirebaseFirestore.DocumentData | null> {
  const db = admin.firestore();
  if (lang === 'en') {
    const byEn = await db.collection(col).where('slug_en', '==', slug).limit(1).get();
    if (!byEn.empty && byEn.docs[0].data().status === 'published') return byEn.docs[0].data();
  }
  const snap = await db.collection(col).where('slug', '==', slug).where('status', '==', 'published').limit(1).get();
  return snap.empty ? null : snap.docs[0].data();
}

/** Canonical + alternates hreflang d'un contenu (à spreader en fin d'objet meta). */
function altMeta(seg: string, data: FirebaseFirestore.DocumentData, lang: 'fr' | 'en') {
  const frUrl = `${SITE_URL}/${seg}/${data.slug}`;
  const enUrl = `${SITE_URL}${enPath(`/${seg}/${data.slug_en || data.slug}`)}`;
  return {
    canonical: (data.canonicalUrl as string) || (lang === 'en' ? enUrl : frUrl),
    altFr: frUrl,
    altEn: enUrl,
    lang,
  };
}

async function getContentMeta(path: string, lang: 'fr' | 'en'): Promise<PageMeta | null> {
  // Blog post: /blog/:slug
  const blogMatch = path.match(/^\/blog\/([^/?#]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const post = await resolveBySlug('blog', slug, lang);
    if (!post) return null;
    return {
      title: `${post.metaTitle || post.title} | ${SITE_NAME}`,
      description: post.metaDescription || post.excerpt || '',
      ogType: 'article',
      ogImage: post.ogImage || post.coverImage || DEFAULT_OG_IMAGE,
      noIndex: post.noIndex,
      publishedAt: post.publishedAt,
      modifiedAt: post.updatedAt,
      h1: post.title,
      bodyText: post.excerpt + (post.content ? '\n\n' + stripMarkdown(post.content).slice(0, 2000) : ''),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: { '@type': 'Person', name: post.author || 'Max-Morrys' },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
        articleSection: post.category,
        keywords: Array.isArray(post.tags) ? post.tags.join(', ') : undefined,
        articleBody: post.content ? stripMarkdown(post.content) : post.excerpt,
        ...(typeof post.readTime === 'number' && post.readTime > 0 && {
          timeRequired: `PT${post.readTime}M`,
        }),
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: `${SITE_URL}/blog/${post.slug}` },
      ],
      ...altMeta('blog', post, lang),
    };
  }

  // Formation: /formations/:slug
  const formMatch = path.match(/^\/formations\/([^/?#]+)$/);
  if (formMatch) {
    const slug = formMatch[1];
    const f = await resolveBySlug('formations', slug, lang);
    if (!f) return null;
    const longDesc = f.longDescription ? stripMarkdown(f.longDescription).slice(0, 2000) : '';
    return {
      title: `${f.metaTitle || f.title} | ${SITE_NAME}`,
      description: f.metaDescription || f.description || '',
      ogType: 'website',
      ogImage: f.ogImage || f.coverImage || DEFAULT_OG_IMAGE,
      noIndex: f.noIndex,
      publishedAt: f.publishedAt,
      modifiedAt: f.updatedAt,
      h1: f.title,
      bodyText: f.description + (longDesc ? '\n\n' + longDesc : ''),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: f.title,
        description: f.description,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        educationalLevel: f.level,
        inLanguage: 'fr',
        image: f.coverImage,
        offers: {
          '@type': 'Offer',
          price: f.promoPrice ?? f.price,
          priceCurrency: 'XOF',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/formations/${slug}`,
        },
        ...(typeof f.rating === 'number' && f.rating > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: f.rating,
            bestRating: 5,
            ratingCount: f.students || 1,
          },
        }),
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Formations', url: `${SITE_URL}/formations` },
        { name: f.title, url: `${SITE_URL}/formations/${f.slug}` },
      ],
      ...altMeta('formations', f, lang),
    };
  }

  // Podcast: /podcasts/:slug
  const podMatch = path.match(/^\/podcasts\/([^/?#]+)$/);
  if (podMatch) {
    const slug = podMatch[1];
    const p = await resolveBySlug('podcasts', slug, lang);
    if (!p) return null;
    return {
      title: `${p.metaTitle || p.title} | ${SITE_NAME}`,
      description: p.metaDescription || p.description || '',
      ogType: 'music.song',
      ogImage: p.ogImage || p.coverImage || DEFAULT_OG_IMAGE,
      noIndex: p.noIndex,
      publishedAt: p.publishedAt,
      modifiedAt: p.updatedAt,
      h1: p.title,
      bodyText: (p.description || '') + (p.transcript ? '\n\n' + stripMarkdown(p.transcript).slice(0, 2000) : ''),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'PodcastEpisode',
        name: p.title,
        description: p.description,
        datePublished: p.publishedAt,
        timeRequired: p.duration,
        image: p.coverImage,
        url: `${SITE_URL}/podcasts/${slug}`,
        partOfSeries: {
          '@type': 'PodcastSeries',
          name: 'Le Podcast du Marketing — Max-Morrys',
          url: `${SITE_URL}/podcasts`,
        },
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Podcasts', url: `${SITE_URL}/podcasts` },
        { name: p.title, url: `${SITE_URL}/podcasts/${p.slug}` },
      ],
      ...altMeta('podcasts', p, lang),
    };
  }

  // Video: /videos/:slug
  const vidMatch = path.match(/^\/videos\/([^/?#]+)$/);
  if (vidMatch) {
    const slug = vidMatch[1];
    const v = await resolveBySlug('videos', slug, lang);
    if (!v) return null;
    return {
      title: `${v.metaTitle || v.title} | ${SITE_NAME}`,
      description: v.metaDescription || v.description || '',
      ogType: 'video.other',
      ogImage: v.ogImage || v.thumbnailUrl || DEFAULT_OG_IMAGE,
      noIndex: v.noIndex,
      publishedAt: v.publishedAt,
      modifiedAt: v.updatedAt,
      h1: v.title,
      bodyText: v.description || '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: v.title,
        description: v.description,
        thumbnailUrl: v.thumbnailUrl,
        uploadDate: v.publishedAt,
        duration: v.duration,
        embedUrl: v.videoUrl,
        url: `${SITE_URL}/videos/${slug}`,
      },
      breadcrumbs: [
        { name: 'Accueil', url: `${SITE_URL}/` },
        { name: 'Vidéos', url: `${SITE_URL}/videos` },
        { name: v.title, url: `${SITE_URL}/videos/${v.slug}` },
      ],
      ...altMeta('videos', v, lang),
    };
  }

  return null;
}

/** Strips basic markdown syntax for plain-text body extraction. */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')        // code blocks
    .replace(/`[^`]*`/g, '')                // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')// links → text
    .replace(/^#{1,6}\s+/gm, '')            // headings
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic
    .replace(/^>\s+/gm, '')                 // blockquotes
    .replace(/^[-*+]\s+/gm, '')             // list markers
    .replace(/^\d+\.\s+/gm, '')             // numbered list
    .replace(/\n{3,}/g, '\n\n')             // collapse newlines
    .trim();
}

// ── SPA shell fetching & meta-tag injection ──────────────────────────────

const MINIMAL_FALLBACK = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${SITE_NAME}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

let spaShellCache: { html: string; timestamp: number } | null = null;
const SHELL_CACHE_TTL_MS = 60 * 1000; // 1 minute

async function getSpaShell(): Promise<string> {
  const now = Date.now();
  if (spaShellCache && now - spaShellCache.timestamp < SHELL_CACHE_TTL_MS) {
    return spaShellCache.html;
  }
  try {
    const res = await fetch(`${SITE_URL}/index.html`, {
      headers: { 'User-Agent': 'maxmorrys-prerender/1.0' },
    });
    if (res.ok) {
      const html = await res.text();
      spaShellCache = { html, timestamp: now };
      return html;
    }
    console.error('SPA shell fetch returned status', res.status);
  } catch (e: unknown) {
    console.error('Failed to fetch SPA shell:', e);
  }
  return MINIMAL_FALLBACK;
}

/** Removes existing meta tags that we will re-inject with page-specific values. */
function stripDefaultMeta(shell: string): string {
  return shell
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:title"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:description"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:type"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:url"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:image"[^>]*\/?>/gi, '')
    .replace(/<meta\s+name="twitter:title"[^>]*\/?>/gi, '')
    .replace(/<meta\s+name="twitter:description"[^>]*\/?>/gi, '')
    .replace(/<meta\s+name="twitter:image"[^>]*\/?>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*\/?>/gi, '');
}

function buildMetaInjection(meta: PageMeta): string {
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
    lines.push(`<meta property="article:published_time" content="${escapeHtml(meta.publishedAt)}" />`);
  }
  if (meta.modifiedAt) {
    lines.push(`<meta property="article:modified_time" content="${escapeHtml(meta.modifiedAt)}" />`);
  }

  // JSON-LD blocks
  if (meta.jsonLd) {
    const arr = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    for (const data of arr) {
      lines.push(
        `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
      );
    }
  }

  // BreadcrumbList JSON-LD
  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    const breadcrumbJson = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    };
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(breadcrumbJson).replace(/</g, '\\u003c')}</script>`,
    );
  }

  return lines.join('\n    ');
}

function buildSeoBody(meta: PageMeta): string {
  if (!meta.h1 && !meta.bodyText) return '';
  const h1 = meta.h1 ? `<h1>${escapeHtml(meta.h1)}</h1>` : '';
  // Convert plain text body to paragraphs
  const paragraphs = (meta.bodyText || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n      ');
  // The inner div is what bots see. React will hydrate <div id="root"> and replace.
  return `<div data-prerendered-seo="true">
      ${h1}
      ${paragraphs}
    </div>`;
}

function injectIntoShell(shell: string, meta: PageMeta): string {
  let result = stripDefaultMeta(shell);
  // Attribut lang du <html> selon la langue de la page.
  result = result.replace(/<html\s+lang="[^"]*"/i, `<html lang="${meta.lang === 'en' ? 'en' : 'fr'}"`);
  const injection = buildMetaInjection(meta);
  // Insert after <head> opening so it appears near the top
  result = result.replace(/<head>/i, `<head>\n    ${injection}`);

  // Inject SEO body content inside <div id="root"></div>
  const seoBody = buildSeoBody(meta);
  if (seoBody) {
    result = result.replace(
      /<div\s+id="root"[^>]*>\s*<\/div>/i,
      `<div id="root">${seoBody}</div>`,
    );
  }
  return result;
}

// ── Cloud Function entry point ───────────────────────────────────────────

/** Traduit les champs visibles de la meta FR→EN (cache `translations/`). */
async function translateMetaToEn(meta: PageMeta): Promise<PageMeta> {
  const apiKey = googleAiKey.value();
  const sources = [meta.title, meta.description, meta.h1 || '', meta.bodyText || ''];
  if (!apiKey) return meta;
  try {
    const map = await translateCached(sources, apiKey);
    const tr = (s?: string) => (s ? map[s] || s : s);
    return {
      ...meta,
      title: tr(meta.title) as string,
      description: tr(meta.description) as string,
      h1: tr(meta.h1),
      bodyText: tr(meta.bodyText),
    };
  } catch (e) {
    console.warn('translateMetaToEn failed (non-blocking):', e);
    return meta;
  }
}

export const prerender = onRequest(
  { region: 'europe-west1', memory: '256MiB', cpu: 1, secrets: [googleAiKey] },
  async (req, res) => {
    try {
      const rawPath = req.path.replace(/\/+$/, '') || '/';
      const lang: 'fr' | 'en' = rawPath === '/en' || rawPath.startsWith('/en/') ? 'en' : 'fr';
      // Chemin FR canonique (retire /en + remappe les segments EN).
      const canonicalPath =
        lang === 'en' ? canonicalizeSegments(rawPath === '/en' ? '/' : rawPath.slice(3)) || '/' : rawPath;

      let meta: PageMeta | null = staticPages[canonicalPath] ? { ...staticPages[canonicalPath] } : null;
      if (meta) {
        // Page statique : alternates + canonical selon la langue.
        const frUrl = `${SITE_URL}${canonicalPath}`;
        const enUrl = `${SITE_URL}${enPath(canonicalPath)}`;
        meta.altFr = frUrl;
        meta.altEn = enUrl;
        meta.lang = lang;
        meta.canonical = lang === 'en' ? enUrl : meta.canonical || frUrl;
      }
      if (!meta) {
        meta = await getContentMeta(canonicalPath, lang);
      }
      if (!meta) {
        const frUrl = `${SITE_URL}${canonicalPath}`;
        meta = {
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          ogType: 'website',
          ogImage: DEFAULT_OG_IMAGE,
          canonical: `${SITE_URL}${rawPath}`,
          h1: SITE_NAME,
          noIndex: true, // unknown route → don't index
          lang,
          altFr: frUrl,
          altEn: `${SITE_URL}${enPath(canonicalPath)}`,
        };
      }

      // Traduction des champs visibles pour les pages anglaises indexables.
      if (lang === 'en' && !meta.noIndex) {
        meta = await translateMetaToEn(meta);
      }

      const shell = await getSpaShell();
      const html = injectIntoShell(shell, meta);

      res.set('Content-Type', 'text/html; charset=utf-8');
      // HTML prérendu = équivalent SEO de index.html : jamais mis en cache
      // (sinon il référence des assets hachés supprimés au déploiement suivant).
      res.set('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
      res.status(200).send(html);
    } catch (error: unknown) {
      console.error('Prerender error:', error);
      // Last-resort fallback: serve the SPA shell as-is
      try {
        const shell = await getSpaShell();
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'no-cache');
        res.status(200).send(shell);
      } catch {
        res.status(500).send('Server Error');
      }
    }
  },
);
