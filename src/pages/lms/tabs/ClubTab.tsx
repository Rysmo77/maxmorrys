import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown, Lock, Heart, Rss, Video, Calendar, Info, RefreshCw, MessageSquare, Bell,
  Share2, Repeat2, Image as ImageIcon, Smile, X, Send, Trash2, Plus, CheckCircle,
  Loader2, ExternalLink, Check, ChevronDown,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { cn, formatDate } from '../../../lib/utils';
import {
  getClubSubscription, activateClubSubscription,
  getClubPosts, createClubPost, likeClubPost, deleteClubPost, repostClubPost,
  getClubEvents, getClubSessions, getClubExclusiveInfos, likeClubInfo,
  getClubComments, addClubComment, deleteClubComment,
  registerForClubEvent, unregisterFromClubEvent, isRegisteredForEvent,
  registerForClubSession, unregisterFromClubSession, isRegisteredForSession,
} from '../../../lib/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';
import type { ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent, ClubDigitosSession, ClubDigitosInfo, ClubDigitosComment, ClubPostCategory } from '../../../types';
import type { EnrolledFormation } from '../hooks/useStudentData';

type ClubSubTab = 'feed' | 'events' | 'sessions' | 'infos';

const CLUB_CATEGORIES: { id: ClubPostCategory; label: string; emoji: string }[] = [
  { id: 'general', label: 'Général', emoji: '💬' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'ressource', label: 'Ressource', emoji: '📚' },
  { id: 'temoignage', label: 'Témoignage', emoji: '⭐' },
  { id: 'opportunite', label: 'Opportunité', emoji: '🚀' },
  { id: 'discussion', label: 'Discussion', emoji: '🗣️' },
];

const MOOD_OPTIONS = ['😊', '🔥', '💡', '🎉', '💪', '🤔', '😎', '❤️', '👏', '🙏'];

const SHARE_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500', emoji: '📱' },
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600', emoji: '📘' },
  { id: 'twitter', label: 'Twitter / X', color: 'bg-neutral-900 dark:bg-neutral-700', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700', emoji: '💼' },
  { id: 'telegram', label: 'Telegram', color: 'bg-sky-500', emoji: '✈️' },
  { id: 'copy', label: 'Copier le texte', color: 'bg-neutral-500', emoji: '📋' },
] as const;

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

interface ClubTabProps {
  enrolledFormations: EnrolledFormation[];
}

export default function ClubTab({ enrolledFormations }: ClubTabProps) {
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Étudiant';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  const [clubSubscription, setClubSubscription] = useState<ClubDigitosSubscription | null | undefined>(undefined);
  const [loadingClub, setLoadingClub] = useState(true);
  const [clubPosts, setClubPosts] = useState<ClubDigitosPost[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubDigitosEvent[]>([]);
  const [clubSessions, setClubSessions] = useState<ClubDigitosSession[]>([]);
  const [clubInfos, setClubInfos] = useState<ClubDigitosInfo[]>([]);
  const [clubTab, setClubTab] = useState<ClubSubTab>('feed');
  const [clubPostContent, setClubPostContent] = useState('');
  const [postingToClub, setPostingToClub] = useState(false);
  const [activatingClub, setActivatingClub] = useState(false);
  const [clubAutoRenew, setClubAutoRenew] = useState(true);

  const [composerCategory, setComposerCategory] = useState<ClubPostCategory>('general');
  const [composerMood, setComposerMood] = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [composerMediaFile, setComposerMediaFile] = useState<File | null>(null);
  const [composerMediaPreview, setComposerMediaPreview] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [clubCategoryFilter, setClubCategoryFilter] = useState<ClubPostCategory | 'all'>('all');
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Record<string, ClubDigitosComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [copiedInfoId, setCopiedInfoId] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [registeredSessions, setRegisteredSessions] = useState<Set<string>>(new Set());
  const [togglingReg, setTogglingReg] = useState<string | null>(null);
  const [infoShareMenuOpen, setInfoShareMenuOpen] = useState<string | null>(null);

  const isClubActive = clubSubscription?.status === 'active' && new Date(clubSubscription.expiresAt) > new Date();
  const isClubPending = clubSubscription?.status === 'pending';

  useEffect(() => {
    if (!user) return;
    setLoadingClub(true);
    getClubSubscription(user.uid).then(async (sub) => {
      setClubSubscription(sub);
      if (sub?.status === 'active') {
        const [posts, events, sessions, infos] = await Promise.all([
          getClubPosts(60), getClubEvents(), getClubSessions(), getClubExclusiveInfos(),
        ]);
        setClubPosts(posts); setClubEvents(events); setClubSessions(sessions); setClubInfos(infos);
        const [evtRegs, sessRegs] = await Promise.all([
          Promise.all(events.map((e) => isRegisteredForEvent(e.id, user.uid).then((r) => r ? e.id : null))),
          Promise.all(sessions.map((s) => isRegisteredForSession(s.id, user.uid).then((r) => r ? s.id : null))),
        ]);
        setRegisteredEvents(new Set(evtRegs.filter(Boolean) as string[]));
        setRegisteredSessions(new Set(sessRegs.filter(Boolean) as string[]));
      }
      setLoadingClub(false);
    }).catch(() => { addToast('error', 'Erreur lors du chargement du Club des Digitos.'); setLoadingClub(false); });
  }, [user]);

  const handleActivateClub = async () => {
    if (!user?.email) return;
    setActivatingClub(true);
    try {
      await activateClubSubscription(user.uid, user.email, displayName, clubAutoRenew);
      const sub = await getClubSubscription(user.uid);
      setClubSubscription(sub);
      addToast('success', 'Demande envoyée ! Effectue le paiement de 10 000 FCFA pour finaliser ton accès.');
    } catch (error: unknown) {
      console.error('Failed to activate club subscription:', error);
      addToast('error', error instanceof Error ? error.message : "Erreur lors de la demande d'activation.");
    } finally {
      setActivatingClub(false);
    }
  };

  const handleClubPost = async () => {
    if (!user || !clubPostContent.trim()) return;
    setPostingToClub(true);
    try {
      let mediaUrl: string | undefined;
      if (composerMediaFile) {
        setUploadingMedia(true);
        const ext = composerMediaFile.name.split('.').pop() || 'jpg';
        const fileRef = storageRef(storage, `club_media/${user.uid}/${Date.now()}.${ext}`);
        await uploadBytes(fileRef, composerMediaFile);
        mediaUrl = await getDownloadURL(fileRef);
        setUploadingMedia(false);
      }
      await createClubPost({
        userId: user.uid, userName: displayName, userPhoto: user.photoURL || userData?.photoURL,
        content: clubPostContent.trim(), type: composerCategory === 'discussion' ? 'discussion' : 'post',
        category: composerCategory, mood: composerMood || undefined, mediaUrl,
      });
      setClubPostContent(''); setComposerMood(''); setComposerCategory('general');
      setComposerMediaFile(null);
      if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview);
      setComposerMediaPreview(''); setShowMoodPicker(false);
      const posts = await getClubPosts(60);
      setClubPosts(posts);
    } catch (error: unknown) {
      console.error('Failed to create club post:', error);
      setComposerMediaFile(null);
      if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview);
      setComposerMediaPreview('');
      addToast('error', error instanceof Error ? error.message : 'Erreur lors de la publication.');
    } finally {
      setPostingToClub(false); setUploadingMedia(false);
    }
  };

  const handleLikePost = async (postId: string, liked: boolean) => {
    if (!user) return;
    setClubPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: liked ? [...p.likes, user.uid] : p.likes.filter((id) => id !== user.uid) } : p));
    await likeClubPost(postId, user.uid, liked).catch(() => null);
  };

  const handleDeleteClubPost = async (postId: string) => {
    await deleteClubPost(postId).catch(() => null);
    setClubPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleRepost = async (postId: string, reposted: boolean) => {
    if (!user) return;
    setClubPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reposts: reposted ? [...(p.reposts ?? []), user.uid] : (p.reposts ?? []).filter((id) => id !== user.uid) } : p));
    await repostClubPost(postId, user.uid, reposted).catch(() => null);
  };

  const handleToggleComments = async (postId: string) => {
    const next = new Set(openComments);
    if (next.has(postId)) { next.delete(postId); setOpenComments(next); return; }
    next.add(postId); setOpenComments(next);
    if (!postComments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      const comments = await getClubComments(postId).catch(() => []);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !commentDraft[postId]?.trim()) return;
    setSubmittingComment(postId);
    try {
      await addClubComment(postId, { userId: user.uid, userName: displayName, userPhoto: user.photoURL || userData?.photoURL, content: commentDraft[postId].trim() });
      const updated = await getClubComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: updated }));
      setCommentDraft((prev) => ({ ...prev, [postId]: '' }));
    } catch (error: unknown) {
      console.error('Failed to add club comment:', error);
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'envoi du commentaire.");
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    await deleteClubComment(postId, commentId).catch(() => null);
    setPostComments((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId) }));
    setClubPosts((prev) => prev.map((p) => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount ?? 0) - 1) } : p));
  };

  const handleShare = (platform: string, post: ClubDigitosPost) => {
    const text = encodeURIComponent(`${post.content}\n— ${post.userName} sur Club des Digitos`);
    const url = encodeURIComponent('https://maxmorrys.me');
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${text}`;
    else if (platform === 'facebook') shareUrl = `https://facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    else if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    else if (platform === 'linkedin') shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${url}`;
    else if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    else if (platform === 'copy') {
      navigator.clipboard.writeText(post.content).then(() => { setCopiedPostId(post.id); setTimeout(() => setCopiedPostId(null), 2000); }).catch(() => null);
      setShareMenuOpen(null); return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShareMenuOpen(null);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { addToast('error', 'Seules les images sont acceptées.'); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('error', "L'image ne doit pas dépasser 5 Mo."); return; }
    setComposerMediaFile(file);
    setComposerMediaPreview(URL.createObjectURL(file));
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleLikeInfo = async (infoId: string, liked: boolean) => {
    if (!user) return;
    setClubInfos((prev) => prev.map((i) => i.id === infoId ? { ...i, likes: liked ? [...(i.likes ?? []), user.uid] : (i.likes ?? []).filter((id) => id !== user.uid) } : i));
    await likeClubInfo(infoId, user.uid, liked).catch(() => null);
  };

  const handleInfoShare = (platform: string, info: ClubDigitosInfo) => {
    const text = encodeURIComponent(`${info.title}\n${info.content.slice(0, 200)}...\n— Club des Digitos`);
    const url = encodeURIComponent('https://maxmorrys.me');
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${text}`;
    else if (platform === 'facebook') shareUrl = `https://facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    else if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    else if (platform === 'linkedin') shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${url}`;
    else if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    else if (platform === 'copy') {
      navigator.clipboard.writeText(`${info.title}\n${info.content}`).then(() => { setCopiedInfoId(info.id); setTimeout(() => setCopiedInfoId(null), 2000); }).catch(() => null);
      setInfoShareMenuOpen(null); return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setInfoShareMenuOpen(null);
  };

  const handleToggleEventReg = async (eventId: string) => {
    if (!user) return;
    const registered = registeredEvents.has(eventId);
    setTogglingReg(eventId);
    try {
      if (registered) {
        await unregisterFromClubEvent(eventId, user.uid);
        setRegisteredEvents((prev) => { const s = new Set(prev); s.delete(eventId); return s; });
        addToast('success', 'Inscription annulée.');
      } else {
        await registerForClubEvent(eventId, user.uid, displayName, user.email ?? undefined);
        setRegisteredEvents((prev) => new Set([...prev, eventId]));
        addToast('success', 'Inscription confirmée !');
      }
    } catch (error: unknown) {
      console.error('Failed to toggle event registration:', error);
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'inscription.");
    } finally {
      setTogglingReg(null);
    }
  };

  const handleToggleSessionReg = async (sessionId: string) => {
    if (!user) return;
    const registered = registeredSessions.has(sessionId);
    setTogglingReg(sessionId);
    try {
      if (registered) {
        await unregisterFromClubSession(sessionId, user.uid);
        setRegisteredSessions((prev) => { const s = new Set(prev); s.delete(sessionId); return s; });
        addToast('success', 'Inscription annulée.');
      } else {
        await registerForClubSession(sessionId, user.uid, displayName, user.email ?? undefined);
        setRegisteredSessions((prev) => new Set([...prev, sessionId]));
        addToast('success', 'Inscription confirmée !');
      }
    } catch (error: unknown) {
      console.error('Failed to toggle session registration:', error);
      addToast('error', error instanceof Error ? error.message : "Erreur lors de l'inscription.");
    } finally {
      setTogglingReg(null);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setLoadingClub(true);
    const [posts, events, sessions, infos] = await Promise.all([getClubPosts(60), getClubEvents(), getClubSessions(), getClubExclusiveInfos()]);
    setClubPosts(posts); setClubEvents(events); setClubSessions(sessions); setClubInfos(infos);
    setLoadingClub(false);
  };

  if (loadingClub) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  if (!isClubActive) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Club des Digitos</h2>
                <p className="text-brand-200 text-sm">Communauté exclusive · 10 000 FCFA/an</p>
              </div>
            </div>
            <p className="text-brand-100 leading-relaxed max-w-lg">
              Accédez à la communauté, aux sessions Live, au forum, aux infos exclusives et aux événements organisés par Max-Morrys.
            </p>
          </div>
          <Crown className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
        </div>

        {/* Avantages */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Rss, title: "Fil d'actualité", desc: 'Publications et posts en temps réel de Max-Morrys et des membres.' },
            { icon: MessageSquare, title: 'Forum & discussions', desc: 'Échangez, posez vos questions, interagissez avec la communauté.' },
            { icon: Video, title: 'Sessions Live', desc: 'Participez aux sessions en direct avec Max-Morrys.' },
            { icon: Bell, title: 'Infos exclusives', desc: 'Analyses, ressources et contenus réservés aux membres.' },
            { icon: Calendar, title: 'Événements', desc: 'Accès prioritaire aux événements organisés ou animés par Max-Morrys.' },
            { icon: Crown, title: 'Communauté', desc: 'Réseau de professionnels du digital passionnés.' },
          ].map((feat) => (
            <div key={feat.title} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-3">
                <feat.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <p className="font-bold text-neutral-900 dark:text-white text-sm mb-1">{feat.title}</p>
              <p className="text-xs text-neutral-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Soft recommendation if no enrollments */}
        {enrolledFormations.length === 0 && !isClubPending && (
          <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/40 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Conseil</p>
              <p className="text-xs text-brand-600/80 dark:text-brand-400/80 mt-0.5">
                Combine le Club avec une formation pour tirer le maximum de la plateforme.{' '}
                <Link to="/formations" className="underline font-semibold">Voir les formations</Link>
              </p>
            </div>
          </div>
        )}

        {/* Activation */}
        {isClubPending ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center mx-auto mb-3">
              <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
            </div>
            <p className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Paiement en attente de confirmation</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed max-w-sm mx-auto">
              Effectue le virement de <strong>10 000 FCFA</strong> et envoie une capture via le formulaire de contact. Ton accès sera activé sous 24h.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Activer le Club des Digitos</h3>
            <p className="text-sm text-neutral-500 mb-5">10 000 FCFA / an · Renouvellement automatique ou manuel à ta convenance.</p>
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={() => setClubAutoRenew((v) => !v)} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none', clubAutoRenew ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-600')}>
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', clubAutoRenew ? 'translate-x-6' : 'translate-x-1')} />
              </button>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Renouvellement automatique <span className="text-neutral-400">(désactivable à tout moment)</span></span>
            </div>
            <Button onClick={handleActivateClub} disabled={activatingClub} icon={activatingClub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}>
              {activatingClub ? 'Traitement...' : 'Rejoindre pour 10 000 FCFA/an'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Active subscriber view
  return (
    <div className="space-y-5">
      {/* Statut */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-white">Club des Digitos · Membre actif</p>
            <p className="text-xs text-neutral-400">
              Expire le {new Date(clubSubscription!.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {clubSubscription!.autoRenew ? ' · Renouvellement auto' : ' · Manuel'}
            </p>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap border-b border-neutral-200 dark:border-neutral-700 pb-0">
        {([
          { id: 'feed' as ClubSubTab, icon: Rss, label: "Fil d'actualité" },
          { id: 'events' as ClubSubTab, icon: Calendar, label: 'Événements' },
          { id: 'sessions' as ClubSubTab, icon: Video, label: 'Sessions Live' },
          { id: 'infos' as ClubSubTab, icon: Info, label: 'Infos exclusives' },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setClubTab(tab.id)} className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
            clubTab === tab.id ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
          )}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {clubTab === 'feed' && (
        <div className="space-y-4">
          {/* Post composer */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{initials}</span>}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={composerCategory} onChange={(e) => setComposerCategory(e.target.value as ClubPostCategory)} className="text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    {CLUB_CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.label}</option>))}
                  </select>
                  {composerMood && <span className="text-lg">{composerMood}</span>}
                  <div className="relative">
                    <button type="button" onClick={() => setShowMoodPicker((v) => !v)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                      <Smile className="w-3.5 h-3.5" /> {composerMood || 'Humeur'}
                    </button>
                    {showMoodPicker && (
                      <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 shadow-lg flex gap-1 flex-wrap w-44">
                        {MOOD_OPTIONS.map((m) => (
                          <button key={m} type="button" onClick={() => { setComposerMood(composerMood === m ? '' : m); setShowMoodPicker(false); }} className={cn('text-xl p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors', composerMood === m && 'bg-brand-50 dark:bg-brand-900/20')}>
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <textarea value={clubPostContent} onChange={(e) => setClubPostContent(e.target.value)} placeholder="Partage quelque chose avec la communauté..." rows={3} maxLength={2000} className={`${inputCls} resize-none`} />
                {composerMediaPreview && (
                  <div className="relative w-full max-w-xs">
                    <img src={composerMediaPreview} alt="preview" className="rounded-xl w-full object-cover max-h-48" />
                    <button type="button" onClick={() => { setComposerMediaFile(null); if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview); setComposerMediaPreview(''); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" ref={mediaInputRef} onChange={handleMediaSelect} className="hidden" />
                    <button type="button" onClick={() => mediaInputRef.current?.click()} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 text-neutral-500 hover:text-brand-600 hover:border-brand-300 transition-colors">
                      <ImageIcon className="w-3.5 h-3.5" /> Photo
                    </button>
                  </div>
                  <Button size="sm" onClick={handleClubPost} disabled={postingToClub || uploadingMedia || !clubPostContent.trim()} icon={(postingToClub || uploadingMedia) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}>
                    {uploadingMedia ? 'Upload...' : postingToClub ? 'Publication...' : 'Publier'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setClubCategoryFilter('all')} className={cn('text-xs px-3 py-1.5 rounded-full font-semibold transition-colors', clubCategoryFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>
              Tout
            </button>
            {CLUB_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setClubCategoryFilter(c.id)} className={cn('text-xs px-3 py-1.5 rounded-full font-semibold transition-colors', clubCategoryFilter === c.id ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {(() => {
            const filtered = clubCategoryFilter === 'all' ? clubPosts : clubPosts.filter((p) => p.category === clubCategoryFilter);
            return filtered.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
                <Rss className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-500">Aucune publication dans cette catégorie. Sois le premier !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((post) => {
                  const liked = user ? post.likes.includes(user.uid) : false;
                  const reposted = user ? (post.reposts ?? []).includes(user.uid) : false;
                  const commentsOpen = openComments.has(post.id);
                  const catInfo = CLUB_CATEGORIES.find((c) => c.id === post.category);
                  return (
                    <div key={post.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl relative">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {post.userPhoto ? <img src={post.userPhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{post.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                {post.userName}
                                {post.mood && <span className="text-base">{post.mood}</span>}
                                {post.isAdmin && <span className="text-xs bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-full font-bold">Admin</span>}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-neutral-400">{formatDate(post.createdAt)}</span>
                                {catInfo && <span className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-500 px-1.5 py-0.5 rounded-full">{catInfo.emoji} {catInfo.label}</span>}
                              </div>
                            </div>
                          </div>
                          {user && post.userId === user.uid && (
                            <button onClick={() => handleDeleteClubPost(post.id)} className="p-1.5 rounded-lg text-neutral-300 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-3">{post.content}</p>
                        {post.mediaUrl && <img src={post.mediaUrl} alt="" className="w-full rounded-xl object-cover max-h-64 mb-3" />}

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-700">
                          <button onClick={() => handleLikePost(post.id, !liked)} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors', liked ? 'text-error-500 bg-error-50 dark:bg-error-900/20' : 'text-neutral-400 hover:text-error-400 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                            <Heart className={cn('w-4 h-4', liked && 'fill-current')} /> {post.likes.length > 0 && post.likes.length} J'aime
                          </button>
                          <button onClick={() => handleToggleComments(post.id)} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors', commentsOpen ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'text-neutral-400 hover:text-brand-500 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                            <MessageSquare className="w-4 h-4" /> {(post.commentsCount ?? 0) > 0 && post.commentsCount} Commenter
                          </button>
                          <button onClick={() => handleRepost(post.id, !reposted)} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors', reposted ? 'text-success-600 bg-success-50 dark:bg-success-900/20' : 'text-neutral-400 hover:text-success-500 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                            <Repeat2 className="w-4 h-4" /> {(post.reposts ?? []).length > 0 && (post.reposts ?? []).length} Republier
                          </button>
                          <div className="relative ml-auto">
                            <button onClick={() => setShareMenuOpen(shareMenuOpen === post.id ? null : post.id)} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                              {copiedPostId === post.id ? <Check className="w-4 h-4 text-success-500" /> : <Share2 className="w-4 h-4" />} Partager
                            </button>
                            {shareMenuOpen === post.id && (
                              <div className="absolute right-0 bottom-full mb-1 z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 min-w-44">
                                {SHARE_PLATFORMS.map((p) => (
                                  <button key={p.id} onClick={() => handleShare(p.id, post)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                                    <span>{p.emoji}</span> {p.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Comments */}
                        {commentsOpen && (
                          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 space-y-3">
                            {loadingComments[post.id] ? (
                              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-brand-500" /></div>
                            ) : (postComments[post.id] ?? []).length === 0 ? (
                              <p className="text-xs text-neutral-400 text-center py-2">Aucun commentaire. Sois le premier !</p>
                            ) : (
                              <div className="space-y-2.5">
                                {(postComments[post.id] ?? []).map((c) => (
                                  <div key={c.id} className="flex items-start gap-2 group">
                                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      {c.userPhoto ? <img src={c.userPhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-neutral-500">{c.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl px-3 py-2">
                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">{c.userName}</p>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{c.content}</p>
                                      </div>
                                      <span className="text-[10px] text-neutral-400 ml-1">{formatDate(c.createdAt)}</span>
                                    </div>
                                    {user && (c.userId === user.uid) && (
                                      <button onClick={() => handleDeleteComment(post.id, c.id)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-error-500 transition-all">
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">{initials}</span>}
                              </div>
                              <input
                                value={commentDraft[post.id] ?? ''}
                                onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id); } }}
                                placeholder="Écrire un commentaire..."
                                className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-neutral-400"
                              />
                              <button onClick={() => handleAddComment(post.id)} disabled={submittingComment === post.id || !commentDraft[post.id]?.trim()} className="p-1.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
                                {submittingComment === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Events */}
      {clubTab === 'events' && (
        <div className="space-y-4">
          {clubEvents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
              <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500">Aucun événement prévu pour le moment.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {clubEvents.map((event) => {
                const isReg = registeredEvents.has(event.id);
                return (
                  <div key={event.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden relative">
                    {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-44 object-cover" />}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', event.status === 'upcoming' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500')}>
                          {event.status === 'upcoming' ? 'À venir' : 'Passé'}
                        </span>
                        <span className={cn('text-xs px-2 py-1 rounded-full', event.type === 'online' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400')}>
                          {event.type === 'online' ? 'En ligne' : 'Présentiel'}
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{event.title}</h4>
                      <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{event.description}</p>
                      <div className="space-y-1 text-xs text-neutral-400 mb-4">
                        <p>📅 {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.time && ` à ${event.time}`}</p>
                        <p>📍 {event.location}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"><ExternalLink className="w-3.5 h-3.5" /> Voir l'événement</a>}
                        {event.status === 'upcoming' && (
                          <button onClick={() => handleToggleEventReg(event.id)} disabled={togglingReg === event.id} className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50', isReg ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-error-100 hover:text-error-700' : 'bg-brand-600 text-white hover:bg-brand-700')}>
                            {togglingReg === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isReg ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isReg ? 'Inscrit(e)' : "S'inscrire"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sessions */}
      {clubTab === 'sessions' && (
        <div className="space-y-4">
          {clubSessions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
              <Video className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500">Aucune session live programmée pour le moment.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {clubSessions.map((session) => {
                const isReg = registeredSessions.has(session.id);
                return (
                  <div key={session.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden relative">
                    {session.imageUrl && <img src={session.imageUrl} alt={session.title} className="w-full h-44 object-cover" />}
                    <div className="p-5">
                      <span className={cn('inline-flex text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-3', session.status === 'upcoming' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500')}>
                        {session.status === 'upcoming' ? 'Prochaine session' : 'Session passée'}
                      </span>
                      <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{session.title}</h4>
                      <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{session.description}</p>
                      <div className="space-y-1 text-xs text-neutral-400 mb-4">
                        <p>🕐 {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {session.duration && <p>⏱ Durée : {session.duration}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {session.link && session.status === 'upcoming' && (
                          <a href={session.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors">
                            <Video className="w-3.5 h-3.5" /> Rejoindre
                          </a>
                        )}
                        {session.status === 'upcoming' && (
                          <button onClick={() => handleToggleSessionReg(session.id)} disabled={togglingReg === session.id} className={cn('ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50', isReg ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-error-100 hover:text-error-700' : 'bg-brand-600 text-white hover:bg-brand-700')}>
                            {togglingReg === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isReg ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isReg ? 'Inscrit(e)' : "S'inscrire"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Infos exclusives */}
      {clubTab === 'infos' && (
        <div className="space-y-4">
          {clubInfos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl">
              <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500">Aucune information exclusive pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clubInfos.map((info) => {
                const infoLiked = user ? (info.likes ?? []).includes(user.uid) : false;
                return (
                  <div key={info.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 relative">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', info.type === 'announcement' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : info.type === 'resource' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400')}>
                        {info.type === 'announcement' ? 'Annonce' : info.type === 'resource' ? 'Ressource' : 'Article'}
                      </span>
                      <p className="text-xs text-neutral-400 flex-shrink-0">{formatDate(info.publishedAt)}</p>
                    </div>
                    <h4 className="font-bold text-neutral-900 dark:text-white mb-2">{info.title}</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">{info.content}</p>
                    {info.link && <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline mb-3"><ExternalLink className="w-3.5 h-3.5" /> En savoir plus</a>}
                    <div className="flex items-center gap-1 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                      <button onClick={() => handleLikeInfo(info.id, !infoLiked)} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors', infoLiked ? 'text-error-500 bg-error-50 dark:bg-error-900/20' : 'text-neutral-400 hover:text-error-400 hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                        <Heart className={cn('w-4 h-4', infoLiked && 'fill-current')} /> {(info.likes ?? []).length > 0 && (info.likes ?? []).length} J'aime
                      </button>
                      <div className="relative ml-auto">
                        <button onClick={() => setInfoShareMenuOpen(infoShareMenuOpen === info.id ? null : info.id)} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                          {copiedInfoId === info.id ? <Check className="w-4 h-4 text-success-500" /> : <Share2 className="w-4 h-4" />} Partager
                        </button>
                        {infoShareMenuOpen === info.id && (
                          <div className="absolute right-0 bottom-full mb-1 z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 min-w-44">
                            {SHARE_PLATFORMS.map((p) => (
                              <button key={p.id} onClick={() => handleInfoShare(p.id, info)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                                <span>{p.emoji}</span> {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
