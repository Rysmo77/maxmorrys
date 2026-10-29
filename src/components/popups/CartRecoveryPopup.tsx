import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import FormationTile from './FormationTile';
import { TONES, ARROW, DISMISS, BODY, ACTIONS } from './popupStyles';
import type { Formation } from '../../types';
import { Icon } from '@ds';

/**
 * Reprise d'un paiement laissé en route — le prospect le plus proche de l'achat du site.
 *
 * Le marqueur est posé sur edu. (le tunnel y vit) et lu par le hub comme par l'école : il est
 * rangé dans le cookie de domaine (`lib/sharedStore`). Avant, le hub ne le voyait jamais.
 */
interface CartRecoveryPopupProps {
  formation: Formation | null;
  checkoutPath: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function CartRecoveryPopup({ formation, checkoutPath, onAccept, onDismiss }: CartRecoveryPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        tone="edu"
        eyebrow={t('popups.cartRecovery.eyebrow')}
        title={t('popups.cartRecovery.title')}
        highlight={t('popups.cartRecovery.sticker')}
      />
      <p className={BODY}>{t('popups.cartRecovery.text')}</p>

      {formation && <FormationTile formation={formation} />}

      <div className={ACTIONS}>
        <LocalizedLink to={checkoutPath} onClick={onAccept} className={TONES.edu.cta}>
          {t('popups.cartRecovery.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.cartRecovery.dismiss')}
        </button>
      </div>
    </div>
  );
}
