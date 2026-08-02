import { slugify } from './utils';
import { requestTranslation } from './contentTranslation';

/**
 * Génère un slug anglais à partir d'un titre français : traduit le titre via
 * `translateContent` (Gemini + cache) puis le slugifie. Repli sur le titre source
 * si la traduction échoue.
 */
export async function generateSlugEn(title: string): Promise<string> {
  const trimmed = title.trim();
  if (!trimmed) return '';
  try {
    const en = await requestTranslation(trimmed);
    return slugify(en) || slugify(trimmed);
  } catch {
    return slugify(trimmed);
  }
}
