import type { CallContext } from './context';
import { adminCreateUser, adminManageEnrollment, adminManageRysmoQuota } from './handlers/admin';
import { clearRysmoMemory } from './handlers/clearRysmoMemory';
import { getRysmoQuota } from './handlers/getRysmoQuota';
import { issueCertificate } from './handlers/issueCertificate';
import { reindexSearch } from './handlers/reindexSearch';
import { spotifyProxy } from './handlers/spotifyProxy';
import { translateContent } from './handlers/translateContent';
import { youtubeProxy } from './handlers/youtubeProxy';

export type CallHandler = (data: unknown, context: CallContext) => Promise<unknown>;

/**
 * Callables implémentées localement.
 *
 * Y figurer ne suffit pas à être servie : il faut aussi que le nom soit listé
 * dans la variable `MIGRATED`. Cette double condition permet de déployer une
 * implémentation et de la mettre en service séparément — et de la retirer du
 * service sans redéployer de code.
 */
export const HANDLERS: Record<string, CallHandler> = {
  // Lectures et proxies
  getRysmoQuota,
  spotifyProxy,
  youtubeProxy,
  // Écritures simples
  clearRysmoMemory,
  issueCertificate,
  translateContent,
  // Administration
  adminCreateUser,
  adminManageRysmoQuota,
  adminManageEnrollment,
  reindexSearch,
};
