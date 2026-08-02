import type { Env } from './env';

/**
 * Relais vers les Cloud Functions encore en place.
 *
 * C'est ce qui rend la migration incrémentale : le frontend pointe une bonne
 * fois sur `api.maxmorrys.me`, et chaque callable bascule ensuite du relais vers
 * l'implémentation locale par simple ajout de son nom à `MIGRATED`.
 *
 * Le corps est transmis tel quel — il a déjà été lu en amont pour décider du
 * routage, donc on le repasse explicitement plutôt que de relire le flux.
 */
export async function proxyToFunctions(
  name: string,
  raw: string,
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const target = `${env.FUNCTIONS_ORIGIN.replace(/\/+$/, '')}/${name}`;

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  for (const header of ['Authorization', 'X-Firebase-AppCheck', 'Firebase-Instance-ID-Token']) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  const upstream = await fetch(target, {
    method: 'POST',
    headers,
    body: raw,
    signal: AbortSignal.timeout(60_000),
  });

  // La réponse amont respecte déjà le protocole onCall : on ne réécrit que le CORS,
  // qui doit référencer notre origine et non celle de Cloud Functions.
  const response = new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
  for (const [key, value] of Object.entries(cors)) response.headers.set(key, value);
  return response;
}

/**
 * Relais d'un webhook vers Cloud Functions.
 *
 * Distinct de `proxyToFunctions` : le corps est transmis **intact** et la
 * signature est reportée, car elle porte sur ces octets exacts. Aucun en-tête
 * CORS n'est ajouté — un webhook n'est pas appelé depuis un navigateur.
 */
export async function proxyWebhook(name: string, request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const headers = new Headers();
  for (const header of [
    'Content-Type',
    'X-Bictorys-Signature',
    'User-Agent',
    'CF-Connecting-IP',
  ]) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  const upstream = await fetch(`${env.FUNCTIONS_ORIGIN.replace(/\/+$/, '')}/${name}`, {
    method: request.method,
    headers,
    body: await request.text(),
    signal: AbortSignal.timeout(60_000),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'text/plain' },
  });
}
