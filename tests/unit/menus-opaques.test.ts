import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AD-26 · UN MENU NE LAISSE RIEN PASSER — ET RIEN D'AUTRE NE LE VÉRIFIE.
 *
 * `ds:check` interdit d'AJOUTER un flou ; il ne dit rien d'un voile qui revient. Or les deux
 * modes de panne de cette décision sont silencieux :
 *
 *   1 · Un menu qui reprend `glass-flat` ou `glass`. Il rendrait « presque pareil » en mode
 *       clair sur un maillage — et laisserait lire la page au travers en nuit, où le voile
 *       tombe à 7 %. Personne ne le verrait sur une capture en mode clair.
 *
 *   2 · L'ENTRÉE COURANTE QUI DISPARAÎT. `--nav-on-bg` est un VOILE DE BLANC (70 %) : il se
 *       lisait parce que la colonne n'était elle-même qu'à 78 %. Composé sur une surface
 *       blanche OPAQUE il donne du blanc, et l'état actif de la navigation s'efface. C'est le
 *       défaut le plus coûteux de cette passe, et il ne se voit sur AUCUNE capture claire.
 *
 * Le test calcule au lieu de comparer à une valeur attendue : il reste vrai si le kit relivre
 * d'autres teintes. Il lit la cascade RÉELLE — jetons, marque, puis overrides, dans l'ordre de
 * `styles.css` — parce que c'est la valeur effective qui atteint l'écran.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const ROOT = resolve(__dirname, '../..');
const CSS_DIR = join(ROOT, 'src/design-system/css');

/* ── Couleur ─────────────────────────────────────────────────────────────────── */

function channel(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** `color-mix(in srgb, …)` mélange en sRGB ENCODÉ — pas en linéaire. C'est ce que fait le moteur. */
function mixSrgb(a: string, part: number, b: string): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const m = (x: number, y: number) => hex(x * part + y * (1 - part));
  return `#${m(ar, br)}${m(ag, bg)}${m(ab, bb)}`.toUpperCase();
}

/* ── Cascade ─────────────────────────────────────────────────────────────────── */

/** Les feuilles dans l'ordre de `styles.css` : jetons, marque, puis les écarts. */
function sheets(): string[] {
  const read = (sub: string) =>
    readdirSync(join(CSS_DIR, sub))
      .filter((f) => f.endsWith('.css'))
      .sort()
      .map((f) => readFileSync(join(CSS_DIR, sub, f), 'utf8'));
  return [...read('tokens'), ...read('brand'), ...read('overrides')];
}

/**
 * Les déclarations de la portée RACINE (`:root` et `.dk`), à l'exclusion de tout autre
 * sélecteur : `.mm-menu` redéclare `--nav-on-bg`, et le confondre avec la valeur de racine
 * ferait passer le test sur la mauvaise valeur.
 */
function rootDecls(scope: 'light' | 'dark'): Map<string, string> {
  const out = new Map<string, string>();
  for (const css of sheets()) {
    let inRoot = false;
    let night = false;
    for (const line of css.split('\n')) {
      const sel = line.match(/^\s*([^{}]+?)\s*\{\s*$/) ?? line.match(/^\s*([^{}]+?)\s*\{/);
      if (sel && !line.trimStart().startsWith('*')) {
        const s = sel[1].trim();
        inRoot = /^(:root|\.dk|:root\.dk|html)$/.test(s);
        night = /^\.dk$/.test(s);
      }
      if (/^\s*\}/.test(line)) { inRoot = false; night = false; }
      if (!inRoot) continue;
      /* PLUSIEURS DÉCLARATIONS PAR LIGNE. `tokens/colors.css` écrit les trois teintes nuit
         sur une seule : ne lire que la première faisait disparaître `--night-3`, donc
         `--surface-sheet` en mode sombre, donc tout le fond de menu — silencieusement. */
      if (night && scope !== 'dark') continue;
      for (const d of line.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out.set(d[1], d[2].trim());
    }
  }
  return out;
}

/** Suit les `var()` puis évalue un `color-mix(in srgb, …)`. Rend un hexadécimal, ou la valeur brute. */
function resolveToken(name: string, scope: 'light' | 'dark', depth = 0): string {
  const decls = rootDecls(scope);
  const v = decls.get(name);
  if (v === undefined || depth > 12) return v ?? '';

  const varRef = v.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (varRef) return resolveToken(varRef[1], scope, depth + 1);

  const mix = v.match(/^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/i);
  if (mix) {
    const one = (raw: string): string => {
      const r = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
      return r ? resolveToken(r[1], scope, depth + 1) : raw;
    };
    const a = one(mix[1]);
    const b = one(mix[3]);
    if (/^#[0-9A-Fa-f]{6}$/.test(a) && /^#[0-9A-Fa-f]{6}$/.test(b)) {
      return mixSrgb(a, parseFloat(mix[2]) / 100, b);
    }
  }
  return v;
}

/* ── Le périmètre : barres de navigation et panneaux qui s'en ouvrent ─────────── */

const MENUS = [
  'src/design-system/react/navigation/TopBar.tsx',
  'src/design-system/react/navigation/TabBar.tsx',
  'src/design-system/react/navigation/SideNav.tsx',
  'src/design-system/react/navigation/SubNav.tsx',
  'src/components/layout/AppShell.tsx',
  'src/components/layout/UserMenu.tsx',
  'src/components/layout/NotificationDropdown.tsx',
  'src/components/layout/Header.tsx',
];

/** Retire les commentaires : ils EXPLIQUENT ce que le verre était, et doivent pouvoir le nommer. */
function code(file: string): string {
  return readFileSync(join(ROOT, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('AD-26 — les menus sont opaques', () => {
  it('l\'écart est bien dans la cascade (sinon le test ne prouve rien)', () => {
    expect(readFileSync(join(CSS_DIR, 'styles.css'), 'utf8')).toContain('ad-26-menus-opaques.css');
    expect(readFileSync(join(CSS_DIR, 'overrides/ad-26-menus-opaques.css'), 'utf8')).toContain('.mm-menu');
  });

  it('aucune surface de menu ne reprend le verre du kit', () => {
    for (const file of MENUS) {
      const src = code(file);
      for (const forbidden of [/\bglass-flat\b/, /\bglass\b(?!-)/, /\bmm-chrome\b/, /\bbackdrop-blur/]) {
        expect(
          forbidden.test(src),
          `${file} reprend « ${forbidden.source} ». Les replis de brand/fallback.css sont en `
          + '`!important` : une surface qui garde une classe du kit se verra réimposer son voile, '
          + 'et en mode sombre un fond blanc à 90 % (le sélecteur `.lowfi .dk` ne s\'apparie jamais).',
        ).toBe(false);
      }
      /* `SubNav` n'a pas de surface à peindre — seulement des puces — donc elle lit les
         jetons du menu au lieu de porter la classe. Les deux formes valent adhésion. */
      expect(src, `${file} ne porte ni .mm-menu ni les jetons du menu`)
        .toMatch(/mm-menu|--menu-(?:on|off|brd)/);
    }
  });

  it('`--menu-bg` est une couleur PLEINE dans les deux portées', () => {
    for (const scope of ['light', 'dark'] as const) {
      const v = resolveToken('--menu-bg', scope);
      expect(v, `--menu-bg ${scope} = « ${v} » — un menu qui redevient un voile laisse lire `
        + 'la page au travers, et c\'est en nuit que ça ne se voit pas sur une capture.')
        .toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('l\'entrée courante se DISTINGUE du fond du menu, dans les deux portées', () => {
    /* Le mode de panne : `--nav-on-bg` valait rgba(255,255,255,.7), qui composé sur un menu
       blanc opaque rend du blanc. L'état actif de la navigation s'effaçait — invisible en
       clair sur une capture, puisque tout y est déjà blanc. */
    for (const scope of ['light', 'dark'] as const) {
      const bg = resolveToken('--menu-bg', scope);
      const on = resolveToken('--menu-on-bg', scope);
      const off = resolveToken('--menu-off-bg', scope);
      expect(on, `--menu-on-bg ${scope}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(off, `--menu-off-bg ${scope}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(on, `--menu-on-bg ${scope} vaut exactement le fond du menu`).not.toBe(bg);
      expect(
        ratio(on, bg),
        `entrée courante ${on} sur menu ${bg} en ${scope} : ${ratio(on, bg).toFixed(3)}:1`,
      ).toBeGreaterThan(1.08);
      expect(ratio(off, bg), `puce au repos ${off} sur ${bg} en ${scope}`).toBeGreaterThan(1.04);
      expect(
        ratio(on, bg),
        'l\'entrée courante doit se distinguer PLUS que la puce au repos',
      ).toBeGreaterThan(ratio(off, bg));
    }
  });

  it('l\'écart est le MÊME dans les deux portées', () => {
    /* C'est ce qui fait qu'une seule déclaration tient les deux modes : `--ink` s'inverse
       seul sous `.dk`, donc le remplissage est une teinte d'encre en clair et une teinte de
       lumière en nuit — la doctrine des remplissages neutres du kit. */
    const clair = ratio(resolveToken('--menu-on-bg', 'light'), resolveToken('--menu-bg', 'light'));
    const nuit = ratio(resolveToken('--menu-on-bg', 'dark'), resolveToken('--menu-bg', 'dark'));
    expect(
      Math.abs(clair - nuit),
      `clair ${clair.toFixed(3)}:1 contre nuit ${nuit.toFixed(3)}:1 — l'asymétrie est exactement `
      + 'ce qui laisse un mode correct pendant que l\'autre dérive.',
    ).toBeLessThan(0.05);
  });

  it('`.mm-menu` repointe les jetons d\'état du kit dans sa seule portée', () => {
    const css = readFileSync(join(CSS_DIR, 'overrides/ad-26-menus-opaques.css'), 'utf8');
    const bloc = css.slice(css.indexOf('.mm-menu {'));
    for (const jeton of ['--nav-on-bg', '--ctl-off-bg', '--nav-brd']) {
      expect(bloc, `${jeton} n'est pas repointé : les descendants du menu garderaient un voile `
        + 'de blanc, sur une surface qui n\'en a plus.').toContain(jeton);
    }
  });
});
