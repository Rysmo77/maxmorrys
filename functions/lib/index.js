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
exports.prerender = exports.sitemap = exports.backupFirestore = exports.cleanupTempStorage = exports.courseReminder = exports.streakReminder = exports.onCertificateCreated = exports.onEnrollmentCreated = exports.bictorysWebhook = exports.createBictorysCharge = exports.youtubeProxy = exports.spotifyProxy = exports.adminManageEnrollment = exports.adminCreateUser = exports.rysmo = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// ── AI Chatbot ────────────────────────────────────────────────────────────
var rysmo_1 = require("./rysmo");
Object.defineProperty(exports, "rysmo", { enumerable: true, get: function () { return rysmo_1.rysmo; } });
// ── Admin functions ───────────────────────────────────────────────────────
var admin_1 = require("./admin");
Object.defineProperty(exports, "adminCreateUser", { enumerable: true, get: function () { return admin_1.adminCreateUser; } });
Object.defineProperty(exports, "adminManageEnrollment", { enumerable: true, get: function () { return admin_1.adminManageEnrollment; } });
// ── API Proxies ───────────────────────────────────────────────────────────
var proxy_1 = require("./proxy");
Object.defineProperty(exports, "spotifyProxy", { enumerable: true, get: function () { return proxy_1.spotifyProxy; } });
Object.defineProperty(exports, "youtubeProxy", { enumerable: true, get: function () { return proxy_1.youtubeProxy; } });
// ── Payments ──────────────────────────────────────────────────────────────
var payment_1 = require("./payment");
Object.defineProperty(exports, "createBictorysCharge", { enumerable: true, get: function () { return payment_1.createBictorysCharge; } });
Object.defineProperty(exports, "bictorysWebhook", { enumerable: true, get: function () { return payment_1.bictorysWebhook; } });
// ── Notification triggers ─────────────────────────────────────────────────
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "onEnrollmentCreated", { enumerable: true, get: function () { return notifications_1.onEnrollmentCreated; } });
Object.defineProperty(exports, "onCertificateCreated", { enumerable: true, get: function () { return notifications_1.onCertificateCreated; } });
Object.defineProperty(exports, "streakReminder", { enumerable: true, get: function () { return notifications_1.streakReminder; } });
Object.defineProperty(exports, "courseReminder", { enumerable: true, get: function () { return notifications_1.courseReminder; } });
// ── Maintenance tasks ─────────────────────────────────────────────────────
var maintenance_1 = require("./maintenance");
Object.defineProperty(exports, "cleanupTempStorage", { enumerable: true, get: function () { return maintenance_1.cleanupTempStorage; } });
Object.defineProperty(exports, "backupFirestore", { enumerable: true, get: function () { return maintenance_1.backupFirestore; } });
// ── SEO ──────────────────────────────────────────────────────────────────
var sitemap_1 = require("./sitemap");
Object.defineProperty(exports, "sitemap", { enumerable: true, get: function () { return sitemap_1.sitemap; } });
var prerender_1 = require("./prerender");
Object.defineProperty(exports, "prerender", { enumerable: true, get: function () { return prerender_1.prerender; } });
//# sourceMappingURL=index.js.map