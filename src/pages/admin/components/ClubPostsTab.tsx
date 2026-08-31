import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosPost, ClubDigitosComment } from '../../../types';
import { Field, Icon } from '@ds';
import ConsoleListSkeleton from './ConsoleListSkeleton';

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
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  return (
    <div className="space-y-3">
      {/* Admin post creation */}
      <div className="flex justify-end mb-2">
        <Button size="sm" onClick={() => setShowPostForm((v) => !v)} icon={<Icon name="plus" size={16} />}>
          {t('posts.publishAsAdmin')}
        </Button>
      </div>
      {showPostForm && (
        <Card>
          <h3 className="font-bold text-ink mb-3">{t('posts.newPostTitle')}</h3>
          {/* Le titre de la carte au-dessus n'est pas le libellé du champ : il n'est lié à
              rien. `hideLabel` donne au contrôle un nom réel sans doubler ce titre à l'écran. */}
          <Field
            size="sm"
            as="textarea"
            hideLabel
            label={t('posts.newPostTitle')}
            value={adminPostContent}
            onChange={setAdminPostContent}
            placeholder={t('posts.messagePlaceholder')}
            rows={4}
            className="mb-3"
            style={{ marginTop: 0 }}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => { setShowPostForm(false); setAdminPostContent(''); }}>{t('common.cancel')}</Button>
            <Button size="sm" onClick={handleAdminPost} disabled={publishingPost || !adminPostContent.trim()} loading={publishingPost} icon={<Icon name="send" size={16} />}>
              {publishingPost ? t('posts.publishing') : t('posts.publish')}
            </Button>
          </div>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card><p className="text-center text-ink-2 py-8">{t('posts.empty')}</p></Card>
      ) : (
        posts.map((post) => {
          const commentsOpen = openComments === post.id;
          const comments = postComments[post.id] ?? [];
          return (
            <Card key={post.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--mm-bleu)_5%,transparent)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {post.userPhoto ? (
                      <img src={post.userPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-forme">
                        {post.userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-ink">{post.userName}</p>
                      {post.isAdmin && <Badge variant="brand" size="sm">{t('posts.adminBadge')}</Badge>}
                      <span className="text-xs text-ink-2">{formatDate(post.createdAt)}</span>
                    </div>

                    {editingPostId === post.id ? (
                      <div className="space-y-2">
                        <Field size="sm" as="textarea" hideLabel label={t('posts.editLabel')} value={editPostContent} onChange={setEditPostContent} rows={3} style={{ marginTop: 0 }} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSavePostEdit(post.id)} disabled={savingPostEdit || !editPostContent.trim()} loading={savingPostEdit} icon={<Icon name="check" size={16} />}>{t('common.save')}</Button>
                          <Button size="sm" variant="outline" onClick={() => openEditPost()}>{t('common.cancel')}</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-ink-2 whitespace-pre-wrap break-words">{post.content}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-ink-2">
                      <span>{t('posts.likes', { count: post.likes.length })}</span>
                      <button onClick={() => handleToggleComments(post.id)} className={`inline-flex items-center gap-1 hover:text-forme dark:hover:text-forme transition-colors ${commentsOpen ? 'text-forme' : ''}`}>
                        <Icon name="comment" size={14} /> {t('posts.comments', { count: post.commentsCount ?? 0 })}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEditPost(post)} className="p-1.5 rounded-lg text-ink-2 hover:text-forme hover:bg-[color:var(--fill-2)] dark:hover:bg-[color:var(--night-3)] transition-colors" aria-label={t('posts.editAria')}><Icon name="pencil" size={16} /></button>
                  <button onClick={() => handleDeletePost(post.id)} className="p-1.5 rounded-lg text-ink-2 hover:text-stop hover:bg-[color-mix(in_srgb,var(--stop)_8%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--stop)_20%,transparent)] transition-colors" aria-label={t('posts.deleteAria')}><Icon name="trash" size={16} /></button>
                </div>
              </div>

              {/* Comments moderation */}
              {commentsOpen && (
                <div className="mt-3 pt-3 border-t border-[color:var(--border-hair)] space-y-2">
                  {loadingComments && !postComments[post.id] ? (
                    <ConsoleListSkeleton />
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-ink-2 text-center py-2">{t('posts.noComments')}</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-2 bg-[color:var(--fill-1)] dark:bg-[color-mix(in_srgb,var(--night-3)_40%,transparent)] rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink">{c.userName} <span className="text-ink-2 font-normal">· {formatDate(c.createdAt)}</span></p>
                          <p className="text-xs text-ink-2 break-words">{c.content}</p>
                        </div>
                        <button onClick={() => handleDeleteComment(post.id, c.id)} className="p-1 rounded-lg text-ink-2 hover:text-stop transition-colors flex-shrink-0" aria-label={t('posts.deleteCommentAria')}><Icon name="close" size={14} /></button>
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
