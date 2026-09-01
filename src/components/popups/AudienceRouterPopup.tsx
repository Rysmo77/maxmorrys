import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import LocalizedLink from '../shared/LocalizedLink';
import { staggerContainer, staggerItem } from '../../lib/animations';
import { Icon } from '@ds';

/**
 * Aiguilleur d'audience présenté quand un visiteur s'apprête à quitter `/agence`.
 *
 * ⚠️ **Ce n'est délibérément PAS une mise en avant d'offre.** `/agence` porte la practice BUILD,
 * high-ticket, sans grille tarifaire publique, et son formulaire sert à FILTRER les demandes
 * (`docs/AGENCY-POSITIONING.md §7`). Afficher des packs à 295 000 XOF au fondateur qui s'en va
 * abîmerait ce positionnement. La pop-up pose donc une question d'audience et laisse le visiteur
 * se qualifier lui-même.
 *
 * ⚠️ **Les libellés sont à la PREMIÈRE PERSONNE**, et c'est structurel. `/agence` vouvoie,
 * `/presence-digitale` et les formations tutoient (`docs/UX-AUDIT.md §2`) : faire parler le
 * visiteur (« Je veux… ») est le seul moyen de proposer les trois destinations dans une même
 * fenêtre sans casser le registre de l'une d'elles.
 *
 * ⚠️ **Chaque porte porte la signature de sa DESTINATION**, jamais une couleur décorative.
 * `/agence` et `/presence-digitale` partagent la teinte lagoon : deux cartes lagoon identiques
 * ont déjà dû être fusionnées une fois parce qu'elles se lisaient comme deux variantes de la même
 * offre. Sur fond sombre la distinction passe par la FORME — contour lagoon pour l'agence, aplat
 * lagoon plein pour le commerce, bleu `brand` pour les formations.
 */

interface AudienceRouterPopupProps {
  onChoose: (destination: 'build' | 'presence' | 'learn') => void;
  onContinue: () => void;
}

const doorCls = 'group flex items-center gap-4 w-full text-left p-4 rounded-2xl border border-white/10 bg-surface-sheet/[0.03] hover:bg-surface-sheet/[0.07] hover:border-[color-mix(in_srgb,var(--mm-teal)_50%,transparent)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition duration-300 focus:outline-none focus-visible:ring-2';
const iconBoxCls = 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3';
const labelCls = 'block text-sm font-bold text-white leading-snug';
const descCls = 'block mt-0.5 text-xs text-white/50 leading-relaxed';
const arrowCls = 'w-4 h-4 shrink-0 text-white/30 group-hover:text-digitalise-txt group-hover:translate-x-1 transition duration-300';

/** Signatures de destination. Chaînes littérales : Tailwind purge tout nom construit. */
const BUILD_TILE = 'border border-[color-mix(in_srgb,var(--mm-teal)_40%,transparent)] text-digitalise-txt';
const PRESENCE_TILE = 'bg-[color:var(--mm-teal)] text-ink';
const LEARN_TILE = 'bg-[color-mix(in_srgb,var(--mm-bleu)_15%,transparent)] text-forme';

export default function AudienceRouterPopup({ onChoose, onContinue }: AudienceRouterPopupProps) {
  const { t } = useTranslation('shared');
  const reduced = useReducedMotion();

  const containerProps = reduced
    ? {}
    : { variants: staggerContainer, initial: 'hidden' as const, animate: 'visible' as const };
  const itemProps = reduced ? {} : { variants: staggerItem };

  return (
    <div>
      <p className="text-[0.625rem] font-bold tracking-[0.3em] uppercase text-digitalise-txt">
        {t('popups.agencyExit.eyebrow')}
      </p>

      {/*
        Titre d'affichage : le site n'embarque aucune fonte condensée, son idiome de titrage est
        `font-black` + interlettrage resserré (voir `fontSize.heading-hero` de la config Tailwind).
        Le pastille pivotée chevauche volontairement la dernière ligne.
      */}
      <div className="relative mt-3 pr-16 sm:pr-24">
        <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-[0.95] text-balance">
          {t('popups.agencyExit.title')}
        </h2>
        <motion.span
          initial={reduced ? false : { scale: 0.4, rotate: 0, opacity: 0 }}
          animate={reduced ? undefined : { scale: 1, rotate: -8, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 320, damping: 14 }}
          className="absolute -top-1 right-0 sm:right-4 inline-block px-3 py-1.5 rounded-md bg-[color:var(--mm-teal)] text-ink text-xs font-black uppercase tracking-wide shadow-digitalise -rotate-6"
        >
          {t('popups.agencyExit.sticker')}
        </motion.span>
      </div>

      <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-md">
        {t('popups.agencyExit.intro')}
      </p>

      <motion.div className="mt-7 space-y-2.5" {...containerProps}>
        {/*
          Porte BUILD : le visiteur est déjà au bon endroit. Ancre interne vers le formulaire de
          qualification — `#projet` est un id fixe de `Agence.tsx`, identique en FR et en EN.
        */}
        <motion.div {...itemProps}>
          <a href="#projet" onClick={() => onChoose('build')} className={doorCls}>
            <span className={`${iconBoxCls} ${BUILD_TILE}`}>
              <Icon name="layers" size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={labelCls}>{t('popups.agencyExit.buildLabel')}</span>
              <span className={descCls}>{t('popups.agencyExit.buildDesc')}</span>
            </span>
            <Icon name="forward" className={arrowCls} />
          </a>
        </motion.div>

        <motion.div {...itemProps}>
          <LocalizedLink to="/presence-digitale" onClick={() => onChoose('presence')} className={doorCls}>
            <span className={`${iconBoxCls} ${PRESENCE_TILE}`}>
              <Icon name="store" size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={labelCls}>{t('popups.agencyExit.presenceLabel')}</span>
              <span className={descCls}>{t('popups.agencyExit.presenceDesc')}</span>
            </span>
            <Icon name="forward" className={arrowCls} />
          </LocalizedLink>
        </motion.div>

        <motion.div {...itemProps}>
          <LocalizedLink to="/formations" onClick={() => onChoose('learn')} className={doorCls}>
            <span className={`${iconBoxCls} ${LEARN_TILE}`}>
              <Icon name="graduation" size={20} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={labelCls}>{t('popups.agencyExit.learnLabel')}</span>
              <span className={descCls}>{t('popups.agencyExit.learnDesc')}</span>
            </span>
            <Icon name="forward" className={arrowCls} />
          </LocalizedLink>
        </motion.div>
      </motion.div>

      {/*
        Sortie neutre, toujours offerte. Quand la pop-up a intercepté une navigation, c'est elle
        qui la reprend — un blocage sans issue lisible serait un dark pattern.
      */}
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 text-xs font-semibold text-white/40 hover:text-white/80 transition-colors focus:outline-none focus-visible:ring-2 rounded"
      >
        {t('popups.agencyExit.continue')}
      </button>
    </div>
  );
}
