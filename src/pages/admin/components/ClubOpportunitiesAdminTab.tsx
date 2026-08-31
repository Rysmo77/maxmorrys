import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { getClubOpportunities, deleteClubOpportunity } from '../../../lib/firestore';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubOpportunity } from '../../../types';
import { Icon } from '@ds';
import ConsoleListSkeleton from './ConsoleListSkeleton';

export default function ClubOpportunitiesAdminTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const TYPE_LABELS: Record<ClubOpportunity['type'], string> = {
    mission: t('opportunities.types.mission'),
    emploi: t('opportunities.types.emploi'),
    partenariat: t('opportunities.types.partenariat'),
    autre: t('opportunities.types.autre'),
  };
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState<ClubOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getClubOpportunities().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const handleDelete = (item: ClubOpportunity) => {
    confirm.requestConfirm(t('opportunities.deleteConfirm', { title: item.title }), async () => {
      try {
        await deleteClubOpportunity(item.id);
        setItems((prev) => prev.filter((x) => x.id !== item.id));
        addToast('success', t('opportunities.deleted'));
      } catch { addToast('error', t('common.deleteError')); }
      confirm.closeConfirm();
    });
  };

  if (loading) return <ConsoleListSkeleton />;
  if (items.length === 0) return <Card><p className="text-center text-ink-2 py-8">{t('opportunities.empty')}</p></Card>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="brand" size="sm">{TYPE_LABELS[item.type]}</Badge>
                {item.budget && <Badge variant="warning" size="sm">{item.budget}</Badge>}
                <span className="text-xs text-ink-2">{item.userName} · {formatDate(item.createdAt)}</span>
              </div>
              <p className="font-bold text-ink">{item.title}</p>
              <p className="text-sm text-ink-2 line-clamp-2 mt-0.5">{item.description}</p>
              <p className="text-xs text-transforme font-semibold mt-1 break-words">{t('opportunities.contact', { contact: item.contact })}</p>
            </div>
            <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors flex-shrink-0" aria-label={t('opportunities.deleteAria')}><Icon name="trash" size={16} /></button>
          </div>
        </Card>
      ))}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('opportunities.deleteTitle')} message={confirm.message} confirmLabel={t('opportunities.confirmLabel')} />
    </div>
  );
}
