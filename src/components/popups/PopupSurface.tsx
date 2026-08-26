import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { cn } from '../../lib/utils';

/**
 * Surface d'affichage d'une pop-up contextuelle : dialogue éditorial ou bandeau bas.
 *
 * ⚠️ **Le choix de surface est une contrainte SEO, pas une préférence esthétique.** Google
 * sanctionne les « interstitiels intrusifs » : un dialogue qui recouvre le contenu principal sur
 * mobile, peu après une arrivée depuis la recherche, dégrade le classement. Un bandeau occupant
 * une part raisonnable de l'écran est explicitement toléré. Toute pop-up susceptible de s'ouvrir
 * sur du trafic organique doit donc passer `mobileSurface="sheet"`.
 *
 * ⚠️ **La surface est SOMBRE dans les deux thèmes, délibérément.** Ce n'est pas un oubli de
 * `dark:` : `/agence` ouvre et referme déjà sur `bg-neutral-950 text-white` quel que soit le
 * thème. Ces fenêtres sont des respirations éditoriales, pas des boîtes de dialogue système.
 *
 * ⚠️ N'utilise PAS `ui/Modal` : cette carte claire impose `bg-white` et une gouttière `p-6`,
 * incompatibles avec une composition en deux colonnes à fond perdu. La mécanique d'accessibilité
 * est reprise via `useDialogA11y`, pas réécrite.
 */

interface PopupSurfaceProps {
  open: boolean;
  onClose: () => void;
  /** Titre accessible. Le titre VISIBLE est composé par le contenu, en très grand. */
  title: string;
  children: ReactNode;
  /** Panneau de droite, à fond perdu. Masqué sous `lg` — jamais porteur d'information seule. */
  media?: ReactNode;
  /**
   * Comportement sous `lg`. `'sheet'` affiche un bandeau bas non bloquant ; `'modal'` garde le
   * dialogue à toutes les tailles — réservé aux pop-ups déclenchées par une action du visiteur.
   */
  mobileSurface?: 'modal' | 'sheet';
}

const closeBtnCls = 'absolute top-4 right-4 z-20 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-400';

export default function PopupSurface({
  open,
  onClose,
  title,
  children,
  media,
  mobileSurface = 'modal',
}: PopupSurfaceProps) {
  const { t } = useTranslation('ui');
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();
  const asSheet = open && !isDesktop && mobileSurface === 'sheet';
  // Le bandeau est non-modal : ni verrouillage du scroll, ni piège de focus. Voir `useDialogA11y`.
  const containerRef = useDialogA11y(open, onClose, !asSheet);
  // `ReactNode` accepte `0` et `''` : sans ce booléen, une valeur falsy se rendrait telle quelle.
  const hasMedia = Boolean(media);

  if (!open) return null;

  if (asSheet) {
    return (
      <motion.div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        /*
          Ressort plutôt qu'une animation CSS : le bandeau vient du bas de l'écran, un ressort
          amorti le fait se POSER au lieu d'apparaître.
        */
        initial={reduced ? false : { y: '100%' }}
        animate={reduced ? undefined : { y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className={cn(
          'fixed bottom-0 inset-x-0 z-50 max-h-[30vh] overflow-y-auto focus:outline-none',
          'bg-neutral-950 text-white border-t border-white/10',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.6)]',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="px-4 py-4 pr-12">{children}</div>
        <button onClick={onClose} className={closeBtnCls} aria-label={t('modal.close')}>
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        initial={reduced ? false : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative w-full max-w-5xl max-h-[92vh] overflow-y-auto focus:outline-none',
          'bg-neutral-950 text-white sm:rounded-3xl',
          'shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10',
        )}
      >
        <button onClick={onClose} className={closeBtnCls} aria-label={t('modal.close')}>
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/*
          Le média n'occupe une colonne qu'à partir de `lg`. Sous ce seuil il disparaît :
          l'empiler au-dessus du contenu repousserait l'action sous la ligne de flottaison.
        */}
        <div className={cn('grid', hasMedia && 'lg:grid-cols-[1.05fr_0.95fr]')}>
          <div className="p-6 sm:p-9 lg:p-11 min-w-0">{children}</div>
          {hasMedia && (
            <div className="relative hidden lg:block overflow-hidden lg:rounded-r-3xl" aria-hidden="true">
              {media}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
