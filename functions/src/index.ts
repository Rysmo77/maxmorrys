import * as admin from 'firebase-admin';

admin.initializeApp();

// ── AI Chatbot ────────────────────────────────────────────────────────────
export { rysmo, getRysmoQuota, clearRysmoMemory } from './rysmo';

// ── Admin functions ───────────────────────────────────────────────────────
export { adminCreateUser, adminManageEnrollment, adminManageRysmoQuota } from './admin';

// ── Recherche (Typesense, gated par secrets) ──────────────────────────────
export { reindexSearch } from './search';

// ── API Proxies ───────────────────────────────────────────────────────────
export { spotifyProxy, youtubeProxy } from './proxy';

// ── Media stats sync (YouTube views + Spotify popularity) ────────────────
export { syncMediaStats, syncMediaStatsManual } from './media-stats';

// ── Auto-import des épisodes podcast depuis l'API Spotify ─────────────────
export { importSpotifyEpisodes, importSpotifyEpisodesManual } from './import-episodes';

// ── Payments ──────────────────────────────────────────────────────────────
export {
  createBictorysCharge,
  createClubCharge,
  createRysmoPackCharge,
  createRysmoSubscriptionCharge,
  bictorysWebhook,
} from './payment';

// ── Notification triggers ─────────────────────────────────────────────────
export { onEnrollmentCreated, onCertificateCreated, streakReminder, courseReminder, rysmoCoachNudge } from './notifications';

// ── Maintenance tasks ─────────────────────────────────────────────────────
export { cleanupTempStorage, backupFirestore, cleanupAgencyQuotes } from './maintenance';

// ── Storage cleanup on Firestore delete ───────────────────────────────────
export {
  onBlogDeleted,
  onFormationDeleted,
  onVideoDeleted,
  onPodcastDeleted,
} from './storage-cleanup';

// ── Certificates (server-side issuance) ───────────────────────────────────
export { issueCertificate, backfillCertificateLookups } from './certificates';

// ── GDPR (user data export + account deletion) ────────────────────────────
export { exportUserData, deleteUserAccount } from './gdpr';

// ── SEO ──────────────────────────────────────────────────────────────────
export { sitemap } from './sitemap';
export { prerender } from './prerender';
export { rss } from './rss';

// ── Marketing feeds ──────────────────────────────────────────────────────
export { catalog } from './catalog';

// ── Créas réseaux sociaux (Satori HTML→PNG, texte parfait) ────────────────
export { renderSocialCard } from './socialCard';

// ── Club leaderboard (public aggregate) ───────────────────────────────────
export { rebuildLeaderboardScheduled, rebuildLeaderboardManual } from './leaderboard';

// ── Parrainage (récompense parrain à la conversion) ───────────────────────
export { onReferralConversion } from './referrals';

// ── Analyse de CV par IA (membres du Club) ────────────────────────────────
export { parseCv } from './cv';

// ── Digest IA hebdomadaire du Club ────────────────────────────────────────
export { weeklyClubDigest, weeklyClubDigestManual } from './digest';

// ── Traduction de contenu à la volée (FR -> EN, cache Firestore) ───────────
export { translateContent } from './translate';

// ── Backfill des slugs anglais (slug_en) pour le SEO ───────────────────────
export { backfillSlugEn } from './backfillSlugEn';
