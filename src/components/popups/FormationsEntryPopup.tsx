import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import LocalizedLink from '../shared/LocalizedLink';
import { universeThemes } from '../../lib/sectionThemes';

/**
 * Mise en avant de « Je te forme » pour un visiteur arrivé depuis un moteur de recherche ou
 * depuis la signature de pied de page d'un site construit par l'agence.
 *
 * Registre : TUTOIEMENT. Les formations relèvent du territoire LEARN, où le système « Je te… »
 * est l'actif de marque à préserver (`docs/UX-AUDIT.md §2`).
 *
 * Le corps reste volontairement COURT : sous `lg`, cette pop-up s'affiche en bandeau bas plafonné
 * à 30 vh (voir `PopupSurface`). Tout paragraphe supplémentaire y deviendrait scrollable.
 */

interface FormationsEntryPopupProps {
  onAccept: () => void;
  onDismiss: () => void;
}

const theme = universeThemes.formations;

export default function FormationsEntryPopup({ onAccept, onDismiss }: FormationsEntryPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {t('popups.formationsEntry.text')}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LocalizedLink
          to="/formations"
          onClick={onAccept}
          className={`group inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${theme.buttonSolid}`}
        >
          {t('popups.formationsEntry.cta')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </LocalizedLink>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {t('popups.formationsEntry.dismiss')}
        </button>
      </div>
    </div>
  );
}
