import { constantTimeEqual } from '@mm/shared';

import type { Env } from './env';
import { signExport } from './handlers/gdpr';

/**
 * Téléchargement d'un export RGPD.
 *
 * Sert le fichier depuis R2 après vérification d'un lien signé et daté. Il vit
 * sur `api.maxmorrys.me` et non sur le domaine média, qui est public : un export
 * contient l'intégralité des données personnelles d'une personne.
 *
 * Les requêtes `Range` sont honorées — un export volumineux doit pouvoir être
 * repris.
 */
export async function handleExportDownload(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  if (!env.EXPORTS || !env.EXPORT_SIGNING_KEY) {
    return new Response('Service indisponible', { status: 503 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('k') ?? '';
  const expiresAt = Number(url.searchParams.get('exp') ?? '0');
  const signature = url.searchParams.get('sig') ?? '';

  // Anti-traversée : le lien ne peut désigner qu'un export.
  if (!key.startsWith('exports/') || key.includes('..')) {
    return new Response('Lien invalide', { status: 400 });
  }
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return new Response('Lien expiré', { status: 410 });
  }
  if (!constantTimeEqual(signature, await signExport(env, key, expiresAt))) {
    return new Response('Lien invalide', { status: 403 });
  }

  const range = request.headers.get('Range');
  const object = await env.EXPORTS.get(key, range ? { range: request.headers } : undefined);
  if (!object) return new Response('Export introuvable', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
  // Une donnée personnelle ne doit être mise en cache par personne.
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Accept-Ranges', 'bytes');

  if ('range' in object && object.range) {
    const { offset = 0, length = object.size } = object.range as { offset?: number; length?: number };
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
}
