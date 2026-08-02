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
exports.onPodcastDeleted = exports.onVideoDeleted = exports.onFormationDeleted = exports.onBlogDeleted = void 0;
exports.extractTarget = extractTarget;
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
/**
 * Nettoyage des médias lors de la suppression d'un contenu.
 *
 * Les objets vivent désormais sur Cloudflare R2, mais ces triggers tournent sur
 * GCP et n'ont aucun accès à R2 : ils délèguent la suppression au Worker
 * `media-api`, qui possède le binding. Les URLs Firebase Storage historiques
 * restent supprimées directement.
 *
 * ⚠️ Historique du bug corrigé ici : l'extraction de chemin ne reconnaissait que
 * la forme `firebasestorage…/o/{path}` et retournait `null` sur une URL R2, sans
 * erreur ni log. Depuis la bascule des uploads vers R2, chaque suppression de
 * contenu laissait donc un objet orphelin — silencieusement.
 */
const mediaDeleteKey = (0, params_1.defineSecret)('MEDIA_DELETE_KEY');
const MEDIA_API_URL = 'https://media-api.maxmorrys.me';
const R2_PUBLIC_HOST = 'media.maxmorrys.me';
/**
 * Reconnaît les trois formes d'URL rencontrées en base.
 *
 * - `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?…` (historique)
 * - `https://storage.googleapis.com/{bucket}/{path}` (écrites par renderSocialCard)
 * - `https://media.maxmorrys.me/{key}` (R2, forme actuelle)
 */
function extractTarget(url) {
    if (typeof url !== 'string' || !url)
        return null;
    try {
        const parsed = new URL(url);
        if (parsed.hostname === R2_PUBLIC_HOST) {
            const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
            return key ? { store: 'r2', path: key } : null;
        }
        if (parsed.hostname === 'firebasestorage.googleapis.com') {
            const match = parsed.pathname.match(/\/o\/(.+)$/);
            return match ? { store: 'gcs', path: decodeURIComponent(match[1]) } : null;
        }
        if (parsed.hostname === 'storage.googleapis.com') {
            // /{bucket}/{path…} — on retire le segment de bucket.
            const segments = parsed.pathname.replace(/^\/+/, '').split('/');
            segments.shift();
            const path = decodeURIComponent(segments.join('/'));
            return path ? { store: 'gcs', path } : null;
        }
        return null;
    }
    catch (_a) {
        return null;
    }
}
async function deleteFromR2(keys, context) {
    if (keys.length === 0)
        return;
    const key = mediaDeleteKey.value();
    if (!key) {
        console.warn(`${context}: MEDIA_DELETE_KEY absent, ${keys.length} objet(s) R2 non supprimé(s)`);
        return;
    }
    try {
        const response = await fetch(`${MEDIA_API_URL}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Internal-Key': key },
            body: JSON.stringify({ keys }),
        });
        if (!response.ok) {
            console.warn(`${context}: suppression R2 refusée (${response.status})`, keys);
            return;
        }
        console.log(`${context}: ${keys.length} objet(s) R2 supprimé(s)`, keys);
    }
    catch (error) {
        console.warn(`${context}: suppression R2 impossible`, error);
    }
}
async function deleteFromGcs(paths, context) {
    for (const path of paths) {
        try {
            await admin.storage().bucket().file(path).delete();
            console.log(`${context}: objet GCS supprimé`, path);
        }
        catch (error) {
            const err = error;
            if (err.code === 404)
                continue;
            console.warn(`${context}: suppression GCS impossible`, path, error);
        }
    }
}
/** Supprime tous les objets référencés par les URLs fournies, quel que soit leur stockage. */
async function deleteMedia(urls, context) {
    const targets = urls.map(extractTarget).filter((t) => t !== null);
    if (targets.length === 0)
        return;
    await Promise.all([
        deleteFromR2(targets.filter((t) => t.store === 'r2').map((t) => t.path), context),
        deleteFromGcs(targets.filter((t) => t.store === 'gcs').map((t) => t.path), context),
    ]);
}
exports.onBlogDeleted = (0, firestore_1.onDocumentDeleted)({ document: 'blog/{postId}', secrets: [mediaDeleteKey] }, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await deleteMedia([data.coverImage, data.ogImage, data.twitterImage], 'onBlogDeleted');
});
exports.onFormationDeleted = (0, firestore_1.onDocumentDeleted)({ document: 'formations/{formationId}', secrets: [mediaDeleteKey] }, async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const urls = [data.coverImage, data.ogImage];
    const modules = Array.isArray(data.modules) ? data.modules : [];
    for (const mod of modules) {
        const lessons = Array.isArray(mod === null || mod === void 0 ? void 0 : mod.lessons) ? mod.lessons : [];
        for (const lesson of lessons) {
            urls.push(lesson === null || lesson === void 0 ? void 0 : lesson.videoUrl);
            const resources = Array.isArray(lesson === null || lesson === void 0 ? void 0 : lesson.resources) ? lesson.resources : [];
            for (const resource of resources)
                urls.push((_b = resource === null || resource === void 0 ? void 0 : resource.url) !== null && _b !== void 0 ? _b : resource);
        }
    }
    await deleteMedia(urls, 'onFormationDeleted');
});
exports.onVideoDeleted = (0, firestore_1.onDocumentDeleted)({ document: 'videos/{videoId}', secrets: [mediaDeleteKey] }, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    // `thumbnail` n'existe pas sur ces documents — le champ réel est `thumbnailUrl`.
    // Il était seul référencé ici, donc aucune vignette n'était jamais supprimée.
    await deleteMedia([data.thumbnailUrl, data.coverImage, data.ogImage], 'onVideoDeleted');
});
exports.onPodcastDeleted = (0, firestore_1.onDocumentDeleted)({ document: 'podcasts/{podcastId}', secrets: [mediaDeleteKey] }, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await deleteMedia([data.coverImage, data.ogImage, data.thumbnailUrl], 'onPodcastDeleted');
});
//# sourceMappingURL=storage-cleanup.js.map