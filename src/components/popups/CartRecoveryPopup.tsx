import { useTranslation } from 'react-i18next';
import { ArrowRight, Star, Users } from 'lucide-react';
import LocalizedLink from '../shared/LocalizedLink';
import TranslatedText from '../shared/TranslatedText';
import PopupHeading from './PopupHeading';
import { formatPrice } from '../../lib/utils';
import { CTA_BRAND, DISMISS, BODY, ACTIONS } from './popupStyles';
import type { Formation } from '../../types';

/**
 * Reprise d'un tunnel de paiement abandonné.
 *
 * ⚠️ Cette fenêtre ne s'affiche JAMAIS dans le tunnel lui-même — `isCheckoutPath` l'exclut de
 * `/checkout/*` et `/paiement/*` dans le registre. Interrompre quelqu'un en train de payer serait
 * le pire résultat que ce dispositif puisse produire.
 *
 * La formation peut être `null` : le marqueur retient un slug, pas un document. Si le catalogue ne
 * répond pas ou si la formation a été dépubliée, la fenêtre reste utile avec son texte seul plutôt
 * que d'échouer en silence.
 */

interface CartRecoveryPopupProps {
  formation: Formation | null;
  /** Chemin de reprise du paiement, déjà localisé. */
  checkoutPath: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function CartRecoveryPopup({
  formation, checkoutPath, onAccept, onDismiss,
}: CartRecoveryPopupProps) {
  const { t } = useTranslation('shared');
  const price = formation ? formation.promoPrice ?? formation.price : null;

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.cartRecovery.eyebrow')}
        title={t('popups.cartRecovery.title')}
        sticker={t('popups.cartRecovery.sticker')}
        tone="brand"
      />

      <p className={BODY}>{t('popups.cartRecovery.text')}</p>

      {formation && (
        <div className="mt-3 lg:mt-6 flex items-start gap-3 lg:gap-4 lg:p-4 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/[0.03]">
          <span className="block shrink-0 overflow-hidden rounded-xl w-14 h-14 lg:w-20 lg:h-20">
            <img
              src={formation.coverImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <TranslatedText
              text={formation.title}
              as="p"
              className="text-sm lg:text-base font-bold text-white leading-snug line-clamp-2"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
              {formation.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-accent-400" fill="currentColor" aria-hidden="true" />
                  {formation.rating.toFixed(1)}
                </span>
              )}
              {formation.students > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  {formation.students}
                </span>
              )}
              {price !== null && (
                <span className="font-bold text-white">{formatPrice(price)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={ACTIONS}>
        <LocalizedLink to={checkoutPath} onClick={onAccept} className={CTA_BRAND}>
          {t('popups.cartRecovery.cta')}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.cartRecovery.dismiss')}
        </button>
      </div>
    </div>
  );
}
