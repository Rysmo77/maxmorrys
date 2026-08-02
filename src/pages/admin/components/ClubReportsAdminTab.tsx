import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Trash2, Check, Flag } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { getDmReports, updateDmReportStatus, deleteDmReport, deleteDmMessage } from '../../../lib/firestore';
import { useFormat } from '../../../hooks/useFormat';
import { captureError } from '../../../lib/sentry';
import type { DmReport } from '../../../types';

export default function ClubReportsAdminTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [reports, setReports] = useState<DmReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getDmReports().then((r) => { setReports(r); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const resolve = async (r: DmReport) => {
    setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, status: 'resolved' } : x));
    try { await updateDmReportStatus(r.id, 'resolved'); addToast('success', t('reports.resolved')); }
    catch { addToast('error', t('common.genericError')); }
  };

  const removeReport = (r: DmReport) => {
    confirm.requestConfirm(t('reports.deleteReportConfirm'), async () => {
      try { await deleteDmReport(r.id); setReports((prev) => prev.filter((x) => x.id !== r.id)); addToast('success', t('reports.reportDeleted')); }
      catch { addToast('error', t('common.deleteError')); }
      confirm.closeConfirm();
    });
  };

  const removeMessage = (r: DmReport) => {
    confirm.requestConfirm(t('reports.deleteMessageConfirm'), async () => {
      try {
        await deleteDmMessage(r.convId, r.messageId);
        await updateDmReportStatus(r.id, 'resolved').catch(() => null);
        setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, status: 'resolved' } : x));
        addToast('success', t('reports.messageDeleted'));
      } catch (error: unknown) {
        captureError(error, { context: 'Delete reported DM message failed' });
        addToast('error', t('reports.messageDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  if (reports.length === 0) return <Card><p className="text-center text-neutral-400 py-8">{t('reports.empty')}</p></Card>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Flag className="w-4 h-4 text-error-500" />
                <Badge variant={r.status === 'open' ? 'error' : 'default'} size="sm">{r.status === 'open' ? t('reports.statusOpen') : t('reports.statusResolved')}</Badge>
                <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/40 rounded-lg px-3 py-2 mb-2">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 break-words whitespace-pre-wrap">« {r.text} »</p>
              </div>
              <p className="text-xs text-neutral-400">{t('reports.reportedBy')} <span className="font-mono">{r.reporterId.slice(0, 8)}…</span> · {t('reports.author')} <span className="font-mono">{r.reportedUserId.slice(0, 8)}…</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button size="sm" variant="outline" onClick={() => removeMessage(r)} icon={<Trash2 className="w-3.5 h-3.5" />}>{t('reports.deleteMessage')}</Button>
            {r.status === 'open' && <Button size="sm" variant="ghost" onClick={() => resolve(r)} icon={<Check className="w-3.5 h-3.5" />}>{t('reports.markResolved')}</Button>}
            <Button size="sm" variant="ghost" onClick={() => removeReport(r)} icon={<Trash2 className="w-3.5 h-3.5" />}>{t('reports.deleteReport')}</Button>
          </div>
        </Card>
      ))}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('reports.confirmTitle')} message={confirm.message} confirmLabel={t('reports.confirmLabel')} />
    </div>
  );
}
