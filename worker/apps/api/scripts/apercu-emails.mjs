#!/usr/bin/env node
/**
 * APERÇU DES COURRIERS — écrit chaque e-mail du produit en HTML (et en texte) dans
 * `worker/apps/api/.email-preview/`, ignoré par git, avec une page d'index.
 *
 *   cd worker && npm -w @mm/api-worker run email:apercu
 *   open apps/api/.email-preview/index.html
 *
 * Aucune donnée réelle, aucun réseau, aucun envoi : le catalogue (`test/apercu/catalogue.ts`)
 * rend les gabarits avec des exemples fictifs — le même catalogue que vérifient les tests.
 * Le TypeScript est empaqueté par esbuild (déjà présent via wrangler) : pas de dépendance de plus.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { build } from 'esbuild';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, '..');
const sortie = join(racine, '.email-preview');
const paquet = join(sortie, '.build', 'catalogue.mjs');

await rm(sortie, { recursive: true, force: true });
await mkdir(join(sortie, '.build'), { recursive: true });

await build({
  entryPoints: [join(racine, 'test', 'apercu', 'catalogue.ts')],
  outfile: paquet,
  bundle: true,
  format: 'esm',
  platform: 'node',
  logLevel: 'warning',
});

const { catalogue } = await import(pathToFileURL(paquet).href);
const entrees = catalogue();

const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const e of entrees) {
  await writeFile(join(sortie, `${e.fichier}.html`), e.rendu.html);
  await writeFile(join(sortie, `${e.fichier}.txt`), `Objet : ${e.rendu.subject}\n\n${e.rendu.text}\n`);
}

const lignes = entrees
  .map((e) => `<tr><td>${echapper(e.nom)}</td><td>${e.langue}</td><td class="${e.regime}">${e.regime}</td>
    <td>${echapper(e.rendu.subject)}</td><td><a href="${e.fichier}.html">HTML</a> · <a href="${e.fichier}.txt">texte</a></td>
    <td class="d">${echapper(e.declencheur)}</td></tr>`)
  .join('\n');

await writeFile(join(sortie, 'index.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Aperçu des e-mails — Max-Morrys</title>
<style>
  body{margin:0;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F5F7F9;color:#0E1116}
  h1{font-family:Georgia,serif;font-weight:900;letter-spacing:-.03em}
  table{border-collapse:collapse;width:100%;background:#fff;font-size:14px}
  td,th{padding:9px 10px;border-bottom:1px solid #E2E7EC;text-align:left;vertical-align:top}
  .marketing{color:#5A17BE;font-weight:700} .transactionnel{color:#5A6472} .d{color:#5A6472;font-size:12.5px}
  a{color:#0057BC}
</style></head><body>
<h1>Aperçu des e-mails</h1>
<p>${entrees.length} rendus, données fictives. Généré le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC. Dossier ignoré par git.</p>
<table><thead><tr><th>Courrier</th><th>Langue</th><th>Régime</th><th>Objet</th><th>Fichiers</th><th>Quand il part</th></tr></thead>
<tbody>${lignes}</tbody></table></body></html>`);

await rm(join(sortie, '.build'), { recursive: true, force: true });
console.log(`${entrees.length} aperçus écrits dans ${sortie}`);
console.log(`Ouvre : ${join(sortie, 'index.html')}`);
