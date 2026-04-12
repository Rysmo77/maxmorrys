import { Trash2, Plus, Loader2, Send } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';
import { inputCls } from '../hooks/useAdminClub';
import type { ClubDigitosPost } from '../../../types';

interface ClubPostsTabProps {
  posts: ClubDigitosPost[];
  showPostForm: boolean;
  setShowPostForm: React.Dispatch<React.SetStateAction<boolean>>;
  adminPostContent: string;
  setAdminPostContent: React.Dispatch<React.SetStateAction<string>>;
  publishingPost: boolean;
  handleAdminPost: () => Promise<void>;
  handleDeletePost: (id: string) => Promise<void>;
}

export default function ClubPostsTab({
  posts, showPostForm, setShowPostForm, adminPostContent, setAdminPostContent,
  publishingPost, handleAdminPost, handleDeletePost,
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
  );
}
