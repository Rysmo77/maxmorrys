#!/usr/bin/env node
/**
 * Copie les objets de Firebase Storage (GCS) vers Cloudflare R2.
 *
 * Le bucket est petit (~240 objets, ~0,2 Go) : pas besoin de rclone ni de
 * credentials S3 R2. On lit GCS avec le compte de service et on écrit dans R2
 * via `wrangler`, qui utilise le même token Cloudflare que le reste du projet.
 *
 * **Rien n'est supprimé côté GCS.** La copie est idempotente et reprenable :
 * un manifeste local mémorise les clés déjà transférées.
 *
 * Usage :
 *   GOOGLE_APPLICATION_CREDENTIALS=./max-morrys-<id>.json \
 *   CLOUDFLARE_API_TOKEN=… \
 *   node scripts/migrate-gcs-to-r2.mjs [--apply] [--limit N]
 *
 * Sans `--apply`, le script se contente d'inventorier et de dire ce qu'il ferait.
 */

import { createSign } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const APPLY = process.argv.includes('--apply');
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i === -1 ? Infinity : Number(process.argv[i + 1]);
})();

const BUCKET_GCS = 'max-morrys.firebasestorage.app';
const BUCKET_R2 = 'maxmorrys-lms';
const MANIFEST = '.migration-gcs-r2.json';
const CONCURRENCY = 4;

/**
 * Préfixes volontairement exclus.
 *
 * `temp/` est purgé quotidiennement par `cleanupTempStorage`, et `backups/`
 * contient les exports Firestore, qui suivent leur propre cycle.
 */
const SKIP_PREFIXES = ['temp/', 'backups/'];

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS est requis.');
  process.exit(2);
}
if (APPLY && !process.env.CLOUDFLARE_API_TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN est requis avec --apply.');
  process.exit(2);
}

const sa = JSON.parse(await readFile(credentialsPath, 'utf8'));

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function accessToken(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now - 10,
      exp: now + 3600,
    }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const assertion = `${header}.${payload}.${signer
    .sign(sa.private_key.replace(/\\n/g, '\n'))
    .toString('base64url')}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await response.json();
  if (!body.access_token) throw new Error(`OAuth refusé : ${JSON.stringify(body)}`);
  return body.access_token;
}

async function listObjects(token) {
  const objects = [];
  let pageToken = null;
  do {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${BUCKET_GCS}/o`);
    url.searchParams.set('maxResults', '1000');
    url.searchParams.set('fields', 'items(name,size,contentType),nextPageToken');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Listing GCS : HTTP ${response.status}`);
    const body = await response.json();
    objects.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return objects;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.stdout.on('data', () => {});
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(stderr.slice(-400) || `code ${code}`)),
    );
  });
}

async function copyOne(object, token, workDir) {
  const localPath = join(workDir, object.name.replace(/[^\w./-]/g, '_'));
  await mkdir(dirname(localPath), { recursive: true });

  const url = `https://storage.googleapis.com/storage/v1/b/${BUCKET_GCS}/o/${encodeURIComponent(object.name)}?alt=media`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`téléchargement HTTP ${response.status}`);
  await writeFile(localPath, Buffer.from(await response.arrayBuffer()));

  const args = [
    'wrangler',
    'r2',
    'object',
    'put',
    `${BUCKET_R2}/${object.name}`,
    '--file',
    localPath,
    '--remote',
  ];
  // Un contentType erroné casse la lecture navigateur (un .mp4 servi en
  // application/octet-stream se télécharge au lieu de se lire).
  if (object.contentType) args.push('--content-type', object.contentType);

  await run('npx', args);
  await rm(localPath, { force: true });
}

/* ─────────────────────────────── Exécution ─────────────────────────────── */

const token = await accessToken('https://www.googleapis.com/auth/devstorage.read_only');
const all = await listObjects(token);

const candidates = all
  .filter((o) => !SKIP_PREFIXES.some((p) => o.name.startsWith(p)))
  .filter((o) => !o.name.endsWith('/'));

const skipped = all.length - candidates.length;
const totalBytes = candidates.reduce((sum, o) => sum + Number(o.size ?? 0), 0);

console.log(`Inventaire GCS : ${all.length} objets, ${candidates.length} à copier` +
  (skipped ? ` (${skipped} ignorés : ${SKIP_PREFIXES.join(', ')})` : ''));
console.log(`Volume : ${(totalBytes / 1e6).toFixed(1)} Mo\n`);

const done = existsSync(MANIFEST)
  ? new Set(JSON.parse(await readFile(MANIFEST, 'utf8')))
  : new Set();
const todo = candidates.filter((o) => !done.has(o.name)).slice(0, LIMIT);

if (done.size > 0) console.log(`${done.size} objet(s) déjà copié(s) lors d'un passage précédent.\n`);

if (!APPLY) {
  console.log(`Simulation — ${todo.length} objet(s) seraient copiés. Relancer avec --apply.`);
  for (const o of todo.slice(0, 10)) console.log(`  ${o.name}`);
  if (todo.length > 10) console.log(`  … et ${todo.length - 10} de plus`);
  process.exit(0);
}

const workDir = join(tmpdir(), `gcs-r2-${process.pid}`);
await mkdir(workDir, { recursive: true });

let copied = 0;
let failed = 0;
const queue = [...todo];

async function worker() {
  for (;;) {
    const object = queue.shift();
    if (!object) return;
    try {
      await copyOne(object, token, workDir);
      done.add(object.name);
      copied += 1;
      if (copied % 20 === 0) {
        await writeFile(MANIFEST, JSON.stringify([...done], null, 0));
        console.log(`  ${copied}/${todo.length} copiés`);
      }
    } catch (error) {
      failed += 1;
      console.error(`  ✗ ${object.name} : ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await writeFile(MANIFEST, JSON.stringify([...done], null, 0));
await rm(workDir, { recursive: true, force: true });

console.log(`\n${copied} copié(s), ${failed} échec(s). Manifeste : ${MANIFEST}`);
console.log('Rien n a été supprimé côté GCS.');
process.exit(failed === 0 ? 0 : 1);
