import { Trash2, Plus, Loader2, Send, Pencil, MessageSquare, X, Check } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import { inputCls } from '../hooks/useAdminClub';
import type { ClubDigitosPost, ClubDigitosComment } from '../../../types';

interface ClubPostsTabProps {
  posts: ClubDigitosPost[];
  showPostForm: boolean;
  setShowPostForm: React.Dispatch<React.SetStateAction<boolean>>;
  adminPostContent: string;
  setAdminPostContent: React.Dispatch<React.SetStateAction<string>>;
  publishingPost: boolean;
  handleAdminPost: () => Promise<void>;
  handleDeletePost: (id: string) => Promise<void>;
  editingPostId: string | null;
  editPostContent: string;
  setEditPostContent: React.Dispatch<React.SetStateAction<string>>;
  savingPostEdit: boolean;
  openEditPost: (post?: ClubDigitosPost) => void;
  handleSavePostEdit: (id: string) => Promise<void>;
  openComments: string | null;
  postComments: Record<string, ClubDigitosComment[]>;
  loadingComments: boolean;
  handleToggleComments: (postId: string) => Promise<void>;
  handleDeleteComment: (postId: string, commentId: string) => Promise<void>;
}

export default function ClubPostsTab({
  posts, showPostForm, setShowPostForm, adminPostContent, setAdminPostContent,
  publishingPost, handleAdminPost, handleDeletePost,
  editingPostId, editPostContent, setEditPostContent, savingPostEdit, openEditPost, handleSavePostEdit,
  openComments, postComments, loadingComments, handleToggleComments, handleDeleteComment,
}: ClubPostsTabProps) {
  return (
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
        posts.map((post) => {
          const commentsOpen = openComments === post.id;
          const comments = postComments[post.id] ?? [];
          return (
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{post.userName}</p>
                      {post.isAdmin && <Badge variant="brand" size="sm">Admin</Badge>}
                      <span className="text-xs text-neutral-400">{formatDate(post.createdAt)}</span>
                    </div>

                    {editingPostId === post.id ? (
                      <div className="space-y-2">
                        <textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} rows={3} className={`${inputCls} resize-y`} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSavePostEdit(post.id)} disabled={savingPostEdit || !editPostContent.trim()} icon={savingPostEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}>Enregistrer</Button>
                          <Button size="sm" variant="outline" onClick={() => openEditPost()}>Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap break-words">{post.content}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span>{post.likes.length} j'aime</span>
                      <button onClick={() => handleToggleComments(post.id)} className={`inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors ${commentsOpen ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                        <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount ?? 0} commentaire{(post.commentsCount ?? 0) > 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEditPost(post)} className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Modifier"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDeletePost(post.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" aria-label="Supprimer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Comments moderation */}
              {commentsOpen && (
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  {loadingComments && !postComments[post.id] ? (
                    <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-brand-500" /></div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-2">Aucun commentaire.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white">{c.userName} <span className="text-neutral-400 font-normal">· {formatDate(c.createdAt)}</span></p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 break-words">{c.content}</p>
                        </div>
                        <button onClick={() => handleDeleteComment(post.id, c.id)} className="p-1 rounded-lg text-neutral-300 hover:text-error-500 transition-colors flex-shrink-0" aria-label="Supprimer le commentaire"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
