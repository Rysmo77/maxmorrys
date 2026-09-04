import type { CallContext } from './context';
import { acknowledgeAppointment } from './handlers/acknowledgeAppointment';
import { resendTransactionMail } from './handlers/resendTransactionMail';
import { appClubListe } from './handlers/app/clubListe';
import { appConsole } from './handlers/app/console';
import { appRepetiteur } from './handlers/app/repetiteur';
import { appClubClassement } from './handlers/app/clubClassement';
import { appClubFil } from './handlers/app/clubFil';
import { appClub } from './handlers/app/club';
import { appCertificats } from './handlers/app/certificats';
import { appMedia } from './handlers/app/media';
import { appLecon } from './handlers/app/lecon';
import { appNotes } from './handlers/app/notes';
import { appCours } from './handlers/app/cours';
import { appEspace } from './handlers/app/espace';
import { appMoi } from './handlers/app/moi';
import { adminCreateUser, adminManageEnrollment, adminManageRysmoQuota } from './handlers/admin';
import { backfillSlugEn } from './handlers/backfillSlugEn';
import { clearRysmoMemory } from './handlers/clearRysmoMemory';
import { creerMonProfil } from './handlers/creerMonProfil';
import { deleteUserAccount, exportUserData } from './handlers/gdpr';
import { getRysmoQuota } from './handlers/getRysmoQuota';
import { importSpotifyEpisodesManual } from './handlers/importSpotifyEpisodesManual';
import { issueCertificate } from './handlers/issueCertificate';
import { mediaToken } from './handlers/mediaToken';
import { joinWaitlist } from './handlers/joinWaitlist';
import { notifyOnPublish } from './handlers/notifyOnPublish';
import { notifyWaitlist } from './handlers/notifyWaitlist';
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
  resendTransactionMail,
  clearRysmoMemory,
  creerMonProfil,
  importSpotifyEpisodesManual,
  issueCertificate,
  translateContent,
  parseCv,
  // Administration
  adminCreateUser,
  appCertificats,
  appClub,
  appClubClassement,
  appConsole,
  appRepetiteur,
  appClubFil,
  appClubListe,
  appCours,
  appLecon,
  appMedia,
  appNotes,
  appEspace,
  appMoi,
  adminManageRysmoQuota,
  adminManageEnrollment,
  reindexSearch,
  backfillSlugEn,
  weeklyClubDigestManual,
  // Répond à un message de contact : écrit la réponse, notifie, envoie l'e-mail.
  replyToMessage,
  // Prévient à la publication ceux qui l'ont demandé dans leurs réglages.
  joinWaitlist,
  notifyOnPublish,
  notifyWaitlist,
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
