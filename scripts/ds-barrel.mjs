#!/usr/bin/env node
/**
 * Génère `src/design-system/index.ts` — le point d'entrée unique du design system.
 *
 * POURQUOI IL EST GÉNÉRÉ. Un barrel écrit à la main se désynchronise au premier composant
 * ajouté un vendredi : le fichier compile, l'export manque, et l'auteur du composant suivant
 * importe le chemin profond « juste cette fois ». Trois mois plus tard la règle de dépendance
 * du paradigme n'existe plus, et personne ne saurait dire quand elle est morte.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REACT = join(root, 'src/design-system/react');

const GROUPS = [
  ['actions', 'Actions'],
  ['brand', 'Marque'],
  ['data', 'Données'],
  ['forms', 'Formulaires'],
  ['navigation', 'Navigation'],
  ['surfaces', 'Surfaces'],
];

const uniq = (a) => [...new Set(a)].sort();
const matchAll = (src, re) => uniq([...src.matchAll(re)].map((m) => m[1]));

const out = [
  `/**
 * LE POINT D'ENTRÉE UNIQUE DU DESIGN SYSTEM.
 *
 * Une surface — page, écran, composant produit — importe depuis \`@ds\` et jamais depuis un
 * fichier de \`design-system/css/\` ni depuis un chemin profond de \`react/\`. C'est la règle de
 * dépendance du paradigme : les jetons sont sous les primitives, les primitives sous les
 * surfaces, et rien ne saute un étage.
 *
 * Ce que ça achète concrètement : le jour où une primitive change de fichier, de nom interne
 * ou de découpage, aucune des cent quarante surfaces n'a à le savoir.
 *
 * GÉNÉRÉ PAR \`npm run ds:barrel\` — ne pas éditer à la main.
 */`,
];

let n = 0;
for (const [dir, label] of GROUPS) {
  const path = join(REACT, dir);
  if (!existsSync(path)) continue;
  const files = readdirSync(path).filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4)).sort();
  if (files.length === 0) continue;

  out.push(`\n/* ── ${label} ─────────────────────────────────────────────────────────── */`);
  for (const f of files) {
    const src = readFileSync(join(path, `${f}.tsx`), 'utf8');
    const values = matchAll(src, /^export (?:function|const) (\w+)/gm);
    const types = matchAll(src, /^export (?:interface|type) (\w+)/gm);
    if (values.length) out.push(`export { ${values.join(', ')} } from './react/${dir}/${f}';`);
    if (types.length) out.push(`export type { ${types.join(', ')} } from './react/${dir}/${f}';`);
    n += values.length;
  }
}

const tsrc = readFileSync(join(REACT, 'types.ts'), 'utf8');
out.push('\n/* ── Types partagés ──────────────────────────────────────────────────── */');
out.push(`export { ${matchAll(tsrc, /^export const (\w+)/gm).join(', ')} } from './react/types';`);
out.push(`export type { ${matchAll(tsrc, /^export type (\w+)/gm).join(', ')} } from './react/types';`);

out.push('\n/* ── Repli appareil modeste (règle 5) ────────────────────────────────── */');
out.push("export { applyLowFiIfModestDevice } from './lowfi';");
out.push('\n/* ── Jetons aplatis, pour le natif (AD-8) ────────────────────────────── */');
out.push("export { tokens, token, TERRITORIES as NATIVE_TERRITORIES } from './tokens.generated';");

writeFileSync(join(root, 'src/design-system/index.ts'), `${out.join('\n')}\n`);
console.log(`ds:barrel — ${n} composants exportés depuis src/design-system/index.ts`);
