import { useState, useEffect } from 'react';
import { Calendar, Search, RefreshCw, Loader2, ChevronDown, Check, X, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { getAllAppointments, updateAppointmentStatus } from '../../lib/firestore';
import { formatDate } from '../../lib/utils';
import type { Appointment } from '../../types';

const STATUS_LABELS: Record<Appointment['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<Appointment['status'], string> = {
  pending: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
  confirmed: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
  cancelled: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
};

export default function AdminAppointments() {
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAllAppointments().then((data) => { setAppointments(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: Appointment['status']) => {
    setUpdating(id);
    try {
      await updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      addToast('success', `Rendez-vous ${status === 'confirmed' ? 'confirmé' : 'annulé'}.`);
    } catch {
      addToast('error', 'Erreur lors de la mise à jour.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = appointments.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Rendez-vous</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {pendingCount > 0 && <span className="text-warning-600 font-medium">{pendingCount} en attente · </span>}
            {appointments.length} total
          </p>
        </div>
        <Button variant="outline" onClick={load} icon={<RefreshCw className="w-4 h-4" />}>Actualiser</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email, sujet..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmés</option>
            <option value="cancelled">Annulés</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">Aucun rendez-vous trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className={`bg-white dark:bg-neutral-800 border rounded-2xl p-5 transition-colors ${a.status === 'pending' ? 'border-warning-200 dark:border-warning-800' : 'border-neutral-200 dark:border-neutral-700'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {a.date} à {a.time}
                    </span>
                    <span className="text-xs text-neutral-400">Reçu le {formatDate(a.createdAt)}</span>
                  </div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{a.name}</p>
                  <p className="text-sm text-neutral-500">{a.email}{a.phone && ` · ${a.phone}`}</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1 font-medium">{a.subject}</p>
                  {a.message && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{a.message}</p>}
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStatus(a.id, 'confirmed')}
                      disabled={updating === a.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50 transition-colors disabled:opacity-50"
                    >
                      {updating === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Confirmer
                    </button>
                    <button
                      onClick={() => handleStatus(a.id, 'cancelled')}
                      disabled={updating === a.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 hover:bg-error-200 dark:hover:bg-error-900/50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Refuser
                    </button>
                  </div>
                )}
                {a.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatus(a.id, 'cancelled')}
                    disabled={updating === a.id}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-error-500 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" /> Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
