import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { generateContent } from './gemini';
import { asText, toNumber } from './values';

/**
 * Digest hebdomadaire du Club — port de `buildWeeklyDigest` (functions/src/digest.ts).
 *
 * Classe les publications de la semaine par engagement, demande un récapitulatif
 * à Gemini, le publie en info exclusive et notifie les membres actifs.
 *
 * Extrait dans un module à part parce qu'il est partagé entre la callable admin
 * et le cron hebdomadaire — ce dernier rejoindra le Worker `jobs`.
 */

interface RankedPost {
  userName: string;
  content: string;
  score: number;
}

const DIGEST_TITLE: Record<'fr' | 'en', string> = {
  fr: '📰 Digest de la semaine',
  en: "📰 This week's digest",
};

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/** Renvoie le nombre de membres notifiés, 0 si rien n'a été publié. */
export async function buildWeeklyDigest(db: Firestore, env: Env): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const posts = await db.query({
    collection: 'club_posts',
    where: [{ field: 'createdAt', op: '>=', value: weekAgo }],
  });
  if (posts.length === 0) return 0;

  const ranked: RankedPost[] = posts
    .map((post) => ({
      userName: asText(post.data.userName) ?? 'Membre',
      content: asText(post.data.content) ?? '',
      score:
        countArray(post.data.likes) +
        toNumber(post.data.commentsCount) +
        countArray(post.data.reposts),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const transcript = ranked
    .map(
      (post, index) =>
        `${index + 1}. ${post.userName} (${post.score} interactions) : ${post.content.replace(/\s+/g, ' ').slice(0, 300)}`,
    )
    .join('\n');

  const prompt = [
    "Tu es l'animateur du Club des Digitos (communauté marketing digital/SEO/IA).",
    'Voici les publications les plus actives de la semaine (classées par interactions) :',
    transcript,
    '',
    'Rédige un récapitulatif hebdomadaire chaleureux et motivant en français.',
    'Renvoie un JSON STRICT : { "title": "titre court et accrocheur", "content": "corps en markdown : 2-3 temps forts, mentionne les membres actifs, termine par un encouragement à participer. 120-180 mots." }',
    "N'invente pas de faits hors des publications fournies.",
  ].join('\n');

  let parsed: { title?: string; content?: string };
  try {
    const raw = await generateContent(env, [{ text: prompt }], { temperature: 0.5, json: true });
    parsed = JSON.parse(raw || '{}') as { title?: string; content?: string };
  } catch {
    // Un digest raté n'est pas un incident : on ne publie rien et on réessaiera.
    return 0;
  }

  const title = (parsed.title ?? '').trim() || 'Le digest de la semaine au Club';
  const content = (parsed.content ?? '').trim();
  if (!content) return 0;

  const now = new Date().toISOString();
  await db.add('club_infos', { title, content, type: 'article', publishedAt: now, likes: [] });

  const subscriptions = await db.query({
    collection: 'club_subscriptions',
    where: [{ field: 'status', op: '==', value: 'active' }],
  });
  if (subscriptions.length === 0) return 0;

  // La langue de chaque destinataire est lue en un seul aller-retour plutôt
  // qu'un `get` par membre, comme le faisait la Cloud Function.
  const users = await db.getAll(subscriptions.map((sub) => `users/${sub.id}`));
  const languages = new Map<string, 'fr' | 'en'>();
  subscriptions.forEach((sub, index) => {
    const preferences = users[index]?.data.preferences as { language?: unknown } | undefined;
    languages.set(sub.id, preferences?.language === 'en' ? 'en' : 'fr');
  });

  await Promise.all(
    subscriptions.map((sub) =>
      db.add(`notifications/${sub.id}/items`, {
        userId: sub.id,
        type: 'club',
        title: DIGEST_TITLE[languages.get(sub.id) ?? 'fr'],
        message: title,
        read: false,
        createdAt: now,
        link: '/mon-espace/club',
      }),
    ),
  );

  return subscriptions.length;
}
