export { Firestore, FirestoreError, Transaction } from './client';
export type { DocSnapshot, FirestoreOptions, Write } from './client';

export { buildStructuredQuery } from './query';
export type { Cursor, Filter, OrderBy, Query, WhereOp } from './query';

export {
  asDouble,
  decodeFields,
  decodeValue,
  docIdFromPath,
  DocumentRef,
  DoubleValue,
  encodeValue,
  encodeWrite,
  FieldValue,
  GeoPoint,
  isSentinel,
  quoteFieldPath,
  refPathFromName,
  splitCollectionPath,
  Timestamp,
} from './value';
export type { EncodedWrite, FieldTransform, FsDocument, FsValue, Sentinel } from './value';
