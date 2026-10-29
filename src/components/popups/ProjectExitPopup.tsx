import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { TONES, ARROW, LINK, DISMISS, BODY, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Réalisations (hub, piste Conception) — NOUVELLE le 2026-10-29.
 *
 * L'action principale du site personnel selon le kit v3 : « Réserver un appel », en
 * `mm-btn is-club`, vers le même `/contact?rdv=1` que le bouton de la page. Vouvoiement.
 * Aucun chiffre, aucun logo : les fiches de projet font la preuve, la fenêtre n'en rajoute pas.
 */
interface ProjectExitPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function ProjectExitPopup({ onAccept, onSecondary, onDismiss }: ProjectExitPopupProps) {
  const { t } = useTranslation('shared');
  const tone = TONES.hub;

  return (
    <div>
      <PopupHeading
        tone="hub"
        eyebrow={t('popups.projectExit.eyebrow')}
        title={t('popups.projectExit.title')}
        highlight={t('popups.projectExit.sticker')}
      />
      <p className={BODY}>{t('popups.projectExit.text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to="/contact?rdv=1" onClick={onAccept} className={tone.cta}>
          {t('popups.projectExit.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        <LocalizedLink to="/conception/projets-sur-mesure" onClick={onSecondary} className={`${LINK} ${tone.link}`}>
          {t('popups.projectExit.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.projectExit.dismiss')}
        </button>
      </div>
    </div>
  );
}
