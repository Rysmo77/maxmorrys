import { useTranslation } from 'react-i18next';
import { Layers, Store, GraduationCap, ArrowRight } from 'lucide-react';
import LocalizedLink from '../shared/LocalizedLink';

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
 * ⚠️ Les trois portes restent visuellement NEUTRES. `/agence` et `/presence-digitale` partagent
 * la teinte lagoon : deux cartes lagoon voisines ont déjà dû être fusionnées une fois parce
 * qu'elles se lisaient comme deux variantes d'une même offre. Ici, ce sont des lignes de menu.
 */

interface AudienceRouterPopupProps {
  onChoose: (destination: 'build' | 'presence' | 'learn') => void;
  onContinue: () => void;
}

const doorCls = 'group flex items-center gap-4 w-full text-left p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
const iconBoxCls = 'w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-200';
const labelCls = 'text-sm font-bold text-neutral-900 dark:text-white leading-snug';
const descCls = 'mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed';
const arrowCls = 'w-4 h-4 shrink-0 text-neutral-400 group-hover:translate-x-1 transition-transform';

export default function AudienceRouterPopup({ onChoose, onContinue }: AudienceRouterPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {t('popups.agencyExit.intro')}
      </p>

      <div className="mt-5 space-y-2.5">
        {/*
          Porte BUILD : le visiteur est déjà au bon endroit. Ancre interne vers le formulaire de
          qualification — `#projet` est un id fixe de `Agence.tsx`, identique en FR et en EN.
        */}
        <a href="#projet" onClick={() => onChoose('build')} className={doorCls}>
          <span className={iconBoxCls}>
            <Layers className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className={`block ${labelCls}`}>{t('popups.agencyExit.buildLabel')}</span>
            <span className={`block ${descCls}`}>{t('popups.agencyExit.buildDesc')}</span>
          </span>
          <ArrowRight className={arrowCls} aria-hidden="true" />
        </a>

        <LocalizedLink to="/presence-digitale" onClick={() => onChoose('presence')} className={doorCls}>
          <span className={iconBoxCls}>
            <Store className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className={`block ${labelCls}`}>{t('popups.agencyExit.presenceLabel')}</span>
            <span className={`block ${descCls}`}>{t('popups.agencyExit.presenceDesc')}</span>
          </span>
          <ArrowRight className={arrowCls} aria-hidden="true" />
        </LocalizedLink>

        <LocalizedLink to="/formations" onClick={() => onChoose('learn')} className={doorCls}>
          <span className={iconBoxCls}>
            <GraduationCap className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className={`block ${labelCls}`}>{t('popups.agencyExit.learnLabel')}</span>
            <span className={`block ${descCls}`}>{t('popups.agencyExit.learnDesc')}</span>
          </span>
          <ArrowRight className={arrowCls} aria-hidden="true" />
        </LocalizedLink>
      </div>

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
