#!/usr/bin/env node
/**
 * Remonte les classes de couleur héritées sur les jetons du design system.
 *
 * CE QUE CE SCRIPT NE PEUT PAS FAIRE, et qu'il ne prétend pas faire.
 *
 * L'ancienne palette a onze échelons par teinte ; le système en a UN par territoire, plus une
 * variante texte, une variante nuit et un pastel. `bg-brand-50` et `text-brand-600` ne sont
 * pas deux nuances du même choix : le second est une couleur d'accent, le premier est un
 * TROISIÈME FOND — que le système interdit (« maximum deux fonds par écran : le maillage, et
 * le verre »). Les aplats teintés ne se traduisent donc pas, ils se RECOMPOSENT, en verre ou
 * en maillage, à la main, écran par écran.
 *
 * Ce script traite les cas où la correspondance est univoque : le texte, les bordures, les
 * états, les remplissages neutres. Il RECENSE le reste au lieu de le deviner.
 *
 *   node scripts/ds-migrate.mjs            # simulation — n'écrit rien
 *   node scripts/ds-migrate.mjs --write    # applique
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

/* ── Les territoires, et ce que devient chaque ancienne palette ───────────────
   Le teal, l'orange et le corail sont INTERDITS en texte sur blanc (2,84 / 2,47 / 2,70:1) :
   leur correspondance de texte pointe sur la variante `-txt`, qui bascule seule en nuit. */
const HUE = {
  brand: { text: 'text-forme', bg: 'bg-forme', border: 'border-forme' },
  plum: { text: 'text-transforme', bg: 'bg-transforme', border: 'border-transforme' },
  morrys: { text: 'text-transforme', bg: 'bg-transforme', border: 'border-transforme' },
  accent: { text: 'text-informe-txt', bg: 'bg-informe', border: 'border-informe' },
  lagoon: { text: 'text-digitalise-txt', bg: 'bg-digitalise', border: 'border-digitalise' },
  teal: { text: 'text-digitalise-txt', bg: 'bg-digitalise', border: 'border-digitalise' },
  coral: { text: 'text-corail-txt', bg: 'bg-corail', border: 'border-corail' },
  success: { text: 'text-ok', bg: 'bg-ok', border: 'border-ok' },
  error: { text: 'text-stop', bg: 'bg-stop', border: 'border-stop' },
  red: { text: 'text-stop', bg: 'bg-stop', border: 'border-stop' },
  warning: { text: 'text-warn', bg: 'bg-warn', border: 'border-warn' },
};

/* Les échelons clairs sont des APLATS, pas des accents : ils ne se traduisent pas. */
const TINT = new Set(['50', '100', '200']);

/* ── L'encre. Trois niveaux, et le troisième NE PORTE PAS DE TEXTE (AD-18) ──── */
const INK_TEXT = {
  950: 'text-ink', 900: 'text-ink', 800: 'text-ink', 700: 'text-ink',
  600: 'text-ink-2', 500: 'text-ink-2',
  // 400 et 300 portaient du texte secondaire sur `--ink-3`, à 2,61:1 sur blanc pur.
  // Aucun voile ne le sauve : ils remontent sur --ink-2.
  400: 'text-ink-2', 300: 'text-ink-2',
};
const NEUTRAL_BG = {
  950: 'bg-[color:var(--night-2)]', 900: 'bg-[color:var(--night-3)]',
  100: 'bg-[color:var(--fill-2)]', 50: 'bg-[color:var(--fill-1)]',
};
const NEUTRAL_BORDER = { 200: 'border-[color:var(--line)]', 300: 'border-[color:var(--line)]', 100: 'border-[color:var(--border-hair)]' };

const rules = [];
const note = (re, to, why) => rules.push({ re, to, why });

// Texte de marque et d'état — l'échelon disparaît, le jeton n'en a qu'un.
for (const [name, m] of Object.entries(HUE)) {
  note(new RegExp(`\\btext-${name}-(?:[3-9]00|950)\\b`, 'g'), m.text, 'texte de teinte');
  note(new RegExp(`\\bborder-${name}-(?:[3-9]00|950)\\b`, 'g'), m.border, 'bordure de teinte');
  note(new RegExp(`\\bbg-${name}-(?:[6-9]00|950)\\b`, 'g'), m.bg, 'aplat plein');
}
// Encre et neutres.
for (const [step, to] of Object.entries(INK_TEXT)) note(new RegExp(`\\btext-neutral-${step}\\b`, 'g'), to, 'encre');
for (const [step, to] of Object.entries(NEUTRAL_BG)) note(new RegExp(`\\bbg-neutral-${step}\\b`, 'g'), to, 'fond neutre');
for (const [step, to] of Object.entries(NEUTRAL_BORDER)) note(new RegExp(`\\bborder-neutral-${step}\\b`, 'g'), to, 'filet');
note(/\bbg-white\b/g, 'bg-paper', 'papier');
note(/\btext-neutral-200\b/g, 'text-ink-2', 'encre');

/* ── Ce qui NE se traduit pas, et qu'on recense ──────────────────────────────── */
const UNMAPPED = [
  { re: new RegExp(`\\bbg-(?:${Object.keys(HUE).join('|')})-(?:${[...TINT].join('|')})\\b`, 'g'),
    why: 'aplat teinté — troisième fond, à recomposer en verre ou en maillage' },
  { re: /\b(?:bg|text|border|ring|from|via|to)-(?:brand|plum|morrys|accent|lagoon|teal|coral|success|error|warning|red)-\d{2,3}\/\d+\b/g,
    why: 'teinte avec opacité — à porter par un jeton de verre ou de remplissage' },
  { re: /\b(?:from|via|to)-(?:brand|plum|morrys|accent|lagoon|teal|coral)-\d{2,3}\b/g,
    why: 'dégradé Tailwind — le système a ses quatre dégradés d\'action' },
];

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

const files = walk(join(root, 'src'));
const applied = new Map();
const left = new Map();
let changedFiles = 0, totalSubs = 0;

for (const f of files) {
  const before = readFileSync(f, 'utf8');
  let s = before;
  for (const { re, to, why } of rules) {
    s = s.replace(re, (m) => {
      applied.set(why, (applied.get(why) ?? 0) + 1);
      totalSubs++;
      void m;
      return to;
    });
  }
  /* Les variantes `dark:` de couleur deviennent redondantes : le jeton bascule seul sous la
     portée `.dk`. On ne retire QUE celles dont le pendant clair a été traduit — une classe
     `dark:` orpheline signale un endroit où le clair n'était pas une couleur mappable. */
  s = s.replace(/\s+dark:(?:text|bg|border)-(?:neutral|brand|plum|morrys|accent|lagoon|teal|coral|success|error|warning|red)-\d{2,3}(?:\/\d+)?\b/g, () => {
    applied.set('variante dark: redondante', (applied.get('variante dark: redondante') ?? 0) + 1);
    totalSubs++;
    return '';
  });
  s = s.replace(/\s+dark:bg-white\b|\s+dark:text-white\b/g, (m) => {
    // `dark:text-white` sur une encre traduite est redondant : --ink vaut déjà #ECF0F5 en nuit.
    applied.set('variante dark: redondante', (applied.get('variante dark: redondante') ?? 0) + 1);
    totalSubs++;
    void m;
    return '';
  });

  for (const { re, why } of UNMAPPED) {
    const hits = s.match(re);
    if (hits) left.set(why, (left.get(why) ?? 0) + hits.length);
  }

  if (s !== before) {
    changedFiles++;
    if (WRITE) writeFileSync(f, s);
  }
}

const pad = (n) => String(n).padStart(6);
console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${totalSubs} substitutions dans ${changedFiles} fichiers\n`);
console.log('  Traduit :');
for (const [why, n] of [...applied].sort((a, b) => b[1] - a[1])) console.log(`  ${pad(n)}  ${why}`);
if (left.size) {
  console.log('\n  À RECOMPOSER À LA MAIN — le système n\'a pas d\'équivalent direct :');
  for (const [why, n] of [...left].sort((a, b) => b[1] - a[1])) console.log(`  ${pad(n)}  ${why}`);
}
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
