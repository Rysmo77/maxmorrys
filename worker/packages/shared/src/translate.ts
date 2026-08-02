import { FieldValue, type Firestore } from '@mm/firestore-rest';

import { sha256Hex } from './crypto';

/**
 * Configuration d'appel à Gemini.
 *
 * Pointer `baseUrl` sur AI Gateway apporte cache, budgets et observabilité des
 * coûts sans changer une ligne d'appel.
 */
export interface TranslateConfig {
  baseUrl: string;
  /** Absente = pas de traduction, repli sur la source. */
  apiKey?: string;
}

/** Sous-ensemble traduisible d'une meta de page. */
export interface TranslatableMeta {
  title: string;
  description: string;
  h1?: string;
  bodyText?: string;
}

/**
 * Port de `translateCached` (functions/src/translate.ts) vers WebCrypto + REST.
 *
 * Partagé entre le Worker `site` (traduction des meta pour les pages /en) et le
 * Worker `api` (callable `translateContent`). La clé de cache doit rester
 * strictement identique entre les deux — et avec les Cloud Functions — sinon la
 * collection `translations/` se dédouble et Gemini est resollicité pour rien.
 *
 * La clé de cache est **identique** à celle des Cloud Functions
 * (`sha256("en " + texte)`), donc la collection `translations/` reste partagée
 * entre l'ancien et le nouveau chemin : aucune retraduction lors de la bascule,
 * et le rollback ne perd rien.
 */

const MAX_LEN = 20000;
const MODEL = 'gemini-2.5-flash';

function cacheKey(text: string): Promise<string> {
  return sha256Hex(`en ${text}`);
}

function buildPrompt(texts: string[]): string {
  return [
    'You are a professional translator. Translate each item of the following JSON array from French to English.',
    'Rules:',
    '- Preserve Markdown and HTML structure exactly (tags, links, code blocks, line breaks, emojis).',
    '- Do NOT translate brand/proper names: "Max-Morrys", "Rysmo", "Club des Digitos", "FCFA".',
    '- Keep the translation natural, idiomatic and faithful to the marketing tone.',
    '- Return ONLY a JSON array of strings, same length and same order as the input. No commentary.',
    '',
    'Input:',
    JSON.stringify(texts),
  ].join('\n');
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

async function translateBatch(texts: string[], config: TranslateConfig): Promise<string[]> {
  if (texts.length === 0) return [];

  const url = `${config.baseUrl}/v1beta/models/${MODEL}:generateContent?key=${config.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(texts) }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`Gemini a répondu ${response.status}`);

  const body = (await response.json()) as GeminiResponse;
  const raw = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed) || parsed.length !== texts.length) {
    throw new Error('Gemini a renvoyé un tableau de taille inattendue');
  }
  return parsed.map((value, index) => (typeof value === 'string' ? value : texts[index]));
}

/** Lit le cache `translations/`, traduit les manquants, réécrit le cache. */
export async function translateCached(
  db: Firestore,
  config: TranslateConfig,
  texts: string[],
): Promise<Record<string, string>> {
  const unique = new Map<string, string>();
  for (const text of texts) {
    if (typeof text !== 'string') continue;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_LEN) continue;
    if (!unique.has(text)) unique.set(text, await cacheKey(text));
  }

  const result: Record<string, string> = {};
  const misses: string[] = [];
  const entries = [...unique.entries()];

  if (entries.length > 0) {
    const snapshots = await db.getAll(entries.map(([, hash]) => `translations/${hash}`));
    snapshots.forEach((snapshot, index) => {
      const [source] = entries[index];
      const cached = snapshot?.data.target;
      if (typeof cached === 'string') result[source] = cached;
      else misses.push(source);
    });
  }

  if (misses.length > 0) {
    if (!config.apiKey) {
      for (const source of misses) result[source] = source;
      return result;
    }

    const translated = await translateBatch(misses, config);
    const writes = await Promise.all(
      misses.map(async (source, index) => {
        const value = translated[index] ?? source;
        result[source] = value;
        return db.buildWrite(
          `translations/${await cacheKey(source)}`,
          { lang: 'en', source, target: value, createdAt: FieldValue.serverTimestamp() },
          { mask: false },
        );
      }),
    );
    await db.commit(writes);
  }

  return result;
}

/**
 * Traduit les champs visibles d'une meta FR→EN.
 *
 * Non bloquant par construction : toute erreur renvoie la version française,
 * comme aujourd'hui. Le chemin critique d'une page anglaise ne doit jamais
 * dépendre de la disponibilité de Gemini.
 */
export async function translateMetaToEn<T extends TranslatableMeta>(
  db: Firestore,
  config: TranslateConfig,
  meta: T,
): Promise<T> {
  if (!config.apiKey) return meta;

  const sources = [meta.title, meta.description, meta.h1 ?? '', meta.bodyText ?? ''];
  try {
    const map = await translateCached(db, config, sources);
    const tr = (value?: string) => (value ? (map[value] ?? value) : value);
    return {
      ...meta,
      title: tr(meta.title) as string,
      description: tr(meta.description) as string,
      h1: tr(meta.h1),
      bodyText: tr(meta.bodyText),
    };
  } catch (error: unknown) {
    console.warn('Traduction de la meta impossible (non bloquant) :', error);
    return meta;
  }
}
