import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import FormationTile from './FormationTile';
import { TONES, ARROW, DISMISS, BODY, ACTIONS } from './popupStyles';
import type { Formation } from '../../types';
import { contentPath } from '../../lib/contentPath';
import { useLanguage } from '../../contexts/LanguageContext';
import { Icon } from '@ds';

/**
 * Découverte de l'école, pour un inconnu arrivé par la recherche, un réseau ou un site client.
 * Vit sur le hub seulement ; elle mène à edu.
 *
 * Corrigé le 2026-10-29 :
 *   · le bouton posait de l'encre sur un aplat `--mm-bleu` — 2,78:1 en clair, 1,91:1 en
 *     sombre — le défaut que le 02/09 avait corrigé partout SAUF ici ;
 *   · le sourcil disait « La formation la plus suivie » : une preuve sociale que rien ne
 *     mesure, interdite par le kit. Il dit désormais « À la une ».
 *
 * `PopupManager` ne l'ouvre que si au moins une formation est réellement en vente.
 */
interface FormationsEntryPopupProps {
  formation: Formation | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function FormationsEntryPopup({ formation, onAccept, onDismiss }: FormationsEntryPopupProps) {
  const { t } = useTranslation('shared');
  const { language } = useLanguage();
  /* « Découvrir cette formation » menait au CATALOGUE, pas à la formation nommée. */
  const target = formation ? contentPath('formations', formation, language) : '/formations';

  return (
    <div>
      <PopupHeading tone="edu" eyebrow={t('popups.formationsEntry.eyebrow')} title={t('popups.formationsEntry.title')} />
      {formation ? <FormationTile formation={formation} /> : <p className={BODY}>{t('popups.formationsEntry.text')}</p>}

      <div className={ACTIONS}>
        <LocalizedLink to={target} onClick={onAccept} className={TONES.edu.cta}>
          {t(formation ? 'popups.formationsEntry.ctaWithFormation' : 'popups.formationsEntry.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.formationsEntry.dismiss')}
        </button>
      </div>
    </div>
  );
}
