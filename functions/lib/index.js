"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillSlugEn = exports.translateContent = exports.weeklyClubDigestManual = exports.weeklyClubDigest = exports.parseCv = exports.onReferralConversion = exports.rebuildLeaderboardManual = exports.rebuildLeaderboardScheduled = exports.catalog = exports.rss = exports.prerender = exports.sitemap = exports.deleteUserAccount = exports.exportUserData = exports.issueCertificate = exports.onPodcastDeleted = exports.onVideoDeleted = exports.onFormationDeleted = exports.onBlogDeleted = exports.backupFirestore = exports.cleanupTempStorage = exports.rysmoCoachNudge = exports.courseReminder = exports.streakReminder = exports.onCertificateCreated = exports.onEnrollmentCreated = exports.bictorysWebhook = exports.createRysmoSubscriptionCharge = exports.createRysmoPackCharge = exports.createClubCharge = exports.createBictorysCharge = exports.importSpotifyEpisodesManual = exports.importSpotifyEpisodes = exports.syncMediaStatsManual = exports.syncMediaStats = exports.youtubeProxy = exports.spotifyProxy = exports.reindexSearch = exports.adminManageRysmoQuota = exports.adminManageEnrollment = exports.adminCreateUser = exports.clearRysmoMemory = exports.getRysmoQuota = exports.rysmo = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// ── AI Chatbot ────────────────────────────────────────────────────────────
var rysmo_1 = require("./rysmo");
Object.defineProperty(exports, "rysmo", { enumerable: true, get: function () { return rysmo_1.rysmo; } });
Object.defineProperty(exports, "getRysmoQuota", { enumerable: true, get: function () { return rysmo_1.getRysmoQuota; } });
Object.defineProperty(exports, "clearRysmoMemory", { enumerable: true, get: function () { return rysmo_1.clearRysmoMemory; } });
// ── Admin functions ───────────────────────────────────────────────────────
var admin_1 = require("./admin");
Object.defineProperty(exports, "adminCreateUser", { enumerable: true, get: function () { return admin_1.adminCreateUser; } });
Object.defineProperty(exports, "adminManageEnrollment", { enumerable: true, get: function () { return admin_1.adminManageEnrollment; } });
Object.defineProperty(exports, "adminManageRysmoQuota", { enumerable: true, get: function () { return admin_1.adminManageRysmoQuota; } });
// ── Recherche (Meilisearch, gated par secrets) ────────────────────────────
var search_1 = require("./search");
Object.defineProperty(exports, "reindexSearch", { enumerable: true, get: function () { return search_1.reindexSearch; } });
// ── API Proxies ───────────────────────────────────────────────────────────
var proxy_1 = require("./proxy");
Object.defineProperty(exports, "spotifyProxy", { enumerable: true, get: function () { return proxy_1.spotifyProxy; } });
Object.defineProperty(exports, "youtubeProxy", { enumerable: true, get: function () { return proxy_1.youtubeProxy; } });
// ── Media stats sync (YouTube views + Spotify popularity) ────────────────
var media_stats_1 = require("./media-stats");
Object.defineProperty(exports, "syncMediaStats", { enumerable: true, get: function () { return media_stats_1.syncMediaStats; } });
Object.defineProperty(exports, "syncMediaStatsManual", { enumerable: true, get: function () { return media_stats_1.syncMediaStatsManual; } });
// ── Auto-import des épisodes podcast depuis l'API Spotify ─────────────────
var import_episodes_1 = require("./import-episodes");
Object.defineProperty(exports, "importSpotifyEpisodes", { enumerable: true, get: function () { return import_episodes_1.importSpotifyEpisodes; } });
Object.defineProperty(exports, "importSpotifyEpisodesManual", { enumerable: true, get: function () { return import_episodes_1.importSpotifyEpisodesManual; } });
// ── Payments ──────────────────────────────────────────────────────────────
var payment_1 = require("./payment");
Object.defineProperty(exports, "createBictorysCharge", { enumerable: true, get: function () { return payment_1.createBictorysCharge; } });
Object.defineProperty(exports, "createClubCharge", { enumerable: true, get: function () { return payment_1.createClubCharge; } });
Object.defineProperty(exports, "createRysmoPackCharge", { enumerable: true, get: function () { return payment_1.createRysmoPackCharge; } });
Object.defineProperty(exports, "createRysmoSubscriptionCharge", { enumerable: true, get: function () { return payment_1.createRysmoSubscriptionCharge; } });
Object.defineProperty(exports, "bictorysWebhook", { enumerable: true, get: function () { return payment_1.bictorysWebhook; } });
// ── Notification triggers ─────────────────────────────────────────────────
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "onEnrollmentCreated", { enumerable: true, get: function () { return notifications_1.onEnrollmentCreated; } });
Object.defineProperty(exports, "onCertificateCreated", { enumerable: true, get: function () { return notifications_1.onCertificateCreated; } });
Object.defineProperty(exports, "streakReminder", { enumerable: true, get: function () { return notifications_1.streakReminder; } });
Object.defineProperty(exports, "courseReminder", { enumerable: true, get: function () { return notifications_1.courseReminder; } });
Object.defineProperty(exports, "rysmoCoachNudge", { enumerable: true, get: function () { return notifications_1.rysmoCoachNudge; } });
// ── Maintenance tasks ─────────────────────────────────────────────────────
var maintenance_1 = require("./maintenance");
Object.defineProperty(exports, "cleanupTempStorage", { enumerable: true, get: function () { return maintenance_1.cleanupTempStorage; } });
Object.defineProperty(exports, "backupFirestore", { enumerable: true, get: function () { return maintenance_1.backupFirestore; } });
// ── Storage cleanup on Firestore delete ───────────────────────────────────
var storage_cleanup_1 = require("./storage-cleanup");
Object.defineProperty(exports, "onBlogDeleted", { enumerable: true, get: function () { return storage_cleanup_1.onBlogDeleted; } });
Object.defineProperty(exports, "onFormationDeleted", { enumerable: true, get: function () { return storage_cleanup_1.onFormationDeleted; } });
Object.defineProperty(exports, "onVideoDeleted", { enumerable: true, get: function () { return storage_cleanup_1.onVideoDeleted; } });
Object.defineProperty(exports, "onPodcastDeleted", { enumerable: true, get: function () { return storage_cleanup_1.onPodcastDeleted; } });
// ── Certificates (server-side issuance) ───────────────────────────────────
var certificates_1 = require("./certificates");
Object.defineProperty(exports, "issueCertificate", { enumerable: true, get: function () { return certificates_1.issueCertificate; } });
// ── GDPR (user data export + account deletion) ────────────────────────────
var gdpr_1 = require("./gdpr");
Object.defineProperty(exports, "exportUserData", { enumerable: true, get: function () { return gdpr_1.exportUserData; } });
Object.defineProperty(exports, "deleteUserAccount", { enumerable: true, get: function () { return gdpr_1.deleteUserAccount; } });
// ── SEO ──────────────────────────────────────────────────────────────────
var sitemap_1 = require("./sitemap");
Object.defineProperty(exports, "sitemap", { enumerable: true, get: function () { return sitemap_1.sitemap; } });
var prerender_1 = require("./prerender");
Object.defineProperty(exports, "prerender", { enumerable: true, get: function () { return prerender_1.prerender; } });
var rss_1 = require("./rss");
Object.defineProperty(exports, "rss", { enumerable: true, get: function () { return rss_1.rss; } });
// ── Marketing feeds ──────────────────────────────────────────────────────
var catalog_1 = require("./catalog");
Object.defineProperty(exports, "catalog", { enumerable: true, get: function () { return catalog_1.catalog; } });
// ── Club leaderboard (public aggregate) ───────────────────────────────────
var leaderboard_1 = require("./leaderboard");
Object.defineProperty(exports, "rebuildLeaderboardScheduled", { enumerable: true, get: function () { return leaderboard_1.rebuildLeaderboardScheduled; } });
Object.defineProperty(exports, "rebuildLeaderboardManual", { enumerable: true, get: function () { return leaderboard_1.rebuildLeaderboardManual; } });
// ── Parrainage (récompense parrain à la conversion) ───────────────────────
var referrals_1 = require("./referrals");
Object.defineProperty(exports, "onReferralConversion", { enumerable: true, get: function () { return referrals_1.onReferralConversion; } });
// ── Analyse de CV par IA (membres du Club) ────────────────────────────────
var cv_1 = require("./cv");
Object.defineProperty(exports, "parseCv", { enumerable: true, get: function () { return cv_1.parseCv; } });
// ── Digest IA hebdomadaire du Club ────────────────────────────────────────
var digest_1 = require("./digest");
Object.defineProperty(exports, "weeklyClubDigest", { enumerable: true, get: function () { return digest_1.weeklyClubDigest; } });
Object.defineProperty(exports, "weeklyClubDigestManual", { enumerable: true, get: function () { return digest_1.weeklyClubDigestManual; } });
// ── Traduction de contenu à la volée (FR -> EN, cache Firestore) ───────────
var translate_1 = require("./translate");
Object.defineProperty(exports, "translateContent", { enumerable: true, get: function () { return translate_1.translateContent; } });
// ── Backfill des slugs anglais (slug_en) pour le SEO ───────────────────────
var backfillSlugEn_1 = require("./backfillSlugEn");
Object.defineProperty(exports, "backfillSlugEn", { enumerable: true, get: function () { return backfillSlugEn_1.backfillSlugEn; } });
//# sourceMappingURL=index.js.map