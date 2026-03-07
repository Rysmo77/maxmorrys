import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const googleAiKey = defineSecret('GOOGLE_AI_API_KEY');

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
    if (password.length < 6) {
      throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 6 caractères.');
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
