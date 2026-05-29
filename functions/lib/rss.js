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
exports.rss = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const SITE_URL = 'https://maxmorrys.me';
const FEED_TITLE = 'Max-Morrys — Blog';
const FEED_DESCRIPTION = 'Articles, analyses et actualités de Max-Morrys.';
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function cdata(str) {
    return `<![CDATA[${str.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}
function rfc822(date) {
    const d = date ? new Date(date) : new Date();
    return (isNaN(d.getTime()) ? new Date() : d).toUTCString();
}
exports.rss = (0, https_1.onRequest)({ region: 'europe-west1', memory: '256MiB' }, async (_req, res) => {
    var _a, _b;
    try {
        const db = admin.firestore();
        const snap = await db
            .collection('blog')
            .where('status', '==', 'published')
            .select('slug', 'title', 'excerpt', 'coverImage', 'category', 'author', 'publishedAt', 'updatedAt')
            .get();
        const posts = snap.docs
            .map((d) => d.data())
            .filter((p) => p.slug)
            .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        const lastBuild = rfc822(((_a = posts[0]) === null || _a === void 0 ? void 0 : _a.updatedAt) || ((_b = posts[0]) === null || _b === void 0 ? void 0 : _b.publishedAt));
        const items = posts
            .map((p) => {
            const link = `${SITE_URL}/blog/${p.slug}`;
            const imageTag = p.coverImage
                ? `<enclosure url="${escapeXml(p.coverImage)}" type="image/jpeg" />`
                : '';
            const categoryTag = p.category
                ? `<category>${cdata(p.category)}</category>`
                : '';
            const authorTag = p.author ? `<dc:creator>${cdata(p.author)}</dc:creator>` : '';
            return `    <item>
      <title>${cdata(p.title || '')}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${rfc822(p.publishedAt)}</pubDate>
      ${authorTag}
      ${categoryTag}
      <description>${cdata(p.excerpt || '')}</description>
      ${imageTag}
    </item>`;
        })
            .join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${cdata(FEED_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${cdata(FEED_DESCRIPTION)}</description>
    <language>fr</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;
        res.set('Content-Type', 'application/rss+xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        res.status(200).send(xml);
    }
    catch (error) {
        console.error('RSS generation error:', error);
        res.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=rss.js.map