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
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
/**
 * Extract Storage object path from a download URL.
 * Firebase Storage URLs look like:
 *   https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
 */
function extractStoragePath(url) {
    if (!url || typeof url !== 'string')
        return null;
    try {
        const match = url.match(/\/o\/([^?]+)/);
        if (!match)
            return null;
        return decodeURIComponent(match[1]);
    }
    catch (_a) {
        return null;
    }
}
async function deleteStorageFile(url, context) {
    const path = extractStoragePath(url);
    if (!path)
        return;
    try {
        await admin.storage().bucket().file(path).delete();
        console.log(`${context}: deleted storage file`, path);
    }
    catch (error) {
        const err = error;
        if (err.code === 404)
            return;
        console.warn(`${context}: failed to delete storage file`, path, error);
    }
}
/**
 * Delete the cover image of a blog post when the Firestore doc is removed.
 */
exports.onBlogDeleted = (0, firestore_1.onDocumentDeleted)('blog/{postId}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await deleteStorageFile(data.coverImage, 'onBlogDeleted');
});
/**
 * Delete formation cover + lesson videos when a formation is removed.
 */
exports.onFormationDeleted = (0, firestore_1.onDocumentDeleted)('formations/{formationId}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await deleteStorageFile(data.coverImage, 'onFormationDeleted');
    const modules = Array.isArray(data.modules) ? data.modules : [];
    for (const mod of modules) {
        const lessons = Array.isArray(mod === null || mod === void 0 ? void 0 : mod.lessons) ? mod.lessons : [];
        for (const lesson of lessons) {
            if (lesson === null || lesson === void 0 ? void 0 : lesson.videoUrl) {
                await deleteStorageFile(lesson.videoUrl, 'onFormationDeleted');
            }
        }
    }
});
/**
 * Delete video thumbnail when a video doc is removed.
 */
exports.onVideoDeleted = (0, firestore_1.onDocumentDeleted)('videos/{videoId}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await deleteStorageFile(data.thumbnail, 'onVideoDeleted');
    await deleteStorageFile(data.coverImage, 'onVideoDeleted');
});
/**
 * Delete podcast cover when a podcast doc is removed.
 */
exports.onPodcastDeleted = (0, firestore_1.onDocumentDeleted)('podcasts/{podcastId}', async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    await deleteStorageFile(data.coverImage, 'onPodcastDeleted');
    await deleteStorageFile(data.thumbnail, 'onPodcastDeleted');
});
//# sourceMappingURL=storage-cleanup.js.map