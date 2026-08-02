/**
 * Réimplémentation du protocole `onCall` de Firebase Functions.
 *
 * Format vérifié directement dans `@firebase/functions` (dist/index.cjs.js) :
 *
 *   requête  POST  `{"data": <payload>}`, `Content-Type: application/json`,
 *                  en-tête `Authorization: Bearer <ID token>`
 *   succès   200   `{"result": <payload>}` — le client lit `json.data` puis,
 *                  à défaut, `json.result` (compatibilité conservée)
 *   erreur   4xx   `{"error": {"status": "<CODE_CANONIQUE>", "message": …,
 *                  "details": …}}` avec un statut HTTP cohérent
 *
 * ⚠️ `status` doit être le nom canonique en MAJUSCULES_SOULIGNÉES
 * (`RESOURCE_EXHAUSTED`, pas `resource-exhausted`) : le client fait la
 * correspondance inverse via sa table `errorCodeMap`, et un code inconnu est
 * ramené à `internal`, ce qui rendrait tous les messages d'erreur inexploitables.
 */

export type HttpsErrorCode =
  | 'ok'
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'unauthenticated'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss';

/** Statut HTTP associé à chaque code, aligné sur `firebase-functions`. */
const HTTP_STATUS: Record<HttpsErrorCode, number> = {
  ok: 200,
  cancelled: 499,
  unknown: 500,
  'invalid-argument': 400,
  'deadline-exceeded': 504,
  'not-found': 404,
  'already-exists': 409,
  'permission-denied': 403,
  unauthenticated: 401,
  'resource-exhausted': 429,
  'failed-precondition': 400,
  aborted: 409,
  'out-of-range': 400,
  unimplemented: 501,
  internal: 500,
  unavailable: 503,
  'data-loss': 500,
};

/** Nom canonique attendu par le client dans `error.status`. */
function canonicalName(code: HttpsErrorCode): string {
  return code.toUpperCase().replace(/-/g, '_');
}

/** Équivalent de `firebase-functions/v2/https`.HttpsError. */
export class HttpsError extends Error {
  constructor(
    readonly code: HttpsErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpsError';
  }
}

export function httpStatusFor(code: HttpsErrorCode): number {
  return HTTP_STATUS[code] ?? 500;
}

/**
 * Extrait la charge utile d'une requête callable, avec la même validation que
 * `firebase-functions`.
 *
 * `isValidRequest` du SDK exige : méthode POST, `Content-Type: application/json`
 * (le charset est ignoré), et un champ `data` défini. Tout écart donne
 * `400 INVALID_ARGUMENT` avec le message « Bad Request » — reproduit à
 * l'identique pour que le worker soit un remplaçant transparent.
 *
 * Le corps est lu **une seule fois**, en texte : c'est aussi ce dont ont besoin
 * les vérifications de signature (webhooks), où passer par `request.json()`
 * détruirait irrémédiablement les octets d'origine.
 */
export async function readCallableBody(request: Request): Promise<{ data: unknown; raw: string }> {
  const raw = await request.text();

  const contentType = (request.headers.get('Content-Type') ?? '').toLowerCase();
  const mimeType = contentType.split(';')[0].trim();
  if (mimeType !== 'application/json') {
    throw new HttpsError('invalid-argument', 'Bad Request');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpsError('invalid-argument', 'Bad Request');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new HttpsError('invalid-argument', 'Bad Request');
  }

  const data = (parsed as { data?: unknown }).data;
  if (data === undefined) {
    throw new HttpsError('invalid-argument', 'Bad Request');
  }

  return { data, raw };
}

/** Réponse de succès. */
export function callableResult(result: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify({ result: result ?? null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

/**
 * Réponse d'erreur.
 *
 * Une erreur non prévue devient `internal` sans divulguer son message : le
 * détail part dans les logs, pas au client.
 */
export function callableError(error: unknown, headers: Record<string, string>): Response {
  const httpsError =
    error instanceof HttpsError
      ? error
      : new HttpsError('internal', 'Une erreur interne est survenue.');

  if (!(error instanceof HttpsError)) {
    console.error('Erreur non gérée dans un callable :', error);
  }

  const body: { status: string; message: string; details?: unknown } = {
    status: canonicalName(httpsError.code),
    message: httpsError.message,
  };
  if (httpsError.details !== undefined) body.details = httpsError.details;

  return new Response(JSON.stringify({ error: body }), {
    status: httpStatusFor(httpsError.code),
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}
