import type { CallContext } from './context';
import { acknowledgeAppointment } from './handlers/acknowledgeAppointment';
import { adminCreateUser, adminManageEnrollment, adminManageRysmoQuota } from './handlers/admin';
import { backfillSlugEn } from './handlers/backfillSlugEn';
import { clearRysmoMemory } from './handlers/clearRysmoMemory';
import { deleteUserAccount, exportUserData } from './handlers/gdpr';
import { getRysmoQuota } from './handlers/getRysmoQuota';
import { importSpotifyEpisodesManual } from './handlers/importSpotifyEpisodesManual';
import { issueCertificate } from './handlers/issueCertificate';
import { mediaToken } from './handlers/mediaToken';
import { notifyOnPublish } from './handlers/notifyOnPublish';
import { parseCv } from './handlers/parseCv';
import { popupEvent } from './handlers/popupEvent';
import {
  createBictorysCharge,
  createClubCharge,
  createRysmoPackCharge,
  createRysmoSubscriptionCharge,
} from './handlers/payments';
import { quoteCheckout } from './handlers/quoteCheckout';
import { reindexSearch } from './handlers/reindexSearch';
import { replyToMessage } from './handlers/replyToMessage';
import { rysmo } from './handlers/rysmo';
import { spotifyProxy } from './handlers/spotifyProxy';
import { syncMediaStatsManual } from './handlers/syncMediaStatsManual';
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
  syncMediaStatsManual,
  youtubeProxy,
  // Écritures simples
  acknowledgeAppointment,
  clearRysmoMemory,
  importSpotifyEpisodesManual,
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
  // Répond à un message de contact : écrit la réponse, notifie, envoie l'e-mail.
  replyToMessage,
  // Prévient à la publication ceux qui l'ont demandé dans leurs réglages.
  notifyOnPublish,
  // Paiement — implémenté, mais volontairement hors de MIGRATED tant que la
  // fenêtre de dual-run avec Bictorys n'est pas calée.
  // Devis : le MÊME calcul que la charge, pour que l'écran et le débit ne divergent pas.
  quoteCheckout,
  createBictorysCharge,
  createClubCharge,
  createRysmoPackCharge,
  createRysmoSubscriptionCharge,
  // RGPD
  exportUserData,
  deleteUserAccount,
  // Mesure — compteurs agrégés, sans donnée personnelle
  popupEvent,
  // Accès aux médias protégés
  mediaToken,
};
