import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, Skeleton } from '@ds';
import SEOHead from '../../../../components/seo/SEOHead';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { useAuth } from '../../../../contexts/AuthContext';
import { useFormat } from '../../../../hooks/useFormat';
import {
  addClubComment, getClubComments, getClubPost, getClubPosts, getMyClubProfile, likeClubPost,
} from '../../../../lib/firestore/club';
import { getInitials } from '../../../../lib/utils';
import type { ClubDigitosComment, ClubDigitosPost, ClubMemberProfile } from '../../../../types';
import { ClubScreen } from '../../tabs/club/ClubScreen';
import { useClubAccess } from './useClubAccess';

/**
 * /mon-espace/club/publication/:postId — maquette `Club-Publication.dc.html` (+ `-mobile`), lot C.
 *
 * DONNÉES RÉELLES : la publication (`club_posts/{id}`), ses commentaires (sous-collection),
 * la fiche d'annuaire de l'auteur s'il l'a rendue visible (`club_profiles`), et les autres
 * publications de la même catégorie. « J'aime » et « Commenter » écrivent réellement, par les
 * fonctions que le fil utilise déjà.
 *
 * CE QUI N'EST PAS RECOPIÉ : « Enregistrer », la mention `@` et les boutons « Signaler /
 * Bloquer » n'ont pas de producteur sur le web. La carte de la maquette est gardée, et dit
 * où passer en attendant (la page Contact), sans bouton qui n'écrirait rien.
 */
export default function ClubPublicationPage() {
  const { postId = '' } = useParams();
  const { t } = useTranslation('ecrans');
  const { formatDate } = useFormat();
  const { user, userData } = useAuth();
  const access = useClubAccess();
  const k = (s: string) => `club.publication.${s}`;

  const [post, setPost] = useState<ClubDigitosPost | null | undefined>(undefined);
  const [comments, setComments] = useState<ClubDigitosComment[]>([]);
  const [author, setAuthor] = useState<ClubMemberProfile | null>(null);
  const [related, setRelated] = useState<ClubDigitosPost[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (access !== 'member' || !postId) return;
    let alive = true;
    getClubPost(postId)
      .then(async (p) => {
        if (!alive) return;
        setPost(p);
        if (!p) return;
        const [cs, prof, recent] = await Promise.all([
          getClubComments(p.id).catch(() => []),
          getMyClubProfile(p.userId).catch(() => null),
          getClubPosts(30).catch(() => []),
        ]);
        if (!alive) return;
        setComments(cs);
        setAuthor(prof && prof.visible ? prof : null);
        setRelated(recent.filter((r) => r.id !== p.id && r.category === p.category).slice(0, 3));
      })
      .catch(() => { if (alive) setPost(null); });
    return () => { alive = false; };
  }, [access, postId]);

  if (access !== 'member') return access;

  const liked = Boolean(user && post?.likes.includes(user.uid));
  const toggleLike = async () => {
    if (!user || !post) return;
    const next = !liked;
    setPost({ ...post, likes: next ? [...post.likes, user.uid] : post.likes.filter((id) => id !== user.uid) });
    await likeClubPost(post.id, user.uid, next).catch(() => setPost(post));
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !post || !draft.trim()) return;
    setSending(true);
    try {
      await addClubComment(post.id, {
        userId: user.uid,
        userName: userData?.displayName || user.displayName || t(k('me')),
        userPhoto: user.photoURL || undefined,
        content: draft.trim(),
      });
      setDraft('');
      setComments(await getClubComments(post.id));
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
    } finally {
      setSending(false);
    }
  };

  const crumb = (
    <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
      <LocalizedLink to="/mon-espace/club/fil" className="inline-flex items-center gap-1.5 font-semibold text-ink no-underline">
        <Icon name="chevron-left" size={15} />{t(k('back'))}
      </LocalizedLink>
      {post && <><span aria-hidden="true">›</span><span>{t(`club.categories.${post.category}`)}</span></>}
    </div>
  );

  return (
    <>
      <SEOHead title={post?.title || t(k('title'))} description={t(k('body'))} noIndex />
      <ClubScreen
        above={crumb}
        title={post?.title || t(k('title'))}
        circlesLabel={t('club.circles.label')}
        circlesEmpty={t('club.circles.empty')}
      >
        {post === undefined ? (
          <Skeleton height={360} radius="var(--r-l)" label={t(k('title'))} />
        ) : post === null ? (
          <section className="mm-card !p-6 text-center">
            <b className="block text-[18px] text-ink">{t(k('empty'))}</b>
            <p className="mx-auto mb-0 mt-1.5 max-w-[48ch] text-[14px] text-ink-2">{t(k('body'))}</p>
          </section>
        ) : (
          <div className="grid items-start gap-4 wide:grid-cols-[minmax(0,1fr)_320px]">
            <article className="mm-dpost min-w-0">
              <div className="mm-dpost__head">
                <span className="mm-avatar">{getInitials(post.userName)}</span>
                <div className="min-w-0">
                  <b>{post.userName} <span className="mm-chipd ml-1.5 !h-[22px] !text-[11px]">{t(`club.categories.${post.category}`)}</span></b>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
              <p className="m-0 mt-3 whitespace-pre-line text-[15px] leading-[1.55] text-ink">{post.content}</p>
              {post.mediaUrl && post.mediaType === 'image' && (
                <img src={post.mediaUrl} alt="" className="mt-3.5 max-h-[420px] w-full rounded-card object-cover" loading="lazy" />
              )}
              <div className="mm-dpost__acts">
                <button type="button" aria-pressed={liked} onClick={toggleLike}>
                  <Icon name="heart" size={17} />{post.likes.length}
                </button>
                <span className="inline-flex items-center gap-1.5 text-ink-2"><Icon name="comment" size={17} />{post.commentsCount}</span>
                <span className="inline-flex items-center gap-1.5 text-ink-2"><Icon name="repeat" size={17} />{post.reposts.length}</span>
              </div>

              <div className="mt-4 border-t border-[color:var(--line)] pt-4">
                <b className="text-[15px] text-ink">{t(k('commentsTitle'), { count: comments.length })}</b>
                {comments.length === 0 && <p className="m-0 mt-2 text-[13.5px] text-ink-2">{t(k('commentsEmpty'))}</p>}
                <ul className="m-0 mt-2 list-none p-0">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-3 py-2.5">
                      <span className="mm-avatar sm">{getInitials(c.userName)}</span>
                      <div className="min-w-0">
                        <b className="text-[13.5px] text-ink">{c.userName}</b>{' '}
                        <span className="text-[12px] text-ink-3">{formatDate(c.createdAt)}</span>
                        <p className="m-0 mt-0.5 text-[14px] leading-[1.5] text-ink">{c.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <form onSubmit={send} className="mt-2 flex items-center gap-2.5">
                  <span className="mm-avatar sm">{getInitials(userData?.displayName || user?.displayName || '')}</span>
                  <label className="sr-only" htmlFor="club-comment">{t(k('commentLabel'))}</label>
                  <input
                    id="club-comment"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t(k('commentLabel'))}
                    className="h-11 min-w-0 flex-1 rounded-m border border-[color:var(--line)] bg-[color:var(--fill-1)] px-4 text-[14px] text-ink"
                  />
                  <button type="submit" className="mm-iconbtn flex-none" aria-label={t(k('send'))} disabled={sending || !draft.trim()}>
                    <Icon name="send" size={16} />
                  </button>
                </form>
              </div>
            </article>

            <aside className="flex flex-col gap-4">
              <section className="mm-card !p-5">
                <div className="flex items-center gap-3">
                  <span className="mm-avatar lg">{getInitials(post.userName)}</span>
                  <div className="min-w-0">
                    <b className="block text-[16px] text-ink">{post.userName}</b>
                    {author && <span className="text-[13px] text-ink-2">{[author.headline, author.city].filter(Boolean).join(' · ')}</span>}
                  </div>
                </div>
                {author && author.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {author.skills.slice(0, 4).map((s) => <span key={s} className="mm-chipd">{s}</span>)}
                  </div>
                )}
                {author ? (
                  <LocalizedLink to={`/mon-espace/club/membres/${post.userId}`} className="mm-btn-club is-sm mt-4 w-full">{t(k('viewProfile'))}</LocalizedLink>
                ) : (
                  <p className="m-0 mt-3 text-[12.5px] text-ink-3">{t(k('noProfile'))}</p>
                )}
              </section>

              <section className="mm-card !p-5">
                <h3 className="!text-[18px] text-ink">{t(k('relatedTitle'), { category: t(`club.categories.${post.category}`) })}</h3>
                {related.length === 0 ? (
                  <p className="m-0 mt-2 text-[13.5px] text-ink-2">{t(k('relatedEmpty'))}</p>
                ) : related.map((r) => (
                  <LocalizedLink key={r.id} to={`/mon-espace/club/publication/${r.id}`} className="block border-t border-[color:var(--line)] py-2.5 text-ink no-underline first-of-type:border-t-0">
                    <b className="block truncate text-[14px]">{r.title || r.content.slice(0, 60)}</b>
                    <span className="text-[12px] text-ink-3">{r.userName} · {formatDate(r.createdAt)}</span>
                  </LocalizedLink>
                ))}
              </section>

              <section className="mm-card !p-5">
                <b className="block text-[15px] text-ink">{t(k('reportTitle'))}</b>
                <span className="mt-1 block text-[13px] leading-[1.5] text-ink-2">{t(k('reportBody'))}</span>
                <LocalizedLink to="/contact" className="mm-ulink mt-3">{t(k('reportCta'))}</LocalizedLink>
              </section>
            </aside>
          </div>
        )}
      </ClubScreen>
    </>
  );
}
