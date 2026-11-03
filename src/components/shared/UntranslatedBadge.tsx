import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

interface UntranslatedBadgeProps {
  /** Le texte source (français), tel qu'il est stocké. */
  source: string;
  /** Le texte affiché, après traduction éventuelle. */
  shown: string;
  className?: string;
}

/**
 * Le badge « FR » d'une carte restée en français sur l'interface anglaise (audit du
 * 03/11/2026, n°6 / M4).
 *
 * L'interface passait en anglais et les contenus restaient en français SANS AVERTISSEMENT,
 * sous une page de paramètres qui promet « traduits automatiquement ». Tant que le texte
 * affiché est identique à la source — traduction en cours, échouée ou absente — la carte le
 * dit. Rien en français : la langue de la carte y est déjà celle de l'interface.
 */
export default function UntranslatedBadge({ source, shown, className = '' }: UntranslatedBadgeProps) {
  const { t } = useTranslation('shared');
  const { language } = useLanguage();
  if (language !== 'en' || !source.trim() || shown !== source) return null;
  return (
    <span
      lang="fr"
      title={t('untranslated.aria')}
      aria-label={t('untranslated.aria')}
      className={`mm-tag inline-flex align-middle ${className}`}
    >
      {t('untranslated.badge')}
    </span>
  );
}
