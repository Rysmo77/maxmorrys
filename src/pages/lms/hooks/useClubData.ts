import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import {
  getClubSubscription,
  getClubPosts, createClubPost, likeClubPost, deleteClubPost, repostClubPost, voteClubPoll,
  getClubEvents, getClubSessions, getClubExclusiveInfos, likeClubInfo,
  getClubComments, addClubComment, deleteClubComment,
  registerForClubEvent, unregisterFromClubEvent,
  registerForClubSession, unregisterFromClubSession,
  getMyClubProfile, saveClubProfile,
} from '../../../lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { uploadMedia } from '../../../lib/storage';
import { captureError } from '../../../lib/sentry';
import { addXP, awardBadge } from '../../../lib/gamification';
import { XP_REWARDS } from '../../../types/gamification';
import { db, functions } from '../../../config/firebase';

const createClubCharge = httpsCallable<
  { autoRenew?: boolean },
  { checkoutUrl: string; transactionId: string }
>(functions, 'createClubCharge');
import type { ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent, ClubDigitosSession, ClubDigitosInfo, ClubDigitosComment, ClubPostCategory } from '../../../types';
import {
  ChatCircleDots, Question, BookOpen, Star, Rocket, Megaphone, type Icon,
} from '@phosphor-icons/react';

export type ClubSubTab = 'feed' | 'leaderboard' | 'members' | 'discussions' | 'opportunities' | 'agenda' | 'events' | 'sessions' | 'infos' | 'referral';

// `labelKey` resolves against the `club` namespace (e.g. t('categories.general')).
// `label` kept as a fallback for renderers not yet migrated to t(c.labelKey).
export const CLUB_CATEGORIES: { id: ClubPostCategory; label: string; labelKey: string; emoji: string; icon: Icon; tint: string; dot: string }[] = [
  { id: 'general', label: 'Général', labelKey: 'categories.general', emoji: '💬', icon: ChatCircleDots, tint: 'text-plum-600 dark:text-plum-400', dot: 'bg-plum-500' },
  { id: 'question', label: 'Question', labelKey: 'categories.question', emoji: '❓', icon: Question, tint: 'text-brand-600 dark:text-brand-400', dot: 'bg-brand-500' },
  { id: 'ressource', label: 'Ressource', labelKey: 'categories.ressource', emoji: '📚', icon: BookOpen, tint: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
  { id: 'temoignage', label: 'Témoignage', labelKey: 'categories.temoignage', emoji: '⭐', icon: Star, tint: 'text-accent-600 dark:text-accent-400', dot: 'bg-accent-500' },
  { id: 'opportunite', label: 'Opportunité', labelKey: 'categories.opportunite', emoji: '🚀', icon: Rocket, tint: 'text-coral-600 dark:text-coral-400', dot: 'bg-coral-500' },
  { id: 'discussion', label: 'Discussion', labelKey: 'categories.discussion', emoji: '🗣️', icon: Megaphone, tint: 'text-success-600 dark:text-success-400', dot: 'bg-success-500' },
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
  const { t } = useTranslation('club');
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || t('clubData.fallbackStudent');
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const photoURL = user?.photoURL || userData?.photoURL;

  const [clubSubscription, setClubSubscription] = useState<ClubDigitosSubscription | null | undefined>(undefined);
  const [loadingClub, setLoadingClub] = useState(true);
  const [clubPosts, setClubPosts] = useState<ClubDigitosPost[]>([]);
  const [clubEvents, setClubEvents] = useState<ClubDigitosEvent[]>([]);
  const [clubSessions, setClubSessions] = useState<ClubDigitosSession[]>([]);
  const [clubInfos, setClubInfos] = useState<ClubDigitosInfo[]>([]);
  const [clubTab, setClubTab] = useState<ClubSubTab>('feed');
  const [dmTarget, setDmTarget] = useState<{ id: string; name: string; photo?: string } | null>(null);
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
  const [composerMediaType, setComposerMediaType] = useState<'image' | 'audio' | 'video'>('image');
  const [composerAvUrl, setComposerAvUrl] = useState('');
  const [composerPoll, setComposerPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
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

        // Auto-inscription à l'annuaire : tout membre actif apparaît, même sans CV.
        // On crée un profil visible par défaut (nom/photo + réseaux du profil étudiant) s'il n'existe pas.
        getMyClubProfile(user.uid).then((mine) => {
          if (mine) return;
          const name = userData?.displayName || user.displayName || user.email?.split('@')[0] || t('clubData.fallbackMember');
          return saveClubProfile(user.uid, {
            displayName: name,
            photoURL: user.photoURL || userData?.photoURL || '',
            headline: '',
            skills: [],
            available: false,
            visible: true,
            city: userData?.city || '',
            linkedin: userData?.linkedin || '',
            website: userData?.website || '',
            whatsapp: userData?.whatsapp || '',
            facebook: userData?.facebook || '',
            instagram: userData?.instagram || '',
            twitter: userData?.twitter || '',
            tiktok: userData?.tiktok || '',
            youtube: userData?.youtube || '',
          });
        }).catch(() => null);
      }
      setLoadingClub(false);
    }).catch(() => { addToast('error', t('clubData.loadError')); setLoadingClub(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleActivateClub = async () => {
    if (!user?.email) return;
    setActivatingClub(true);
    try {
      const result = await createClubCharge({ autoRenew: clubAutoRenew });
      // Redirect to Bictorys hosted checkout
      window.location.href = result.data.checkoutUrl;
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to create club charge' });
      const msg = error instanceof Error ? error.message : t('clubData.paymentError');
      addToast('error', msg);
      setActivatingClub(false);
    }
  };

  const handleClubPost = async () => {
    if (!user || !clubPostContent.trim()) return;
    setPostingToClub(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'audio' | 'video' | undefined;
      if (composerMediaType === 'image' && composerMediaFile) {
        setUploadingMedia(true);
        const ext = composerMediaFile.name.split('.').pop() || 'jpg';
        mediaUrl = await uploadMedia(composerMediaFile, `club_media/${user.uid}/${Date.now()}.${ext}`);
        mediaType = 'image';
        setUploadingMedia(false);
      } else if (composerMediaType !== 'image' && composerAvUrl) {
        mediaUrl = composerAvUrl;
        mediaType = composerMediaType;
      }
      const cleanPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      const poll = composerPoll && cleanPollOptions.length >= 2 ? { options: cleanPollOptions } : undefined;
      await createClubPost({
        userId: user.uid, userName: displayName, userPhoto: user.photoURL || userData?.photoURL,
        content: clubPostContent.trim(), type: composerCategory === 'discussion' ? 'discussion' : 'post',
        category: composerCategory, mood: composerMood || undefined, mediaUrl, mediaType,
        poll, pollVotes: poll ? {} : undefined,
      });
      setClubPostContent(''); setComposerMood(''); setComposerCategory('general');
      setComposerMediaFile(null); setComposerMediaType('image'); setComposerAvUrl('');
      setComposerPoll(false); setPollOptions(['', '']);
      if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview);
      setComposerMediaPreview(''); setShowMoodPicker(false);
      const posts = await getClubPosts(60);
      setClubPosts(posts);
      // Gamification: reward club engagement + unlock community badge
      addXP(user.uid, XP_REWARDS.clubPost).catch(() => null);
      if (posts.filter((p) => p.userId === user.uid).length >= 10) {
        awardBadge(user.uid, 'contributeur').catch(() => null);
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to create club post' });
      setComposerMediaFile(null);
      if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview);
      setComposerMediaPreview('');
      addToast('error', error instanceof Error ? error.message : t('clubData.postPublishError'));
    } finally {
      setPostingToClub(false); setUploadingMedia(false);
    }
  };

  const handleLikePost = async (postId: string, liked: boolean) => {
    if (!user) return;
    setClubPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: liked ? [...p.likes, user.uid] : p.likes.filter((id) => id !== user.uid) } : p));
    await likeClubPost(postId, user.uid, liked).catch(() => null);
  };

  const handleVotePoll = async (postId: string, optionIndex: number) => {
    if (!user) return;
    setClubPosts((prev) => prev.map((p) => p.id === postId ? { ...p, pollVotes: { ...(p.pollVotes ?? {}), [user.uid]: optionIndex } } : p));
    await voteClubPoll(postId, user.uid, optionIndex).catch(() => null);
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
      addXP(user.uid, XP_REWARDS.clubComment).catch(() => null);
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to add club comment' });
      addToast('error', error instanceof Error ? error.message : t('clubData.commentSendError'));
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
    if (!file.type.startsWith('image/')) { addToast('error', t('clubData.imagesOnly')); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('error', t('clubData.imageMaxSize')); return; }
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
        addToast('success', t('clubData.regCancelled'));
      } else {
        await registerForClubEvent(eventId, user.uid, displayName, user.email ?? undefined);
        setRegisteredEvents((prev) => new Set([...prev, eventId]));
        addToast('success', t('clubData.regConfirmed'));
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to toggle event registration' });
      addToast('error', error instanceof Error ? error.message : t('clubData.regError'));
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
        addToast('success', t('clubData.regCancelled'));
      } else {
        await registerForClubSession(sessionId, user.uid, displayName, user.email ?? undefined);
        setRegisteredSessions((prev) => new Set([...prev, sessionId]));
        addToast('success', t('clubData.regConfirmed'));
      }
    } catch (error: unknown) {
      captureError(error, { context: 'Failed to toggle session registration' });
      addToast('error', error instanceof Error ? error.message : t('clubData.regError'));
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
    user, displayName, initials, photoURL, addToast,
    // Subscription
    clubSubscription, isClubActive, isClubPending,
    clubAutoRenew, setClubAutoRenew,
    activatingClub, handleActivateClub,
    // Loading
    loadingClub,
    // Tab
    clubTab, setClubTab,
    dmTarget, setDmTarget,
    // Feed state
    clubPosts, clubPostContent, setClubPostContent,
    postingToClub, uploadingMedia,
    composerCategory, setComposerCategory,
    composerMood, setComposerMood,
    showMoodPicker, setShowMoodPicker,
    composerMediaFile, composerMediaPreview, setComposerMediaFile, setComposerMediaPreview,
    composerMediaType, setComposerMediaType, composerAvUrl, setComposerAvUrl,
    composerPoll, setComposerPoll, pollOptions, setPollOptions,
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
    handleShare, handleMediaSelect, handleVotePoll,
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
