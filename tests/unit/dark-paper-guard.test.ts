import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AD-29 · LE PAPIER BRUT NE SE POSE PAS EN FOND (audit du 03/11/2026 — 1, E2, C1).
 *
 * `--paper`, `--paper-2`, `--paper-3` ne basculent PAS sous `.dk` (AD-22) alors que `--ink`
 * passe à #ECF0F5. Un fond posé sur l'un d'eux affiche donc, en nuit, du texte clair sur un
 * fond clair : 1,1:1 sur la réservation de /contact, 1,17:1 sur l'actif du menu Edu, 1,07:1
 * sur le conteneur du Club. Aucune capture en mode clair ne le montre.
 *
 * Deux portes :
 *   1 · aucun `.tsx` de `src/` ne pose un `--paper*` brut en fond (il prend `--surface-band`,
 *       `--surface-sheet` ou `--surface-page`, qui valent `--paper*` en clair) ;
 *   2 · toute règle du kit généré qui pose un `--paper*` en fond a son sélecteur repris dans
 *       `overrides/ad-29-papier-nuit.css`, sous `.dk`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const ROOT = resolve(__dirname, '../..');
const SRC = join(ROOT, 'src');
const CSS_DIR = join(SRC, 'design-system/css');

/** Exceptions explicites (aucune à ce jour : CoursePlayer et RysmoWidget sont passés aux surfaces). */
const EXCLUDED = new Set<string>([]);

/** Retire les commentaires : l'en-tête qui explique l'interdit ne doit pas le déclencher. */
function stripTsComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const PAPER = String.raw`var\(--paper(?:-2|-3)?\)`;

/**
 * Les poses en fond d'un papier brut. Les mélanges translucides (`color-mix(…, transparent)`)
 * ne sont PAS visés : ce sont des voiles, pas des aplats.
 */
const TSX_PATTERNS: RegExp[] = [
  // Tailwind : `bg-[color:var(--paper-2)]`, avec ou sans préfixe de variante.
  new RegExp(String.raw`bg-\[(?:color:)?${PAPER}\]`, 'g'),
  // Style en ligne : `background: 'var(--paper-2)'`, y compris en branche de ternaire.
  new RegExp(String.raw`background(?:Color)?\s*:[^,}]*?['"\`]${PAPER}['"\`]`, 'g'),
  // `SiteBand tint="var(--paper)"` et consorts.
  new RegExp(String.raw`(?:tint|bg|background)=\{?['"\`]${PAPER}['"\`]`, 'g'),
  // Utilitaires Tailwind `bg-paper`, `bg-paper-2`, `bg-paper-3`, avec préfixe de variante (pas `-fixed`).
  /(?<![\w-])bg-paper(?:-2|-3)?(?![\w-])/g,
];

function findRawPaperBackgrounds(code: string): string[] {
  const clean = stripTsComments(code);
  return TSX_PATTERNS.flatMap((re) => [...clean.matchAll(re)].map((m) => m[0]));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

describe('AD-29 · papier brut en fond — composants', () => {
  it('le détecteur attrape les formes interdites et laisse passer les voiles', () => {
    expect(findRawPaperBackgrounds('<div className="p-4 bg-[color:var(--paper-2)]" />')).toHaveLength(1);
    expect(findRawPaperBackgrounds('<div className="wide:bg-[color:var(--paper)]" />')).toHaveLength(1);
    expect(findRawPaperBackgrounds("style={{ background: 'var(--paper-2)' }}")).toHaveLength(1);
    expect(findRawPaperBackgrounds("style={{ background: x ? 'var(--ink)' : 'var(--paper-3)' }}")).toHaveLength(1);
    expect(findRawPaperBackgrounds('<SiteBand tint="var(--paper)" />')).toHaveLength(1);
    expect(findRawPaperBackgrounds('<div className="p-2 bg-paper" />')).toHaveLength(1);
    expect(findRawPaperBackgrounds('<div className="dark:bg-paper-2 hover:bg-paper-3" />')).toHaveLength(2);
    expect(findRawPaperBackgrounds('<div className="bg-paper-fixed" />')).toHaveLength(0);
    // Autorisés : voiles translucides, jetons fixes, jetons qui basculent, commentaires.
    expect(findRawPaperBackgrounds('bg-[color-mix(in_srgb,var(--paper)_20%,transparent)]')).toHaveLength(0);
    expect(findRawPaperBackgrounds("style={{ background: 'var(--paper-fixed)' }}")).toHaveLength(0);
    expect(findRawPaperBackgrounds("style={{ background: 'var(--surface-band)' }}")).toHaveLength(0);
    expect(findRawPaperBackgrounds('/* jadis bg-[color:var(--paper-2)] */')).toHaveLength(0);
  });

  it('aucun .tsx de src/ ne pose --paper / --paper-2 / --paper-3 en fond', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = relative(ROOT, file).split('\\').join('/');
      if (EXCLUDED.has(rel)) continue;
      for (const hit of findRawPaperBackgrounds(readFileSync(file, 'utf8'))) offenders.push(`${rel} → ${hit}`);
    }
    expect(
      offenders,
      'Fond en papier brut : il reste clair en nuit. Utiliser --surface-band, --surface-sheet ou --surface-page (AD-22).',
    ).toEqual([]);
  });
});

/* ── CSS : règles et sélecteurs ──────────────────────────────────────────────── */

type Rule = { selectors: string[]; body: string };

/** Découpe une liste de sélecteurs sur les virgules de PREMIER niveau (`:not(a, b)` reste entier). */
function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
}

/** Les règles feuilles (celles d'un `@media` comprises). */
function rules(css: string): Rule[] {
  return [...stripCssComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selectors: splitSelectors(m[1]),
    body: m[2],
  }));
}

const isDk = (sel: string) => /^\.dk(?=[\s.[:])/.test(sel);

/** `.dk .x:hover:not([aria-current])` → `.x:hover` ; `.dk.mm[data-theme]` → `.mm[data-theme]`. */
function baseOfDk(sel: string): string {
  return sel
    .replace(/^\.dk\s*/, '')
    .replace(/(?::not\([^()]*(?:\([^()]*\)[^()]*)*\))+$/, '')
    .trim();
}

const BG_PAPER = new RegExp(String.raw`(?:^|[;{\s])background(?:-color)?\s*:[^;]*${PAPER}`);
const BG_INK = /(?:^|[;{\s])background\s*:\s*var\(--ink\)\s*(?:;|$)/;
const COLOR_PAPER = /(?:^|[;{\s])color\s*:\s*var\(--paper\)\s*(?:;|$)/;

const KIT = rules(readFileSync(join(CSS_DIR, 'kit-v3/components.css'), 'utf8'));
const AD29 = rules(readFileSync(join(CSS_DIR, 'overrides/ad-29-papier-nuit.css'), 'utf8'));

/** Les règles `.dk` d'ad-29 dont un sélecteur, dépouillé de `.dk` et de `:not(…)`, vaut EXACTEMENT `sel`. */
function dkCounterparts(sel: string): Rule[] {
  return AD29.filter((r) => r.selectors.some((s) => isDk(s) && baseOfDk(s) === sel));
}

describe('AD-29 · papier brut en fond — kit généré', () => {
  it('chaque règle du kit qui pose un --paper* en fond est reprise sous .dk dans ad-29, sans papier', () => {
    const kitSelectors = KIT.filter((r) => BG_PAPER.test(r.body) && !r.selectors.every(isDk)).flatMap(
      (r) => r.selectors,
    );
    // Garde-fou : si le kit change de forme et que plus rien n'est trouvé, le test doit le dire.
    expect(kitSelectors.length).toBeGreaterThan(0);

    const missing = kitSelectors.filter((sel) => {
      const twins = dkCounterparts(sel).filter((r) => /background(?:-color)?\s*:/.test(r.body));
      return twins.length === 0 || twins.some((r) => r.body.includes('var(--paper'));
    });
    expect(missing, 'Règles du kit en papier brut sans pendant nuit (ou pendant encore en papier) dans ad-29').toEqual([]);
  });

  it('chaque paire inversée `background:var(--ink); color:var(--paper)` du kit a un pendant .dk', () => {
    const pairs = KIT.filter((r) => BG_INK.test(r.body) && COLOR_PAPER.test(r.body)).flatMap((r) => r.selectors);
    expect(pairs.length).toBeGreaterThan(0);

    const missing = pairs.filter((sel) => {
      const twins = dkCounterparts(sel).filter((r) => /(?:^|[;{\s])color\s*:/.test(r.body));
      return twins.length === 0 || twins.some((r) => r.body.includes('var(--paper'));
    });
    expect(missing, 'Blanc sur encre claire en nuit : donner à ces règles un texte `--ink-fixed` sous .dk dans ad-29').toEqual(
      [],
    );
  });
});

describe('AD-29 · papier brut en fond — CSS écrit à la main', () => {
  function walkCss(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walkCss(p, out);
      else if (p.endsWith('.css')) out.push(p);
    }
    return out;
  }

  it('aucune feuille de src/ (hors jetons, kit généré et ad-29) ne pose un --paper* en fond hors .dk', () => {
    const offenders: string[] = [];
    for (const file of walkCss(SRC)) {
      const rel = relative(ROOT, file).split('\\').join('/');
      if (/\/(tokens|kit-v3)\//.test(rel) || rel.endsWith('ad-29-papier-nuit.css')) continue;
      for (const r of rules(readFileSync(file, 'utf8'))) {
        if (!BG_PAPER.test(r.body)) continue;
        const outside = r.selectors.filter((s) => !isDk(s));
        if (outside.length) offenders.push(`${rel} → ${outside.join(', ')}`);
      }
    }
    expect(offenders, 'Fond en papier brut : utiliser --surface-band ou --surface-sheet (AD-22).').toEqual([]);
  });
});
