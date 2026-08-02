import { readFile } from 'node:fs/promises';

import { createSelfSignedTokenProvider, parseServiceAccount } from '@mm/gcp-auth';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { decodeValue, encodeValue, type FsValue } from '../src/index';

/**
 * Valide le codec sur de **vrais** documents de production, en lecture seule.
 *
 * Les fixtures unitaires couvrent les formes connues ; ce test couvre celles
 * qu'on n'a pas anticipées. Il est ignoré tant que `GOOGLE_APPLICATION_CREDENTIALS`
 * n'est pas défini — donc silencieux en CI, où aucun secret n'est disponible.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=/chemin/max-morrys-<id>.json npm test
 *
 * La clé de service est lue à l'exécution et jamais journalisée.
 */

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const PER_COLLECTION = Number(process.env.CODEC_SAMPLE ?? 25);

/** Échantillon couvrant les formes de documents les plus variées du projet. */
const COLLECTIONS = [
  'blog',
  'formations',
  'podcasts',
  'videos',
  'users',
  'enrollments',
  'transactions',
  'club_subscriptions',
  'club_posts',
  'certificates',
  'agency_leads',
  'coupons',
];

/**
 * Normalisations proto3 attendues, appliquées des deux côtés : l'API omet les
 * valeurs par défaut, et `firebase-admin` comme nous encodons un double entier
 * en `integerValue`. Voir `value.test.ts` pour le détail.
 */
function canonicalize(value: FsValue): FsValue {
  if ('arrayValue' in value) {
    const values = (value.arrayValue.values ?? []).map(canonicalize);
    return values.length === 0 ? { arrayValue: {} } : { arrayValue: { values } };
  }
  if ('mapValue' in value) {
    const entries = Object.entries(value.mapValue.fields ?? {});
    if (entries.length === 0) return { mapValue: {} };
    return {
      mapValue: { fields: Object.fromEntries(entries.map(([k, v]) => [k, canonicalize(v)])) },
    };
  }
  if ('geoPointValue' in value) {
    const { latitude, longitude } = value.geoPointValue;
    return {
      geoPointValue: { ...(latitude ? { latitude } : {}), ...(longitude ? { longitude } : {}) },
    };
  }
  if ('doubleValue' in value) {
    const raw = value.doubleValue;
    if (typeof raw === 'number' && Number.isInteger(raw)) return { integerValue: String(raw) };
  }
  return value;
}

interface RestDocument {
  name: string;
  fields?: Record<string, FsValue>;
}

describe.skipIf(!credentialsPath)('codec Firestore — documents de production', () => {
  let token: () => Promise<string>;
  let documentsRoot: string;
  /** Garde anti-test-vide : une base injoignable rendrait tout vert sans rien vérifier. */
  let fieldsChecked = 0;

  afterAll(() => {
    expect(fieldsChecked, "aucun champ lu : le test n'a rien vérifié").toBeGreaterThan(0);
  });

  beforeAll(async () => {
    const serviceAccount = parseServiceAccount(await readFile(credentialsPath as string, 'utf8'));
    token = createSelfSignedTokenProvider(serviceAccount);
    documentsRoot = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents`;
  });

  for (const collection of COLLECTIONS) {
    it(
      `préserve chaque champ de ${collection}`,
      async () => {
        const response = await fetch(`${documentsRoot}/${collection}?pageSize=${PER_COLLECTION}`, {
          headers: { Authorization: `Bearer ${await token()}` },
        });

        // Une collection absente n'est pas un échec : le jeu de données évolue.
        if (response.status === 404) return;
        expect(response.ok, `HTTP ${response.status} sur ${collection}`).toBe(true);

        const { documents = [] } = (await response.json()) as { documents?: RestDocument[] };
        const divergences: string[] = [];

        for (const document of documents) {
          for (const [field, original] of Object.entries(document.fields ?? {})) {
            fieldsChecked += 1;
            const roundTripped = encodeValue(decodeValue(original));
            const before = JSON.stringify(canonicalize(original));
            const after = JSON.stringify(canonicalize(roundTripped));
            if (before !== after) {
              const id = document.name.split('/documents/')[1];
              divergences.push(`${id} « ${field} » : ${before.slice(0, 120)} → ${after.slice(0, 120)}`);
            }
          }
        }

        expect(divergences, divergences.slice(0, 5).join('\n')).toEqual([]);
      },
      30_000,
    );
  }
});
