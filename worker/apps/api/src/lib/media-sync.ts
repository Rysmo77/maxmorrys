import type { DocSnapshot, Firestore, Write } from '@mm/firestore-rest';

import type { Env } from '../env';
import { asText, toNumber } from './values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * PORT DE `import-episodes.ts` ET `media-stats.ts` — les deux dernières Cloud Functions
 * que le frontend appelait encore, alors qu'il n'y a plus AUCUNE fonction déployée.
 *
 * Elles n'étaient pas « à migrer un jour » : elles étaient CASSÉES. Les boutons « importer
 * depuis Spotify » et « synchroniser les statistiques » de l'admin partaient dans le relais
 * vers `FUNCTIONS_ORIGIN` et recevaient la page HTML 404 de Google.
 *
 * La logique vit ici plutôt que dans les handlers parce qu'elle a DEUX appelants : le
 * déclencheur manuel de l'admin, et le cron quotidien. Les deux versions planifiées
 * (03:00 pour les stats, 04:00 pour l'import) étaient mortes exactement de la même façon,
 * et les porter à moitié aurait laissé un bouton qui marche au-dessus d'une automatisation
 * qui ne tourne pas — la pire des deux situations, parce qu'elle se voit moins.
 *
 * ── CE QUI CHANGE EN PASSANT SUR WORKERS, ET POURQUOI ────────────────────────────────
 *
 * 1. `Buffer.from(...).toString('base64')` n'existe pas ici → `btoa`, comme `spotifyProxy`.
 *
 * 2. UN `get()` PAR ÉPISODE DEVIENT UNE LECTURE UNIQUE. L'original vérifiait l'existence
 *    de chaque épisode par un `get()` séparé : sur cent épisodes, cent sous-requêtes. Les
 *    Workers en plafonnent le nombre par requête, et l'import serait mort à mi-chemin sans
 *    rien dire. On lit la collection UNE fois, on en tire l'ensemble des identifiants et
 *    des slugs déjà pris, et on décide en mémoire. Le comportement est identique ; ce qui
 *    change, c'est qu'il tient dans le budget.
 *
 * 3. LES ÉCRITURES PARTENT EN LOTS BORNÉS. `commit` de Firestore refuse au-delà de 500
 *    écritures ; l'original s'en remettait au `batch()` du SDK admin, qui a la même borne.
 *    On découpe explicitement — un import de 600 épisodes ne doit pas échouer en entier
 *    à cause du 501e.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Identifiant public de l'émission (open.spotify.com/show/<id>). Repris tel quel. */
const SHOW_ID = '5WV1QSOWsOBZoddNyPxwjc';

/** Taille de page pour les lectures de collection. */
const PAGE = 300;

/** Borne d'un `commit` Firestore. Découper en deçà, jamais au-delà. */
const LOT_ECRITURE = 400;

/** Les API Spotify et YouTube acceptent 50 identifiants par appel. */
const LOT_API = 50;

export interface ImportResult {
  fetched: number;
  created: number;
  skipped: number;
  errors: string[];
}

export interface SyncResult {
  videosProcessed: number;
  videosUpdated: number;
  podcastsProcessed: number;
  podcastsUpdated: number;
  errors: string[];
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description?: string;
  duration_ms?: number;
  release_date?: string;
  images?: { url?: string }[];
  external_urls?: { spotify?: string };
}

function decouper<T>(liste: T[], taille: number): T[][] {
  const lots: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) lots.push(liste.slice(i, i + taille));
  return lots;
}

/** Équivalent de la `slugify` d'origine, diacritiques désignés par leur plage. */
function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'episode'
  );
}

function msVersDuree(ms?: number): string {
  if (!ms || ms <= 0) return '';
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const deux = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${deux(m)}:${deux(s)}` : `${m}:${deux(s)}`;
}

function versIso(date?: string): string {
  if (!date) return new Date().toISOString();
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Lit une collection entière, page par page. Jamais un `query` non borné. */
async function toutLire(db: Firestore, collection: string, select?: string[]): Promise<DocSnapshot[]> {
  const documents: DocSnapshot[] = [];
  // ⚠️ `select` et le curseur ne se combinent que si le champ trié y figure : `queryPaged`
  // ordonne par `__name__`, qui n'est pas un champ. On ne passe donc `select` que lorsqu'on
  // n'a pas besoin du document entier, et le curseur reste construit sur le chemin.
  for await (const page of db.queryPaged({ collection, select }, PAGE)) {
    documents.push(...page);
  }
  return documents;
}

/** Envoie les écritures en lots bornés. Renvoie le nombre d'écritures passées. */
async function ecrireParLots(db: Firestore, writes: Write[]): Promise<number> {
  for (const lot of decouper(writes, LOT_ECRITURE)) {
    await db.commit(lot);
  }
  return writes.length;
}

/** Jeton client-credentials Spotify. `btoa`, pas `Buffer` : on est sur Workers. */
async function jetonSpotify(env: Env): Promise<string | null> {
  const id = env.SPOTIFY_CLIENT_ID;
  const secret = env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  const reponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await reponse.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/** Suit la pagination `next` de Spotify jusqu'à épuisement. */
async function tousLesEpisodes(jeton: string, errors: string[]): Promise<SpotifyEpisode[]> {
  const episodes: SpotifyEpisode[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/shows/${encodeURIComponent(SHOW_ID)}/episodes?market=FR&limit=50`;

  while (url) {
    const reponse: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${jeton}` },
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await reponse.json()) as {
      items?: SpotifyEpisode[];
      next?: string | null;
      error?: { message?: string };
    };
    if (data.error) {
      errors.push(`Spotify API : ${data.error.message ?? 'erreur inconnue'}`);
      break;
    }
    for (const episode of data.items ?? []) {
      if (episode?.id) episodes.push(episode);
    }
    url = data.next ?? null;
  }
  return episodes;
}

/**
 * Importe les épisodes Spotify absents de `podcasts`.
 *
 * Idempotent : l'identifiant de document est déterministe (`sp_<id>`), donc un épisode
 * déjà importé est compté dans `skipped` et rien n'est réécrit. Les nouveaux arrivent en
 * `status: 'draft'` — l'admin relit avant publication, et le port ne change pas ça.
 */
export async function runImportSpotify(db: Firestore, env: Env): Promise<ImportResult> {
  const errors: string[] = [];
  const result: ImportResult = { fetched: 0, created: 0, skipped: 0, errors };

  const jeton = await jetonSpotify(env);
  if (!jeton) {
    errors.push(
      env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
        ? 'Spotify : demande de jeton refusée.'
        : 'Spotify : identifiants non configurés.',
    );
    return result;
  }

  const episodes = await tousLesEpisodes(jeton, errors);
  result.fetched = episodes.length;
  if (episodes.length === 0) return result;

  // UNE lecture pour tout : identifiants déjà présents ET slugs déjà pris.
  const existants = await toutLire(db, 'podcasts', ['slug']);
  const dejaLa = new Set(existants.map((d) => d.id));
  const slugsPris = new Set(
    existants.map((d) => asText(d.data.slug)).filter((s): s is string => Boolean(s)),
  );

  const writes: Write[] = [];
  for (const episode of episodes) {
    const docId = `sp_${episode.id}`;
    if (dejaLa.has(docId)) {
      result.skipped++;
      continue;
    }

    let slug = slugify(episode.name);
    if (slugsPris.has(slug)) slug = `${slug}-${episode.id.slice(0, 6).toLowerCase()}`;
    slugsPris.add(slug);
    // Un même import peut rapporter deux fois le même épisode si Spotify pagine mal ;
    // marquer l'identifiant évite de préparer deux écritures pour un seul document.
    dejaLa.add(docId);

    writes.push(
      db.buildWrite(`podcasts/${docId}`, {
        title: episode.name,
        slug,
        description: episode.description ?? '',
        audioUrl: episode.external_urls?.spotify ?? `https://open.spotify.com/episode/${episode.id}`,
        coverImage: episode.images?.[0]?.url ?? '',
        duration: msVersDuree(episode.duration_ms),
        publishedAt: versIso(episode.release_date),
        updatedAt: new Date().toISOString(),
        category: 'Podcast',
        status: 'draft',
        spotifyEpisodeId: episode.id,
        // `mask: false` : c'est une CRÉATION, le document s'écrit en entier. Un masque
        // ici ne changerait rien au résultat mais dirait le contraire de l'intention.
      }, { mask: false }),
    );
  }

  try {
    result.created = await ecrireParLots(db, writes);
  } catch (error: unknown) {
    errors.push(`Écriture des épisodes : ${error instanceof Error ? error.message : 'échec inconnu'}`);
  }

  return result;
}

function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function idEpisodeSpotify(url: string): string | null {
  const m = url.match(
    /(?:open\.spotify\.com|embed\.spotify\.com)\/(?:embed\/)?episode\/([a-zA-Z0-9]+)/,
  );
  return m ? m[1] : null;
}

/** Recopie les vues YouTube dans `videos.views`. */
async function synchroniserVues(
  db: Firestore,
  cle: string,
  errors: string[],
): Promise<{ processed: number; updated: number }> {
  const documents = await toutLire(db, 'videos', ['videoUrl']);
  const paires: { path: string; ytId: string }[] = [];
  for (const document of documents) {
    const ytId = idYoutube(asText(document.data.videoUrl) ?? '');
    if (ytId) paires.push({ path: document.path, ytId });
  }

  let updated = 0;
  for (const groupe of decouper(paires, LOT_API)) {
    const ids = groupe.map((p) => p.ytId).join(',');
    try {
      const reponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(ids)}&key=${cle}`,
        { signal: AbortSignal.timeout(10_000) },
      );
      const data = (await reponse.json()) as {
        items?: { id: string; statistics?: { viewCount?: string } }[];
        error?: { message?: string };
      };
      if (data.error) {
        errors.push(`YouTube API : ${data.error.message ?? 'erreur inconnue'}`);
        continue;
      }

      const vuesParId = new Map<string, number>();
      for (const item of data.items ?? []) {
        vuesParId.set(item.id, toNumber(item.statistics?.viewCount, 0));
      }

      const writes: Write[] = [];
      for (const { path, ytId } of groupe) {
        const vues = vuesParId.get(ytId);
        // YouTube omet simplement les identifiants qu'il ne connaît pas : une vidéo
        // supprimée ne doit pas voir son compte écrasé par un zéro qu'on n'a pas mesuré.
        if (typeof vues === 'number') {
          writes.push(db.buildWrite(path, { views: vues }, { mask: true }));
        }
      }
      updated += await ecrireParLots(db, writes);
    } catch (error: unknown) {
      errors.push(`YouTube, lot échoué : ${error instanceof Error ? error.message : 'inconnu'}`);
    }
  }

  return { processed: paires.length, updated };
}

/** Recopie la popularité Spotify dans `podcasts.popularity`. */
async function synchroniserPopularite(
  db: Firestore,
  jeton: string,
  errors: string[],
): Promise<{ processed: number; updated: number }> {
  const documents = await toutLire(db, 'podcasts', ['audioUrl']);
  const paires: { path: string; spId: string }[] = [];
  for (const document of documents) {
    const spId = idEpisodeSpotify(asText(document.data.audioUrl) ?? '');
    if (spId) paires.push({ path: document.path, spId });
  }

  let updated = 0;
  for (const groupe of decouper(paires, LOT_API)) {
    const ids = groupe.map((p) => p.spId).join(',');
    try {
      const reponse = await fetch(
        `https://api.spotify.com/v1/episodes?ids=${encodeURIComponent(ids)}&market=FR`,
        { headers: { Authorization: `Bearer ${jeton}` }, signal: AbortSignal.timeout(10_000) },
      );
      const data = (await reponse.json()) as {
        episodes?: ({ popularity?: number } | null)[];
        error?: { message?: string };
      };
      if (data.error) {
        errors.push(`Spotify API : ${data.error.message ?? 'erreur inconnue'}`);
        continue;
      }

      // Spotify renvoie le tableau DANS L'ORDRE DEMANDÉ, avec `null` aux places
      // introuvables : l'index fait donc foi, et un `null` se saute sans décaler.
      const episodes = data.episodes ?? [];
      const writes: Write[] = [];
      for (let i = 0; i < groupe.length; i++) {
        const episode = episodes[i];
        if (episode && typeof episode.popularity === 'number') {
          writes.push(db.buildWrite(groupe[i].path, { popularity: episode.popularity }, { mask: true }));
        }
      }
      updated += await ecrireParLots(db, writes);
    } catch (error: unknown) {
      errors.push(`Spotify, lot échoué : ${error instanceof Error ? error.message : 'inconnu'}`);
    }
  }

  return { processed: paires.length, updated };
}

/**
 * Synchronise les statistiques média. Chaque source est indépendante : YouTube absent
 * n'empêche pas Spotify de passer, et l'inverse. Les manques partent dans `errors`
 * plutôt qu'en exception — un bilan partiel se lit, une exception ne dit rien.
 */
export async function runSyncMediaStats(db: Firestore, env: Env): Promise<SyncResult> {
  const errors: string[] = [];
  const result: SyncResult = {
    videosProcessed: 0,
    videosUpdated: 0,
    podcastsProcessed: 0,
    podcastsUpdated: 0,
    errors,
  };

  if (env.YOUTUBE_API_KEY) {
    const { processed, updated } = await synchroniserVues(db, env.YOUTUBE_API_KEY, errors);
    result.videosProcessed = processed;
    result.videosUpdated = updated;
  } else {
    errors.push('YouTube : clé API non configurée.');
  }

  const jeton = await jetonSpotify(env);
  if (jeton) {
    const { processed, updated } = await synchroniserPopularite(db, jeton, errors);
    result.podcastsProcessed = processed;
    result.podcastsUpdated = updated;
  } else {
    errors.push(
      env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET
        ? 'Spotify : demande de jeton refusée.'
        : 'Spotify : identifiants non configurés.',
    );
  }

  return result;
}
