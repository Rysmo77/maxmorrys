import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosSubscription } from '../../../types';
import { Icon } from '@ds';

interface ClubSubscriptionsTabProps {
  subscriptions: ClubDigitosSubscription[];
  handleSubStatus: (userId: string, status: ClubDigitosSubscription['status']) => Promise<void>;
}

export default function ClubSubscriptionsTab({ subscriptions, handleSubStatus }: ClubSubscriptionsTabProps) {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  return (
    <Card>
      {subscriptions.length === 0 ? (
        <p className="text-center text-ink-2 py-8">{t('subscriptions.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-2 border-b border-[color:var(--line)]">
                <th className="pb-3 font-semibold">{t('subscriptions.table.member')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.table.status')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.table.start')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.table.expiration')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.table.renewal')}</th>
                <th className="pb-3 font-semibold">{t('subscriptions.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--fill-2)] dark:divide-[color:var(--line)]">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[color:var(--fill-1)] dark:hover:bg-[color-mix(in_srgb,var(--night-3)_30%,transparent)] transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-ink">{sub.userName || '—'}</p>
                    <p className="text-xs text-ink-2">{sub.userEmail || sub.userId}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={sub.status === 'active' ? 'success' : sub.status === 'pending' ? 'warning' : 'error'}
                      size="sm"
                    >
                      {sub.status === 'active' ? t('subscriptions.status.active') : sub.status === 'pending' ? t('subscriptions.status.pending') : sub.status === 'expired' ? t('subscriptions.status.expired') : t('subscriptions.status.cancelled')}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-ink-2">{formatDate(sub.startedAt)}</td>
                  <td className="py-3 pr-4 text-ink-2">{formatDate(sub.expiresAt)}</td>
                  <td className="py-3 pr-4 text-ink-2">{sub.autoRenew ? t('subscriptions.renew.auto') : t('subscriptions.renew.manual')}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {sub.status !== 'active' && (
                        <button
                          onClick={() => handleSubStatus(sub.userId, 'active')}
                          className="p-1.5 rounded-lg text-ok hover:bg-[color-mix(in_srgb,var(--ok)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--ok)_20%,transparent)] transition-colors"
                          title={t('subscriptions.activate')}
                        >
                          <Icon name="check-circle" size={16} />
                        </button>
                      )}
                      {sub.status === 'active' && (
                        <button
                          onClick={() => handleSubStatus(sub.userId, 'cancelled')}
                          className="p-1.5 rounded-lg text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors"
                          title={t('subscriptions.cancel')}
                        >
                          <Icon name="x-circle" size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
