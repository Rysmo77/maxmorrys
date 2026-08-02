import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Trash2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { getClubOpportunities, deleteClubOpportunity } from '../../../lib/firestore';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubOpportunity } from '../../../types';

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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  if (items.length === 0) return <Card><p className="text-center text-neutral-400 py-8">{t('opportunities.empty')}</p></Card>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="brand" size="sm">{TYPE_LABELS[item.type]}</Badge>
                {item.budget && <Badge variant="warning" size="sm">{item.budget}</Badge>}
                <span className="text-xs text-neutral-400">{item.userName} · {formatDate(item.createdAt)}</span>
              </div>
              <p className="font-bold text-neutral-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">{item.description}</p>
              <p className="text-xs text-plum-600 dark:text-plum-400 font-semibold mt-1 break-words">{t('opportunities.contact', { contact: item.contact })}</p>
            </div>
            <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors flex-shrink-0" aria-label={t('opportunities.deleteAria')}><Trash2 className="w-4 h-4" /></button>
          </div>
        </Card>
      ))}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('opportunities.deleteTitle')} message={confirm.message} confirmLabel={t('opportunities.confirmLabel')} />
    </div>
  );
}
