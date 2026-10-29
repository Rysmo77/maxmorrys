import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { Avatar, Icon, ReadingBar, Skeleton, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import ShareButtons from '../components/shared/ShareButtons';
import { CoverImage, useActiveHeading, useReadingProgress } from '../components/site';
import { Eyebrow, KitButton, KitH2, KitSection, NightHero, Photo, type PhotoTone } from '../components/site/v3/kit';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { getPostBySlug, getPublishedPosts, incrementBlogViews } from '../lib/firestore';
import { markdownToHtml, withArticleToc, type ArticleHeading } from '../lib/markdown';
import { queryClient, queryKeys } from '../lib/queryClient';
import { findCachedPost } from '../lib/blogCache';
import LogoLoader from '../components/states/LogoLoader';
import { useFormat } from '../hooks/useFormat';
import { categoryToPole } from '../lib/blogCategories';
import { HOUSE_AUTHOR, isHouseAuthor, portrait } from '../lib/author';
import type { BlogPost as BlogPostType } from '../types';
import { trackViewItem } from '../lib/tracking';
import { useContentEngagement } from '../hooks/useContentEngagement';
import SEOHead from '../components/seo/SEOHead';
import { useLanguage } from '../contexts/LanguageContext';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../components/seo/seo-config';

const NewsletterForm = lazy(() => import('../components/shared/NewsletterForm'));

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ARTICLE — LA MAQUETTE `Site-Article` (bureau) / `-mobile` (390 px), PASSE 2.
 *
 * Gabarit de la planche : dalle de nuit centrée (retour « ← Contenus · sujet », titre,
 * signature), barre de lecture, trois colonnes `200px | 68ch | 1fr` — sommaire collant,
 * corps, encart d'appel collant —, partage sous le corps, la lettre, « À lire ensuite ».
 *
 * ⚠️ DÉCISION LEVÉE (porteur, 29/10/2026) : la passerelle « formation mise en avant » de la
 * colonne cède la place à l'encart de la planche, qui renvoie aux packs Commerces et TPE.
 *
 * Ce qui reste tenu, inchangé :
 * - le corps passe par `markdownToHtml` (DOMPurify) puis `withArticleToc` ; les liens
 *   internes du corps sont confiés au routeur ;
 * - auteur LU (`post.author`), portrait seulement pour la signature de la maison ;
 * - bandeau de traduction EN en tête, sujets cliquables, JSON-LD `BlogPosting` ;
 * - aucune image d'exemple : sans `coverImage`, rien n'est posé dans le corps.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const NEXT_TONES: PhotoTone[] = ['club', 'informe', 'studio'];

function Sommaire({ headings, actif }: { headings: ArticleHeading[]; actif: string | null }) {
  return (
    <div className="flex flex-col gap-[10px] text-[13.5px]">
      {headings.map((h) => {
        const courant = h.id === actif;
        return (
          <a
            key={h.id}
            href={`#${h.id}`}
            aria-current={courant ? 'location' : undefined}
            className={`no-underline transition-colors duration-ui hover:text-ink ${
              courant ? 'font-bold text-[color:var(--mm-violet)]' : 'text-ink-2'
            } ${h.level === 3 ? 'pl-3' : ''}`}
          >
            {h.text}
          </a>
        );
      })}
    </div>
  );
}

/**
 * L'ARTICLE EN ATTENTE — À SA VRAIE HAUTEUR (audit du 29/10/2026, registre #5).
 *
 * L'ancien squelette posait quelques barres grises dans une section nue : sans la dalle de
 * nuit, la page se réduisait au pied de page pendant ~2 s, puis la dalle arrivait et tout
 * sautait. Celui-ci reprend la DALLE (`NightHero`, mêmes marges, même titre sur deux lignes
 * à 40 px puis ~76 px) et la colonne de lecture de 68 ch : quand le contenu arrive, rien ne
 * bouge. Le logo animé dit ce qui charge ; les barres, elles, sont muettes (`aria-hidden`).
 */
function ArticleSkeleton({ label }: { label: string }) {
  return (
    <>
      <NightHero mesh="club" className="pb-[30px] stack:pb-14">
        <div className="relative z-[1] mx-auto box-border flex w-full max-w-[860px] flex-col px-5 pt-9 stack:items-center stack:px-4 stack:pt-[88px]">
          <div aria-hidden="true" className="flex w-full flex-col gap-[14px] stack:items-center">
            <Skeleton width={200} height={12} />
            <div className="h-[40px] w-[92%] stack:h-[72px] stack:w-[86%]"><Skeleton height="100%" radius="var(--r-s)" /></div>
            <div className="h-[40px] w-[64%] stack:h-[72px] stack:w-[58%]"><Skeleton height="100%" radius="var(--r-s)" /></div>
            <Skeleton width={240} height={14} style={{ marginTop: '6px' }} />
          </div>
        </div>
      </NightHero>
      <KitSection width={1180} className="pt-[30px] stack:pt-14">
        <div className="mx-auto max-w-[68ch]">
          <div className="mb-8 flex justify-center">
            <LogoLoader label={label} />
          </div>
          <div aria-hidden="true" className="grid gap-3">
            {[100, 100, 94, 100, 72, 0, 100, 97, 100, 64].map((w, i) =>
              w === 0 ? <span key={i} className="h-3" /> : <Skeleton key={i} height={16} width={`${w}%`} />,
            )}
          </div>
        </div>
      </KitSection>
    </>
  );
}

export default function BlogPost() {
  const { t } = useTranslation('blog');
  const { formatDate } = useFormat();
  const { slug } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const path = useLocalizedPath();
  // Un article déjà en mémoire est rendu dès la PREMIÈRE image, sans passer par le squelette.
  const [post, setPost] = useState<BlogPostType | null | undefined>(() =>
    slug ? findCachedPost(slug, language) : undefined,
  );
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    if (!slug) return;
    const recevoir = (data: BlogPostType | null) => {
      setPost(data);
      if (data) {
        trackViewItem({ id: data.id, name: data.title, category: data.category, content_type: 'article' });
        // Une vue par session et par article : la clé est posée APRÈS l'écriture réussie.
        const viewKey = `blog-viewed-${data.id}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(viewKey)) {
          incrementBlogViews(data.id)
            .then(() => sessionStorage.setItem(viewKey, '1'))
            .catch(() => null);
        }
        // « À lire ensuite » : même sujet d'abord, puis les plus récents pour compléter.
        queryClient
          .fetchQuery({ queryKey: queryKeys.blogPosts, queryFn: () => getPublishedPosts() })
          .then((all) => {
            const autres = all.filter((p) => p.id !== data.id);
            const meme = autres.filter((p) => p.category === data.category);
            const complement = autres.filter((p) => p.category !== data.category);
            setRelatedPosts([...meme, ...complement].slice(0, 3));
          })
          .catch(() => null);
      }
    };
    /*
     * DÉJÀ EN MÉMOIRE → AFFICHÉ SANS REQUÊTE. Venu de l'index, de l'accueil ou d'« À lire
     * ensuite », l'article est dans une liste que TanStack Query garde, corps compris.
     */
    const enCache = findCachedPost(slug, language);
    if (enCache) {
      recevoir(enCache);
      return;
    }
    /* Arrivée directe : la liste d'« À lire ensuite » part EN MÊME TEMPS que l'article, au
       lieu d'attendre sa réponse — un aller-retour de moins avant la fin de la page. */
    void queryClient.prefetchQuery({ queryKey: queryKeys.blogPosts, queryFn: () => getPublishedPosts() });
    getPostBySlug(slug, language).then(recevoir).catch(() => setPost(null));
  }, [slug, language]);

  useContentEngagement({
    contentId: post?.id,
    type: 'article',
    slug: post?.slug ?? '',
    title: post?.title ?? '',
    category: post?.category ?? 'général',
  });

  const translatedTitle = useTranslatedText(post?.title);
  const translatedExcerpt = useTranslatedText(post?.excerpt);
  const translatedPole = useTranslatedText(post ? categoryToPole(post.category) : '');
  const translatedBody = useTranslatedText(post?.content);
  const seoTitle = useTranslatedText(post?.metaTitle || post?.title);
  const seoDescription = useTranslatedText(post?.metaDescription) || translatedExcerpt;

  const corps = useMemo(
    () => withArticleToc(markdownToHtml(translatedBody || post?.content || '')),
    [translatedBody, post?.content],
  );

  // La barre de lecture ne mesure que le corps, pas ce qui le suit.
  const articleRef = useRef<HTMLElement>(null);
  const progress = useReadingProgress(articleRef);
  const ancres = useMemo(() => corps.headings.map((h) => h.id), [corps.headings]);
  const titreActif = useActiveHeading(ancres);

  if (post === undefined) {
    return <ArticleSkeleton label={t('post.loading')} />;
  }

  if (!post) {
    return (
      <KitSection className="pt-14">
        <KitH2>{t('post.notFoundTitle')}</KitH2>
        <p className="mt-4">
          <KitButton href={path('/blog')} tone="quiet" size="sm">{t('post.notFoundLink')}</KitButton>
        </p>
      </KitSection>
    );
  }

  // Les liens internes du corps passent par le routeur (pas de rechargement complet).
  const handleContentClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor || anchor.hasAttribute('download')) return;
    if (anchor.target && anchor.target !== '_self') return;
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    }
  };

  const postAuthor = post.author || HOUSE_AUTHOR;
  const pole = translatedPole || categoryToPole(post.category);
  const titre = translatedTitle || post.title;

  return (
    <DsNavHost>
      <SEOHead title={seoTitle} description={seoDescription} ogImage={post.coverImage || DEFAULT_OG_IMAGE} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        url: `${SITE_URL}${contentPath('blog', post, language)}`,
        author: {
          '@type': 'Person',
          name: postAuthor,
          ...(isHouseAuthor(post.author) ? { image: `${SITE_URL}${portrait.avatar}` } : {}),
        },
        publisher: { '@type': 'Organization', name: SITE_NAME },
      }} />

      <ReadingBar value={progress} label={titre} />

      {/* ── LA DALLE : retour, titre (venu des données : il se replie), signature ── */}
      <NightHero mesh="club" className="pb-[30px] stack:pb-14">
        <div className="relative z-[1] mx-auto box-border w-full max-w-[860px] px-5 pt-9 stack:px-4 stack:pt-[88px] stack:text-center">
          <a href={path('/blog')} className="hidden text-[14px] text-[color:var(--mm-violet-c)] no-underline stack:inline">
            ← {t('article.back')} · {pole}
          </a>
          <span className="stack:hidden">
            <Eyebrow className="text-[color:var(--mm-violet-c)]">{t('article.back')} · {pole}</Eyebrow>
          </span>
          <h1 className="mm-d mb-[14px] mt-[14px] text-[40px] leading-[.98] stack:mb-5 stack:mt-[18px] stack:text-[clamp(48px,5.6vw,80px)] stack:leading-[.94]">
            {titre}
          </h1>
          <div className="flex items-center gap-3 text-[14px] text-ink-2 stack:justify-center">
            <span className="hidden stack:inline-flex">
              {isHouseAuthor(post.author) ? (
                <img src={portrait.avatar} alt="" width={36} height={36} loading="lazy" decoding="async" className="h-9 w-9 flex-none rounded-pill object-cover" />
              ) : (
                <Avatar initials={postAuthor.slice(0, 1).toUpperCase()} size={36} />
              )}
            </span>
            <span>
              <span className="hidden stack:inline">{postAuthor} · </span>
              <span className="mm-n">{formatDate(post.publishedAt)}</span>
              {post.readTime ? <> · <span className="mm-n">{t('article.readTimeLong', { count: post.readTime })}</span></> : null}
            </span>
          </div>
        </div>
      </NightHero>

      {/* ── LE CORPS : sommaire | prose | encart ─────────────────────────────── */}
      <KitSection width={1180} className="grid items-start gap-10 pt-[30px] stack:pt-14 wide:grid-cols-[200px_minmax(0,68ch)_1fr]">
        <aside className="hidden wide:sticky wide:top-[calc(var(--header-h)+1.5rem)] wide:block">
          {corps.headings.length > 1 && (
            <nav aria-label={t('article.tocTitle')} className="flex flex-col gap-[10px]">
              <Eyebrow>{t('article.tocTitle')}</Eyebrow>
              <Sommaire headings={corps.headings} actif={titreActif} />
            </nav>
          )}
        </aside>

        <article ref={articleRef} className="min-w-0">
          {language === 'en' && (
            <TranslationNotice
              date={formatDate(post.updatedAt ?? post.publishedAt)}
              href={`/blog/${post.slug}`}
              originalLabel={t('article.translatedOriginal')}
              style={{ marginBottom: '18px' }}
            />
          )}
          {post.coverImage && <CoverImage src={post.coverImage} priority className="mb-6" />}

          {corps.headings.length > 1 && (
            <details className="group mb-6 rounded-m border border-[color:var(--line)] px-4 py-3 wide:hidden">
              <summary className="mm-eyebrow flex cursor-pointer list-none items-center justify-between gap-3 text-ink [&::-webkit-details-marker]:hidden">
                {t('article.tocTitle')}
                <Icon name="chevron" size={16} className="transition-transform duration-ui group-open:rotate-180" />
              </summary>
              <div className="mt-3">
                <Sommaire headings={corps.headings} actif={titreActif} />
              </div>
            </details>
          )}

          <div
            className="mm-prose prose-article text-[17px] leading-[1.7] stack:text-[18.5px]"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: corps.html }}
          />

          {post.tags?.length > 0 && (
            <div className="mt-8">
              <Eyebrow>{t('article.tagsTitle')}</Eyebrow>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <a key={tag} href={`${path('/blog')}?tag=${encodeURIComponent(tag)}`} className="mm-chip no-underline">
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-9 border-0 border-t border-solid border-[color:var(--line)] pt-6">
            <ShareButtons url={`/blog/${post.slug}`} title={post.title} contentType="article" contentId={post.id} />
          </div>
        </article>

        <aside className="hidden wide:sticky wide:top-[calc(var(--header-h)+1.5rem)] wide:block">
          <div className="mm-bento !rounded-xl p-5">
            <b className="font-display text-[22px] font-black leading-[1.1]">{t('article.ctaTitle')}</b>
            <p className="mb-[14px] mt-2 text-[14px] text-ink-2">{t('article.ctaBody')}</p>
            <KitButton href={path('/conception/commerces-et-tpe')} tone="studio" size="sm">{t('article.ctaButton')}</KitButton>
          </div>
        </aside>
      </KitSection>

      {/* La lettre précède « À lire ensuite » en bureau et le suit au mobile, comme les deux
          planches : un seul formulaire, l'ordre change par `order`. */}
      <div className="flex flex-col">
        <KitSection className="order-2 pt-11 stack:order-1 stack:pt-[72px]">
          <div className="mx-auto flex max-w-[860px] flex-col gap-3 rounded-xl bg-[color:var(--paper-2)] p-5 stack:flex-row stack:flex-wrap stack:items-center stack:gap-5 stack:p-[34px]">
            <div className="stack:min-w-[280px] stack:flex-1">
              <span className="hidden stack:block"><Eyebrow>{t('article.newsletterEyebrow')}</Eyebrow></span>
              <b className="block font-display text-[24px] font-black leading-[1.05] stack:mt-2 stack:text-[30px]">{t('article.newsletterTitle')}</b>
            </div>
            <div className="stack:min-w-[320px] stack:flex-1">
              <Suspense fallback={null}>
                <NewsletterForm source="article" />
              </Suspense>
            </div>
          </div>
        </KitSection>

        {relatedPosts.length > 0 && (
          <KitSection className="order-1 pt-11 stack:order-2 stack:pt-[72px]">
            <KitH2 className="m-0 mb-3 stack:mb-[18px]" size="clamp(26px, 3vw, 40px)">{t('article.nextTitle')}</KitH2>
            <div className="grid gap-[10px] stack:grid-cols-3 stack:gap-4">
              {relatedPosts.map((related, i) => (
                <a
                  key={related.id}
                  href={path(`/blog/${related.slug}`)}
                  className={`mm-bento flex flex-col gap-2 !rounded-xl p-3 text-inherit no-underline ${i === 2 ? 'hidden stack:flex' : ''}`}
                >
                  <Photo
                    tone={NEXT_TONES[i % NEXT_TONES.length]}
                    className="h-[130px] !min-h-0 !rounded-card stack:h-[180px]"
                    img={related.coverImage ? { src: related.coverImage, alt: '' } : undefined}
                  />
                  <b className="px-1 pb-[6px] font-display text-[20px] font-black leading-[1.1]">{related.title}</b>
                </a>
              ))}
            </div>
          </KitSection>
        )}
      </div>
    </DsNavHost>
  );
}
