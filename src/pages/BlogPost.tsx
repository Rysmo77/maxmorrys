import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Calendar, Share2, Linkedin, Copy, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import NewsletterForm from '../components/shared/NewsletterForm';
import FormationCTA from '../components/shared/FormationCTA';
import { getPostBySlug, getPublishedPosts } from '../lib/firestore';
import { formatDate, markdownToHtml } from '../lib/utils';
import type { BlogPost as BlogPostType } from '../types';
import { trackViewContent, trackShareContent } from '../lib/meta-pixel';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';

export default function BlogPost() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState<BlogPostType | null | undefined>(undefined);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug).then((data) => {
      setPost(data);
      if (data) {
        trackViewContent({
          content_type: 'article',
          content_ids: [data.id],
          content_name: data.title,
        });
        getPublishedPosts().then((all) => {
          setRelatedPosts(all.filter((p) => p.id !== data.id && p.category === data.category).slice(0, 3));
        }).catch(() => null);
      }
    }).catch(() => setPost(null));
  }, [slug]);

  if (post === undefined) {
    return (
      <div className="pt-32 pb-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Article introuvable</h1>
        <Link to="/blog" className="text-brand-600 dark:text-brand-400 hover:underline">Retour au blog</Link>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackShareContent('article', post.id, 'copy_link');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.excerpt, url: window.location.href });
      trackShareContent('article', post.id, 'native_share');
    }
  };


  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        ogType="article"
        ogTitle={post.ogTitle}
        ogDescription={post.ogDescription}
        ogImage={post.ogImage || post.coverImage}
        twitterTitle={post.twitterTitle}
        twitterDescription={post.twitterDescription}
        twitterImage={post.twitterImage}
        canonical={post.canonicalUrl}
        noIndex={post.noIndex}
        publishedAt={post.publishedAt}
        author={post.author}
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt,
        author: { '@type': 'Person', name: post.author || 'Max-Morrys' },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-default.jpg` },
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

      {/* ── HERO article ── */}
      <div className="pt-28 pb-12 lg:pt-36 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>

          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
            {post.category}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-8 leading-[1.05]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                <span className="text-xs font-black text-brand-600 dark:text-brand-400">M</span>
              </div>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{post.author}</span>
            </div>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.publishedAt)}</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime} min de lecture</span>
          </div>
        </div>
      </div>

      {/* Image hero full-width */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-0 pt-8">
        <div className="aspect-[16/7] rounded-2xl overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" width={1200} height={525} />
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {post.excerpt && (
          <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed border-l-4 border-brand-500 pl-5 mb-10 italic">
            {post.excerpt}
          </p>
        )}
        <article
          className="prose-article prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none mb-12 prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-img:shadow-soft prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-neutral-700 dark:prose-blockquote:text-neutral-200"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
          {post.tags.map((tag) => (
            <span key={tag} className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>

        {/* Partage */}
        <div className="flex items-center gap-3 py-5 border-y border-neutral-100 dark:border-neutral-800 mb-12">
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mr-1">Partager :</span>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <Share2 className="w-4 h-4" /> Partager
          </button>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackShareContent('article', post.id, 'linkedin')}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Linkedin className="w-4 h-4" /> LinkedIn
          </a>
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copie !' : 'Copier le lien'}
          </button>
        </div>

        {/* Formation CTA */}
        <div className="mb-12">
          <FormationCTA category={post.category} tags={post.tags} />
        </div>

        {/* Newsletter */}
        <div className="mb-16">
          <NewsletterForm variant="card" source="blog-post" />
        </div>

        {/* Articles lies */}
        {relatedPosts.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
              A LIRE AUSSI
            </p>
            <h3 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">Articles similaires</h3>
            <div className="space-y-4">
              {relatedPosts.map((rp, i) => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group flex items-center gap-5 py-5 border-b border-neutral-100 dark:border-neutral-800 hover:pl-2 transition-all duration-200">
                  <span className="text-sm font-black text-neutral-300 dark:text-neutral-700 w-6 shrink-0">#{i + 1}</span>
                  <img src={rp.coverImage} alt={rp.title} className="w-16 h-16 rounded-xl object-cover shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-1">{rp.category}</p>
                    <p className="font-bold text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">{rp.title}</p>
                    <p className="text-xs text-neutral-400 mt-1">{rp.readTime} min de lecture</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CTA croisé → Formations ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Je te forme
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Des formations pratiques pour aller plus loin et transformer vos connaissances en compétences réelles.
          </p>
          <Link to="/formations" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Voir les formations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
