import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Search, RefreshCw, Loader2, ChevronDown, MessageCircle, Trash2, ExternalLink, Download, StickyNote } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { getAllAgencyLeads, updateAgencyLeadStatus, updateAgencyLeadNotes, deleteAgencyLead } from '../../lib/firestore';
import { computeTotals, PIPELINE_STAGES } from '../../lib/agency/offer';
import { exportToCsv } from '../../lib/utils';
import { useFormat } from '../../hooks/useFormat';
import type { AgencyLead, AgencyLeadStatus } from '../../types';

const STATUS_COLORS: Record<AgencyLeadStatus, string> = {
  new: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
  qualified: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
  quoted: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400',
  signed: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
  lost: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
};

export default function AdminAgencyLeads() {
  const { t } = useTranslation('admin');
  const { formatDate, formatPrice } = useFormat();
  const { addToast } = useToast();

  const [leads, setLeads] = useState<AgencyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgencyLeadStatus>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  /** Fiche dont les notes internes sont dépliées */
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  /** Brouillon local des notes, indexé par prospect — évite un aller-retour par frappe */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAllAgencyLeads()
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => { addToast('error', t('agencyLeads.toastLoadError')); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: AgencyLeadStatus) => {
    setUpdating(id);
    try {
      await updateAgencyLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      addToast('success', t('agencyLeads.toastUpdated'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  /** Enregistre au `blur` : une écriture par frappe saturerait Firestore pour rien. */
  const handleSaveNote = async (id: string) => {
    const draft = noteDrafts[id];
    const current = leads.find((l) => l.id === id)?.notes ?? '';
    if (draft === undefined || draft === current) return;
    setSavingNote(id);
    try {
      await updateAgencyLeadNotes(id, draft);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: draft } : l)));
      addToast('success', t('agencyLeads.toastNoteSaved'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setSavingNote(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('agencyLeads.confirmDelete'))) return;
    setUpdating(id);
    try {
      await deleteAgencyLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      addToast('success', t('agencyLeads.toastDeleted'));
    } catch {
      addToast('error', t('agencyLeads.toastUpdateError'));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      const matchSearch = !q
        || l.businessName.toLowerCase().includes(q)
        || l.contactName.toLowerCase().includes(q)
        || l.phone.includes(q)
        || l.city.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, search, statusFilter]);

  const counts = useMemo(() => {
    const acc = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0])) as Record<AgencyLeadStatus, number>;
    for (const l of leads) acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, [leads]);

  /** Lien WhatsApp direct — le canal de réponse attendu par le prospect. */
  const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  /** Exporte ce qui est affiché, filtres compris — pas la collection entière. */
  const handleExport = () => {
    const headers = [
      t('agencyLeads.csv.date'), t('agencyLeads.csv.business'), t('agencyLeads.csv.contact'),
      t('agencyLeads.csv.phone'), t('agencyLeads.csv.email'), t('agencyLeads.csv.city'),
      t('agencyLeads.csv.sector'), t('agencyLeads.csv.pack'), t('agencyLeads.csv.plan'),
      t('agencyLeads.csv.upfront'), t('agencyLeads.csv.monthly'), t('agencyLeads.csv.status'),
      t('agencyLeads.csv.referral'), t('agencyLeads.csv.quoteRef'),
      t('agencyLeads.csv.message'), t('agencyLeads.csv.notes'),
    ];
    const rows = filtered.map((l) => {
      const totals = computeTotals(l.pack, l.plan);
      return [
        formatDate(l.createdAt), l.businessName, l.contactName,
        l.phone, l.email ?? '', l.city,
        t(`agencyLeads.sectors.${l.sector}`, { defaultValue: l.sector }),
        t(`agencyLeads.packs.${l.pack}`, { defaultValue: l.pack }),
        t(`agencyLeads.plans.${l.plan}`, { defaultValue: l.plan }),
        totals.upfront, totals.planMonthly,
        t(`agencyLeads.status.${l.status}`),
        l.referralCode ?? '', l.quoteRef ?? '',
        l.message ?? '', l.notes ?? '',
      ];
    });
    exportToCsv(t('agencyLeads.csv.filename'), headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('agencyLeads.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {counts.new > 0 && (
              <span className="text-warning-600 font-medium">{t('agencyLeads.newCount', { count: counts.new })} · </span>
            )}
            {t('agencyLeads.totalCount', { count: leads.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filtered.length === 0}
            icon={<Download className="w-4 h-4" />}
          >
            {t('agencyLeads.export')}
          </Button>
          <Button variant="outline" onClick={load} icon={<RefreshCw className="w-4 h-4" />}>
            {t('agencyLeads.refresh')}
          </Button>
        </div>
      </div>

      {/* Compteurs de pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {PIPELINE_STAGES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`p-4 rounded-2xl border text-left transition-colors ${
              statusFilter === status
                ? 'border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <p className="text-2xl font-black text-neutral-900 dark:text-white">{counts[status]}</p>
            <p className="text-xs font-semibold text-neutral-500 mt-0.5">{t(`agencyLeads.status.${status}`)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('agencyLeads.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">{t('agencyLeads.filterAll')}</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{t(`agencyLeads.status.${s}`)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <Briefcase className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('agencyLeads.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className={`bg-white dark:bg-neutral-800 border rounded-2xl p-5 transition-colors ${
                lead.status === 'new'
                  ? 'border-warning-200 dark:border-warning-800'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[lead.status]}`}>
                      {t(`agencyLeads.status.${lead.status}`)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {t('agencyLeads.receivedOn', { date: formatDate(lead.createdAt) })}
                    </span>
                    {lead.referralCode && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">
                        {lead.referralCode}
                      </span>
                    )}
                    {lead.quoteRef && (
                      <a
                        href={`/agence/devis/${lead.quoteRef}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('agencyLeads.openQuote')}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-lagoon-100 dark:bg-lagoon-900/30 text-lagoon-800 dark:text-lagoon-300 hover:bg-lagoon-200 dark:hover:bg-lagoon-900/50 transition-colors"
                      >
                        {t('agencyLeads.quoteRef', { ref: lead.quoteRef })}
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  <p className="font-semibold text-neutral-900 dark:text-white">{lead.businessName}</p>
                  <p className="text-sm text-neutral-500">
                    {lead.contactName} · {lead.phone}
                    {lead.email && ` · ${lead.email}`}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {lead.city} · {t(`agencyLeads.sectors.${lead.sector}`, { defaultValue: lead.sector })}
                  </p>

                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-2 font-medium">
                    {t('agencyLeads.interest', {
                      pack: t(`agencyLeads.packs.${lead.pack}`, { defaultValue: lead.pack }),
                      plan: t(`agencyLeads.plans.${lead.plan}`, { defaultValue: lead.plan }),
                    })}
                    {computeTotals(lead.pack, lead.plan).upfront > 0 && (
                      <span className="text-neutral-500 font-normal tabular-nums">
                        {' — '}{formatPrice(computeTotals(lead.pack, lead.plan).upfront)}
                        {computeTotals(lead.pack, lead.plan).planMonthly > 0 &&
                          ` + ${formatPrice(computeTotals(lead.pack, lead.plan).planMonthly)}/${t('agencyLeads.perMonth')}`}
                      </span>
                    )}
                  </p>

                  {lead.message && (
                    <p className="text-sm text-neutral-500 mt-2 italic">« {lead.message} »</p>
                  )}

                  {/* Notes internes — jamais visibles du prospect (cf. firestore.rules) */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setOpenNotes(openNotes === lead.id ? null : lead.id)}
                      aria-expanded={openNotes === lead.id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-lagoon-700 dark:hover:text-lagoon-400 transition-colors"
                    >
                      <StickyNote className="w-3.5 h-3.5" aria-hidden="true" />
                      {lead.notes ? t('agencyLeads.notesEdit') : t('agencyLeads.notesAdd')}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openNotes === lead.id ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>

                    {openNotes === lead.id ? (
                      <div className="mt-2">
                        <textarea
                          value={noteDrafts[lead.id] ?? lead.notes ?? ''}
                          onChange={(e) => setNoteDrafts((p) => ({ ...p, [lead.id]: e.target.value }))}
                          onBlur={() => handleSaveNote(lead.id)}
                          rows={3}
                          placeholder={t('agencyLeads.notesPlaceholder')}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lagoon-500/20 focus:border-lagoon-500"
                        />
                        <p className="text-xs text-neutral-400 mt-1">
                          {savingNote === lead.id ? t('agencyLeads.notesSaving') : t('agencyLeads.notesHint')}
                        </p>
                      </div>
                    ) : lead.notes ? (
                      <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 whitespace-pre-line">{lead.notes}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={waLink(lead.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {t('agencyLeads.whatsapp')}
                  </a>

                  <div className="relative">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatus(lead.id, e.target.value as AgencyLeadStatus)}
                      disabled={updating === lead.id}
                      className="appearance-none pl-3 pr-7 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s} value={s}>{t(`agencyLeads.status.${s}`)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => handleDelete(lead.id)}
                    disabled={updating === lead.id}
                    aria-label={t('agencyLeads.delete')}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors disabled:opacity-50"
                  >
                    {updating === lead.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
