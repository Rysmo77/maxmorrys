import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const spotifyClientId = defineSecret('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = defineSecret('SPOTIFY_CLIENT_SECRET');

const SECRETS = [spotifyClientId, spotifyClientSecret];

// ID public de l'émission Spotify (visible dans l'URL open.spotify.com/show/<id>).
const SHOW_ID = '5WV1QSOWsOBZoddNyPxwjc';

interface SpotifyEpisode {
  id: string;
  name: string;
  description?: string;
  duration_ms?: number;
  release_date?: string;
  images?: { url: string }[];
  external_urls?: { spotify?: string };
}

interface ImportResult {
  fetched: number;
  created: number;
  skipped: number;
  errors: string[];
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'episode';
}

function msToDuration(ms?: number): string {
  if (!ms || ms <= 0) return '';
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function toIso(releaseDate?: string): string {
  if (!releaseDate) return new Date().toISOString();
  const d = new Date(releaseDate);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string | null> {
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

async function fetchAllEpisodes(showId: string, token: string, errors: string[]): Promise<SpotifyEpisode[]> {
  const episodes: SpotifyEpisode[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/shows/${encodeURIComponent(showId)}/episodes?market=FR&limit=50`;
  // Pagination Spotify : suit le champ `next` jusqu'à épuisement.
  while (url) {
    const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.error) {
      errors.push(`Spotify API: ${data.error.message || JSON.stringify(data.error)}`);
      break;
    }
    for (const ep of data.items || []) {
      if (ep && ep.id) episodes.push(ep as SpotifyEpisode);
    }
    url = data.next || null;
  }
  return episodes;
}

async function runImport(): Promise<ImportResult> {
  const db = admin.firestore();
  const errors: string[] = [];
  const result: ImportResult = { fetched: 0, created: 0, skipped: 0, errors };

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
  const usedSlugs = new Set<string>(existingSnap.docs.map((d) => d.data().slug).filter(Boolean));

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
      if (usedSlugs.has(slug)) slug = `${slug}-${ep.id.slice(0, 6).toLowerCase()}`;
      usedSlugs.add(slug);

      await ref.set({
        title: ep.name,
        slug,
        description: ep.description || '',
        audioUrl: ep.external_urls?.spotify || `https://open.spotify.com/episode/${ep.id}`,
        coverImage: ep.images?.[0]?.url || '',
        duration: msToDuration(ep.duration_ms),
        publishedAt: toIso(ep.release_date),
        updatedAt: new Date().toISOString(),
        category: 'Podcast',
        status: 'draft', // l'admin relit puis publie
        spotifyEpisodeId: ep.id,
      });
      result.created++;
    } catch (err) {
      errors.push(`Episode ${ep.id} failed: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  return result;
}

// ── Import quotidien à 04:00 UTC (après la sync stats de 03:00) ───────────────
export const importSpotifyEpisodes = onSchedule(
  { schedule: '0 4 * * *', secrets: SECRETS, region: 'us-central1' },
  async () => {
    const r = await runImport();
    console.log('importSpotifyEpisodes result', r);
  },
);

// ── Déclencheur manuel (admin uniquement) ─────────────────────────────────────
export const importSpotifyEpisodesManual = onCall(
  { region: 'us-central1', secrets: SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    return await runImport();
  },
);
