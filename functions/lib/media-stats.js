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
exports.syncMediaStatsManual = exports.syncMediaStats = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const youtubeApiKey = (0, params_1.defineSecret)('YOUTUBE_API_KEY');
const spotifyClientId = (0, params_1.defineSecret)('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = (0, params_1.defineSecret)('SPOTIFY_CLIENT_SECRET');
const SECRETS = [youtubeApiKey, spotifyClientId, spotifyClientSecret];
function extractYoutubeId(url) {
    if (!url)
        return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}
function extractSpotifyEpisodeId(url) {
    if (!url)
        return null;
    const m = url.match(/(?:open\.spotify\.com|embed\.spotify\.com)\/(?:embed\/)?episode\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
}
function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
    return out;
}
/** Read an entire collection in bounded pages to avoid one unbounded `.get()`. */
async function readAllDocs(col, pageSize = 300) {
    const docs = [];
    let last = null;
    while (true) {
        let q = col.orderBy('__name__').limit(pageSize);
        if (last)
            q = q.startAfter(last);
        const snap = await q.get();
        if (snap.empty)
            break;
        docs.push(...snap.docs);
        if (snap.size < pageSize)
            break;
        last = snap.docs[snap.docs.length - 1];
    }
    return docs;
}
async function syncYoutubeViews(db, apiKey, errors) {
    var _a;
    const docs = await readAllDocs(db.collection('videos'));
    const pairs = [];
    for (const d of docs) {
        const ytId = extractYoutubeId(d.data().videoUrl || '');
        if (ytId)
            pairs.push({ docId: d.id, ytId });
    }
    let updated = 0;
    for (const group of chunk(pairs, 50)) {
        const ids = group.map((p) => p.ytId).join(',');
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(ids)}&key=${apiKey}`);
            const data = await res.json();
            if (data.error) {
                errors.push(`YouTube API: ${data.error.message}`);
                continue;
            }
            const byId = new Map();
            for (const item of data.items || []) {
                byId.set(item.id, parseInt(((_a = item.statistics) === null || _a === void 0 ? void 0 : _a.viewCount) || '0', 10));
            }
            const batch = db.batch();
            for (const { docId, ytId } of group) {
                const views = byId.get(ytId);
                if (typeof views === 'number') {
                    batch.update(db.collection('videos').doc(docId), { views });
                    updated++;
                }
            }
            await batch.commit();
        }
        catch (err) {
            errors.push(`YouTube batch failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
    }
    return { processed: pairs.length, updated };
}
async function getSpotifyToken(clientId, clientSecret) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    return data.access_token || null;
}
async function syncSpotifyPopularity(db, token, errors) {
    const docs = await readAllDocs(db.collection('podcasts'));
    const pairs = [];
    for (const d of docs) {
        const spId = extractSpotifyEpisodeId(d.data().audioUrl || '');
        if (spId)
            pairs.push({ docId: d.id, spId });
    }
    let updated = 0;
    for (const group of chunk(pairs, 50)) {
        const ids = group.map((p) => p.spId).join(',');
        try {
            const res = await fetch(`https://api.spotify.com/v1/episodes?ids=${encodeURIComponent(ids)}&market=FR`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.error) {
                errors.push(`Spotify API: ${data.error.message}`);
                continue;
            }
            const batch = db.batch();
            const episodes = data.episodes || [];
            for (let i = 0; i < group.length; i++) {
                const ep = episodes[i];
                if (ep && typeof ep.popularity === 'number') {
                    batch.update(db.collection('podcasts').doc(group[i].docId), { popularity: ep.popularity });
                    updated++;
                }
            }
            await batch.commit();
        }
        catch (err) {
            errors.push(`Spotify batch failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
    }
    return { processed: pairs.length, updated };
}
async function runSync() {
    const db = admin.firestore();
    const errors = [];
    const result = {
        videosProcessed: 0,
        videosUpdated: 0,
        podcastsProcessed: 0,
        podcastsUpdated: 0,
        errors,
    };
    const ytKey = youtubeApiKey.value();
    if (ytKey) {
        const { processed, updated } = await syncYoutubeViews(db, ytKey, errors);
        result.videosProcessed = processed;
        result.videosUpdated = updated;
    }
    else {
        errors.push('YOUTUBE_API_KEY not configured');
    }
    const spId = spotifyClientId.value();
    const spSecret = spotifyClientSecret.value();
    if (spId && spSecret) {
        const token = await getSpotifyToken(spId, spSecret);
        if (token) {
            const { processed, updated } = await syncSpotifyPopularity(db, token, errors);
            result.podcastsProcessed = processed;
            result.podcastsUpdated = updated;
        }
        else {
            errors.push('Spotify token request failed');
        }
    }
    else {
        errors.push('SPOTIFY_CLIENT_ID/SECRET not configured');
    }
    return result;
}
// ── Scheduled daily sync at 03:00 UTC ────────────────────────────────────────
exports.syncMediaStats = (0, scheduler_1.onSchedule)({ schedule: '0 3 * * *', secrets: SECRETS, region: 'us-central1' }, async () => {
    const r = await runSync();
    console.log('syncMediaStats result', r);
});
// ── Manual trigger (admin-only) ──────────────────────────────────────────────
exports.syncMediaStatsManual = (0, https_1.onCall)({ region: 'us-central1', secrets: SECRETS }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    return await runSync();
});
//# sourceMappingURL=media-stats.js.map