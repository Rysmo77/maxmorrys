#!/usr/bin/env node
/**
 * Max-Morrys_DS_Platform/kit-v3/bundle.css  ->  src/design-system/css/kit-v3/components.css   (AD-27)
 *
 * LE KIT v3 NE SE COPIE PAS LITTÉRALEMENT, IL SE TRADUIT.
 *
 * `ds:sync` copie octet pour octet les feuilles du kit précédent (AD-1). Le kit v3 (« v4.5 »,
 * relivré le 29/10/2026) change de CONVENTION : il nomme `--brand-*`, `--pastel-*`, `--font-*`,
 * bascule le sombre par `[data-theme="dark"]`, et déclare ses propres replis de mouvement.
 * Le copier tel quel aurait (a) dupliqué chaque jeton sous un second nom, (b) laissé ses 21
 * règles sombres inertes — le dépôt bascule par la classe `.dk` (ThemeContext, lowfi) —, et
 * (c) fait échouer quatre des six règles de `ds:check`.
 *
 * La traduction est donc MÉCANIQUE et rejouable, jamais faite à la main :
 *   1. seule la partie WEB est prise (la partie `mm-r-*` décrit l'application native,
 *      portée en React Native dans `mobile/ds/`) ;
 *   2. les noms du kit sont ramenés aux jetons du dépôt (table `RENOMMAGE`) ;
 *   3. `[data-theme="dark"]` devient `.dk`, `[data-theme="light"]` devient `:root` ;
 *   4. un jeton de recette que le dépôt déclare déjà n'est pas redéclaré (mêmes valeurs,
 *      vérifiées le 29/10/2026 : `--fill-1..3`, `--field-bg`, `--glass-brd`) ;
 *   5. `backdrop-filter` est retiré : le seul flou du produit vit dans `brand/surfaces.css`
 *      (règle 1). Le chrome fixe garde `.glass` ; `.mm-glass` devient un voile opaque-ish ;
 *   6. les replis `prefers-reduced-motion: reduce` / `prefers-reduced-transparency` /
 *      `@supports not (backdrop-filter)` sont retirés — `brand/fallback.css` est le SEUL lieu
 *      des replis (règle 4), et il éteint déjà toute animation sous « réduire ». Le bloc
 *      `prefers-reduced-motion: no-preference` est DÉBALLÉ : son contenu reste, gardé par ce
 *      même repli global ;
 *   7. les six classes en collision avec le dépôt sont traitées une par une (`COLLISIONS`).
 *
 *   node scripts/ds-kit-v3.mjs           # écrit la feuille
 *   node scripts/ds-kit-v3.mjs --check   # sortie 1 si la feuille diverge de la traduction
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KIT_V3_SRC = join(root, 'Max-Morrys_DS_Platform/kit-v3/bundle.css');
export const KIT_V3_DST = join(root, 'src/design-system/css/kit-v3/components.css');

/** Où s'arrête la partie web : la suite décrit l'application native. */
const FIN_WEB = '/* ═════ Rysmo · application mobile';

/** Noms du kit -> jetons du dépôt. Le plus long d'abord : `--brand-bleu` avant `--brand`. */
const RENOMMAGE = [
  ['--brand-bleu', '--mm-bleu-f'], ['--brand-orange', '--mm-orange-f'], ['--brand-violet', '--mm-violet-f'],
  ['--brand-teal', '--mm-teal-f'], ['--brand-corail', '--mm-corail-f'],
  ['--accent-violet-t', '--mm-violet-t'], ['--accent-orange-t', '--mm-orange-t'], ['--accent-teal-t', '--mm-teal-t'],
  ['--accent-bleu', '--mm-bleu'], ['--accent-violet', '--mm-violet'],
  ['--pastel-bleu', '--mm-bleu-c'], ['--pastel-violet', '--mm-violet-c'], ['--pastel-orange', '--mm-orange-c'],
  ['--pastel-teal', '--mm-teal-c'], ['--pastel-rose', '--mm-rose-c'],
  ['--font-display', '--f-display'], ['--font-body', '--f-body'], ['--font-mono', '--f-mono'],
  ['--sh-btn-edu', '--sh-bleu'], ['--sh-btn-club', '--sh-violet'], ['--sh-btn-studio', '--sh-teal'],
  ['--sh-glass-hl', '--glass-hl'], ['--sh-focus', '--focus-ring'], ['--h-btn', '--touch-btn'],
  ['--grad-edu', '--action-forme'], ['--grad-club', '--action-transforme'],
  ['--grad-studio', '--action-digitalise'], ['--grad-informe', '--action-informe'],
];

/**
 * LES SIX COLLISIONS. Chaque règle racine du kit qui porte l'une de ces classes est
 * remplacée par la version réconciliée ci-dessous ; les sous-éléments (`__logo`, `a`, …) du
 * kit restent tels quels — aucun consommateur du dépôt ne les écrit.
 *
 *  · mm-eyebrow — 13 consommateurs. Le rendu du kit l'emporte (crochets, 10,5 px, 600), la
 *    COULEUR reste `--text-eyebrow` : c'est elle qui porte la teinte du territoire au dépôt.
 *  · mm-topbar  — `Header.tsx` via la primitive `TopBar`, dont la géométrie est comptée par
 *    `--header-h` (80 px). La racine du kit (60 px de haut) est donc ÉCARTÉE ; ses sous-
 *    éléments (`__nav`, `__thumb`) sont disponibles.
 *  · mm-card / mm-field / mm-sidenav / mm-tabbar — aucun consommateur React. Le kit l'emporte.
 *    `.mm-tabbar` du kit est `absolute` (cadre de maquette) : le produit la fixe à la fenêtre,
 *    et la règle de rupture du dépôt (masquée dès 700 px) est réaffirmée APRÈS elle.
 */
const COLLISIONS = {
  '.mm-eyebrow{':
    '.mm-eyebrow{font-family:var(--f-mono);font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--text-eyebrow);display:inline-flex;align-items:center;gap:8px}',
  '.mm-topbar{': '',
  '.mm-tabbar{':
    '.mm-tabbar{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));height:70px;border-radius:24px;background:var(--bento);box-shadow:0 18px 40px -18px rgba(14,17,22,.4);border:1px solid var(--line);display:grid;grid-template-columns:repeat(var(--tabs,5),1fr);z-index:40}\n@media (min-width:700px){.mm-tabbar{display:none}}',
};

/** Retire un bloc @règle entier (accolades équilibrées) à partir de l'index `at`. */
function blocEnd(css, at) {
  let depth = 0;
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return i + 1;
  }
  return css.length;
}

function retirerBlocs(css, re) {
  let m;
  while ((m = re.exec(css))) {
    const end = blocEnd(css, m.index);
    css = css.slice(0, m.index) + css.slice(end);
    re.lastIndex = m.index;
  }
  return css;
}

function deballer(css, re) {
  let m;
  while ((m = re.exec(css))) {
    const open = css.indexOf('{', m.index);
    const end = blocEnd(css, m.index);
    css = css.slice(0, m.index) + css.slice(open + 1, end - 1) + css.slice(end);
    re.lastIndex = m.index;
  }
  return css;
}

/** Les noms de jetons que le dépôt déclare déjà (tokens/ + overrides/). */
function jetonsDuDepot() {
  const noms = new Set();
  for (const d of ['tokens', 'overrides']) {
    const dir = join(root, 'src/design-system/css', d);
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.css'))) {
      for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/(--[a-z0-9-]+)\s*:/gi)) noms.add(m[1]);
    }
  }
  return noms;
}

export function traduire(source) {
  let css = source.slice(0, source.indexOf(FIN_WEB));
  // 1 · l'en-tête du kit est remplacé par le nôtre (plus bas)
  css = css.replace(/^\/\*[\s\S]*?\*\/\n/, '');
  // 2 · thème
  css = css.replace(/:root,\[data-theme="light"\]/g, ':root')
    .replace(/\[data-theme="light"\]/g, ':root')
    .replace(/\[data-theme="dark"\]/g, '.dk');
  // 3 · noms
  for (const [de, vers] of RENOMMAGE) css = css.replace(new RegExp(`${de}(?![a-z0-9-])`, 'g'), vers);
  // 4 · recettes déjà déclarées par le dépôt
  const deja = jetonsDuDepot();
  css = css.replace(/^(:root|\.dk)\{([^{}]*)\}/gm, (all, sel, body) => {
    const kept = body.split(';').filter((decl) => {
      const m = decl.match(/^\s*(--[a-z0-9-]+)\s*:/i);
      return !(m && deja.has(m[1]));
    });
    return `${sel}{${kept.join(';')}}`;
  });
  // 5 · replis du flou — AVANT de retirer le flou : sinon la condition du @supports perd
  // son `backdrop-filter:` et l'en-tête mutilé (`@supports not ((`) n'est plus reconnu,
  // ce qui laissait un bloc ouvert et faisait ignorer tout le reste du fichier.
  css = retirerBlocs(css, /@supports not \(\(backdrop-filter/g);
  // 6 · flou
  css = css.replace(/-webkit-backdrop-filter:[^;}]*;?/g, '').replace(/backdrop-filter:(?!none)[^;}]*;?/g, '');
  // 7 · replis
  css = retirerBlocs(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/g);
  css = retirerBlocs(css, /@media\s*\(prefers-reduced-transparency:\s*reduce\)/g);
  css = deballer(css, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/g);
  // `.lowfi .mm-glass{backdrop-filter:none;…}` : plus rien à éteindre une fois le flou retiré.
  css = css.replace(/\.lowfi \.mm-glass\{backdrop-filter:none;?([^}]*)\}/, '.lowfi .mm-glass{$1}');
  // 7 · collisions
  for (const [tete, remplacement] of Object.entries(COLLISIONS)) {
    css = css.split('\n').map((l) => (l.startsWith(tete) ? remplacement : l)).join('\n');
  }
  // 8 · deux @keyframes homonymes de ceux du dépôt, au dessin différent (le squelette et le
  // reflet de `brand/`) : déclarés après, ceux du kit les auraient remplacés. Ils sont renommés.
  css = css.replace(/(?<![.\w-])mm-(shim|sweep)\b/g, 'mm-k-$1');
  // 9 · deux @keyframes dont le NOM dit « left » alors qu'ils n'animent que transform/opacity :
  // la règle 3 lit la ligne, pas la @keyframes. Renommés plutôt qu'exemptés.
  css = css.replace(/\bmm-(in|a)-left\b/g, 'mm-$1-gauche');
  css = css.replace(/\n{3,}/g, '\n\n');
  return (
    '/* ─────────────────────────────────────────────────────────────────────────\n' +
    '   TRADUCTION MÉCANIQUE de Max-Morrys_DS_Platform/kit-v3/bundle.css — NE PAS ÉDITER.\n' +
    '   Régénéré par `npm run ds:v3` (scripts/ds-kit-v3.mjs). AD-27 : noms du kit ramenés aux\n' +
    '   jetons du dépôt, `.dk` pour le sombre, aucun flou ni repli local, six collisions réglées.\n' +
    '   ───────────────────────────────────────────────────────────────────────── */\n' +
    css.trimEnd() + '\n'
  );
}

const estPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (estPrincipal) {
  if (!existsSync(KIT_V3_SRC)) {
    console.error('ds:v3 — source introuvable : Max-Morrys_DS_Platform/kit-v3/bundle.css');
    process.exit(1);
  }
  const attendu = traduire(readFileSync(KIT_V3_SRC, 'utf8'));
  if (process.argv.includes('--check')) {
    const got = existsSync(KIT_V3_DST) ? readFileSync(KIT_V3_DST, 'utf8') : '';
    if (got !== attendu) { console.error('ds:v3 — components.css diverge de la traduction : lancer npm run ds:v3'); process.exit(1); }
    console.log('ds:v3 — à jour.');
  } else {
    mkdirSync(dirname(KIT_V3_DST), { recursive: true });
    writeFileSync(KIT_V3_DST, attendu);
    console.log(`ds:v3 — ${attendu.split('\n').length} lignes écrites dans src/design-system/css/kit-v3/components.css`);
  }
}
