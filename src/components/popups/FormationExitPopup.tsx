import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { TONES, ARROW, DISMISS, BODY, ACTIONS, TILE, TILE_ICON, TILE_LABEL, TILE_DESC, TILE_ARROW } from './popupStyles';
import { Icon } from '@ds';

/**
 * Retenue sur une fiche formation (edu.) — le moment de plus forte intention d'achat du site.
 *
 * DEUX ÉTATS depuis le 2026-10-29, parce que les formations publiées sont « Bientôt » :
 *
 *   · `open`  la formation est en vente → « Je m'inscris », droit au tunnel de paiement.
 *             L'ancien bouton disait « Reprendre la formation » à quelqu'un qui ne l'avait pas
 *             commencée, et la ramenait sur la page qu'il quittait.
 *   · `soon`  elle est annoncée → « Être prévenu·e à l'ouverture » (un compte garde la place),
 *             exactement le geste que la fiche propose à un visiteur déconnecté. L'ancien texte
 *             promettait « commence aujourd'hui » sur une formation qu'on ne peut pas acheter.
 *
 * La pastille « Sans risque » est retirée : elle frôlait la promesse de remboursement que les
 * CGV (art. 6) excluent (kit v3, D-13).
 *
 * Le renvoi vers le Club mène à sa page PUBLIQUE, plus à l'espace gardé, et ne prétend plus
 * qu'il « contient toutes les formations » : il offre une remise sur chacune.
 */
interface FormationExitPopupProps {
  mode: 'open' | 'soon';
  checkoutPath: string;
  onAccept: () => void;
  onClub: () => void;
  onDismiss: () => void;
}

export default function FormationExitPopup({ mode, checkoutPath, onAccept, onClub, onDismiss }: FormationExitPopupProps) {
  const { t } = useTranslation('shared');
  const k = (key: string) => t(`popups.formationExit.${mode}.${key}`);

  return (
    <div>
      <PopupHeading tone="edu" eyebrow={k('eyebrow')} title={k('title')} highlight={mode === 'soon' ? k('sticker') : undefined} />
      <p className={BODY}>{k('text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to={mode === 'open' ? checkoutPath : '/inscription'} onClick={onAccept} className={TONES.edu.cta}>
          {k('cta')}
          <span className={ARROW}><Icon name="forward" size={16} /></span>
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.formationExit.dismiss')}
        </button>
      </div>

      {/* Le Club, en second et en retrait : il élargit sans détourner. Masqué sous `wide`. */}
      <LocalizedLink to="/club-des-digitos" onClick={onClub} className={`${TILE} mt-6 hidden wide:flex`}>
        <span className={`${TILE_ICON} ${TONES.club.tint}`}><Icon name="sparkles" size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className={TILE_LABEL}>{t('popups.formationExit.clubLabel')}</span>
          <span className={TILE_DESC}>{t('popups.formationExit.clubDesc')}</span>
        </span>
        <Icon name="forward" size={16} className={TILE_ARROW} />
      </LocalizedLink>
    </div>
  );
}
