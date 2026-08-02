import type { Env } from './env';

/**
 * Cache KV avec revalidation en arrière-plan.
 *
 * C'est la mitigation principale du risque de quota Firestore : le prerender
 * consomme aujourd'hui une à deux lectures par page crawlée, à chaque passage de
 * chaque robot. Un TTL de quelques minutes divise ce volume d'un ordre de
 * grandeur, sans rendre le contenu perceptiblement obsolète.
 */
export async function cached<T>(
  env: Env,
  ctx: ExecutionContext,
  key: string,
  ttlSeconds: number,
  produce: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await env.SEO.get(key, 'json');
    if (hit !== null) return hit as T;
  } catch {
    // Le cache est un accélérateur, jamais une dépendance dure.
  }

  const value = await produce();

  // L'écriture ne doit pas retarder la réponse.
  ctx.waitUntil(
    env.SEO.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttlSeconds) }).catch(
      () => undefined,
    ),
  );

  return value;
}
