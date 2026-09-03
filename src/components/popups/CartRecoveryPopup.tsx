import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import TranslatedText from '../shared/TranslatedText';
import PopupHeading from './PopupHeading';
import { useFormat } from '../../hooks/useFormat';
import { CTA_BRAND, DISMISS, BODY, ACTIONS } from './popupStyles';
import type { Formation } from '../../types';
import { Icon } from '@ds';

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
  /* Séparateur de milliers selon la langue : espace insécable en français, virgule en
     anglais. `formatPrice` sans locale retombait sur `fr-FR` des deux côtés. */
  const { formatPrice } = useFormat();
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
        <div className="mt-3 wide:mt-6 flex items-start gap-3 wide:gap-4 wide:p-4 wide:rounded-2xl wide:border wide:border-white/10 wide:bg-surface-sheet/[0.03]">
          <span className="block shrink-0 overflow-hidden rounded-xl w-14 h-14 wide:w-20 wide:h-20">
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
              className="text-sm wide:text-base font-bold text-white leading-snug line-clamp-2"
            />
            {/*
              LA NOTE ET LE NOMBRE D'INSCRITS ONT ÉTÉ RETIRÉS D'ICI — 2026-09-02.

              Une étoile suivie de `formation.rating`, puis `formation.students`. Ce sont deux des
              interdits ABSOLUS du système, et le kit les formule à la première personne :
              « Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai
              rien d'honnête à en dire » (`Max-Morrys_DS_Platform/readme.md`).

              Ils avaient été purgés du catalogue, de la fiche, et explicitement de
              `FormationsEntryPopup` — dont le commentaire note qu'ils « survivaient sur le
              déclencheur le plus large du registre ». Ils survivaient aussi ICI, c'est-à-dire sur
              le déclencheur le PLUS PRIORITAIRE, que ce nettoyage avait manqué. Avec 5 comptes et
              2 inscriptions à 0 % de progression, ces deux nombres se prennent en défaut en trente
              secondes — devant le prospect le plus proche de l'achat de tout le site.

              Reste ce qui se prouve : le prix, et le prix barré s'il y a une promotion.
            */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
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
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.cartRecovery.dismiss')}
        </button>
      </div>
    </div>
  );
}
