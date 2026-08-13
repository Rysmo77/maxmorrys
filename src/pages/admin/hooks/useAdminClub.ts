import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getAllClubSubscriptions, updateClubSubscriptionStatus,
  getClubPosts, deleteClubPost, createClubPost, updateClubPost,
  getClubComments, deleteClubComment,
  getClubEvents, saveClubEvent, deleteClubEvent,
  getClubSessions, saveClubSession, deleteClubSession,
  getClubExclusiveInfos, saveClubInfo, deleteClubInfo,
  getEventRegistrations, getSessionRegistrations,
} from '../../../lib/firestore';
import { uploadMedia } from '../../../lib/storage';
import { captureError } from '../../../lib/sentry';
import type {
  ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent,
  ClubDigitosSession, ClubDigitosInfo, ClubEventRegistration, ClubSessionRegistration,
  ClubDigitosComment,
} from '../../../types';

export type AdminClubTab = 'subscriptions' | 'posts' | 'events' | 'sessions' | 'infos' | 'challenges' | 'members' | 'opportunities' | 'reports';

export const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

const EMPTY_EVENT: Omit<ClubDigitosEvent, 'id' | 'createdAt'> = {
  title: '', description: '', date: '', time: '', location: '', type: 'online', link: '', imageUrl: '', status: 'upcoming',
};
const EMPTY_SESSION: Omit<ClubDigitosSession, 'id' | 'createdAt'> = {
  title: '', description: '', scheduledAt: '', link: '', imageUrl: '', status: 'upcoming', duration: '',
};
const EMPTY_INFO: Omit<ClubDigitosInfo, 'id'> = {
  title: '', content: '', publishedAt: new Date().toISOString().split('T')[0], type: 'announcement', link: '', likes: [],
};

export function useAdminClub() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminClubTab>('subscriptions');
  const [loading, setLoading] = useState(false);

  const [subscriptions, setSubscriptions] = useState<ClubDigitosSubscription[]>([]);
  const [posts, setPosts] = useState<ClubDigitosPost[]>([]);
  const [events, setEvents] = useState<ClubDigitosEvent[]>([]);
  const [sessions, setSessions] = useState<ClubDigitosSession[]>([]);
  const [infos, setInfos] = useState<ClubDigitosInfo[]>([]);

  // Admin post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [adminPostContent, setAdminPostContent] = useState('');
  const [publishingPost, setPublishingPost] = useState(false);

  // Post edition + modération commentaires
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, ClubDigitosComment[]>>({});
  const [loadingComments, setLoadingComments] = useState(false);

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [editEvent, setEditEvent] = useState<ClubDigitosEvent | null>(null);
  const [eventForm, setEventForm] = useState<Omit<ClubDigitosEvent, 'id' | 'createdAt'>>(EMPTY_EVENT);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState('');
  const [uploadingEventImage, setUploadingEventImage] = useState(false);
  const eventImageInputRef = useRef<HTMLInputElement>(null);

  // Session form
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editSession, setEditSession] = useState<ClubDigitosSession | null>(null);
  const [sessionForm, setSessionForm] = useState<Omit<ClubDigitosSession, 'id' | 'createdAt'>>(EMPTY_SESSION);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionImageFile, setSessionImageFile] = useState<File | null>(null);
  const [sessionImagePreview, setSessionImagePreview] = useState('');
  const [uploadingSessionImage, setUploadingSessionImage] = useState(false);
  const sessionImageInputRef = useRef<HTMLInputElement>(null);

  // Info form
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [editInfo, setEditInfo] = useState<ClubDigitosInfo | null>(null);
  const [infoForm, setInfoForm] = useState<Omit<ClubDigitosInfo, 'id'>>(EMPTY_INFO);
  const [savingInfo, setSavingInfo] = useState(false);

  // Registrations viewer
  const [eventRegs, setEventRegs] = useState<Record<string, ClubEventRegistration[]>>({});
  const [sessionRegs, setSessionRegs] = useState<Record<string, ClubSessionRegistration[]>>({});
  const [openEventRegs, setOpenEventRegs] = useState<string | null>(null);
  const [openSessionRegs, setOpenSessionRegs] = useState<string | null>(null);
  const [loadingRegs, setLoadingRegs] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [subs, ps, evts, sess, inf] = await Promise.all([
        getAllClubSubscriptions(),
        getClubPosts(100),
        getClubEvents(),
        getClubSessions(),
        getClubExclusiveInfos(),
      ]);
      setSubscriptions(subs);
      setPosts(ps);
      setEvents(evts);
      setSessions(sess);
      setInfos(inf);
    } catch {
      addToast('error', t('clubHook.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubStatus = async (userId: string, status: ClubDigitosSubscription['status']) => {
    try {
      await updateClubSubscriptionStatus(userId, status);
      setSubscriptions((prev) => prev.map((s) => s.userId === userId ? { ...s, status } : s));
      addToast('success', status === 'active' ? t('clubHook.subActivated') : t('clubHook.subUpdated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Update subscription status failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.subStatusError'));
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteClubPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('success', t('clubHook.postDeleted'));
    } catch (error: unknown) {
      captureError(error, { context: 'Delete club post failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.postDeleteError'));
    }
  };

  const openEditPost = (post?: ClubDigitosPost) => {
    if (post) { setEditingPostId(post.id); setEditPostContent(post.content); }
    else { setEditingPostId(null); setEditPostContent(''); }
  };

  const handleSavePostEdit = async (id: string) => {
    if (!editPostContent.trim()) return;
    setSavingPostEdit(true);
    try {
      await updateClubPost(id, { content: editPostContent.trim() });
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, content: editPostContent.trim() } : p));
      setEditingPostId(null);
      addToast('success', t('clubHook.postUpdated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Edit club post failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.postEditError'));
    } finally {
      setSavingPostEdit(false);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!postComments[postId]) {
      setLoadingComments(true);
      const comments = await getClubComments(postId).catch(() => []);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteClubComment(postId, commentId);
      setPostComments((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId) }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1) } : p));
      addToast('success', t('clubHook.commentDeleted'));
    } catch (error: unknown) {
      captureError(error, { context: 'Delete club comment failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.commentDeleteError'));
    }
  };

  const handleLoadEventRegs = async (eventId: string) => {
    if (openEventRegs === eventId) { setOpenEventRegs(null); return; }
    setLoadingRegs(eventId);
    const regs = await getEventRegistrations(eventId).catch(() => []);
    setEventRegs((prev) => ({ ...prev, [eventId]: regs }));
    setOpenEventRegs(eventId);
    setLoadingRegs(null);
  };

  const handleLoadSessionRegs = async (sessionId: string) => {
    if (openSessionRegs === sessionId) { setOpenSessionRegs(null); return; }
    setLoadingRegs(sessionId);
    const regs = await getSessionRegistrations(sessionId).catch(() => []);
    setSessionRegs((prev) => ({ ...prev, [sessionId]: regs }));
    setOpenSessionRegs(sessionId);
    setLoadingRegs(null);
  };

  const handleAdminPost = async () => {
    if (!adminPostContent.trim()) return;
    setPublishingPost(true);
    try {
      await createClubPost({
        userId: user?.uid ?? '',
        userName: user?.displayName || 'Admin',
        content: adminPostContent.trim(),
        type: 'post',
        category: 'general',
        isAdmin: true,
      });
      setAdminPostContent('');
      setShowPostForm(false);
      const updated = await getClubPosts(100);
      setPosts(updated);
      addToast('success', t('clubHook.adminPostCreated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Create admin post failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.postPublishError'));
    } finally {
      setPublishingPost(false);
    }
  };

  // ── Events CRUD ──
  const openEventForm = (event?: ClubDigitosEvent) => {
    if (event) {
      setEditEvent(event);
      setEventForm({ title: event.title, description: event.description, date: event.date, time: event.time ?? '', location: event.location, type: event.type, link: event.link ?? '', imageUrl: event.imageUrl ?? '', status: event.status });
      setEventImagePreview(event.imageUrl ?? '');
    } else {
      setEditEvent(null);
      setEventForm(EMPTY_EVENT);
      setEventImagePreview('');
    }
    setEventImageFile(null);
    setShowEventForm(true);
  };

  const handleEventImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast('error', t('clubHook.imageMaxSize')); return; }
    setEventImageFile(file);
    setEventImagePreview(URL.createObjectURL(file));
    if (eventImageInputRef.current) eventImageInputRef.current.value = '';
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date) return;
    setSavingEvent(true);
    try {
      let imageUrl = eventForm.imageUrl ?? '';
      if (eventImageFile) {
        setUploadingEventImage(true);
        const ext = eventImageFile.name.split('.').pop() || 'jpg';
        imageUrl = await uploadMedia(eventImageFile, `club_events/${Date.now()}.${ext}`);
        setUploadingEventImage(false);
        setEventImageFile(null);
        setEventImagePreview('');
      }
      await saveClubEvent({ ...eventForm, imageUrl: imageUrl || undefined, createdAt: editEvent?.createdAt ?? new Date().toISOString(), ...(editEvent ? { id: editEvent.id } : {}) });
      setShowEventForm(false);
      const updated = await getClubEvents();
      setEvents(updated);
      addToast('success', editEvent ? t('clubHook.eventUpdated') : t('clubHook.eventCreated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Save event failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.saveError'));
    } finally {
      setSavingEvent(false);
      setUploadingEventImage(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteClubEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast('success', t('clubHook.eventDeleted'));
    } catch (error: unknown) {
      captureError(error, { context: 'Delete event failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.eventDeleteError'));
    }
  };

  // ── Sessions CRUD ──
  const openSessionForm = (session?: ClubDigitosSession) => {
    if (session) {
      setEditSession(session);
      setSessionForm({ title: session.title, description: session.description, scheduledAt: session.scheduledAt, link: session.link ?? '', imageUrl: session.imageUrl ?? '', status: session.status, duration: session.duration ?? '' });
      setSessionImagePreview(session.imageUrl ?? '');
    } else {
      setEditSession(null);
      setSessionForm(EMPTY_SESSION);
      setSessionImagePreview('');
    }
    setSessionImageFile(null);
    setShowSessionForm(true);
  };

  const handleSessionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addToast('error', t('clubHook.imageMaxSize')); return; }
    setSessionImageFile(file);
    setSessionImagePreview(URL.createObjectURL(file));
    if (sessionImageInputRef.current) sessionImageInputRef.current.value = '';
  };

  const handleSaveSession = async () => {
    if (!sessionForm.title.trim() || !sessionForm.scheduledAt) return;
    setSavingSession(true);
    try {
      let imageUrl = sessionForm.imageUrl ?? '';
      if (sessionImageFile) {
        setUploadingSessionImage(true);
        const ext = sessionImageFile.name.split('.').pop() || 'jpg';
        imageUrl = await uploadMedia(sessionImageFile, `club_sessions/${Date.now()}.${ext}`);
        setUploadingSessionImage(false);
        setSessionImageFile(null);
        setSessionImagePreview('');
      }
      await saveClubSession({ ...sessionForm, imageUrl: imageUrl || undefined, createdAt: editSession?.createdAt ?? new Date().toISOString(), ...(editSession ? { id: editSession.id } : {}) });
      setShowSessionForm(false);
      const updated = await getClubSessions();
      setSessions(updated);
      addToast('success', editSession ? t('clubHook.sessionUpdated') : t('clubHook.sessionCreated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Save session failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.saveError'));
    } finally {
      setSavingSession(false);
      setUploadingSessionImage(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteClubSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      addToast('success', t('clubHook.sessionDeleted'));
    } catch (error: unknown) {
      captureError(error, { context: 'Delete session failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.sessionDeleteError'));
    }
  };

  // ── Infos CRUD ──
  const openInfoForm = (info?: ClubDigitosInfo) => {
    if (info) {
      setEditInfo(info);
      setInfoForm({ title: info.title, content: info.content, publishedAt: info.publishedAt, type: info.type, link: info.link ?? '', likes: info.likes ?? [] });
    } else {
      setEditInfo(null);
      setInfoForm({ ...EMPTY_INFO, publishedAt: new Date().toISOString().split('T')[0] });
    }
    setShowInfoForm(true);
  };

  const handleSaveInfo = async () => {
    if (!infoForm.title.trim() || !infoForm.content.trim()) return;
    setSavingInfo(true);
    try {
      await saveClubInfo({ ...infoForm, ...(editInfo ? { id: editInfo.id } : {}) });
      setShowInfoForm(false);
      const updated = await getClubExclusiveInfos();
      setInfos(updated);
      addToast('success', editInfo ? t('clubHook.infoUpdated') : t('clubHook.infoCreated'));
    } catch (error: unknown) {
      captureError(error, { context: 'Save info failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.saveError'));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDeleteInfo = async (id: string) => {
    try {
      await deleteClubInfo(id);
      setInfos((prev) => prev.filter((i) => i.id !== id));
      addToast('success', t('clubHook.infoDeleted'));
    } catch (error: unknown) {
      captureError(error, { context: 'Delete info failed' });
      addToast('error', error instanceof Error ? error.message : t('clubHook.infoDeleteError'));
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;
  /*
   * Somme des montants réellement enregistrés, et non `nb_actifs × prix`. Le calcul précédent
   * comptait un filleul remisé (16 915) comme un plein tarif, et un octroi gracieux — sans
   * encaissement — comme un abonnement payé.
   *
   * ⚠️ Reste une estimation : `firestore.rules` ne valide pas `amount` sur `club_subscriptions`,
   * et le document est écrasé au renouvellement, ce qui efface l'historique pluriannuel. Un
   * chiffre d'affaires d'audit se lit dans `transactions`, filtré sur
   * `formationId === 'club_digitos'` et `status === 'completed'` — seule collection écrite
   * exclusivement côté serveur puis confirmée par le webhook.
   */
  const revenue = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((total, s) => total + (s.amount ?? 0), 0);

  return {
    // Tab
    tab, setTab,
    loading, load,

    // Data
    subscriptions, posts, events, sessions, infos,
    activeCount, pendingCount, revenue,

    // Subscriptions
    handleSubStatus,

    // Posts
    showPostForm, setShowPostForm,
    adminPostContent, setAdminPostContent,
    publishingPost, handleAdminPost, handleDeletePost,
    editingPostId, editPostContent, setEditPostContent, savingPostEdit, openEditPost, handleSavePostEdit,
    openComments, postComments, loadingComments, handleToggleComments, handleDeleteComment,

    // Events
    showEventForm, setShowEventForm,
    editEvent, eventForm, setEventForm,
    savingEvent, uploadingEventImage,
    eventImagePreview, setEventImagePreview,
    eventImageFile, setEventImageFile,
    eventImageInputRef,
    openEventForm, handleEventImageSelect, handleSaveEvent, handleDeleteEvent,
    eventRegs, openEventRegs, loadingRegs,
    handleLoadEventRegs,

    // Sessions
    showSessionForm, setShowSessionForm,
    editSession, sessionForm, setSessionForm,
    savingSession, uploadingSessionImage,
    sessionImagePreview, setSessionImagePreview,
    sessionImageFile, setSessionImageFile,
    sessionImageInputRef,
    openSessionForm, handleSessionImageSelect, handleSaveSession, handleDeleteSession,
    sessionRegs, openSessionRegs,
    handleLoadSessionRegs,

    // Infos
    showInfoForm, setShowInfoForm,
    editInfo, infoForm, setInfoForm,
    savingInfo, openInfoForm, handleSaveInfo, handleDeleteInfo,
  };
}
