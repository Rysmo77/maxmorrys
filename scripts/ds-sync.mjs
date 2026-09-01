#!/usr/bin/env node
/**
 * Max-Morrys_DS_Platform/design_handoff_maxmorrys/css/{tokens,brand} -> src/design-system/css/  (AD-1)
 *
 * ⚠️ LA SOURCE A CHANGÉ DE NOM, ET LA BARRIÈRE ÉTAIT MORTE ENTRE-TEMPS.
 * Le kit a été relivré sous `Max-Morrys_DS_Platform/`, et l'ancien dossier
 * `Design_System_Max-Morrys/` a été supprimé. Ce script pointait toujours dessus : il
 * plantait sur ENOENT, `ds:check` ne pouvait plus prouver AD-1, et rien ne le signalait
 * puisque la CI n'invoque pas `ds`. Un vérificateur dont la source a disparu ne vérifie
 * pas « rien » : il ne vérifie plus, ce qui est le contraire de ce qu'il annonce.
 *
 * POURQUOI CE CHEMIN-LÀ, et pas `Max-Morrys_DS_Platform/{tokens,brand}` qui semble plus
 * direct : la racine du kit ne publie que 15 des 17 feuilles. `brand/states.css` et
 * `brand/breakpoints.css` n'existent QUE dans le sous-arbre `design_handoff_maxmorrys/css`,
 * et `src/design-system/css/styles.css` les importe toutes les deux. Les 15 feuilles
 * communes y sont octet pour octet identiques : ce sous-arbre est un surensemble strict,
 * donc la seule source qui couvre l'intégralité de ce que le produit charge.
 *
 * La copie est LITTÉRALE. Le DS est la source de vérité : « si le kit dit 5 px, c'est 5 px,
 * pas 4 », et aucune valeur ne s'arrondit sur une grille de 4 ou 8. Un changement de valeur
 * se fait donc dans le DS, puis se resynchronise ici — jamais à la main dans src/.
 *
 * Les écarts délibérés du produit ne vivent PAS dans les fichiers copiés : ils vivent dans
 * `src/design-system/css/overrides/`, importés en dernier, un fichier par décision, chacun
 * nommant son AD. C'est ce qui permet à `ds:check` de prouver que le reste est intact.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'Max-Morrys_DS_Platform/design_handoff_maxmorrys/css');
const DST = join(root, 'src/design-system/css');
const DIRS = ['tokens', 'brand'];

const banner = (rel) =>
  `/* ─────────────────────────────────────────────────────────────────────────\n` +
  `   COPIE LITTÉRALE de Max-Morrys_DS_Platform/design_handoff_maxmorrys/css/${rel} — NE PAS ÉDITER.\n` +
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

if (!existsSync(SRC)) {
  console.error(`ds:sync — source introuvable : ${relative(root, SRC)}\n` +
    "Le kit de design doit être présent au dépôt pour que la copie littérale (AD-1) soit prouvable.");
  process.exit(1);
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
