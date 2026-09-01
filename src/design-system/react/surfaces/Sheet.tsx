import { useEffect, useRef } from 'react';
import { Icon } from '../brand/Icon';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA FEUILLE DU BAS — le dialogue du pouce.
 *
 * Portée depuis `components/ui/Sheet`. Contrairement à `ImageInput`, `RichEditor` et
 * `NotificationDropdown`, restés côté application, celle-ci n'a AUCUNE dépendance au
 * produit : ni service, ni contexte, ni bibliothèque maison. C'est ce qui en fait une
 * primitive et non un composant d'écran.
 *
 * i18next en sort pour la même raison que sur `Modal` : le kit doit rester utilisable
 * hors de ce dépôt, et c'est ce qui permet à `mobile/ds` d'en partager les jetons.
 * `components/dialogs/` injecte le libellé.
 *
 * ── CE QUI EST CORRIGÉ ────────────────────────────────────────────────────────
 * Le voile passe `aria-hidden` — il ferme au clic, mais Échap ferme aussi et le bouton
 * de fermeture est atteignable : l'annoncer ne donne rien à personne. La feuille prend
 * `role="dialog"`, `aria-modal` et son titre pour nom : elle n'en avait aucun.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Libellé de fermeture. La coquille traduit — le DS ne connaît pas i18next. */
  closeLabel?: string;
}

export function Sheet({ open, onClose, title, children, closeLabel = 'Fermer' }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Drag to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const handleTouchEnd = () => {
    const delta = currentY.current - startY.current;
    if (delta > 120) {
      onClose();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    startY.current = 0;
    currentY.current = 0;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Voile — DÉCORATIF pour un lecteur d'écran.
          Il ferme au clic, mais ce n'est pas la seule sortie : Échap ferme aussi, et le
          panneau porte un bouton de fermeture. `aria-hidden` évite donc d'annoncer un
          élément vide et non atteignable au clavier, sans rien retirer à personne. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 mm-drop"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute bottom-0 left-0 right-0 bg-surface-sheet rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col mm-drop transition-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[color:var(--fill-4)]" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[color:var(--line)]">
            <h3 className="font-bold text-ink text-sm">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-2 hover:text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors"
              aria-label={closeLabel}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
