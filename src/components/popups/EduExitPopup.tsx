import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { RYSMO_BASE_DAILY } from '../../lib/rysmo/quota';
import { TONES, ARROW, LINK, DISMISS, BODY, NOTE, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Accueil, méthode et catalogue de l'école (edu.) — NOUVELLE le 2026-10-29.
 *
 * Elle ne vend rien : elle nomme ce qu'un compte gratuit ouvre AUJOURD'HUI, deux faits que le
 * produit tient — la place gardée à l'ouverture des formations, et les questions quotidiennes à
 * l'assistant. Le nombre vient de `RYSMO_BASE_DAILY`, la constante que le quota applique :
 * aucun chiffre écrit à la main dans l'i18n.
 */
interface EduExitPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function EduExitPopup({ onAccept, onSecondary, onDismiss }: EduExitPopupProps) {
  const { t } = useTranslation('shared');
  const tone = TONES.edu;

  return (
    <div>
      <PopupHeading
        tone="edu"
        eyebrow={t('popups.eduExit.eyebrow')}
        title={t('popups.eduExit.title')}
        highlight={t('popups.eduExit.sticker')}
      />
      <p className={BODY}>{t('popups.eduExit.text', { count: RYSMO_BASE_DAILY })}</p>

      <div className={ACTIONS}>
        <LocalizedLink to="/inscription" onClick={onAccept} className={tone.cta}>
          {t('popups.eduExit.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        <LocalizedLink to="/apprendre/assistant" onClick={onSecondary} className={`${LINK} ${tone.link}`}>
          {t('popups.eduExit.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.eduExit.dismiss')}
        </button>
      </div>

      <p className={NOTE}>{t('popups.eduExit.note')}</p>
    </div>
  );
}
