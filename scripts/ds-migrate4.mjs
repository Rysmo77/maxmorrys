#!/usr/bin/env node
/**
 * Quatrième passe : les dégradés.
 *
 * Un dégradé n'est pas une couleur, c'est une composition — d'où le fait qu'il ait été mis de
 * côté par les trois premières passes plutôt que traduit de travers. À la lecture, ils se
 * rangent en deux familles, et le système a une réponse différente pour chacune.
 *
 * 1 · LES RAMPES SATURÉES — `from-brand-500 to-brand-700`, sur un bouton, une pastille, un
 *     avatar. Le système a exactement ça : QUATRE DÉGRADÉS D'ACTION, un par territoire, avec
 *     leur ombre colorée. Ils sont déclarés hors de `.dk`, donc leurs deux arrêts gardent
 *     leur valeur en nuit — ce qui compte, parce que le texte posé dessus est blanc dans les
 *     deux modes. Un dégradé bâti sur `var(--mm-violet)` aurait pris les VARIANTES NUIT sous
 *     `.dk` — deux pastels clairs — et le blanc dessus serait devenu illisible.
 *
 * 2 · LES COUSSINS PASTEL — `from-brand-100 to-brand-50`, derrière une icône. Deux échelons
 *     voisins de la même teinte : à l'œil, c'est un aplat. Ils deviennent un voile unique,
 *     rattaché au jeton, qui bascule seul.
 *
 * Les moitiés `dark:` partent avec : le jeton porte le mode.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

const ACTION = { brand: '--action-forme', accent: '--action-informe', plum: '--action-transforme',
  morrys: '--action-transforme', lagoon: '--action-digitalise', teal: '--action-digitalise' };
const TOKEN = { brand: '--mm-bleu', accent: '--mm-orange', plum: '--mm-violet', morrys: '--mm-violet',
  lagoon: '--mm-teal', teal: '--mm-teal', coral: '--mm-corail', success: '--ok', error: '--stop', warning: '--warn' };
const HUES = Object.keys(TOKEN).join('|');
const SOFT = new Set(['50', '100', '200']);

const SKIP = new Set(['node_modules', 'dist', '.git', 'Design_System_Max-Morrys', '_bmad-output', '_bmad', '.firebase', 'design-system']);
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const tally = new Map(); const bump = (k) => tally.set(k, (tally.get(k) ?? 0) + 1);
const leftovers = [];
let changed = 0;

/* Le dégradé complet : la direction, ses arrêts, et les moitiés `dark:` qui suivent. */
const GRAD = new RegExp(
  `bg-gradient-to-[a-z]{1,2}\\s+from-(${HUES})-(\\d{2,3})(?:\\/\\d{1,3})?` +
  `(?:\\s+via-(?:${HUES})-\\d{2,3}(?:\\/\\d{1,3})?)?` +
  `(?:\\s+to-(?:${HUES})-(\\d{2,3})(?:\\/\\d{1,3})?)?` +
  `(?:\\s+dark:(?:from|via|to)-(?:${HUES})-\\d{2,3}(?:\\/\\d{1,3})?)*`,
  'g',
);

for (const f of walk(join(root, 'src'))) {
  const before = readFileSync(f, 'utf8');
  let s = before.replace(GRAD, (m, hue, from, to) => {
    const soft = SOFT.has(from) && (to === undefined || SOFT.has(to));
    if (soft) {
      bump('coussin pastel -> voile unique sur le jeton');
      return `bg-[color-mix(in_srgb,var(${TOKEN[hue]})_12%,transparent)]`;
    }
    if (ACTION[hue]) {
      bump("rampe saturée -> dégradé d'action du territoire");
      return `bg-[image:var(${ACTION[hue]})]`;
    }
    bump('rampe saturée -> jeton plein (pas de dégradé de territoire)');
    void m;
    return `bg-[color:var(${TOKEN[hue]})]`;
  });

  for (const m of s.matchAll(new RegExp(`\\b(?:from|via|to)-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'))) {
    leftovers.push(`${relative(root, f)}  ${m[0]}`);
  }

  if (s !== before) { changed++; if (WRITE) writeFileSync(f, s); }
}

console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${changed} fichiers\n`);
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);
if (leftovers.length) {
  console.log(`\n  ${String(leftovers.length).padStart(5)}  arrêt de dégradé isolé, à reprendre à la main :`);
  for (const l of leftovers.slice(0, 12)) console.log(`         ${l}`);
  if (leftovers.length > 12) console.log(`         … et ${leftovers.length - 12} de plus`);
}
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
