#!/usr/bin/env node
/**
 * Troisième passe : la queue longue.
 *
 * Ce qui reste après les deux premières n'est pas résiduel par hasard — ce sont les formes
 * que les règles générales ne voyaient pas : les filets de séparation, les anneaux écrits
 * sans `focus:`, la couleur native d'une case à cocher, et les encres CLAIRES posées sur des
 * surfaces sombres. Cette dernière famille mérite une remarque : `text-brand-100` n'est pas
 * une teinte de marque atténuée, c'est du texte quasi blanc sur un aplat bleu. Le traduire en
 * `text-forme` l'aurait rendu bleu sur bleu — invisible. Il devient `--paper-fixed`, le blanc
 * qui ne bascule pas, parce que la surface sous lui ne bascule pas non plus.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const TOKEN = { brand: '--mm-bleu', plum: '--mm-violet', morrys: '--mm-violet', accent: '--mm-orange',
  lagoon: '--mm-teal', teal: '--mm-teal', coral: '--mm-corail', success: '--ok', error: '--stop', red: '--stop', warning: '--warn' };
const HUES = Object.keys(TOKEN).join('|');

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
let changed = 0;

for (const f of walk(join(root, 'src'))) {
  const before = readFileSync(f, 'utf8'); let s = before;

  // Encre CLAIRE sur surface colorée : un blanc qui ne bascule pas, comme la surface.
  s = s.replace(new RegExp(`\\btext-(?:${HUES})-(?:50|100|200)\\b`, 'g'), () => { bump('encre claire sur aplat -> --paper-fixed'); return 'text-[color:var(--paper-fixed)]'; });
  // Filets de séparation.
  s = s.replace(/\bdivide-neutral-\d{2,3}\b/g, () => { bump('filet de séparation -> --line'); return 'divide-[color:var(--line)]'; });
  s = s.replace(/\bborder-neutral-(?:500|600|700|800|900|950)\b/g, () => { bump('bordure profonde -> --border-hair'); return 'border-[color:var(--border-hair)]'; });
  // Anneaux restants, écrits sans `focus:` — même raison : le système en a un, global.
  s = s.replace(new RegExp(`\\s+ring-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'), () => { bump('anneau par teinte retiré'); return ''; });
  s = s.replace(new RegExp(`\\bring-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'), () => { bump('anneau par teinte retiré'); return ''; });
  // `accent-color` natif d'une case à cocher ou d'un curseur.
  s = s.replace(new RegExp(`\\baccent-(${HUES})-\\d{2,3}\\b`, 'g'), (_m, h) => { bump('accent-color natif -> jeton'); return `accent-[color:var(${TOKEN[h]})]`; });
  // Aplats d'échelon moyen avec opacité, non couverts par la passe 2.
  s = s.replace(new RegExp(`\\b(bg|border)-(${HUES})-(400|500)\\/(\\d{1,3})\\b`, 'g'), (_m, prop, h, _step, pct) => {
    bump('aplat moyen avec opacité -> color-mix'); return `${prop}-[color-mix(in_srgb,var(${TOKEN[h]})_${pct}%,transparent)]`;
  });
  s = s.replace(new RegExp(`\\b(bg|border)-(${HUES})-400\\b`, 'g'), (_m, prop, h) => { bump('aplat moyen -> jeton'); return `${prop}-[color:var(${TOKEN[h]})]`; });
  // Encres et fonds neutres restants.
  s = s.replace(/\btext-neutral-\d{2,3}\b/g, () => { bump('encre neutre -> --ink-2'); return 'text-ink-2'; });
  s = s.replace(/\bbg-neutral-\d{2,3}(?:\/(\d{1,3}))?\b/g, (_m, pct) => {
    bump('fond neutre -> --fill/--night');
    return pct ? `bg-[color-mix(in_srgb,var(--night-3)_${pct}%,transparent)]` : 'bg-[color:var(--fill-1)]';
  });
  s = s.replace(/\bborder-neutral-\d{2,3}\b/g, () => { bump('bordure neutre -> --line'); return 'border-[color:var(--line)]'; });

  if (s !== before) { changed++; if (WRITE) writeFileSync(f, s); }
}
console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${changed} fichiers\n`);
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
