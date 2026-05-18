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
exports.catalog = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const SITE_URL = 'https://maxmorrys.me';
const BRAND = 'Max-Morrys';
const CURRENCY = 'XOF';
// Placeholder Firebase Storage en attendant l'upload du fichier OG dédié (1200×630).
const DEFAULT_OG_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/Je-te-forme%2F2252.jpg?alt=media&token=c7942987-73f4-45e3-9a9e-2735a1eb1927';
/**
 * CSV escaping per RFC 4180:
 * - If field contains comma, quote, or newline → wrap in double quotes
 * - Double quotes inside field → escape as ""
 */
function csvEscape(value) {
    if (value === undefined || value === null)
        return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
function buildCsvRow(values) {
    return values.map(csvEscape).join(',');
}
/**
 * Sanitize description for catalog: strip markdown, limit length.
 * Meta accepts up to 5000 chars for description.
 */
function sanitizeDescription(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);
}
exports.catalog = (0, https_1.onRequest)({ region: 'europe-west1', memory: '256MiB' }, async (_req, res) => {
    try {
        const db = admin.firestore();
        const snap = await db
            .collection('formations')
            .where('status', '==', 'published')
            .get();
        const formations = snap.docs.map((d) => (Object.assign({ id: d.id }, d.data())));
        // Meta Catalog CSV header (Facebook Commerce spec)
        const headers = [
            'id',
            'title',
            'description',
            'availability',
            'condition',
            'price',
            'link',
            'image_link',
            'brand',
            'sale_price',
            'product_type',
            'google_product_category',
        ];
        const rows = [headers.join(',')];
        for (const f of formations) {
            const fullPrice = `${f.price} ${CURRENCY}`;
            const salePrice = f.promoPrice ? `${f.promoPrice} ${CURRENCY}` : '';
            rows.push(buildCsvRow([
                f.id,
                f.title,
                sanitizeDescription(f.description || ''),
                'in stock',
                'new',
                fullPrice,
                `${SITE_URL}/formations/${f.slug}`,
                f.coverImage || DEFAULT_OG_IMAGE,
                BRAND,
                salePrice,
                f.category || 'Formation',
                'Online Course', // Google product taxonomy proxy
            ]));
        }
        const csv = rows.join('\n');
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.set('Content-Disposition', 'inline; filename="catalog.csv"');
        res.status(200).send(csv);
    }
    catch (error) {
        console.error('Catalog generation error:', error);
        res.status(500).set('Content-Type', 'text/plain').send('Catalog generation failed');
    }
});
//# sourceMappingURL=catalog.js.map