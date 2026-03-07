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
exports.adminManageEnrollment = exports.adminCreateUser = exports.rysmo = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
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
    // Tronquer le message à 2000 caractères
    const safeMessage = message.trim().slice(0, 2000);
    // Garder les 10 derniers messages pour le contexte
    const recentHistory = conversationHistory.slice(-10);
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
exports.adminCreateUser = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    // Verify caller is admin
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { email, password, displayName, firstName, lastName, phone, role } = request.data;
    if (!email || !password || !displayName) {
        throw new https_1.HttpsError('invalid-argument', 'Email, mot de passe et nom sont obligatoires.');
    }
    if (password.length < 6) {
        throw new https_1.HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 6 caractères.');
    }
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    // Create Firestore document
    const newUser = {
        uid: userRecord.uid,
        email,
        displayName,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        role: role || 'student',
        createdAt: new Date().toISOString(),
        preferences: { theme: 'system', language: 'fr', newsletter: false },
    };
    await admin.firestore().doc(`users/${userRecord.uid}`).set(newUser);
    return { uid: userRecord.uid, success: true };
});
exports.adminManageEnrollment = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { action, userId, formationId } = request.data;
    if (!userId || !formationId) {
        throw new https_1.HttpsError('invalid-argument', 'userId et formationId sont obligatoires.');
    }
    const enrollmentId = `${userId}_${formationId}`;
    const enrollmentRef = admin.firestore().doc(`enrollments/${enrollmentId}`);
    if (action === 'create') {
        const existing = await enrollmentRef.get();
        if (existing.exists) {
            throw new https_1.HttpsError('already-exists', 'Cet utilisateur est déjà inscrit à cette formation.');
        }
        await enrollmentRef.set({
            id: enrollmentId,
            userId,
            formationId,
            enrolledAt: new Date().toISOString(),
            progress: 0,
            completedLessons: [],
            certificateIssued: false,
        });
        return { success: true, enrollmentId };
    }
    else if (action === 'delete') {
        await enrollmentRef.delete();
        return { success: true };
    }
    else {
        throw new https_1.HttpsError('invalid-argument', 'Action invalide. Utilisez "create" ou "delete".');
    }
});
//# sourceMappingURL=index.js.map