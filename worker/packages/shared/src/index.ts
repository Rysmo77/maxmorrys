/**
 * Utilitaires transverses aux Workers maxmorrys.me.
 *
 * Ce paquet ne doit dépendre d'aucun binding : il est importé aussi bien par le
 * worker `site` (compte de service en lecture seule) que par `api` et `jobs`.
 */

export { corsHeaders, parseOrigins, preflightResponse } from './cors';
export type { CorsPolicy } from './cors';
export { constantTimeEqual, hmacSha256, sha256Hex, verifyHmacSha256 } from './crypto';
export { json, text } from './http';
export { callableError, callableResult, httpStatusFor, HttpsError, readCallableBody } from './oncall';
export type { HttpsErrorCode } from './oncall';
export { translateBatch, translateCached, translateMetaToEn } from './translate';
export type { TranslatableMeta, TranslateConfig } from './translate';
