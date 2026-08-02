/**
 * Codec entre les valeurs JS et la représentation typée de l'API REST Firestore.
 *
 * C'est le module le plus sensible de la migration : une conversion approximative
 * ne lève aucune erreur, elle change le type stocké et casse silencieusement les
 * `orderBy` et les `onSnapshot` du frontend. Règle directrice : **ne jamais
 * changer le type d'un champ existant**.
 */

import { base64ToBytes, bytesToBase64 } from '@mm/gcp-auth';

/** Valeur Firestore au format REST. */
export type FsValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number | string }
  | { timestampValue: string }
  | { stringValue: string }
  | { bytesValue: string }
  | { referenceValue: string }
  | { geoPointValue: { latitude?: number; longitude?: number } }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } };

export interface FsDocument {
  name: string;
  fields?: Record<string, FsValue>;
  createTime?: string;
  updateTime?: string;
}

/**
 * Référence vers un autre document.
 *
 * Stocke le **nom complet** (`projects/…/databases/…/documents/blog/x`) et non le
 * chemin court, pour que `decode → encode` soit exact : l'API n'accepte que le
 * nom complet en `referenceValue`. Utiliser `Firestore.ref(path)` pour en
 * construire une depuis un chemin relatif.
 */
export class DocumentRef {
  constructor(readonly name: string) {}

  /** Chemin relatif à la base, p. ex. `blog/mon-article`. */
  get path(): string {
    return refPathFromName(this.name);
  }
}

/** Point géographique Firestore. */
export class GeoPoint {
  constructor(readonly latitude: number, readonly longitude: number) {}
}

/**
 * Horodatage Firestore.
 *
 * Conserve la chaîne RFC3339 **exacte** renvoyée par l'API plutôt que de la
 * convertir en `Date`. `serverTimestamp()` produit une précision à la
 * microseconde que `Date` (milliseconde) tronquerait : relire un document puis
 * le réécrire perdrait silencieusement les nanosecondes.
 *
 * La surface d'API reprend celle de `admin.firestore.Timestamp`, ce qui limite
 * les adaptations lors du portage des Cloud Functions.
 */
export class Timestamp {
  constructor(readonly rfc3339: string) {}

  static fromDate(date: Date): Timestamp {
    return new Timestamp(date.toISOString());
  }

  toDate(): Date {
    return new Date(this.rfc3339);
  }

  toMillis(): number {
    return this.toDate().getTime();
  }

  toISOString(): string {
    return this.rfc3339;
  }

  toJSON(): string {
    return this.rfc3339;
  }
}

/**
 * Force l'encodage d'un nombre en `doubleValue`.
 *
 * JS ne distingue pas `5` de `5.0` : sans ce marqueur, un champ stocké en double
 * dont la valeur tombe sur un entier repart en `integerValue`. C'est exactement
 * le comportement de `firebase-admin` — donc pas une régression par rapport aux
 * Cloud Functions actuelles — mais il faut le connaître et utiliser `asDouble()`
 * dès qu'un champ numérique peut être fractionnaire (prix, moyennes, taux).
 *
 * En pratique le risque reste faible : `update()` n'écrit que les champs fournis,
 * un champ jamais touché n'est jamais réécrit.
 */
export class DoubleValue {
  constructor(readonly value: number) {}
}

export function asDouble(value: number): DoubleValue {
  return new DoubleValue(value);
}

/* ─────────────────────────── Décodage REST → JS ─────────────────────────── */

function decodeDouble(raw: number | string): number {
  if (typeof raw === 'number') return raw;
  // Google sérialise les valeurs spéciales en chaînes.
  if (raw === 'NaN') return Number.NaN;
  if (raw === 'Infinity') return Number.POSITIVE_INFINITY;
  if (raw === '-Infinity') return Number.NEGATIVE_INFINITY;
  return Number(raw);
}

export function decodeValue(value: FsValue): unknown {
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  // Piège : integerValue arrive en chaîne, toujours.
  // (Au-delà de 2^53 la conversion perdrait en précision ; aucun compteur du
  // projet n'approche cet ordre de grandeur.)
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return decodeDouble(value.doubleValue);
  if ('timestampValue' in value) return new Timestamp(value.timestampValue);
  if ('stringValue' in value) return value.stringValue;
  if ('bytesValue' in value) return base64ToBytes(value.bytesValue);
  if ('referenceValue' in value) return new DocumentRef(value.referenceValue);
  if ('geoPointValue' in value) {
    // Une coordonnée nulle est omise par l'API, pas sérialisée à 0.
    return new GeoPoint(value.geoPointValue.latitude ?? 0, value.geoPointValue.longitude ?? 0);
  }
  // Piège : un tableau vide arrive en `{arrayValue:{}}`, sans clé `values`.
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue);
  // Idem pour une map vide : `{mapValue:{}}`.
  if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {});
  throw new Error(`Valeur Firestore de type inconnu : ${JSON.stringify(value).slice(0, 120)}`);
}

export function decodeFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decodeValue(value);
  return out;
}

/* ─────────────────────────── Encodage JS → REST ─────────────────────────── */

export function encodeValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'string') return { stringValue: value };

  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    // NaN et ±Infinity doivent repartir en chaînes : `JSON.stringify` les
    // sérialiserait en `null`, et Firestore stockerait un nullValue.
    if (!Number.isFinite(value)) {
      return { doubleValue: Number.isNaN(value) ? 'NaN' : value > 0 ? 'Infinity' : '-Infinity' };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'bigint') return { integerValue: String(value) };

  if (value instanceof DoubleValue) return { doubleValue: value.value };
  // Timestamp d'abord : il restitue la chaîne d'origine, au nanoseconde près.
  if (value instanceof Timestamp) return { timestampValue: value.rfc3339 };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (value instanceof Uint8Array) return { bytesValue: bytesToBase64(value) };
  if (value instanceof DocumentRef) return { referenceValue: value.name };
  if (value instanceof GeoPoint) {
    return { geoPointValue: { latitude: value.latitude, longitude: value.longitude } };
  }

  if (Array.isArray(value)) {
    // `undefined` dans un tableau devient null — Firestore n'admet pas de trou.
    return { arrayValue: { values: value.map(encodeValue) } };
  }

  if (typeof value === 'object') {
    return { mapValue: { fields: encodeFieldsRaw(value as Record<string, unknown>) } };
  }

  throw new Error(`Valeur non encodable en Firestore : ${typeof value}`);
}

/**
 * Encode un objet en `fields`, en ignorant les `undefined`.
 *
 * Ne traite pas les sentinelles : réservé aux maps imbriquées, où les transforms
 * ne sont pas admis.
 */
function encodeFieldsRaw(data: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    out[key] = encodeValue(value);
  }
  return out;
}

/* ─────────────────────────────── Sentinelles ────────────────────────────── */

export type Sentinel =
  | { kind: 'serverTimestamp' }
  | { kind: 'increment'; by: number }
  | { kind: 'arrayUnion'; values: unknown[] }
  | { kind: 'arrayRemove'; values: unknown[] }
  | { kind: 'delete' };

const SENTINEL = Symbol.for('mm.firestore.sentinel');

interface SentinelBox {
  [SENTINEL]: Sentinel;
}

function box(sentinel: Sentinel): SentinelBox {
  return { [SENTINEL]: sentinel };
}

export function isSentinel(value: unknown): value is SentinelBox {
  return typeof value === 'object' && value !== null && SENTINEL in value;
}

function unbox(value: SentinelBox): Sentinel {
  return value[SENTINEL];
}

/**
 * Équivalents de `admin.firestore.FieldValue`.
 *
 * Ces valeurs ne sont pas des `fields` : elles deviennent des `DocumentTransform`
 * dans un `:commit`. Un PATCH ne sait pas les exprimer.
 */
export const FieldValue = {
  serverTimestamp: (): unknown => box({ kind: 'serverTimestamp' }),
  increment: (by: number): unknown => box({ kind: 'increment', by }),
  arrayUnion: (...values: unknown[]): unknown => box({ kind: 'arrayUnion', values }),
  arrayRemove: (...values: unknown[]): unknown => box({ kind: 'arrayRemove', values }),
  delete: (): unknown => box({ kind: 'delete' }),
};

/** Transformation de champ au format REST. */
export type FieldTransform =
  | { fieldPath: string; setToServerValue: 'REQUEST_TIME' }
  | { fieldPath: string; increment: FsValue }
  | { fieldPath: string; appendMissingElements: { values: FsValue[] } }
  | { fieldPath: string; removeAllFromArray: { values: FsValue[] } };

/**
 * Un nom de champ n'a besoin d'être entouré de backticks que s'il n'est pas un
 * identifiant simple. Les backticks internes doivent être échappés.
 */
export function quoteFieldPath(field: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) return field;
  return `\`${field.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``;
}

export interface EncodedWrite {
  /** Champs à écrire réellement. */
  fields: Record<string, FsValue>;
  /** Transformations serveur (increment, serverTimestamp, arrayUnion/Remove). */
  transforms: FieldTransform[];
  /**
   * Chemins à faire figurer dans l'`updateMask` : tous les champs écrits, plus
   * les champs supprimés (présents dans le masque mais absents de `fields`) et
   * les cibles de transforms.
   */
  maskPaths: string[];
}

/**
 * Sépare un objet applicatif en champs, transformations et masque de mise à jour.
 *
 * Ne traite les sentinelles qu'au premier niveau — c'est aussi la seule position
 * où Firestore les accepte.
 */
export function encodeWrite(data: Record<string, unknown>): EncodedWrite {
  const fields: Record<string, FsValue> = {};
  const transforms: FieldTransform[] = [];
  const maskPaths: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const fieldPath = quoteFieldPath(key);

    if (isSentinel(value)) {
      const sentinel = unbox(value);
      switch (sentinel.kind) {
        case 'delete':
          // Dans le masque mais pas dans les champs : c'est ce qui vaut suppression.
          maskPaths.push(fieldPath);
          break;
        case 'serverTimestamp':
          transforms.push({ fieldPath, setToServerValue: 'REQUEST_TIME' });
          break;
        case 'increment':
          transforms.push({ fieldPath, increment: encodeValue(sentinel.by) });
          break;
        case 'arrayUnion':
          transforms.push({
            fieldPath,
            appendMissingElements: { values: sentinel.values.map(encodeValue) },
          });
          break;
        case 'arrayRemove':
          transforms.push({
            fieldPath,
            removeAllFromArray: { values: sentinel.values.map(encodeValue) },
          });
          break;
      }
      continue;
    }

    fields[key] = encodeValue(value);
    maskPaths.push(fieldPath);
  }

  return { fields, transforms, maskPaths };
}

/* ──────────────────────────── Chemins et noms ───────────────────────────── */

const NAME_PREFIX = /^projects\/[^/]+\/databases\/[^/]+\/documents\/?/;

/** `projects/p/databases/(default)/documents/blog/x` → `blog/x`. */
export function refPathFromName(name: string): string {
  return name.replace(NAME_PREFIX, '');
}

/** Dernier segment d'un chemin de document — l'identifiant. */
export function docIdFromPath(path: string): string {
  const segments = path.split('/');
  return segments[segments.length - 1] ?? '';
}

/**
 * Sépare un chemin de collection en parent et identifiant de collection.
 *
 * `blog` → `{ parent: '', collectionId: 'blog' }`
 * `notifications/{uid}/items` → `{ parent: 'notifications/{uid}', collectionId: 'items' }`
 */
export function splitCollectionPath(collectionPath: string): {
  parent: string;
  collectionId: string;
} {
  const clean = collectionPath.replace(/^\/+|\/+$/g, '');
  const segments = clean.split('/');
  if (segments.length % 2 === 0) {
    throw new Error(`Chemin de collection invalide (nombre de segments pair) : ${collectionPath}`);
  }
  const collectionId = segments.pop() as string;
  return { parent: segments.join('/'), collectionId };
}
