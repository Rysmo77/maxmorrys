import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';

const spotifyClientId = defineSecret('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = defineSecret('SPOTIFY_CLIENT_SECRET');
const youtubeApiKey = defineSecret('YOUTUBE_API_KEY');

// ── Spotify Proxy (admin-only) ──────────────────────────────────────────────

export const spotifyProxy = onCall(
  { region: 'us-central1', secrets: [spotifyClientId, spotifyClientSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { episodeId } = request.data as { episodeId: string };
    if (!episodeId || typeof episodeId !== 'string') {
      throw new HttpsError('invalid-argument', 'episodeId est obligatoire.');
    }

    const clientId = spotifyClientId.value();
    const clientSecret = spotifyClientSecret.value();
    if (!clientId || !clientSecret) {
      throw new HttpsError('internal', 'Identifiants Spotify non configurés.');
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
        throw new HttpsError('internal', "Erreur d'authentification Spotify.");
      }

      const epRes = await fetch(`https://api.spotify.com/v1/episodes/${episodeId}?market=FR`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const ep = await epRes.json();
      if (ep.error) {
        throw new HttpsError('not-found', `Erreur Spotify : ${ep.error.message}`);
      }

      return {
        name: ep.name,
        description: ep.description,
        coverImage: ep.images?.[0]?.url ?? '',
        durationMs: ep.duration_ms,
        releaseDate: ep.release_date,
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Impossible de récupérer les infos Spotify.');
    }
  }
);

// ── YouTube Proxy (admin-only) ──────────────────────────────────────────────

export const youtubeProxy = onCall(
  { region: 'us-central1', secrets: [youtubeApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { videoId } = request.data as { videoId: string };
    if (!videoId || typeof videoId !== 'string') {
      throw new HttpsError('invalid-argument', 'videoId est obligatoire.');
    }

    const apiKey = youtubeApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'Clé API YouTube non configurée.');
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=snippet,contentDetails,statistics&key=${apiKey}`
      );
      const data = await res.json();
      if (data.error) {
        throw new HttpsError('internal', `Erreur API YouTube : ${data.error.message}`);
      }

      const item = data.items?.[0];
      if (!item) {
        throw new HttpsError('not-found', 'Vidéo YouTube introuvable ou privée.');
      }

      return {
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.maxres?.url
          ?? item.snippet.thumbnails.high?.url
          ?? item.snippet.thumbnails.medium?.url
          ?? '',
        duration: item.contentDetails.duration,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics?.viewCount ?? '0',
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Impossible de récupérer les infos YouTube.');
    }
  }
);
