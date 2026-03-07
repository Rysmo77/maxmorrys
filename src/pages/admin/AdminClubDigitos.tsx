import { useState, useEffect, useRef } from 'react';
import {
  Crown, Users, Rss, Calendar, Video, Bell, Trash2, CheckCircle, XCircle,
  Plus, X, Save, Pencil, Loader2, RefreshCw, ExternalLink, Send, Image as ImageIcon,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { cn, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllClubSubscriptions, updateClubSubscriptionStatus,
  getClubPosts, deleteClubPost, createClubPost,
  getClubEvents, saveClubEvent, deleteClubEvent,
  getClubSessions, saveClubSession, deleteClubSession,
  getClubExclusiveInfos, saveClubInfo, deleteClubInfo,
  getEventRegistrations, getSessionRegistrations,
} from '../../lib/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import type {
  ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent,
  ClubDigitosSession, ClubDigitosInfo, ClubEventRegistration, ClubSessionRegistration,
} from '../../types';

type AdminClubTab = 'subscriptions' | 'posts' | 'events' | 'sessions' | 'infos';

const inputCls = 'w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

const EMPTY_EVENT: Omit<ClubDigitosEvent, 'id' | 'createdAt'> = {
  title: '', description: '', date: '', time: '', location: '', type: 'online', link: '', imageUrl: '', status: 'upcoming',
};
const EMPTY_SESSION: Omit<ClubDigitosSession, 'id' | 'createdAt'> = {
  title: '', description: '', scheduledAt: '', link: '', imageUrl: '', status: 'upcoming', duration: '',
};
const EMPTY_INFO: Omit<ClubDigitosInfo, 'id'> = {
  title: '', content: '', publishedAt: new Date().toISOString().split('T')[0], type: 'announcement', link: '', likes: [],
};

export default function AdminClubDigitos() {
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
      addToast('error', 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubStatus = async (userId: string, status: ClubDigitosSubscription['status']) => {
    try {
      await updateClubSubscriptionStatus(userId, status);
      setSubscriptions((prev) => prev.map((s) => s.userId === userId ? { ...s, status } : s));
      addToast('success', status === 'active' ? 'Abonnement activé.' : 'Abonnement mis à jour.');
    } catch {
      addToast('error', 'Erreur lors de la mise à jour.');
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteClubPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('success', 'Publication supprimée.');
    } catch {
      addToast('error', 'Erreur lors de la suppression.');
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
      addToast('success', 'Publication admin créée.');
    } catch {
      addToast('error', 'Erreur lors de la publication.');
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
    if (file.size > 5 * 1024 * 1024) { addToast('error', 'L\'image ne doit pas dépasser 5 Mo.'); return; }
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
        const fileRef = storageRef(storage, `club_events/${Date.now()}.${ext}`);
        await uploadBytes(fileRef, eventImageFile);
        imageUrl = await getDownloadURL(fileRef);
        setUploadingEventImage(false);
        setEventImageFile(null);
        setEventImagePreview('');
      }
      await saveClubEvent({ ...eventForm, imageUrl: imageUrl || undefined, createdAt: editEvent?.createdAt ?? new Date().toISOString(), ...(editEvent ? { id: editEvent.id } : {}) });
      setShowEventForm(false);
      const updated = await getClubEvents();
      setEvents(updated);
      addToast('success', editEvent ? 'Événement mis à jour.' : 'Événement créé.');
    } catch {
      addToast('error', 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavingEvent(false);
      setUploadingEventImage(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteClubEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast('success', 'Événement supprimé.');
    } catch {
      addToast('error', 'Erreur lors de la suppression.');
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
    if (file.size > 5 * 1024 * 1024) { addToast('error', 'L\'image ne doit pas dépasser 5 Mo.'); return; }
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
        const fileRef = storageRef(storage, `club_sessions/${Date.now()}.${ext}`);
        await uploadBytes(fileRef, sessionImageFile);
        imageUrl = await getDownloadURL(fileRef);
        setUploadingSessionImage(false);
        setSessionImageFile(null);
        setSessionImagePreview('');
      }
      await saveClubSession({ ...sessionForm, imageUrl: imageUrl || undefined, createdAt: editSession?.createdAt ?? new Date().toISOString(), ...(editSession ? { id: editSession.id } : {}) });
      setShowSessionForm(false);
      const updated = await getClubSessions();
      setSessions(updated);
      addToast('success', editSession ? 'Session mise à jour.' : 'Session créée.');
    } catch {
      addToast('error', 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavingSession(false);
      setUploadingSessionImage(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteClubSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      addToast('success', 'Session supprimée.');
    } catch {
      addToast('error', 'Erreur lors de la suppression.');
    }
  };

  // ── Infos CRUD ──
  const openInfoForm = (info?: ClubDigitosInfo) => {
    if (info) {
      setEditInfo(info);
      setInfoForm({ title: info.title, content: info.content, publishedAt: info.publishedAt, type: info.type, link: info.link ?? '' });
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
      addToast('success', editInfo ? 'Info mise à jour.' : 'Info créée.');
    } catch {
      addToast('error', 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDeleteInfo = async (id: string) => {
    try {
      await deleteClubInfo(id);
      setInfos((prev) => prev.filter((i) => i.id !== id));
      addToast('success', 'Info supprimée.');
    } catch {
      addToast('error', 'Erreur lors de la suppression.');
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;
  const revenue = subscriptions.filter((s) => s.status === 'active').length * 10000;

  const tabs = [
    { id: 'subscriptions' as AdminClubTab, icon: Users, label: 'Abonnements', count: subscriptions.length },
    { id: 'posts' as AdminClubTab, icon: Rss, label: 'Publications', count: posts.length },
    { id: 'events' as AdminClubTab, icon: Calendar, label: 'Événements', count: events.length },
    { id: 'sessions' as AdminClubTab, icon: Video, label: 'Sessions Live', count: sessions.length },
    { id: 'infos' as AdminClubTab, icon: Bell, label: 'Infos exclusives', count: infos.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Club des Digitos</h1>
            <p className="text-sm text-neutral-500">Gestion de la communauté exclusive</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors" title="Actualiser">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Membres actifs', value: activeCount, color: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400' },
          { label: 'En attente de paiement', value: pendingCount, color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400' },
          { label: 'Revenus Club (FCFA)', value: revenue.toLocaleString(), color: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' },
        ].map((s) => (
          <Card key={s.label} hover>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>}

      {/* ── ABONNEMENTS ── */}
      {!loading && tab === 'subscriptions' && (
        <Card>
          {subscriptions.length === 0 ? (
            <p className="text-center text-neutral-400 py-8">Aucun abonnement pour l'instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                    <th className="pb-3 font-semibold">Membre</th>
                    <th className="pb-3 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Début</th>
                    <th className="pb-3 font-semibold">Expiration</th>
                    <th className="pb-3 font-semibold">Renouvellement</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-neutral-900 dark:text-white">{sub.userName || '—'}</p>
                        <p className="text-xs text-neutral-400">{sub.userEmail || sub.userId}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={sub.status === 'active' ? 'success' : sub.status === 'pending' ? 'warning' : 'error'}
                          size="sm"
                        >
                          {sub.status === 'active' ? 'Actif' : sub.status === 'pending' ? 'En attente' : sub.status === 'expired' ? 'Expiré' : 'Annulé'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-neutral-500">{formatDate(sub.startedAt)}</td>
                      <td className="py-3 pr-4 text-neutral-500">{formatDate(sub.expiresAt)}</td>
                      <td className="py-3 pr-4 text-neutral-500">{sub.autoRenew ? 'Auto' : 'Manuel'}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {sub.status !== 'active' && (
                            <button
                              onClick={() => handleSubStatus(sub.userId, 'active')}
                              className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                              title="Activer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleSubStatus(sub.userId, 'cancelled')}
                              className="p-1.5 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                              title="Annuler"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── PUBLICATIONS ── */}
      {!loading && tab === 'posts' && (
        <div className="space-y-3">
          {/* Admin post creation */}
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => setShowPostForm((v) => !v)} icon={<Plus className="w-4 h-4" />}>
              Publier en tant qu'Admin
            </Button>
          </div>
          {showPostForm && (
            <Card>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Nouvelle publication admin</h3>
              <textarea
                value={adminPostContent}
                onChange={(e) => setAdminPostContent(e.target.value)}
                placeholder="Message à la communauté..."
                rows={4}
                className={`${inputCls} resize-y mb-3`}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => { setShowPostForm(false); setAdminPostContent(''); }}>Annuler</Button>
                <Button size="sm" onClick={handleAdminPost} disabled={publishingPost || !adminPostContent.trim()} icon={publishingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}>
                  {publishingPost ? 'Publication...' : 'Publier'}
                </Button>
              </div>
            </Card>
          )}

          {posts.length === 0 ? (
            <Card><p className="text-center text-neutral-400 py-8">Aucune publication.</p></Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {post.userPhoto ? (
                        <img src={post.userPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                          {post.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{post.userName}</p>
                        {post.isAdmin && <Badge variant="brand" size="sm">Admin</Badge>}
                        <span className="text-xs text-neutral-400">{formatDate(post.createdAt)}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">{post.content}</p>
                      <p className="text-xs text-neutral-400 mt-1">{post.likes.length} j'aime</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── ÉVÉNEMENTS ── */}
      {!loading && tab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openEventForm()} icon={<Plus className="w-4 h-4" />}>Nouvel événement</Button>
          </div>

          {showEventForm && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">{editEvent ? 'Modifier l\'événement' : 'Nouvel événement'}</h3>
                <button onClick={() => setShowEventForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Titre *</label>
                  <input value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titre de l'événement" className={inputCls} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Description</label>
                  <textarea value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-y`} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Date *</label>
                  <input type="date" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Heure</label>
                  <input type="time" value={eventForm.time} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Lieu / Lien</label>
                  <input value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} placeholder="Ex: Dakar, Sénégal ou Zoom" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Type</label>
                  <select value={eventForm.type} onChange={(e) => setEventForm((p) => ({ ...p, type: e.target.value as 'online' | 'physical' }))} className={inputCls}>
                    <option value="online">En ligne</option>
                    <option value="physical">Présentiel</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Statut</label>
                  <select value={eventForm.status} onChange={(e) => setEventForm((p) => ({ ...p, status: e.target.value as 'upcoming' | 'past' }))} className={inputCls}>
                    <option value="upcoming">À venir</option>
                    <option value="past">Passé</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Lien (optionnel)</label>
                  <input type="url" value={eventForm.link} onChange={(e) => setEventForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." className={inputCls} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-neutral-500">Image / Flyer de l'événement</label>
                  <input type="file" accept="image/*" ref={eventImageInputRef} onChange={handleEventImageSelect} className="hidden" />
                  {eventImagePreview ? (
                    <div className="relative w-full max-w-xs">
                      <img src={eventImagePreview} alt="flyer preview" className="rounded-xl w-full object-cover max-h-48" />
                      <button type="button" onClick={() => { setEventImageFile(null); setEventImagePreview(''); setEventForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => eventImageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 text-sm text-neutral-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                      <ImageIcon className="w-4 h-4" /> Importer une image (flyer)
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <Button variant="outline" onClick={() => setShowEventForm(false)}>Annuler</Button>
                <Button onClick={handleSaveEvent} disabled={savingEvent || uploadingEventImage || !eventForm.title.trim() || !eventForm.date} icon={(savingEvent || uploadingEventImage) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {uploadingEventImage ? 'Upload...' : savingEvent ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {events.length === 0 && !showEventForm ? (
            <Card><p className="text-center text-neutral-400 py-8">Aucun événement créé.</p></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <Card key={event.id} hover padding="none">
                  {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover rounded-t-2xl" />}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={event.status === 'upcoming' ? 'success' : 'default'} size="sm">
                          {event.status === 'upcoming' ? 'À venir' : 'Passé'}
                        </Badge>
                        <Badge variant={event.type === 'online' ? 'brand' : 'warning'} size="sm">
                          {event.type === 'online' ? 'En ligne' : 'Présentiel'}
                        </Badge>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEventForm(event)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="font-bold text-neutral-900 dark:text-white mb-1">{event.title}</p>
                    <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{event.description}</p>
                    <div className="text-xs text-neutral-400 space-y-0.5 mb-3">
                      <p>📅 {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}{event.time && ` à ${event.time}`}</p>
                      <p>📍 {event.location}</p>
                      {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-500 hover:underline"><ExternalLink className="w-3 h-3" /> Lien</a>}
                    </div>
                    <button
                      onClick={() => handleLoadEventRegs(event.id)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {loadingRegs === event.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                      Inscriptions {eventRegs[event.id] ? `(${eventRegs[event.id].length})` : ''}
                    </button>
                    {openEventRegs === event.id && (
                      <div className="mt-2 space-y-1">
                        {(eventRegs[event.id] ?? []).length === 0 ? (
                          <p className="text-xs text-neutral-400">Aucune inscription.</p>
                        ) : (
                          (eventRegs[event.id] ?? []).map((r) => (
                            <div key={r.userId} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg px-2 py-1">
                              <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0" />
                              <span>{r.userName}</span>
                              {r.userEmail && <span className="text-neutral-400">· {r.userEmail}</span>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SESSIONS LIVE ── */}
      {!loading && tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openSessionForm()} icon={<Plus className="w-4 h-4" />}>Nouvelle session</Button>
          </div>

          {showSessionForm && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">{editSession ? 'Modifier la session' : 'Nouvelle session live'}</h3>
                <button onClick={() => setShowSessionForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Titre *</label>
                  <input value={sessionForm.title} onChange={(e) => setSessionForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Session Q&A mensuelle" className={inputCls} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Description</label>
                  <textarea value={sessionForm.description} onChange={(e) => setSessionForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-y`} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Date & Heure *</label>
                  <input type="datetime-local" value={sessionForm.scheduledAt} onChange={(e) => setSessionForm((p) => ({ ...p, scheduledAt: e.target.value }))} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Durée prévue</label>
                  <input value={sessionForm.duration} onChange={(e) => setSessionForm((p) => ({ ...p, duration: e.target.value }))} placeholder="Ex: 1h30" className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Statut</label>
                  <select value={sessionForm.status} onChange={(e) => setSessionForm((p) => ({ ...p, status: e.target.value as 'upcoming' | 'past' }))} className={inputCls}>
                    <option value="upcoming">À venir</option>
                    <option value="past">Passée</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Lien de connexion</label>
                  <input type="url" value={sessionForm.link} onChange={(e) => setSessionForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://meet.google.com/..." className={inputCls} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-neutral-500">Image / Créa de la session Live</label>
                  <input type="file" accept="image/*" ref={sessionImageInputRef} onChange={handleSessionImageSelect} className="hidden" />
                  {sessionImagePreview ? (
                    <div className="relative w-full max-w-xs">
                      <img src={sessionImagePreview} alt="session preview" className="rounded-xl w-full object-cover max-h-48" />
                      <button type="button" onClick={() => { setSessionImageFile(null); setSessionImagePreview(''); setSessionForm((p) => ({ ...p, imageUrl: '' })); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => sessionImageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 text-sm text-neutral-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                      <ImageIcon className="w-4 h-4" /> Importer une créa / affiche Live
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <Button variant="outline" onClick={() => setShowSessionForm(false)}>Annuler</Button>
                <Button onClick={handleSaveSession} disabled={savingSession || uploadingSessionImage || !sessionForm.title.trim() || !sessionForm.scheduledAt} icon={(savingSession || uploadingSessionImage) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {uploadingSessionImage ? 'Upload...' : savingSession ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {sessions.length === 0 && !showSessionForm ? (
            <Card><p className="text-center text-neutral-400 py-8">Aucune session live créée.</p></Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <Card key={session.id} hover padding="none">
                  {session.imageUrl && <img src={session.imageUrl} alt={session.title} className="w-full h-40 object-cover rounded-t-2xl" />}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={session.status === 'upcoming' ? 'brand' : 'default'} size="sm">
                        {session.status === 'upcoming' ? 'Prochaine' : 'Passée'}
                      </Badge>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openSessionForm(session)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteSession(session.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="font-bold text-neutral-900 dark:text-white mb-1">{session.title}</p>
                    <p className="text-xs text-neutral-500 mb-2 line-clamp-2">{session.description}</p>
                    <div className="text-xs text-neutral-400 space-y-0.5 mb-3">
                      <p>🕐 {new Date(session.scheduledAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      {session.duration && <p>⏱ {session.duration}</p>}
                      {session.link && <a href={session.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-500 hover:underline"><ExternalLink className="w-3 h-3" /> Lien de connexion</a>}
                    </div>
                    <button
                      onClick={() => handleLoadSessionRegs(session.id)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {loadingRegs === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                      Inscriptions {sessionRegs[session.id] ? `(${sessionRegs[session.id].length})` : ''}
                    </button>
                    {openSessionRegs === session.id && (
                      <div className="mt-2 space-y-1">
                        {(sessionRegs[session.id] ?? []).length === 0 ? (
                          <p className="text-xs text-neutral-400">Aucune inscription.</p>
                        ) : (
                          (sessionRegs[session.id] ?? []).map((r) => (
                            <div key={r.userId} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg px-2 py-1">
                              <CheckCircle className="w-3 h-3 text-success-500 flex-shrink-0" />
                              <span>{r.userName}</span>
                              {r.userEmail && <span className="text-neutral-400">· {r.userEmail}</span>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INFOS EXCLUSIVES ── */}
      {!loading && tab === 'infos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openInfoForm()} icon={<Plus className="w-4 h-4" />}>Nouvelle info</Button>
          </div>

          {showInfoForm && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">{editInfo ? 'Modifier l\'info' : 'Nouvelle info exclusive'}</h3>
                <button onClick={() => setShowInfoForm(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Titre *</label>
                    <input value={infoForm.title} onChange={(e) => setInfoForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titre de l'info" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Type</label>
                    <select value={infoForm.type} onChange={(e) => setInfoForm((p) => ({ ...p, type: e.target.value as ClubDigitosInfo['type'] }))} className={inputCls}>
                      <option value="announcement">Annonce</option>
                      <option value="article">Article</option>
                      <option value="resource">Ressource</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Date de publication</label>
                    <input type="date" value={infoForm.publishedAt} onChange={(e) => setInfoForm((p) => ({ ...p, publishedAt: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Contenu *</label>
                    <textarea value={infoForm.content} onChange={(e) => setInfoForm((p) => ({ ...p, content: e.target.value }))} rows={5} placeholder="Contenu de l'information exclusive..." className={`${inputCls} resize-y`} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-neutral-500">Lien externe (optionnel)</label>
                    <input type="url" value={infoForm.link} onChange={(e) => setInfoForm((p) => ({ ...p, link: e.target.value }))} placeholder="https://..." className={inputCls} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <Button variant="outline" onClick={() => setShowInfoForm(false)}>Annuler</Button>
                <Button onClick={handleSaveInfo} disabled={savingInfo || !infoForm.title.trim() || !infoForm.content.trim()} icon={savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {savingInfo ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </Card>
          )}

          {infos.length === 0 && !showInfoForm ? (
            <Card><p className="text-center text-neutral-400 py-8">Aucune info exclusive créée.</p></Card>
          ) : (
            <div className="space-y-3">
              {infos.map((info) => (
                <Card key={info.id} hover>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={info.type === 'announcement' ? 'warning' : info.type === 'resource' ? 'success' : 'brand'} size="sm">
                          {info.type === 'announcement' ? 'Annonce' : info.type === 'resource' ? 'Ressource' : 'Article'}
                        </Badge>
                        <span className="text-xs text-neutral-400">{formatDate(info.publishedAt)}</span>
                      </div>
                      <p className="font-bold text-neutral-900 dark:text-white mb-1">{info.title}</p>
                      <p className="text-sm text-neutral-500 line-clamp-2">{info.content}</p>
                      {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline inline-flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> Lien</a>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openInfoForm(info)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteInfo(info.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
