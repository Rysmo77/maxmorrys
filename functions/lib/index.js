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
exports.bictorysWebhook = exports.createBictorysCharge = exports.youtubeProxy = exports.spotifyProxy = exports.adminManageEnrollment = exports.adminCreateUser = exports.rysmo = exports.courseReminder = exports.streakReminder = exports.onCertificateCreated = exports.onEnrollmentCreated = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
// ── Notification triggers ──────────────────────────────────────────────────
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "onEnrollmentCreated", { enumerable: true, get: function () { return notifications_1.onEnrollmentCreated; } });
Object.defineProperty(exports, "onCertificateCreated", { enumerable: true, get: function () { return notifications_1.onCertificateCreated; } });
Object.defineProperty(exports, "streakReminder", { enumerable: true, get: function () { return notifications_1.streakReminder; } });
Object.defineProperty(exports, "courseReminder", { enumerable: true, get: function () { return notifications_1.courseReminder; } });
const googleAiKey = (0, params_1.defineSecret)('GOOGLE_AI_API_KEY');
const spotifyClientId = (0, params_1.defineSecret)('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = (0, params_1.defineSecret)('SPOTIFY_CLIENT_SECRET');
const youtubeApiKey = (0, params_1.defineSecret)('YOUTUBE_API_KEY');
const bictorysApiKey = (0, params_1.defineSecret)('BICTORYS_API_KEY');
exports.rysmo = (0, https_1.onCall)({ region: 'us-central1', secrets: [googleAiKey] }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise pour utiliser Rysmo.');
    }
    const data = request.data;
    const { message, conversationHistory = [], userContext } = data;
    if (!(message === null || message === void 0 ? void 0 : message.trim())) {
        throw new https_1.HttpsError('invalid-argument', 'Le message ne peut pas être vide.');
    }
    // Rate limiting : max 50 appels par heure par utilisateur
    const uid = request.auth.uid;
    const windowStart = Date.now() - 60 * 60 * 1000; // 1 heure
    const rateLimitRef = admin.firestore().doc(`_ratelimits/rysmo_${uid}`);
    const rateLimitSnap = await rateLimitRef.get();
    const rateLimitData = (_a = rateLimitSnap.data()) !== null && _a !== void 0 ? _a : { calls: [] };
    const recentCalls = rateLimitData.calls.filter((t) => t > windowStart);
    if (recentCalls.length >= 50) {
        throw new https_1.HttpsError('resource-exhausted', 'Limite d\'utilisation atteinte. Réessaie dans une heure.');
    }
    await rateLimitRef.set({ calls: [...recentCalls, Date.now()] });
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
        ((_b = userContext === null || userContext === void 0 ? void 0 : userContext.enrolledCourses) === null || _b === void 0 ? void 0 : _b.length)
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
    const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_RE.test(email.trim())) {
        throw new https_1.HttpsError('invalid-argument', 'Format d\'email invalide.');
    }
    if (password.length < 8) {
        throw new https_1.HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 8 caractères.');
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
// ── Spotify Proxy (admin-only) ──────────────────────────────────────────────
exports.spotifyProxy = (0, https_1.onCall)({ region: 'us-central1', secrets: [spotifyClientId, spotifyClientSecret] }, async (request) => {
    var _a, _b, _c, _d;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { episodeId } = request.data;
    if (!episodeId || typeof episodeId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'episodeId est obligatoire.');
    }
    const clientId = spotifyClientId.value();
    const clientSecret = spotifyClientSecret.value();
    if (!clientId || !clientSecret) {
        throw new https_1.HttpsError('internal', 'Identifiants Spotify non configurés.');
    }
    try {
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            throw new https_1.HttpsError('internal', "Erreur d'authentification Spotify.");
        }
        const epRes = await fetch(`https://api.spotify.com/v1/episodes/${episodeId}?market=FR`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const ep = await epRes.json();
        if (ep.error) {
            throw new https_1.HttpsError('not-found', `Erreur Spotify : ${ep.error.message}`);
        }
        return {
            name: ep.name,
            description: ep.description,
            coverImage: (_d = (_c = (_b = ep.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) !== null && _d !== void 0 ? _d : '',
            durationMs: ep.duration_ms,
            releaseDate: ep.release_date,
        };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Impossible de récupérer les infos Spotify.');
    }
});
// ── YouTube Proxy (admin-only) ──────────────────────────────────────────────
exports.youtubeProxy = (0, https_1.onCall)({ region: 'us-central1', secrets: [youtubeApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }
    const { videoId } = request.data;
    if (!videoId || typeof videoId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'videoId est obligatoire.');
    }
    const apiKey = youtubeApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Clé API YouTube non configurée.');
    }
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=snippet,contentDetails,statistics&key=${apiKey}`);
        const data = await res.json();
        if (data.error) {
            throw new https_1.HttpsError('internal', `Erreur API YouTube : ${data.error.message}`);
        }
        const item = (_b = data.items) === null || _b === void 0 ? void 0 : _b[0];
        if (!item) {
            throw new https_1.HttpsError('not-found', 'Vidéo YouTube introuvable ou privée.');
        }
        return {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: (_h = (_f = (_d = (_c = item.snippet.thumbnails.maxres) === null || _c === void 0 ? void 0 : _c.url) !== null && _d !== void 0 ? _d : (_e = item.snippet.thumbnails.high) === null || _e === void 0 ? void 0 : _e.url) !== null && _f !== void 0 ? _f : (_g = item.snippet.thumbnails.medium) === null || _g === void 0 ? void 0 : _g.url) !== null && _h !== void 0 ? _h : '',
            duration: item.contentDetails.duration,
            publishedAt: item.snippet.publishedAt,
            viewCount: (_k = (_j = item.statistics) === null || _j === void 0 ? void 0 : _j.viewCount) !== null && _k !== void 0 ? _k : '0',
        };
    }
    catch (error) {
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Impossible de récupérer les infos YouTube.');
    }
});
// ── Bictorys Payment ──────────────────────────────────────────────────────
const BICTORYS_API_URL = 'https://api.test.bictorys.com/pay/v1/charges';
exports.createBictorysCharge = (0, https_1.onCall)({ region: 'us-central1', secrets: [bictorysApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { formationId, formationSlug } = request.data;
    if (!formationId || !formationSlug) {
        throw new https_1.HttpsError('invalid-argument', 'formationId et formationSlug sont obligatoires.');
    }
    // Read formation from Firestore for canonical price
    const formationDoc = await admin.firestore().doc(`formations/${formationId}`).get();
    if (!formationDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Formation introuvable.');
    }
    const formation = formationDoc.data();
    const finalPrice = (_a = formation.promoPrice) !== null && _a !== void 0 ? _a : formation.price;
    if (finalPrice <= 0) {
        throw new https_1.HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
    }
    // Get user info
    const uid = request.auth.uid;
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();
    // Check if already enrolled
    const enrollmentId = `${uid}_${formationId}`;
    const existingEnrollment = await admin.firestore().doc(`enrollments/${enrollmentId}`).get();
    if (existingEnrollment.exists) {
        throw new https_1.HttpsError('already-exists', 'Tu es déjà inscrit à cette formation.');
    }
    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('internal', 'Service de paiement non configuré.');
    }
    let bictorysResponse;
    try {
        const res = await fetch(BICTORYS_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({ amount: finalPrice, currency: 'XOF' }),
        });
        if (!res.ok) {
            const errBody = await res.text();
            console.error('Bictorys API error:', res.status, errBody);
            throw new Error(`Bictorys returned ${res.status}`);
        }
        bictorysResponse = await res.json();
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Bictorys charge creation failed:', errMsg);
        throw new https_1.HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }
    // Create transaction record server-side
    const txnRef = admin.firestore().collection('transactions').doc();
    await txnRef.set({
        id: txnRef.id,
        userId: uid,
        userEmail: (_c = (_b = request.auth.token.email) !== null && _b !== void 0 ? _b : userData === null || userData === void 0 ? void 0 : userData.email) !== null && _c !== void 0 ? _c : '',
        userName: (_e = (_d = userData === null || userData === void 0 ? void 0 : userData.displayName) !== null && _d !== void 0 ? _d : request.auth.token.name) !== null && _e !== void 0 ? _e : '',
        formationId,
        formationSlug,
        formationTitle: (_f = formation.title) !== null && _f !== void 0 ? _f : '',
        amount: finalPrice,
        currency: 'XOF',
        status: 'pending',
        paymentMethod: 'bictorys',
        chargeId: bictorysResponse.chargeId,
        opToken: bictorysResponse.opToken,
        createdAt: new Date().toISOString(),
    });
    return {
        checkoutUrl: bictorysResponse.link,
        transactionId: txnRef.id,
    };
});
exports.bictorysWebhook = (0, https_1.onRequest)({ region: 'us-central1' }, async (req, res) => {
    var _a;
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const body = req.body;
    const chargeId = (_a = body === null || body === void 0 ? void 0 : body.chargeId) !== null && _a !== void 0 ? _a : body === null || body === void 0 ? void 0 : body.charge_id;
    const status = body === null || body === void 0 ? void 0 : body.status;
    if (!chargeId) {
        console.warn('Bictorys webhook: missing chargeId', body);
        res.status(200).send('OK');
        return;
    }
    // Find the pending transaction matching this chargeId
    const txnQuery = await admin.firestore()
        .collection('transactions')
        .where('chargeId', '==', chargeId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
    if (txnQuery.empty) {
        // Already processed or unknown — acknowledge to prevent retries
        console.log('Bictorys webhook: no pending transaction for chargeId', chargeId);
        res.status(200).send('OK');
        return;
    }
    const txnDoc = txnQuery.docs[0];
    const txnData = txnDoc.data();
    const isSuccess = status === 'succeeded' || status === 'completed' || status === 'successful';
    const isFailed = status === 'failed' || status === 'expired' || status === 'cancelled';
    if (isSuccess) {
        // Mark transaction as completed
        await txnDoc.ref.update({
            status: 'completed',
            completedAt: new Date().toISOString(),
        });
        // Auto-create enrollment
        const enrollmentId = `${txnData.userId}_${txnData.formationId}`;
        const enrollmentRef = admin.firestore().doc(`enrollments/${enrollmentId}`);
        const existing = await enrollmentRef.get();
        if (!existing.exists) {
            await enrollmentRef.set({
                id: enrollmentId,
                userId: txnData.userId,
                formationId: txnData.formationId,
                enrolledAt: new Date().toISOString(),
                progress: 0,
                completedLessons: [],
                certificateIssued: false,
            });
        }
        console.log('Bictorys webhook: payment succeeded, enrollment created for', enrollmentId);
    }
    else if (isFailed) {
        await txnDoc.ref.update({
            status: 'failed',
        });
        console.log('Bictorys webhook: payment failed for chargeId', chargeId);
    }
    else {
        console.log('Bictorys webhook: unhandled status', status, 'for chargeId', chargeId);
    }
    res.status(200).send('OK');
});
//# sourceMappingURL=index.js.map