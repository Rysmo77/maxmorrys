export interface CorsPolicy {
  /** Origines autorisées, en liste explicite. */
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
}

/**
 * En-têtes CORS pour une origine donnée.
 *
 * L'origine est renvoyée telle quelle quand elle figure dans la liste ; sinon on
 * retombe sur la première autorisée. Jamais `*` : les requêtes portent un
 * `Authorization`.
 */
export function corsHeaders(origin: string | null, policy: CorsPolicy): Record<string, string> {
  const allowed =
    origin && policy.allowedOrigins.includes(origin) ? origin : (policy.allowedOrigins[0] ?? 'null');

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': (policy.allowedMethods ?? ['POST', 'OPTIONS']).join(', '),
    'Access-Control-Allow-Headers': (
      policy.allowedHeaders ?? [
        'Authorization',
        'Content-Type',
        // Envoyés par le SDK Firebase Functions : les omettre fait échouer le
        // preflight, et donc *tous* les callables d'un coup.
        'X-Firebase-Client',
        'X-Firebase-AppCheck',
        'Firebase-Instance-ID-Token',
      ]
    ).join(', '),
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** Réponse au preflight `OPTIONS`. */
export function preflightResponse(origin: string | null, policy: CorsPolicy): Response {
  return new Response(null, { status: 204, headers: corsHeaders(origin, policy) });
}

/** Découpe une variable d'environnement `a,b,c` en liste d'origines. */
export function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}
