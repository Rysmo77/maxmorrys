import type { Env } from './index';

/**
 * Lecture des objets R2 servie par le Worker.
 *
 * Jusqu'ici `media.maxmorrys.me` était un domaine public de bucket : **tout**
 * était lisible par quiconque connaissait l'URL, y compris les enregistrements
 * privés du Club, que `storage.rules` réservait aux membres. Ces règles ne
 * gouvernaient que GCS et n'ont jamais suivi la bascule vers R2.
 *
 * Les préfixes publics restent servis tels quels ; les préfixes protégés
 * exigent un lien signé, délivré par le Worker `api` après vérification des
 * droits.
 */

/**
 * Préfixes exigeant un lien signé.
 *
 * Tout le reste est public — couvertures d'articles, vignettes, avatars,
 * visuels sociaux : du contenu déjà exposé sur le site.
 */
const PROTECTED_PREFIXES = ['club_media/', 'courses/', 'certificates/', 'exports/'];

function isProtected(key: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function expectedSignature(secret: string, key: string, expiresAt: number): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(`${key}:${expiresAt}`),
  );
  let hex = '';
  for (const byte of new Uint8Array(signature)) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

export async function handleRead(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

  if (!key || key.includes('..')) return new Response('Clé invalide', { status: 400 });

  if (isProtected(key)) {
    if (!env.MEDIA_SIGNING_KEY) return new Response('Service indisponible', { status: 503 });

    const rawExpiry = url.searchParams.get('exp');
    const signature = url.searchParams.get('sig') ?? '';

    // Aucun lien fourni : c'est un refus d'accès, pas une expiration.
    if (!rawExpiry || !signature) return new Response('Accès refusé', { status: 403 });

    const expiresAt = Number(rawExpiry);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return new Response('Lien expiré', { status: 410 });
    }
    if (!constantTimeEqual(signature, await expectedSignature(env.MEDIA_SIGNING_KEY, key, expiresAt))) {
      return new Response('Accès refusé', { status: 403 });
    }
  }

  // Les requêtes `Range` doivent être honorées : sans elles, plus de navigation
  // dans une vidéo ni de reprise de téléchargement.
  const rangeRequested = request.headers.get('Range') !== null;
  const object = await env.BUCKET.get(key, rangeRequested ? { range: request.headers } : undefined);
  if (!object) return new Response('Introuvable', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set(
    'Cache-Control',
    isProtected(key) ? 'private, no-store' : 'public, max-age=31536000, immutable',
  );

  // Un 206 ne doit sortir que si le client a réellement demandé une plage :
  // R2 renseigne `range` même sur une lecture complète, et un 206 spontané
  // déroute les clients comme les caches intermédiaires.
  if (rangeRequested && 'range' in object && object.range) {
    const { offset = 0, length = object.size } = object.range as { offset?: number; length?: number };
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
}
