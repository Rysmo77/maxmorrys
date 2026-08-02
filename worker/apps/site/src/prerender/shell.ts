import { SITE_NAME } from '../constants';
import type { Env } from '../env';

/**
 * Récupération du shell SPA, mise en cache au bord.
 *
 * La Cloud Function garde le shell 60 s dans la mémoire de l'instance : chaque
 * démarrage à froid repart donc d'un aller-retour réseau depuis `europe-west1`.
 * Le Cache API partage ce cache entre tous les isolates d'un même PoP, avec le
 * même TTL — même sémantique, sans le coût du démarrage à froid.
 */

const SHELL_TTL_SECONDS = 60;
const SHELL_CACHE_KEY = 'https://cache.internal/spa-shell';

const MINIMAL_FALLBACK = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${SITE_NAME}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

function shellResponse(html: string): Response {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `max-age=${SHELL_TTL_SECONDS}`,
    },
  });
}

export async function getSpaShell(env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;

  const hit = await cache.match(SHELL_CACHE_KEY).catch(() => undefined);
  if (hit) return hit;

  try {
    const response = await fetch(`${env.ORIGIN}/index.html`, {
      headers: { 'User-Agent': 'maxmorrys-prerender/2.0' },
      signal: AbortSignal.timeout(5_000),
    });

    if (response.ok) {
      const fresh = shellResponse(await response.text());
      ctx.waitUntil(cache.put(SHELL_CACHE_KEY, fresh.clone()).catch(() => undefined));
      return fresh;
    }
    console.error('Récupération du shell : statut', response.status);
  } catch (error: unknown) {
    console.error('Récupération du shell impossible :', error);
  }

  return shellResponse(MINIMAL_FALLBACK);
}
