import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { getDmReports, updateDmReportStatus, deleteDmReport, deleteDmMessage } from '../../../lib/firestore';
import { Icon, Num } from '@ds';
import { useFormat } from '../../../hooks/useFormat';
import { captureError } from '../../../lib/sentry';
import type { DmReport } from '../../../types';
import ConsoleListSkeleton from './ConsoleListSkeleton';

export default function ClubReportsAdminTab() {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [reports, setReports] = useState<DmReport[]>([]);
  const [loading, setLoading] = useState(true);
  /*
   * L'INSTANT OÙ LA REQUÊTE A RÉPONDU — pas celui du rendu.
   *
   * Les deux identifiants tronqués plus bas sont en monospace, et la règle 6 dit pourquoi :
   * la fonte signale une valeur qui vient du système. Ils la portaient sans passer par
   * `<Num>`, c'est-à-dire sans dire d'où ils venaient ni quand ils avaient été relevés.
   * `new Date()` au rendu aurait prétendu qu'ils venaient d'être vérifiés à chaque
   * réaffichage ; c'est la réponse de `getDmReports()` qui fait foi.
   */
  const [readAt, setReadAt] = useState<Date | null>(null);

  useEffect(() => {
    getDmReports()
      .then((r) => { setReports(r); setReadAt(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

  if (loading) return <ConsoleListSkeleton />;
  if (reports.length === 0) return <Card><p className="text-center text-ink-2 py-8">{t('reports.empty')}</p></Card>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Icon name="flag" size={16} className="text-stop" />
                <Badge variant={r.status === 'open' ? 'error' : 'default'} size="sm">{r.status === 'open' ? t('reports.statusOpen') : t('reports.statusResolved')}</Badge>
                <span className="text-xs text-ink-2">{formatDate(r.createdAt)}</span>
              </div>
              <div className="bg-[color:var(--fill-1)] dark:bg-[color-mix(in_srgb,var(--night-3)_40%,transparent)] rounded-lg px-3 py-2 mb-2">
                <p className="text-sm text-ink-2 break-words whitespace-pre-wrap">« {r.text} »</p>
              </div>
              <p className="text-xs text-ink-2">
                {t('reports.reportedBy')}{' '}
                <Num value={`${r.reporterId.slice(0, 8)}…`} source="db" asOf={readAt ?? new Date()} />
                {' · '}{t('reports.author')}{' '}
                <Num value={`${r.reportedUserId.slice(0, 8)}…`} source="db" asOf={readAt ?? new Date()} />
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[color:var(--border-hair)]">
            <Button size="sm" variant="outline" onClick={() => removeMessage(r)} icon={<Icon name="trash" size={14} />}>{t('reports.deleteMessage')}</Button>
            {r.status === 'open' && <Button size="sm" variant="ghost" onClick={() => resolve(r)} icon={<Icon name="check" size={14} />}>{t('reports.markResolved')}</Button>}
            <Button size="sm" variant="ghost" onClick={() => removeReport(r)} icon={<Icon name="trash" size={14} />}>{t('reports.deleteReport')}</Button>
          </div>
        </Card>
      ))}
      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('reports.confirmTitle')} message={confirm.message} confirmLabel={t('reports.confirmLabel')} />
    </div>
  );
}
