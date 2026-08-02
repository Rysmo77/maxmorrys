import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';

/** Port de `spotifyProxy` — fiche d'un épisode Spotify, réservé aux admins. */

interface SpotifyEpisode {
  name?: string;
  description?: string;
  images?: Array<{ url?: string }>;
  duration_ms?: number;
  release_date?: string;
  error?: { message?: string };
}

export async function spotifyProxy(data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const { episodeId } = (data ?? {}) as { episodeId?: unknown };
  if (!episodeId || typeof episodeId !== 'string') {
    throw new HttpsError('invalid-argument', 'episodeId est obligatoire.');
  }

  const clientId = context.env.SPOTIFY_CLIENT_ID;
  const clientSecret = context.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new HttpsError('internal', 'Identifiants Spotify non configurés.');
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // `Buffer.from(...).toString('base64')` n'existe pas sur Workers.
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10_000),
    });
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new HttpsError('internal', "Erreur d'authentification Spotify.");
    }

    const episodeResponse = await fetch(
      `https://api.spotify.com/v1/episodes/${encodeURIComponent(episodeId)}?market=FR`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const episode = (await episodeResponse.json()) as SpotifyEpisode;
    if (episode.error) {
      throw new HttpsError('not-found', `Erreur Spotify : ${episode.error.message}`);
    }

    return {
      name: episode.name,
      description: episode.description,
      coverImage: episode.images?.[0]?.url ?? '',
      durationMs: episode.duration_ms,
      releaseDate: episode.release_date,
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Impossible de récupérer les infos Spotify.');
  }
}
