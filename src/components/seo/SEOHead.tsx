import type { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  buildCanonical,
} from './seo-config';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  isHomePage?: boolean;
  children?: ReactNode;
}

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogType = 'website',
  ogTitle,
  ogDescription,
  ogImage,
  ogImageAlt,
  twitterTitle,
  twitterDescription,
  twitterImage,
  noIndex = false,
  publishedAt,
  modifiedAt,
  author,
  isHomePage = false,
  children,
}: SEOHeadProps) {
  const { pathname } = useLocation();
  const fullTitle = isHomePage ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || buildCanonical(pathname);
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
  const resolvedOgImageAlt = ogImageAlt || resolvedOgTitle;
  const resolvedTwitterTitle = twitterTitle || resolvedOgTitle;
  const resolvedTwitterDescription = twitterDescription || resolvedOgDescription;
  const resolvedTwitterImage = twitterImage || resolvedOgImage;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={resolvedOgImageAlt} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Article-specific OG */}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={resolvedTwitterTitle} />
      <meta name="twitter:description" content={resolvedTwitterDescription} />
      <meta name="twitter:image" content={resolvedTwitterImage} />
      <meta name="twitter:image:alt" content={resolvedOgImageAlt} />

      {children}
    </Helmet>
  );
}
