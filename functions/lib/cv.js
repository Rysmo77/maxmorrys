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
exports.parseCv = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
const googleAiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
const DAILY_LIMIT = 5;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB CV
async function hasActiveClubSub(uid) {
    const snap = await admin.firestore().doc(`club_subscriptions/${uid}`).get();
    const d = snap.data();
    return !!d && d.status === 'active' && new Date(d.expiresAt) > new Date();
}
/**
 * Parses a student's CV (PDF) with Gemini and returns structured profile fields.
 * Club-members-only, capped at DAILY_LIMIT runs/day to control AI cost.
 */
exports.parseCv = (0, https_1.onCall)({ region: 'us-central1', secrets: [googleAiKey] }, async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    const uid = request.auth.uid;
    if (!(await hasActiveClubSub(uid))) {
        throw new https_1.HttpsError('permission-denied', "L'analyse de CV est réservée aux membres du Club.");
    }
    const { fileBase64, mimeType } = request.data;
    if (!fileBase64 || !mimeType)
        throw new https_1.HttpsError('invalid-argument', 'Fichier manquant.');
    if (!/^application\/pdf$/.test(mimeType))
        throw new https_1.HttpsError('invalid-argument', 'Seuls les PDF sont acceptés.');
    if (fileBase64.length * 0.75 > MAX_BYTES)
        throw new https_1.HttpsError('invalid-argument', 'CV trop lourd (max 8 Mo).');
    // Daily rate limit
    const rlRef = admin.firestore().doc(`_ratelimits/cv_${uid}`);
    const today = new Date().toISOString().slice(0, 10);
    await admin.firestore().runTransaction(async (t) => {
        var _a;
        const snap = await t.get(rlRef);
        const data = snap.data();
        const count = (data === null || data === void 0 ? void 0 : data.date) === today ? ((_a = data.count) !== null && _a !== void 0 ? _a : 0) : 0;
        if (count >= DAILY_LIMIT) {
            throw new https_1.HttpsError('resource-exhausted', `Limite atteinte (${DAILY_LIMIT} analyses/jour). Réessaie demain.`);
        }
        t.set(rlRef, { date: today, count: count + 1 }, { merge: true });
    });
    const apiKey = googleAiKey.value();
    if (!apiKey)
        throw new https_1.HttpsError('internal', 'Service IA non configuré.');
    const prompt = [
        "Tu analyses le CV ci-joint d'un professionnel du marketing digital.",
        'Renvoie un JSON STRICT (valeurs vides "" si absentes) avec EXACTEMENT ces clés :',
        '{ "headline": "titre pro court", "skills": ["compétences clés, max 8"], "city": "ville", "linkedin": "URL", "website": "URL", "facebook": "URL", "instagram": "URL ou @", "twitter": "URL ou @", "tiktok": "URL ou @", "youtube": "URL" }',
        "N'invente rien : laisse vide si l'info n'est pas explicitement dans le CV.",
    ].join('\n');
    try {
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: fileBase64 } }, { text: prompt }] }],
            config: { temperature: 0.2, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
        });
        const parsed = JSON.parse((_a = res.text) !== null && _a !== void 0 ? _a : '{}');
        return {
            headline: typeof parsed.headline === 'string' ? parsed.headline : '',
            skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 8).map(String) : [],
            city: typeof parsed.city === 'string' ? parsed.city : '',
            linkedin: typeof parsed.linkedin === 'string' ? parsed.linkedin : '',
            website: typeof parsed.website === 'string' ? parsed.website : '',
            facebook: typeof parsed.facebook === 'string' ? parsed.facebook : '',
            instagram: typeof parsed.instagram === 'string' ? parsed.instagram : '',
            twitter: typeof parsed.twitter === 'string' ? parsed.twitter : '',
            tiktok: typeof parsed.tiktok === 'string' ? parsed.tiktok : '',
            youtube: typeof parsed.youtube === 'string' ? parsed.youtube : '',
        };
    }
    catch (error) {
        console.error('parseCv failed:', error instanceof Error ? error.message : error);
        throw new https_1.HttpsError('internal', "Échec de l'analyse du CV. Réessaie.");
    }
});
//# sourceMappingURL=cv.js.map