#!/usr/bin/env node
/**
 * Cinquième et dernière passe : les arrêts de dégradé qui vivent SÉPARÉMENT de leur direction.
 *
 * Ce sont les deux formes que la passe précédente ne pouvait pas voir, et elles se ressemblent
 * peu :
 *
 *   • Les arrêts en CONSTANTE — `learning: 'from-brand-100 to-brand-50 …'` — assemblés au
 *     point d'appel avec un `bg-gradient-to-br` écrit ailleurs. La direction n'est jamais sur
 *     la même chaîne, donc aucune expression ne peut les rapprocher : il faut les traiter
 *     pour ce qu'ils sont, une paire d'arrêts.
 *   • Les dégradés NEUTRES, écartés jusqu'ici parce qu'ils ne portent pas de territoire. Ce
 *     sont des puits — derrière une image absente, sous un squelette. L'échelle `--fill-*`
 *     est faite pour ça, et elle s'inverse sous `.dk`.
 *
 * Une constante qui ne contient QUE des arrêts perd sa direction en même temps : le champ
 * devient une classe de fond complète, et le `bg-gradient-to-br` du point d'appel devient
 * inopérant — ce qui est sans effet, un dégradé sans arrêt ne peint rien.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
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
const left = []; let changed = 0;

for (const f of walk(join(root, 'src'))) {
  const before = readFileSync(f, 'utf8');
  let s = before;

  // Paire d'arrêts d'une même teinte, direction absente, moitiés `dark:` comprises.
  s = s.replace(new RegExp(
    `from-(${HUES})-(\\d{2,3})(?:\\/\\d{1,3})?\\s+to-(?:${HUES})-(\\d{2,3})(?:\\/\\d{1,3})?` +
    `(?:\\s+dark:(?:from|to)-(?:${HUES})-\\d{2,3}(?:\\/\\d{1,3})?)*`, 'g'),
    (_m, hue, from, to) => {
      const soft = SOFT.has(from) && SOFT.has(to);
      bump(soft ? 'paire pastel en constante -> voile sur le jeton' : 'paire saturée en constante -> jeton plein');
      return soft
        ? `bg-[color-mix(in_srgb,var(${TOKEN[hue]})_12%,transparent)]`
        : `bg-[color:var(${TOKEN[hue]})]`;
    });

  // Dégradés neutres : ce sont des puits, pas des territoires.
  s = s.replace(/bg-gradient-to-[a-z]{1,2}\s+from-neutral-\d{2,3}(?:\/\d{1,3})?(?:\s+via-neutral-\d{2,3}(?:\/\d{1,3})?)?\s+to-neutral-\d{2,3}(?:\/\d{1,3})?(?:\s+dark:(?:from|via|to)-neutral-\d{2,3}(?:\/\d{1,3})?)*/g,
    () => { bump('dégradé neutre -> puits --fill-2'); return 'bg-[color:var(--fill-2)]'; });
  s = s.replace(/from-neutral-\d{2,3}(?:\/\d{1,3})?\s+to-neutral-\d{2,3}(?:\/\d{1,3})?(?:\s+dark:(?:from|to)-neutral-\d{2,3}(?:\/\d{1,3})?)*/g,
    () => { bump('paire neutre -> puits --fill-2'); return 'bg-[color:var(--fill-2)]'; });

  for (const m of s.matchAll(new RegExp(`\\b(?:from|via|to)-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'))) {
    left.push(`${relative(root, f)}  ${m[0]}`);
  }
  if (s !== before) { changed++; if (WRITE) writeFileSync(f, s); }
}

console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${changed} fichiers\n`);
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);
if (left.length) {
  console.log(`\n  ${String(left.length).padStart(5)}  arrêt isolé restant :`);
  for (const l of left.slice(0, 10)) console.log(`         ${l}`);
}
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
