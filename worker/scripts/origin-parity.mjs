#!/usr/bin/env node
/**
 * Compare deux origines page par page, balises SEO comprises.
 *
 * Deux usages :
 *
 *   # 1. Avant bascule — vérifier que l'origine Firebase Hosting sert bien la
 *   #    même chose que le domaine public (hypothèse du passe-plat)
 *   node scripts/origin-parity.mjs https://maxmorrys.me https://max-morrys.web.app
 *
 *   # 2. Après bascule — vérifier que le Worker n'a rien changé
 *   node scripts/origin-parity.mjs https://max-morrys.web.app https://maxmorrys.me
 *
 * Sort en code 1 dès qu'une divergence SEO est détectée.
 */

const [, , REFERENCE, CANDIDATE] = process.argv;

if (!REFERENCE || !CANDIDATE) {
  console.error('Usage : node scripts/origin-parity.mjs <référence> <candidat>');
  process.exit(2);
}

/** Échantillon couvrant les routes prerendues, FR et EN, statiques et dynamiques. */
const PATHS = [
  '/',
  '/blog',
  '/formations',
  '/podcasts',
  '/videos',
  '/faq',
  '/a-propos',
  '/contact',
  '/agence',
  '/legal/mentions-legales',
  '/en',
  '/en/blog',
  '/en/courses',
  '/en/about',
  '/en/agency',
  '/sitemap.xml',
  '/rss.xml',
  '/catalog.csv',
  '/route-qui-nexiste-pas',
];

/** User-agent d'un crawler : c'est le chemin que le prerender doit servir. */
const CRAWLER_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

/** Balises dont la disparition est une régression SEO directe. */
const TAG_PATTERNS = [
  ['title', /<title[^>]*>([\s\S]*?)<\/title>/i],
  ['description', /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i],
  ['og:title', /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i],
  ['og:description', /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i],
  ['og:image', /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i],
  ['og:url', /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i],
  ['twitter:card', /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i],
  ['canonical', /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i],
  ['robots', /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i],
  ['google-verif', /<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']*)["']/i],
  ['fb-domain-verif', /<meta[^>]+name=["']facebook-domain-verification["'][^>]+content=["']([^"']*)["']/i],
];

/**
 * Neutralise **les deux** origines, pas seulement celle interrogée.
 *
 * Le prerender écrit `https://maxmorrys.me` en dur dans les canonical et og:url,
 * quel que soit l'hôte servi. Ne remplacer que la base appelée ferait diverger
 * chaque page pour une raison sans rapport avec une régression.
 */
const ORIGINS = [REFERENCE, CANDIDATE].map((value) => value.replace(/\/+$/, ''));

function normalize(value) {
  if (typeof value !== 'string') return value;
  let out = value;
  for (const origin of ORIGINS) out = out.replaceAll(origin, '{ORIGIN}');
  return out.replace(/\s+/g, ' ').trim();
}

function extract(html) {
  const out = {};
  for (const [name, pattern] of TAG_PATTERNS) {
    const match = html.match(pattern);
    out[name] = match ? normalize(match[1]) : null;
  }
  // hreflang : on compare l'ensemble des couples (lang, href).
  out.hreflang = [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]*>/gi)]
    .map((tag) => normalize(tag[0]))
    .sort()
    .join(' | ');
  return out;
}

/**
 * En-têtes de sécurité posés par Firebase Hosting.
 *
 * Ils sont comparés au même titre que les balises SEO : un Worker qui fabrique
 * une Response n'hérite de rien de l'origine, et leur perte ne se voit pas dans
 * le rendu. C'est exactement la régression que ce script a laissé passer une
 * première fois.
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

async function grab(base, path) {
  const response = await fetch(base + path, {
    headers: { 'User-Agent': CRAWLER_UA },
    redirect: 'manual',
  });
  const body = await response.text();
  const headers = {};
  for (const name of SECURITY_HEADERS) headers[name] = response.headers.get(name);
  return { status: response.status, body, headers, base };
}

let failures = 0;

for (const path of PATHS) {
  let reference;
  let candidate;
  try {
    [reference, candidate] = await Promise.all([grab(REFERENCE, path), grab(CANDIDATE, path)]);
  } catch (error) {
    console.error(`✗ ${path} — requête échouée : ${error.message}`);
    failures += 1;
    continue;
  }

  const problems = [];

  if (reference.status !== candidate.status) {
    problems.push(`statut ${reference.status} → ${candidate.status}`);
  }

  for (const name of SECURITY_HEADERS) {
    const before = normalize(reference.headers[name]);
    const after = normalize(candidate.headers[name]);
    if (before !== after) {
      problems.push(
        after === null
          ? `en-tête ${name} PERDU`
          : `en-tête ${name} :\n      référence = ${String(before).slice(0, 90)}\n      candidat  = ${String(after).slice(0, 90)}`,
      );
    }
  }

  if (path.endsWith('.xml') || path.endsWith('.csv')) {
    // Contenu machine : comparaison ligne à ligne, domaine neutralisé.
    const a = normalize(reference.body).split('><').join('>\n<').split('\n');
    const b = normalize(candidate.body).split('><').join('>\n<').split('\n');
    const onlyInA = a.filter((line) => !b.includes(line));
    const onlyInB = b.filter((line) => !a.includes(line));
    if (onlyInA.length > 0 || onlyInB.length > 0) {
      problems.push(
        `corps différent — ${onlyInA.length} ligne(s) absente(s) du candidat, ` +
          `${onlyInB.length} en trop\n      ex. manquant : ${onlyInA[0]?.slice(0, 120) ?? '—'}\n` +
          `      ex. en trop  : ${onlyInB[0]?.slice(0, 120) ?? '—'}`,
      );
    }
  } else {
    const a = extract(reference.body);
    const b = extract(candidate.body);
    for (const key of Object.keys(a)) {
      if (a[key] !== b[key]) {
        problems.push(`${key} :\n      référence = ${a[key]}\n      candidat  = ${b[key]}`);
      }
    }
  }

  if (problems.length === 0) {
    console.log(`✓ ${path}`);
  } else {
    failures += 1;
    console.log(`✗ ${path}`);
    for (const problem of problems) console.log(`    ${problem}`);
  }
}

console.log(
  failures === 0
    ? `\nParité confirmée sur ${PATHS.length} routes.`
    : `\n${failures} route(s) divergente(s) sur ${PATHS.length}.`,
);
process.exit(failures === 0 ? 0 : 1);
