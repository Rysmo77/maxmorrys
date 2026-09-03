import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { intlLocale } from '../i18n/routing';
import { formatDate as formatDateBase, formatPrice as formatPriceBase } from '../lib/utils';
import { formatSecondary, SECONDARY_CURRENCY } from '../lib/currency/convert';

/**
 * Helpers de formatage localisés selon la langue active.
 * Réutilise formatDate/formatPrice de lib/utils en injectant la bonne locale Intl.
 */
export function useFormat() {
  const { language } = useLanguage();
  const locale = intlLocale(language);

  const formatDate = useCallback((dateString: string) => formatDateBase(dateString, locale), [locale]);
  const formatPrice = useCallback(
    (price: number, currency = 'XOF') => formatPriceBase(price, currency, locale),
    [locale],
  );

  /**
   * La contrevaleur indicative — euro en français, dollar US en anglais.
   *
   * Rend `null` quand il n'y a rien à convertir (montant nul ou absent) : un « ≈ 0 € » sous
   * une option gratuite dirait le contraire de ce qu'il montre. Les appelants testent donc
   * la valeur avant de la rendre — c'est volontairement un `string | null` et pas une chaîne
   * vide, pour qu'un oubli se voie au typage.
   *
   * ⚠️ JAMAIS pour un montant qu'on encaisse, qu'on met dans un champ ou qu'on envoie au
   * serveur : le débit est en FCFA. Voir `lib/currency/convert.ts`.
   */
  const formatApprox = useCallback(
    (priceXof: number) => formatSecondary(priceXof, language, locale),
    [language, locale],
  );

  return { formatDate, formatPrice, formatApprox, secondaryCurrency: SECONDARY_CURRENCY[language], locale, language };
}
