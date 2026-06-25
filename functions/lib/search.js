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
 * Indexation Meilisearch — entièrement « gated » par secrets.
 *
 * Callable ADMIN, déclenché manuellement (jamais automatiquement) : il (ré)indexe
 * le contenu publié (blog, formations, vidéos, podcasts) dans Meilisearch. Tant que
 * les secrets `MEILISEARCH_HOST` / `MEILISEARCH_ADMIN_KEY` ne sont pas configurés,
 * la fonction renvoie une erreur claire et ne touche à rien.
 *
 * On dialogue avec l'API REST Meilisearch via `fetch` (global sur Node 18+) pour
 * éviter d'embarquer une dépendance SDK supplémentaire dans les functions.
 *
 * Configuration (une fois l'instance Meilisearch provisionnée) :
 *   firebase functions:secrets:set MEILISEARCH_HOST
 *   firebase functions:secrets:set MEILISEARCH_ADMIN_KEY
 *   firebase deploy --only functions:reindexSearch
 */
const meiliHost = (0, params_1.defineSecret)('MEILISEARCH_HOST');
const meiliAdminKey = (0, params_1.defineSecret)('MEILISEARCH_ADMIN_KEY');
const SPECS = [
    {
        index: 'blog',
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
        index: 'formations',
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
        index: 'videos',
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
        index: 'podcasts',
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
exports.reindexSearch = (0, https_1.onCall)({ region: 'us-central1', secrets: [meiliHost, meiliAdminKey] }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const host = (_b = meiliHost.value()) === null || _b === void 0 ? void 0 : _b.replace(/\/$/, '');
    const apiKey = meiliAdminKey.value();
    if (!host || !apiKey) {
        throw new https_1.HttpsError('failed-precondition', 'Meilisearch non configuré : définissez les secrets MEILISEARCH_HOST et MEILISEARCH_ADMIN_KEY.');
    }
    const meili = async (method, path, body) => {
        const res = await fetch(`${host}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        // 404 toléré sur les suppressions (index/documents pas encore créés).
        if (!res.ok && res.status !== 404) {
            const text = await res.text();
            throw new https_1.HttpsError('internal', `Meilisearch ${method} ${path} → ${res.status}: ${text}`);
        }
        return res;
    };
    const db = admin.firestore();
    const counts = {};
    for (const spec of SPECS) {
        const snap = await db
            .collection(spec.collection)
            .where('status', '==', 'published')
            .get();
        const docs = snap.docs.map((doc) => spec.map(doc.id, doc.data()));
        // Crée l'index si absent (ignore le conflit s'il existe déjà), puis règle les attributs.
        await meili('POST', '/indexes', { uid: spec.index, primaryKey: 'id' });
        await meili('PATCH', `/indexes/${spec.index}/settings`, {
            searchableAttributes: ['title', 'excerpt', 'category', 'tags'],
            filterableAttributes: ['category'],
            sortableAttributes: ['publishedAt'],
        });
        // Réindexation complète : on purge avant d'ajouter pour retirer les docs dépubliés.
        await meili('DELETE', `/indexes/${spec.index}/documents`);
        if (docs.length > 0) {
            await meili('POST', `/indexes/${spec.index}/documents?primaryKey=id`, docs);
        }
        counts[spec.index] = docs.length;
    }
    return { success: true, counts };
});
//# sourceMappingURL=search.js.map