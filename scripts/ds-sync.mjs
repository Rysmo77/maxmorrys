#!/usr/bin/env node
/**
 * Design_System_Max-Morrys/{tokens,brand} -> src/design-system/css/  (AD-1)
 *
 * La copie est LITTÉRALE. Le DS est la source de vérité : « si le kit dit 5 px, c'est 5 px,
 * pas 4 », et aucune valeur ne s'arrondit sur une grille de 4 ou 8. Un changement de valeur
 * se fait donc dans le DS, puis se resynchronise ici — jamais à la main dans src/.
 *
 * Les écarts délibérés du produit ne vivent PAS dans les fichiers copiés : ils vivent dans
 * `src/design-system/css/overrides/`, importés en dernier, un fichier par décision, chacun
 * nommant son AD. C'est ce qui permet à `ds:check` de prouver que le reste est intact.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'Design_System_Max-Morrys');
const DST = join(root, 'src/design-system/css');
const DIRS = ['tokens', 'brand'];

const banner = (rel) =>
  `/* ─────────────────────────────────────────────────────────────────────────\n` +
  `   COPIE LITTÉRALE de Design_System_Max-Morrys/${rel} — NE PAS ÉDITER.\n` +
  `   Régénéré par \`npm run ds:sync\`. Tout écart délibéré vit dans overrides/.\n` +
  `   ───────────────────────────────────────────────────────────────────────── */\n`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.css')) out.push(p);
  }
  return out;
}

let n = 0;
for (const d of DIRS) {
  for (const file of walk(join(SRC, d))) {
    const rel = relative(SRC, file);
    const dst = join(DST, rel);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, banner(rel) + readFileSync(file, 'utf8'));
    n++;
  }
}
console.log(`ds:sync — ${n} fichiers CSS copiés depuis le design system.`);
