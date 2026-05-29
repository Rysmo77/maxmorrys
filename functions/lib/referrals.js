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
exports.onReferralConversion = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const REFERRER_XP = 100;
function levelFromXp(xp) {
    const t = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    let lvl = 1;
    for (let i = 0; i < t.length; i++)
        if (xp >= t[i])
            lvl = i + 1;
    return Math.min(lvl, 10);
}
/**
 * Rewards a referrer when their referee's Club subscription becomes active.
 * Idempotent via `referralRewarded` on the referee user doc.
 */
exports.onReferralConversion = (0, firestore_1.onDocumentWritten)('club_subscriptions/{uid}', async (event) => {
    var _a, _b, _c;
    const after = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    const before = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
    if (!after || after.status !== 'active')
        return;
    if (before && before.status === 'active')
        return; // was already active
    const refereeId = event.params.uid;
    const userRef = db.doc(`users/${refereeId}`);
    const userSnap = await userRef.get();
    const u = userSnap.data();
    if (!(u === null || u === void 0 ? void 0 : u.referredByCode) || u.referralRewarded)
        return;
    const refSnap = await db.collection('users').where('referralCode', '==', u.referredByCode).limit(1).get();
    if (refSnap.empty)
        return;
    const referrerId = refSnap.docs[0].id;
    if (referrerId === refereeId)
        return;
    // Award referrer: XP + Ambassadeur badge
    const gamRef = db.doc(`gamification/${referrerId}`);
    await db.runTransaction(async (t) => {
        var _a, _b;
        const g = await t.get(gamRef);
        const data = g.exists ? g.data() : { xp: 0, level: 1, currentStreak: 0, longestStreak: 0, lastActiveDate: '', badges: [] };
        const newXp = ((_a = data.xp) !== null && _a !== void 0 ? _a : 0) + REFERRER_XP;
        const badges = (_b = data.badges) !== null && _b !== void 0 ? _b : [];
        if (!badges.includes('ambassadeur'))
            badges.push('ambassadeur');
        t.set(gamRef, Object.assign(Object.assign({}, data), { xp: newXp, level: levelFromXp(newXp), badges }), { merge: true });
    });
    // Record the conversion + mark referee rewarded (prevents double reward)
    await db.collection('referrals').add({
        referrerId,
        refereeId,
        refereeName: (_c = u.displayName) !== null && _c !== void 0 ? _c : '',
        status: 'converted',
        createdAt: new Date().toISOString(),
    });
    await userRef.update({ referralRewarded: true });
});
//# sourceMappingURL=referrals.js.map