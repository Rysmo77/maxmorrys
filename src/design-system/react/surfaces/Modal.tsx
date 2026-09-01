import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from '../brand/Icon';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA MODALE — feuille centrée, verrouillage du défilement, piège de focus.
 *
 * Portée depuis `components/ui/Modal`. Sept écrans l'ouvrent, et `ConfirmDialog` la
 * réutilise.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI ÉTAIT CASSÉ
 *
 * · **L'IDENTIFIANT DU TITRE ÉTAIT EN DUR** : `id="modal-title"` et
 *   `aria-labelledby="modal-title"`. Deux modales montées en même temps — un
 *   `ConfirmDialog` par-dessus une feuille d'édition, ce que la console fait — donnaient
 *   deux éléments du même `id` dans le document. Le lecteur d'écran annonce alors le
 *   premier trouvé, c'est-à-dire le mauvais titre. `useId()` règle ça pour de bon.
 *
 * · `dark:hover:bg-[color:var(--night-3)]` — une classe `dark:` portant une COULEUR,
 *   ce qu'AD-3 interdit, et redondante par-dessus le marché : `--fill-2` bascule seul
 *   sous `.dk`.
 *
 * · `rounded-2xl` (16 px) et `rounded-lg` (8 px) venaient de l'échelle Tailwind par
 *   défaut, et `shadow-xl` de ses ombres — trois valeurs étrangères au kit. Le système
 *   a `--r-l` pour une carte, `--r-xs` pour un bouton d'icône, `--card-sh` pour l'ombre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA MÉCANIQUE EST ÉCRITE ICI ET NON REPRISE DE `useDialogA11y`
 *
 * Ce crochet existe (`src/hooks/useDialogA11y.ts`) et fait la même chose, en mieux
 * documenté. Mais il vit dans la coquille, et une primitive du design system qui
 * importerait du code d'application inverserait la dépendance : le kit serait alors
 * inutilisable sans le reste du dépôt.
 *
 * Les deux restent donc frères. Le crochet sert les surfaces éditoriales sombres à fond
 * perdu — les pop-ups — que cette feuille claire ne peut pas porter ; il dit lui-même
 * pourquoi il n'a pas été fondu dans ce composant.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/* ⚠️ CE SONT DES NOMS DE TAILLE, PAS DES RUPTURES. La migration des points de
   rupture (`sm:`→`stack:`, `lg:`→`wide:`) a écrasé ces quatre clés d'un coup, parce
   qu'elles s'écrivent pareil : `sm:` en début de ligne. Deux `stack` et deux `wide`
   dans le même objet — le typecheck l'a dit tout de suite. */
const WIDTH = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

/** Ce qui peut prendre le focus à l'intérieur — sert au piège de tabulation. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), '
  + 'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** @default "md" */
  size?: keyof typeof WIDTH;
  /** Libellé du bouton de fermeture. La coquille traduit — le DS ne connaît pas i18next. */
  closeLabel?: string;
}

export function Modal({ open, onClose, children, title, size = 'md', closeLabel = 'Fermer' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* Verrouillage du défilement + focus initial et restitution. */
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [open]);

  /* Échap ferme, et le piège de tabulation garde le focus dedans. Un seul écouteur
     plutôt que deux : ils partagent la même condition d'ouverture et le même cycle. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Voile décoratif : Échap ferme aussi, et le bouton de fermeture est atteignable.
          Le flou est permis — c'est du chrome en position fixe, règle 1. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm mm-drop"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative mm-drop max-h-[90vh] w-full overflow-y-auto rounded-card bg-surface-sheet shadow-card focus:outline-none ${WIDTH[size]}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[color:var(--line)] p-6">
            <h2 id={titleId} className="text-lede font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="mm-touch-extend rounded-xs p-1 text-ink-2 transition-colors duration-ui hover:bg-[color:var(--fill-2)]"
              aria-label={closeLabel}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
