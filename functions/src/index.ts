import * as admin from 'firebase-admin';

admin.initializeApp();

// ── AI Chatbot ────────────────────────────────────────────────────────────
export { rysmo } from './rysmo';

// ── Admin functions ───────────────────────────────────────────────────────
export { adminCreateUser, adminManageEnrollment } from './admin';

// ── API Proxies ───────────────────────────────────────────────────────────
export { spotifyProxy, youtubeProxy } from './proxy';

// ── Payments ──────────────────────────────────────────────────────────────
export { createBictorysCharge, createClubCharge, bictorysWebhook } from './payment';

// ── Notification triggers ─────────────────────────────────────────────────
export { onEnrollmentCreated, onCertificateCreated, streakReminder, courseReminder } from './notifications';

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
