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
exports.backfillSlugEn = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const translate_1 = require("./translate");
const googleAiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
const COLLECTIONS = ['blog', 'formations', 'podcasts', 'videos'];
const PER_CALL_LIMIT = 40; // borne le nombre de traductions par exécution
/** Slugify (équivalent serveur de src/lib/utils.ts). */
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // diacritiques combinants
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
/**
 * Backfill admin : génère `slug_en` pour les contenus publiés qui n'en ont pas,
 * en traduisant le titre (FR→EN) puis en le slugifiant. Idempotent, borné par exécution.
 * Relancer jusqu'à `updated: 0` pour tout couvrir.
 */
exports.backfillSlugEn = (0, https_1.onCall)({ region: 'us-central1', secrets: [googleAiKey], timeoutSeconds: 300 }, async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    const caller = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (((_a = caller.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Réservé aux administrateurs.');
    }
    const apiKey = googleAiKey.value();
    if (!apiKey)
        throw new https_1.HttpsError('internal', 'Service de traduction indisponible.');
    const db = admin.firestore();
    const report = {};
    let budget = PER_CALL_LIMIT;
    for (const col of COLLECTIONS) {
        if (budget <= 0)
            break;
        const snap = await db.collection(col).where('status', '==', 'published').get();
        // Docs publiés sans slug_en, avec un titre.
        const todo = snap.docs.filter((d) => {
            const data = d.data();
            return !data.slug_en && typeof data.title === 'string' && data.title.trim();
        }).slice(0, budget);
        if (todo.length === 0) {
            report[col] = 0;
            continue;
        }
        const titles = todo.map((d) => d.data().title);
        const translated = await (0, translate_1.translateBatch)(titles, 'en', apiKey);
        // Slugs déjà pris dans la collection (FR + EN) pour éviter les collisions.
        const taken = new Set();
        snap.docs.forEach((d) => {
            const data = d.data();
            if (data.slug)
                taken.add(data.slug);
            if (data.slug_en)
                taken.add(data.slug_en);
        });
        const batch = db.batch();
        todo.forEach((d, i) => {
            const base = slugify(translated[i] || titles[i]) || slugify(titles[i]) || d.id;
            let slug = base;
            let n = 2;
            while (taken.has(slug))
                slug = `${base}-${n++}`;
            taken.add(slug);
            batch.update(d.ref, { slug_en: slug });
        });
        await batch.commit();
        report[col] = todo.length;
        budget -= todo.length;
    }
    const updated = Object.values(report).reduce((a, b) => a + b, 0);
    return { updated, byCollection: report, hasMore: budget <= 0 };
});
//# sourceMappingURL=backfillSlugEn.js.map