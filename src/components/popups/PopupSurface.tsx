import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import Modal from '../ui/Modal';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/utils';

/**
 * Surface d'affichage d'une pop-up contextuelle : modale centrée ou bandeau bas.
 *
 * ⚠️ **Le choix de surface est une contrainte SEO, pas une préférence esthétique.** Google
 * sanctionne les « interstitiels intrusifs » : une modale qui recouvre le contenu principal sur
 * mobile, peu après une arrivée depuis la recherche, dégrade le classement. Un bandeau occupant
 * une part raisonnable de l'écran est explicitement toléré. Toute pop-up susceptible de s'ouvrir
 * sur du trafic organique doit donc passer `mobileSurface="sheet"`.
 *
 * La modale réutilise `ui/Modal` telle quelle — piège de focus, Échap, verrouillage du scroll et
 * restitution du focus y sont déjà traités. Ne pas réimplémenter cette mécanique ici.
 */

interface PopupSurfaceProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Comportement sous `lg`. `'sheet'` affiche un bandeau bas non bloquant ; `'modal'` garde la
   * modale à toutes les tailles — réservé aux pop-ups déclenchées par une action du visiteur.
   */
  mobileSurface?: 'modal' | 'sheet';
}

export default function PopupSurface({
  open,
  onClose,
  title,
  children,
  size = 'lg',
  mobileSurface = 'modal',
}: PopupSurfaceProps) {
  const { t } = useTranslation('ui');
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();

  const asSheet = open && !isDesktop && mobileSurface === 'sheet';

  /*
    `ui/Modal` ne restitue le focus que sur une transition ouvert → fermé, jamais au démontage.
    Or `PopupManager` DÉMONTE la surface pour la fermer : sans ce filet, un visiteur au clavier
    qui appuie sur Échap se retrouverait avec le focus sur `<body>`, en haut de page.
  */
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      // `isConnected` : l'élément d'origine peut avoir disparu du DOM entre-temps.
      const previous = previousFocusRef.current;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  // Le bandeau ne piège pas le focus, mais Échap doit le fermer comme n'importe quel dialogue.
  useEffect(() => {
    if (!asSheet) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [asSheet, onClose]);

  if (asSheet) {
    return (
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-labelledby="popup-sheet-title"
        /*
          Ressort plutôt que le `animate-slide-up` CSS : le bandeau vient du bas de l'écran, un
          léger dépassement le fait exister comme un objet physique au lieu d'apparaître. Le
          ressort est amorti — il ne rebondit pas, il se pose.
        */
        initial={reduced ? false : { y: '100%' }}
        animate={reduced ? undefined : { y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className={cn(
          'fixed bottom-0 inset-x-0 z-50 max-h-[30vh] overflow-y-auto',
          'bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700',
          'shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)]',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="px-4 py-4 pr-12">
          <h2 id="popup-sheet-title" className="text-base font-bold text-neutral-900 dark:text-white leading-snug">
            {title}
          </h2>
          <div className="mt-2">{children}</div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={t('modal.close')}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </motion.div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      {children}
    </Modal>
  );
}
