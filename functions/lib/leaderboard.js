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
exports.rebuildLeaderboardManual = exports.rebuildLeaderboardScheduled = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const TOP_N = 20;
/**
 * Rebuilds the public leaderboard aggregate at `leaderboard/global`.
 * Reads gamification + users via the Admin SDK (bypasses client rules that
 * forbid reading other members' profiles), then writes a denormalized,
 * signed-in-readable top list. Keeps individual gamification docs private.
 */
async function rebuildLeaderboard() {
    var _a, _b, _c;
    const snap = await db.collection('gamification').orderBy('xp', 'desc').limit(TOP_N).get();
    const entries = [];
    let rank = 1;
    for (const d of snap.docs) {
        const g = d.data();
        const userSnap = await db.collection('users').doc(d.id).get();
        const u = (_a = userSnap.data()) !== null && _a !== void 0 ? _a : {};
        entries.push({
            userId: d.id,
            displayName: u.displayName || (u.email ? String(u.email).split('@')[0] : 'Membre'),
            photoURL: u.photoURL || '',
            xp: (_b = g.xp) !== null && _b !== void 0 ? _b : 0,
            level: (_c = g.level) !== null && _c !== void 0 ? _c : 1,
            rank: rank++,
        });
    }
    // Active member count for public social proof (kept in the same public doc,
    // since club_subscriptions itself is admin-read-only).
    let activeMembers = 0;
    try {
        const countSnap = await db.collection('club_subscriptions').where('status', '==', 'active').count().get();
        activeMembers = countSnap.data().count;
    }
    catch (_d) {
        activeMembers = entries.length;
    }
    await db.doc('leaderboard/global').set({
        entries,
        activeMembers,
        updatedAt: new Date().toISOString(),
    });
    return entries.length;
}
// Scheduled rebuild every 30 minutes.
exports.rebuildLeaderboardScheduled = (0, scheduler_1.onSchedule)('*/30 * * * *', async () => {
    await rebuildLeaderboard();
});
// Admin-triggered manual rebuild (for seeding / immediate refresh).
exports.rebuildLeaderboardManual = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    const callerDoc = await db.doc(`users/${request.auth.uid}`).get();
    if (((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Réservé aux administrateurs.');
    }
    const count = await rebuildLeaderboard();
    return { success: true, count };
});
//# sourceMappingURL=leaderboard.js.map