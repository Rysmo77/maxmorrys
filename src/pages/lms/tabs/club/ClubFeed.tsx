import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChatCircle, Repeat, Heart, ShareFat, ImageSquare, Microphone, VideoCamera, Smiley, PaperPlaneTilt,
  SealCheck, DotsThree, X, Trash, Check, CircleNotch, Rss, CaretDown, ChartBar, Plus, Trophy,
} from '@phosphor-icons/react';
import Button from '../../../../components/ui/Button';
import MediaRecorderInput from '../../../../components/lms/MediaRecorderInput';
import { getActiveClubChallenge } from '../../../../lib/firestore';
import type { ClubDigitosChallenge } from '../../../../types';
import { cn, formatDate } from '../../../../lib/utils';
import { ClubEmptyState } from './_shared';
import { CLUB_CATEGORIES, MOOD_OPTIONS, SHARE_PLATFORMS, inputCls } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubFeedProps {
  data: ClubData;
}

export default function ClubFeed({ data }: ClubFeedProps) {
  const {
    user, initials, photoURL,
    clubPosts, clubPostContent, setClubPostContent,
    postingToClub, uploadingMedia,
    composerCategory, setComposerCategory,
    composerMood, setComposerMood,
    showMoodPicker, setShowMoodPicker,
    composerMediaPreview, setComposerMediaFile, setComposerMediaPreview,
    composerMediaType, setComposerMediaType, composerAvUrl, setComposerAvUrl,
    composerPoll, setComposerPoll, pollOptions, setPollOptions, handleVotePoll,
    mediaInputRef,
    clubCategoryFilter, setClubCategoryFilter,
    openComments, postComments, loadingComments,
    commentDraft, setCommentDraft,
    submittingComment,
    shareMenuOpen, setShareMenuOpen,
    copiedPostId,
    handleClubPost, handleLikePost, handleDeleteClubPost,
    handleRepost, handleToggleComments, handleAddComment, handleDeleteComment,
    handleShare, handleMediaSelect,
  } = data;

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ClubDigitosChallenge | null>(null);

  useEffect(() => {
    getActiveClubChallenge().then(setChallenge).catch(() => null);
  }, []);

  const filtered = clubCategoryFilter === 'all' ? clubPosts : clubPosts.filter((p) => p.category === clubCategoryFilter);
  const activeCat = CLUB_CATEGORIES.find((c) => c.id === composerCategory) ?? CLUB_CATEGORIES[0];

  return (
    <motion.div className="space-y-4" variants={slideUp} initial="hidden" animate="visible">
      {/* ───────── Défi de la semaine ───────── */}
      {challenge && (
        <div className="rounded-2xl border border-plum-200 dark:border-plum-800/60 bg-gradient-to-br from-plum-50 to-white dark:from-plum-900/30 dark:to-neutral-800 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-600 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" weight="fill" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-plum-600 dark:text-plum-400 uppercase tracking-wide">Défi de la semaine</p>
              <p className="font-bold text-neutral-900 dark:text-white">{challenge.title}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{challenge.description}</p>
              {challenge.reward && <p className="text-xs text-plum-600 dark:text-plum-400 font-semibold mt-1.5">🏆 {challenge.reward}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ───────── Composer ───────── */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-plum-50 dark:ring-plum-900/20">
            {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-plum-600 dark:text-plum-400">{initials}</span>}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={clubPostContent}
              onChange={(e) => setClubPostContent(e.target.value)}
              placeholder="Quoi de neuf dans la communauté ?"
              rows={2}
              maxLength={2000}
              className={cn(inputCls, 'resize-none border-0 bg-transparent px-0 text-base focus:ring-0 placeholder-neutral-400')}
            />

            {composerMediaType === 'image' && composerMediaPreview && (
              <div className="relative w-full max-w-sm">
                <img src={composerMediaPreview} alt="aperçu" className="rounded-xl w-full object-cover max-h-56 border border-neutral-200 dark:border-neutral-700" />
                <button type="button" onClick={() => { setComposerMediaFile(null); if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview); setComposerMediaPreview(''); }} className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors">
                  <X className="w-3.5 h-3.5" weight="bold" />
                </button>
              </div>
            )}
            {composerMediaType !== 'image' && user && (
              <MediaRecorderInput mode={composerMediaType} userId={user.uid} value={composerAvUrl} onChange={setComposerAvUrl} folder="club_media" />
            )}

            {composerPoll && (
              <div className="space-y-2 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) => setPollOptions(pollOptions.map((o, j) => (j === i ? e.target.value : o)))}
                      placeholder={`Option ${i + 1}`}
                      maxLength={80}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500"
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="p-1 rounded-lg text-neutral-400 hover:text-error-500 transition-colors">
                        <X className="w-4 h-4" weight="bold" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} className="flex items-center gap-1.5 text-xs font-semibold text-plum-600 dark:text-plum-400 hover:underline">
                    <Plus className="w-3.5 h-3.5" weight="bold" /> Ajouter une option
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center gap-1">
                {/* Category picker */}
                <div className="relative">
                  <button type="button" onClick={() => { setShowCategoryPicker((v) => !v); setShowMoodPicker(false); }} className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors', activeCat.tint, 'hover:bg-neutral-100 dark:hover:bg-neutral-700')}>
                    <activeCat.icon className="w-4 h-4" weight="duotone" />
                    {activeCat.label}
                    <CaretDown className="w-3 h-3 opacity-60" />
                  </button>
                  {showCategoryPicker && (
                    <div className="absolute bottom-full left-0 mb-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1.5 shadow-lg w-48">
                      {CLUB_CATEGORIES.map((c) => (
                        <button key={c.id} type="button" onClick={() => { setComposerCategory(c.id); setShowCategoryPicker(false); }} className={cn('w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700', composerCategory === c.id ? c.tint : 'text-neutral-600 dark:text-neutral-300')}>
                          <c.icon className="w-4 h-4" weight="duotone" /> {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mood */}
                <div className="relative">
                  <button type="button" onClick={() => { setShowMoodPicker((v) => !v); setShowCategoryPicker(false); }} className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                    {composerMood ? <span className="text-base leading-none">{composerMood}</span> : <Smiley className="w-4 h-4" weight="duotone" />}
                    <span className="hidden sm:inline">Humeur</span>
                  </button>
                  {showMoodPicker && (
                    <div className="absolute bottom-full left-0 mb-1 z-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-2 shadow-lg flex gap-1 flex-wrap w-44">
                      {MOOD_OPTIONS.map((m) => (
                        <button key={m} type="button" onClick={() => { setComposerMood(composerMood === m ? '' : m); setShowMoodPicker(false); }} className={cn('text-xl p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors', composerMood === m && 'bg-plum-50 dark:bg-plum-900/20')}>
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media format: photo / audio / vidéo */}
                <input type="file" accept="image/*" ref={mediaInputRef} onChange={handleMediaSelect} className="hidden" />
                <button type="button" onClick={() => { setComposerMediaType('image'); setComposerAvUrl(''); mediaInputRef.current?.click(); }} className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors', composerMediaType === 'image' && composerMediaPreview ? 'text-plum-600 bg-plum-50 dark:bg-plum-900/20' : 'text-neutral-500 hover:text-plum-600 hover:bg-plum-50 dark:hover:bg-plum-900/20')}>
                  <ImageSquare className="w-4 h-4" weight="duotone" />
                  <span className="hidden sm:inline">Photo</span>
                </button>
                <button type="button" onClick={() => { setComposerMediaType(composerMediaType === 'audio' ? 'image' : 'audio'); setComposerMediaFile(null); setComposerMediaPreview(''); }} className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors', composerMediaType === 'audio' ? 'text-plum-600 bg-plum-50 dark:bg-plum-900/20' : 'text-neutral-500 hover:text-plum-600 hover:bg-plum-50 dark:hover:bg-plum-900/20')}>
                  <Microphone className="w-4 h-4" weight="duotone" />
                  <span className="hidden sm:inline">Audio</span>
                </button>
                <button type="button" onClick={() => { setComposerMediaType(composerMediaType === 'video' ? 'image' : 'video'); setComposerMediaFile(null); setComposerMediaPreview(''); }} className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors', composerMediaType === 'video' ? 'text-plum-600 bg-plum-50 dark:bg-plum-900/20' : 'text-neutral-500 hover:text-plum-600 hover:bg-plum-50 dark:hover:bg-plum-900/20')}>
                  <VideoCamera className="w-4 h-4" weight="duotone" />
                  <span className="hidden sm:inline">Vidéo</span>
                </button>
                <button type="button" onClick={() => { setComposerPoll(!composerPoll); setComposerMediaType('image'); setComposerMediaFile(null); setComposerMediaPreview(''); setComposerAvUrl(''); }} className={cn('flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors', composerPoll ? 'text-plum-600 bg-plum-50 dark:bg-plum-900/20' : 'text-neutral-500 hover:text-plum-600 hover:bg-plum-50 dark:hover:bg-plum-900/20')}>
                  <ChartBar className="w-4 h-4" weight="duotone" />
                  <span className="hidden sm:inline">Sondage</span>
                </button>
              </div>

              <Button
                size="sm"
                onClick={handleClubPost}
                disabled={postingToClub || uploadingMedia || !clubPostContent.trim()}
                className="!bg-plum-600 hover:!bg-plum-700 !rounded-full"
                icon={(postingToClub || uploadingMedia) ? <CircleNotch className="w-4 h-4 animate-spin" /> : <PaperPlaneTilt className="w-4 h-4" weight="fill" />}
              >
                {uploadingMedia ? 'Envoi…' : postingToClub ? 'Publication…' : 'Publier'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Category filter ───────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
        <button onClick={() => setClubCategoryFilter('all')} className={cn('flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors', clubCategoryFilter === 'all' ? 'bg-plum-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>
          Tout
        </button>
        {CLUB_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setClubCategoryFilter(c.id)} className={cn('flex-shrink-0 flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors whitespace-nowrap', clubCategoryFilter === c.id ? 'bg-plum-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>
            <c.icon className="w-3.5 h-3.5" weight={clubCategoryFilter === c.id ? 'fill' : 'duotone'} /> {c.label}
          </button>
        ))}
      </div>

      {/* ───────── Posts ───────── */}
      {filtered.length === 0 ? (
        <ClubEmptyState icon={Rss} title="Aucune publication ici" subtitle="Sois le premier à partager quelque chose avec la communauté dans cette catégorie." />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const liked = user ? post.likes.includes(user.uid) : false;
            const reposted = user ? (post.reposts ?? []).includes(user.uid) : false;
            const commentsOpen = openComments.has(post.id);
            const catInfo = CLUB_CATEGORIES.find((c) => c.id === post.category);
            const likeCount = post.likes.length;
            const repostCount = (post.reposts ?? []).length;
            const commentCount = post.commentsCount ?? 0;
            const isOwner = !!user && post.userId === user.uid;
            return (
              <div key={post.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 transition-all hover:border-plum-200 dark:hover:border-plum-800/60 hover:shadow-soft">
                {/* Header — inline X-style */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {post.userPhoto ? <img src={post.userPhoto} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-plum-600 dark:text-plum-400">{post.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">{post.userName}</span>
                      {post.isAdmin && <SealCheck className="w-4 h-4 text-plum-500 flex-shrink-0" weight="fill" />}
                      {post.mood && <span className="text-sm leading-none">{post.mood}</span>}
                      <span className="text-xs text-neutral-400">· {formatDate(post.createdAt)}</span>
                      {catInfo && (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                          <span className={cn('w-1.5 h-1.5 rounded-full', catInfo.dot)} />
                          {catInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-[15px] text-neutral-800 dark:text-neutral-200 leading-relaxed mt-1.5 whitespace-pre-wrap break-words">{post.content}</p>
                    {post.mediaUrl && post.mediaType === 'video' && (
                      <video src={post.mediaUrl} controls playsInline className="w-full rounded-xl max-h-80 mt-3 bg-black border border-neutral-200 dark:border-neutral-700" />
                    )}
                    {post.mediaUrl && post.mediaType === 'audio' && (
                      <audio src={post.mediaUrl} controls className="w-full mt-3" />
                    )}
                    {post.mediaUrl && post.mediaType !== 'video' && post.mediaType !== 'audio' && (
                      <img src={post.mediaUrl} alt="" className="w-full rounded-xl object-cover max-h-80 mt-3 border border-neutral-200 dark:border-neutral-700" loading="lazy" />
                    )}

                    {post.poll && (() => {
                      const votes = post.pollVotes ?? {};
                      const counts = post.poll.options.map((_, i) => Object.values(votes).filter((v) => v === i).length);
                      const total = counts.reduce((a, b) => a + b, 0);
                      const myVote = user ? votes[user.uid] : undefined;
                      const voted = myVote !== undefined;
                      return (
                        <div className="mt-3 space-y-1.5">
                          {post.poll!.options.map((opt, i) => {
                            const pct = total ? Math.round((counts[i] / total) * 100) : 0;
                            const mine = myVote === i;
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={voted}
                                onClick={() => handleVotePoll(post.id, i)}
                                className={cn(
                                  'relative w-full text-left rounded-xl border overflow-hidden transition-colors',
                                  mine ? 'border-plum-400 dark:border-plum-600' : 'border-neutral-200 dark:border-neutral-700',
                                  !voted && 'hover:border-plum-300 dark:hover:border-plum-700',
                                )}
                              >
                                {voted && <div className="absolute inset-y-0 left-0 bg-plum-100 dark:bg-plum-900/30 transition-all" style={{ width: `${pct}%` }} />}
                                <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                                  <span className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                                    {mine && <Check className="w-4 h-4 text-plum-600 dark:text-plum-400" weight="bold" />}
                                    {opt}
                                  </span>
                                  {voted && <span className="tabular-nums text-xs text-neutral-500 flex-shrink-0">{pct}%</span>}
                                </div>
                              </button>
                            );
                          })}
                          <p className="text-xs text-neutral-400">{total} vote{total > 1 ? 's' : ''}{!voted && ' · tape pour voter'}</p>
                        </div>
                      );
                    })()}

                    {/* Action bar — X-style icons + counts */}
                    <div className="flex items-center justify-between max-w-md mt-3 -ml-1.5">
                      <button onClick={() => handleToggleComments(post.id)} className={cn('group flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium transition-colors', commentsOpen ? 'text-plum-600 dark:text-plum-400' : 'text-neutral-400 hover:text-plum-600 dark:hover:text-plum-400')}>
                        <span className="p-1 rounded-full group-hover:bg-plum-50 dark:group-hover:bg-plum-900/20 transition-colors">
                          <ChatCircle className="w-[18px] h-[18px]" weight={commentsOpen ? 'fill' : 'regular'} />
                        </span>
                        {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
                      </button>

                      <button onClick={() => handleRepost(post.id, !reposted)} className={cn('group flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium transition-colors', reposted ? 'text-teal-600 dark:text-teal-400' : 'text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400')}>
                        <span className="p-1 rounded-full group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-colors">
                          <Repeat className="w-[18px] h-[18px]" weight={reposted ? 'bold' : 'regular'} />
                        </span>
                        {repostCount > 0 && <span className="tabular-nums">{repostCount}</span>}
                      </button>

                      <button onClick={() => handleLikePost(post.id, !liked)} className={cn('group flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium transition-colors', liked ? 'text-coral-500' : 'text-neutral-400 hover:text-coral-500')}>
                        <span className="p-1 rounded-full group-hover:bg-coral-50 dark:group-hover:bg-coral-900/20 transition-colors">
                          <Heart className="w-[18px] h-[18px]" weight={liked ? 'fill' : 'regular'} />
                        </span>
                        {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
                      </button>

                      <div className="relative">
                        <button onClick={() => { setShareMenuOpen(shareMenuOpen === post.id ? null : post.id); setPostMenuOpen(null); }} className="group flex items-center px-1.5 py-1 rounded-full text-neutral-400 hover:text-plum-600 dark:hover:text-plum-400 transition-colors">
                          <span className="p-1 rounded-full group-hover:bg-plum-50 dark:group-hover:bg-plum-900/20 transition-colors">
                            {copiedPostId === post.id ? <Check className="w-[18px] h-[18px] text-success-500" weight="bold" /> : <ShareFat className="w-[18px] h-[18px]" weight="regular" />}
                          </span>
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
                  </div>

                  {/* Overflow menu (author) */}
                  {isOwner && (
                    <div className="relative flex-shrink-0">
                      <button onClick={() => { setPostMenuOpen(postMenuOpen === post.id ? null : post.id); setShareMenuOpen(null); }} className="p-1.5 rounded-full text-neutral-300 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                        <DotsThree className="w-5 h-5" weight="bold" />
                      </button>
                      {postMenuOpen === post.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 min-w-40">
                          <button onClick={() => { handleDeleteClubPost(post.id); setPostMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                            <Trash className="w-4 h-4" weight="duotone" /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
                {commentsOpen && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 space-y-3 pl-3 sm:pl-14">
                    {loadingComments[post.id] ? (
                      <div className="flex justify-center py-4"><CircleNotch className="w-5 h-5 animate-spin text-plum-500" /></div>
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
                              <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl rounded-tl-sm px-3 py-2">
                                <p className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1">
                                  {c.userName}
                                  {c.isAdmin && <SealCheck className="w-3 h-3 text-plum-500" weight="fill" />}
                                </p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
                              </div>
                              <span className="text-[10px] text-neutral-400 ml-1">{formatDate(c.createdAt)}</span>
                            </div>
                            {user && (c.userId === user.uid) && (
                              <button onClick={() => handleDeleteComment(post.id, c.id)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-error-500 transition-all">
                                <X className="w-3.5 h-3.5" weight="bold" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-plum-100 dark:bg-plum-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-plum-600 dark:text-plum-400">{initials}</span>}
                      </div>
                      <input
                        value={commentDraft[post.id] ?? ''}
                        onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(post.id); } }}
                        placeholder="Écrire un commentaire…"
                        className="flex-1 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 placeholder-neutral-400"
                      />
                      <button onClick={() => handleAddComment(post.id)} disabled={submittingComment === post.id || !commentDraft[post.id]?.trim()} className="p-2 rounded-full bg-plum-600 text-white hover:bg-plum-700 disabled:opacity-50 transition-colors flex-shrink-0">
                        {submittingComment === post.id ? <CircleNotch className="w-3.5 h-3.5 animate-spin" /> : <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
