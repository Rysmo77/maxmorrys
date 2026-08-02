import { encodeValue, quoteFieldPath, type FsValue } from './value';

export type WhereOp =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

export interface Filter {
  field: string;
  op: WhereOp;
  value: unknown;
}

export interface OrderBy {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface Cursor {
  values: unknown[];
  /** `true` = le curseur est inclusif (startAt), `false` = exclusif (startAfter). */
  before: boolean;
}

export interface Query {
  /** Chemin de collection : `blog`, ou `notifications/{uid}/items`. */
  collection: string;
  where?: Filter[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  /** Ne rapatrier que ces champs. Réduit la bande passante, pas les lectures facturées. */
  select?: string[];
  /** Requête sur un groupe de collections. */
  allDescendants?: boolean;
  startAt?: Cursor;
  endAt?: Cursor;
}

const OPERATORS: Record<WhereOp, string> = {
  '==': 'EQUAL',
  '!=': 'NOT_EQUAL',
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  'array-contains': 'ARRAY_CONTAINS',
  'array-contains-any': 'ARRAY_CONTAINS_ANY',
  in: 'IN',
  'not-in': 'NOT_IN',
};

interface FieldReference {
  fieldPath: string;
}

type RestFilter =
  | { fieldFilter: { field: FieldReference; op: string; value: FsValue } }
  | { unaryFilter: { field: FieldReference; op: string } };

/**
 * Comparer à `null` ou `NaN` passe par un `unaryFilter` : un `fieldFilter` avec
 * `nullValue` est rejeté par l'API.
 */
function buildFilter(filter: Filter): RestFilter {
  const field: FieldReference = { fieldPath: quoteFieldPath(filter.field) };

  const isNull = filter.value === null;
  const isNan = typeof filter.value === 'number' && Number.isNaN(filter.value);
  if (isNull || isNan) {
    if (filter.op !== '==' && filter.op !== '!=') {
      throw new Error(`Opérateur ${filter.op} invalide pour une comparaison à ${isNull ? 'null' : 'NaN'}`);
    }
    const suffix = isNull ? 'NULL' : 'NAN';
    return { unaryFilter: { field, op: filter.op === '==' ? `IS_${suffix}` : `IS_NOT_${suffix}` } };
  }

  const op = OPERATORS[filter.op];
  if (!op) throw new Error(`Opérateur de filtre inconnu : ${filter.op}`);

  // Les opérateurs ensemblistes attendent un arrayValue enveloppant.
  const needsArray = filter.op === 'in' || filter.op === 'not-in' || filter.op === 'array-contains-any';
  if (needsArray && !Array.isArray(filter.value)) {
    throw new Error(`L'opérateur ${filter.op} attend un tableau`);
  }

  return { fieldFilter: { field, op, value: encodeValue(filter.value) } };
}

export interface StructuredQuery {
  from: Array<{ collectionId: string; allDescendants?: boolean }>;
  where?: { compositeFilter: { op: 'AND'; filters: RestFilter[] } } | RestFilter;
  orderBy?: Array<{ field: FieldReference; direction: 'ASCENDING' | 'DESCENDING' }>;
  limit?: number;
  offset?: number;
  select?: { fields: FieldReference[] };
  startAt?: { values: FsValue[]; before: boolean };
  endAt?: { values: FsValue[]; before: boolean };
}

export function buildStructuredQuery(query: Query, collectionId: string): StructuredQuery {
  const structured: StructuredQuery = {
    from: [{ collectionId, ...(query.allDescendants ? { allDescendants: true } : {}) }],
  };

  if (query.where?.length) {
    const filters = query.where.map(buildFilter);
    structured.where =
      filters.length === 1 ? filters[0] : { compositeFilter: { op: 'AND', filters } };
  }

  if (query.orderBy?.length) {
    structured.orderBy = query.orderBy.map((order) => ({
      field: { fieldPath: quoteFieldPath(order.field) },
      direction: order.direction === 'desc' ? 'DESCENDING' : 'ASCENDING',
    }));
  }

  if (query.select?.length) {
    structured.select = { fields: query.select.map((f) => ({ fieldPath: quoteFieldPath(f) })) };
  }

  if (typeof query.limit === 'number') structured.limit = query.limit;
  if (typeof query.offset === 'number') structured.offset = query.offset;

  if (query.startAt) {
    structured.startAt = {
      values: query.startAt.values.map(encodeValue),
      before: query.startAt.before,
    };
  }
  if (query.endAt) {
    structured.endAt = { values: query.endAt.values.map(encodeValue), before: query.endAt.before };
  }

  return structured;
}
