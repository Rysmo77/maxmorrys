import { CLUB_PRICE_XOF } from '../club/pricing';
import { slugify } from '../utils';
import type { FAQ } from '../../types';

/**
 * LES JETONS DE LA FAQ — un prix cité par une réponse se DÉRIVE de sa constante.
 *
 * La collection `faq` est écrite à la main dans la console. Elle a annoncé « l'abonnement à
 * 10 000 FCFA/an » pendant que le Club se vendait 19 900 F/an (audit UI/UX du 29/10/2026,
 * registre #11) : la même dérive que les CGV avant `lib/club/pricing.ts`. Une question ou une
 * réponse écrit désormais `{{clubPrice}}`, et la page affiche le montant de `CLUB_PRICE_XOF`.
 *
 * ⚠️ L'ADRESSE SE CALCULE SUR LE TEXTE BRUT, jamais sur le texte résolu : le Worker
 * (`worker/apps/site/src/prerender/faq.ts`) dérive le slug du document tel qu'il est en base.
 * Le slug est donc figé ici AVANT la résolution, pour que les deux côtés tombent d'accord.
 * Pour garder une adresse déjà partagée, renseigner le champ `slug` de la question.
 *
 * ⚠️ MIROIR : `worker/apps/site/src/prerender/faq.ts` → `FAQ_TOKENS` (le Worker ne peut pas
 * importer `src/`). `tests/unit/club-pricing.test.ts` vérifie que les deux montants concordent.
 */
const TOKENS: Record<string, () => string> = {
  clubPrice: () => CLUB_PRICE_XOF.toLocaleString('fr-FR'),
};

export function resolveFaqTokens(text: string): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name: string) => TOKENS[name]?.() ?? whole);
}

/** La question telle que l'affiche une page publique, adresse figée sur le texte brut. */
export function resolveFaqItem<T extends Pick<FAQ, 'question' | 'answer' | 'slug'>>(item: T): T {
  const slug = item.slug?.trim() ? item.slug : slugify(item.question);
  return {
    ...item,
    slug,
    question: resolveFaqTokens(item.question),
    answer: resolveFaqTokens(item.answer ?? ''),
  };
}
