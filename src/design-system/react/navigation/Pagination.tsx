import { Icon } from '../brand/Icon';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA PAGINATION — douze écrans l'utilisent, tous côté console.
 *
 * Portée depuis `components/ui/Pagination`. Trois écarts fermés au passage :
 *
 * · `dark:hover:bg-[color:var(--night-3)]` — une classe `dark:` portant une COULEUR
 *   (AD-3 l'interdit), et redondante : `--fill-2` bascule seul sous `.dk`.
 * · `rounded-xl` sur une case de 36 px. Depuis que les jetons pilotent l'échelle,
 *   `xl` vaut 30 px — le rayon du panneau héros — ce qui rendait la case presque
 *   ronde. `rounded-m` (16 px) est ce que le kit destine aux contrôles denses.
 * · `text-white` sur la page active. Le blanc n'est pas une encre du système :
 *   `--paper-fixed` l'est, et c'est celle que `Button tone="forme"` emploie déjà.
 *
 * LES POINTS DE SUSPENSION NE SONT PAS UN BOUTON, et ne prennent donc pas le focus.
 * Ils sont aussi masqués aux lecteurs d'écran : « … » lu entre deux nombres n'ajoute
 * rien à « page 4 sur 12 », que le libellé de la région porte déjà.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const GAP = '…' as const;

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Nom de la région. La coquille traduit — le DS ne connaît pas i18next. */
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** Libellé d'une page, ex. `(n) => \`Page ${n}\``. */
  pageLabel?: (page: number) => string;
}

export function Pagination({
  currentPage, totalPages, onPageChange, label, previousLabel, nextLabel,
  pageLabel = (n) => `Page ${n}`,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  /* Première, dernière, et la fenêtre de trois autour de la courante. Le reste se
     replie sur un seul séparateur — jamais deux d'affilée. */
  const pages: (number | typeof GAP)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== GAP) pages.push(GAP);
  }

  const step = 'mm-touch-extend rounded-m p-2 text-ink-2 transition-colors duration-ui hover:bg-[color:var(--fill-2)] disabled:opacity-40';

  return (
    <nav aria-label={label} className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={step}
        aria-label={previousLabel}
      >
        <Icon name="chevron-left" size={16} />
      </button>

      {pages.map((page, i) =>
        page === GAP ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-2 text-meta text-ink-2">{GAP}</span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={pageLabel(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`mm-touch-extend h-9 w-9 rounded-m text-meta font-medium transition-colors duration-ui ${
              page === currentPage
                ? 'bg-forme text-[color:var(--paper-fixed)]'
                : 'text-ink-2 hover:bg-[color:var(--fill-2)]'
            }`}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={step}
        aria-label={nextLabel}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}
