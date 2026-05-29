import * as admin from 'firebase-admin';

admin.initializeApp();

// ── AI Chatbot ────────────────────────────────────────────────────────────
export { rysmo, getRysmoQuota, clearRysmoMemory } from './rysmo';

// ── Admin functions ───────────────────────────────────────────────────────
export { adminCreateUser, adminManageEnrollment, adminManageRysmoQuota } from './admin';

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
export { cleanupTempStorage, backupFirestore } from './maintenance';

// ── Storage cleanup on Firestore delete ───────────────────────────────────
export {
  onBlogDeleted,
  onFormationDeleted,
  onVideoDeleted,
  onPodcastDeleted,
} from './storage-cleanup';

// ── GDPR (user data export + account deletion) ────────────────────────────
export { exportUserData, deleteUserAccount } from './gdpr';

// ── SEO ──────────────────────────────────────────────────────────────────
export { sitemap } from './sitemap';
export { prerender } from './prerender';
export { rss } from './rss';

// ── Marketing feeds ──────────────────────────────────────────────────────
export { catalog } from './catalog';
