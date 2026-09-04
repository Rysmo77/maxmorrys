#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * `covers:weight` — ALLÉGER LES COUVERTURES DÉJÀ EN LIGNE.
 *
 * `src/lib/images/compress.ts` allège les images AU TÉLÉVERSEMENT. Il ne fait rien pour le
 * stock déjà en place : les couvertures d'article servies aujourd'hui pèsent entre 643 et
 * 847 Ko, et chacune est téléchargée trois fois pour une seule lecture — par la personne qui
 * ouvre la page, par chaque robot qui construit l'aperçu du lien, puis par chaque plateforme
 * où il est partagé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI PAS DU WEBP, ALORS QUE C'EST CE QUE FAIT L'UPLOAD.
 *
 * Ces fichiers ne sont pas que des illustrations de page : `content.ts` les désigne en
 * `og:image` pour chaque article. Or le robot de Facebook — donc WhatsApp — ne lit pas le
 * WebP. Les convertir allégerait la page et SUPPRIMERAIT l'aperçu des articles sur le canal
 * dominant du marché : exactement ce que le travail du 03/09 venait de réparer.
 *
 * Le stock reste donc en JPEG, simplement réencodé. Ce n'est pas un compromis tiède : ces
 * fichiers SONT déjà des JPEG (magie JFIF sous une extension `.png`), encodés très haut et
 * porteurs de métadonnées C2PA. L'essentiel du poids est là, pas dans le format.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS MODES, DU PLUS SÛR AU PLUS ENGAGEANT.
 *
 *   --survey    (défaut) inventaire seul. Aucune écriture, aucun identifiant.
 *   --backup    télécharge les originaux dans un dossier local, et s'arrête là.
 *   --apply     réécrit les objets EN PLACE dans R2, via wrangler.
 *
 * `--apply` exige que la sauvegarde soit complète : il refuse de démarrer sinon. La réécriture
 * est en place, sous la MÊME clé — donc aucune référence à changer, ni dans Firestore, ni dans
 * les flux, ni dans les aperçus déjà mis en cache par les plateformes.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, '..');
const BACKUP_DIR = join(ROOT, '.covers-backup');
const BUCKET = 'maxmorrys-lms';

const args = process.argv.slice(2);
const MODE = args.includes('--apply') ? 'apply' : args.includes('--backup') ? 'backup' : 'survey';

/** Qualité de réencodage. 82 est le seuil au-delà duquel le gain s'effondre sans gain visible. */
const QUALITY = 82;
/** En dessous, réencoder ne rapporte rien. */
const MIN_BYTES = 150 * 1024;

const UA = 'Mozilla/5.0 (compatible; maxmorrys-covers/1.0)';

/**
 * Les couvertures réellement servies, lues dans le sitemap.
 *
 * C'est la seule source publique qui liste exactement les contenus PUBLIÉS et leur image —
 * la collection `blog` n'est pas lisible sans identifiants. Elle a l'avantage de ne décrire
 * que ce qui est en ligne, donc de ne jamais toucher à un brouillon.
 */
async function coverUrls() {
  const response = await fetch('https://maxmorrys.me/sitemap.xml', { headers: { 'User-Agent': UA } });
  if (!response.ok) throw new Error(`sitemap : HTTP ${response.status}`);
  const xml = await response.text();
  const all = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]);
  // Seules les images du bucket sont réencodables : les vignettes YouTube et les pochettes
  // Spotify ne nous appartiennent pas.
  return [...new Set(all.filter((u) => u.includes('r2.dev') || u.includes('media.maxmorrys.me')))];
}

/** La clé R2 d'une URL publique : tout ce qui suit le domaine. */
function keyOf(url) {
  return new URL(url).pathname.replace(/^\//, '');
}

/**
 * Réencode sans changer de format ni de dimensions.
 *
 * `withMetadata()` n'est PAS appelé : les métadonnées C2PA de ces fichiers pèsent lourd et
 * n'ont aucun lecteur ici. Les dimensions sont conservées telles quelles — une couverture
 * sert d'`og:image`, et la rétrécir dégraderait l'aperçu.
 */
async function reencode(buffer) {
  const meta = await sharp(buffer).metadata();
  if (meta.format === 'png') {
    return { buffer: await sharp(buffer).png({ compressionLevel: 9, effort: 10 }).toBuffer(), type: 'image/png' };
  }
  return {
    buffer: await sharp(buffer).jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer(),
    type: 'image/jpeg',
  };
}

const ko = (n) => `${Math.round(n / 1024)} Ko`;

async function main() {
  const urls = await coverUrls();
  console.log(`${urls.length} couvertures servies depuis le bucket.\n`);

  if (MODE === 'apply' && !existsSync(BACKUP_DIR)) {
    console.error(
      'Sauvegarde absente. `--apply` réécrit les originaux : lancer d’abord\n' +
        '  node scripts/covers-weight.mjs --backup',
    );
    process.exit(1);
  }

  await mkdir(BACKUP_DIR, { recursive: true });

  let before = 0;
  let after = 0;
  let touched = 0;
  const formats = {};
  const failures = [];

  for (const [index, url] of urls.entries()) {
    const key = keyOf(url);
    const label = basename(key).slice(0, 46);
    try {
      const response = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const original = Buffer.from(await response.arrayBuffer());
      const meta = await sharp(original).metadata();
      formats[meta.format] = (formats[meta.format] ?? 0) + 1;
      before += original.length;

      if (original.length < MIN_BYTES) {
        after += original.length;
        console.log(`  ·   ${String(index + 1).padStart(2)}/${urls.length}  ${label} — ${ko(original.length)}, déjà léger`);
        continue;
      }

      const { buffer: encoded, type } = await reencode(original);
      // Ne jamais remplacer par plus lourd : certaines images sont déjà au bon point.
      const keep = encoded.length < original.length ? encoded : original;
      after += keep.length;
      const gain = Math.round((1 - keep.length / original.length) * 100);

      if (MODE !== 'survey') {
        await writeFile(join(BACKUP_DIR, key.replace(/\//g, '__')), original);
      }

      if (MODE === 'apply' && keep !== original) {
        const tmp = join(BACKUP_DIR, `.tmp-${basename(key)}`);
        await writeFile(tmp, keep);
        // Réécriture EN PLACE : même clé, donc aucune référence à mettre à jour.
        await run('npx', [
          'wrangler', 'r2', 'object', 'put', `${BUCKET}/${key}`,
          '--file', tmp, '--content-type', type, '--remote',
        ], { cwd: join(ROOT, 'worker') });
        touched++;
      }

      console.log(
        `  ${MODE === 'apply' && keep !== original ? '✔' : '·'}   ${String(index + 1).padStart(2)}/${urls.length}  ` +
          `${label} — ${ko(original.length)} → ${ko(keep.length)}  (−${gain} %)`,
      );
    } catch (error) {
      failures.push({ url, message: error.message });
      console.log(`  ✖   ${String(index + 1).padStart(2)}/${urls.length}  ${label} — ${error.message}`);
    }
  }

  console.log(
    `\nFormats réels : ${Object.entries(formats).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
  );
  console.log(`Poids  : ${(before / 1024 / 1024).toFixed(1)} Mo → ${(after / 1024 / 1024).toFixed(1)} Mo` +
    `  (−${Math.round((1 - after / before) * 100)} %)`);

  if (MODE === 'survey') {
    console.log(`\nInventaire seul. Pour agir :\n  node scripts/covers-weight.mjs --backup\n  node scripts/covers-weight.mjs --apply`);
  } else {
    const saved = (await readdir(BACKUP_DIR)).filter((f) => !f.startsWith('.tmp-')).length;
    console.log(`Sauvegarde : ${saved} originaux dans ${BACKUP_DIR.replace(ROOT, '.')}`);
    if (MODE === 'apply') console.log(`Réécrits en place : ${touched}`);
  }

  if (failures.length) {
    console.log(`\n${failures.length} échec(s) :`);
    for (const f of failures) console.log(`  ${f.url} — ${f.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
