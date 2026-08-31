import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Icon } from '@ds';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation('ui');
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav aria-label={t('pagination.label')} className="flex items-center gap-1.5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] disabled:opacity-40 transition-colors"
        aria-label={t('pagination.previous')}
      >
        <Icon name="chevron-left" size={16} />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-ink-2 text-sm">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-forme text-white'
                : 'text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)]',
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl text-ink-2 hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] disabled:opacity-40 transition-colors"
        aria-label={t('pagination.next')}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}
