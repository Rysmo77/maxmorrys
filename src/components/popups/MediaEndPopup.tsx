import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { TONES, ARROW, LINK, DISMISS, BODY, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Fin d'un podcast ou d'une vidéo — ces fiches sont des culs-de-sac : aucune suite proposée.
 *
 * ⚠️ Elle mène à la page PUBLIQUE du Club (club.maxmorrys.me), jamais à l'adhésion : qui vient de
 * regarder une vidéo gratuite n'est pas à un clic d'un engagement de douze mois. Ton `club` :
 * la fenêtre vit sur le hub, mais elle parle du Club, et le panneau dit où elle emmène.
 */
interface MediaEndPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function MediaEndPopup({ onAccept, onSecondary, onDismiss }: MediaEndPopupProps) {
  const { t } = useTranslation('shared');
  const tone = TONES.club;

  return (
    <div>
      <PopupHeading
        tone="club"
        eyebrow={t('popups.mediaEnd.eyebrow')}
        title={t('popups.mediaEnd.title')}
        highlight={t('popups.mediaEnd.sticker')}
      />
      <p className={BODY}>{t('popups.mediaEnd.text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to="/club-des-digitos" onClick={onAccept} className={tone.cta}>
          {t('popups.mediaEnd.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        {/* La sortie gratuite reste offerte : tout le pôle média est en accès libre. */}
        <LocalizedLink to="/podcast-et-videos" onClick={onSecondary} className={`${LINK} ${tone.link}`}>
          {t('popups.mediaEnd.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.mediaEnd.dismiss')}
        </button>
      </div>
    </div>
  );
}
