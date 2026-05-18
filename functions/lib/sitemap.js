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
const SITE_URL = 'https://maxmorrys.me';
async function getPublishedSlugs(collectionName) {
    const db = admin.firestore();
    const snap = await db
        .collection(collectionName)
        .where('status', '==', 'published')
        .select('slug', 'title', 'publishedAt', 'updatedAt', 'coverImage', 'thumbnailUrl')
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
function urlEntry(opts) {
    const { loc, lastmod, changefreq = 'weekly', priority = '0.5', imageLoc, imageTitle } = opts;
    const lastmodTag = lastmod
        ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`
        : '';
    const imageTag = imageLoc
        ? `<image:image><image:loc>${escapeXml(imageLoc)}</image:loc>${imageTitle ? `<image:title>${escapeXml(imageTitle)}</image:title>` : ''}</image:image>`
        : '';
    return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority>${imageTag}</url>`;
}
exports.sitemap = (0, https_1.onRequest)({ region: 'europe-west1', memory: '256MiB' }, async (_req, res) => {
    try {
        const [posts, formations, podcasts, videos] = await Promise.all([
            getPublishedSlugs('blog'),
            getPublishedSlugs('formations'),
            getPublishedSlugs('podcasts'),
            getPublishedSlugs('videos'),
        ]);
        const urls = [];
        // Static pages
        urls.push(urlEntry({ loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/a-propos`, changefreq: 'monthly', priority: '0.7' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/blog`, changefreq: 'daily', priority: '0.9' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/formations`, changefreq: 'weekly', priority: '0.9' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/podcasts`, changefreq: 'weekly', priority: '0.8' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/videos`, changefreq: 'weekly', priority: '0.8' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/faq`, changefreq: 'monthly', priority: '0.5' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.5' }));
        // Legal pages
        urls.push(urlEntry({ loc: `${SITE_URL}/legal/mentions-legales`, changefreq: 'yearly', priority: '0.3' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/legal/confidentialite`, changefreq: 'yearly', priority: '0.3' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/legal/cgv`, changefreq: 'yearly', priority: '0.3' }));
        urls.push(urlEntry({ loc: `${SITE_URL}/legal/cookies`, changefreq: 'yearly', priority: '0.3' }));
        // Dynamic pages — blog
        for (const p of posts) {
            if (!p.slug)
                continue;
            urls.push(urlEntry({
                loc: `${SITE_URL}/blog/${p.slug}`,
                lastmod: p.updatedAt || p.publishedAt,
                changefreq: 'monthly',
                priority: '0.7',
                imageLoc: p.coverImage,
                imageTitle: p.title,
            }));
        }
        // Dynamic pages — formations
        for (const f of formations) {
            if (!f.slug)
                continue;
            urls.push(urlEntry({
                loc: `${SITE_URL}/formations/${f.slug}`,
                lastmod: f.updatedAt || f.publishedAt,
                changefreq: 'weekly',
                priority: '0.8',
                imageLoc: f.coverImage,
                imageTitle: f.title,
            }));
        }
        // Dynamic pages — podcasts
        for (const p of podcasts) {
            if (!p.slug)
                continue;
            urls.push(urlEntry({
                loc: `${SITE_URL}/podcasts/${p.slug}`,
                lastmod: p.updatedAt || p.publishedAt,
                changefreq: 'monthly',
                priority: '0.6',
                imageLoc: p.coverImage,
                imageTitle: p.title,
            }));
        }
        // Dynamic pages — videos
        for (const v of videos) {
            if (!v.slug)
                continue;
            urls.push(urlEntry({
                loc: `${SITE_URL}/videos/${v.slug}`,
                lastmod: v.updatedAt || v.publishedAt,
                changefreq: 'monthly',
                priority: '0.6',
                imageLoc: v.thumbnailUrl,
                imageTitle: v.title,
            }));
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
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