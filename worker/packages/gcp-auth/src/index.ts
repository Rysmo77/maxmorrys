import { signJwtRs256 } from './jwt';
import { importServiceAccountKey } from './pem';

export { bytesToBase64, base64ToBytes, bytesToBase64Url, stringToBase64Url } from './base64';
export { signJwtRs256, readJwtExpiry } from './jwt';

/** Sous-ensemble utile du JSON de compte de service GCP. */
export interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  private_key_id?: string;
  token_uri?: string;
}

/** Renvoie un Bearer valide, en le renouvelant de façon transparente. */
export type TokenProvider = () => Promise<string>;

/** Audience d'un JWT auto-signé accepté directement par l'API Firestore. */
export const FIRESTORE_AUDIENCE = 'https://firestore.googleapis.com/';

/** Scope OAuth requis par Identity Toolkit admin et l'export Firestore. */
export const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const TOKEN_LIFETIME_SECONDS = 3600;
/** Marge de renouvellement : on ne sert jamais un jeton à moins de 5 min de son expiration. */
const RENEW_MARGIN_SECONDS = 300;
/** `iat` légèrement dans le passé, par tolérance au décalage d'horloge côté Google. */
const CLOCK_SKEW_SECONDS = 10;

interface CachedToken {
  token: string;
  /** Expiration absolue, en secondes epoch. */
  exp: number;
}

/**
 * Caches de module. Ils vivent le temps de l'isolate, ce qui est exactement le
 * comportement voulu : une CryptoKey n'est pas sérialisable, et un jeton n'a pas
 * à être partagé au-delà du PoP (le Cache API s'en charge, voir plus bas).
 */
const keyCache = new Map<string, Promise<CryptoKey>>();
const tokenCache = new Map<string, CachedToken>();
/**
 * Frappes en cours. Sans cette déduplication, 50 requêtes concurrentes sur un
 * isolate froid déclenchent 50 signatures RSA.
 */
const inFlight = new Map<string, Promise<string>>();

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Parse et valide le JSON d'un compte de service.
 *
 * Les messages d'erreur ne citent jamais le contenu de la clé.
 */
export function parseServiceAccount(raw: string): ServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Compte de service invalide : JSON illisible');
  }

  const sa = parsed as Partial<ServiceAccount>;
  const missing = (['client_email', 'private_key', 'project_id'] as const).filter(
    (field) => typeof sa[field] !== 'string' || !sa[field],
  );
  if (missing.length > 0) {
    throw new Error(`Compte de service invalide : champs manquants (${missing.join(', ')})`);
  }

  return sa as ServiceAccount;
}

function serviceAccountKeyId(sa: ServiceAccount): string {
  return sa.private_key_id ?? sa.client_email;
}

function getSigningKey(sa: ServiceAccount): Promise<CryptoKey> {
  const id = serviceAccountKeyId(sa);
  let pending = keyCache.get(id);
  if (!pending) {
    // En cas d'échec d'import, on retire l'entrée pour ne pas mémoïser une erreur.
    pending = importServiceAccountKey(sa.private_key).catch((error: unknown) => {
      keyCache.delete(id);
      throw error;
    });
    keyCache.set(id, pending);
  }
  return pending;
}

/**
 * Étage Cache API : partage le jeton entre les isolates d'un même PoP.
 *
 * Absent hors runtime Workers (tests Node), auquel cas on retombe simplement sur
 * le cache de module.
 */
function edgeCacheUrl(cacheId: string): string {
  return `https://gcp-auth.internal/token/${encodeURIComponent(cacheId)}`;
}

async function readEdgeCache(cacheId: string): Promise<CachedToken | null> {
  if (typeof caches === 'undefined') return null;
  try {
    const hit = await caches.default.match(edgeCacheUrl(cacheId));
    if (!hit) return null;
    const entry = (await hit.json()) as CachedToken;
    return typeof entry.token === 'string' && typeof entry.exp === 'number' ? entry : null;
  } catch {
    return null;
  }
}

async function writeEdgeCache(cacheId: string, entry: CachedToken): Promise<void> {
  if (typeof caches === 'undefined') return;
  const maxAge = Math.max(0, entry.exp - nowSeconds() - RENEW_MARGIN_SECONDS);
  if (maxAge === 0) return;
  try {
    await caches.default.put(
      edgeCacheUrl(cacheId),
      new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${maxAge}` },
      }),
    );
  } catch {
    // Le cache est un accélérateur, jamais une dépendance dure.
  }
}

/**
 * Assemble un provider avec les trois étages de cache : module → Cache API → frappe,
 * plus la déduplication des frappes concurrentes.
 */
function createProvider(cacheId: string, mint: () => Promise<CachedToken>): TokenProvider {
  return () => {
    const cached = tokenCache.get(cacheId);
    if (cached && cached.exp - RENEW_MARGIN_SECONDS > nowSeconds()) {
      return Promise.resolve(cached.token);
    }

    const pending = inFlight.get(cacheId);
    if (pending) return pending;

    const task = (async () => {
      const fromEdge = await readEdgeCache(cacheId);
      if (fromEdge && fromEdge.exp - RENEW_MARGIN_SECONDS > nowSeconds()) {
        tokenCache.set(cacheId, fromEdge);
        return fromEdge.token;
      }

      const fresh = await mint();
      tokenCache.set(cacheId, fresh);
      await writeEdgeCache(cacheId, fresh);
      return fresh.token;
    })().finally(() => {
      inFlight.delete(cacheId);
    });

    inFlight.set(cacheId, task);
    return task;
  };
}

/**
 * Provider pour Firestore : un JWT auto-signé fait directement office de Bearer.
 *
 * C'est la voie à privilégier — elle supprime l'aller-retour vers
 * `oauth2.googleapis.com`, donc une latence et un point de panne.
 */
export function createSelfSignedTokenProvider(
  sa: ServiceAccount,
  audience: string = FIRESTORE_AUDIENCE,
): TokenProvider {
  const cacheId = `self:${serviceAccountKeyId(sa)}:${audience}`;

  return createProvider(cacheId, async () => {
    const key = await getSigningKey(sa);
    const iat = nowSeconds() - CLOCK_SKEW_SECONDS;
    const exp = iat + TOKEN_LIFETIME_SECONDS;
    const token = await signJwtRs256(key, {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: audience,
      iat,
      exp,
    });
    return { token, exp };
  });
}

/**
 * Provider OAuth2 classique (flux `jwt-bearer`).
 *
 * Obligatoire pour Identity Toolkit admin et l'export Firestore, qui n'acceptent
 * pas le JWT auto-signé.
 */
export function createAccessTokenProvider(sa: ServiceAccount, scopes: string[]): TokenProvider {
  const tokenUri = sa.token_uri ?? DEFAULT_TOKEN_URI;
  const scope = scopes.join(' ');
  const cacheId = `oauth:${serviceAccountKeyId(sa)}:${scope}`;

  return createProvider(cacheId, async () => {
    const key = await getSigningKey(sa);
    const iat = nowSeconds() - CLOCK_SKEW_SECONDS;
    const assertion = await signJwtRs256(key, {
      iss: sa.client_email,
      scope,
      aud: tokenUri,
      iat,
      exp: iat + TOKEN_LIFETIME_SECONDS,
    });

    const response = await fetch(tokenUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // Le corps d'erreur de Google ne contient pas de secret, il aide au diagnostic.
      const detail = await response.text().catch(() => '');
      throw new Error(`Échange OAuth2 refusé (${response.status}) : ${detail.slice(0, 200)}`);
    }

    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) {
      throw new Error('Échange OAuth2 : réponse sans access_token');
    }

    return {
      token: body.access_token,
      exp: nowSeconds() + (body.expires_in ?? TOKEN_LIFETIME_SECONDS),
    };
  });
}

/** Réservé aux tests : vide les caches de module. */
export function __resetTokenCaches(): void {
  keyCache.clear();
  tokenCache.clear();
  inFlight.clear();
}
