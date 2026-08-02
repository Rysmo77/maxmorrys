import { describe, expect, it } from 'vitest';

import {
  asDouble,
  decodeFields,
  decodeValue,
  DocumentRef,
  encodeValue,
  encodeWrite,
  FieldValue,
  GeoPoint,
  quoteFieldPath,
  refPathFromName,
  splitCollectionPath,
  Timestamp,
  type FsDocument,
  type FsValue,
} from '../src/index';

import fixtures from './fixtures/documents.json';

type Fixture = FsDocument & { _case: string };

/**
 * Le typage littéral que TS infère d'un import JSON marque en `undefined` toute
 * clé absente d'un des documents ; le passage par `unknown` est ici le cast
 * attendu, pas un contournement.
 */
const documents = fixtures as unknown as Fixture[];

/**
 * Ré-encode un objet décodé, sans passer par `encodeWrite` (pas de sentinelles
 * dans les fixtures) — c'est l'aller-retour qu'on veut prouver exact.
 */
function reencode(data: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [key, value] of Object.entries(data)) out[key] = encodeValue(value);
  return out;
}

/**
 * Ramène une valeur à sa forme canonique avant comparaison.
 *
 * Deux écarts sont attendus et sans conséquence, appliqués aux deux côtés :
 *
 *  1. **Omission des valeurs par défaut proto3.** L'API renvoie `{arrayValue:{}}`,
 *     `{mapValue:{}}` et un geoPoint sans coordonnée nulle ; nous produisons la
 *     forme explicite. Firestore les interprète à l'identique.
 *  2. **`doubleValue` entier → `integerValue`.** JS ne distingue pas 45000 de
 *     45000.0. `firebase-admin` fait exactement la même chose, donc le portage
 *     n'introduit aucune régression — voir `asDouble()` et le test dédié.
 *
 * Tout autre écart est une vraie erreur de codec et fait échouer le test.
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
      geoPointValue: {
        ...(latitude ? { latitude } : {}),
        ...(longitude ? { longitude } : {}),
      },
    };
  }
  if ('doubleValue' in value) {
    const raw = value.doubleValue;
    if (typeof raw === 'number' && Number.isInteger(raw)) return { integerValue: String(raw) };
  }
  return value;
}

function canonicalizeFields(fields: Record<string, FsValue>): Record<string, FsValue> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, canonicalize(v)]));
}

describe('codec Firestore — aller-retour sur documents réalistes', () => {
  for (const fixture of documents) {
    it(`préserve ${fixture._case}`, () => {
      const decoded = decodeFields(fixture.fields ?? {});
      expect(canonicalizeFields(reencode(decoded))).toEqual(
        canonicalizeFields(fixture.fields ?? {}),
      );
    });
  }
});

describe('pièges de conversion documentés', () => {
  it('décode integerValue depuis une chaîne et le ré-encode en chaîne', () => {
    expect(decodeValue({ integerValue: '42' })).toBe(42);
    expect(encodeValue(42)).toEqual({ integerValue: '42' });
  });

  it('ne confond pas un double entier avec un integer quand asDouble est utilisé', () => {
    // Sans marqueur, JS ne distingue pas 45000 de 45000.0 : le champ basculerait
    // en integerValue et changerait de type en base.
    expect(encodeValue(45000)).toEqual({ integerValue: '45000' });
    expect(encodeValue(asDouble(45000))).toEqual({ doubleValue: 45000 });
    // Un double réellement fractionnaire n'a pas besoin du marqueur.
    expect(encodeValue(4.5)).toEqual({ doubleValue: 4.5 });
  });

  it('décode les valeurs doubles spéciales sérialisées en chaînes', () => {
    expect(decodeValue({ doubleValue: 'NaN' })).toBeNaN();
    expect(decodeValue({ doubleValue: 'Infinity' })).toBe(Number.POSITIVE_INFINITY);
    expect(decodeValue({ doubleValue: '-Infinity' })).toBe(Number.NEGATIVE_INFINITY);
  });

  it('ré-encode les doubles non finis en chaînes, sinon JSON.stringify les perd', () => {
    // `JSON.stringify({ doubleValue: Infinity })` produit `{"doubleValue":null}`
    // — Firestore stockerait alors un nullValue, en silence.
    expect(encodeValue(Number.NaN)).toEqual({ doubleValue: 'NaN' });
    expect(encodeValue(Number.POSITIVE_INFINITY)).toEqual({ doubleValue: 'Infinity' });
    expect(encodeValue(Number.NEGATIVE_INFINITY)).toEqual({ doubleValue: '-Infinity' });
    expect(JSON.parse(JSON.stringify(encodeValue(Number.POSITIVE_INFINITY)))).toEqual({
      doubleValue: 'Infinity',
    });
  });

  it('traite un arrayValue vide, qui arrive sans clé values', () => {
    expect(decodeValue({ arrayValue: {} })).toEqual([]);
    expect(encodeValue([])).toEqual({ arrayValue: { values: [] } });
  });

  it('traite un mapValue vide, qui arrive sans clé fields', () => {
    expect(decodeValue({ mapValue: {} })).toEqual({});
    expect(encodeValue({})).toEqual({ mapValue: { fields: {} } });
  });

  it('préserve la précision sous-milliseconde des timestamps', () => {
    // `new Date()` tronquerait à la milliseconde : serverTimestamp() produit des
    // microsecondes, et relire puis réécrire perdrait de l'information.
    const raw = '2026-03-02T08:16:01.000487Z';
    const decoded = decodeValue({ timestampValue: raw });
    expect(decoded).toBeInstanceOf(Timestamp);
    expect(encodeValue(decoded)).toEqual({ timestampValue: raw });
    expect((decoded as Timestamp).toDate().getUTCFullYear()).toBe(2026);
  });

  it('encode une Date en RFC3339 milliseconde', () => {
    expect(encodeValue(new Date('2026-03-02T08:16:01.000Z'))).toEqual({
      timestampValue: '2026-03-02T08:16:01.000Z',
    });
  });

  it('conserve le nom complet des références, seul format accepté par l API', () => {
    const name = 'projects/max-morrys/databases/(default)/documents/formations/x';
    const decoded = decodeValue({ referenceValue: name }) as DocumentRef;
    expect(decoded.path).toBe('formations/x');
    expect(encodeValue(decoded)).toEqual({ referenceValue: name });
  });

  it('complète les coordonnées omises d un geoPoint', () => {
    const decoded = decodeValue({ geoPointValue: {} }) as GeoPoint;
    expect(decoded).toEqual(new GeoPoint(0, 0));
  });

  it('ignore les undefined plutôt que de les écrire', () => {
    const { fields, maskPaths } = encodeWrite({ a: 1, b: undefined });
    expect(Object.keys(fields)).toEqual(['a']);
    expect(maskPaths).toEqual(['a']);
  });
});

describe('sentinelles FieldValue', () => {
  it('transforme increment en DocumentTransform et le retire des champs', () => {
    // Un PATCH ne sait pas exprimer un increment : il doit passer par :commit.
    const { fields, transforms, maskPaths } = encodeWrite({
      usedCount: FieldValue.increment(1),
      status: 'completed',
    });

    expect(fields).toEqual({ status: { stringValue: 'completed' } });
    expect(transforms).toEqual([{ fieldPath: 'usedCount', increment: { integerValue: '1' } }]);
    expect(maskPaths).toEqual(['status']);
  });

  it('exprime serverTimestamp et les opérations de tableau', () => {
    const { transforms } = encodeWrite({
      updatedAt: FieldValue.serverTimestamp(),
      tags: FieldValue.arrayUnion('seo'),
      blocked: FieldValue.arrayRemove('spam'),
    });

    expect(transforms).toEqual([
      { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
      { fieldPath: 'tags', appendMissingElements: { values: [{ stringValue: 'seo' }] } },
      { fieldPath: 'blocked', removeAllFromArray: { values: [{ stringValue: 'spam' }] } },
    ]);
  });

  it('exprime une suppression par présence dans le masque et absence des champs', () => {
    const { fields, maskPaths } = encodeWrite({ obsolete: FieldValue.delete(), keep: 1 });
    expect(fields).toEqual({ keep: { integerValue: '1' } });
    expect(maskPaths).toEqual(['obsolete', 'keep']);
  });
});

describe('chemins et noms de champs', () => {
  it('n entoure de backticks que les noms non identifiants', () => {
    expect(quoteFieldPath('slug_en')).toBe('slug_en');
    expect(quoteFieldPath('_private')).toBe('_private');
    expect(quoteFieldPath('champ avec espaces')).toBe('`champ avec espaces`');
    expect(quoteFieldPath('a.b')).toBe('`a.b`');
    expect(quoteFieldPath('back`tick')).toBe('`back\\`tick`');
  });

  it('extrait le chemin relatif d un nom complet', () => {
    expect(
      refPathFromName('projects/max-morrys/databases/(default)/documents/notifications/u1/items/n1'),
    ).toBe('notifications/u1/items/n1');
  });

  it('sépare parent et collection, y compris pour une sous-collection', () => {
    expect(splitCollectionPath('blog')).toEqual({ parent: '', collectionId: 'blog' });
    expect(splitCollectionPath('notifications/u1/items')).toEqual({
      parent: 'notifications/u1',
      collectionId: 'items',
    });
  });

  it('refuse un chemin de collection à nombre de segments pair', () => {
    expect(() => splitCollectionPath('blog/mon-article')).toThrow(/invalide/);
  });
});
