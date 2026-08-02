import { HttpsError, translateCached } from '@mm/shared';

import type { CallContext } from '../context';

/**
 * Port de `translateContent` — traduit du contenu Firestore FR→EN à la volée.
 *
 * Accessible sans authentification, comme la version d'origine : le contenu
 * traduit est public. Le garde-fou est le volume, pas l'identité.
 *
 * Le cœur `translateCached` est partagé avec le Worker `site`, qui traduit les
 * métadonnées des pages `/en`. La clé de cache est identique à celle des Cloud
 * Functions, donc la collection `translations/` reste commune aux trois chemins.
 */

const MAX_TEXTS = 60;

export async function translateContent(data: unknown, context: CallContext): Promise<unknown> {
  const { texts, targetLang } = (data ?? {}) as { texts?: unknown; targetLang?: unknown };

  if (targetLang !== 'en') {
    throw new HttpsError('invalid-argument', 'Only targetLang "en" is supported.');
  }
  if (!Array.isArray(texts) || texts.length === 0) {
    return { translations: {} };
  }
  if (texts.length > MAX_TEXTS) {
    throw new HttpsError('invalid-argument', `Too many texts (max ${MAX_TEXTS}).`);
  }

  const translations = await translateCached(
    context.db,
    { baseUrl: context.env.GEMINI_BASE_URL, apiKey: context.env.GOOGLE_AI_API_KEY },
    texts as string[],
  );

  return { translations };
}
