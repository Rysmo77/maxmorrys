import {
  Heart, Rss, MessageSquare, Share2, Repeat2, Image as ImageIcon, Smile, X, Send,
  Trash2, Check, Loader2,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { cn, formatDate } from '../../../../lib/utils';
import { CLUB_CATEGORIES, MOOD_OPTIONS, SHARE_PLATFORMS, inputCls } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';

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

  const filtered = clubCategoryFilter === 'all' ? clubPosts : clubPosts.filter((p) => p.category === clubCategoryFilter);

  return (
    <div className="space-y-4">
      {/* Post composer */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {photoURL ? <img src={photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{initials}</span>}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={composerCategory} onChange={(e) => setComposerCategory(e.target.value as typeof composerCategory)} className="text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
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
      {filtered.length === 0 ? (
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
      )}
    </div>
  );
}
