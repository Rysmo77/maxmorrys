import Anthropic from '@anthropic-ai/sdk';
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
  /** Clé Gemini. Absente (et pas de clé Claude) = pas de traduction, repli sur la source. */
  apiKey?: string;
  /**
   * Clé Claude : le SECOURS quand Gemini échoue (réseau, quota, JSON illisible). Absente =
   * comportement d'avant, Gemini seul.
   */
  anthropicApiKey?: string;
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
/** Le secours. Pas de `temperature` : l'API la rejette sur ce modèle. */
const CLAUDE_MODEL = 'claude-haiku-5-5';
/** Même délai que Gemini : sur le site, la traduction est dans le chemin de la requête. */
const TIMEOUT_MS = 8_000;

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

/**
 * Lit le tableau JSON rendu par un modèle. Une case qui n'est pas une chaîne vaut `null` :
 * c'est un REPLI, pas une traduction, et il ne doit pas entrer dans le cache.
 */
function lireTableau(raw: string, attendu: number, qui: string): Array<string | null> {
  // Claude peut entourer le JSON d'une clôture de code ; on prend du premier `[` au dernier `]`.
  const debut = raw.indexOf('[');
  const fin = raw.lastIndexOf(']');
  const parsed: unknown = JSON.parse(debut >= 0 && fin > debut ? raw.slice(debut, fin + 1) : raw);
  if (!Array.isArray(parsed) || parsed.length !== attendu) {
    throw new Error(`${qui} a renvoyé un tableau de taille inattendue`);
  }
  return parsed.map((value) => (typeof value === 'string' ? value : null));
}

async function viaGemini(texts: string[], config: TranslateConfig): Promise<Array<string | null>> {
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Gemini a répondu ${response.status}`);

  const body = (await response.json()) as GeminiResponse;
  return lireTableau(body.candidates?.[0]?.content?.parts?.[0]?.text ?? '', texts.length, 'Gemini');
}

/** `fetchImpl` n'existe que pour les tests. */
async function viaClaude(
  texts: string[],
  apiKey: string,
  fetchImpl?: typeof fetch,
): Promise<Array<string | null>> {
  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: TIMEOUT_MS,
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  });
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    // Plancher de 2048 : la réflexion de Haiku est comptée dedans, même en effort bas.
    max_tokens: Math.min(16_000, Math.max(2048, Math.ceil(texts.join('').length / 2) + 1024)),
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: buildPrompt(texts) }],
  });
  if (message.stop_reason !== 'end_turn') {
    throw new Error(`Claude s'est arrêté sur « ${message.stop_reason} »`);
  }
  const raw = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return lireTableau(raw, texts.length, 'Claude');
}

/**
 * Gemini d'abord, Claude Haiku en secours. Lève si les deux échouent (ou si le seul
 * configuré échoue) : l'appelant décide du repli, et surtout de ne PAS le mettre en cache.
 *
 * `fetchImpl` ne sert qu'aux tests du secours Claude.
 */
export async function translateBatchDetaille(
  texts: string[],
  config: TranslateConfig,
  fetchImpl?: typeof fetch,
): Promise<Array<string | null>> {
  if (texts.length === 0) return [];

  let erreurGemini: unknown = new Error('clé Gemini absente');
  if (config.apiKey) {
    try {
      return await viaGemini(texts, config);
    } catch (error: unknown) {
      erreurGemini = error;
    }
  }
  if (!config.anthropicApiKey) throw erreurGemini;

  console.warn(
    'Traduction : Gemini indisponible, secours Claude.',
    erreurGemini instanceof Error ? erreurGemini.message : erreurGemini,
  );
  return viaClaude(texts, config.anthropicApiKey, fetchImpl);
}

/**
 * Traduit un lot de textes en un seul appel, en préservant l'ordre.
 *
 * Exposé pour `backfillSlugEn`, qui traduit des titres sans vouloir peupler le
 * cache `translations/` — le résultat y est slugifié, pas réutilisé tel quel.
 * Une case illisible retombe sur sa source.
 */
export async function translateBatch(
  texts: string[],
  config: TranslateConfig,
): Promise<string[]> {
  const traduits = await translateBatchDetaille(texts, config);
  return traduits.map((value, index) => value ?? texts[index]);
}

/** Lit le cache `translations/`, traduit les manquants, réécrit le cache. */
export async function translateCached(
  db: Firestore,
  config: TranslateConfig,
  texts: string[],
): Promise<Record<string, string>> {
  return (await translateCachedDetaille(db, config, texts)).traductions;
}

/**
 * Comme `translateCached`, en disant QUELLES sources sont restées en français par repli
 * (aucune clé, case illisible). Ces sources-là ne sont pas en cache.
 */
export async function translateCachedDetaille(
  db: Firestore,
  config: TranslateConfig,
  texts: string[],
): Promise<{ traductions: Record<string, string>; replis: Set<string> }> {
  const replis = new Set<string>();
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
    if (!config.apiKey && !config.anthropicApiKey) {
      for (const source of misses) {
        result[source] = source;
        replis.add(source);
      }
      return { traductions: result, replis };
    }

    const translated = await translateBatchDetaille(misses, config);
    /*
     * ⛔ UN REPLI EN FRANÇAIS N'ENTRE JAMAIS DANS LE CACHE. Une case que le modèle n'a pas
     * rendue (`null`) est servie en français CETTE fois, et retentée à la prochaine
     * demande. Écrite dans `translations/`, elle aurait été servie en français pour
     * toujours : le cache n'expire pas.
     */
    const writes = await Promise.all(
      misses.map(async (source, index) => {
        const value = translated[index];
        result[source] = value ?? source;
        if (value === null || value === undefined) {
          replis.add(source);
          return null;
        }
        return db.buildWrite(
          `translations/${await cacheKey(source)}`,
          { lang: 'en', source, target: value, createdAt: FieldValue.serverTimestamp() },
          { mask: false },
        );
      }),
    );
    const aEcrire = writes.filter((w): w is NonNullable<typeof w> => w !== null);
    if (aEcrire.length > 0) await db.commit(aEcrire);
  }

  return { traductions: result, replis };
}

/**
 * Traduit les champs visibles d'une meta FR→EN.
 *
 * Non bloquant par construction : toute erreur renvoie la version française,
 * comme aujourd'hui. Le chemin critique d'une page anglaise ne doit jamais
 * dépendre de la disponibilité de Gemini.
 *
 * `complete` est faux quand un champ est resté en français par REPLI (panne des deux
 * modèles, case illisible) : l'appelant ne doit alors mettre la page en cache que
 * brièvement — sinon le repli est servi pendant tout le TTL.
 */
export async function translateMetaToEnDetaille<T extends TranslatableMeta>(
  db: Firestore,
  config: TranslateConfig,
  meta: T,
): Promise<{ meta: T; complete: boolean }> {
  if (!config.apiKey && !config.anthropicApiKey) return { meta, complete: false };

  const sources = [meta.title, meta.description, meta.h1 ?? '', meta.bodyText ?? ''];
  try {
    const { traductions: map, replis } = await translateCachedDetaille(db, config, sources);
    const tr = (value?: string) => (value ? (map[value] ?? value) : value);
    const traduite = {
      ...meta,
      title: tr(meta.title) as string,
      description: tr(meta.description) as string,
      h1: tr(meta.h1),
      bodyText: tr(meta.bodyText),
    };
    return { meta: traduite, complete: replis.size === 0 };
  } catch (error: unknown) {
    console.warn('Traduction de la meta impossible (non bloquant) :', error);
    return { meta, complete: false };
  }
}

/** Forme historique : la meta seule. */
export async function translateMetaToEn<T extends TranslatableMeta>(
  db: Firestore,
  config: TranslateConfig,
  meta: T,
): Promise<T> {
  return (await translateMetaToEnDetaille(db, config, meta)).meta;
}
