import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';

const googleAiKey = defineSecret('GOOGLE_AI_API_KEY');
const db = admin.firestore();

interface RankedPost { userName?: string; content?: string; likes?: string[]; reposts?: string[]; commentsCount?: number; score: number }

/**
 * Builds the weekly Club digest: ranks the week's posts by engagement, asks Gemini
 * for a friendly recap, publishes it as an exclusive info, and notifies active members.
 * Returns the number of members notified (0 if nothing to publish).
 */
async function buildWeeklyDigest(apiKey: string): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const snap = await db.collection('club_posts').where('createdAt', '>=', weekAgo).get();
  if (snap.empty) return 0;

  const ranked: RankedPost[] = snap.docs
    .map((d) => {
      const p = d.data() as RankedPost;
      return { ...p, score: (p.likes?.length ?? 0) + (p.commentsCount ?? 0) + (p.reposts?.length ?? 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const transcript = ranked
    .map((p, i) => `${i + 1}. ${p.userName ?? 'Membre'} (${p.score} interactions) : ${String(p.content ?? '').replace(/\s+/g, ' ').slice(0, 300)}`)
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

  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.5, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
  });

  let parsed: { title?: string; content?: string };
  try { parsed = JSON.parse(res.text ?? '{}'); } catch { return 0; }
  const title = (parsed.title ?? '').trim() || 'Le digest de la semaine au Club';
  const content = (parsed.content ?? '').trim();
  if (!content) return 0;

  const now = new Date().toISOString();
  await db.collection('club_infos').add({
    title, content, type: 'article', publishedAt: now, likes: [],
  });

  // Notify active members (titre de notification localisé par destinataire).
  const digestTitle: Record<'fr' | 'en', string> = {
    fr: '📰 Digest de la semaine',
    en: "📰 This week's digest",
  };
  const subs = await db.collection('club_subscriptions').where('status', '==', 'active').get();
  await Promise.all(subs.docs.map(async (s) => {
    let lang: 'fr' | 'en' = 'fr';
    try {
      const u = await db.collection('users').doc(s.id).get();
      if (u.data()?.preferences?.language === 'en') lang = 'en';
    } catch { /* défaut fr */ }
    return db.collection(`notifications/${s.id}/items`).add({
      userId: s.id,
      type: 'club',
      title: digestTitle[lang],
      message: title,
      read: false,
      createdAt: now,
      link: '/mon-espace/club',
    });
  }));

  return subs.size;
}

// Weekly, Monday 09:00.
export const weeklyClubDigest = onSchedule(
  { schedule: '0 9 * * 1', secrets: [googleAiKey] },
  async () => { await buildWeeklyDigest(googleAiKey.value()); },
);

// Admin-triggered manual run (for testing / on-demand publishing).
export const weeklyClubDigestManual = onCall(
  { region: 'us-central1', secrets: [googleAiKey] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
    const caller = await db.doc(`users/${request.auth.uid}`).get();
    if (caller.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Réservé aux administrateurs.');
    const notified = await buildWeeklyDigest(googleAiKey.value());
    return { success: true, notified };
  },
);
