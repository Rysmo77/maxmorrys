import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Trash2, Edit2, Video as VideoIcon, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ImageInput from '../../components/ui/ImageInput';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { getAllVideos, saveVideo, deleteVideo } from '../../lib/firestore';
import { slugify, extractYoutubeVideoId, parseISODuration } from '../../lib/utils';
import { generateSlugEn } from '../../lib/slugEn';
import { useFormat } from '../../hooks/useFormat';
import type { Video } from '../../types';
import { captureError } from '../../lib/sentry';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

const youtubeProxyCallable = httpsCallable<
  { videoId: string },
  { title: string; description: string; thumbnail: string; duration: string; publishedAt: string; viewCount: string }
>(functions, 'youtubeProxy');

const syncMediaStatsCallable = httpsCallable<
  void,
  { videosProcessed: number; videosUpdated: number; podcastsProcessed: number; podcastsUpdated: number; errors: string[] }
>(functions, 'syncMediaStatsManual');

const EMPTY: Omit<Video, 'id'> = {
  title: '', slug: '', slug_en: '', description: '', videoUrl: '', thumbnailUrl: '',
  duration: '', publishedAt: new Date().toISOString().split('T')[0],
  category: '', status: 'draft', views: 0,
};

export default function AdminVideos() {
  const { t } = useTranslation('admin');
  const { formatDate, locale } = useFormat();
  const { addToast } = useToast();
  const confirm = useConfirmDialog();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<Omit<Video, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const lastFetchedId = useRef<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncMediaStatsCallable();
      const { videosUpdated, errors } = result.data;
      if (errors.length > 0) {
        addToast('error', t('videos.toastSyncPartial', { error: errors[0] }));
      } else {
        addToast('success', t('videos.toastSyncSuccess', { count: videosUpdated }));
      }
      load();
    } catch (error: unknown) {
      addToast('error', error instanceof Error ? error.message : t('videos.toastSyncError'));
    } finally {
      setSyncing(false);
    }
  };

  const load = () => {
    setLoading(true);
    getAllVideos().then((data) => { setVideos(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const videoId = extractYoutubeVideoId(form.videoUrl);
    if (!videoId || videoId === lastFetchedId.current) return;
    lastFetchedId.current = videoId;
    const fetchMeta = async () => {
      setFetchingMeta(true);
      try {
        const result = await youtubeProxyCallable({ videoId });
        const item = result.data;
        setForm((p) => ({
          ...p,
          title: item.title,
          description: item.description,
          thumbnailUrl: item.thumbnail,
          duration: parseISODuration(item.duration),
          publishedAt: item.publishedAt.split('T')[0],
          views: parseInt(item.viewCount, 10),
        }));
      } catch {
        addToast('error', t('videos.toastFetchMetaError'));
      } finally {
        setFetchingMeta(false);
      }
    };
    fetchMeta();
  }, [form.videoUrl, modalOpen]);

  const openNew = () => {
    lastFetchedId.current = null;
    setEditing(null);
    setForm({ ...EMPTY, publishedAt: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (v: Video) => {
    // Mémoriser l'ID déjà associé pour ne pas re-fetcher à l'ouverture
    lastFetchedId.current = extractYoutubeVideoId(v.videoUrl) ?? null;
    setEditing(v);
    setForm({ title: v.title, slug: v.slug, slug_en: v.slug_en ?? '', description: v.description, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl, duration: v.duration, publishedAt: v.publishedAt?.split('T')[0] ?? '', category: v.category, status: v.status, views: v.views });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const slug_en = form.slug_en || await generateSlugEn(form.title);
      await saveVideo({ ...form, id: editing?.id, slug: form.slug || slugify(form.title), slug_en });
      addToast('success', editing ? t('videos.toastUpdated') : t('videos.toastCreated'));
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      captureError(error, { context: 'Save video failed' });
      addToast('error', error instanceof Error ? error.message : t('videos.toastSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm.requestConfirm(t('videos.confirmDeleteMessage'), async () => {
      try {
        await deleteVideo(id);
        setVideos((prev) => prev.filter((v) => v.id !== id));
        addToast('success', t('videos.toastDeleted'));
      } catch {
        addToast('error', t('videos.toastDeleteError'));
      }
      confirm.closeConfirm();
    });
  };

  const handleToggleStatus = async (v: Video) => {
    const newStatus = v.status === 'published' ? 'draft' : 'published';
    await saveVideo({ ...v, status: newStatus }).catch(() => addToast('error', t('videos.toastError')));
    setVideos((prev) => prev.map((ev) => ev.id === v.id ? { ...ev, status: newStatus } : ev));
  };

  const filtered = videos.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { paged, page, totalPages, setPage } = usePagination(filtered);

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">{t('videos.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('videos.count', { count: videos.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            icon={syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            {syncing ? t('videos.syncing') : t('videos.syncViews')}
          </Button>
          <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>{t('videos.newVideo')}</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('videos.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="all">{t('videos.filterAll')}</option>
            <option value="published">{t('videos.filterPublished')}</option>
            <option value="draft">{t('videos.filterDraft')}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <VideoIcon className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">{t('videos.empty')}</p>
        </div>
      ) : (
        <>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('videos.colTitle')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{t('videos.colCategory')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{t('videos.colViews')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{t('videos.colDate')}</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">{t('videos.colStatus')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {paged.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt="" className="w-16 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                          <VideoIcon className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{v.title}</p>
                        <p className="text-xs text-neutral-400">{v.duration}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">{v.category || '—'}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{v.views.toLocaleString(locale)}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{v.publishedAt ? formatDate(v.publishedAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(v)} className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${v.status === 'published' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}>
                      {v.status === 'published' ? t('videos.statusPublished') : t('videos.statusDraft')}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? t('videos.modalEditTitle') : t('videos.modalNewTitle')}</h2>
              <button onClick={() => setModalOpen(false)} aria-label={t('videos.close')} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('videos.fieldTitle')}</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder={t('videos.fieldTitlePlaceholder')} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('videos.fieldSlug')}</label>
                <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="slug-de-la-video" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('videos.fieldSlugEn')}</label>
                <input value={form.slug_en ?? ''} onChange={(e) => setForm((p) => ({ ...p, slug_en: slugify(e.target.value) }))} placeholder="english-slug" className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('videos.fieldCategory')}</label>
                  <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder={t('videos.fieldCategoryPlaceholder')} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('videos.fieldDuration')}</label>
                  <input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder={t('videos.fieldDurationPlaceholder')} className={inputCls} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('videos.fieldPublishedAt')}</label>
                  <input type="date" value={form.publishedAt} onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">{t('videos.fieldStatus')}</label>
                  <div className="relative">
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Video['status'] }))} className={`${inputCls} appearance-none pr-8`}>
                      <option value="draft">{t('videos.statusDraft')}</option>
                      <option value="published">{t('videos.statusPublished')}</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('videos.fieldVideoUrl')}</label>
                <div className="relative">
                  <input value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=... ou youtu.be/..." className={`${inputCls} pr-9`} />
                  {fetchingMeta && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    </div>
                  )}
                </div>
              </div>
              <ImageInput label={t('videos.fieldThumbnail')} value={form.thumbnailUrl} onChange={(url) => setForm((p) => ({ ...p, thumbnailUrl: url }))} folder="videos" />
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{t('videos.fieldDescription')}</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder={t('videos.fieldDescriptionPlaceholder')} className={inputCls} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{t('videos.cancel')}</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? t('videos.saving') : t('videos.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onConfirm={confirm.onConfirm}
        title={t('videos.confirmDeleteTitle')}
        message={confirm.message}
        confirmLabel={t('videos.confirmDeleteLabel')}
      />
    </div>
  );
}
