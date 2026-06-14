import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const youtubeApiKey = defineSecret('YOUTUBE_API_KEY');
const spotifyClientId = defineSecret('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = defineSecret('SPOTIFY_CLIENT_SECRET');

const SECRETS = [youtubeApiKey, spotifyClientId, spotifyClientSecret];

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractSpotifyEpisodeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:open\.spotify\.com|embed\.spotify\.com)\/(?:embed\/)?episode\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Read an entire collection in bounded pages to avoid one unbounded `.get()`. */
async function readAllDocs(
  col: FirebaseFirestore.CollectionReference,
  pageSize = 300,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  while (true) {
    let q = col.orderBy('__name__').limit(pageSize);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    docs.push(...snap.docs);
    if (snap.size < pageSize) break;
    last = snap.docs[snap.docs.length - 1];
  }
  return docs;
}

interface SyncResult {
  videosProcessed: number;
  videosUpdated: number;
  podcastsProcessed: number;
  podcastsUpdated: number;
  errors: string[];
}

async function syncYoutubeViews(db: FirebaseFirestore.Firestore, apiKey: string, errors: string[]) {
  const docs = await readAllDocs(db.collection('videos'));
  const pairs: { docId: string; ytId: string }[] = [];
  for (const d of docs) {
    const ytId = extractYoutubeId(d.data().videoUrl || '');
    if (ytId) pairs.push({ docId: d.id, ytId });
  }

  let updated = 0;
  for (const group of chunk(pairs, 50)) {
    const ids = group.map((p) => p.ytId).join(',');
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(ids)}&key=${apiKey}`,
      );
      const data = await res.json();
      if (data.error) {
        errors.push(`YouTube API: ${data.error.message}`);
        continue;
      }
      const byId = new Map<string, number>();
      for (const item of data.items || []) {
        byId.set(item.id, parseInt(item.statistics?.viewCount || '0', 10));
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
    } catch (err) {
      errors.push(`YouTube batch failed: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  return { processed: pairs.length, updated };
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

async function syncSpotifyPopularity(
  db: FirebaseFirestore.Firestore,
  token: string,
  errors: string[],
) {
  const docs = await readAllDocs(db.collection('podcasts'));
  const pairs: { docId: string; spId: string }[] = [];
  for (const d of docs) {
    const spId = extractSpotifyEpisodeId(d.data().audioUrl || '');
    if (spId) pairs.push({ docId: d.id, spId });
  }

  let updated = 0;
  for (const group of chunk(pairs, 50)) {
    const ids = group.map((p) => p.spId).join(',');
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/episodes?ids=${encodeURIComponent(ids)}&market=FR`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
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
    } catch (err) {
      errors.push(`Spotify batch failed: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  return { processed: pairs.length, updated };
}

async function runSync(): Promise<SyncResult> {
  const db = admin.firestore();
  const errors: string[] = [];
  const result: SyncResult = {
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
  } else {
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
    } else {
      errors.push('Spotify token request failed');
    }
  } else {
    errors.push('SPOTIFY_CLIENT_ID/SECRET not configured');
  }

  return result;
}

// ── Scheduled daily sync at 03:00 UTC ────────────────────────────────────────
export const syncMediaStats = onSchedule(
  { schedule: '0 3 * * *', secrets: SECRETS, region: 'us-central1' },
  async () => {
    const r = await runSync();
    console.log('syncMediaStats result', r);
  },
);

// ── Manual trigger (admin-only) ──────────────────────────────────────────────
export const syncMediaStatsManual = onCall(
  { region: 'us-central1', secrets: SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    return await runSync();
  },
);
