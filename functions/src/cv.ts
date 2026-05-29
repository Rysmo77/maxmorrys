import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

const googleAiKey = defineSecret('GOOGLE_AI_API_KEY');
const DAILY_LIMIT = 5;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB CV

async function hasActiveClubSub(uid: string): Promise<boolean> {
  const snap = await admin.firestore().doc(`club_subscriptions/${uid}`).get();
  const d = snap.data();
  return !!d && d.status === 'active' && new Date(d.expiresAt) > new Date();
}

/**
 * Parses a student's CV (PDF) with Gemini and returns structured profile fields.
 * Club-members-only, capped at DAILY_LIMIT runs/day to control AI cost.
 */
export const parseCv = onCall(
  { region: 'us-central1', secrets: [googleAiKey] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
    const uid = request.auth.uid;

    if (!(await hasActiveClubSub(uid))) {
      throw new HttpsError('permission-denied', "L'analyse de CV est réservée aux membres du Club.");
    }

    const { fileBase64, mimeType } = request.data as { fileBase64?: string; mimeType?: string };
    if (!fileBase64 || !mimeType) throw new HttpsError('invalid-argument', 'Fichier manquant.');
    if (!/^application\/pdf$/.test(mimeType)) throw new HttpsError('invalid-argument', 'Seuls les PDF sont acceptés.');
    if (fileBase64.length * 0.75 > MAX_BYTES) throw new HttpsError('invalid-argument', 'CV trop lourd (max 8 Mo).');

    // Daily rate limit
    const rlRef = admin.firestore().doc(`_ratelimits/cv_${uid}`);
    const today = new Date().toISOString().slice(0, 10);
    await admin.firestore().runTransaction(async (t) => {
      const snap = await t.get(rlRef);
      const data = snap.data();
      const count = data?.date === today ? (data.count ?? 0) : 0;
      if (count >= DAILY_LIMIT) {
        throw new HttpsError('resource-exhausted', `Limite atteinte (${DAILY_LIMIT} analyses/jour). Réessaie demain.`);
      }
      t.set(rlRef, { date: today, count: count + 1 }, { merge: true });
    });

    const apiKey = googleAiKey.value();
    if (!apiKey) throw new HttpsError('internal', 'Service IA non configuré.');

    const prompt = [
      "Tu analyses le CV ci-joint d'un professionnel du marketing digital.",
      'Renvoie un JSON STRICT (valeurs vides "" si absentes) avec EXACTEMENT ces clés :',
      '{ "headline": "titre pro court", "skills": ["compétences clés, max 8"], "city": "ville", "linkedin": "URL", "website": "URL", "facebook": "URL", "instagram": "URL ou @", "twitter": "URL ou @", "tiktok": "URL ou @", "youtube": "URL" }',
      "N'invente rien : laisse vide si l'info n'est pas explicitement dans le CV.",
    ].join('\n');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: fileBase64 } }, { text: prompt }] }],
        config: { temperature: 0.2, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
      });
      const parsed = JSON.parse(res.text ?? '{}');
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
    } catch (error: unknown) {
      console.error('parseCv failed:', error instanceof Error ? error.message : error);
      throw new HttpsError('internal', "Échec de l'analyse du CV. Réessaie.");
    }
  },
);
