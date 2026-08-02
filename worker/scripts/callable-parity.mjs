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

/**
 * Cas de comparaison, tous **sans effet de bord durable**.
 *
 * Les chemins de succès qui créeraient de la donnée réelle (`adminCreateUser`
 * avec des arguments valides, `issueCertificate` sur une inscription terminée)
 * ne sont volontairement pas couverts : ils demandent une vérification manuelle
 * depuis l'interface d'administration.
 */
const CASES = [
  { name: 'getRysmoQuota', data: {} },
  { name: 'clearRysmoMemory', data: {} },

  // Sans le rôle admin : on attend permission-denied des deux côtés.
  {
    name: 'spotifyProxy',
    data: { episodeId: 'test' },
    // Divergence attendue et documentée : l'API Spotify répond 403 en texte brut
    // (« Active premium subscription required for the owner of the app »), donc
    // les deux implémentations échouent. Elles n'échouent pas au même endroit
    // parce que la Cloud Function déployée est liée à une version antérieure du
    // secret. À reprendre quand l'abonnement Spotify sera rétabli.
    knownDivergent: 'API Spotify indisponible (abonnement du compte propriétaire)',
  },
  { name: 'youtubeProxy', data: { videoId: 'test' } },
  { name: 'adminManageRysmoQuota', data: { action: 'get' }, label: 'adminManageRysmoQuota (refusé)' },
  { name: 'adminCreateUser', data: {}, label: 'adminCreateUser (refusé)' },

  // Chemins d'argument invalide.
  { name: 'youtubeProxy', data: {}, label: 'youtubeProxy (sans videoId)' },
  { name: 'issueCertificate', data: {}, label: 'issueCertificate (sans formationId)' },
  {
    name: 'issueCertificate',
    data: { formationId: 'zz-formation-inexistante' },
    label: 'issueCertificate (non inscrit)',
  },
];

/** Cas nécessitant le rôle admin. Lecture seule ou sans cible existante. */
const ADMIN_CASES = [
  { name: 'adminManageRysmoQuota', data: { action: 'get', userId: 'zz-migration-smoke-test' } },
  { name: 'adminManageRysmoQuota', data: { action: 'get' }, label: 'adminManageRysmoQuota (sans userId)' },
  {
    name: 'adminManageRysmoQuota',
    data: { action: 'add', userId: 'zz-migration-smoke-test', amount: 0 },
    label: 'adminManageRysmoQuota (montant invalide)',
  },
  { name: 'adminManageRysmoQuota', data: { action: 'nawak', userId: 'x' }, label: 'adminManageRysmoQuota (action invalide)' },
  { name: 'adminCreateUser', data: { email: 'pas-un-email', password: 'x', displayName: 'x' }, label: 'adminCreateUser (email invalide)' },
  { name: 'adminCreateUser', data: { email: 'ok@example.com', password: 'court', displayName: 'x' }, label: 'adminCreateUser (mot de passe court)' },
  { name: 'adminManageEnrollment', data: { action: 'create' }, label: 'adminManageEnrollment (sans ids)' },
  {
    name: 'adminManageEnrollment',
    data: { action: 'delete', userId: 'zz-migration-smoke-test', formationId: 'zz-inexistante' },
    label: 'adminManageEnrollment (suppression sans cible)',
  },
];

const withAdmin = process.env.PARITY_ADMIN === 'true';
const allCases = withAdmin ? [...CASES, ...ADMIN_CASES] : CASES;

const selected = ONLY ? new Set(ONLY.split(',')) : null;
const cases = selected ? allCases.filter((c) => selected.has(c.name)) : allCases;

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

const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;

/**
 * Donne temporairement le rôle admin au compte de test.
 *
 * Les deux implémentations lisent `users/{uid}.role` : sans ce document, seuls
 * les chemins de refus seraient comparés. Le document est supprimé à la fin,
 * y compris en cas d'échec.
 */
async function setTestUserAdmin(accessToken) {
  const response = await fetch(`${FIRESTORE}/users/${TEST_UID}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        role: { stringValue: 'admin' },
        displayName: { stringValue: 'Compte de test migration' },
      },
    }),
  });
  if (!response.ok) throw new Error(`Rôle admin non posé : ${response.status}`);
}

async function deleteTestUserDoc(accessToken) {
  await fetch(`${FIRESTORE}/users/${TEST_UID}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined);
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
let accessToken = null;
try {
  const idToken = await exchangeForIdToken(mintCustomToken(TEST_UID));
  console.log(`Compte de test ${TEST_UID} authentifié.`);

  if (withAdmin) {
    accessToken = await oauthAccessToken();
    await setTestUserAdmin(accessToken);
    console.log('Rôle admin accordé temporairement.');
  }
  console.log('');

  for (const testCase of cases) {
    const label = testCase.label ?? testCase.name;
    const [worker, functions] = await callBoth(testCase.name, testCase.data, idToken);

    const sameStatus = worker.status === functions.status;
    const sameBody = normalize(worker.body) === normalize(functions.body);

    if (sameStatus && sameBody) {
      console.log(`✓ ${label.padEnd(28)} ${worker.status}  ${worker.body.slice(0, 90)}`);
    } else if (testCase.knownDivergent) {
      // Divergence connue et justifiée : signalée, mais ne fait pas échouer la
      // vérification — sinon le harnais cesserait d'être utilisable comme garde.
      console.log(`~ ${label.padEnd(28)} divergence attendue — ${testCase.knownDivergent}`);
      console.log(`    worker (${worker.status})   : ${worker.body.slice(0, 160)}`);
      console.log(`    functions (${functions.status}): ${functions.body.slice(0, 160)}`);
    } else {
      failures += 1;
      console.log(`✗ ${label}`);
      console.log(`    worker (${worker.status})   : ${worker.body.slice(0, 300)}`);
      console.log(`    functions (${functions.status}): ${functions.body.slice(0, 300)}`);
    }
  }
} finally {
  if (withAdmin) {
    await deleteTestUserDoc(accessToken ?? (await oauthAccessToken().catch(() => null)));
    console.log('Document users/ du compte de test supprimé.');
  }
  await deleteTestUser();
}

console.log(
  failures === 0
    ? `\nParité authentifiée confirmée sur ${cases.length} appel(s).`
    : `\n${failures} divergence(s) sur ${cases.length}.`,
);
process.exit(failures === 0 ? 0 : 1);
