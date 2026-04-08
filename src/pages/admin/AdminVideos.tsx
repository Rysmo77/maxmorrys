import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, Edit2, Video as VideoIcon, Loader2, ChevronDown } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import Button from '../../components/ui/Button';
import ImageInput from '../../components/ui/ImageInput';
import { useToast } from '../../components/ui/Toast';
import { getAllVideos, saveVideo, deleteVideo } from '../../lib/firestore';
import { slugify, formatDate, extractYoutubeVideoId, parseISODuration } from '../../lib/utils';
import type { Video } from '../../types';

const youtubeProxyCallable = httpsCallable<
  { videoId: string },
  { title: string; description: string; thumbnail: string; duration: string; publishedAt: string; viewCount: string }
>(functions, 'youtubeProxy');

const EMPTY: Omit<Video, 'id'> = {
  title: '', slug: '', description: '', videoUrl: '', thumbnailUrl: '',
  duration: '', publishedAt: new Date().toISOString().split('T')[0],
  category: '', status: 'draft', views: 0,
};

export default function AdminVideos() {
  const { addToast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<Omit<Video, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const lastFetchedId = useRef<string | null>(null);

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
        addToast('error', 'Impossible de récupérer les infos YouTube.');
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
    setForm({ title: v.title, slug: v.slug, description: v.description, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl, duration: v.duration, publishedAt: v.publishedAt?.split('T')[0] ?? '', category: v.category, status: v.status, views: v.views });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await saveVideo({ ...form, id: editing?.id, slug: form.slug || slugify(form.title) });
      addToast('success', editing ? 'Vidéo mise à jour.' : 'Vidéo créée.');
      setModalOpen(false);
      load();
    } catch (error: unknown) {
      console.error('Save video failed:', error);
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette vidéo ?')) return;
    await deleteVideo(id).catch(() => addToast('error', 'Erreur de suppression.'));
    setVideos((prev) => prev.filter((v) => v.id !== id));
    addToast('success', 'Vidéo supprimée.');
  };

  const handleToggleStatus = async (v: Video) => {
    const newStatus = v.status === 'published' ? 'draft' : 'published';
    await saveVideo({ ...v, status: newStatus }).catch(() => addToast('error', 'Erreur.'));
    setVideos((prev) => prev.map((ev) => ev.id === v.id ? { ...ev, status: newStatus } : ev));
  };

  const filtered = videos.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white">Vidéos</h1>
          <p className="text-sm text-neutral-500 mt-1">{videos.length} vidéo{videos.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="w-4 h-4" />}>Nouvelle vidéo</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900 dark:text-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="all">Tous les statuts</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
          <VideoIcon className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">Aucune vidéo trouvée.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Titre</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">Vues</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {filtered.map((v) => (
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
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{v.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{v.publishedAt ? formatDate(v.publishedAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(v)} className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${v.status === 'published' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-600'}`}>
                      {v.status === 'published' ? 'Publiée' : 'Brouillon'}
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
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-neutral-900 dark:text-white">{editing ? 'Modifier la vidéo' : 'Nouvelle vidéo'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">Titre *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder="Titre de la vidéo" className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">Slug</label>
                <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="slug-de-la-video" className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">Catégorie</label>
                  <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Tutoriel, Analyse..." className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">Durée</label>
                  <input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="Ex: 15:42" className={inputCls} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">Date de publication</label>
                  <input type="date" value={form.publishedAt} onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-500">Statut</label>
                  <div className="relative">
                    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Video['status'] }))} className={`${inputCls} appearance-none pr-8`}>
                      <option value="draft">Brouillon</option>
                      <option value="published">Publiée</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">URL Vidéo (YouTube)</label>
                <div className="relative">
                  <input value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=... ou youtu.be/..." className={`${inputCls} pr-9`} />
                  {fetchingMeta && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    </div>
                  )}
                </div>
              </div>
              <ImageInput label="Miniature" value={form.thumbnailUrl} onChange={(url) => setForm((p) => ({ ...p, thumbnailUrl: url }))} folder="videos" />
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Description de la vidéo..." className={inputCls} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
