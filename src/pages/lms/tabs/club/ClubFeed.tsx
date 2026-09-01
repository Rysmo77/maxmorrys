import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Avatar, Button, ChipRow, Field, GlassPanel, Icon, Num, Skeleton, Tag } from '@ds';
import MediaRecorderInput from '../../../../components/lms/MediaRecorderInput';
import { getActiveClubChallenge } from '../../../../lib/firestore';
import type { ClubDigitosChallenge } from '../../../../types';
import { cn } from '../../../../lib/utils';
import { useFormat } from '../../../../hooks/useFormat';
import { ClubEmptyState } from './_shared';
import { CLUB_CATEGORIES, MOOD_OPTIONS, MOOD_LABEL_KEYS, SHARE_PLATFORMS } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubFeedProps {
  data: ClubData;
}

const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

/**
 * LE FIL — écran `ClubFil` du kit, et l'endroit où les emoji du Club posaient une question.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'HUMEUR EST DE LA DONNÉE. Elle n'est plus DESSINÉE ; elle est NOMMÉE.
 *
 * `post.mood` contient le caractère lui-même — « 🔥 », « 🙏 » — écrit en base sur des
 * publications qui existent. Le design system écrit « aucun emoji, nulle part » ; effacer le
 * champ pour obéir casserait des enregistrements réels, et personne ne le verrait avant qu'un
 * vieux post remonte. La règle porte sur l'ÉCRAN : la donnée reste, `MOOD_LABEL_KEYS` la
 * traduit en mot, et le mot s'affiche dans un `<Tag>`.
 *
 * UNE HUMEUR ABSENTE DE LA TABLE NE SE REND PAS. Ni le caractère en repli — ce serait
 * réintroduire l'emoji par la porte de derrière — ni un point d'interrogation. Elle disparaît
 * de la ligne, et le reste de la publication est intact.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DEUX AUTRES EMOJI ÉTAIENT, EUX, DE LA PURE DÉCORATION, et n'ont laissé aucune donnée
 * derrière eux : 🏆 devant la récompense du défi, et les six pictogrammes des destinations de
 * partage (📱📘🐦💼✈️📋). Ils passent aux glyphes du jeu unique.
 *
 * LES QUATRE COMPTEURS D'UNE PUBLICATION — commentaires, republications, j'aime, votes —
 * passent par `<Num source="db">`. Ce ne sont pas des chiffres de façade : ils sortent des
 * tableaux stockés sur le document, et c'est exactement ce que la source `db` déclare.
 */
export default function ClubFeed({ data }: ClubFeedProps) {
  const { t } = useTranslation('club');
  const { formatDate } = useFormat();
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
  const asOf = useRef(new Date()).current;

  useEffect(() => {
    getActiveClubChallenge().then(setChallenge).catch(() => null);
  }, []);

  const filtered = clubCategoryFilter === 'all' ? clubPosts : clubPosts.filter((p) => p.category === clubCategoryFilter);
  const activeCat = CLUB_CATEGORIES.find((c) => c.id === composerCategory) ?? CLUB_CATEGORIES[0];

  /** Le mot d'une humeur, ou rien. Jamais le caractère en repli. */
  const moodLabel = (mood: string | undefined) => {
    const key = mood ? MOOD_LABEL_KEYS[mood] : undefined;
    return key ? t(key) : null;
  };

  const filterOptions = useMemo(
    () => [t('feed.filterAll'), ...CLUB_CATEGORIES.map((c) => t(c.labelKey))],
    [t],
  );
  const activeFilterLabel = clubCategoryFilter === 'all'
    ? filterOptions[0]
    : t(CLUB_CATEGORIES.find((c) => c.id === clubCategoryFilter)?.labelKey ?? 'feed.filterAll');

  const busy = postingToClub || uploadingMedia;

  return (
    <motion.div className="space-y-4" variants={slideUp} initial="hidden" animate="visible">
      {/* ── Le défi en cours ────────────────────────────────────────────────── */}
      {challenge && (
        <GlassPanel level="flat" padding={16}>
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 flex-none place-items-center rounded-m bg-[image:var(--action-transforme)]"
            >
              <Icon name="trophy" size={19} color="var(--paper-fixed)" />
            </span>
            <div className="min-w-0">
              <p className="mm-eyebrow m-0 text-transforme">{t('feed.challengeEyebrow')}</p>
              <p className="mt-0.5 font-bold text-ink">{challenge.title}</p>
              {challenge.description && <p className="mt-0.5 text-meta text-ink-2">{challenge.description}</p>}
              {challenge.reward && (
                <p className="mt-2 flex items-center gap-1.5 text-meta-2 font-semibold text-transforme">
                  <span aria-hidden="true" className="flex-none"><Icon name="gift" size={14} /></span>
                  {challenge.reward}
                </p>
              )}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ── Le composeur ────────────────────────────────────────────────────── */}
      <GlassPanel level="flat" padding={16}>
        <div className="flex items-start gap-3">
          {photoURL
            ? <img src={photoURL} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
            : <Avatar initials={initials} size={44} />}

          <div className="min-w-0 flex-1">
            <Field
              as="textarea"
              rows={2}
              maxLength={2000}
              label={t('feed.composerLabel')}
              hideLabel
              value={clubPostContent}
              onChange={setClubPostContent}
              placeholder={t('feed.composerPlaceholder')}
              style={{ marginTop: 0 }}
            />

            {composerMediaType === 'image' && composerMediaPreview && (
              <div className="relative mt-3 w-full max-w-sm">
                <img src={composerMediaPreview} alt={t('feed.previewAlt')} className="max-h-56 w-full rounded-m border border-[color:var(--line)] object-cover" />
                <button
                  type="button"
                  aria-label={t('feed.removeMedia')}
                  onClick={() => {
                    setComposerMediaFile(null);
                    if (composerMediaPreview) URL.revokeObjectURL(composerMediaPreview);
                    setComposerMediaPreview('');
                  }}
                  className="mm-touch-extend absolute right-1.5 top-1.5 rounded-pill bg-[color-mix(in_srgb,var(--night)_65%,transparent)] p-1 text-[color:var(--paper-fixed)]"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}

            {composerMediaType !== 'image' && user && (
              <div className="mt-3">
                <MediaRecorderInput mode={composerMediaType} userId={user.uid} value={composerAvUrl} onChange={setComposerAvUrl} folder="club_media" />
              </div>
            )}

            {composerPoll && (
              <div className="mt-3 rounded-m border border-[color:var(--line)] p-3">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <Field
                      label={t('feed.optionPlaceholder', { number: i + 1 })}
                      hideLabel
                      value={opt}
                      onChange={(v) => setPollOptions(pollOptions.map((o, j) => (j === i ? v : o)))}
                      placeholder={t('feed.optionPlaceholder', { number: i + 1 })}
                      maxLength={80}
                      className="flex-1"
                      style={{ marginTop: '8px' }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        aria-label={t('feed.removeOption', { number: i + 1 })}
                        onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                        className="mm-touch-extend mb-2 rounded-xs p-1 text-ink-2 transition-colors duration-ui ease-ds hover:text-stop"
                      >
                        <Icon name="close" size={15} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <Button tone="quiet" size="sm" onClick={() => setPollOptions([...pollOptions, ''])} style={{ marginTop: '10px' }}>
                    <Icon name="plus" size={14} /> {t('feed.addOption')}
                  </Button>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--border-hair)] pt-3">
              <div className="flex flex-wrap items-center gap-1">
                {/* Catégorie */}
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={showCategoryPicker}
                    onClick={() => { setShowCategoryPicker((v) => !v); setShowMoodPicker(false); }}
                    className={cn(
                      'mm-touch-extend flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-meta-2 font-semibold transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)]',
                      activeCat.tint,
                    )}
                  >
                    <Icon name={activeCat.icon} size={15} />
                    {t(activeCat.labelKey)}
                    <Icon name="chevron" size={12} />
                  </button>
                  {showCategoryPicker && (
                    <div className="glass-flat absolute bottom-full left-0 z-20 mb-1 w-48 max-w-[calc(100vw-1.5rem)] p-1.5">
                      {CLUB_CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setComposerCategory(c.id); setShowCategoryPicker(false); }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-xs px-2.5 py-2 text-meta-2 font-medium transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)]',
                            composerCategory === c.id ? c.tint : 'text-ink-2',
                          )}
                        >
                          <Icon name={c.icon} size={15} /> {t(c.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Humeur — le mot, jamais le caractère */}
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={showMoodPicker}
                    onClick={() => { setShowMoodPicker((v) => !v); setShowCategoryPicker(false); }}
                    className="mm-touch-extend flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-meta-2 font-semibold text-ink-2 transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)]"
                  >
                    <Icon name="smile" size={15} />
                    {moodLabel(composerMood) ?? t('feed.mood')}
                  </button>
                  {showMoodPicker && (
                    <div className="glass-flat absolute bottom-full left-0 z-20 mb-1 flex w-56 max-w-[calc(100vw-1.5rem)] flex-wrap gap-1.5 p-2">
                      {MOOD_OPTIONS.map((m) => {
                        const label = moodLabel(m);
                        if (!label) return null;
                        const on = composerMood === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            aria-pressed={on}
                            onClick={() => { setComposerMood(on ? '' : m); setShowMoodPicker(false); }}
                            className="mm-touch-extend"
                          >
                            <Tag tone={on ? 'ok' : 'neutral'}>{label}</Tag>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pièce jointe : photo, audio, vidéo, sondage */}
                <input type="file" accept="image/*" ref={mediaInputRef} onChange={handleMediaSelect} className="hidden" />
                {([
                  { key: 'image', icon: 'image', label: t('feed.photo'), on: composerMediaType === 'image' && !!composerMediaPreview,
                    act: () => { setComposerMediaType('image'); setComposerAvUrl(''); mediaInputRef.current?.click(); } },
                  { key: 'audio', icon: 'mic', label: t('feed.audio'), on: composerMediaType === 'audio',
                    act: () => { setComposerMediaType(composerMediaType === 'audio' ? 'image' : 'audio'); setComposerMediaFile(null); setComposerMediaPreview(''); } },
                  { key: 'video', icon: 'video', label: t('feed.video'), on: composerMediaType === 'video',
                    act: () => { setComposerMediaType(composerMediaType === 'video' ? 'image' : 'video'); setComposerMediaFile(null); setComposerMediaPreview(''); } },
                  { key: 'poll', icon: 'bars', label: t('feed.poll'), on: composerPoll,
                    act: () => { setComposerPoll(!composerPoll); setComposerMediaType('image'); setComposerMediaFile(null); setComposerMediaPreview(''); setComposerAvUrl(''); } },
                ] as const).map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    aria-pressed={b.on}
                    onClick={b.act}
                    className={cn(
                      'mm-touch-extend flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-meta-2 font-semibold transition-colors duration-ui ease-ds',
                      b.on
                        ? 'bg-[color-mix(in_srgb,var(--mm-violet)_12%,transparent)] text-transforme'
                        : 'text-ink-2 hover:bg-[color:var(--fill-2)] hover:text-transforme',
                    )}
                  >
                    <Icon name={b.icon} size={15} />
                    <span className="hidden stack:inline">{b.label}</span>
                  </button>
                ))}
              </div>

              <Button
                tone="transforme"
                size="sm"
                loading={busy}
                disabled={!clubPostContent.trim()}
                onClick={handleClubPost}
              >
                <Icon name="send" size={15} />
                {uploadingMedia ? t('feed.sending') : postingToClub ? t('feed.publishing') : t('feed.publish')}
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* ── Le filtre par catégorie ─────────────────────────────────────────── */}
      <ChipRow
        label={t('feed.filterLabel')}
        options={filterOptions}
        value={activeFilterLabel}
        onChange={(option) => {
          const idx = filterOptions.indexOf(option);
          setClubCategoryFilter(idx <= 0 ? 'all' : CLUB_CATEGORIES[idx - 1].id);
        }}
      />

      {/* ── Les publications ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <ClubEmptyState icon="list" title={t('feed.emptyTitle')} subtitle={t('feed.emptySubtitle')} />
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
            const mood = moodLabel(post.mood);

            return (
              <GlassPanel key={post.id} level="flat" padding={16}>
                <div className="flex items-start gap-3">
                  {post.userPhoto
                    ? <img src={post.userPhoto} alt="" loading="lazy" className="h-11 w-11 flex-none rounded-full object-cover" />
                    : <Avatar initials={initialsOf(post.userName)} size={44} />}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-meta font-bold text-ink">{post.userName}</span>
                      {post.isAdmin && (
                        <span className="flex-none text-transforme">
                          <Icon name="check" size={14} title={t('feed.adminBadge')} />
                        </span>
                      )}
                      <span className="text-meta-2 text-ink-2">· {formatDate(post.createdAt)}</span>
                      {mood && <Tag>{mood}</Tag>}
                      {catInfo && (
                        <span className="inline-flex items-center gap-1 text-meta-2 text-ink-2">
                          <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', catInfo.dot)} />
                          {t(catInfo.labelKey)}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 whitespace-pre-wrap break-words text-body leading-relaxed text-ink-2">{post.content}</p>

                    {post.mediaUrl && post.mediaType === 'video' && (
                      <video src={post.mediaUrl} controls playsInline className="mt-3 max-h-80 w-full rounded-m border border-[color:var(--line)]" />
                    )}
                    {post.mediaUrl && post.mediaType === 'audio' && (
                      <audio src={post.mediaUrl} controls className="mt-3 w-full" />
                    )}
                    {post.mediaUrl && post.mediaType !== 'video' && post.mediaType !== 'audio' && (
                      <img src={post.mediaUrl} alt="" loading="lazy" className="mt-3 max-h-80 w-full rounded-m border border-[color:var(--line)] object-cover" />
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
                                  'relative w-full overflow-hidden rounded-m border text-left transition-colors duration-ui ease-ds',
                                  mine ? 'border-transforme' : 'border-[color:var(--line)]',
                                  !voted && 'hover:border-transforme',
                                )}
                              >
                                {voted && (
                                  <span
                                    aria-hidden="true"
                                    className="prog-fill absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--mm-violet)_12%,transparent)] transition-[width] duration-scene ease-ds"
                                    style={{ width: `${pct}%` }}
                                  />
                                )}
                                <span className="relative flex items-center justify-between gap-2 px-3 py-2 text-meta">
                                  <span className="flex items-center gap-1.5 font-medium text-ink-2">
                                    {mine && <span className="text-transforme"><Icon name="check" size={14} /></span>}
                                    {opt}
                                  </span>
                                  {voted && <Num value={pct} unit="%" source="db" asOf={asOf} className="flex-none" />}
                                </span>
                              </button>
                            );
                          })}
                          <p className="text-meta-2 text-ink-2">
                            {t('feed.votes', { count: total })}{!voted && t('feed.tapToVote')}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Barre d'action */}
                    <div className="mt-3 flex max-w-md items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleComments(post.id)}
                        aria-expanded={commentsOpen}
                        className={cn(
                          'mm-touch-extend flex items-center gap-1.5 rounded-pill px-2 py-1 text-meta-2 font-medium transition-colors duration-ui ease-ds',
                          commentsOpen ? 'text-transforme' : 'text-ink-2 hover:text-transforme',
                        )}
                      >
                        <Icon name="comment" size={17} />
                        {commentCount > 0 && <Num value={commentCount} source="db" asOf={asOf} />}
                        <span className="sr-only">{t('feed.commentsAction')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRepost(post.id, !reposted)}
                        aria-pressed={reposted}
                        className={cn(
                          'mm-touch-extend flex items-center gap-1.5 rounded-pill px-2 py-1 text-meta-2 font-medium transition-colors duration-ui ease-ds',
                          reposted ? 'text-digitalise-txt' : 'text-ink-2 hover:text-digitalise-txt',
                        )}
                      >
                        <Icon name="repeat" size={17} />
                        {repostCount > 0 && <Num value={repostCount} source="db" asOf={asOf} />}
                        <span className="sr-only">{t('feed.repostAction')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLikePost(post.id, !liked)}
                        aria-pressed={liked}
                        className={cn(
                          'mm-touch-extend flex items-center gap-1.5 rounded-pill px-2 py-1 text-meta-2 font-medium transition-colors duration-ui ease-ds',
                          liked ? 'text-corail-txt' : 'text-ink-2 hover:text-corail-txt',
                        )}
                      >
                        <Icon name="heart" size={17} />
                        {likeCount > 0 && <Num value={likeCount} source="db" asOf={asOf} />}
                        <span className="sr-only">{t('feed.likeAction')}</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label={t('infos.share')}
                          aria-expanded={shareMenuOpen === post.id}
                          onClick={() => { setShareMenuOpen(shareMenuOpen === post.id ? null : post.id); setPostMenuOpen(null); }}
                          className="mm-touch-extend flex items-center rounded-pill px-2 py-1 text-ink-2 transition-colors duration-ui ease-ds hover:text-transforme"
                        >
                          {copiedPostId === post.id
                            ? <span className="text-ok"><Icon name="check" size={17} /></span>
                            : <Icon name="share" size={17} />}
                        </button>
                        {shareMenuOpen === post.id && (
                          <div className="glass-flat absolute bottom-full right-0 z-30 mb-1 w-44 max-w-[calc(100vw-1.5rem)] p-1.5">
                            {SHARE_PLATFORMS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleShare(p.id, post)}
                                className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-meta-2 text-ink-2 transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)]"
                              >
                                <Icon name={p.icon} size={15} /> {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="relative flex-none">
                      <button
                        type="button"
                        aria-label={t('feed.postMenu')}
                        aria-expanded={postMenuOpen === post.id}
                        onClick={() => { setPostMenuOpen(postMenuOpen === post.id ? null : post.id); setShareMenuOpen(null); }}
                        className="mm-touch-extend rounded-pill p-1.5 text-ink-2 transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)]"
                      >
                        <Icon name="dots" size={18} />
                      </button>
                      {postMenuOpen === post.id && (
                        <div className="glass-flat absolute right-0 top-full z-30 mt-1 w-40 max-w-[calc(100vw-1.5rem)] p-1.5">
                          <button
                            type="button"
                            onClick={() => { handleDeleteClubPost(post.id); setPostMenuOpen(null); }}
                            className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-meta-2 font-medium text-stop transition-colors duration-ui ease-ds hover:bg-[color-mix(in_srgb,var(--stop)_10%,transparent)]"
                          >
                            <Icon name="trash" size={15} /> {t('feed.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Commentaires */}
                {commentsOpen && (
                  <div className="mt-3 space-y-3 border-t border-[color:var(--border-hair)] pt-3 stack:pl-14">
                    {loadingComments[post.id] ? (
                      <div className="space-y-2">
                        <Skeleton height={44} radius="var(--r-m)" label={t('feed.commentsAction')} />
                        <Skeleton height={44} radius="var(--r-m)" label={t('feed.commentsAction')} />
                      </div>
                    ) : (postComments[post.id] ?? []).length === 0 ? (
                      <p className="py-2 text-center text-meta-2 text-ink-2">{t('feed.noComments')}</p>
                    ) : (
                      <div className="space-y-2.5">
                        {(postComments[post.id] ?? []).map((c) => (
                          <div key={c.id} className="group flex items-start gap-2">
                            {c.userPhoto
                              ? <img src={c.userPhoto} alt="" loading="lazy" className="h-7 w-7 flex-none rounded-full object-cover" />
                              : <Avatar initials={initialsOf(c.userName)} size={28} />}
                            <div className="min-w-0 flex-1">
                              <div className="rounded-m rounded-tl-s bg-[color:var(--fill-1)] px-3 py-2">
                                <p className="flex items-center gap-1 text-meta-2 font-semibold text-ink">
                                  {c.userName}
                                  {c.isAdmin && (
                                    <span className="text-transforme">
                                      <Icon name="check" size={12} title={t('feed.adminBadge')} />
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 whitespace-pre-wrap break-words text-meta-2 text-ink-2">{c.content}</p>
                              </div>
                              <span className="ml-1 text-small text-ink-2">{formatDate(c.createdAt)}</span>
                            </div>
                            {user && c.userId === user.uid && (
                              <button
                                type="button"
                                aria-label={t('feed.delete')}
                                onClick={() => handleDeleteComment(post.id, c.id)}
                                className="mm-touch-extend rounded-xs p-1 text-ink-2 opacity-0 transition-opacity duration-ui ease-ds hover:text-stop focus-visible:opacity-100 group-hover:opacity-100"
                              >
                                <Icon name="close" size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/*
                      UN VRAI `<form>` : la touche Entrée soumet nativement, et le clavier
                      logiciel mobile — dont la touche d'envoi soumet le formulaire sans
                      toujours émettre d'Entrée — fonctionne sans écouteur de touche.
                    */}
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id); }}
                      className="flex items-end gap-2"
                    >
                      {photoURL
                        ? <img src={photoURL} alt="" className="mb-2 h-7 w-7 flex-none rounded-full object-cover" />
                        : <Avatar initials={initials} size={28} style={{ marginBottom: '8px' }} />}
                      <Field
                        label={t('feed.commentLabel')}
                        hideLabel
                        value={commentDraft[post.id] ?? ''}
                        onChange={(v) => setCommentDraft((prev) => ({ ...prev, [post.id]: v }))}
                        placeholder={t('feed.commentPlaceholder')}
                        className="flex-1"
                        style={{ marginTop: 0 }}
                      />
                      <Button
                        tone="transforme"
                        size="sm"
                        type="submit"
                        loading={submittingComment === post.id}
                        disabled={!commentDraft[post.id]?.trim()}
                        style={{ marginBottom: '0' }}
                      >
                        <Icon name="send" size={15} />
                        <span className="sr-only">{t('feed.commentSend')}</span>
                      </Button>
                    </form>
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
