#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * `og:cards` — LES IMAGES D'APERÇU, RENDUES AU BUILD.
 *
 * L'audit du 03/09/2026 : dix-huit pages statiques et toutes les questions de la FAQ
 * partageaient UNE photographie, sans titre ni logo. Deux liens vers deux pages différentes
 * produisaient exactement le même aperçu dans un fil — rien ne les distinguait au moment où
 * quelqu'un décide de cliquer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI AU BUILD, ET PAS À LA REQUÊTE.
 *
 * La première version de ce travail rendait les cartes à la demande, dans une Cloud Function
 * appelée par le Worker. `functions/` a été supprimé le 03/09/2026 — le projet est repassé au
 * plan Spark, il n'y a plus de Cloud Functions du tout. Et rasteriser dans un Worker demande
 * plusieurs mégaoctets de WebAssembly sur le chemin de chaque page vue.
 *
 * Rendre au build supprime la question : les cartes sont des fichiers statiques servis par
 * l'hébergement, à coût d'exécution nul, sans démarrage à froid dans le chemin d'un robot et
 * sans aucune dépendance de production. Le prix à payer est qu'une page créée APRÈS le
 * dernier passage de ce script n'a pas encore sa carte — d'où la réécriture d'hébergement
 * vers `_fallback.png`, qui garantit qu'aucun `og:image` ne répond jamais 404.
 *
 *   node scripts/og-cards.mjs          # écrit dans public/og/
 *   node scripts/og-cards.mjs --check  # échoue s'il manque une carte, sans rien écrire
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { build } from 'esbuild';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'og');
const CHECK_ONLY = process.argv.includes('--check');

const WIDTH = 1200;
const HEIGHT = 630;
/** Marge de sûreté : les plateformes rognent les bords d'une image de partage. */
const PAD = 84;

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUCUNE COULEUR N'EST ÉCRITE DANS CE FICHIER — elles viennent toutes de
 * `src/design-system/tokens.generated.ts`, lui-même produit des copies littérales du kit.
 *
 * La première version de ce script prenait ses teintes dans
 * `Max-Morrys_BrandKit_Complet/06_Tokens_Design/brand-tokens.json` : #072B49, #0074C5,
 * #ED9516. C'est le kit MARKETING, celui des visuels de publication — et aucune de ces trois
 * couleurs n'existe dans le design system du produit, qui pose #0057BC, #F38B0A, #6C23DD,
 * #02AC9C. Les cartes étaient donc hors charte de bout en bout, sur la surface qui représente
 * le site partout ailleurs qu'à l'écran.
 *
 * Lire les jetons plutôt que les recopier ferme la question : le jour où le kit change, les
 * cartes changent avec lui, et `ds:check` continue de garantir que ces jetons sont bien la
 * copie littérale du kit livré (AD-1).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Les trois familles du design system.
 *
 * Le sourcil est en MONOSPACE — `typography.css` l'écrit noir sur blanc (« Sourcil
 * monospace ») et `TerritoryCard` le répète pour son `meta`. La première version le rendait
 * en Schibsted Grotesk : c'était la deuxième entorse, après les couleurs.
 */
const FONTS = [
  { name: 'Fraunces', weight: 900, css: 'Fraunces:opsz,wght@9..144,900' },
  { name: 'Schibsted Grotesk', weight: 600, css: 'Schibsted+Grotesk:wght@600' },
  { name: 'JetBrains Mono', weight: 700, css: 'JetBrains+Mono:wght@700' },
];

/** `-.038em` → pixels, à la taille rendue. Satori ne résout pas les unités relatives. */
function emToPx(value, fontSize) {
  return Math.round(parseFloat(value) * fontSize * 100) / 100;
}

/**
 * `fetch` qui réessaie.
 *
 * Ce script dépend du réseau pour deux choses — les polices et la FAQ — et il tourne au
 * build, donc potentiellement en CI. Un délai de connexion transitoire vers Google Fonts
 * ferait échouer un déploiement entier pour une raison qui n'a rien à voir avec le code ;
 * c'est arrivé au premier essai, sur une adresse qui répondait normalement la seconde
 * d'avant.
 */
async function fetchRetry(url, options = {}, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
      if (response.ok) return response;
      last = new Error(`HTTP ${response.status}`);
    } catch (error) {
      last = error;
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw new Error(`${url} : ${last?.message ?? 'échec'}`);
}

/**
 * Récupère un fichier de police utilisable par satori.
 *
 * Google Fonts sert du WOFF2 aux navigateurs modernes, que satori ne sait pas lire. Un
 * User-Agent ancien fait basculer l'API sur du TTF — c'est le seul moyen d'obtenir le format
 * attendu depuis cette source, et c'est stable depuis des années.
 *
 * Le fichier est mis en cache hors du dépôt : les polices ne changent pas, et relancer le
 * script ne doit pas re-télécharger deux cents kilooctets à chaque fois.
 */
async function loadFont({ css, name, weight }) {
  const cacheDir = join(ROOT, 'node_modules', '.cache', 'og-cards');
  const cacheFile = join(cacheDir, `${name.replace(/\s+/g, '-')}-${weight}.ttf`);
  if (existsSync(cacheFile)) return readFile(cacheFile);

  const cssUrl = `https://fonts.googleapis.com/css2?family=${css}&display=swap`;
  const sheet = await fetchRetry(cssUrl, { headers: { 'User-Agent': 'Mozilla/4.0' } });
  const text = await sheet.text();
  const match = text.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error(`Aucune URL de police dans la réponse pour ${css}`);
  const file = await fetchRetry(match[1]);
  const data = Buffer.from(await file.arrayBuffer());

  await mkdir(cacheDir, { recursive: true });
  await writeFile(cacheFile, data);
  return data;
}

/**
 * Importe un module TypeScript du dépôt.
 *
 * Les pages statiques et la construction des adresses vivent dans le Worker, en TypeScript.
 * Les recopier ici serait une troisième source de vérité — exactement ce que
 * `segments-sync.test.ts` a été écrit pour empêcher ailleurs. On les compile donc à la volée.
 */
async function importTs(relativePath) {
  const dir = await mkdtemp(join(tmpdir(), 'og-cards-'));
  const outfile = join(dir, 'module.mjs');
  await build({
    entryPoints: [join(ROOT, relativePath)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  const module = await import(`file://${outfile}`);
  await rm(dir, { recursive: true, force: true });
  return module;
}

/** Miroir de `slugify` (`src/lib/utils.ts`) — l'adresse d'une question en est dérivée. */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Les questions publiées, lues directement — la collection `faq` est en lecture publique. */
async function faqPages() {
  const base =
    'https://firestore.googleapis.com/v1/projects/max-morrys/databases/(default)/documents/faq';
  const pages = [];
  let token;
  do {
    const url = `${base}?pageSize=300&mask.fieldPaths=question&mask.fieldPaths=slug${
      token ? `&pageToken=${token}` : ''
    }`;
    const body = await (await fetchRetry(url)).json();
    for (const doc of body.documents ?? []) {
      const question = doc.fields?.question?.stringValue;
      const authored = doc.fields?.slug?.stringValue?.trim();
      if (!question) continue;
      pages.push({ path: `/faq/${slugify(authored || question)}`, title: question });
    }
    token = body.nextPageToken;
  } while (token);
  return pages;
}

/** Découpe un titre en lignes qui tiennent dans la largeur utile, sans couper de mot. */
function wrap(title, perLine) {
  const lines = [];
  let current = '';
  for (const word of title.split(/\s+/)) {
    if (!current) current = word;
    else if ((current + ' ' + word).length <= perLine) current += ' ' + word;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Taille du titre, sur l'échelle d'affichage du système.
 *
 * `typography.css` donne les paliers : `--fs-dsp-xxl` 74, `--fs-dsp-xl` 64, `--fs-dsp` 41.
 * Une carte lue en vignette dans un fil réclame le haut de l'échelle ; un titre long redescend
 * d'un cran plutôt que d'être rétréci à une valeur inventée.
 */
function titleSize(title, T) {
  const xxl = parseInt(T.fsDspXxl, 10);
  const xl = parseInt(T.fsDspXl, 10);
  const dsp = parseInt(T.fsDsp, 10);
  if (title.length <= 42) return xxl;
  if (title.length <= 78) return xl;
  return dsp;
}

const row = (children, style = {}) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

const text = (content, style) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: content },
});

/**
 * La carte, dérivée de `TerritoryCard` — la primitive de surface du système.
 *
 * Elle en reprend le dégradé (`linear-gradient(150deg, --g-<territoire>-1, --g-<territoire>-2)`),
 * son encre (`--card-ink` / `--card-ink-2`, jamais codée en dur — c'est ce que dit son
 * en-tête) et son sourcil monospace.
 *
 * DEUX ÉCARTS ASSUMÉS, ET LEURS RAISONS :
 *
 *   • Pas de `--r-l` sur le cadre. La carte occupe les 1200 × 630 entiers ; arrondir ses
 *     angles laisserait quatre coins transparents que chaque plateforme composite sur un fond
 *     qu'on ne connaît pas. Les angles sont de toute façon rognés à l'affichage.
 *   • Un filet d'`--arc` en tête. C'est la signature du système, la seule chose qui relie
 *     visuellement les cinq territoires entre eux — et sur une image isolée dans un fil,
 *     c'est ce qui dit « même maison » quand la teinte, elle, dit « quel étage ».
 */
function card({ title, eyebrow, territory }, T) {
  const size = titleSize(title, T);
  // Fraunces 900 avance d'environ 0,5 em par caractère ; la largeur utile divisée par cette
  // avance donne le nombre de signes qu'une ligne peut porter.
  const perLine = Math.max(12, Math.floor((WIDTH - PAD * 2) / (size * 0.5)));
  const lines = wrap(title, perLine).slice(0, 3);

  const eyebrowSize = 26;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        // Le dégradé de carte territoire du système, à son angle : 150 degrés. Les pages
        // hors territoire prennent la surface neutre — voir `ogTerritory`.
        backgroundImage: surface(territory, T),
        padding: `${PAD}px`,
        fontFamily: 'Schibsted Grotesk',
      },
      children: [
        // Le filet d'arc — signature du système, en tête de carte.
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${WIDTH}px`,
              height: '10px',
              backgroundImage: T.arc,
            },
          },
        },
        text(eyebrow.toUpperCase(), {
          fontFamily: 'JetBrains Mono',
          fontWeight: 700,
          fontSize: `${eyebrowSize}px`,
          letterSpacing: `${emToPx(T.lsEyebrow, eyebrowSize)}px`,
          color: T.cardInk2,
        }),
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: lines.map((line) =>
              text(line, {
                fontFamily: 'Fraunces',
                fontWeight: 900,
                fontSize: `${size}px`,
                // L'interlettrage NÉGATIF et l'interligne serré sont ce qui fait le titre
                // d'affichage du système. Sans eux, Fraunces 900 rend comme un serif générique.
                letterSpacing: `${emToPx(T.lsDspXl, size)}px`,
                lineHeight: T.lhDspXl,
                color: T.cardInk,
              }),
            ),
          },
        },
        row(
          [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  width: '100%',
                  height: '1px',
                  backgroundColor: T.borderHair,
                  marginBottom: '20px',
                },
              },
            },
            text('maxmorrys.me', {
              fontWeight: 600,
              fontSize: '26px',
              color: T.cardInk2,
            }),
          ],
          { flexDirection: 'column' },
        ),
      ],
    },
  };
}

/** `forme` → `Forme`, pour composer les noms de jetons `gForme1` / `gForme2`. */
function cap(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Le fond de la carte.
 *
 * Un territoire donne son couple de dégradé ; l'absence de territoire donne la surface neutre
 * du système, du papier au papier tertiaire. Aucune valeur n'est écrite ici.
 */
function surface(territory, T) {
  if (territory === 'neutre') {
    return `linear-gradient(150deg, ${T.paper} 0%, ${T.paper3} 100%)`;
  }
  return `linear-gradient(150deg, ${T[`g${cap(territory)}1`]} 0%, ${T[`g${cap(territory)}2`]} 100%)`;
}

async function render(page, fonts, T) {
  const svg = await satori(card(page, T), { width: WIDTH, height: HEIGHT, fonts });
  const png = Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng(),
  );

  /*
   * RECOMPRESSION SANS PERTE — 196 Ko à la sortie de resvg, 44 Ko après (mesuré).
   *
   * C'est le sujet même de ce travail : une image de partage est téléchargée par chaque
   * robot et par chaque plateforme où le lien circule, sur un marché où le forfait mobile se
   * compte. `palette: true` descendait à 62 Ko seulement, et au prix d'une quantification du
   * dégradé : la compression maximale sans palette fait mieux ET ne perd rien.
   */
  return sharp(png).png({ compressionLevel: 9, effort: 10 }).toBuffer();
}

async function main() {
  const [{ staticPages }, { ogCardTitle, ogEyebrow, ogTerritory }, { tokens }] = await Promise.all([
    importTs('worker/apps/site/src/prerender/static-pages.ts'),
    importTs('worker/apps/site/src/prerender/og-url.ts'),
    importTs('src/design-system/tokens.generated.ts'),
  ]);

  /*
    Le jeu CLAIR. Les cartes territoire du système sont des pastels sur encre sombre, et une
    carte de partage est lue dans un fil dont on ne connaît pas le thème : elle ne suit donc
    pas la préférence de qui la regarde, elle en choisit une. Le clair est celui du site
    public, qui est la page vers laquelle le lien mène.
  */
  const T = tokens.light;

  const pages = [
    ...Object.entries(staticPages).map(([path, meta]) => ({ path, title: meta.title })),
    ...(await faqPages()),
  ];

  /*
   * La carte de repli, servie par la réécriture d'hébergement `/og/** → /og/_fallback.png`
   * quand une page n'a pas encore la sienne. Sans elle, un `og:image` en 404 supprimerait
   * l'aperçu du lien — strictement pire que la photographie générique d'avant.
   */
  pages.push({ path: '/_fallback', title: 'Maîtrise le digital, accélère ta croissance' });

  /*
   * LA CARTE DES CERTIFICATS — une seule, générique, et c'est la seule possible.
   *
   * Un certificat n'existe pas au moment du build : sa carte ne peut donc pas porter le nom
   * du titulaire. Rendre à la demande demanderait des mégaoctets de WebAssembly sur le chemin
   * de chaque page vue, ce que l'en-tête de ce script a refusé.
   *
   * Ce qu'elle remplace n'est pas « rien » : c'était la PHOTO DE LA PAGE D'ACCUEIL, servie
   * par `index.html` sur toute adresse `/certificat/*`. Le nom et la formation, eux, sont
   * personnalisés — dans le titre et la description, que `prerender/certificat.ts` écrit.
   *
   * ⚠️ Le chemin est SANS code : `og/certificat.png`, pas `og/certificat/<code>.png`. C'est
   * exactement ce que `prerender/certificat.ts` annonce en dur.
   */
  pages.push({ path: '/certificat', title: 'Certificat vérifié' });

  const targets = pages.map((page) => ({
    ...page,
    // `/` → `public/og.png` ; `/faq/x` → `public/og/faq/x.png`.
    file: join(ROOT, 'public', page.path === '/' ? 'og.png' : `og${page.path}.png`),
    eyebrow: page.path === '/_fallback' ? 'Max-Morrys' : ogEyebrow(page.path, 'fr'),
    // La teinte vient du territoire de la page — c'est le système qui le décide, pas ce script.
    territory: page.path === '/_fallback' ? 'neutre' : ogTerritory(page.path),
  }));

  if (CHECK_ONLY) {
    const missing = targets.filter((t) => !existsSync(t.file));
    if (missing.length === 0) {
      console.log(`✔ ${targets.length} cartes présentes.`);
      return;
    }
    console.error(`✖ ${missing.length} carte(s) manquante(s) — lancer \`npm run og:cards\` :`);
    for (const t of missing) console.error(`   ${t.path}`);
    process.exit(1);
  }

  const fonts = await Promise.all(
    FONTS.map(async (font) => ({
      name: font.name,
      weight: font.weight,
      style: 'normal',
      data: await loadFont(font),
    })),
  );

  await mkdir(OUT_DIR, { recursive: true });
  let written = 0;
  let bytes = 0;

  for (const target of targets) {
    const png = await render(
      { title: ogCardTitle(target.title), eyebrow: target.eyebrow, territory: target.territory },
      fonts,
      T,
    );
    await mkdir(dirname(target.file), { recursive: true });
    // Ne réécrire que ce qui change : le dépôt suit ces fichiers, un octet différent est un
    // diff de plus à relire.
    const previous = existsSync(target.file) ? await readFile(target.file) : null;
    if (!previous || !previous.equals(png)) {
      await writeFile(target.file, png);
      written++;
    }
    bytes += png.length;
  }

  const parTerritoire = targets.reduce((acc, t) => ({ ...acc, [t.territory]: (acc[t.territory] ?? 0) + 1 }), {});
  console.log(
    `${targets.length} cartes (${written} modifiée(s)) · ${Math.round(bytes / targets.length / 1024)} Ko en moyenne`,
  );
  console.log(`Territoires : ${Object.entries(parTerritoire).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
}

main().catch((error) => {
  // Le message seul ne dit rien d'un `fetch failed` : la cause et la pile, si.
  console.error(error.stack || error.message);
  if (error.cause) console.error('Cause :', error.cause);
  process.exit(1);
});
