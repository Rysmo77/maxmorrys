import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RefreshCw, CreditCard, Loader2, ChevronDown, ArrowDownLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { usePagination } from '../../hooks/usePagination';
import { getAllTransactions, updateTransactionStatus } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Transaction } from '../../types';

const STATUS_COLORS: Record<Transaction['status'], string> = {
  pending: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
  completed: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
  refunded: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
  failed: 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400',
};

export default function AdminTransactions() {
  const { t } = useTranslation('admin');
  const { formatDate, locale } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const STATUS_LABELS: Record<Transaction['status'], string> = {
    pending: t('transactions.statusPending'),
    completed: t('transactions.statusCompleted'),
    refunded: t('transactions.statusRefunded'),
    failed: t('transactions.statusFailed'),
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Transaction['status']>('all');
  const [refunding, setRefunding] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAllTransactions().then((data) => { setTransactions(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRefund = (id: string) => {
    confirm.requestConfirm(t('transactions.refundConfirmMessage'), async () => {
      setRefunding(id);
      try {
        await updateTransactionStatus(id, 'refunded');
        setTransactions((prev) => prev.map((tx) => tx.id === id ? { ...tx, status: 'refunded' } : tx));
        addToast('success', t('transactions.refundSuccess'));
      } catch {
        addToast('error', t('transactions.refundError'));
      } finally {
        setRefunding(null);
      }
      confirm.closeConfirm();
    });
  };

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchSearch = !q || tx.id.toLowerCase().includes(q) || tx.userId.toLowerCase().includes(q)
      || (tx.userName ?? '').toLowerCase().includes(q)
      || (tx.userEmail ?? '').toLowerCase().includes(q)
      || (tx.formationTitle ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const totalRevenue = transactions.filter((tx) => tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);
  const totalRefunded = transactions.filter((tx) => tx.status === 'refunded').reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('transactions.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('transactions.count', { count: transactions.length })}</p>
        </div>
        <Button variant="outline" onClick={load} icon={<RefreshCw className="w-4 h-4" />}>{t('transactions.refresh')}</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('transactions.statRevenue'), value: `${totalRevenue.toLocaleString(locale)} FCFA`, color: 'text-success-600' },
          { label: t('transactions.statRefunds'), value: `${totalRefunded.toLocaleString(locale)} FCFA`, color: 'text-error-600' },
          { label: t('transactions.statPending'), value: transactions.filter((tx) => tx.status === 'pending').length, color: 'text-warning-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('transactions.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="all">{t('transactions.filterAll')}</option>
            <option value="completed">{t('transactions.filterCompleted')}</option>
            <option value="pending">{t('transactions.filterPending')}</option>
            <option value="refunded">{t('transactions.filterRefunded')}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <CreditCard className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('transactions.empty')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('transactions.colId')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{t('transactions.colUser')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{t('transactions.colDate')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('transactions.colAmount')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('transactions.colStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {paged.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-neutral-500">{tx.id.slice(0, 12)}...</p>
                    <p className="text-xs text-neutral-400">{tx.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">{tx.userName || tx.userEmail || tx.userId.slice(0, 12) + '...'}</p>
                    {tx.formationTitle && <p className="text-xs text-neutral-400 truncate max-w-[180px]">{tx.formationTitle}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{formatDate(tx.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{tx.amount.toLocaleString(locale)} {tx.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[tx.status]}`}>
                      {STATUS_LABELS[tx.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tx.status === 'completed' && (
                      <button
                        onClick={() => handleRefund(tx.id)}
                        disabled={refunding === tx.id}
                        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-error-600 transition-colors disabled:opacity-50"
                      >
                        {refunding === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        {t('transactions.refundAction')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ConfirmDialog open={confirm.open} onClose={confirm.closeConfirm} onConfirm={confirm.onConfirm} title={t('transactions.confirmTitle')} message={confirm.message} confirmLabel={t('transactions.refundAction')} variant="warning" />
    </div>
  );
}
