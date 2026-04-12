import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

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

    // Rate limiting : max 50 appels par heure par utilisateur (atomic transaction)
    const uid = request.auth.uid;
    const rateLimitRef = admin.firestore().doc(`_ratelimits/rysmo_${uid}`);
    await admin.firestore().runTransaction(async (txn) => {
      const snap = await txn.get(rateLimitRef);
      const data = snap.data() ?? { calls: [] as number[] };
      const windowStart = Date.now() - 60 * 60 * 1000;
      const recentCalls: number[] = (data.calls as number[]).filter((t: number) => t > windowStart);
      if (recentCalls.length >= 50) {
        throw new HttpsError('resource-exhausted', 'Limite d\'utilisation atteinte. Réessaie dans une heure.');
      }
      txn.set(rateLimitRef, { calls: [...recentCalls, Date.now()] });
    });

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
