import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { intlLocale } from '../i18n/routing';
import { formatDate as formatDateBase, formatPrice as formatPriceBase } from '../lib/utils';

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

  return { formatDate, formatPrice, locale, language };
}
