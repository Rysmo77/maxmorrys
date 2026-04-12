import { CheckCircle, XCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../lib/utils';
import type { ClubDigitosSubscription } from '../../../types';

interface ClubSubscriptionsTabProps {
  subscriptions: ClubDigitosSubscription[];
  handleSubStatus: (userId: string, status: ClubDigitosSubscription['status']) => Promise<void>;
}

export default function ClubSubscriptionsTab({ subscriptions, handleSubStatus }: ClubSubscriptionsTabProps) {
  return (
    <Card>
      {subscriptions.length === 0 ? (
        <p className="text-center text-neutral-400 py-8">Aucun abonnement pour l'instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                <th className="pb-3 font-semibold">Membre</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold">Début</th>
                <th className="pb-3 font-semibold">Expiration</th>
                <th className="pb-3 font-semibold">Renouvellement</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-neutral-900 dark:text-white">{sub.userName || '—'}</p>
                    <p className="text-xs text-neutral-400">{sub.userEmail || sub.userId}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={sub.status === 'active' ? 'success' : sub.status === 'pending' ? 'warning' : 'error'}
                      size="sm"
                    >
                      {sub.status === 'active' ? 'Actif' : sub.status === 'pending' ? 'En attente' : sub.status === 'expired' ? 'Expiré' : 'Annulé'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-neutral-500">{formatDate(sub.startedAt)}</td>
                  <td className="py-3 pr-4 text-neutral-500">{formatDate(sub.expiresAt)}</td>
                  <td className="py-3 pr-4 text-neutral-500">{sub.autoRenew ? 'Auto' : 'Manuel'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {sub.status !== 'active' && (
                        <button
                          onClick={() => handleSubStatus(sub.userId, 'active')}
                          className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                          title="Activer"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {sub.status === 'active' && (
                        <button
                          onClick={() => handleSubStatus(sub.userId, 'cancelled')}
                          className="p-1.5 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                          title="Annuler"
                        >
                          <XCircle className="w-4 h-4" />
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
