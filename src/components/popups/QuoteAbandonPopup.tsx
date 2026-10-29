import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { whatsappUrl } from '../../lib/presence/whatsapp';
import { TONES, ARROW, LINK, DISMISS, BODY, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Devis commencé, jamais envoyé : la reprise de panier de l'offre commerçants.
 *
 * ⚠️ Corrigé le 2026-10-29 : l'action principale visait `#devis`, une ancre qui n'existait plus
 * depuis la refonte de la page — le bouton refermait la fenêtre et ne menait nulle part. La
 * section du formulaire porte de nouveau `id="devis"` (`PresenceDigitale.tsx`).
 */
interface QuoteAbandonPopupProps {
  onResume: () => void;
  onWhatsapp: () => void;
  onDismiss: () => void;
}

export default function QuoteAbandonPopup({ onResume, onWhatsapp, onDismiss }: QuoteAbandonPopupProps) {
  const { t } = useTranslation('shared');
  const tone = TONES.studio;

  return (
    <div>
      <PopupHeading
        tone="studio"
        eyebrow={t('popups.quoteAbandon.eyebrow')}
        title={t('popups.quoteAbandon.title')}
        highlight={t('popups.quoteAbandon.sticker')}
      />
      <p className={BODY}>{t('popups.quoteAbandon.text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to="/conception/commerces-et-tpe#devis" onClick={onResume} className={tone.cta}>
          {t('popups.quoteAbandon.cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" onClick={onWhatsapp} className={`${LINK} ${tone.link}`}>
          {t('popups.quoteAbandon.secondary')}
        </a>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.quoteAbandon.dismiss')}
        </button>
      </div>
    </div>
  );
}
