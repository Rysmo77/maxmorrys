#!/usr/bin/env node
/**
 * Passe corrective sur la migration de couleurs. Deux défauts, tous deux mécaniques.
 *
 * 1 · MODIFICATEUR D'OPACITÉ SUR UNE VALEUR ARBITRAIRE.
 *     `bg-[color:var(--night-3)]/50` ne produit RIEN : le modificateur `/NN` de Tailwind
 *     exige que la couleur soit déclarée avec le marqueur `<alpha-value>`, ce qu'une valeur
 *     arbitraire n'a pas. La classe est silencieusement inexistante — le pire mode de
 *     défaillance, parce que le build passe et que l'élément perd simplement son fond.
 *     `color-mix()` fait le travail, et il est déjà pratiqué dans le design system.
 *
 * 2 · VARIANTES `dark:` SUR UN JETON DU SYSTÈME.
 *     Superflues par construction : `--ink` vaut #0E1116 en clair et #ECF0F5 en nuit, tout
 *     seul. Une variante `dark:` posée par-dessus ne fait au mieux rien, au pire fige une
 *     valeur que la portée `.dk` venait de corriger. C'est exactement ce qu'AD-3 énonce :
 *     le thème est une portée CSS, pas quelque chose qu'on écrit classe par classe.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');

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

const TOKENS = 'ink|ink-2|ink-3|paper|paper-2|paper-3|line|night|night-2|night-3|forme|informe|transforme|digitalise|corail|informe-txt|digitalise-txt|transforme-txt|corail-txt|ok|warn|stop';

let opacity = 0, redundant = 0, changed = 0;

for (const f of walk(join(root, 'src'))) {
  const before = readFileSync(f, 'utf8');
  let s = before;

  s = s.replace(/\b(bg|text|border|ring|fill|stroke)-\[color:var\((--[a-z0-9-]+)\)\]\/(\d{1,3})\b/g, (_m, prop, tok, pct) => {
    opacity++;
    return `${prop}-[color-mix(in_srgb,var(${tok})_${pct}%,transparent)]`;
  });

  s = s.replace(new RegExp(`\\s+dark:(?:text|bg|border|ring|from|via|to)-(?:${TOKENS})\\b`, 'g'), () => {
    redundant++;
    return '';
  });

  if (s !== before) {
    changed++;
    if (WRITE) writeFileSync(f, s);
  }
}

console.log(`\n${WRITE ? 'APPLIQUÉ' : 'SIMULATION'} — ${changed} fichiers`);
console.log(`  ${String(opacity).padStart(5)}  modificateur d'opacité -> color-mix()`);
console.log(`  ${String(redundant).padStart(5)}  variante dark: superflue retirée`);
if (!WRITE) console.log('\n  (--write pour appliquer)\n');
