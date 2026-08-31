import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import { Icon } from '@ds';

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
          {i > 0 && <Icon name="chevron-right" size={14} className="text-ink-2 flex-shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <LocalizedLink
              to={item.href}
              className="text-ink-2 hover:text-forme dark:hover:text-forme transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </LocalizedLink>
          ) : (
            <span className="text-ink-2 font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
