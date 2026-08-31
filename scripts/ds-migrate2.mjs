#!/usr/bin/env node
/**
 * Deuxième passe : ce que la première avait volontairement laissé.
 *
 * QUATRE FAMILLES, quatre réponses du système — aucune n'est une traduction de teinte.
 *
 * 1 · LES APLATS TEINTÉS (bg-X-50/100/200) sont le TROISIÈME FOND que le système interdit :
 *     « maximum deux fonds par écran : le maillage, et le verre ». Mais les supprimer nus
 *     effacerait la couleur de territoire d'une puce ou d'un encart, qui est de l'information.
 *     `color-mix()` sur le JETON garde la teinte ET bascule en nuit — un rgba figé, non : il
 *     ne blanchit pas sur fond sombre, il DISPARAÎT.
 *
 * 2 · LES ANNEAUX DE FOCUS PAR TEINTE n'existent plus. Le système en a UN, bleu, câblé
 *     globalement sur `:focus-visible` dans `overrides/ad-06-etats.css`. Huit apparences pour
 *     la même affordance, c'est huit fois l'occasion de ne pas la reconnaître — et le kit les
 *     posait sur `:focus`, ce qui allume l'anneau au clic de souris, ce que tout le monde
 *     trouve laid, jusqu'à ce que quelqu'un écrive `outline:none` pour tout le monde.
 *
 * 3 · LES COULEURS DE `placeholder` sont désormais une règle unique dans le CSS du système.
 *     Un style utilitaire ne pouvait de toute façon pas atteindre `::placeholder`.
 *
 * 4 · LES DÉGRADÉS TAILWIND (from-/via-/to-) : le système a ses quatre dégradés d'action,
 *     un par territoire, avec leur ombre colorée. Ceux-ci sont RECENSÉS, pas traduits — un
 *     dégradé est une composition, pas une couleur, et il se reprend à la main.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

/** Chaque ancienne palette pointe sur le JETON du territoire, jamais sur une valeur. */
const TOKEN = {
  brand: '--mm-bleu', plum: '--mm-violet', morrys: '--mm-violet',
  accent: '--mm-orange', lagoon: '--mm-teal', teal: '--mm-teal',
  coral: '--mm-corail', success: '--ok', error: '--stop', red: '--stop', warning: '--warn',
};
/** L'échelon d'origine donne l'intensité du voile. Relevés sur l'usage réel, pas déduits. */
const VEIL = { 50: 8, 100: 12, 200: 18, 300: 24 };
/** Les neutres ont déjà leur échelle, qui s'inverse sous `.dk`. */
const NEUTRAL_FILL = { 50: '--fill-1', 100: '--fill-2', 200: '--fill-3', 300: '--fill-4', 400: '--fill-5' };

const SKIP = new Set(['node_modules', 'dist', '.git', 'Design_System_Max-Morrys', '_bmad-output', '_bmad', '.firebase', 'design-system']);
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const HUES = Object.keys(TOKEN).join('|');
const tally = new Map();
const bump = (k, n = 1) => tally.set(k, (tally.get(k) ?? 0) + n);
const gradients = [];
let changed = 0;

for (const f of walk(join(root, 'src'))) {
  const before = readFileSync(f, 'utf8');
  let s = before;

  // 1 · aplats teintés — le voile de l'échelon, multiplié par l'opacité si elle est écrite.
  s = s.replace(new RegExp(`\\b(bg|border|divide)-(${HUES})-(50|100|200|300)(?:\\/(\\d{1,3}))?\\b`, 'g'),
    (_m, prop, hue, step, pct) => {
      const veil = Math.max(4, Math.round((VEIL[step] ?? 12) * (pct ? Number(pct) / 100 : 1)));
      bump('aplat teinté -> color-mix sur le jeton');
      return `${prop}-[color-mix(in_srgb,var(${TOKEN[hue]})_${veil}%,transparent)]`;
    });
  s = s.replace(/\b(bg|border|divide)-neutral-(50|100|200|300|400)(?:\/(\d{1,3}))?\b/g,
    (_m, prop, step) => {
      bump('neutre -> échelle --fill-*');
      return `${prop}-[color:var(${NEUTRAL_FILL[step]})]`;
    });

  // 2 · anneaux de focus par teinte : le système en a un seul, global.
  s = s.replace(new RegExp(`\\s+(?:focus:)?ring-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'), () => {
    bump("anneau de focus par teinte retiré — le système en a un, global");
    return '';
  });

  // 3 · couleurs de placeholder : règle unique dans le CSS du système.
  s = s.replace(new RegExp(`\\s+placeholder-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'), () => {
    bump('couleur de placeholder retirée — règle unique dans le CSS');
    return '';
  });

  // 4 · aplats pleins restants.
  s = s.replace(new RegExp(`\\bbg-(${HUES})-([5-9]00|950)\\b`, 'g'), (_m, hue) => {
    bump('aplat plein -> jeton');
    return `bg-[color:var(${TOKEN[hue]})]`;
  });
  s = s.replace(/\bbg-neutral-(600|700|800)\b/g, () => {
    bump('neutre profond -> --night-3');
    return 'bg-[color:var(--night-3)]';
  });

  // 5 · dégradés : recensés, jamais devinés.
  for (const m of s.matchAll(new RegExp(`\\b(?:from|via|to)-(?:${HUES}|neutral)-\\d{2,3}(?:\\/\\d{1,3})?\\b`, 'g'))) {
    gradients.push(`${relative(root, f)}  ${m[0]}`);
  }

  if (s !== before) {
    changed++;
    if (WRITE) writeFileSync(f, s);
  }
}

console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${changed} fichiers\n`);
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);
console.log(`\n  ${String(gradients.length).padStart(5)}  dégradé Tailwind — À REPRENDRE À LA MAIN (un dégradé est une composition, pas une couleur)`);
const byFile = new Map();
for (const g of gradients) { const f = g.split('  ')[0]; byFile.set(f, (byFile.get(f) ?? 0) + 1); }
for (const [f, n] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`         ${String(n).padStart(3)}  ${f}`);
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
