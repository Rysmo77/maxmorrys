import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Layers, Store, GraduationCap, ArrowRight } from 'lucide-react';
import LocalizedLink from '../shared/LocalizedLink';
import { staggerContainer, staggerItem } from '../../lib/animations';

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
 * ⚠️ **Chaque porte porte la signature visuelle de sa DESTINATION**, jamais une couleur décorative.
 * `/agence` et `/presence-digitale` partagent la teinte lagoon : deux cartes lagoon identiques ont
 * déjà dû être fusionnées une fois parce qu'elles se lisaient comme deux variantes d'une même
 * offre. La distinction passe donc par la FORME — lagoon en aplat doux pour l'agence, lagoon en
 * aplat plein (la signature de la présence digitale sur la page d'accueil) pour le commerce, bleu
 * `brand` pour les formations. Ne pas uniformiser ces trois traitements.
 */

interface AudienceRouterPopupProps {
  onChoose: (destination: 'build' | 'presence' | 'learn') => void;
  onContinue: () => void;
}

const doorCls = 'group flex items-center gap-4 w-full text-left p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
const iconBoxCls = 'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3';
const labelCls = 'block text-sm font-bold text-neutral-900 dark:text-white leading-snug';
const descCls = 'block mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed';
const arrowCls = 'w-4 h-4 shrink-0 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:translate-x-1 transition-all duration-300';

/** Signature de la destination. Chaînes littérales : Tailwind purge tout nom construit. */
const BUILD_TILE = 'bg-lagoon-50 dark:bg-lagoon-900/30 text-lagoon-700 dark:text-lagoon-400';
const PRESENCE_TILE = 'bg-lagoon-500 text-neutral-900';
const LEARN_TILE = 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400';

export default function AudienceRouterPopup({ onChoose, onContinue }: AudienceRouterPopupProps) {
  const { t } = useTranslation('shared');
  const reduced = useReducedMotion();

  const containerProps = reduced
    ? {}
    : { variants: staggerContainer, initial: 'hidden' as const, animate: 'visible' as const };
  const itemProps = reduced ? {} : { variants: staggerItem };

  return (
    <div>
      {/*
        Filet lumineux décoratif : la seule respiration graphique de la fenêtre. Il balaie une
        fois à l'ouverture, puis s'arrête — une boucle infinie tirerait l'œil hors des portes,
        qui sont le vrai sujet.
      */}
      <div className="h-1 -mt-2 mb-5 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800" aria-hidden="true">
        <motion.div
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-lagoon-400 via-brand-500 to-lagoon-400"
          initial={reduced ? false : { x: '-100%' }}
          animate={reduced ? undefined : { x: '200%' }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {t('popups.agencyExit.intro')}
      </p>

      <motion.div className="mt-5 space-y-2.5" {...containerProps}>
        {/*
          Porte BUILD : le visiteur est déjà au bon endroit. Ancre interne vers le formulaire de
          qualification — `#projet` est un id fixe de `Agence.tsx`, identique en FR et en EN.
        */}
        <motion.div {...itemProps}>
          <a href="#projet" onClick={() => onChoose('build')} className={doorCls}>
            <span className={`${iconBoxCls} ${BUILD_TILE}`}>
              <Layers className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={labelCls}>{t('popups.agencyExit.buildLabel')}</span>
              <span className={descCls}>{t('popups.agencyExit.buildDesc')}</span>
            </span>
            <ArrowRight className={arrowCls} aria-hidden="true" />
          </a>
        </motion.div>

        <motion.div {...itemProps}>
          <LocalizedLink to="/presence-digitale" onClick={() => onChoose('presence')} className={doorCls}>
            <span className={`${iconBoxCls} ${PRESENCE_TILE}`}>
              <Store className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={labelCls}>{t('popups.agencyExit.presenceLabel')}</span>
              <span className={descCls}>{t('popups.agencyExit.presenceDesc')}</span>
            </span>
            <ArrowRight className={arrowCls} aria-hidden="true" />
          </LocalizedLink>
        </motion.div>

        <motion.div {...itemProps}>
          <LocalizedLink to="/formations" onClick={() => onChoose('learn')} className={doorCls}>
            <span className={`${iconBoxCls} ${LEARN_TILE}`}>
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={labelCls}>{t('popups.agencyExit.learnLabel')}</span>
              <span className={descCls}>{t('popups.agencyExit.learnDesc')}</span>
            </span>
            <ArrowRight className={arrowCls} aria-hidden="true" />
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
        className="mt-5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
      >
        {t('popups.agencyExit.continue')}
      </button>
    </div>
  );
}
