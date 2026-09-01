import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, DocLine, EmptyState, Field, GlassPanel, Icon, IconButton, LessonRow, Num, Tag } from '@ds';
import { ConsoleList, ConsoleScope } from '../../../components/console';
import ConsoleSheet from './ConsoleSheet';
import { useFormat } from '../../../hooks/useFormat';
import type { ClubDigitosPost, ClubDigitosComment } from '../../../types';
import ConsoleListSkeleton from './ConsoleListSkeleton';

/**
 * ── PUBLICATIONS — motif de console ─────────────────────────────────────────────────
 *
 * ZONE 1 · IL N'Y A PAS DE FILE, ET C'EST UN FAIT DE PRODUIT, PAS UN OUBLI. Rien dans
 * `ClubDigitosPost` ne porte d'état : une publication est en ligne à la seconde où elle est
 * écrite, elle n'est ni relue ni approuvée, et rien ne la retire d'une file. La seule
 * modération du Club est A POSTERIORI — c'est la section « Signalements » qui la tient, et
 * c'est ELLE qui a la file. Écrire ici « tout · à modérer » ferait croire à un tamis qui
 * n'existe pas ; le pied le dit en toutes lettres.
 *
 * ZONE 2 · QUATRE ACTIONS DEVIENNENT UNE. La ligne portait crayon, poubelle et bascule des
 * commentaires — trois cibles de seize pixels — plus une croix par commentaire une fois le
 * fil déplié. Elle en porte une : ouvrir. La fiche tient l'édition, la suppression, et la
 * modération des commentaires, chacun avec SON unique action.
 *
 * LES DEUX COMPTEURS PASSENT PAR `<Num>` (règle 6). « 3 j'aime · 7 commentaires » était
 * rendu en corps de texte, sans source ni date : deux nombres lus en base présentés comme
 * s'ils tombaient du ciel. Ils portent maintenant la date de la lecture qui les a produits.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
const initialsOf = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

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
  /** L'instant où la lecture a répondu. `null` tant qu'aucune n'a abouti (règle 6). */
  loadedAt: Date | null;
}

export default function ClubPostsTab({
  posts, showPostForm, setShowPostForm, adminPostContent, setAdminPostContent,
  publishingPost, handleAdminPost, handleDeletePost,
  editingPostId, editPostContent, setEditPostContent, savingPostEdit, openEditPost, handleSavePostEdit,
  openComments, postComments, loadingComments, handleToggleComments, handleDeleteComment,
  loadedAt,
}: ClubPostsTabProps) {
  const { t } = useTranslation('adminClub');
  const { formatDate } = useFormat();
  /** La publication ouverte en fiche. Distincte du composeur, qui crée. */
  const [openId, setOpenId] = useState<string | null>(null);

  const sheet = posts.find((p) => p.id === openId) ?? null;
  const comments = sheet ? (postComments[sheet.id] ?? []) : [];
  const commentsOpen = Boolean(sheet && openComments === sheet.id);

  const openSheet = (post: ClubDigitosPost) => {
    setOpenId(post.id);
    openEditPost(post);
  };

  const closeSheet = () => {
    setOpenId(null);
    openEditPost();
  };

  const removePost = async (id: string) => {
    await handleDeletePost(id);
    closeSheet();
  };

  /* `handleSavePostEdit` remet `editingPostId` à null : sans fermeture, la feuille resterait
     ouverte sur un formulaire dont le bouton d'enregistrement vient de se désactiver. */
  const saveEdit = async (id: string) => {
    await handleSavePostEdit(id);
    closeSheet();
  };

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowPostForm(true)}>
          <Icon name="plus" size={15} /> {t('posts.publishAsAdmin')}
        </Button>
      </div>

      <div className="mt-3">
        {posts.length === 0 ? (
          <EmptyState
            glyph={<Icon name="chat" size={26} color="var(--mm-bleu)" />}
            glyphBackground="color-mix(in srgb, var(--mm-bleu) 20%, transparent)"
            title={t('posts.empty')}
            body={t('posts.emptyBody')}
            action={<Button size="sm" onClick={() => setShowPostForm(true)}>{t('posts.publishAsAdmin')}</Button>}
          />
        ) : (
          <ConsoleList label={t('posts.listLabel')}>
            {posts.map((post, i) => (
              <li key={post.id}>
                <LessonRow
                  onClick={() => openSheet(post)}
                  icon={post.userPhoto
                    ? <img src={post.userPhoto} alt="" className="h-[30px] w-[30px] rounded-full object-cover" />
                    : <Avatar initials={initialsOf(post.userName)} size={30} background="var(--action-forme)" />}
                  iconBackground="transparent"
                  title={post.userName}
                  meta={(
                    <>
                      {formatDate(post.createdAt)}
                      {' · '}
                      <Num value={loadedAt ? post.likes.length : null} source="db" asOf={loadedAt ?? new Date()} />
                      {' '}
                      {t('posts.likesWord')}
                      {' · '}
                      <Num value={loadedAt ? (post.commentsCount ?? 0) : null} source="db" asOf={loadedAt ?? new Date()} />
                      {' '}
                      {t('posts.commentsWord')}
                    </>
                  )}
                  trailing={post.isAdmin ? <Tag tone="neutral">{t('posts.adminBadge')}</Tag> : undefined}
                  last={i === posts.length - 1}
                />
              </li>
            ))}
          </ConsoleList>
        )}
      </div>

      <ConsoleScope title={t('common.sectionScopeTitle')}>{t('posts.scope')}</ConsoleScope>

      {/* ── LE COMPOSEUR — il CRÉE, il ne modère pas : sa propre feuille ────────────── */}
      <ConsoleSheet
        open={showPostForm}
        onClose={() => { setShowPostForm(false); setAdminPostContent(''); }}
        closeLabel={t('common.close')}
        eyebrow={t('posts.adminBadge')}
        title={t('posts.newPostTitle')}
        footer={(
          <>
            <Button size="sm" tone="quiet" onClick={() => { setShowPostForm(false); setAdminPostContent(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => { void handleAdminPost(); }}
              loading={publishingPost}
              disabled={!adminPostContent.trim()}
            >
              {publishingPost ? t('posts.publishing') : t('posts.publish')}
            </Button>
          </>
        )}
      >
        <Field
          size="sm"
          as="textarea"
          rows={5}
          label={t('posts.newPostTitle')}
          hideLabel
          value={adminPostContent}
          onChange={setAdminPostContent}
          placeholder={t('posts.messagePlaceholder')}
        />
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('posts.composerNotice')}</p>
      </ConsoleSheet>

      {/* ── LA FICHE — tout ce que la ligne ne porte plus ───────────────────────────── */}
      <ConsoleSheet
        open={Boolean(sheet)}
        onClose={closeSheet}
        closeLabel={t('common.close')}
        eyebrow={sheet?.isAdmin ? t('posts.adminBadge') : t('posts.memberPost')}
        title={sheet?.userName ?? ''}
        footer={sheet && (
          <>
            <Button size="sm" tone="quiet" onClick={() => { void removePost(sheet.id); }} style={{ marginRight: 'auto' }}>
              {t('posts.deletePost')}
            </Button>
            <Button size="sm" tone="quiet" onClick={closeSheet}>{t('common.cancel')}</Button>
            <Button
              size="sm"
              onClick={() => { void saveEdit(sheet.id); }}
              loading={savingPostEdit}
              disabled={!editPostContent.trim() || editingPostId !== sheet.id}
            >
              {t('common.save')}
            </Button>
          </>
        )}
      >
        {sheet && (
          <div className="space-y-4">
            <div>
              <DocLine label={t('posts.dateLabel')} value={formatDate(sheet.createdAt)} />
              <DocLine
                label={t('posts.likesLabel')}
                value={<Num value={loadedAt ? sheet.likes.length : null} source="db" asOf={loadedAt ?? new Date()} />}
              />
              <DocLine
                label={t('posts.commentsLabel')}
                value={<Num value={loadedAt ? (sheet.commentsCount ?? 0) : null} source="db" asOf={loadedAt ?? new Date()} />}
                last
              />
            </div>

            {/* Le texte est ÉDITABLE ici, et nulle part ailleurs : corriger une publication
                sans l'avoir sous les yeux en entier n'a jamais eu de sens. */}
            <Field
              size="sm"
              as="textarea"
              rows={5}
              label={t('posts.editLabel')}
              value={editPostContent}
              onChange={setEditPostContent}
            />

            <div>
              <Button
                size="sm"
                tone="quiet"
                onClick={() => { void handleToggleComments(sheet.id); }}
                loading={loadingComments && !postComments[sheet.id]}
              >
                <Icon name="comment" size={15} />
                {commentsOpen ? t('posts.hideComments') : t('posts.showComments')}
              </Button>

              {commentsOpen && (
                loadingComments && !postComments[sheet.id] ? (
                  <div className="mt-3"><ConsoleListSkeleton rows={2} label={t('posts.commentsLabel')} /></div>
                ) : comments.length === 0 ? (
                  <p className="m-0 mt-3 text-meta-2 text-ink-2">{t('posts.noComments')}</p>
                ) : (
                  <ul className="m-0 mt-3 list-none space-y-2 p-0" aria-label={t('posts.commentsLabel')}>
                    {comments.map((c) => (
                      <li key={c.id}>
                        <GlassPanel level="flat" padding="8px 12px">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="m-0 text-meta-2 font-semibold text-ink">
                                {c.userName}
                                <span className="font-normal text-ink-2">{` · ${formatDate(c.createdAt)}`}</span>
                              </p>
                              <p className="m-0 break-words text-meta-2 text-ink-2">{c.content}</p>
                            </div>
                            {/* UNE action par commentaire, et elle porte son nom : le kit
                                interdit une cible sans texte, `IconButton` exige le libellé. */}
                            <IconButton
                              label={t('posts.deleteCommentAria')}
                              onClick={() => { void handleDeleteComment(sheet.id, c.id); }}
                            >
                              <Icon name="trash" size={15} />
                            </IconButton>
                          </div>
                        </GlassPanel>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        )}
      </ConsoleSheet>
    </div>
  );
}
