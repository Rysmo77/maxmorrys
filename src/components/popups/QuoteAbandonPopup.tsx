import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { whatsappUrl } from '../../lib/presence/whatsapp';
import { CTA_LAGOON, DISMISS, BODY, ACTIONS, LINK_LAGOON } from './popupStyles';
import { Icon } from '@ds';

/**
 * Devis commencé, jamais envoyé.
 *
 * ── CE QUI LA DISTINGUE DE `presenceExit` ────────────────────────────────────────────────
 *
 * Les deux vivent sur `/presence-digitale` et se déclenchent à la sortie. Mais celle-ci ne
 * s'adresse qu'à quelqu'un qui a ENGAGÉ le simulateur : il a commencé à décrire son commerce,
 * et il s'arrête. Sa voisine présente l'offre à qui ne la connaît pas encore ; ici, l'offre est
 * connue — ce qui manque, c'est de finir.
 *
 * Le registre la place donc AVANT, sans quoi la fenêtre générique gagnerait toujours la course
 * et parlerait à ce prospect comme au premier venu.
 *
 * ⚠️ ELLE NE REDIT PAS LES PRIX. Ils sont publics, affichés sur la page, et la personne vient
 * de les parcourir. Redire ce qu'on vient de lire est ce que `BlogEndPopup` documente avoir
 * arrêté de faire.
 *
 * ⚠️ DEUX SORTIES, DEUX CANAUX RÉELS. Reprendre le formulaire là où il en est — l'état vit
 * dans la page, la fenêtre ne l'efface pas — ou passer sur WhatsApp, qui est le canal natif du
 * commerçant (`docs/AGENCY-POSITIONING.md §9`). Aucun des deux n'invente d'engagement.
 *
 * Registre : tutoiement, celui de la page qui la porte.
 */

interface QuoteAbandonPopupProps {
  onResume: () => void;
  onWhatsapp: () => void;
  onDismiss: () => void;
}

export default function QuoteAbandonPopup({ onResume, onWhatsapp, onDismiss }: QuoteAbandonPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.quoteAbandon.eyebrow')}
        title={t('popups.quoteAbandon.title')}
        sticker={t('popups.quoteAbandon.sticker')}
        tone="lagoon"
      />

      <p className={BODY}>{t('popups.quoteAbandon.text')}</p>

      <div className={ACTIONS}>
        {/* Le formulaire est sur cette page : l'ancre y ramène sans rien perdre de ce qui
            a déjà été saisi. */}
        <LocalizedLink to="/presence-digitale#devis" onClick={onResume} className={CTA_LAGOON}>
          {t('popups.quoteAbandon.cta')}
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsapp}
          className={LINK_LAGOON}
        >
          {t('popups.quoteAbandon.secondary')}
        </a>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.quoteAbandon.dismiss')}
        </button>
      </div>
    </div>
  );
}
