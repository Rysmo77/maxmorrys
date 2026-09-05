import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNE CSP PEUT ÉTEINDRE UNE FONCTIONNALITÉ SANS QUE RIEN N'ÉCHOUE.
 *
 * Ce fichier est le pendant de `permissions-policy.test.ts`, et il naît du même genre
 * de défaut — resté en production sans le moindre symptôme :
 *
 *     connect-src … (aucune mention de get.geojs.io)
 *
 * `detectLanguage.ts` appelle `https://get.geojs.io/v1/ip/country.json` pour deviner la
 * langue quand le navigateur n'annonce ni `fr` ni `en`. La requête était bloquée par la
 * CSP, le `catch` l'avalait, et la fonction renvoyait `'en'` — son repli d'échec. Un
 * téléphone réglé en arabe, en portugais ou en wolof à Dakar partait donc en ANGLAIS,
 * sur un marché francophone. Pas une erreur, pas un log : la valeur de repli avait
 * exactement la forme d'une réponse.
 *
 * Le second défaut de la même famille : `https://*.cloudfunctions.net` restait autorisé
 * après la suppression de `functions/`. Le repli de `getFunctions` valait `'us-central1'`,
 * donc un build sans `VITE_FUNCTIONS_ORIGIN` envoyait les paiements vers un backend mort
 * — et la CSP le laissait partir, pour finir en 404.
 *
 * D'OÙ L'INVARIANT, LE MÊME QUE POUR LES PERMISSIONS : CE QUE LE CODE APPELLE, L'EN-TÊTE
 * DOIT L'AUTORISER — ET RIEN DE PLUS. Le test ne compare pas la CSP à une constante
 * recopiée : il la confronte aux hôtes relevés dans `src/` et dans `index.html`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const root = join(__dirname, '..', '..');

/** La valeur servie en production — Firebase Hosting la pose, Cloudflare la relaie. */
function csp(): string {
  const config = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
  const headers = config.hosting.headers.flatMap((h: { headers: { key: string; value: string }[] }) => h.headers);
  const found = headers.find((h: { key: string }) => h.key.toLowerCase() === 'content-security-policy');
  expect(found, 'firebase.json ne pose plus de Content-Security-Policy').toBeTruthy();
  return found.value as string;
}

/** Les sources d'une directive, ou `null` si la directive est absente. */
export function sources(policy: string, directive: string): string[] | null {
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens[0] === directive) return tokens.slice(1);
  }
  return null;
}

/**
 * Une source CSP couvre-t-elle cette origine ?
 *
 * `https://*.sentry.io` couvre `o1.ingest.us.sentry.io` — le joker de la spec vaut pour
 * un sous-domaine de n'importe quelle profondeur, pas seulement pour un seul niveau.
 */
export function couvre(source: string, origin: string): boolean {
  const cible = new URL(origin);
  const m = source.match(/^(?:([a-z]+):\/\/)?(\*\.)?([^/:]+)(?::(\d+|\*))?$/i);
  if (!m) return false;
  const [, schemeSource, joker, hote] = m;

  if (schemeSource && `${schemeSource}:` !== cible.protocol) return false;
  if (joker) return cible.hostname === hote || cible.hostname.endsWith(`.${hote}`);
  return cible.hostname === hote;
}

/** Une des sources de la directive couvre-t-elle l'origine ? */
function autorise(directive: string, origin: string): boolean {
  return (sources(csp(), directive) ?? []).some((s) => couvre(s, origin));
}

/** Tous les fichiers d'un dossier, en profondeur. */
function fichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((nom) => {
    const chemin = join(dir, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

/**
 * Les origines que le code appelle vraiment.
 *
 * On ne relève que les URL ABSOLUES ÉCRITES EN CLAIR dans un `fetch(` : ce sont celles
 * qu'aucune variable d'environnement ne peut rattraper, et c'est exactement la forme
 * qu'avait le défaut geojs. Les URL construites (`${base}/x`) sortent du périmètre —
 * leur base est validée ailleurs.
 */
function originesAppelees(): string[] {
  const trouvees = new Set<string>();
  for (const fichier of fichiers(join(root, 'src'))) {
    const code = readFileSync(fichier, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Le `(?<!:)` n'est pas un raffinement : sans lui, la suppression des commentaires
      // ligne mange `//get.geojs.io/...` dans `https://…` et le relevé ne trouve plus
      // RIEN — un test vert qui n'a rien regardé. L'assertion de non-vacuité plus bas
      // est là pour la même raison.
      .replace(/(?<!:)\/\/.*$/gm, '');
    for (const m of code.matchAll(/fetch\(\s*['"`](https?:\/\/[^'"`$]+)['"`]/g)) {
      trouvees.add(new URL(m[1]).origin);
    }
  }
  return [...trouvees];
}

/** Les origines des scripts tiers du shell — balises `<script src>` et injections inline. */
function originesDesScripts(): string[] {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const trouvees = new Set<string>();
  for (const m of html.matchAll(/<script[^>]+src=["'](https?:\/\/[^"']+)["']/g)) {
    trouvees.add(new URL(m[1]).origin);
  }
  // GTM et le Pixel s'injectent eux-mêmes : leur URL est une chaîne dans le snippet.
  for (const m of html.matchAll(/['"](https:\/\/(?:www\.googletagmanager\.com|connect\.facebook\.net)[^'"]*)['"]/g)) {
    trouvees.add(new URL(m[1]).origin);
  }
  return [...trouvees];
}

describe('la CSP autorise ce que le code appelle', () => {
  it('chaque `fetch` vers une URL écrite en clair est couvert par connect-src', () => {
    const origines = originesAppelees();
    // Si plus rien n'est relevé, c'est le relevé qui est cassé, pas la CSP qui est parfaite.
    expect(origines.length, 'aucun fetch absolu relevé — le relevé ne fonctionne plus').toBeGreaterThan(0);
    for (const origine of origines) {
      expect(autorise('connect-src', origine), `connect-src n'autorise pas ${origine}`).toBe(true);
    }
  });

  it('le repli géo-IP de la détection de langue passe', () => {
    // Le défaut fondateur, nommé pour qu'un futur resserrement de la CSP le voie.
    const source = readFileSync(join(root, 'src/lib/detectLanguage.ts'), 'utf8');
    expect(source, 'le repli géo-IP a changé d’hôte — ce test est à revoir').toContain('get.geojs.io');
    expect(autorise('connect-src', 'https://get.geojs.io')).toBe(true);
  });

  it('chaque script tiers du shell est couvert par script-src', () => {
    const origines = originesDesScripts();
    expect(origines.length, 'aucun script tiers relevé dans index.html').toBeGreaterThan(0);
    for (const origine of origines) {
      expect(autorise('script-src', origine), `script-src n'autorise pas ${origine}`).toBe(true);
    }
  });
});

describe('la CSP n’autorise pas ce que le code n’appelle plus', () => {
  it('l’origine de repli des callables n’est plus une région Cloud Functions', () => {
    // `getFunctions(app, 'us-central1')` viserait `*.cloudfunctions.net`, supprimé le
    // 03/09/2026. Le repli doit être une origine, et cette origine doit être autorisée.
    const source = readFileSync(join(root, 'src/config/firebase.ts'), 'utf8');
    const repli = source.match(/VITE_FUNCTIONS_ORIGIN\s*\|\|\s*['"]([^'"]+)['"]/);
    expect(repli, 'le repli de VITE_FUNCTIONS_ORIGIN a disparu — ce test est à revoir').toBeTruthy();
    expect(repli![1], 'le repli est redevenu une région, donc un backend mort').toMatch(/^https:\/\//);
    expect(autorise('connect-src', repli![1])).toBe(true);
  });

  it('`*.cloudfunctions.net` ne revient pas dans connect-src', () => {
    expect(sources(csp(), 'connect-src')).not.toContain('https://*.cloudfunctions.net');
  });
});

describe('ce qui rend les balises vérifiables', () => {
  it('le mode Aperçu GTM peut se connecter', () => {
    // Sans ces trois lignes, Tag Assistant ne charge pas et il devient impossible de
    // PROUVER qu'une balise se déclenche — c'est-à-dire de répondre à la seule question
    // qui compte sur un dispositif de mesure.
    for (const directive of ['script-src', 'connect-src', 'frame-src']) {
      expect(
        autorise(directive, 'https://tagassistant.google.com'),
        `${directive} n'autorise pas tagassistant.google.com`,
      ).toBe(true);
    }
  });

  it('la supervision d’erreurs peut émettre, si un DSN est fourni', () => {
    // Sentry lit son DSN dans l'environnement : la CSP doit être prête AVANT que la
    // valeur arrive, sinon fournir le DSN ne produit qu'un échec silencieux de plus.
    const source = readFileSync(join(root, 'src/lib/sentry.ts'), 'utf8');
    expect(source, 'Sentry ne lit plus VITE_SENTRY_DSN — ce test est à revoir').toContain('VITE_SENTRY_DSN');
    expect(autorise('connect-src', 'https://o0.ingest.de.sentry.io')).toBe(true);
    expect(autorise('connect-src', 'https://o0.ingest.us.sentry.io')).toBe(true);
  });

  it('GA4 et le Pixel gardent leur chemin de collecte', () => {
    expect(autorise('connect-src', 'https://region1.google-analytics.com')).toBe(true);
    expect(autorise('connect-src', 'https://www.google-analytics.com')).toBe(true);
    expect(autorise('connect-src', 'https://www.facebook.com')).toBe(true);
    expect(autorise('script-src', 'https://www.googletagmanager.com')).toBe(true);
  });
});

describe('la lecture des directives, pour que le test ne mente pas', () => {
  it('distingue une directive absente d’une directive vide', () => {
    expect(sources("default-src 'self'; object-src", 'object-src')).toEqual([]);
    expect(sources("default-src 'self'", 'frame-src')).toBeNull();
  });

  it('ne confond pas deux directives dont l’une finit comme l’autre', () => {
    // `script-src` ne doit pas répondre quand on demande `src`, ni `img-src` valoir pour
    // `script-src` : c'est le premier jeton du segment qui nomme la directive.
    expect(sources("script-src 'self'", 'src')).toBeNull();
  });

  it('le joker couvre les sous-domaines à toute profondeur, pas le domaine voisin', () => {
    expect(couvre('https://*.sentry.io', 'https://o1.ingest.us.sentry.io')).toBe(true);
    expect(couvre('https://*.sentry.io', 'https://sentry.io')).toBe(true);
    expect(couvre('https://*.sentry.io', 'https://notsentry.io')).toBe(false);
    // Le piège classique : un suffixe qui ressemble.
    expect(couvre('https://*.google-analytics.com', 'https://evil-google-analytics.com')).toBe(false);
  });

  it('le schéma compte', () => {
    expect(couvre('https://api.maxmorrys.me', 'http://api.maxmorrys.me')).toBe(false);
    expect(couvre('https://api.maxmorrys.me', 'https://api.maxmorrys.me')).toBe(true);
  });

  it('une source sans hôte ne couvre rien', () => {
    expect(couvre("'self'", 'https://get.geojs.io')).toBe(false);
    expect(couvre('blob:', 'https://get.geojs.io')).toBe(false);
  });
});
