#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * `seo:check` — CE QUE LES ROBOTS REÇOIVENT VRAIMENT.
 *
 * Les défauts trouvés le 03/09/2026 avaient tous le même profil : chaque fichier était juste
 * SÉPARÉMENT, et c'est leur rencontre qui était fausse. Le sitemap déclarait `/legal/cgu`
 * pendant que le pré-rendu la servait en `noindex`. `routes.ts` envoyait `/faq/**` au
 * pré-rendu pendant qu'aucun producteur ne répondait. Ni le typecheck, ni le lint, ni les
 * tests unitaires ne peuvent voir ça : la contradiction n'existe que dans le HTML SERVI.
 *
 * Ce script est donc le seul endroit d'où elle se voit. Il ne relit pas le code : il demande
 * les pages comme le fait Facebook, et compare ce qu'il reçoit à ce que le sitemap promet.
 *
 *   node scripts/seo-check.mjs                      # production, échantillon
 *   node scripts/seo-check.mjs --all                # toutes les URL du sitemap
 *   node scripts/seo-check.mjs --base http://…      # un déploiement de préversion
 *
 * Sortie 1 si une ERREUR est trouvée, 0 sinon. Les AVERTISSEMENTS ne bloquent pas : ce sont
 * des jugements (longueur d'un titre), pas des contradictions.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const args = process.argv.slice(2);
const BASE = (args.includes('--base') ? args[args.indexOf('--base') + 1] : 'https://maxmorrys.me').replace(/\/$/, '');
const ALL = args.includes('--all');
/** Nombre d'URL vérifiées hors `--all` : couvre chaque TYPE de page sans marteler l'origine. */
const SAMPLE = 24;
/** Le pré-rendu est le même pour tous ; s'annoncer en robot rend l'échec reproductible. */
const UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

const errors = [];
const warnings = [];
const fail = (url, message) => errors.push({ url, message });
const warn = (url, message) => warnings.push({ url, message });

async function get(url) {
  const response = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' });
  return { status: response.status, location: response.headers.get('location'), html: await response.text() };
}

/** Toutes les occurrences d'une balise `meta` / `link`, pour pouvoir compter les doublons. */
function metas(html, attribute, name) {
  const pattern = new RegExp(`<meta[^>]*${attribute}="${name}"[^>]*>`, 'gi');
  return (html.match(pattern) || []).map((tag) => (tag.match(/content="([^"]*)"/i) || [, ''])[1]);
}
function links(html, rel) {
  const pattern = new RegExp(`<link[^>]*rel="${rel}"[^>]*>`, 'gi');
  return (html.match(pattern) || []).map((tag) => (tag.match(/href="([^"]*)"/i) || [, ''])[1]);
}
function titles(html) {
  return (html.match(/<title>([\s\S]*?)<\/title>/gi) || []).map((t) => t.replace(/<\/?title>/gi, ''));
}

/** Chaque balise ci-dessous doit exister EXACTEMENT une fois et ne pas être vide. */
const UNIQUE = [
  ['property', 'og:title'], ['property', 'og:description'], ['property', 'og:type'],
  ['property', 'og:url'], ['property', 'og:image'], ['property', 'og:locale'],
  ['property', 'og:site_name'], ['name', 'description'], ['name', 'twitter:card'],
  ['name', 'twitter:site'], ['name', 'twitter:title'], ['name', 'twitter:description'],
  ['name', 'twitter:image'],
];

function checkPage(url, html) {
  const found = titles(html);
  if (found.length !== 1) fail(url, `${found.length} balise(s) <title> — il en faut exactement une`);
  else if (!found[0].trim()) fail(url, '<title> vide');
  else if (found[0].length > 70) warn(url, `titre de ${found[0].length} caractères (Google en affiche ~60)`);

  for (const [attribute, name] of UNIQUE) {
    const values = metas(html, attribute, name);
    if (values.length === 0) fail(url, `${name} absente`);
    else if (values.length > 1) fail(url, `${name} présente ${values.length} fois`);
    // Une balise vide signale un défaut technique au robot ; son absence ne dit rien.
    else if (!values[0].trim()) fail(url, `${name} vide`);
  }

  const description = metas(html, 'name', 'description')[0] || '';
  if (description.length > 200) warn(url, `meta description de ${description.length} caractères`);

  const canonicals = links(html, 'canonical');
  if (canonicals.length !== 1) fail(url, `${canonicals.length} canonical — il en faut exactement une`);
  else if (!canonicals[0].startsWith('https://')) fail(url, `canonical non absolue : ${canonicals[0]}`);

  const ogUrl = metas(html, 'property', 'og:url')[0];
  if (canonicals[0] && ogUrl && canonicals[0] !== ogUrl) {
    fail(url, `og:url (${ogUrl}) diffère de la canonical (${canonicals[0]})`);
  }

  for (const image of [metas(html, 'property', 'og:image')[0], metas(html, 'name', 'twitter:image')[0]]) {
    if (image && !image.startsWith('https://')) fail(url, `image de partage non absolue en https : ${image}`);
  }

  /*
   * Les dimensions ne sont plus émises que lorsqu'elles sont connues. Si elles le sont, elles
   * doivent être VRAIES — c'est la seule vérification qui demande de télécharger l'image, donc
   * elle n'a lieu qu'en `--all`.
   */
  const declared = {
    width: Number(metas(html, 'property', 'og:image:width')[0]),
    height: Number(metas(html, 'property', 'og:image:height')[0]),
  };

  const alternates = (html.match(/<link[^>]*hreflang="[^"]*"[^>]*>/gi) || []).length;
  if (alternates > 0 && alternates !== 3) fail(url, `${alternates} alternates hreflang (fr, en, x-default attendus)`);

  for (const block of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || []) {
    const json = block.replace(/<\/?script[^>]*>/gi, '');
    try {
      JSON.parse(json);
    } catch {
      fail(url, 'JSON-LD invalide — Google ignore un bloc malformé');
    }
  }

  return {
    noIndex: /content="noindex/i.test(metas(html, 'name', 'robots')[0] || ''),
    title: found[0] || '',
    declared,
    ogImage: metas(html, 'property', 'og:image')[0],
  };
}

async function main() {
  console.log(`Cible : ${BASE}\n`);

  const sitemapResponse = await fetch(`${BASE}/sitemap.xml`, { headers: { 'User-Agent': UA } });
  if (!sitemapResponse.ok) {
    console.error(`sitemap.xml inaccessible (HTTP ${sitemapResponse.status})`);
    process.exit(1);
  }
  const sitemap = await sitemapResponse.text();
  const declared = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Sitemap : ${declared.length} URL déclarées`);

  /*
   * L'échantillon prend une URL PAR FAMILLE plutôt que les vingt-quatre premières : les
   * défauts trouvés étaient tous concentrés sur une famille entière (les questions de la FAQ, les
   * CGU). Un échantillon en tête de liste ne les aurait jamais vus.
   */
  const families = new Map();
  for (const url of declared) {
    const key = new URL(url).pathname.split('/').slice(0, 3).join('/').replace(/\/$/, '') || '/';
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(url);
  }
  const targets = ALL
    ? declared
    : [...families.values()].flatMap((urls) => urls.slice(0, Math.max(1, Math.ceil(SAMPLE / families.size))));

  console.log(`Vérification de ${targets.length} URL (${families.size} familles)\n`);

  const seenTitles = new Map();
  let checked = 0;

  for (const url of targets) {
    let page;
    try {
      page = await get(url);
    } catch (error) {
      fail(url, `injoignable : ${error.message}`);
      continue;
    }

    if (page.status >= 300 && page.status < 400) {
      // Une redirection déclarée au sitemap est signalée par Google en « page avec
      // redirection » et n'est jamais indexée.
      fail(url, `déclarée au sitemap mais répond ${page.status} vers ${page.location}`);
      continue;
    }
    if (page.status !== 200) {
      fail(url, `déclarée au sitemap mais répond ${page.status}`);
      continue;
    }

    const result = checkPage(url, page.html);
    checked++;

    /*
     * L'IMAGE DE PARTAGE DOIT RÉPONDRE. C'est devenu la vérification la plus importante du
     * lot depuis que `og:image` désigne une carte générée (`/og/**.png`) plutôt qu'un fichier
     * statique : une image qui ne répond pas ne dégrade pas l'aperçu, elle le supprime.
     */
    if (result.ogImage) {
      try {
        const probe = await fetch(result.ogImage, {
          method: 'GET',
          headers: { 'User-Agent': UA, Range: 'bytes=0-0' },
          redirect: 'follow',
        });
        if (!probe.ok && probe.status !== 206) {
          fail(url, `og:image répond ${probe.status} — le lien partagé n'aura aucune vignette`);
        } else if (!(probe.headers.get('content-type') || '').startsWith('image/')) {
          fail(url, `og:image n'est pas une image (${probe.headers.get('content-type')})`);
        }
      } catch {
        fail(url, 'og:image injoignable');
      }
    }

    /*
     * LA CONTRADICTION QUI A COÛTÉ LE PLUS CHER. Une URL au sitemap demande aux moteurs de
     * l'indexer ; un `noindex` sur la page le leur interdit. Les deux fichiers étaient justes
     * séparément — c'est exactement ce que ce script existe pour voir.
     */
    if (result.noIndex) fail(url, 'déclarée au sitemap et servie en noindex');

    if (result.title) {
      const previous = seenTitles.get(result.title);
      if (previous) warn(url, `même titre que ${previous}`);
      else seenTitles.set(result.title, url);
    }

    if (ALL && result.declared.width && result.ogImage) {
      try {
        const buffer = Buffer.from(await (await fetch(result.ogImage)).arrayBuffer());
        const real = imageSize(buffer);
        if (real && (real.width !== result.declared.width || real.height !== result.declared.height)) {
          fail(url, `og:image annoncée ${result.declared.width}×${result.declared.height}, réelle ${real.width}×${real.height}`);
        }
      } catch {
        warn(url, 'image de partage non mesurable');
      }
    }
  }

  console.log(`${checked} pages lues.\n`);
  for (const { url, message } of warnings) console.log(`  ⚠  ${message}\n     ${url}`);
  for (const { url, message } of errors) console.log(`  ✖  ${message}\n     ${url}`);

  if (errors.length === 0) {
    console.log(`\n✔ Aucune contradiction. ${warnings.length} avertissement(s).`);
    process.exit(0);
  }
  console.log(`\n✖ ${errors.length} erreur(s), ${warnings.length} avertissement(s).`);
  process.exit(1);
}

/** Dimensions d'un PNG ou d'un JPEG, lues dans l'en-tête — sans dépendance. */
function imageSize(buffer) {
  if (buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      const marker = buffer[offset + 1];
      // SOF0..SOF15, hors marqueurs qui ne décrivent pas une trame.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return null;
}

main();
