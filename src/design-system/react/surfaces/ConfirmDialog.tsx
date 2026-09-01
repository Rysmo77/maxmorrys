import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from '../actions/Button';
import { Icon } from '../brand/Icon';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA CONFIRMATION D'UNE ACTION QU'ON NE PEUT PAS DÉFAIRE.
 *
 * Portée depuis `components/ui/ConfirmDialog` — seize écrans la montent, c'est le
 * deuxième composant hérité le plus utilisé après le toast.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LE BOUTON DE CONFIRMATION ÉTAIT ILLISIBLE EN MODE SOMBRE
 *
 * Il portait `bg-stop … text-white` posé à la main. `--stop` est une teinte de TEXTE :
 * elle bascule en `#FF8A80` sous `.dk`, et du blanc dessus donne **2,28:1**. Le bouton
 * le plus dangereux du produit devenait le moins lisible — et seulement en nuit, donc
 * invisible à qui teste en clair.
 *
 * Le ton `stop` du `Button` remplace ce bricolage : fond soutenu et encre blanche en
 * clair, fond clair et encre sombre en nuit. Mesuré 6,56:1 et 8,28:1 (`overrides/ad-24`).
 *
 * Le survol ne changeait rien non plus — `hover:bg-stop` repeignait la même couleur.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DANGER SE DIT TROIS FOIS, ET C'EST VOULU : le puits d'icône, l'icône, le bouton.
 * Une seule de ces trois marques suffit à qui la perçoit ; les trois ensemble couvrent
 * la vision des couleurs, la lecture d'écran et le coup d'œil rapide.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  /** @default "danger" */
  variant?: 'danger' | 'warning';
  /** Libellé de fermeture de la modale porteuse. */
  closeLabel?: string;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, children,
  confirmLabel, cancelLabel, loading = false, variant = 'danger', closeLabel,
}: ConfirmDialogProps) {
  const danger = variant === 'danger';

  return (
    <Modal open={open} onClose={onClose} size="sm" closeLabel={closeLabel}>
      <div className="text-center">
        <div
          aria-hidden="true"
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill ${
            danger
              ? 'bg-[color-mix(in_srgb,var(--stop)_16%,transparent)]'
              : 'bg-[color-mix(in_srgb,var(--mm-orange)_16%,transparent)]'
          }`}
        >
          {/* Le puits passe de 4 % à 16 % : à 4 %, la pastille était indiscernable du
              fond de la feuille, et l'icône flottait sans son repère de gravité. */}
          <Icon name="alert" size={24} className={danger ? 'text-stop' : 'text-informe-txt'} />
        </div>

        <h3 className="mb-2 text-lede font-bold text-ink">{title}</h3>
        {message && <p className="mb-6 text-meta text-ink-2">{message}</p>}
        {children && <div className="mb-6 text-left">{children}</div>}

        <div className="flex justify-center gap-3">
          <Button tone="quiet" onClick={onClose} disabled={loading} fullWidth={false}>
            {cancelLabel}
          </Button>
          <Button
            tone={danger ? 'stop' : 'informe'}
            onClick={onConfirm}
            loading={loading}
            fullWidth={false}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
