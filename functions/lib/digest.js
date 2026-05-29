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
exports.weeklyClubDigestManual = exports.weeklyClubDigest = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const googleAiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
const db = admin.firestore();
/**
 * Builds the weekly Club digest: ranks the week's posts by engagement, asks Gemini
 * for a friendly recap, publishes it as an exclusive info, and notifies active members.
 * Returns the number of members notified (0 if nothing to publish).
 */
async function buildWeeklyDigest(apiKey) {
    var _a, _b, _c;
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const snap = await db.collection('club_posts').where('createdAt', '>=', weekAgo).get();
    if (snap.empty)
        return 0;
    const ranked = snap.docs
        .map((d) => {
        var _a, _b, _c, _d, _e;
        const p = d.data();
        return Object.assign(Object.assign({}, p), { score: ((_b = (_a = p.likes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) + ((_c = p.commentsCount) !== null && _c !== void 0 ? _c : 0) + ((_e = (_d = p.reposts) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0) });
    })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    const transcript = ranked
        .map((p, i) => { var _a, _b; return `${i + 1}. ${(_a = p.userName) !== null && _a !== void 0 ? _a : 'Membre'} (${p.score} interactions) : ${String((_b = p.content) !== null && _b !== void 0 ? _b : '').replace(/\s+/g, ' ').slice(0, 300)}`; })
        .join('\n');
    const prompt = [
        "Tu es l'animateur du Club des Digitos (communauté marketing digital/SEO/IA).",
        "Voici les publications les plus actives de la semaine (classées par interactions) :",
        transcript,
        '',
        "Rédige un récapitulatif hebdomadaire chaleureux et motivant en français.",
        "Renvoie un JSON STRICT : { \"title\": \"titre court et accrocheur\", \"content\": \"corps en markdown : 2-3 temps forts, mentionne les membres actifs, termine par un encouragement à participer. 120-180 mots.\" }",
        "N'invente pas de faits hors des publications fournies.",
    ].join('\n');
    const ai = new genai_1.GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.5, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
    });
    let parsed;
    try {
        parsed = JSON.parse((_a = res.text) !== null && _a !== void 0 ? _a : '{}');
    }
    catch (_d) {
        return 0;
    }
    const title = ((_b = parsed.title) !== null && _b !== void 0 ? _b : '').trim() || 'Le digest de la semaine au Club';
    const content = ((_c = parsed.content) !== null && _c !== void 0 ? _c : '').trim();
    if (!content)
        return 0;
    const now = new Date().toISOString();
    await db.collection('club_infos').add({
        title, content, type: 'article', publishedAt: now, likes: [],
    });
    // Notify active members
    const subs = await db.collection('club_subscriptions').where('status', '==', 'active').get();
    await Promise.all(subs.docs.map((s) => db.collection(`notifications/${s.id}/items`).add({
        userId: s.id,
        type: 'club',
        title: '📰 Digest de la semaine',
        message: title,
        read: false,
        createdAt: now,
        link: '/mon-espace/club',
    })));
    return subs.size;
}
// Weekly, Monday 09:00.
exports.weeklyClubDigest = (0, scheduler_1.onSchedule)({ schedule: '0 9 * * 1', secrets: [googleAiKey] }, async () => { await buildWeeklyDigest(googleAiKey.value()); });
// Admin-triggered manual run (for testing / on-demand publishing).
exports.weeklyClubDigestManual = (0, https_1.onCall)({ region: 'us-central1', secrets: [googleAiKey] }, async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    const caller = await db.doc(`users/${request.auth.uid}`).get();
    if (((_a = caller.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin')
        throw new https_1.HttpsError('permission-denied', 'Réservé aux administrateurs.');
    const notified = await buildWeeklyDigest(googleAiKey.value());
    return { success: true, notified };
});
//# sourceMappingURL=digest.js.map