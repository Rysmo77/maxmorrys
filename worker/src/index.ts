/**
 * Worker d'upload des médias maxmorrys.me vers Cloudflare R2.
 *
 * Flux : le navigateur envoie `POST /upload?key=<clé>` avec le fichier en corps
 * de requête et un `Authorization: Bearer <Firebase ID token>`. Le Worker vérifie
 * le token (signature + claims via les clés publiques Google), valide la clé selon
 * des règles par dossier, écrit dans R2 et renvoie l'URL publique de lecture.
 *
 * La lecture publique est servie séparément par le domaine R2 `media.maxmorrys.me`.
 */
import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface Env {
  BUCKET: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  PUBLIC_MEDIA_BASE: string;
  ALLOWED_ORIGINS: string;
  ADMIN_UIDS: string;
}

interface VerifiedUser {
  uid: string;
  isAdmin: boolean;
}

// Endpoint JWKS de Google pour les Firebase ID tokens (securetoken).
// createRemoteJWKSet met les clés en cache en mémoire et gère leur rotation.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

const MB = 1024 * 1024;

/** Règles d'autorisation et de validation par préfixe de dossier. */
interface FolderRule {
  /** Préfixe de clé (avec slash final). */
  prefix: string;
  /** true = réservé aux admins ; false = réservé au propriétaire ({uid} dans la clé). */
  adminOnly: boolean;
  /** Taille max en octets. */
  maxBytes: number;
  /** Préfixes MIME autorisés. */
  mime: string[];
}

const IMAGE = ['image/'];
const AV = ['image/', 'audio/', 'video/'];

const FOLDER_RULES: FolderRule[] = [
  { prefix: 'uploads/', adminOnly: true, maxBytes: 10 * MB, mime: IMAGE },
  { prefix: 'club_events/', adminOnly: true, maxBytes: 5 * MB, mime: IMAGE },
  { prefix: 'club_sessions/', adminOnly: true, maxBytes: 5 * MB, mime: IMAGE },
  { prefix: 'avatars/', adminOnly: false, maxBytes: 2 * MB, mime: IMAGE },
  { prefix: 'club_media/', adminOnly: false, maxBytes: 100 * MB, mime: AV },
  { prefix: 'testimonial_media/', adminOnly: false, maxBytes: 100 * MB, mime: AV },
];

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const ok = origin && allowed.includes(origin) ? origin : allowed[0] ?? '*';
  return {
    'Access-Control-Allow-Origin': ok,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function verifyToken(req: Request, env: Env): Promise<VerifiedUser | null> {
  const header = req.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    if (!uid) return null;
    const adminUids = env.ADMIN_UIDS.split(',').map((s) => s.trim()).filter(Boolean);
    const isAdmin = payload.admin === true || adminUids.includes(uid);
    return { uid, isAdmin };
  } catch {
    return null;
  }
}

/** Valide la clé R2 demandée selon le dossier et l'identité de l'appelant. */
function authorizeKey(key: string, user: VerifiedUser): { rule: FolderRule } | { error: string } {
  // Sécurité : pas de traversée de chemin ni de clé absolue.
  if (!key || key.startsWith('/') || key.includes('..') || key.includes('//')) {
    return { error: 'Clé invalide' };
  }
  const rule = FOLDER_RULES.find((r) => key.startsWith(r.prefix));
  if (!rule) return { error: 'Dossier non autorisé' };

  if (rule.adminOnly) {
    if (!user.isAdmin) return { error: 'Réservé aux administrateurs' };
  } else {
    // Le second segment doit être l'uid du propriétaire : `<prefix><uid>/<fichier>`.
    const owner = key.slice(rule.prefix.length).split('/')[0];
    if (owner !== user.uid) return { error: "La clé ne correspond pas à l'utilisateur" };
  }
  return { rule };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
    const cors = corsHeaders(req.headers.get('Origin'), allowed);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/upload') {
      return json({ error: 'Not found' }, 404, cors);
    }

    const user = await verifyToken(req, env);
    if (!user) return json({ error: 'Non authentifié' }, 401, cors);

    const key = url.searchParams.get('key') ?? '';
    const decision = authorizeKey(key, user);
    if ('error' in decision) return json({ error: decision.error }, 403, cors);
    const { rule } = decision;

    const contentType = req.headers.get('Content-Type') ?? 'application/octet-stream';
    if (!rule.mime.some((m) => contentType.startsWith(m))) {
      return json({ error: `Type de fichier non autorisé : ${contentType}` }, 415, cors);
    }

    const declaredSize = Number(req.headers.get('Content-Length') ?? '0');
    if (declaredSize > rule.maxBytes) {
      return json({ error: 'Fichier trop volumineux' }, 413, cors);
    }
    if (!req.body) return json({ error: 'Corps de requête vide' }, 400, cors);

    try {
      await env.BUCKET.put(key, req.body, {
        httpMetadata: { contentType },
      });
    } catch {
      return json({ error: "Échec de l'écriture dans R2" }, 502, cors);
    }

    return json({ url: `${env.PUBLIC_MEDIA_BASE}/${key}` }, 200, cors);
  },
};
