/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES SONDES DE L'ÉCRAN INFRASTRUCTURE — audit UI/UX du 03/11/2026, X16.
 *
 * L'écran affichait « non sondé » partout. Ces sondes tournent DANS LE NAVIGATEUR de
 * l'opérateur, au chargement de l'écran : pas de serveur, pas de secret.
 *
 * CE QU'UNE SONDE PEUT DIRE, ET CE QU'ELLE NE PEUT PAS DIRE :
 *  · même origine que la console (le hub) → `HEAD` normal, le CODE HTTP est lisible ;
 *  · autre hôte (`edu.`, `club.`, `media.`) → ces hôtes ne renvoient pas d'en-tête CORS : la
 *    seule requête possible est `mode: 'no-cors'`, dont la réponse est OPAQUE. On sait qu'un
 *    serveur a RÉPONDU (DNS, TLS et bord Cloudflare vivants), jamais avec quel code. L'écran
 *    le dit (« répond · code illisible ») au lieu d'afficher un faux « 200 ».
 *  · ⚠️ ces trois hôtes doivent figurer dans `connect-src` (firebase.json) : sans eux, la CSP
 *    bloque la requête et la sonde lirait « injoignable » un hôte en parfaite santé.
 *
 * VERSION : le bundle d'entrée (`/assets/index-<hash>.js`) que le hub sert MAINTENANT, comparé
 * à celui que cet onglet exécute. Différents → un déploiement a eu lieu depuis l'ouverture
 * de l'onglet (ou un cache sert encore l'ancien shell).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export type HostProbe =
  | { state: 'ok'; status: number }
  | { state: 'http-error'; status: number }
  | { state: 'reachable' }
  | { state: 'unreachable' };

const TIMEOUT_MS = 8000;

async function withTimeout(input: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal, cache: 'no-store', credentials: 'omit' });
  } finally {
    clearTimeout(timer);
  }
}

/** Sonde une adresse (`https://edu.maxmorrys.me/`, `https://maxmorrys.me/admin`). */
export async function probeHost(url: string, here: string = window.location.origin): Promise<HostProbe> {
  try {
    if (new URL(url).origin === here) {
      const res = await withTimeout(url, { method: 'HEAD' });
      return res.ok ? { state: 'ok', status: res.status } : { state: 'http-error', status: res.status };
    }
    await withTimeout(url, { method: 'GET', mode: 'no-cors' });
    return { state: 'reachable' };
  } catch {
    // Réseau, DNS, TLS, délai dépassé ou CSP : l'hôte n'a pas pu être joint d'ici.
    return { state: 'unreachable' };
  }
}

const BUNDLE_RE = /\/assets\/(index-[A-Za-z0-9_-]+\.js)/;

/** Le nom du bundle d'entrée cité par un document HTML, ou `null`. */
export function bundleFromHtml(html: string): string | null {
  const scripts = html.match(/<script\b[^>]*\bsrc=["'][^"']*["'][^>]*>/gi) ?? [];
  for (const tag of scripts) {
    const m = tag.match(BUNDLE_RE);
    if (m) return m[1];
  }
  return null;
}

/** Le bundle que CET onglet exécute (`null` en développement : Vite ne bundle pas). */
export function currentBundle(doc: Document = document): string | null {
  for (const s of Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'))) {
    const m = s.src.match(BUNDLE_RE);
    if (m) return m[1];
  }
  return null;
}

/** Le bundle que le hub sert maintenant (même origine : le HTML est lisible). */
export async function servedBundle(): Promise<string | null> {
  const res = await withTimeout('/', { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return bundleFromHtml(await res.text());
}

export type VersionProbe =
  | { state: 'same'; served: string; running: string }
  | { state: 'differs'; served: string; running: string }
  | { state: 'dev'; served: string | null }
  | { state: 'unknown' };

export function compareBundles(served: string | null, running: string | null): VersionProbe {
  if (!running) return { state: 'dev', served };
  if (!served) return { state: 'unknown' };
  return served === running ? { state: 'same', served, running } : { state: 'differs', served, running };
}
