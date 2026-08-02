#!/usr/bin/env node
/**
 * Compare les réponses d'une callable entre le Worker et la Cloud Function,
 * sur un appel **authentifié**.
 *
 * Le chemin non authentifié se teste avec un simple curl ; c'est le chemin
 * authentifié qui porte le risque réel (vérification du jeton, lecture du rôle,
 * accès Firestore). Le script s'authentifie donc pour de vrai.
 *
 * Il crée un compte de test éphémère, l'utilise, puis **le supprime** — y compris
 * en cas d'échec. Aucune écriture métier n'est effectuée : les callables listées
 * ci-dessous sont en lecture seule.
 *
 * Usage :
 *   GOOGLE_APPLICATION_CREDENTIALS=/chemin/max-morrys-<id>.json \
 *   FIREBASE_API_KEY=<clé web> \
 *   node scripts/callable-parity.mjs <urlWorker> <urlCloudFunctions> [fn1,fn2,...]
 */

import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const [, , WORKER, FUNCTIONS, ONLY] = process.argv;

if (!WORKER || !FUNCTIONS) {
  console.error('Usage : node scripts/callable-parity.mjs <urlWorker> <urlCloudFunctions> [noms]');
  process.exit(2);
}

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const apiKey = process.env.FIREBASE_API_KEY;
if (!credentialsPath || !apiKey) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS et FIREBASE_API_KEY sont requis.');
  process.exit(2);
}

/** Callables en lecture seule, sûres à comparer sur un compte éphémère. */
const CASES = [
  { name: 'getRysmoQuota', data: {} },
  // Non-admin : on attend permission-denied des deux côtés.
  { name: 'spotifyProxy', data: { episodeId: 'test' } },
  { name: 'youtubeProxy', data: { videoId: 'test' } },
  // Argument manquant, pour comparer aussi le chemin invalid-argument.
  { name: 'youtubeProxy', data: {}, label: 'youtubeProxy (sans videoId)' },
];

const selected = ONLY ? new Set(ONLY.split(',')) : null;
const cases = selected ? CASES.filter((c) => selected.has(c.name)) : CASES;

const sa = JSON.parse(await readFile(credentialsPath, 'utf8'));
const TEST_UID = 'zz-migration-smoke-test';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

/** Custom token Firebase : JWT RS256 signé par le compte de service. */
function mintCustomToken(uid) {
  const now = Math.floor(Date.now() / 1000);
  const aud =
    'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({ iss: sa.client_email, sub: sa.client_email, aud, iat: now, exp: now + 3600, uid }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(sa.private_key.replace(/\\n/g, '\n')).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

async function exchangeForIdToken(customToken) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const body = await response.json();
  if (!body.idToken) throw new Error(`Échange du custom token refusé : ${JSON.stringify(body)}`);
  return body.idToken;
}

/** Access token OAuth, nécessaire pour supprimer le compte de test. */
async function oauthAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const assertion = `${header}.${payload}.${signer.sign(sa.private_key.replace(/\\n/g, '\n')).toString('base64url')}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await response.json();
  if (!body.access_token) throw new Error('Access token OAuth indisponible');
  return body.access_token;
}

async function deleteTestUser() {
  try {
    const accessToken = await oauthAccessToken();
    await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:delete`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId: TEST_UID }),
      },
    );
    console.log(`\nCompte de test ${TEST_UID} supprimé.`);
  } catch (error) {
    console.error(`\n⚠️  Suppression du compte de test impossible : ${error.message}`);
    console.error('    À supprimer à la main dans Firebase Console → Authentication.');
  }
}

async function callBoth(name, data, idToken) {
  const request = (base) =>
    fetch(`${base.replace(/\/+$/, '')}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        Origin: 'https://maxmorrys.me',
      },
      body: JSON.stringify({ data }),
    }).then(async (response) => ({ status: response.status, body: await response.text() }));

  return Promise.all([request(WORKER), request(FUNCTIONS)]);
}

/** Compare en ignorant l'ordre des clés, qui n'a aucune signification en JSON. */
function normalize(text) {
  try {
    return JSON.stringify(sortDeep(JSON.parse(text)));
  } catch {
    return text.trim();
  }
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    );
  }
  return value;
}

let failures = 0;
try {
  const idToken = await exchangeForIdToken(mintCustomToken(TEST_UID));
  console.log(`Compte de test ${TEST_UID} authentifié.\n`);

  for (const testCase of cases) {
    const label = testCase.label ?? testCase.name;
    const [worker, functions] = await callBoth(testCase.name, testCase.data, idToken);

    const sameStatus = worker.status === functions.status;
    const sameBody = normalize(worker.body) === normalize(functions.body);

    if (sameStatus && sameBody) {
      console.log(`✓ ${label.padEnd(28)} ${worker.status}  ${worker.body.slice(0, 90)}`);
    } else {
      failures += 1;
      console.log(`✗ ${label}`);
      console.log(`    worker (${worker.status})   : ${worker.body.slice(0, 300)}`);
      console.log(`    functions (${functions.status}): ${functions.body.slice(0, 300)}`);
    }
  }
} finally {
  await deleteTestUser();
}

console.log(
  failures === 0
    ? `\nParité authentifiée confirmée sur ${cases.length} appel(s).`
    : `\n${failures} divergence(s) sur ${cases.length}.`,
);
process.exit(failures === 0 ? 0 : 1);
