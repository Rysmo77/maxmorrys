import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { TONES, ARROW, LINK, DISMISS, BODY, NOTE, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Retenue sur les pages publiques du Club (club.maxmorrys.me).
 *
 * Elle ne redit ni le prix ni le contenu de l'adhésion — la page les affiche. Son seul objet :
 * nommer l'étape que la page CACHE. Le bouton d'`/adhesion` mène à l'espace du Club, qui exige
 * un compte ; un visiteur déconnecté y rencontre un mur sans avoir été prévenu.
 */
interface ClubExitPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function ClubExitPopup({ onAccept, onSecondary, onDismiss }: ClubExitPopupProps) {
  const { t } = useTranslation('shared');
  const tone = TONES.club;

  return (
    <div>
      <PopupHeading
        tone="club"
        eyebrow={t('popups.clubExit.eyebrow')}
        title={t('popups.clubExit.title')}
        highlight={t('popups.clubExit.sticker')}
      />
      <p className={BODY}>{t('popups.clubExit.text')}</p>

      <div className={ACTIONS}>
        {/* `/inscription` est servie sur chaque hôte : on crée son compte sur le Club même. */}
        <LocalizedLink to="/inscription" onClick={onAccept} className={tone.cta}>
          {t('popups.clubExit.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        {/* Pour qui a DÉJÀ un compte : l'espace du Club, seul endroit où l'adhésion se crée. */}
        <LocalizedLink to="/mon-espace/club" onClick={onSecondary} className={`${LINK} ${tone.link}`}>
          {t('popups.clubExit.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.clubExit.dismiss')}
        </button>
      </div>

      {/* La contrainte, nommée : le produit ne cache pas que la marche existe. */}
      <p className={NOTE}>{t('popups.clubExit.note')}</p>
    </div>
  );
}
