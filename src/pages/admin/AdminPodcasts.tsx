import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2, Edit2, Headphones, Loader2, ChevronDown, RefreshCw, Download } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import Button from '../../components/ui/Button';
import ImageInput from '../../components/ui/ImageInput';
import { useToast } from '../../components/ui/Toast';
import { getAllPodcasts, savePodcast, deletePodcast } from '../../lib/firestore';
import { slugify, extractSpotifyEpisodeId, parseMsDuration } from '../../lib/utils';
import { generateSlugEn } from '../../lib/slugEn';
import { useFormat } from '../../hooks/useFormat';
import type { Podcast } from '../../types';
import { captureError } from '../../lib/sentry';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

const spotifyProxyCallable = httpsCallable<
  { episodeId: string },
  { name: string; description: string; coverImage: string; durationMs: number; releaseDate: string }
>(functions, 'spotifyProxy');

const syncMediaStatsCallable = httpsCallable<
  void,
  { videosProcessed: number; videosUpdated: number; podcastsProcessed: number; podcastsUpdated: number; errors: string[] }
>(functions, 'syncMediaStatsManual');

const importEpisodesCallable = httpsCallable<
  void,
  { fetched: number; created: number; skipped: number; errors: string[] }
>(functions, 'importSpotifyEpisodesManual');

const EMPTY: Omit<Podcast, 'id'> = {
  title: '', slug: '', slug_en: '', description: '', audioUrl: '', coverImage: '',
  duration: '', publishedAt: new Date().toISOString().split('T')[0],
  category: '', status: 'draft', transcript: '',
};

export default function AdminPodcasts() {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [form, setForm] = useState<Omit<Podcast, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const lastFetchedId = useRef<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    try {
      const { created, skipped, errors } = (await importEpisodesCallable()).data;
      if (errors.length > 0) {
        addToast('error', t('podcasts.toastImportPartial', { error: errors[0] }));
      } else {
        addToast('success', t('podcasts.toastImportSuccess', { created, skipped }));
      }
      load();
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('podcasts.toastImportError'));
    } finally {
      setImporting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncMediaStatsCallable();
      const { podcastsUpdated, errors } = result.data;
      if (errors.length > 0) {
        addToast('error', t('podcasts.toastSyncPartial', { error: errors[0] }));
      } else {
        addToast('success', t('podcasts.toastSyncSuccess', { count: podcastsUpdated }));
      }
      load();
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('podcasts.toastSyncError'));
    } finally {
      setSyncing(false);
    }
  };

  const load = () => {
    setLoading(true);
    getAllPodcasts().then((data) => { setPodcasts(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const episodeId = extractSpotifyEpisodeId(form.audioUrl);
    if (!episodeId || episodeId === lastFetchedId.current) return;
    lastFetchedId.current = episodeId;
    const fetchMeta = async () => {
      setFetchingMeta(true);
      try {
        const result = await spotifyProxyCallable({ episodeId });
        const ep = result.data;
        setForm((p) => ({
          ...p,
          title: ep.name,
          description: ep.description,
          coverImage: ep.coverImage || p.coverImage,
          duration: parseMsDuration(ep.durationMs),
          publishedAt: ep.releaseDate,
        }));
      } catch {
        addToast('error', t('podcasts.toastSpotifyFetchError'));
      } finally {
        setFetchingMeta(false);
      }
    };
    fetchMeta();
  }, [form.audioUrl, modalOpen]);

  const openNew = () => {
    lastFetchedId.current = null;
    setEditing(null);
    setForm({ ...EMPTY, publishedAt: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (p: Podcast) => {
    lastFetchedId.current = extractSpotifyEpisodeId(p.audioUrl) ?? null;
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, slug_en: p.slug_en ?? '', description: p.description, audioUrl: p.audioUrl, coverImage: p.coverImage, duration: p.duration, publishedAt: p.publishedAt?.split('T')[0] ?? '', category: p.category, status: p.status, transcript: p.transcript ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const slug_en = form.slug_en || await generateSlugEn(form.title);
      await savePodcast({ ...form, id: editing?.id, slug: form.slug || slugify(form.title), slug_en });
      addToast('success', editing ? t('podcasts.toastUpdated') : t('podcasts.toastCreated'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save podcast failed' });
      addToast('error', error instanceof Error ? error.message : t('podcasts.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('podcasts.confirmDeleteMessage'), async () => {
      try {
        await deletePodcast(id);
        setPodcasts((prev) => prev.filter((p) => p.id !== id));
        addToast('success', t('podcasts.toastDeleted'));
      } catch {
        addToast('error', t('podcasts.toastDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const handleToggleStatus = async (p: Podcast) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    await savePodcast({ ...p, status: newStatus }).catch(() => addToast('error', t('podcasts.toastError')));
    setPodcasts((prev) => prev.map((ep) => ep.id === p.id ? { ...ep, status: newStatus } : ep));
  };

  const filtered = podcasts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-500">{label}</label>
      {node}
    </div>
  );

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('podcasts.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('podcasts.episodeCount', { count: podcasts.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImport}
            disabled={importing}
            icon={importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          >
            {importing ? t('podcasts.importing') : t('podcasts.importFromSpotify')}
          </Button>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            icon={syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            {syncing ? t('podcasts.syncing') : t('podcasts.syncPopularity')}
          </Button>
          <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('podcasts.newPodcast')}</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('podcasts.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="all">{t('podcasts.filterAll')}</option>
            <option value="published">{t('podcasts.filterPublished')}</option>
            <option value="draft">{t('podcasts.filterDraft')}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <Headphones className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('podcasts.emptyState')}</p>
        </div>
      ) : (
        <>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('podcasts.colTitle')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{t('podcasts.colCategory')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{t('podcasts.colDate')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('podcasts.colStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {paged.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.coverImage ? (
                        <img src={p.coverImage} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                          <Headphones className="w-5 h-5 text-brand-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{p.title}</p>
                        <p className="text-xs text-neutral-400">{p.duration}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{p.publishedAt ? formatDate(p.publishedAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(p)} className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${p.status === 'published' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}>
                      {p.status === 'published' ? t('podcasts.statusPublished') : t('podcasts.statusDraft')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center mt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? t('podcasts.modalEditTitle') : t('podcasts.modalNewTitle')}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {field(t('podcasts.fieldTitle'), <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder={t('podcasts.fieldTitlePlaceholder')} className={inputCls} />)}
              {field(t('podcasts.fieldSlug'), <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder={t('podcasts.fieldSlugPlaceholder')} className={inputCls} />)}
              {field(t('podcasts.fieldSlugEn'), <input value={form.slug_en ?? ''} onChange={(e) => setForm((p) => ({ ...p, slug_en: slugify(e.target.value) }))} placeholder="english-slug" className={inputCls} />)}
              <div className="grid sm:grid-cols-2 gap-4">
                {field(t('podcasts.fieldCategory'), <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder={t('podcasts.fieldCategoryPlaceholder')} className={inputCls} />)}
                {field(t('podcasts.fieldDuration'), <input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder={t('podcasts.fieldDurationPlaceholder')} className={inputCls} />)}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {field(t('podcasts.fieldPublishedAt'), <input type="date" value={form.publishedAt} onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))} className={inputCls} />)}
                {field(t('podcasts.fieldStatus'), (
                  <div className="relative">
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Podcast['status'] }))} className={`${inputCls} appearance-none pr-8`}>
                      <option value="draft">{t('podcasts.statusDraft')}</option>
                      <option value="published">{t('podcasts.statusPublished')}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('podcasts.fieldAudioUrl')}</label>
                <div className="relative">
                  <input value={form.audioUrl} onChange={(e) => setForm((p) => ({ ...p, audioUrl: e.target.value }))} placeholder="https://open.spotify.com/episode/..." className={`${inputCls} pr-9`} />
                  {fetchingMeta && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    </div>
                  )}
                </div>
              </div>
              <ImageInput label={t('podcasts.fieldCoverImage')} value={form.coverImage} onChange={(url) => setForm((p) => ({ ...p, coverImage: url }))} folder="podcasts" />
              {field(t('podcasts.fieldDescription'), <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder={t('podcasts.fieldDescriptionPlaceholder')} className={inputCls} />)}
              {field(t('podcasts.fieldTranscript'), <textarea value={form.transcript} onChange={(e) => setForm((p) => ({ ...p, transcript: e.target.value }))} rows={5} placeholder={t('podcasts.fieldTranscriptPlaceholder')} className={inputCls} />)}
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('podcasts.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? t('podcasts.saving') : t('podcasts.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('podcasts.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={t('podcasts.confirmDeleteLabel')}
      />
    </div>
  );
}
