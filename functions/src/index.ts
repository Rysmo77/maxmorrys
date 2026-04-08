import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

// ── Notification triggers ──────────────────────────────────────────────────
export { onEnrollmentCreated, onCertificateCreated, streakReminder, courseReminder } from './notifications';

const googleAiKey = defineSecret('GOOGLE_AI_API_KEY');
const spotifyClientId = defineSecret('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = defineSecret('SPOTIFY_CLIENT_SECRET');
const youtubeApiKey = defineSecret('YOUTUBE_API_KEY');
const bictorysApiKey = defineSecret('BICTORYS_API_KEY');

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RysmoRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
  userContext?: {
    displayName?: string;
    enrolledCourses?: string[];
  };
}

export const rysmo = onCall(
  { region: 'us-central1', secrets: [googleAiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise pour utiliser Rysmo.');
    }

    const data = request.data as RysmoRequest;
    const { message, conversationHistory = [], userContext } = data;

    if (!message?.trim()) {
      throw new HttpsError('invalid-argument', 'Le message ne peut pas être vide.');
    }

    // Rate limiting : max 50 appels par heure par utilisateur
    const uid = request.auth.uid;
    const windowStart = Date.now() - 60 * 60 * 1000; // 1 heure
    const rateLimitRef = admin.firestore().doc(`_ratelimits/rysmo_${uid}`);
    const rateLimitSnap = await rateLimitRef.get();
    const rateLimitData = rateLimitSnap.data() ?? { calls: [] as number[] };
    const recentCalls: number[] = (rateLimitData.calls as number[]).filter((t) => t > windowStart);
    if (recentCalls.length >= 50) {
      throw new HttpsError('resource-exhausted', 'Limite d\'utilisation atteinte. Réessaie dans une heure.');
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
      userContext?.displayName ? `L'étudiant s'appelle ${userContext.displayName}.` : '',
      userContext?.enrolledCourses?.length
        ? `Cours actuellement suivis : ${userContext.enrolledCourses.join(', ')}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const apiKey = googleAiKey.value();
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY secret is not configured.');
      throw new HttpsError('internal', 'Le service IA est temporairement indisponible.');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Google AI API error:', errMsg);

      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401')) {
        throw new HttpsError('internal', 'Erreur de configuration du service IA.');
      }
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', 'Trop de requêtes. Réessaie dans un moment.');
      }
      throw new HttpsError('internal', 'Le service IA est temporairement indisponible.');
    }
  }
);

export const adminCreateUser = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    // Verify caller is admin
    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { email, password, displayName, firstName, lastName, phone, role } = request.data as {
      email: string;
      password: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
    };

    if (!email || !password || !displayName) {
      throw new HttpsError('invalid-argument', 'Email, mot de passe et nom sont obligatoires.');
    }
    const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_RE.test(email.trim())) {
      throw new HttpsError('invalid-argument', 'Format d\'email invalide.');
    }
    if (password.length < 8) {
      throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 8 caractères.');
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
      role: (role as 'student' | 'admin' | 'support') || 'student',
      createdAt: new Date().toISOString(),
      preferences: { theme: 'system', language: 'fr', newsletter: false },
    };
    await admin.firestore().doc(`users/${userRecord.uid}`).set(newUser);

    return { uid: userRecord.uid, success: true };
  }
);

export const adminManageEnrollment = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { action, userId, formationId } = request.data as {
      action: 'create' | 'delete';
      userId: string;
      formationId: string;
    };

    if (!userId || !formationId) {
      throw new HttpsError('invalid-argument', 'userId et formationId sont obligatoires.');
    }

    const enrollmentId = `${userId}_${formationId}`;
    const enrollmentRef = admin.firestore().doc(`enrollments/${enrollmentId}`);

    if (action === 'create') {
      const existing = await enrollmentRef.get();
      if (existing.exists) {
        throw new HttpsError('already-exists', 'Cet utilisateur est déjà inscrit à cette formation.');
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
    } else if (action === 'delete') {
      await enrollmentRef.delete();
      return { success: true };
    } else {
      throw new HttpsError('invalid-argument', 'Action invalide. Utilisez "create" ou "delete".');
    }
  }
);

// ── Spotify Proxy (admin-only) ──────────────────────────────────────────────

export const spotifyProxy = onCall(
  { region: 'us-central1', secrets: [spotifyClientId, spotifyClientSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { episodeId } = request.data as { episodeId: string };
    if (!episodeId || typeof episodeId !== 'string') {
      throw new HttpsError('invalid-argument', 'episodeId est obligatoire.');
    }

    const clientId = spotifyClientId.value();
    const clientSecret = spotifyClientSecret.value();
    if (!clientId || !clientSecret) {
      throw new HttpsError('internal', 'Identifiants Spotify non configurés.');
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
        throw new HttpsError('internal', "Erreur d'authentification Spotify.");
      }

      const epRes = await fetch(`https://api.spotify.com/v1/episodes/${episodeId}?market=FR`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const ep = await epRes.json();
      if (ep.error) {
        throw new HttpsError('not-found', `Erreur Spotify : ${ep.error.message}`);
      }

      return {
        name: ep.name,
        description: ep.description,
        coverImage: ep.images?.[0]?.url ?? '',
        durationMs: ep.duration_ms,
        releaseDate: ep.release_date,
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Impossible de récupérer les infos Spotify.');
    }
  }
);

// ── YouTube Proxy (admin-only) ──────────────────────────────────────────────

export const youtubeProxy = onCall(
  { region: 'us-central1', secrets: [youtubeApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs.');
    }

    const { videoId } = request.data as { videoId: string };
    if (!videoId || typeof videoId !== 'string') {
      throw new HttpsError('invalid-argument', 'videoId est obligatoire.');
    }

    const apiKey = youtubeApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'Clé API YouTube non configurée.');
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=snippet,contentDetails,statistics&key=${apiKey}`
      );
      const data = await res.json();
      if (data.error) {
        throw new HttpsError('internal', `Erreur API YouTube : ${data.error.message}`);
      }

      const item = data.items?.[0];
      if (!item) {
        throw new HttpsError('not-found', 'Vidéo YouTube introuvable ou privée.');
      }

      return {
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.maxres?.url
          ?? item.snippet.thumbnails.high?.url
          ?? item.snippet.thumbnails.medium?.url
          ?? '',
        duration: item.contentDetails.duration,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics?.viewCount ?? '0',
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Impossible de récupérer les infos YouTube.');
    }
  }
);

// ── Bictorys Payment ──────────────────────────────────────────────────────

const BICTORYS_API_URL = 'https://api.test.bictorys.com/pay/v1/charges';

export const createBictorysCharge = onCall(
  { region: 'us-central1', secrets: [bictorysApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const { formationId, formationSlug } = request.data as {
      formationId: string;
      formationSlug: string;
    };

    if (!formationId || !formationSlug) {
      throw new HttpsError('invalid-argument', 'formationId et formationSlug sont obligatoires.');
    }

    // Read formation from Firestore for canonical price
    const formationDoc = await admin.firestore().doc(`formations/${formationId}`).get();
    if (!formationDoc.exists) {
      throw new HttpsError('not-found', 'Formation introuvable.');
    }

    const formation = formationDoc.data()!;
    const finalPrice = formation.promoPrice ?? formation.price;

    if (finalPrice <= 0) {
      throw new HttpsError('invalid-argument', 'Cette formation est gratuite, pas besoin de paiement.');
    }

    // Get user info
    const uid = request.auth.uid;
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();

    // Check if already enrolled
    const enrollmentId = `${uid}_${formationId}`;
    const existingEnrollment = await admin.firestore().doc(`enrollments/${enrollmentId}`).get();
    if (existingEnrollment.exists) {
      throw new HttpsError('already-exists', 'Tu es déjà inscrit à cette formation.');
    }

    // Call Bictorys API
    const apiKey = bictorysApiKey.value();
    if (!apiKey) {
      throw new HttpsError('internal', 'Service de paiement non configuré.');
    }

    let bictorysResponse: { link: string; chargeId: string; opToken: string };
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Bictorys charge creation failed:', errMsg);
      throw new HttpsError('internal', 'Erreur lors de la création du paiement. Réessaie.');
    }

    // Create transaction record server-side
    const txnRef = admin.firestore().collection('transactions').doc();
    await txnRef.set({
      id: txnRef.id,
      userId: uid,
      userEmail: request.auth.token.email ?? userData?.email ?? '',
      userName: userData?.displayName ?? request.auth.token.name ?? '',
      formationId,
      formationSlug,
      formationTitle: formation.title ?? '',
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
  }
);

export const bictorysWebhook = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const body = req.body;
    const chargeId: string | undefined = body?.chargeId ?? body?.charge_id;
    const status: string | undefined = body?.status;

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
    } else if (isFailed) {
      await txnDoc.ref.update({
        status: 'failed',
      });
      console.log('Bictorys webhook: payment failed for chargeId', chargeId);
    } else {
      console.log('Bictorys webhook: unhandled status', status, 'for chargeId', chargeId);
    }

    res.status(200).send('OK');
  }
);
