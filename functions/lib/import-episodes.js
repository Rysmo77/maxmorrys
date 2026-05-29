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
exports.importSpotifyEpisodesManual = exports.importSpotifyEpisodes = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const spotifyClientId = (0, params_1.defineSecret)('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = (0, params_1.defineSecret)('SPOTIFY_CLIENT_SECRET');
const SECRETS = [spotifyClientId, spotifyClientSecret];
// ID public de l'émission Spotify (visible dans l'URL open.spotify.com/show/<id>).
const SHOW_ID = '5WV1QSOWsOBZoddNyPxwjc';
function slugify(input) {
    return input
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'episode';
}
function msToDuration(ms) {
    if (!ms || ms <= 0)
        return '';
    const totalSec = Math.round(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function toIso(releaseDate) {
    if (!releaseDate)
        return new Date().toISOString();
    const d = new Date(releaseDate);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
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
async function fetchAllEpisodes(showId, token, errors) {
    const episodes = [];
    let url = `https://api.spotify.com/v1/shows/${encodeURIComponent(showId)}/episodes?market=FR&limit=50`;
    // Pagination Spotify : suit le champ `next` jusqu'à épuisement.
    while (url) {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.error) {
            errors.push(`Spotify API: ${data.error.message || JSON.stringify(data.error)}`);
            break;
        }
        for (const ep of data.items || []) {
            if (ep && ep.id)
                episodes.push(ep);
        }
        url = data.next || null;
    }
    return episodes;
}
async function runImport() {
    var _a, _b, _c;
    const db = admin.firestore();
    const errors = [];
    const result = { fetched: 0, created: 0, skipped: 0, errors };
    const clientId = spotifyClientId.value();
    const clientSecret = spotifyClientSecret.value();
    if (!clientId || !clientSecret) {
        errors.push('SPOTIFY_CLIENT_ID/SECRET not configured');
        return result;
    }
    const token = await getSpotifyToken(clientId, clientSecret);
    if (!token) {
        errors.push('Spotify token request failed');
        return result;
    }
    const episodes = await fetchAllEpisodes(SHOW_ID, token, errors);
    result.fetched = episodes.length;
    // Slugs déjà présents (toutes sources) pour éviter les collisions.
    const existingSnap = await db.collection('podcasts').select('slug').get();
    const usedSlugs = new Set(existingSnap.docs.map((d) => d.data().slug).filter(Boolean));
    for (const ep of episodes) {
        try {
            // Dédup : id de document déterministe basé sur l'id d'épisode Spotify.
            const docId = `sp_${ep.id}`;
            const ref = db.collection('podcasts').doc(docId);
            const snap = await ref.get();
            if (snap.exists) {
                result.skipped++;
                continue;
            }
            let slug = slugify(ep.name);
            if (usedSlugs.has(slug))
                slug = `${slug}-${ep.id.slice(0, 6).toLowerCase()}`;
            usedSlugs.add(slug);
            await ref.set({
                title: ep.name,
                slug,
                description: ep.description || '',
                audioUrl: ((_a = ep.external_urls) === null || _a === void 0 ? void 0 : _a.spotify) || `https://open.spotify.com/episode/${ep.id}`,
                coverImage: ((_c = (_b = ep.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) || '',
                duration: msToDuration(ep.duration_ms),
                publishedAt: toIso(ep.release_date),
                updatedAt: new Date().toISOString(),
                category: 'Podcast',
                status: 'draft', // l'admin relit puis publie
                spotifyEpisodeId: ep.id,
            });
            result.created++;
        }
        catch (err) {
            errors.push(`Episode ${ep.id} failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
    }
    return result;
}
// ── Import quotidien à 04:00 UTC (après la sync stats de 03:00) ───────────────
exports.importSpotifyEpisodes = (0, scheduler_1.onSchedule)({ schedule: '0 4 * * *', secrets: SECRETS, region: 'us-central1' }, async () => {
    const r = await runImport();
    console.log('importSpotifyEpisodes result', r);
});
// ── Déclencheur manuel (admin uniquement) ─────────────────────────────────────
exports.importSpotifyEpisodesManual = (0, https_1.onCall)({ region: 'us-central1', secrets: SECRETS }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    return await runImport();
});
//# sourceMappingURL=import-episodes.js.map