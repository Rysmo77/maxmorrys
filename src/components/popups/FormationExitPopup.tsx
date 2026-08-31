import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { CTA_BRAND, DISMISS, BODY, ACTIONS } from './popupStyles';
import { Icon } from '@ds';

/**
 * Retenue sur une fiche formation — le moment de plus forte intention d'achat du site.
 *
 * Deux issues volontairement inégales : revenir à la formation consultée (l'intention exprimée) ou
 * découvrir le Club, qui donne accès à tout. Le Club est présenté en SECOND et en retrait : le
 * proposer d'abord détournerait un visiteur déjà décidé sur une formation précise vers une offre
 * plus large qu'il n'a pas demandée.
 *
 * Registre : tutoiement — territoire LEARN (`docs/UX-AUDIT.md §2`).
 */

interface FormationExitPopupProps {
  /** Chemin de la formation consultée, déjà localisé. */
  formationPath: string;
  onAccept: () => void;
  onClub: () => void;
  onDismiss: () => void;
}

export default function FormationExitPopup({
  formationPath, onAccept, onClub, onDismiss,
}: FormationExitPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.formationExit.eyebrow')}
        title={t('popups.formationExit.title')}
        sticker={t('popups.formationExit.sticker')}
        tone="brand"
      />

      <p className={BODY}>{t('popups.formationExit.text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to={formationPath} onClick={onAccept} className={CTA_BRAND}>
          {t('popups.formationExit.cta')}
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.formationExit.dismiss')}
        </button>
      </div>

      {/* Le Club, en second et en retrait : il élargit sans détourner. */}
      <LocalizedLink
        to="/mon-espace/club"
        onClick={onClub}
        className="group mt-5 lg:mt-7 hidden lg:flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-paper/[0.03] hover:bg-paper/[0.07] hover:border-[color-mix(in_srgb,var(--mm-violet)_50%,transparent)] transition duration-300 focus:outline-none focus-visible:ring-2"
      >
        <span className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--mm-violet)_15%,transparent)] text-transforme flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
          <Icon name="sparkles" size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-white leading-snug">
            {t('popups.formationExit.clubLabel')}
          </span>
          <span className="block mt-0.5 text-xs text-white/50 leading-relaxed">
            {t('popups.formationExit.clubDesc')}
          </span>
        </span>
        <Icon name="forward" size={16} className="shrink-0 text-white/30 group-hover:text-transforme group-hover:translate-x-1 transition duration-300" />
      </LocalizedLink>
    </div>
  );
}
