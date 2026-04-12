import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import {
  getClubSubscription, activateClubSubscription,
  getClubPosts, createClubPost, likeClubPost, deleteClubPost, repostClubPost,
  getClubEvents, getClubSessions, getClubExclusiveInfos, likeClubInfo,
  getClubComments, addClubComment, deleteClubComment,
  registerForClubEvent, unregisterFromClubEvent,
  registerForClubSession, unregisterFromClubSession,
} from '../../../lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { captureError } from '../../../lib/sentry';
import { db, storage } from '../../../config/firebase';
import type { ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent, ClubDigitosSession, ClubDigitosInfo, ClubDigitosComment, ClubPostCategory } from '../../../types';

export type ClubSubTab = 'feed' | 'events' | 'sessions' | 'infos';

export const CLUB_CATEGORIES: { id: ClubPostCategory; label: string; emoji: string }[] = [
  { id: 'general', label: 'Général', emoji: '💬' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'ressource', label: 'Ressource', emoji: '📚' },
  { id: 'temoignage', label: 'Témoignage', emoji: '⭐' },
  { id: 'opportunite', label: 'Opportunité', emoji: '🚀' },
  { id: 'discussion', label: 'Discussion', emoji: '🗣️' },
];

export const MOOD_OPTIONS = ['😊', '🔥', '💡', '🎉', '💪', '🤔', '😎', '❤️', '👏', '🙏'];

export const SHARE_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500', emoji: '📱' },
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600', emoji: '📘' },
  { id: 'twitter', label: 'Twitter / X', color: 'bg-neutral-900 dark:bg-neutral-700', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700', emoji: '💼' },
  { id: 'telegram', label: 'Telegram', color: 'bg-sky-500', emoji: '✈️' },
  { id: 'copy', label: 'Copier le texte', color: 'bg-neutral-500', emoji: '📋' },
] as const;

export const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors placeholder-neutral-400';

export function useClubData() {
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
        // Batch check registrations with parallel getDoc (one per event/session, using doc refs)
        const [evtSnaps, sessSnaps] = await Promise.all([
          Promise.all(events.map((e) => getDoc(doc(db, 'club_events', e.id, 'registrations', user.uid)))),
          Promise.all(sessions.map((s) => getDoc(doc(db, 'club_sessions', s.id, 'registrations', user.uid)))),
        ]);
        setRegisteredEvents(new Set(events.filter((_, i) => evtSnaps[i].exists()).map((e) => e.id)));
        setRegisteredSessions(new Set(sessions.filter((_, i) => sessSnaps[i].exists()).map((s) => s.id)));
      }
      setLoadingClub(false);
    }).catch(() => { addToast('error', 'Erreur lors du chargement du Club des Digitos.'); setLoadingClub(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      captureError(error, { context: 'Failed to activate club subscription' });
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
      captureError(error, { context: 'Failed to create club post' });
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
      captureError(error, { context: 'Failed to add club comment' });
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
      captureError(error, { context: 'Failed to toggle event registration' });
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
      captureError(error, { context: 'Failed to toggle session registration' });
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

  return {
    // User info
    user, displayName, initials, photoURL,
    // Subscription
    clubSubscription, isClubActive, isClubPending,
    clubAutoRenew, setClubAutoRenew,
    activatingClub, handleActivateClub,
    // Loading
    loadingClub,
    // Tab
    clubTab, setClubTab,
    // Feed state
    clubPosts, clubPostContent, setClubPostContent,
    postingToClub, uploadingMedia,
    composerCategory, setComposerCategory,
    composerMood, setComposerMood,
    showMoodPicker, setShowMoodPicker,
    composerMediaFile, composerMediaPreview, setComposerMediaFile, setComposerMediaPreview,
    mediaInputRef,
    clubCategoryFilter, setClubCategoryFilter,
    openComments, postComments, loadingComments,
    commentDraft, setCommentDraft,
    submittingComment,
    shareMenuOpen, setShareMenuOpen,
    copiedPostId,
    // Feed handlers
    handleClubPost, handleLikePost, handleDeleteClubPost,
    handleRepost, handleToggleComments, handleAddComment, handleDeleteComment,
    handleShare, handleMediaSelect,
    // Events
    clubEvents, registeredEvents, togglingReg, handleToggleEventReg,
    // Sessions
    clubSessions, registeredSessions, handleToggleSessionReg,
    // Infos
    clubInfos, copiedInfoId,
    infoShareMenuOpen, setInfoShareMenuOpen,
    handleLikeInfo, handleInfoShare,
    // Refresh
    handleRefresh,
  };
}
