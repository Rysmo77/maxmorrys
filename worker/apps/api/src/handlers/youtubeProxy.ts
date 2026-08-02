import { HttpsError } from '@mm/shared';

import { type CallContext, requireAdmin } from '../context';

/** Port de `youtubeProxy` — fiche d'une vidéo YouTube, réservé aux admins. */

interface YoutubeResponse {
  error?: { message?: string };
  items?: Array<{
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: Record<string, { url?: string } | undefined>;
    };
    contentDetails: { duration: string };
    statistics?: { viewCount?: string };
  }>;
}

export async function youtubeProxy(data: unknown, context: CallContext): Promise<unknown> {
  await requireAdmin(context);

  const { videoId } = (data ?? {}) as { videoId?: unknown };
  if (!videoId || typeof videoId !== 'string') {
    throw new HttpsError('invalid-argument', 'videoId est obligatoire.');
  }

  const apiKey = context.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new HttpsError('internal', 'Clé API YouTube non configurée.');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}` +
        `&part=snippet,contentDetails,statistics&key=${apiKey}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    const body = (await response.json()) as YoutubeResponse;
    if (body.error) {
      throw new HttpsError('internal', `Erreur API YouTube : ${body.error.message}`);
    }

    const item = body.items?.[0];
    if (!item) {
      throw new HttpsError('not-found', 'Vidéo YouTube introuvable ou privée.');
    }

    const { thumbnails } = item.snippet;
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        thumbnails.maxres?.url ?? thumbnails.high?.url ?? thumbnails.medium?.url ?? '',
      duration: item.contentDetails.duration,
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics?.viewCount ?? '0',
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) throw error;
    console.error('youtubeProxy — échec non typé :', error);
    throw new HttpsError('internal', 'Impossible de récupérer les infos YouTube.');
  }
}
