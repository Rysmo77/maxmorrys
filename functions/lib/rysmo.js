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
exports.rysmo = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const params_1 = require("firebase-functions/params");
const googleAiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
exports.rysmo = (0, https_1.onCall)({ region: 'us-central1', secrets: [googleAiKey] }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise pour utiliser Rysmo.');
    }
    const data = request.data;
    const { message, conversationHistory = [], userContext } = data;
    if (!(message === null || message === void 0 ? void 0 : message.trim())) {
        throw new https_1.HttpsError('invalid-argument', 'Le message ne peut pas être vide.');
    }
    // Rate limiting : max 50 appels par heure par utilisateur (atomic transaction)
    const uid = request.auth.uid;
    const rateLimitRef = admin.firestore().doc(`_ratelimits/rysmo_${uid}`);
    await admin.firestore().runTransaction(async (txn) => {
        var _a;
        const snap = await txn.get(rateLimitRef);
        const data = (_a = snap.data()) !== null && _a !== void 0 ? _a : { calls: [] };
        const windowStart = Date.now() - 60 * 60 * 1000;
        const recentCalls = data.calls.filter((t) => t > windowStart);
        if (recentCalls.length >= 50) {
            throw new https_1.HttpsError('resource-exhausted', 'Limite d\'utilisation atteinte. Réessaie dans une heure.');
        }
        txn.set(rateLimitRef, { calls: [...recentCalls, Date.now()] });
    });
    // Tronquer le message à 2000 caractères
    const safeMessage = message.trim().slice(0, 2000);
    // Garder les 10 derniers messages pour le contexte
    const recentHistory = conversationHistory.slice(-10);
    // Fetch available formations to enrich recommendations
    let courseCatalog = '';
    try {
        const formationsSnap = await admin.firestore()
            .collection('formations')
            .where('status', '==', 'published')
            .get();
        if (!formationsSnap.empty) {
            const courses = formationsSnap.docs.map((d) => {
                var _a;
                const f = d.data();
                const price = (_a = f.promoPrice) !== null && _a !== void 0 ? _a : f.price;
                return `- "${f.title}" (${f.category}, ${f.level}, ${price > 0 ? price + ' FCFA' : 'gratuit'}) → /formations/${f.slug}`;
            });
            courseCatalog = [
                '',
                'Catalogue de formations disponibles sur la plateforme :',
                ...courses,
                '',
                "Quand l'étudiant pose une question sur un sujet couvert par une formation, recommande-lui le cours pertinent avec le lien.",
                "Exemple : « Ce sujet est justement traité dans la formation \"Titre\". Tu peux la consulter ici : /formations/slug »",
            ].join('\n');
        }
    }
    catch (_b) {
        // Non-blocking: continue without catalog
    }
    const systemPrompt = [
        "Tu es Rysmo, l'assistant répétiteur IA de la plateforme Max-Morrys.",
        "Max-Morrys est une plateforme de formation en marketing digital, SEO et intelligence artificielle.",
        "",
        "Ton rôle :",
        "- Tuteur : expliquer les concepts des cours, créer des exercices et des quiz, vérifier la compréhension",
        "- Coach : motiver l'apprenant, proposer des étapes concrètes, suivre la progression",
        "- Guide : recommander les bons cours, articles, podcasts et vidéos de la plateforme",
        "",
        "Directives :",
        "- Réponds TOUJOURS en français",
        "- Sois concis, clair et pédagogique",
        "- Donne des exemples concrets, de préférence liés au contexte africain/sénégalais quand c'est pertinent",
        "- Pour les sujets complexes, décompose en étapes claires",
        "- Encourage l'apprenant, valorise ses efforts",
        "- Ne révèle pas le contenu complet d'un cours — oriente vers la plateforme",
        "- Si tu proposes un quiz, génère 3-5 questions avec les réponses correctes",
        "",
        (userContext === null || userContext === void 0 ? void 0 : userContext.displayName) ? `L'étudiant s'appelle ${userContext.displayName}.` : '',
        ((_a = userContext === null || userContext === void 0 ? void 0 : userContext.enrolledCourses) === null || _a === void 0 ? void 0 : _a.length)
            ? `Cours actuellement suivis : ${userContext.enrolledCourses.join(', ')}.`
            : '',
        courseCatalog,
    ]
        .filter(Boolean)
        .join('\n');
    const apiKey = googleAiKey.value();
    if (!apiKey) {
        console.error('GOOGLE_AI_API_KEY secret is not configured.');
        throw new https_1.HttpsError('internal', 'Le service IA est temporairement indisponible.');
    }
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: systemPrompt,
        });
        const chat = model.startChat({
            history: recentHistory.map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            })),
        });
        const result = await chat.sendMessage(safeMessage);
        const reply = result.response.text();
        return { reply };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Google AI API error:', errMsg);
        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401')) {
            throw new https_1.HttpsError('internal', 'Erreur de configuration du service IA.');
        }
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            throw new https_1.HttpsError('resource-exhausted', 'Trop de requêtes. Réessaie dans un moment.');
        }
        throw new https_1.HttpsError('internal', 'Le service IA est temporairement indisponible.');
    }
});
//# sourceMappingURL=rysmo.js.map