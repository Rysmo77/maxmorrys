import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Linkedin, Copy, Check, Loader2, Twitter, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import LocalizedLink from '../components/shared/LocalizedLink';
import NewsletterForm from '../components/shared/NewsletterForm';
import FormationCTA from '../components/shared/FormationCTA';
import ArticleCard from '../components/shared/ArticleCard';
import TranslatedText from '../components/shared/TranslatedText';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { getPostBySlug, getPublishedPosts, incrementBlogViews } from '../lib/firestore';
import { markdownToHtml } from '../lib/utils';
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
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.blog;

const viewportOnce = { once: true, amount: 0.2 } as const;

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
        getPublishedPosts().then((all) => {
          setRelatedPosts(all.filter((p) => p.id !== data.id && p.category === data.category).slice(0, 3));
        }).catch(() => null);
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
  const seoDescription = useTranslatedText(post?.metaDescription || post?.excerpt);

  if (post === undefined) {
    return (
      <div className="pt-32 pb-20 flex justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">{t('post.notFoundTitle')}</h1>
        <LocalizedLink to="/blog" className={`${theme.accentText} hover:underline`}>{t('post.notFoundLink')}</LocalizedLink>
      </div>
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
  const shareBtn = 'w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:border-coral-400 hover:text-coral-600 dark:hover:text-coral-400 transition-colors';

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogType="article"
        ogTitle={post.ogTitle}
        ogDescription={post.ogDescription}
        ogImage={post.ogImage || post.coverImage}
        twitterTitle={post.twitterTitle}
        twitterDescription={post.twitterDescription}
        twitterImage={post.twitterImage}
        canonical={post.canonicalUrl}
        frPath={contentPath('blog', post, 'fr')}
        enPath={contentPath('blog', post, 'en')}
        noIndex={post.noIndex}
        publishedAt={post.publishedAt}
        modifiedAt={post.updatedAt}
        author={post.author}
      >
        <link rel="preload" as="image" href={post.coverImage} />
      </SEOHead>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: { '@type': 'Person', name: post.author || 'Max-Morrys' },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
        articleSection: post.category,
        keywords: post.tags?.join(', '),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
        ],
      }} />

      {/* ── Fil d'ariane + retour ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32">
        <Breadcrumbs
          items={[
            { label: t('post.breadcrumbHome'), href: '/' },
            { label: t('post.breadcrumbBlog'), href: '/blog' },
            { label: translatedTitle },
          ]}
        />
        <LocalizedLink to="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-coral-600 dark:hover:text-coral-400 mt-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('post.backToBlog')}
        </LocalizedLink>
      </div>

      {/* ── Image hero pleine largeur ── */}
      <motion.div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="aspect-[16/8] rounded-2xl overflow-hidden">
          <img src={post.coverImage} alt={translatedTitle} className="w-full h-full object-cover" width={1200} height={600} />
        </div>
      </motion.div>

      {/* ── Méta auteur/date + partage, puis titre ── */}
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem} className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">{t('post.writtenBy')}</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-coral-100 dark:bg-coral-900/40 flex items-center justify-center">
                  <span className="text-xs font-black text-coral-600 dark:text-coral-400">
                    {(post.author || 'M').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{post.author}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">{t('post.publishedOn')}</p>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 flex-wrap">
                {formatDate(post.publishedAt)}
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span className="flex items-center gap-1 font-normal text-neutral-500 dark:text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />{t('post.readTime', { count: post.readTime })}
                </span>
                {post.views !== undefined && post.views > 0 && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <span className="flex items-center gap-1 font-normal text-neutral-500 dark:text-neutral-400">
                      <Eye className="w-3.5 h-3.5" />{t('post.viewsCount', { count: post.views, formattedCount: post.views.toLocaleString() })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${encodeURIComponent(post.title)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => trackShare('twitter', 'article', post.id)}
              aria-label={t('post.shareTwitter')}
              className={shareBtn}
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => trackShare('linkedin', 'article', post.id)}
              aria-label={t('post.shareLinkedin')}
              className={shareBtn}
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <button onClick={handleCopy} aria-label={t('post.copyLink')} className={shareBtn}>
              {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        <motion.p variants={staggerItem} className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mt-8 mb-5`}>
          {translatedPole}
        </motion.p>
        <motion.h1 variants={staggerItem} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05]">
          {translatedTitle}
        </motion.h1>
      </motion.div>

      {/* ── CONTENU ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {post.excerpt && (
          <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed border-l-4 border-coral-500 pl-5 mb-10 italic">
            {translatedExcerpt}
          </p>
        )}
        <article
          onClick={handleContentClick}
          className="prose-article prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none mb-12 prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-a:text-coral-600 dark:prose-a:text-coral-400 hover:prose-a:text-coral-700 prose-img:shadow-soft prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-neutral-700 dark:prose-blockquote:text-neutral-200"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(translatedBody) }}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-12">
          {post.tags.map((tag) => (
            <TranslatedText
              key={tag}
              as="span"
              text={tag}
              className={`px-4 py-1.5 ${theme.softBadge} text-xs font-semibold rounded-full uppercase tracking-wider`}
            />
          ))}
        </div>

        {/* Formation CTA */}
        <div className="mb-12">
          <FormationCTA category={post.category} tags={post.tags} />
        </div>

        {/* Newsletter */}
        <div className="mb-4">
          <NewsletterForm variant="card" source="blog-post" />
        </div>
      </div>

      {/* ── Articles similaires ── */}
      {relatedPosts.length > 0 && (
        <motion.section
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-3`}>
            {t('post.relatedEyebrow')}
          </p>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
            {t('post.relatedTitle')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {relatedPosts.map((rp) => (
              <ArticleCard key={rp.id} post={rp} compact />
            ))}
          </div>
        </motion.section>
      )}

      {/* ── CTA croisé → Formations ── */}
      <motion.section
        className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-4`}>
            {t('post.crossEyebrow')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            {t('post.crossTitle')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            {t('post.crossDescription')}
          </p>
          <LocalizedLink to="/formations" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide`}>
            {t('post.crossCta')} <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>
      </motion.section>
    </div>
  );
}
