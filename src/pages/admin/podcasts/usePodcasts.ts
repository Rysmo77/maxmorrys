import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';
import { useToast } from '@ds';
import { getAllPodcasts, savePodcast, deletePodcast } from '../../../lib/firestore';
import { slugify, extractSpotifyEpisodeId, parseMsDuration } from '../../../lib/utils';
import { generateSlugEn } from '../../../lib/slugEn';
import { captureError } from '../../../lib/sentry';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { usePagination } from '../../../hooks/usePagination';
import type { Podcast } from '../../../types';

/**
 * L'ÉTAT DE L'ÉCRAN PODCASTS, SORTI DU RENDU — les appels restent à l'identique.
 *
 * LE PIPELINE DU KIT EST « tout · publiés · importés », ET « importés » EST LISIBLE. Un
 * épisode rapatrié de Spotify porte `spotifyEpisodeId` et un identifiant de document préfixé
 * `sp_` (`functions/src/import-episodes.ts`) ; il naît en `draft` — « l'admin relit puis
 * publie ». La troisième étape n'est donc pas un statut, c'est une PROVENANCE : celle de la
 * file qui attend une relecture.
 *
 * ⚠️ Conséquence assumée, écrite au pied de l'écran : un brouillon SAISI À LA MAIN n'a plus
 * d'étape à lui. Il reste dans « tout », il ne se filtre plus seul.
 */

export type PodcastStage = 'all' | 'published' | 'imported';

const todayIso = () => new Date().toISOString().split('T')[0];

const EMPTY: Omit<Podcast, 'id'> = {
  title: '', slug: '', slug_en: '', description: '', audioUrl: '', coverImage: '',
  duration: '', publishedAt: todayIso(),
  category: '', status: 'draft', transcript: '',
};

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

/** Un épisode rapatrié de Spotify, par son marqueur de provenance. */
export const isImported = (p: Podcast) => Boolean(p.spotifyEpisodeId) || p.id.startsWith('sp_');

export function usePodcasts() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const confirm = useConfirmDialog();

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<PodcastStage>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [form, setForm] = useState<Omit<Podcast, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const lastFetchedId = useRef<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAllPodcasts()
      .then((data) => { setPodcasts(data); setLoadedAt(new Date()); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Au MONTAGE SEULEMENT, comme avant l'extraction. `load` dépend de `t`, dont l'identité
  // change à chaque bascule de langue : le mettre en dépendance relancerait une lecture
  // Firestore complète à chaque changement de langue, ce que l'écran ne faisait pas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleImport = useCallback(async () => {
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
  }, [addToast, load, t]);

  const handleSync = useCallback(async () => {
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
  }, [addToast, load, t]);

  // Métadonnées Spotify : mêmes déclencheurs et mêmes dépendances qu'avant l'extraction.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.audioUrl, modalOpen]);

  const setField = useCallback(<K extends keyof Omit<Podcast, 'id'>>(key: K, value: Omit<Podcast, 'id'>[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  }, []);

  const openNew = useCallback(() => {
    lastFetchedId.current = null;
    setEditing(null);
    setForm({ ...EMPTY, publishedAt: todayIso() });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((p: Podcast) => {
    lastFetchedId.current = extractSpotifyEpisodeId(p.audioUrl) ?? null;
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, slug_en: p.slug_en ?? '', description: p.description,
      audioUrl: p.audioUrl, coverImage: p.coverImage, duration: p.duration,
      publishedAt: p.publishedAt?.split('T')[0] ?? '', category: p.category,
      status: p.status, transcript: p.transcript ?? '',
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
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
  }, [addToast, editing, form, load, t]);

  const doDelete = useCallback(async (id: string) => {
    try {
      await deletePodcast(id);
      setPodcasts((prev) => prev.filter((p) => p.id !== id));
      addToast('success', t('podcasts.toastDeleted'));
    } catch {
      addToast('error', t('podcasts.toastDeleteError'));
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
    confirm.requestConfirm(t('podcasts.confirmDeleteMessage'), () => doDelete(id));
  }, [confirm, doDelete, editing, t]);

  const counts = useMemo(() => ({
    all: podcasts.length,
    published: podcasts.filter((p) => p.status === 'published').length,
    imported: podcasts.filter(isImported).length,
  }), [podcasts]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return podcasts.filter((p) => {
      const matchSearch = !needle || p.title.toLowerCase().includes(needle);
      const matchStage = stage === 'all'
        || (stage === 'published' ? p.status === 'published' : isImported(p));
      return matchSearch && matchStage;
    });
  }, [podcasts, search, stage]);

  const pagination = usePagination(filtered);

  return {
    podcasts, loading, loadedAt, saving, fetchingMeta, syncing, importing,
    search, setSearch,
    stage, setStage, counts,
    filtered, ...pagination,
    modalOpen, setModalOpen, editing,
    form, setField,
    openNew, openEdit, handleSave, deleteEditing, handleImport, handleSync,
    confirm,
  };
}
