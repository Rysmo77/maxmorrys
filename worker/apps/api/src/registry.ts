import type { CallContext } from './context';
import { adminCreateUser, adminManageEnrollment, adminManageRysmoQuota } from './handlers/admin';
import { backfillSlugEn } from './handlers/backfillSlugEn';
import { clearRysmoMemory } from './handlers/clearRysmoMemory';
import { deleteUserAccount, exportUserData } from './handlers/gdpr';
import { getRysmoQuota } from './handlers/getRysmoQuota';
import { issueCertificate } from './handlers/issueCertificate';
import { parseCv } from './handlers/parseCv';
import {
  createBictorysCharge,
  createClubCharge,
  createRysmoPackCharge,
  createRysmoSubscriptionCharge,
} from './handlers/payments';
import { reindexSearch } from './handlers/reindexSearch';
import { rysmo } from './handlers/rysmo';
import { spotifyProxy } from './handlers/spotifyProxy';
import { weeklyClubDigestManual } from './handlers/weeklyClubDigestManual';
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
  // Rysmo
  rysmo,
  getRysmoQuota,
  // Lectures et proxies
  spotifyProxy,
  youtubeProxy,
  // Écritures simples
  clearRysmoMemory,
  issueCertificate,
  translateContent,
  parseCv,
  // Administration
  adminCreateUser,
  adminManageRysmoQuota,
  adminManageEnrollment,
  reindexSearch,
  backfillSlugEn,
  weeklyClubDigestManual,
  // Paiement — implémenté, mais volontairement hors de MIGRATED tant que la
  // fenêtre de dual-run avec Bictorys n'est pas calée.
  createBictorysCharge,
  createClubCharge,
  createRysmoPackCharge,
  createRysmoSubscriptionCharge,
  // RGPD
  exportUserData,
  deleteUserAccount,
};
