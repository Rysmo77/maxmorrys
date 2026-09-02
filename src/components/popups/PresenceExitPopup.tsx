import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { whatsappUrl } from '../../lib/presence/whatsapp';
import { CTA_LAGOON, DISMISS, BODY, ACTIONS, LINK_LAGOON } from './popupStyles';
import { Icon } from '@ds';

/**
 * Miroir commerçant de l'aiguilleur : retenue à la sortie de `/presence-digitale`.
 *
 * Le CTA ouvre WhatsApp plutôt qu'un formulaire. Ce n'est pas une commodité : l'ICP de cette offre
 * est un commerçant de proximité qui traite déjà tout son commerce sur WhatsApp
 * (`docs/AGENCY-POSITIONING.md §9`). Lui demander de remplir un formulaire web serait lui imposer
 * un canal qui n'est pas le sien.
 *
 * Registre : tutoiement — c'est celui de `/presence-digitale`, et il ne change pas ici.
 */

interface PresenceExitPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function PresenceExitPopup({ onAccept, onSecondary, onDismiss }: PresenceExitPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.presenceExit.eyebrow')}
        title={t('popups.presenceExit.title')}
        sticker={t('popups.presenceExit.sticker')}
        tone="lagoon"
      />

      <p className={BODY}>{t('popups.presenceExit.text')}</p>

      <div className={ACTIONS}>
        {/*
          `whatsappUrl()` sans message : le visiteur n'a rien simulé, on ne préremplit donc pas un
          devis qu'il n'a pas formulé. Le message vide le laisse décrire son commerce lui-même.
        */}
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAccept}
          className={CTA_LAGOON}
        >
          {t('popups.presenceExit.cta')}
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </a>
        <LocalizedLink
          to="/presence-digitale#packs"
          onClick={onSecondary}
          className={LINK_LAGOON}
        >
          {t('popups.presenceExit.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.presenceExit.dismiss')}
        </button>
      </div>
    </div>
  );
}
