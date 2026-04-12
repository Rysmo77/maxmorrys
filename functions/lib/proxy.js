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
exports.youtubeProxy = exports.spotifyProxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const spotifyClientId = (0, params_1.defineSecret)('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = (0, params_1.defineSecret)('SPOTIFY_CLIENT_SECRET');
const youtubeApiKey = (0, params_1.defineSecret)('YOUTUBE_API_KEY');
// ── Spotify Proxy (admin-only) ──────────────────────────────────────────────
exports.spotifyProxy = (0, https_1.onCall)({ region: 'us-central1', secrets: [spotifyClientId, spotifyClientSecret] }, async (request) => {
    var _a, _b, _c, _d;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { episodeId } = request.data;
    if (!episodeId || typeof episodeId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'episodeId est obligatoire.');
    }
    const clientId = spotifyClientId.value();
    const clientSecret = spotifyClientSecret.value();
    if (!clientId || !clientSecret) {
        throw new https_1.HttpsError('internal', 'Identifiants Spotify non configurés.');
    }
    try {
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            throw new https_1.HttpsError('internal', "Erreur d'authentification Spotify.");
        }
        const epRes = await fetch(`https://api.spotify.com/v1/episodes/${episodeId}?market=FR`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const ep = await epRes.json();
        if (ep.error) {
            throw new https_1.HttpsError('not-found', `Erreur Spotify : ${ep.error.message}`);
        }
        return {
            name: ep.name,
            description: ep.description,
            coverImage: (_d = (_c = (_b = ep.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) !== null && _d !== void 0 ? _d : '',
            durationMs: ep.duration_ms,
            releaseDate: ep.release_date,
        };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Impossible de récupérer les infos Spotify.');
    }
});
// ── YouTube Proxy (admin-only) ──────────────────────────────────────────────
exports.youtubeProxy = (0, https_1.onCall)({ region: 'us-central1', secrets: [youtubeApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { videoId } = request.data;
    if (!videoId || typeof videoId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'videoId est obligatoire.');
    }
    const apiKey = youtubeApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Clé API YouTube non configurée.');
    }
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=snippet,contentDetails,statistics&key=${apiKey}`);
        const data = await res.json();
        if (data.error) {
            throw new https_1.HttpsError('internal', `Erreur API YouTube : ${data.error.message}`);
        }
        const item = (_b = data.items) === null || _b === void 0 ? void 0 : _b[0];
        if (!item) {
            throw new https_1.HttpsError('not-found', 'Vidéo YouTube introuvable ou privée.');
        }
        return {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: (_h = (_f = (_d = (_c = item.snippet.thumbnails.maxres) === null || _c === void 0 ? void 0 : _c.url) !== null && _d !== void 0 ? _d : (_e = item.snippet.thumbnails.high) === null || _e === void 0 ? void 0 : _e.url) !== null && _f !== void 0 ? _f : (_g = item.snippet.thumbnails.medium) === null || _g === void 0 ? void 0 : _g.url) !== null && _h !== void 0 ? _h : '',
            duration: item.contentDetails.duration,
            publishedAt: item.snippet.publishedAt,
            viewCount: (_k = (_j = item.statistics) === null || _j === void 0 ? void 0 : _j.viewCount) !== null && _k !== void 0 ? _k : '0',
        };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Impossible de récupérer les infos YouTube.');
    }
});
//# sourceMappingURL=proxy.js.map