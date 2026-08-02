/**
 * Worker `maxmorrys-api` — réimplémentation du protocole `onCall` sur
 * `api.maxmorrys.me`.
 *
 * Le frontend bascule d'une seule ligne :
 *
 *   getFunctions(app, import.meta.env.VITE_FUNCTIONS_ORIGIN || 'us-central1')
 *
 * Les 33 sites `httpsCallable` ne changent pas : le SDK construit
 * `${customDomain}/${nom}` dès que le second argument est une URL.
 *
 * Chaque nom est ensuite servi soit localement, soit relayé vers Cloud
 * Functions selon la variable `MIGRATED`. Trois interrupteurs, du plus fin au
 * plus large :
 *   1. retirer un nom de `MIGRATED`   → une callable revient sur GCP (~15 s)
 *   2. VITE_FUNCTIONS_ORIGIN au build → les 33 reviennent sur GCP
 *   3. supprimer le domaine custom    → plus rien ne passe par Cloudflare
 */
import { bearerFrom } from '@mm/firebase-auth-rest';
import {
  callableError,
  callableResult,
  corsHeaders,
  HttpsError,
  parseOrigins,
  preflightResponse,
  readCallableBody,
} from '@mm/shared';

import { getFirestore, getVerifier, type CallContext } from './context';
import type { Env } from './env';
import { proxyToFunctions } from './proxy';
import { HANDLERS } from './registry';

function migratedNames(env: Env): Set<string> {
  return new Set(
    env.MIGRATED.split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const policy = { allowedOrigins: parseOrigins(env.ALLOWED_ORIGINS) };
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, policy);

    if (request.method === 'OPTIONS') return preflightResponse(origin, policy);

    const url = new URL(request.url);
    const name = url.pathname.replace(/^\/+/, '');

    if (request.method !== 'POST' || !name || name.includes('/')) {
      return callableError(new HttpsError('not-found', 'Fonction inconnue.'), cors);
    }

    let raw = '';
    let data: unknown;
    try {
      ({ data, raw } = await readCallableBody(request));
    } catch (error: unknown) {
      return callableError(error, cors);
    }

    // Non migrée : relais vers Cloud Functions, sans toucher au contenu.
    const handler = migratedNames(env).has(name) ? HANDLERS[name] : undefined;
    if (!handler) {
      try {
        return await proxyToFunctions(name, raw, request, env, cors);
      } catch (error: unknown) {
        console.error(`Relais de ${name} vers Cloud Functions impossible :`, error);
        return callableError(
          new HttpsError('unavailable', 'Service temporairement indisponible.'),
          cors,
        );
      }
    }

    try {
      const auth = await getVerifier(env)(bearerFrom(request));
      const context: CallContext = { env, ctx, db: getFirestore(env), auth, raw };
      return callableResult(await handler(data, context), cors);
    } catch (error: unknown) {
      return callableError(error, cors);
    }
  },
} satisfies ExportedHandler<Env>;
