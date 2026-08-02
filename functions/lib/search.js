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
exports.reindexSearch = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
/**
 * Indexation Typesense — entièrement « gated » par secrets.
 *
 * Callable ADMIN, déclenché manuellement (jamais automatiquement) : il (ré)indexe
 * le contenu publié (blog, formations, vidéos, podcasts) dans Typesense. Tant que
 * les secrets `TYPESENSE_URL` / `TYPESENSE_ADMIN_KEY` ne sont pas configurés, la
 * fonction renvoie une erreur claire et ne touche à rien.
 *
 * On dialogue avec l'API REST Typesense via `fetch` (global sur Node 18+) pour
 * éviter d'embarquer une dépendance SDK supplémentaire dans les functions.
 *
 * Configuration (une fois l'instance Typesense provisionnée) :
 *   firebase functions:secrets:set TYPESENSE_URL        # ex: https://xxx.a1.typesense.net:443
 *   firebase functions:secrets:set TYPESENSE_ADMIN_KEY
 *   firebase deploy --only functions:reindexSearch
 */
const typesenseUrl = (0, params_1.defineSecret)('TYPESENSE_URL');
const typesenseAdminKey = (0, params_1.defineSecret)('TYPESENSE_ADMIN_KEY');
const SPECS = [
    {
        name: 'blog',
        collection: 'blog',
        map: (id, d) => {
            var _a, _b, _c;
            return ({
                id, title: (_a = d.title) !== null && _a !== void 0 ? _a : '', excerpt: (_b = d.excerpt) !== null && _b !== void 0 ? _b : '', slug: (_c = d.slug) !== null && _c !== void 0 ? _c : '',
                slug_en: d.slug_en, category: d.category, tags: d.tags, publishedAt: d.publishedAt,
            });
        },
    },
    {
        name: 'formations',
        collection: 'formations',
        map: (id, d) => {
            var _a, _b, _c;
            return ({
                id, title: (_a = d.title) !== null && _a !== void 0 ? _a : '', excerpt: (_b = d.description) !== null && _b !== void 0 ? _b : '', slug: (_c = d.slug) !== null && _c !== void 0 ? _c : '',
                slug_en: d.slug_en, category: d.category, tags: d.tags, publishedAt: d.publishedAt,
            });
        },
    },
    {
        name: 'videos',
        collection: 'videos',
        map: (id, d) => {
            var _a, _b, _c;
            return ({
                id, title: (_a = d.title) !== null && _a !== void 0 ? _a : '', excerpt: (_b = d.description) !== null && _b !== void 0 ? _b : '', slug: (_c = d.slug) !== null && _c !== void 0 ? _c : '',
                slug_en: d.slug_en, category: d.category, publishedAt: d.publishedAt,
            });
        },
    },
    {
        name: 'podcasts',
        collection: 'podcasts',
        map: (id, d) => {
            var _a, _b, _c;
            return ({
                id, title: (_a = d.title) !== null && _a !== void 0 ? _a : '', excerpt: (_b = d.description) !== null && _b !== void 0 ? _b : '', slug: (_c = d.slug) !== null && _c !== void 0 ? _c : '',
                slug_en: d.slug_en, category: d.category, publishedAt: d.publishedAt,
            });
        },
    },
];
// Schéma Typesense (typé explicitement, contrairement à Meilisearch). Les champs
// optionnels sont marqués `optional` pour tolérer les docs sans catégorie/tags.
const SCHEMA_FIELDS = [
    { name: 'title', type: 'string' },
    { name: 'excerpt', type: 'string', optional: true },
    { name: 'slug', type: 'string' },
    { name: 'slug_en', type: 'string', optional: true },
    { name: 'category', type: 'string', facet: true, optional: true },
    { name: 'tags', type: 'string[]', facet: true, optional: true },
    { name: 'publishedAt', type: 'string', optional: true, sort: true },
];
exports.reindexSearch = (0, https_1.onCall)({ region: 'us-central1', secrets: [typesenseUrl, typesenseAdminKey] }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const baseUrl = (_b = typesenseUrl.value()) === null || _b === void 0 ? void 0 : _b.replace(/\/$/, '');
    const apiKey = typesenseAdminKey.value();
    if (!baseUrl || !apiKey) {
        throw new https_1.HttpsError('failed-precondition', 'Typesense non configuré : définissez les secrets TYPESENSE_URL et TYPESENSE_ADMIN_KEY.');
    }
    const ts = async (method, path, body, contentType = 'application/json') => {
        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                'X-TYPESENSE-API-KEY': apiKey,
                'Content-Type': contentType,
            },
            body: body === undefined
                ? undefined
                : typeof body === 'string' ? body : JSON.stringify(body),
        });
        const text = await res.text();
        // 404 toléré (collection pas encore créée lors du DELETE initial).
        if (!res.ok && res.status !== 404) {
            throw new https_1.HttpsError('internal', `Typesense ${method} ${path} → ${res.status}: ${text}`);
        }
        return { status: res.status, text };
    };
    const db = admin.firestore();
    const counts = {};
    for (const spec of SPECS) {
        const snap = await db
            .collection(spec.collection)
            .where('status', '==', 'published')
            .get();
        const docs = snap.docs.map((doc) => spec.map(doc.id, doc.data()));
        // Réindexation complète : on drop puis recrée la collection (purge des dépubliés + schéma à jour).
        await ts('DELETE', `/collections/${spec.name}`);
        await ts('POST', '/collections', { name: spec.name, fields: SCHEMA_FIELDS });
        if (docs.length > 0) {
            // Import Typesense = JSONL (une ligne JSON par doc), pas un tableau.
            const jsonl = docs.map((d) => JSON.stringify(d)).join('\n');
            await ts('POST', `/collections/${spec.name}/documents/import?action=create`, jsonl, 'text/plain');
        }
        counts[spec.name] = docs.length;
    }
    return { success: true, counts };
});
//# sourceMappingURL=search.js.map