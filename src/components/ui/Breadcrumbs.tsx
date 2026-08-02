import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation('shared');
  return (
    <nav aria-label={t('breadcrumbs', 'Fil d\'Ariane')} className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <LocalizedLink
              to={item.href}
              className="text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </LocalizedLink>
          ) : (
            <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
