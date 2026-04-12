"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.prerender = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const SITE_URL = 'https://maxmorrys.me';
const SITE_NAME = 'Max-Morrys';
const DEFAULT_TITLE = 'Max-Morrys | Maîtrisez le digital, accélérez votre croissance';
const DEFAULT_DESCRIPTION = 'Formations, articles, podcasts et vidéos pour maîtriser le marketing digital, le SEO et l\'IA. Par Max-Morrys depuis Dakar.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
const BOT_USER_AGENTS = [
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'slurp',
    'baiduspider',
    'facebookexternalhit',
    'facebot',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'slackbot',
    'telegrambot',
    'discordbot',
    'applebot',
    'pinterestbot',
    'semrushbot',
    'ahrefsbot',
];
function isBot(userAgent) {
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
// ── Route-specific meta data fetchers ────────────────────────────────────
const staticPages = {
    '/': {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: SITE_URL,
        h1: 'Maîtrise le digital, accélère ta croissance',
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: DEFAULT_OG_IMAGE,
        },
    },
    '/a-propos': {
        title: `A propos de Max-Morrys — Formateur en Marketing Digital | ${SITE_NAME}`,
        description: 'Découvrez le parcours de Max-Morrys, formateur et consultant en marketing digital basé à Dakar.',
        ogType: 'profile',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/a-propos`,
        h1: 'Je suis Max-Morrys',
    },
    '/blog': {
        title: `Blog Marketing Digital — Articles et Conseils | ${SITE_NAME}`,
        description: 'Articles, analyses et conseils pratiques en marketing digital, SEO, IA et stratégie de croissance.',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/blog`,
        h1: 'Blog Marketing Digital',
    },
    '/formations': {
        title: `Formations Marketing Digital | ${SITE_NAME}`,
        description: 'Formations pratiques en marketing digital, SEO et IA pour accélérer ta croissance.',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/formations`,
        h1: 'Formations Marketing Digital',
    },
    '/podcasts': {
        title: `Podcasts Marketing Digital | ${SITE_NAME}`,
        description: 'Écoute le podcast de Max-Morrys : stratégies marketing digital, SEO, IA et croissance en Afrique.',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/podcasts`,
        h1: 'Podcasts Marketing Digital',
    },
    '/videos': {
        title: `Vidéos Marketing Digital | ${SITE_NAME}`,
        description: 'Regarde les vidéos de Max-Morrys sur le marketing digital, le SEO et l\'IA.',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/videos`,
        h1: 'Vidéos Marketing Digital',
    },
    '/faq': {
        title: `FAQ — Questions Fréquentes | ${SITE_NAME}`,
        description: 'Retrouve les réponses aux questions les plus fréquentes sur les formations et services de Max-Morrys.',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/faq`,
        h1: 'Questions fréquentes',
    },
    '/contact': {
        title: `Contact | ${SITE_NAME}`,
        description: 'Contacte Max-Morrys pour du coaching personnalisé, des formations en marketing digital, ou un partenariat.',
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        canonical: `${SITE_URL}/contact`,
        h1: 'Contact',
    },
};
async function getContentMeta(path) {
    var _a;
    const db = admin.firestore();
    // Blog post: /blog/:slug
    const blogMatch = path.match(/^\/blog\/([^/?#]+)$/);
    if (blogMatch) {
        const slug = blogMatch[1];
        const snap = await db
            .collection('blog')
            .where('slug', '==', slug)
            .where('status', '==', 'published')
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        const post = snap.docs[0].data();
        return {
            title: `${post.metaTitle || post.title} | ${SITE_NAME}`,
            description: post.metaDescription || post.excerpt || '',
            ogType: 'article',
            ogImage: post.ogImage || post.coverImage || DEFAULT_OG_IMAGE,
            canonical: post.canonicalUrl || `${SITE_URL}/blog/${slug}`,
            noIndex: post.noIndex,
            publishedAt: post.publishedAt,
            h1: post.title,
            bodyText: post.excerpt,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: post.title,
                description: post.excerpt,
                image: post.coverImage,
                datePublished: post.publishedAt,
                author: { '@type': 'Person', name: post.author || 'Max-Morrys' },
                publisher: {
                    '@type': 'Organization',
                    name: SITE_NAME,
                    logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
                },
                mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
            },
        };
    }
    // Formation: /formations/:slug
    const formMatch = path.match(/^\/formations\/([^/?#]+)$/);
    if (formMatch) {
        const slug = formMatch[1];
        const snap = await db
            .collection('formations')
            .where('slug', '==', slug)
            .where('status', '==', 'published')
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        const f = snap.docs[0].data();
        return {
            title: `${f.metaTitle || f.title} | ${SITE_NAME}`,
            description: f.metaDescription || f.description || '',
            ogType: 'website',
            ogImage: f.ogImage || f.coverImage || DEFAULT_OG_IMAGE,
            canonical: f.canonicalUrl || `${SITE_URL}/formations/${slug}`,
            noIndex: f.noIndex,
            h1: f.title,
            bodyText: f.description,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'Course',
                name: f.title,
                description: f.description,
                provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
                inLanguage: 'fr',
                offers: {
                    '@type': 'Offer',
                    price: (_a = f.promoPrice) !== null && _a !== void 0 ? _a : f.price,
                    priceCurrency: 'XOF',
                    availability: 'https://schema.org/InStock',
                },
            },
        };
    }
    // Podcast: /podcasts/:slug
    const podMatch = path.match(/^\/podcasts\/([^/?#]+)$/);
    if (podMatch) {
        const slug = podMatch[1];
        const snap = await db
            .collection('podcasts')
            .where('slug', '==', slug)
            .where('status', '==', 'published')
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        const p = snap.docs[0].data();
        return {
            title: `${p.title} | ${SITE_NAME}`,
            description: p.description || '',
            ogType: 'music.song',
            ogImage: p.coverImage || DEFAULT_OG_IMAGE,
            canonical: `${SITE_URL}/podcasts/${slug}`,
            h1: p.title,
            bodyText: p.description,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'PodcastEpisode',
                name: p.title,
                description: p.description,
                datePublished: p.publishedAt,
                url: `${SITE_URL}/podcasts/${slug}`,
            },
        };
    }
    // Video: /videos/:slug
    const vidMatch = path.match(/^\/videos\/([^/?#]+)$/);
    if (vidMatch) {
        const slug = vidMatch[1];
        const snap = await db
            .collection('videos')
            .where('slug', '==', slug)
            .where('status', '==', 'published')
            .limit(1)
            .get();
        if (snap.empty)
            return null;
        const v = snap.docs[0].data();
        return {
            title: `${v.title} | ${SITE_NAME}`,
            description: v.description || '',
            ogType: 'video.other',
            ogImage: v.thumbnailUrl || DEFAULT_OG_IMAGE,
            canonical: `${SITE_URL}/videos/${slug}`,
            h1: v.title,
            bodyText: v.description,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'VideoObject',
                name: v.title,
                description: v.description,
                thumbnailUrl: v.thumbnailUrl,
                uploadDate: v.publishedAt,
                embedUrl: v.videoUrl,
            },
        };
    }
    return null;
}
function buildHtml(meta) {
    const t = escapeHtml(meta.title);
    const d = escapeHtml(meta.description);
    const robots = meta.noIndex ? '<meta name="robots" content="noindex, nofollow" />' : '';
    const published = meta.publishedAt
        ? `<meta property="article:published_time" content="${escapeHtml(meta.publishedAt)}" />`
        : '';
    const jsonLdScript = meta.jsonLd
        ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`
        : '';
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <link rel="canonical" href="${escapeHtml(meta.canonical)}" />
  ${robots}
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:type" content="${meta.ogType}" />
  <meta property="og:url" content="${escapeHtml(meta.canonical)}" />
  <meta property="og:image" content="${escapeHtml(meta.ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  ${published}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />
  ${jsonLdScript}
</head>
<body>
  <h1>${escapeHtml(meta.h1 || meta.title)}</h1>
  ${meta.bodyText ? `<p>${escapeHtml(meta.bodyText)}</p>` : ''}
  <noscript>Ce site nécessite JavaScript pour fonctionner pleinement. Visitez <a href="${SITE_URL}">${SITE_NAME}</a>.</noscript>
</body>
</html>`;
}
// Cache the SPA index.html content for non-bot requests
let spaHtml = null;
async function getSpaHtml() {
    if (spaHtml)
        return spaHtml;
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const indexPath = path.join(__dirname, '../../dist/index.html');
        spaHtml = fs.readFileSync(indexPath, 'utf-8');
    }
    catch (_a) {
        // Fallback — redirect to the SPA served by Firebase Hosting
        spaHtml = `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${SITE_URL}"></head></html>`;
    }
    return spaHtml;
}
exports.prerender = (0, https_1.onRequest)({ region: 'europe-west1', memory: '256MiB' }, async (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    // If not a bot, serve the normal SPA
    if (!isBot(userAgent)) {
        const html = await getSpaHtml();
        res.set('Content-Type', 'text/html');
        res.set('Cache-Control', 'no-cache');
        res.status(200).send(html);
        return;
    }
    // Bot detected — serve pre-rendered HTML
    try {
        const path = req.path.replace(/\/+$/, '') || '/';
        // Check static pages first
        let meta = staticPages[path] || null;
        // Check dynamic content
        if (!meta) {
            meta = await getContentMeta(path);
        }
        // Fallback to default if route not found
        if (!meta) {
            meta = {
                title: DEFAULT_TITLE,
                description: DEFAULT_DESCRIPTION,
                ogType: 'website',
                ogImage: DEFAULT_OG_IMAGE,
                canonical: `${SITE_URL}${path}`,
                h1: SITE_NAME,
            };
        }
        const html = buildHtml(meta);
        res.set('Content-Type', 'text/html');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.status(200).send(html);
    }
    catch (error) {
        console.error('Prerender error:', error);
        // Fall back to SPA on error
        const html = await getSpaHtml();
        res.set('Content-Type', 'text/html');
        res.status(200).send(html);
    }
});
//# sourceMappingURL=prerender.js.map