import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Avatar, Breadcrumb, Button, GlassPanel, Icon, ReadingBar, Skeleton, TerritoryCard, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { LinkedInIcon, XIcon } from '../components/shared/SocialIcons';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow, useReadingProgress } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { getPostBySlug, getPublishedPosts, incrementBlogViews } from '../lib/firestore';
import { markdownToHtml } from '../lib/markdown';
import { queryClient, queryKeys } from '../lib/queryClient';
import { useFormat } from '../hooks/useFormat';
import { categoryToPole } from '../lib/blogCategories';
import type { BlogPost as BlogPostType } from '../types';
import { trackViewItem, trackShare } from '../lib/tracking';
import { useContentEngagement } from '../hooks/useContentEngagement';
import SEOHead from '../components/seo/SEOHead';
import { useLanguage } from '../contexts/LanguageContext';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../components/seo/seo-config';



export default function BlogPost() {
  const { t } = useTranslation('blog');
  const { formatDate } = useFormat();
  const { slug } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState<BlogPostType | null | undefined>(undefined);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug, language).then((data) => {
      setPost(data);
      if (data) {
        trackViewItem({
          id: data.id,
          name: data.title,
          category: data.category,
          content_type: 'article',
        });
        const viewKey = `blog-viewed-${data.id}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(viewKey)) {
          incrementBlogViews(data.id)
            .then(() => sessionStorage.setItem(viewKey, '1'))
            .catch(() => null);
        }
        queryClient
          .fetchQuery({ queryKey: queryKeys.blogPosts, queryFn: () => getPublishedPosts() })
          .then((all) => {
            setRelatedPosts(all.filter((p) => p.id !== data.id && p.category === data.category).slice(0, 3));
          })
          .catch(() => null);
      }
    }).catch(() => setPost(null));
  }, [slug, language]);

  useContentEngagement({
    contentId: post?.id,
    type: 'article',
    slug: post?.slug ?? '',
    title: post?.title ?? '',
    category: post?.category ?? 'général',
  });

  // Traduction du contenu dynamique (FR -> EN selon langue active). Hooks au top-level,
  // avant les retours anticipés, pour respecter les règles des hooks.
  const translatedTitle = useTranslatedText(post?.title);
  const translatedExcerpt = useTranslatedText(post?.excerpt);
  const translatedPole = useTranslatedText(post ? categoryToPole(post.category) : '');
  const translatedBody = useTranslatedText(post?.content);
  const seoTitle = useTranslatedText(post?.metaTitle || post?.title);
  const seoDescription = useTranslatedText(post?.metaDescription) || translatedExcerpt;

  const path = useLocalizedPath();
  const progress = useReadingProgress();

  /*
   * Le chargement est un SQUELETTE À LA FORME du contenu attendu, pour que rien ne saute
   * quand il arrive. Jamais un rond qui tourne : il ne dit ni ce qui se passe, ni combien de
   * temps. La page portait un `Loader2 animate-spin` centré ; il n'annonçait rien.
   */
  if (post === undefined) {
    return (
      <PageSite>
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-4">
            <Skeleton width={220} height={12} label={t('post.loading')} />
            <Skeleton height={44} width="82%" />
            <Skeleton height={44} width="58%" />
            <Skeleton height={40} radius="var(--r-m)" style={{ marginTop: '12px' }} />
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={14} width={i % 3 === 2 ? '72%' : '100%'} />)}
          </div>
          <Skeleton height={220} radius="var(--r-l)" />
        </div>
      </PageSite>
    );
  }

  if (!post) {
    return (
      <PageSite>
        <SiteDisplay lines={[t('post.notFoundTitle')]} size={34} />
        <p className="mt-4">
          <Button href={path('/blog')} tone="quiet" size="sm" fullWidth={false}>{t('post.notFoundLink')}</Button>
        </p>
      </PageSite>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackShare('copy_link', 'article', post.id);
  };

  // Navigation SPA pour les liens internes insérés dans le contenu HTML.
  const handleContentClick = (e: React.MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    }
  };

  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : `${SITE_URL}/blog/${post.slug}`);
  const shareBtn =
    'w-10 h-10 rounded-m border border-[color:var(--line)] flex items-center justify-center text-ink-2 transition';

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
        author: { '@type': 'Person', name: 'Max-Morrys' },
        publisher: { '@type': 'Organization', name: SITE_NAME },
      }} />

      {/*
        LA BARRE DE LECTURE. C'est la seule animation de `width` du produit, et l'exception
        est écrite dans le système : bornée à un élément de 3 px de haut, sans enfant. Elle
        porte `prog-fill`, le nom sous lequel le vérificateur la reconnaît.
      */}
      <ReadingBar value={progress} label={translatedTitle || post.title} />

      <PageSite>
        <Breadcrumb
          label={t('index.eyebrow')}
          items={[
            { label: t('index.eyebrow'), href: path('/blog') },
            { label: translatedPole || categoryToPole(post.category) },
          ]}
        />

        {/*
          LA GRILLE DE LECTURE — colonne de prose, puis 300 px de colonne latérale.
          La prose porte `.mm-prose`, donc 68 caractères par ligne, quelle que soit la place :
          les pixels gagnés au-delà partent à la marge, jamais à la longueur de ligne.
        */}
        <div className="mt-4 grid items-start gap-12 lg:grid-cols-[1fr_300px]">
          <article>
            <SiteDisplay wrap lines={[translatedTitle || post.title]} size={46} style={{ maxWidth: '20ch' }} />

            <div className="rv mt-[18px] flex max-w-prose flex-wrap items-center justify-between gap-5" style={{ ['--i' as string]: 3 }}>
              <div className="flex items-center gap-3">
                <Avatar initials="M" size={40} />
                <div>
                  <p className="m-0 text-[13.5px] font-semibold text-ink">Max-Morrys</p>
                  <p className="mm-num m-0 text-[11.5px] text-ink-2">
                    {formatDate(post.publishedAt)}{post.readTime ? ` · ${post.readTime}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <a className={shareBtn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                   target="_blank" rel="noreferrer" aria-label="LinkedIn"
                   onClick={() => trackShare('linkedin', 'article', post.id)}>
                  <LinkedInIcon className="h-4 w-4" />
                </a>
                <a className={shareBtn} href={`https://twitter.com/intent/tweet?url=${shareUrl}`}
                   target="_blank" rel="noreferrer" aria-label="X"
                   onClick={() => trackShare('twitter', 'article', post.id)}>
                  <XIcon className="h-4 w-4" />
                </a>
                <button type="button" className={shareBtn} onClick={handleCopy}
                        aria-label={copied ? t('article.copied') : t('article.copy')}>
                  {copied ? <Icon name="check" size={16} /> : <Icon name="copy" size={16} />}
                </button>
              </div>
            </div>

            {/*
              LE BANDEAU DE TRADUCTION, obligatoire en tête de tout article anglais — jamais
              en pied, où un avertissement n'avertit plus. La traduction est générée au
              pré-rendu et mise en cache : une correction du français n'atteint cette page
              qu'à l'expiration du cache, et il n'y a pas d'invalidation manuelle.
            */}
            {language === 'en' && (
              <TranslationNotice
                date={formatDate(post.updatedAt ?? post.publishedAt)}
                href={`/blog/${post.slug}`}
                originalLabel={t('article.translatedOriginal')}
                style={{ marginTop: '18px', maxWidth: 'var(--measure-prose)' }}
              />
            )}

            <div
              className="rv mm-prose prose-article mt-6"
              style={{ ['--i' as string]: 4 }}
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(translatedBody || post.content) }}
            />
          </article>

          {/* La colonne latérale colle sous le chrome, pas sous le haut de la fenêtre. */}
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] grid gap-[14px]">
            <GlassPanel level="hero" padding={22} className="rv" style={{ ['--i' as string]: 5 }}>
              <SiteEyebrow style={{ marginBottom: '8px' }}>{t('article.gateTitle')}</SiteEyebrow>
              <p className="m-0 mb-4 text-[14px] leading-[1.55] text-ink-2">{t('article.gateBody')}</p>
              <Button href={path('/formations')} tone="forme">{t('article.gateCta')}</Button>
              {/* La sortie honnête : on ne ferme pas la porte du gratuit derrière le payant. */}
              <p className="mt-3 mb-0 text-center text-small leading-[1.5] text-ink-2">{t('article.gateAlt')}</p>
            </GlassPanel>
          </aside>
        </div>
      </PageSite>

      {relatedPosts.length > 0 && (
        <SiteBand>
          <SiteDisplay as="h2" lines={t('article.nextTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedPosts.slice(0, 3).map((related, i) => (
              <div key={related.id} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <TerritoryCard
                  layout="plain"
                  territory={(['informe', 'rose', 'forme'] as const)[i % 3]}
                  href={path(`/blog/${related.slug}`)}
                  padding={22}
                  meta={`${formatDate(related.publishedAt)}${related.readTime ? ` · ${related.readTime}` : ''}`}
                  title={related.title}
                  titleSize={19}
                />
              </div>
            ))}
          </div>
        </SiteBand>
      )}

    </DsNavHost>
  );
}
