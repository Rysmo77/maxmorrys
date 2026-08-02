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
exports.sitemap = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const segments_1 = require("./segments");
const SITE_URL = 'https://maxmorrys.me';
async function getPublishedSlugs(collectionName) {
    const db = admin.firestore();
    const snap = await db
        .collection(collectionName)
        .where('status', '==', 'published')
        .select('slug', 'slug_en', 'title', 'publishedAt', 'updatedAt', 'coverImage', 'thumbnailUrl')
        .get();
    return snap.docs.map((d) => d.data());
}
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/** Émet DEUX entrées <url> (fr + en) partageant les mêmes alternates hreflang. */
function urlEntryPair(opts) {
    const { frPath, enFullPath, lastmod, changefreq = 'weekly', priority = '0.5', imageLoc, imageTitle } = opts;
    const frLoc = `${SITE_URL}${frPath}`;
    const enLoc = `${SITE_URL}${enFullPath}`;
    const lastmodTag = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
    const imageTag = imageLoc
        ? `<image:image><image:loc>${escapeXml(imageLoc)}</image:loc>${imageTitle ? `<image:title>${escapeXml(imageTitle)}</image:title>` : ''}</image:image>`
        : '';
    const alternates = `<xhtml:link rel="alternate" hreflang="fr" href="${escapeXml(frLoc)}"/>` +
        `<xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}"/>` +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(frLoc)}"/>`;
    const make = (loc) => `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates}${imageTag}</url>`;
    return make(frLoc) + '\n' + make(enLoc);
}
// Pages statiques (chemin FR canonique → fréquence/priorité).
const STATIC_PAGES = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/a-propos', changefreq: 'monthly', priority: '0.7' },
    { path: '/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/formations', changefreq: 'weekly', priority: '0.9' },
    { path: '/podcasts', changefreq: 'weekly', priority: '0.8' },
    { path: '/videos', changefreq: 'weekly', priority: '0.8' },
    { path: '/faq', changefreq: 'monthly', priority: '0.5' },
    { path: '/agence', changefreq: 'monthly', priority: '0.8' },
    { path: '/contact', changefreq: 'monthly', priority: '0.5' },
    { path: '/legal/mentions-legales', changefreq: 'yearly', priority: '0.3' },
    { path: '/legal/confidentialite', changefreq: 'yearly', priority: '0.3' },
    { path: '/legal/cgv', changefreq: 'yearly', priority: '0.3' },
    { path: '/legal/cookies', changefreq: 'yearly', priority: '0.3' },
];
exports.sitemap = (0, https_1.onRequest)({ region: 'europe-west1', memory: '256MiB' }, async (_req, res) => {
    try {
        const [posts, formations, podcasts, videos] = await Promise.all([
            getPublishedSlugs('blog'),
            getPublishedSlugs('formations'),
            getPublishedSlugs('podcasts'),
            getPublishedSlugs('videos'),
        ]);
        const urls = [];
        // Pages statiques (fr + en).
        for (const p of STATIC_PAGES) {
            urls.push(urlEntryPair({ frPath: p.path, enFullPath: (0, segments_1.enPath)(p.path), changefreq: p.changefreq, priority: p.priority }));
        }
        // Pages dynamiques.
        const pushDynamic = (items, seg, changefreq, priority, imageKey) => {
            for (const it of items) {
                if (!it.slug)
                    continue;
                const frPath = `/${seg}/${it.slug}`;
                const enFullPath = (0, segments_1.enPath)(`/${seg}/${it.slug_en || it.slug}`);
                urls.push(urlEntryPair({
                    frPath,
                    enFullPath,
                    lastmod: it.updatedAt || it.publishedAt,
                    changefreq,
                    priority,
                    imageLoc: it[imageKey],
                    imageTitle: it.title,
                }));
            }
        };
        pushDynamic(posts, 'blog', 'monthly', '0.7', 'coverImage');
        pushDynamic(formations, 'formations', 'weekly', '0.8', 'coverImage');
        pushDynamic(podcasts, 'podcasts', 'monthly', '0.6', 'coverImage');
        pushDynamic(videos, 'videos', 'monthly', '0.6', 'thumbnailUrl');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.status(200).send(xml);
    }
    catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=sitemap.js.map