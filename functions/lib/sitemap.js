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
        .select('slug', 'publishedAt', 'updatedAt')
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
function urlEntry(loc, lastmod, changefreq = 'weekly', priority = '0.5') {
    const lastmodTag = lastmod
        ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>`
        : '';
    return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
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
        urls.push(urlEntry(SITE_URL, undefined, 'daily', '1.0'));
        urls.push(urlEntry(`${SITE_URL}/a-propos`, undefined, 'monthly', '0.7'));
        urls.push(urlEntry(`${SITE_URL}/blog`, undefined, 'daily', '0.9'));
        urls.push(urlEntry(`${SITE_URL}/formations`, undefined, 'weekly', '0.9'));
        urls.push(urlEntry(`${SITE_URL}/podcasts`, undefined, 'weekly', '0.8'));
        urls.push(urlEntry(`${SITE_URL}/videos`, undefined, 'weekly', '0.8'));
        urls.push(urlEntry(`${SITE_URL}/faq`, undefined, 'monthly', '0.5'));
        urls.push(urlEntry(`${SITE_URL}/contact`, undefined, 'monthly', '0.5'));
        // Dynamic pages
        for (const p of posts) {
            urls.push(urlEntry(`${SITE_URL}/blog/${p.slug}`, p.updatedAt || p.publishedAt, 'monthly', '0.7'));
        }
        for (const f of formations) {
            urls.push(urlEntry(`${SITE_URL}/formations/${f.slug}`, f.updatedAt || f.publishedAt, 'weekly', '0.8'));
        }
        for (const p of podcasts) {
            urls.push(urlEntry(`${SITE_URL}/podcasts/${p.slug}`, p.publishedAt, 'monthly', '0.6'));
        }
        for (const v of videos) {
            urls.push(urlEntry(`${SITE_URL}/videos/${v.slug}`, v.publishedAt, 'monthly', '0.6'));
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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