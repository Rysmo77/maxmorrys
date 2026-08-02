import type { Env } from './env';

/**
 * Hôtes de la zone Cloudflare. Un `fetch` vers l'un d'eux depuis ce Worker
 * repasserait par la route et bouclerait (erreurs 1015 / 508).
 */
const ZONE_HOSTS = new Set(['maxmorrys.me', 'www.maxmorrys.me']);

/**
 * Relaie la requête vers Firebase Hosting.
 *
 * L'origine est `max-morrys.web.app`, **hors zone** : les rewrites Firebase
 * (dont la fonction `prerender`) s'y appliquent donc exactement comme
 * aujourd'hui, ce qui rend le passe-plat rigoureusement transparent.
 */
export async function fetchOrigin(request: Request, env: Env): Promise<Response> {
  const incoming = new URL(request.url);
  const origin = new URL(env.ORIGIN);

  if (ZONE_HOSTS.has(origin.hostname)) {
    // Erreur de configuration : mieux vaut un 500 explicite qu'une boucle.
    return new Response("Configuration invalide : ORIGIN pointe sur la zone Cloudflare", {
      status: 500,
    });
  }

  const target = new URL(incoming.pathname + incoming.search, origin);

  try {
    // `new Request(url, request)` reprend méthode, en-têtes et corps ; l'en-tête
    // Host est réécrit par le runtime pour cibler l'origine.
    return await fetch(new Request(target, request));
  } catch {
    return new Response('Origine injoignable', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
