import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';

interface AdminPlaceholderProps {
  title: string;
}

export default function AdminPlaceholder({ title }: AdminPlaceholderProps) {
  const { t } = useTranslation('admin');
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[color:var(--fill-2)] flex items-center justify-center mb-6">
        <Icon name="construction" size={28} className="text-ink-2" />
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">{title}</h2>
      <p className="text-sm text-ink-2 max-w-xs">
        {t('placeholder.description')}
      </p>
    </div>
  );
}
