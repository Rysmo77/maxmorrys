import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { cn } from '../../lib/utils';
import { Icon } from '@ds';

/**
 * Surface d'une pop-up contextuelle : dialogue, ou feuille basse sur mobile — kit v3.
 *
 * ⚠️ **Le choix de surface mobile est une contrainte SEO, pas une préférence.** Google sanctionne
 * les « interstitiels intrusifs » : un dialogue qui recouvre le contenu sur mobile, peu après une
 * arrivée depuis la recherche, dégrade le classement. Une feuille basse raisonnable est tolérée.
 * Toute pop-up susceptible de s'ouvrir sur du trafic organique passe `mobileSurface="sheet"`.
 *
 * ── KIT V3 (29/10/2026) ─────────────────────────────────────────────────────────────────────
 *
 *   · Surface `bento` OPAQUE qui suit le thème (« Menus, tiroirs : opaques, sur un voile »).
 *     La surface nuit forcée dans les deux thèmes est abandonnée : elle obligeait chaque jeton à
 *     une variante nuit et avait produit trois défauts de contraste.
 *   · Voile `--veil`, SANS flou : « Un seul flou par écran : le chrome fixe ». L'ancien voile
 *     `backdrop-blur-md` à 80 % de noir en était un second, plein écran.
 *   · Entrée `mm-pop-in` (`t-enter`, `ease-out`) ; la feuille monte sur un ressort amorti.
 *   · Croix en `mm-iconbtn` : 44 px, la cible tactile du kit. L'ancienne en faisait 32.
 *   · Rayon 28 px pour le dialogue (le rayon des grandes cartes promotionnelles du kit),
 *     24 px en haut de la feuille, avec sa poignée.
 *
 * ⚠️ N'utilise PAS `Modal` du système : sa gouttière unique est incompatible avec une
 * composition en deux colonnes dont le panneau est à fond perdu. L'accessibilité est reprise
 * via `useDialogA11y`, pas réécrite.
 */

interface PopupSurfaceProps {
  open: boolean;
  onClose: () => void;
  /** Titre accessible. Le titre VISIBLE est composé par le contenu. */
  title: string;
  children: ReactNode;
  /** Panneau de droite, à fond perdu. Masqué sous `wide` — jamais porteur d'information seule. */
  media?: ReactNode;
  /**
   * Comportement sous `wide`. `'sheet'` : feuille basse non bloquante ; `'modal'` : dialogue à
   * toutes les tailles — réservé aux pop-ups déclenchées par une action du visiteur.
   */
  mobileSurface?: 'modal' | 'sheet';
}

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
  // La feuille est non modale : ni verrouillage du défilement, ni piège de focus.
  const containerRef = useDialogA11y(open, onClose, !asSheet);
  const hasMedia = Boolean(media);

  if (!open) return null;

  const close = (
    <button
      type="button"
      onClick={onClose}
      className="mm-iconbtn absolute right-3 top-3 z-20 stack:right-4 stack:top-4"
      /* Fond `bento` en ligne, pas `quiet-bg` : la croix se pose sur le PANNEAU à partir de
         `wide`, et celui du Club est nuit dans les deux thèmes — la croix translucide y
         disparaissait (vu au navigateur le 29/10). En ligne pour battre la classe du kit. */
      style={{ background: 'var(--bento)', boxShadow: 'var(--sh-soft)' }}
      aria-label={t('modal.close')}
    >
      <Icon name="close" size={18} />
    </button>
  );

  if (asSheet) {
    return (
      <motion.div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        initial={reduced ? false : { y: '100%' }}
        animate={reduced ? undefined : { y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className={cn(
          /*
            Plafond `min(70vh, 440px)`. Il valait `min(64vh, 380px)` avec un titre de 16 px ; le
            titre du kit en fait 24 et le sourcil s'affiche désormais sur mobile. Les feuilles ne
            se déclenchent jamais au débarquement (fin de lecture, 25 s, intention de sortie) :
            la pénalité « interstitiel intrusif » ne les vise pas.
          */
          'fixed inset-x-0 bottom-0 z-50 max-h-[min(70vh,440px)] overflow-y-auto focus:outline-none',
          'rounded-t-[24px] border-t border-[color:var(--line)] bg-[color:var(--bento)] text-ink',
          'shadow-[0_-18px_50px_rgba(14,17,22,.22)]',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-[color:var(--line)]" />
        <div className="px-5 pt-4 pb-5">{children}</div>
        {close}
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center stack:items-center stack:p-4">
      {/* `mm-scrim` est en `absolute inset-0` : le conteneur fixe plein écran lui sert de cadre. */}
      <div className="mm-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-[880px] max-h-[92vh] overflow-y-auto focus:outline-none',
          'rounded-t-[24px] stack:rounded-[28px] border border-[color:var(--line)] bg-[color:var(--bento)] text-ink',
          'shadow-[0_30px_80px_rgba(14,17,22,.28)]',
          !reduced && 'mm-pop-in',
        )}
      >
        {close}
        {/* Le panneau n'occupe une colonne qu'à partir de `wide` ; en dessous il disparaît,
            sinon il repousserait l'action sous la ligne de flottaison. */}
        <div className={cn('grid', hasMedia && 'wide:grid-cols-[1.12fr_.88fr]')}>
          <div className="min-w-0 p-6 stack:p-9 wide:p-10">{children}</div>
          {hasMedia && (
            <div className="relative hidden min-h-[400px] overflow-hidden wide:block" aria-hidden="true">
              {media}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
