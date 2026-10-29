import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { whatsappUrl } from '../../lib/presence/whatsapp';
import { TONES, ARROW, LINK, DISMISS, BODY, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Retenue sur l'offre commerçants (`/conception/commerces-et-tpe`). L'étage commerçants de la
 * piste Conception TUTOIE (kit v3, « Voix par piste ») ; la page mère, elle, vouvoie.
 */
interface PresenceExitPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function PresenceExitPopup({ onAccept, onSecondary, onDismiss }: PresenceExitPopupProps) {
  const { t } = useTranslation('shared');
  const tone = TONES.studio;

  return (
    <div>
      <PopupHeading
        tone="studio"
        eyebrow={t('popups.presenceExit.eyebrow')}
        title={t('popups.presenceExit.title')}
        highlight={t('popups.presenceExit.sticker')}
      />
      <p className={BODY}>{t('popups.presenceExit.text')}</p>

      <div className={ACTIONS}>
        {/* Sans message prérempli : le visiteur n'a rien simulé, il décrit son commerce lui-même. */}
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" onClick={onAccept} className={tone.cta}>
          {t('popups.presenceExit.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </a>
        <LocalizedLink to="/conception/commerces-et-tpe#packs" onClick={onSecondary} className={`${LINK} ${tone.link}`}>
          {t('popups.presenceExit.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.presenceExit.dismiss')}
        </button>
      </div>
    </div>
  );
}
