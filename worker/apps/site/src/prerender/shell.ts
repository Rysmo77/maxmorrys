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

/**
 * En-têtes de sécurité posés par Firebase Hosting (`firebase.json`).
 *
 * Ils doivent être reportés sur **toute** réponse fabriquée par le Worker :
 * celui-ci construit un nouvel objet Response, donc rien n'est hérité
 * automatiquement. Les oublier revient à servir les pages les plus visitées du
 * site sans CSP ni HSTS.
 *
 * On les recopie depuis l'origine plutôt que de les redéfinir ici : `firebase.json`
 * reste la source unique, et une évolution de la CSP se propage sans double
 * maintenance.
 */
const SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
];

function shellResponse(html: string, origin?: Headers, degrade = false): Response {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    /*
     * UN REPLI NE SE MET PAS EN CACHE.
     *
     * Le shell dégradé ne porte ni GTM, ni Pixel, ni Consent Mode, ni le
     * `<script type="module">` de l'application — donc page blanche — et aucun en-tête
     * de sécurité, puisqu'il n'y a pas d'origine d'où les recopier. Lui laisser le
     * `max-age` du shell normal faisait payer un hoquet de cinq secondes à l'origine
     * pendant une minute pleine, PAR POP, sur TOUTES les routes prérendues à la fois.
     * `no-store` ramène la panne à sa durée réelle.
     */
    'Cache-Control': degrade ? 'no-store' : `max-age=${SHELL_TTL_SECONDS}`,
  });
  for (const name of SECURITY_HEADERS) {
    const value = origin?.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(html, { headers });
}

/** Reporte les en-têtes de sécurité du shell sur une réponse fabriquée par le Worker. */
export function applySecurityHeaders(target: Headers, shell: Headers): void {
  for (const name of SECURITY_HEADERS) {
    const value = shell.get(name);
    if (value) target.set(name, value);
  }
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
      const fresh = shellResponse(await response.text(), response.headers);
      ctx.waitUntil(cache.put(SHELL_CACHE_KEY, fresh.clone()).catch(() => undefined));
      return fresh;
    }
    console.error('Récupération du shell : statut', response.status);
  } catch (error: unknown) {
    console.error('Récupération du shell impossible :', error);
  }

  /*
   * ⚠️ PANNE TOTALE ET SILENCIEUSE — LE SEUL ENDROIT D'OÙ ELLE SE VOIT.
   *
   * À partir d'ici, TOUTES les routes prérendues sont servies avec dix lignes de HTML :
   * pas d'application (page blanche pour un humain), pas de balises (identité vide pour
   * un robot), pas d'en-têtes de sécurité (`applySecurityHeaders` n'a rien à recopier —
   * c'est assumé, cf. `test/security-headers.test.ts`).
   *
   * Rien d'autre ne le signale : le Worker répond 200, la route est « saine » pour toute
   * sonde qui regarde un code de statut. Ce préfixe est là pour être cherché tel quel
   * dans l'observabilité Workers et servir de base à une alerte.
   */
  console.error('ALERTE shell-degrade : pré-rendu servi sans application ni en-têtes');
  return shellResponse(MINIMAL_FALLBACK, undefined, true);
}
