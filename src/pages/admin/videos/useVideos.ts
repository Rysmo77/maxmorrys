import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';
import { useToast } from '../../../components/ui/Toast';
import { getAllVideos, saveVideo, deleteVideo } from '../../../lib/firestore';
import { slugify, extractYoutubeVideoId, parseISODuration } from '../../../lib/utils';
import { generateSlugEn } from '../../../lib/slugEn';
import { captureError } from '../../../lib/sentry';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { usePagination } from '../../../hooks/usePagination';
import type { Video } from '../../../types';

/**
 * L'ÉTAT DE L'ÉCRAN VIDÉOS, SORTI DU RENDU — les appels restent à l'identique.
 *
 * Pipeline du kit : « tout · publiées · brouillons ». Les trois étapes existent réellement
 * ici, contrairement aux podcasts : `status` suffit à les produire.
 *
 * `views` VIENT DE YOUTUBE, PAS DE LA BASE. `syncMediaStatsManual` le recopie dans Firestore
 * depuis l'API YouTube ; le nombre est donc lu en base, mais sa vérité est ailleurs et il
 * date du dernier passage de la synchronisation. C'est ce que dit sa source citée à l'écran —
 * pas « db », qui laisserait croire que le produit compte lui-même ses vues.
 */

export type VideoStage = 'all' | 'published' | 'draft';

const todayIso = () => new Date().toISOString().split('T')[0];

const EMPTY: Omit<Video, 'id'> = {
  title: '', slug: '', slug_en: '', description: '', videoUrl: '', thumbnailUrl: '',
  duration: '', publishedAt: todayIso(),
  category: '', status: 'draft', views: 0,
};

const youtubeProxyCallable = httpsCallable<
  { videoId: string },
  { title: string; description: string; thumbnail: string; duration: string; publishedAt: string; viewCount: string }
>(functions, 'youtubeProxy');

const syncMediaStatsCallable = httpsCallable<
  void,
  { videosProcessed: number; videosUpdated: number; podcastsProcessed: number; podcastsUpdated: number; errors: string[] }
>(functions, 'syncMediaStatsManual');

export function useVideos() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<VideoStage>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<Omit<Video, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const lastFetchedId = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAllVideos()
      .then((data) => { setVideos(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Au MONTAGE SEULEMENT, comme avant l'extraction. `load` dépend de `t`, dont l'identité
  // change à chaque bascule de langue : le mettre en dépendance relancerait une lecture
  // Firestore complète à chaque changement de langue, ce que l'écran ne faisait pas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleSync = useCallback(async () => {
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
  }, [addToast, load, t]);

  // Métadonnées YouTube : mêmes déclencheurs et mêmes dépendances qu'avant l'extraction.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.videoUrl, modalOpen]);

  const setField = useCallback(<K extends keyof Omit<Video, 'id'>>(key: K, value: Omit<Video, 'id'>[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  const openNew = useCallback(() => {
    lastFetchedId.current = null;
    setEditing(null);
    setForm({ ...EMPTY, publishedAt: todayIso() });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((v: Video) => {
    // Mémoriser l'ID déjà associé pour ne pas re-fetcher à l'ouverture
    lastFetchedId.current = extractYoutubeVideoId(v.videoUrl) ?? null;
    setEditing(v);
    setForm({
      title: v.title, slug: v.slug, slug_en: v.slug_en ?? '', description: v.description,
      videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl, duration: v.duration,
      publishedAt: v.publishedAt?.split('T')[0] ?? '', category: v.category,
      status: v.status, views: v.views,
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
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
  }, [addToast, editing, form, load, t]);

  const doDelete = useCallback(async (id: string) => {
    try {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      addToast('success', t('videos.toastDeleted'));
    } catch {
      addToast('error', t('videos.toastDeleteError'));
    }
    confirm.closeConfirm();
  }, [addToast, confirm, t]);

  /** Supprime depuis l'éditeur : la fiche ouverte se referme d'abord. */
  const deleteEditing = useCallback(() => {
    if (!editing) return;
    const id = editing.id;
    // L'éditeur se ferme AVANT la demande de confirmation : deux `Modal` ouverts en même
    // temps, ce sont deux pièges de focus concurrents sur le même `window.keydown`.
    setModalOpen(false);
    confirm.requestConfirm(t('videos.confirmDeleteMessage'), () => doDelete(id));
  }, [confirm, doDelete, editing, t]);

  const counts = useMemo(() => ({
    all: videos.length,
    published: videos.filter((v) => v.status === 'published').length,
    draft: videos.filter((v) => v.status !== 'published').length,
  }), [videos]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return videos.filter((v) => {
      const matchSearch = !needle || v.title.toLowerCase().includes(needle);
      const matchStage = stage === 'all'
        || (stage === 'published' ? v.status === 'published' : v.status !== 'published');
      return matchSearch && matchStage;
    });
  }, [videos, search, stage]);

  const pagination = usePagination(filtered);

  return {
    videos, loading, loadedAt, saving, fetchingMeta, syncing,
    search, setSearch,
    stage, setStage, counts,
    filtered, ...pagination,
    modalOpen, setModalOpen, editing,
    form, setField,
    openNew, openEdit, handleSave, deleteEditing, handleSync,
    confirm,
  };
}
