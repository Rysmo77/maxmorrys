import type { Firestore } from '@mm/firestore-rest';

import type { Env } from '../env';
import { generateContent } from './gemini';
import { asText, toNumber } from './values';

/**
 * Construction du contexte injecté à Rysmo — port de `functions/src/rysmo.ts`.
 *
 * Tout est non bloquant : un catalogue ou un profil indisponible dégrade la
 * réponse mais ne doit jamais la faire échouer.
 */

const CATALOG_TTL_MS = 5 * 60 * 1000;
/** Plafond par collection, pour borner les tokens envoyés à Gemini. */
const CONTENT_LIMIT = 30;
const SUMMARY_THRESHOLD = 6;
const MAX_STORED_MESSAGES = 40;

/**
 * Cache du catalogue, au niveau du module.
 *
 * Même sémantique que la Cloud Function, qui le gardait en mémoire d'instance :
 * ici c'est par isolate. Un cache partagé (KV) serait plus efficace mais
 * changerait le comportement — à envisager séparément.
 */
let catalogCache: { text: string; paths: string[]; expiresAt: number } | null = null;

function truncate(value: string | undefined, max: number): string {
  if (!value) return '';
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Normalise un chemin interne pour comparaison fiable. */
function normPath(path: string): string {
  return path.trim().toLowerCase().split(/[?#]/)[0].replace(/\/+$/, '');
}

export async function getCatalog(db: Firestore): Promise<{ text: string; paths: Set<string> }> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return { text: catalogCache.text, paths: new Set(catalogCache.paths) };
  }

  try {
    const published = (collection: string) =>
      db.query({
        collection,
        where: [{ field: 'status', op: '==', value: 'published' }],
        limit: CONTENT_LIMIT,
      });

    const [formations, blog, podcasts, videos, faq] = await Promise.all([
      published('formations'),
      published('blog'),
      published('podcasts'),
      published('videos'),
      db.query({ collection: 'faq', limit: CONTENT_LIMIT }),
    ]);

    const sections: string[] = [];
    const paths = new Set<string>();

    if (formations.length > 0) {
      const lines = formations.map(({ data }) => {
        const slug = asText(data.slug);
        if (slug) paths.add(normPath(`/formations/${slug}`));
        const price = toNumber(data.promoPrice) || toNumber(data.price);
        const priceLabel = price > 0 ? `${price} FCFA` : 'gratuit';
        return `- "${asText(data.title)}" — ${asText(data.category) ?? ''} · ${asText(data.level) ?? ''} · ${priceLabel} → /formations/${slug}`;
      });
      sections.push(
        [
          'FORMATIONS (cours payants/gratuits — à recommander pour aller plus loin) :',
          ...lines,
        ].join('\n'),
      );
    }

    if (blog.length > 0) {
      const lines = blog.map(({ data }) => {
        const slug = asText(data.slug);
        if (slug) paths.add(normPath(`/blog/${slug}`));
        return `- "${asText(data.title)}" [${asText(data.category) ?? 'général'}] — ${truncate(asText(data.excerpt), 120)} → /blog/${slug}`;
      });
      sections.push(
        [
          'ARTICLES DU BLOG (gratuits — à recommander en priorité avant un cours payant) :',
          ...lines,
        ].join('\n'),
      );
    }

    for (const [items, segment, heading] of [
      [podcasts, 'podcasts', 'PODCASTS (gratuits, audio) :'],
      [videos, 'videos', 'VIDÉOS (gratuites) :'],
    ] as const) {
      if (items.length === 0) continue;
      const lines = items.map(({ data }) => {
        const slug = asText(data.slug);
        if (slug) paths.add(normPath(`/${segment}/${slug}`));
        return `- "${asText(data.title)}" [${asText(data.category) ?? 'général'}] — ${truncate(asText(data.description), 120)} → /${segment}/${slug}`;
      });
      sections.push([heading, ...lines].join('\n'));
    }

    if (faq.length > 0) {
      const lines = faq
        .map(({ data }) => data)
        .sort((a, b) => toNumber(a.order) - toNumber(b.order))
        .map((f) => `- Q : ${asText(f.question)} → R : ${truncate(asText(f.answer), 200)}`);
      sections.push(['FAQ (questions fréquentes sur la plateforme) :', ...lines].join('\n'));
    }

    const text = sections.length
      ? ['', '── CATALOGUE MAX-MORRYS (utilise ces liens dans tes réponses) ──', ...sections].join(
          '\n\n',
        )
      : '';

    catalogCache = { text, paths: [...paths], expiresAt: Date.now() + CATALOG_TTL_MS };
    return { text, paths };
  } catch (error: unknown) {
    console.warn('getCatalog a échoué (non bloquant) :', error);
    return { text: catalogCache?.text ?? '', paths: new Set(catalogCache?.paths ?? []) };
  }
}

const INTERNAL_LINK_TYPES = '(?:blog|podcasts|videos|formations)';

/**
 * Retire les liens internes non vérifiés.
 *
 * Anti-hallucination : un contenu inventé ou non publié ne doit jamais rester
 * cliquable. Le label est conservé, seul le lien saute.
 */
export function sanitizeInternalLinks(reply: string, validPaths: Set<string>): string {
  let out = reply.replace(
    new RegExp(`\\[([^\\]]+)\\]\\((\\/${INTERNAL_LINK_TYPES}\\/[^)\\s]+)\\)`, 'g'),
    (_match, label: string, url: string) =>
      validPaths.has(normPath(url)) ? `[${label}](${url})` : label,
  );
  // URLs brutes hors markdown ; le lookbehind évite de retoucher les `(/...)`.
  out = out.replace(
    new RegExp(`(?<!\\()\\/${INTERNAL_LINK_TYPES}\\/[a-z0-9\\-]+`, 'gi'),
    (match: string) => (validPaths.has(normPath(match)) ? match : ''),
  );
  return out;
}

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / (24 * 60 * 60 * 1000));
}

export async function getEnrolledText(
  db: Firestore,
  uid: string,
): Promise<{ text: string; paths: Set<string> }> {
  const paths = new Set<string>();
  try {
    const enrollments = (
      await db.query({
        collection: 'enrollments',
        where: [{ field: 'userId', op: '==', value: uid }],
      })
    )
      .map((doc) => doc.data)
      .filter((e) => asText(e.formationId));
    if (enrollments.length === 0) return { text: '', paths };

    const capped = enrollments.slice(0, 30);
    // Un seul aller-retour au lieu d'un `get` par inscription.
    const formations = await db.getAll(
      capped.map((e) => `formations/${asText(e.formationId) as string}`),
    );

    const lines: string[] = [];
    formations.forEach((formation, index) => {
      if (!formation) return;
      const slug = asText(formation.data.slug);
      if (slug) paths.add(normPath(`/formations/${slug}`));

      const enrollment = capped[index];
      const progress = toNumber(enrollment.progress);
      const statut =
        progress >= 100 ? 'terminée' : progress > 0 ? `en cours (${progress}%)` : 'pas commencée';
      const days = daysSince(asText(enrollment.lastActivityAt) || asText(enrollment.enrolledAt));
      const activite =
        days !== null && progress < 100
          ? days === 0
            ? ", dernière activité aujourd'hui"
            : `, dernière activité il y a ${days} j`
          : '';
      lines.push(`- "${asText(formation.data.title)}" — ${statut}${activite} → /formations/${slug}`);
    });
    if (lines.length === 0) return { text: '', paths };

    const text = [
      '',
      "PROFIL D'APPRENTISSAGE (formations déjà achetées par cette personne — priorité absolue) :",
      ...lines,
      "→ Ancre tes réponses dans SA progression. Renvoie-la vers une leçon de SES cours avant d'en suggérer un nouveau. Si elle est bloquée (faible progression, inactive depuis longtemps), encourage-la à reprendre.",
    ].join('\n');
    return { text, paths };
  } catch (error: unknown) {
    console.warn('getEnrolledText a échoué (non bloquant) :', error);
    return { text: '', paths };
  }
}

/** Mémoire active par défaut : seul un opt-out explicite la désactive. */
export async function getMemoryConsent(db: Firestore, uid: string): Promise<boolean> {
  try {
    const snapshot = await db.get(`users/${uid}`);
    const preferences = snapshot?.data.preferences as { aiMemoryConsent?: unknown } | undefined;
    return preferences?.aiMemoryConsent !== false;
  } catch {
    return false;
  }
}

export async function getProfileText(db: Firestore, uid: string): Promise<string> {
  try {
    const snapshot = await db.get(`rysmoProfiles/${uid}`);
    if (!snapshot) return '';
    const profile = snapshot.data;

    const parts: string[] = [];
    const summary = asText(profile.summary);
    const level = asText(profile.level);
    if (summary) parts.push(`Résumé : ${summary}`);
    if (Array.isArray(profile.topics) && profile.topics.length) {
      parts.push(`Sujets d'intérêt : ${(profile.topics as unknown[]).join(', ')}`);
    }
    if (level) parts.push(`Niveau estimé : ${level}`);
    if (Array.isArray(profile.weakSpots) && profile.weakSpots.length) {
      parts.push(`Points à renforcer : ${(profile.weakSpots as unknown[]).join(', ')}`);
    }
    if (parts.length === 0) return '';

    return [
      '',
      'CE QUE TU SAIS DÉJÀ DE CET ÉTUDIANT (mémoire des échanges passés — utilise-le pour personnaliser, sans le réciter mot pour mot) :',
      ...parts.map((part) => `- ${part}`),
    ].join('\n');
  } catch (error: unknown) {
    console.warn('getProfileText a échoué (non bloquant) :', error);
    return '';
  }
}

export async function getEngagementText(db: Firestore, uid: string): Promise<string> {
  try {
    const documents = await db.query({
      collection: `users/${uid}/engagement`,
      orderBy: [{ field: 'lastAt', direction: 'desc' }],
      limit: 12,
    });
    if (documents.length === 0) return '';

    const scored = documents.map(({ data }) => ({
      category: asText(data.category) || 'général',
      title: asText(data.title) ?? 'contenu',
      type: asText(data.type) ?? 'contenu',
      score:
        Math.min(toNumber(data.scrollPctMax), 100) / 100 +
        Math.min(toNumber(data.dwellSec), 600) / 600 +
        Math.min(toNumber(data.mediaSec), 1800) / 1800,
    }));

    const byCategory = new Map<string, number>();
    for (const entry of scored) {
      byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + entry.score);
    }
    const topCategories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category]) => category);

    const recent = [...scored]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => `"${entry.title}" (${entry.type})`);

    const lines: string[] = [];
    if (topCategories.length) lines.push(`- Catégories préférées : ${topCategories.join(', ')}`);
    if (recent.length) lines.push(`- Récemment consultés : ${recent.join(', ')}`);
    if (lines.length === 0) return '';

    return [
      '',
      "PRÉFÉRENCES DE CONTENU (déduites de l'activité de cette personne — adapte tes réponses) :",
      ...lines,
      "→ Oriente tes exemples et recommandations vers ces centres d'intérêt.",
    ].join('\n');
  } catch (error: unknown) {
    console.warn('getEngagementText a échoué (non bloquant) :', error);
    return '';
  }
}

interface StoredMessage {
  role: string;
  content: string;
  ts: string;
}

/**
 * Persiste l'échange et régénère le profil au seuil.
 *
 * Entièrement non bloquant : une mémoire qui échoue ne doit pas priver
 * l'utilisateur de sa réponse, déjà produite et déjà décomptée du quota.
 */
export async function persistAndSummarize(
  db: Firestore,
  env: Env,
  uid: string,
  userMessage: string,
  reply: string,
): Promise<void> {
  try {
    const conversationPath = `rysmoConversations/${uid}`;
    const profilePath = `rysmoProfiles/${uid}`;

    const now = new Date().toISOString();
    const conversation = await db.get(conversationPath);
    const previous = Array.isArray(conversation?.data.messages)
      ? (conversation.data.messages as StoredMessage[])
      : [];
    const messageCount = toNumber(conversation?.data.msgCountSinceSummary) + 1;

    const messages = [
      ...previous,
      { role: 'user', content: userMessage, ts: now },
      { role: 'assistant', content: reply, ts: now },
    ].slice(-MAX_STORED_MESSAGES);

    await db.set(
      conversationPath,
      { messages, msgCountSinceSummary: messageCount, updatedAt: now },
      { merge: true },
    );

    if (messageCount < SUMMARY_THRESHOLD) return;

    const existing = await db.get(profilePath);
    const existingSummary = asText(existing?.data.summary);
    const transcript = messages
      .map((m) => `${m.role === 'assistant' ? 'Rysmo' : 'Étudiant'}: ${m.content}`)
      .join('\n')
      .slice(0, 6000);

    const prompt = [
      'Analyse cette conversation entre un étudiant et le tuteur IA Rysmo (plateforme de marketing digital/SEO/IA).',
      existingSummary ? `Profil précédent: ${existingSummary}` : '',
      'Produis un JSON STRICT avec ces clés (en français, concis) :',
      '{ "summary": "2-3 phrases sur cet étudiant, ses objectifs et son contexte", "topics": ["sujets d\'intérêt récurrents"], "level": "débutant|intermédiaire|avancé", "weakSpots": ["points à renforcer"] }',
      '',
      'Conversation :',
      transcript,
    ]
      .filter(Boolean)
      .join('\n');

    let parsed: { summary?: string; topics?: unknown; level?: string; weakSpots?: unknown };
    try {
      const raw = await generateContent(env, [{ text: prompt }], { temperature: 0.3, json: true });
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      console.warn('Résumé de profil illisible ; mise à jour ignorée.');
      await db.set(conversationPath, { msgCountSinceSummary: 0 }, { merge: true });
      return;
    }

    await db.set(
      profilePath,
      {
        summary: parsed.summary ?? existingSummary ?? '',
        topics: Array.isArray(parsed.topics)
          ? parsed.topics.slice(0, 10)
          : ((existing?.data.topics as unknown[]) ?? []),
        level: parsed.level ?? asText(existing?.data.level) ?? '',
        weakSpots: Array.isArray(parsed.weakSpots)
          ? parsed.weakSpots.slice(0, 10)
          : ((existing?.data.weakSpots as unknown[]) ?? []),
        updatedAt: now,
      },
      { merge: true },
    );
    await db.set(conversationPath, { msgCountSinceSummary: 0 }, { merge: true });
  } catch (error: unknown) {
    console.warn('persistAndSummarize a échoué (non bloquant) :', error);
  }
}
