#!/usr/bin/env node
/**
 * RÉPARATION. Trois défauts introduits par les passes de migration, tous silencieux.
 *
 * « Silencieux » est le mot qui compte : aucune de ces classes n'échoue. Elles ne génèrent
 * simplement AUCUNE règle CSS. Le typecheck passe, la build passe, le vérificateur des six
 * règles passe — et à l'écran, un bandeau d'erreur n'a pas de fond, une barre haute est
 * transparente, un texte hérite de la couleur de son parent. C'est la même famille de défaut
 * que celui de l'échelle d'espacement : il ne se voit que sur un écran déjà rendu, par
 * quelqu'un qui connaissait l'écran d'avant.
 *
 * 1 · CLASSES DOUBLÉES — `text-ink-2-2`, `text-informe-txt-txt`.
 *
 *     Cause : un ordre d'alternance dans une expression régulière. `ink|ink-2|ink-3` teste
 *     `ink` EN PREMIER, et `\b` accepte la frontière avant le tiret. Sur `dark:text-ink-2`,
 *     la regex a donc retiré ` dark:text-ink` et laissé `-2` orphelin, qui s'est recollé au
 *     `text-ink-2` qui précédait.
 *
 *     La leçon, et elle vaut au-delà d'ici : DANS UNE ALTERNANCE, LE PLUS LONG D'ABORD.
 *
 * 2 · MODIFICATEUR D'OPACITÉ SUR UN JETON — `bg-forme/20`, `bg-paper/90`.
 *
 *     Le modificateur `/NN` de Tailwind exige que la couleur soit déclarée avec le marqueur
 *     `<alpha-value>`. Une couleur qui vaut `var(--mm-bleu)` ne l'a pas : Tailwind ne peut
 *     pas y injecter d'alpha, et n'émet rien. C'est pour cette raison que `bg-black/50` et
 *     `text-white/80` fonctionnent — ce sont les couleurs par défaut de Tailwind, déclarées
 *     avec le marqueur — et que les nôtres, non.
 *
 *     `color-mix()` fait le travail sans dupliquer la source des jetons, ce qu'un jeu de
 *     canaux `--x-rgb` parallèle aurait fait.
 *
 * 3 · PRÉFIXES ORPHELINS — `dark:`, `hover:` suivis de rien, restes d'une classe retirée.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

/** Les 28 couleurs déclarées sur un jeton — celles qui n'acceptent pas `<alpha-value>`. */
const TOKEN = {
  forme: '--mm-bleu', informe: '--mm-orange', transforme: '--mm-violet', digitalise: '--mm-teal',
  corail: '--mm-corail', 'corail-txt': '--mm-corail-t', 'informe-txt': '--mm-orange-t',
  'digitalise-txt': '--mm-teal-t', 'transforme-txt': '--mm-violet-t',
  ink: '--ink', 'ink-2': '--ink-2', 'ink-3': '--ink-3',
  paper: '--paper', 'paper-2': '--paper-2', 'paper-3': '--paper-3', line: '--line',
  night: '--night', 'night-2': '--night-2', 'night-3': '--night-3',
  ok: '--ok', warn: '--warn', stop: '--stop',
  'surface-page': '--surface-page', 'surface-card': '--surface-card', 'surface-flat': '--surface-card-flat',
  'surface-hero': '--surface-hero', 'surface-night': '--surface-night', 'surface-quiet': '--surface-quiet',
};
/* LE PLUS LONG D'ABORD — c'est exactement l'erreur qu'on répare. */
const NAMES = Object.keys(TOKEN).sort((a, b) => b.length - a.length).join('|');

const SKIP = new Set(['node_modules', 'dist', '.git', 'Design_System_Max-Morrys', '_bmad-output', '_bmad', '.firebase']);
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const tally = new Map(); const bump = (k, n = 1) => tally.set(k, (tally.get(k) ?? 0) + n);
let changed = 0;

for (const f of [...walk(join(root, 'src')), ...walk(join(root, 'mobile'))]) {
  const before = readFileSync(f, 'utf8');
  let s = before;

  // 1 · classes doublées
  s = s.replace(/\bink-2-2\b/g, () => { bump('classe doublée « ink-2-2 » réparée'); return 'ink-2'; });
  s = s.replace(/-txt-txt\b/g, () => { bump('suffixe « -txt » doublé réparé'); return '-txt'; });

  // 2 · modificateur d'opacité sur un jeton
  s = s.replace(new RegExp(`\\b(bg|text|border|ring|fill|stroke|divide|outline|from|via|to)-(${NAMES})\\/(\\d{1,3})\\b`, 'g'),
    (_m, prop, name, pct) => {
      bump("modificateur d'opacité sur jeton -> color-mix()");
      return `${prop}-[color-mix(in_srgb,var(${TOKEN[name]})_${pct}%,transparent)]`;
    });
  // Le même piège sur une valeur arbitraire — il en restait.
  s = s.replace(/\b(bg|text|border|ring|fill|stroke|divide|outline)-\[color:var\((--[a-z0-9-]+)\)\]\/(\d{1,3})\b/g,
    (_m, prop, tok, pct) => {
      bump("modificateur d'opacité sur valeur arbitraire -> color-mix()");
      return `${prop}-[color-mix(in_srgb,var(${tok})_${pct}%,transparent)]`;
    });

  /*
   * 3 · PRÉFIXES ORPHELINS — RÈGLE RETIRÉE, ET LA RAISON MÉRITE D'ÊTRE LUE.
   *
   * Elle retirait un `dark:` ou un `hover:` qui ne qualifiait plus rien, reste d'une classe
   * de couleur supprimée. Elle a mangé, en même temps, DES CLÉS D'OBJET ET DES PARAMÈTRES
   * DE FONCTION du TypeScript : `disabled: { … }` dans une table de tons, `active: boolean`
   * dans une signature, `active: stats.users` dans un tableau de relevé. Trente-trois
   * identifiants, dans neuf fichiers, restaurés depuis git.
   *
   * La faute n'est pas la regex, c'est le PÉRIMÈTRE : une substitution de classes doit
   * s'appliquer aux chaînes de `className`, pas au fichier entier. Un nom de variante
   * Tailwind et une clé d'objet JavaScript s'écrivent pareil.
   *
   * Et le gain ne valait rien : un `dark:` orphelin ne génère aucune règle CSS. Il était
   * déjà inerte. On échangeait un risque réel contre une propreté invisible.
   */

  if (s !== before) { changed++; if (WRITE) writeFileSync(f, s); }
}

console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${changed} fichiers\n`);
for (const [k, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${k}`);
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
