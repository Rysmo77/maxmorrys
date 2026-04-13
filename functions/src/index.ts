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

// ── SEO ──────────────────────────────────────────────────────────────────
export { sitemap } from './sitemap';
export { prerender } from './prerender';
