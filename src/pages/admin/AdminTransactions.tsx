import { useState, useEffect } from 'react';
import { Search, RefreshCw, CreditCard, Loader2, ChevronDown, ArrowDownLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { getAllTransactions, updateTransactionStatus } from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import type { Transaction } from '../../types';

const STATUS_LABELS: Record<Transaction['status'], string> = {
  pending: 'En attente',
  completed: 'Complétée',
  refunded: 'Remboursée',
};

const STATUS_COLORS: Record<Transaction['status'], string> = {
  pending: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
  completed: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
  refunded: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
};

export default function AdminTransactions() {
  const { addToast } = useToast();
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

  const handleRefund = async (id: string) => {
    if (!confirm('Marquer comme remboursée ?')) return;
    setRefunding(id);
    try {
      await updateTransactionStatus(id, 'refunded');
      setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, status: 'refunded' } : t));
      addToast('success', 'Transaction marquée comme remboursée.');
    } catch {
      addToast('error', 'Erreur lors du remboursement.');
    } finally {
      setRefunding(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.userId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = transactions.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalRefunded = transactions.filter((t) => t.status === 'refunded').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-neutral-500 mt-1">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" onClick={load} icon={<RefreshCw className="w-4 h-4" />}>Actualiser</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Chiffre d\'affaires', value: `${totalRevenue.toLocaleString('fr-FR')} €`, color: 'text-success-600' },
          { label: 'Remboursements', value: `${totalRefunded.toLocaleString('fr-FR')} €`, color: 'text-error-600' },
          { label: 'En attente', value: transactions.filter((t) => t.status === 'pending').length, color: 'text-warning-600' },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, utilisateur..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="all">Tous les statuts</option>
            <option value="completed">Complétées</option>
            <option value="pending">En attente</option>
            <option value="refunded">Remboursées</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <CreditCard className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">Aucune transaction trouvée.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Montant</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-neutral-500">{t.id.slice(0, 12)}...</p>
                    <p className="text-xs text-neutral-400">{t.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell font-mono text-xs">{t.userId.slice(0, 12)}...</td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{t.amount.toLocaleString('fr-FR')} {t.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status === 'completed' && (
                      <button
                        onClick={() => handleRefund(t.id)}
                        disabled={refunding === t.id}
                        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-error-600 transition-colors disabled:opacity-50"
                      >
                        {refunding === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        Rembourser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
