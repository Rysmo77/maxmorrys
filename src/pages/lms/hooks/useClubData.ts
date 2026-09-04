import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '@ds';
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
import { functions } from '../../../config/firebase';
import { db } from '../../../config/db';

const createClubCharge = httpsCallable<
  { autoRenew?: boolean },
  { checkoutUrl: string; transactionId: string }
>(functions, 'createClubCharge');
import { estMembreActif } from '../../../lib/club/membership';
import type { ClubDigitosSubscription, ClubDigitosPost, ClubDigitosEvent, ClubDigitosSession, ClubDigitosInfo, ClubDigitosComment, ClubPostCategory } from '../../../types';
import type { IconName } from '@ds';

export type ClubSubTab = 'feed' | 'leaderboard' | 'members' | 'discussions' | 'opportunities' | 'agenda' | 'events' | 'sessions' | 'infos' | 'referral';

/**
 * ⚠️ `emoji` EST DE LA DONNÉE, ET IL NE S'AFFICHE PLUS.
 *
 * Le champ est écrit en base sur des publications qui existent : l'effacer d'ici casserait des
 * enregistrements réels, et personne ne verrait la casse avant qu'un vieux post remonte dans
 * le fil. Il reste donc, intact. Ce qui change est en aval : le design system écrit « aucun
 * emoji, nulle part » à l'ÉCRAN, et les onglets rendent `icon` — un glyphe du jeu unique — à
 * sa place. La donnée survit, le rendu obéit.
 *
 * `labelKey` se résout dans l'espace de noms `club` (par ex. t('categories.general')).
 * `label` reste le repli des rendus qui ne sont pas encore passés par t(c.labelKey).
 */
export const CLUB_CATEGORIES: { id: ClubPostCategory; label: string; labelKey: string; emoji: string; icon: IconName; tint: string; dot: string }[] = [
  { id: 'general', label: 'Général', labelKey: 'categories.general', emoji: '💬', icon: 'comment', tint: 'text-transforme', dot: 'bg-[color:var(--mm-violet)]' },
  { id: 'question', label: 'Question', labelKey: 'categories.question', emoji: '❓', icon: 'info', tint: 'text-forme', dot: 'bg-[color:var(--mm-bleu)]' },
  { id: 'ressource', label: 'Ressource', labelKey: 'categories.ressource', emoji: '📚', icon: 'book', tint: 'text-digitalise-txt', dot: 'bg-[color:var(--mm-teal)]' },
  { id: 'temoignage', label: 'Témoignage', labelKey: 'categories.temoignage', emoji: '⭐', icon: 'star', tint: 'text-informe-txt', dot: 'bg-[color:var(--mm-orange)]' },
  { id: 'opportunite', label: 'Opportunité', labelKey: 'categories.opportunite', emoji: '🚀', icon: 'case', tint: 'text-corail-txt', dot: 'bg-[color:var(--mm-corail)]' },
  { id: 'discussion', label: 'Discussion', labelKey: 'categories.discussion', emoji: '🗣️', icon: 'chat', tint: 'text-ok', dot: 'bg-[color:var(--ok)]' },
];

/**
 * L'humeur d'une publication. LE CARACTÈRE EST LA VALEUR STOCKÉE — `post.mood` porte l'emoji
 * lui-même, pas un identifiant. C'est ce qui interdit de renommer cette liste : des posts
 * existants contiennent déjà « 🔥 » ou « 🙏 ».
 */
export const MOOD_OPTIONS = ['😊', '🔥', '💡', '🎉', '💪', '🤔', '😎', '❤️', '👏', '🙏'];

/**
 * Le mot que porte chaque humeur à l'écran, puisque le caractère ne s'y affiche plus.
 *
 * Ce n'est pas une invention : c'est la LECTURE de chaque emoji, celle que fait un lecteur
 * d'écran, ramenée dans l'interface pour tout le monde. Une humeur absente de cette table ne
 * se rend PAS — mieux vaut ne rien afficher que de laisser filtrer le caractère.
 */
export const MOOD_LABEL_KEYS: Record<string, string> = {
  '😊': 'feed.moods.smile',
  '🔥': 'feed.moods.fire',
  '💡': 'feed.moods.idea',
  '🎉': 'feed.moods.celebrate',
  '💪': 'feed.moods.strength',
  '🤔': 'feed.moods.thinking',
  '😎': 'feed.moods.confident',
  '❤️': 'feed.moods.heart',
  '👏': 'feed.moods.applause',
  '🙏': 'feed.moods.thanks',
};

/**
 * Les destinations de partage. `emoji` reste pour ne rien casser côté appelant, mais il n'est
 * plus rendu nulle part : c'était de la décoration, pas de la donnée, et `icon` la remplace.
 *
 * LES QUATRE COULEURS DE MARQUE ONT ÉTÉ RETIRÉES, et la liste était déjà incohérente avec
 * elle-même : WhatsApp, Facebook, LinkedIn et Telegram portaient `bg-green-500`,
 * `bg-blue-600`, `bg-blue-700` et `bg-sky-500` — la palette PAR DÉFAUT de Tailwind — pendant
 * que Twitter et « copier » lisaient déjà des jetons du système.
 *
 * Ces quatre valeurs ne sont même pas les couleurs officielles des marques qu'elles imitent
 * (#25D366 pour WhatsApp, #1877F2 pour Facebook) : ce sont des approximations. Le système
 * n'admet une couleur tierce que dans sa valeur EXACTE et jamais recolorée — une approximation
 * n'a donc aucun droit d'exister ici, et elle ne bascule pas sous `.dk` par-dessus le marché.
 *
 * C'est la décision déjà prise pour les sept réseaux de `ProfileTab` : le GLYPHE distingue la
 * destination, le fond reste neutre. Le kit n'affiche d'ailleurs aucun logo de plateforme.
 */
export const SHARE_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', color: 'bg-[color:var(--fill-2)]', emoji: '📱', icon: 'chat' },
  { id: 'facebook', label: 'Facebook', color: 'bg-[color:var(--fill-2)]', emoji: '📘', icon: 'users' },
  { id: 'twitter', label: 'Twitter / X', color: 'bg-[color:var(--fill-2)]', emoji: '🐦', icon: 'send' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-[color:var(--fill-2)]', emoji: '💼', icon: 'case' },
  { id: 'telegram', label: 'Telegram', color: 'bg-[color:var(--fill-2)]', emoji: '✈️', icon: 'send' },
  { id: 'copy', label: 'Copier le texte', color: 'bg-[color:var(--fill-1)]', emoji: '📋', icon: 'copy' },
] as const satisfies readonly { id: string; label: string; color: string; emoji: string; icon: IconName }[];

export const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color:var(--night-3)] text-ink text-sm focus:outline-none focus:border-forme transition-colors';

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

  const isClubActive = estMembreActif(clubSubscription);
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
      // Gamification: reward club engagement + unlock community badge.
      // Le premier post vaut davantage que les suivants — le barème `firstClubPost`
      // existait dans le référentiel mais n'était câblé nulle part.
      const ownPosts = posts.filter((p) => p.userId === user.uid).length;
      addXP(user.uid, ownPosts <= 1 ? XP_REWARDS.firstClubPost : XP_REWARDS.clubPost).catch(() => null);
      if (ownPosts >= 10) {
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
