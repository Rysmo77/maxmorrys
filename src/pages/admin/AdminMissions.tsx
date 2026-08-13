import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Boxes, Search, RefreshCw, Loader2, Mail, Trash2, ExternalLink, Download, StickyNote, Signpost,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import {
  getEngagementLeads, updateEngagementLeadStatus, updateEngagementLeadNotes,
  deleteEngagementLead, getMissionStats, MISSION_STAGES,
} from '../../lib/firestore';
import { exportToCsv } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import type { EngagementLead, EngagementLeadStatus } from '../../types';

const STATUS_COLORS: Record<EngagementLeadStatus, string> = {
  new: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
  qualified: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
  scoping: 'bg-lagoon-100 dark:bg-lagoon-900/30 text-lagoon-700 dark:text-lagoon-300',
  proposal: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400',
  won: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
  lost: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
};

/**
 * Pipeline des demandes de mission Max-Morrys Agency (collection `engagement_leads`).
 *
 * ⚠️ Écran distinct de `AdminAgencyLeads`, qui suit les prospects de l'offre
 * « Digital Commerce Local » : deux offres, deux schémas, deux cycles de vente.
 */
export default function AdminMissions() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();

  const [leads, setLeads] = useState<EngagementLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EngagementLeadStatus>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  /** Fiche dont les notes internes sont dépliées */
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  /** Brouillon local des notes, indexé par demande — évite un aller-retour par frappe */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getEngagementLeads()
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => { addToast('error', t('missions.toastLoadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => getMissionStats(leads), [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    });
  }, [leads, search, statusFilter]);

  const handleStatus = async (id: string, status: EngagementLeadStatus) => {
    setUpdating(id);
    try {
      await updateEngagementLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      addToast('success', t('missions.toastUpdated'));
    } catch {
      addToast('error', t('missions.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  /** Enregistre au `blur` : une écriture par frappe saturerait Firestore pour rien. */
  const handleSaveNote = async (id: string) => {
    const draft = noteDrafts[id];
    if (draft === undefined) return;
    const current = leads.find((l) => l.id === id)?.notes ?? '';
    if (draft === current) return;
    setSavingNote(id);
    try {
      await updateEngagementLeadNotes(id, draft);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: draft } : l)));
    } catch {
      addToast('error', t('missions.toastUpdateError'));
    } finally {
      setSavingNote(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('missions.confirmDelete'))) return;
    try {
      await deleteEngagementLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      addToast('success', t('missions.toastDeleted'));
    } catch {
      addToast('error', t('missions.toastUpdateError'));
    }
  };

  /** Exporte l'ensemble filtré, pas la collection entière. */
  const handleExport = () => {
    const headers = t('missions.csv.headers', { returnObjects: true }) as string[];
    const rows = filtered.map((l) => [
      l.createdAt,
      l.name,
      l.company,
      l.email,
      l.website ?? '',
      t(`missions.projectTypes.${l.projectType}`),
      t(`missions.budgets.${l.budget}`),
      t(`missions.timelines.${l.timeline}`),
      t(`missions.status.${l.status}`),
      l.routedTo ?? '',
      l.description,
      l.notes ?? '',
    ]);
    exportToCsv(t('missions.csv.filename'), headers, rows);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Boxes className="w-6 h-6 text-lagoon-600" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {t('missions.title')}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('missions.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={load}>
            {t('missions.refresh')}
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
            {t('missions.export')}
          </Button>
        </div>
      </header>

      {/* Compteurs cliquables — filtrent la liste */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`rounded-xl border p-3 text-left transition-colors ${
            statusFilter === 'all'
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          <span className="block text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('missions.statusAll')}</span>
        </button>
        {MISSION_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStatusFilter(stage)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              statusFilter === stage
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
            }`}
          >
            <span className="block text-2xl font-bold text-neutral-900 dark:text-white">
              {stats.byStatus[stage]}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t(`missions.status.${stage}`)}
            </span>
          </button>
        ))}
      </div>

      {stats.routed.MY_ONOMA_GROW > 0 && (
        <p className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <Signpost className="w-4 h-4 text-lagoon-600" aria-hidden="true" />
          {t('missions.routedCount', { count: stats.routed.MY_ONOMA_GROW })}
        </p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('missions.searchPlaceholder')}
          aria-label={t('missions.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-neutral-500 dark:text-neutral-400">
          {t('missions.empty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((lead) => (
            <li
              key={lead.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-neutral-900 dark:text-white">{lead.company}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                      {t(`missions.status.${lead.status}`)}
                    </span>
                    {lead.routedTo && (
                      <span className="rounded-full bg-lagoon-100 dark:bg-lagoon-900/40 px-2 py-0.5 text-xs font-medium text-lagoon-700 dark:text-lagoon-300">
                        {t('missions.routedBadge')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {lead.name} · {formatDate(lead.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                    {t(`missions.projectTypes.${lead.projectType}`)} ·{' '}
                    {t(`missions.budgets.${lead.budget}`)} ·{' '}
                    {t(`missions.timelines.${lead.timeline}`)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${lead.email}`}
                    className="rounded-lg p-2 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    aria-label={t('missions.emailAria', { email: lead.email })}
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </a>
                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      aria-label={t('missions.websiteAria')}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenNotes(openNotes === lead.id ? null : lead.id)}
                    className="rounded-lg p-2 text-neutral-500 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    aria-label={t('missions.notesAria')}
                    aria-expanded={openNotes === lead.id}
                  >
                    <StickyNote className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(lead.id)}
                    className="rounded-lg p-2 text-neutral-500 hover:text-error-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    aria-label={t('missions.deleteAria')}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {lead.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <label htmlFor={`status-${lead.id}`} className="sr-only">
                  {t('missions.statusLabel')}
                </label>
                <select
                  id={`status-${lead.id}`}
                  value={lead.status}
                  disabled={updating === lead.id}
                  onChange={(e) => handleStatus(lead.id, e.target.value as EngagementLeadStatus)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {MISSION_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{t(`missions.status.${stage}`)}</option>
                  ))}
                </select>
                {updating === lead.id && (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" aria-hidden="true" />
                )}
              </div>

              {openNotes === lead.id && (
                <div className="mt-4">
                  <label
                    htmlFor={`notes-${lead.id}`}
                    className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5"
                  >
                    {t('missions.notesLabel')}
                  </label>
                  <textarea
                    id={`notes-${lead.id}`}
                    rows={3}
                    defaultValue={lead.notes ?? ''}
                    onChange={(e) => setNoteDrafts((p) => ({ ...p, [lead.id]: e.target.value }))}
                    onBlur={() => handleSaveNote(lead.id)}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {savingNote === lead.id && (
                    <p className="mt-1 text-xs text-neutral-400">{t('missions.notesSaving')}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
