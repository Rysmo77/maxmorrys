import { useEffect, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  buildCanonical,
} from './seo-config';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedPath, ogLocale } from '../../i18n/routing';
import { toLogicalPath } from '../../lib/hosts';

/**
 * Balises de tête injectées par le Worker (HTML serveur) que `SEOHead` réémet lui-même.
 *
 * Helmet ne gère QUE ses propres balises (`data-rh`) : celles du pré-rendu restaient en
 * place, en tête du `<head>`, et survivaient à toute navigation interne. Après un passage
 * accueil → `/en/about`, le premier canonical lu pointait encore vers l'accueil et la
 * description restait en français (audit du 29/10/2026, registre #2).
 */
const SERVER_HEAD_SELECTOR = [
  'meta[name="description"]',
  'meta[name="robots"]',
  'link[rel="canonical"]',
  'link[rel="alternate"][hreflang]',
  'meta[property^="og:"]',
  'meta[property^="article:"]',
  'meta[name^="twitter:"]',
]
  .map((sel) => `head ${sel}:not([data-rh])`)
  .join(', ');

let serverHeadPurged = false;

/** Retire une fois pour toutes les balises du pré-rendu : Helmet prend le relais. */
function purgeServerHead(): void {
  if (serverHeadPurged || typeof document === 'undefined') return;
  serverHeadPurged = true;
  document.querySelectorAll(SERVER_HEAD_SELECTOR).forEach((el) => el.remove());
}

/**
 * Titre complet : suffixe de marque, sauf si le titre la porte déjà.
 * Plusieurs titres i18n finissent par « | Max-Morrys » (ou « | Max-Morrys Edu ») :
 * le suffixe systématique produisait « … | Max-Morrys | Max-Morrys ».
 */
function buildFullTitle(title: string, isHomePage = false): string {
  if (isHomePage || title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}

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
  /** Chemins alternés explicites par langue (pour les contenus à slug localisé). */
  frPath?: string;
  enPath?: string;
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
  frPath,
  enPath,
  children,
}: SEOHeadProps) {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  /* Le chemin LOGIQUE de la page servie : sur l'Edu, `/` est `/apprendre` — et c'est lui que
     `buildCanonical` sait placer sur son hôte. */
  const basePath = toLogicalPath(pathname);
  const fullTitle = buildFullTitle(title, isHomePage);
  useEffect(purgeServerHead, []);
  const canonicalUrl = canonical || buildCanonical(localizedPath(basePath, language));
  // Alternates hreflang : utiliser les chemins explicites (slug localisé) si fournis.
  const frUrl = buildCanonical(frPath ?? localizedPath(basePath, 'fr'));
  const enUrl = buildCanonical(enPath ?? localizedPath(basePath, 'en'));
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
  const resolvedOgImageAlt = ogImageAlt || resolvedOgTitle;
  const resolvedTwitterTitle = twitterTitle || resolvedOgTitle;
  const resolvedTwitterDescription = twitterDescription || resolvedOgDescription;
  const resolvedTwitterImage = twitterImage || resolvedOgImage;

  return (
    <Helmet>
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternances de langue (SEO multilingue) */}
      <link rel="alternate" hrefLang="fr" href={frUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={frUrl} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedOgImage} />
      {/*
        NI DIMENSIONS NI TYPE CODÉS EN DUR.

        Ces trois lignes annonçaient `1200×630` et `image/jpeg` pour toute image, quelle
        qu'elle soit. Aucune des images du site ne correspond : l'image par défaut fait
        1500×1000, les couvertures d'article sont des PNG de 1408×768, les pochettes de
        podcast des carrés de 640×640 (mesuré le 03/09/2026). Un consommateur qui lit ces
        nombres recadre au format annoncé.

        Ces balises-ci ne sont vues d'aucun crawler social — ils n'exécutent pas React, et
        c'est le Worker qui produit la sortie qu'ils lisent. Elles sont corrigées quand même :
        c'est ce fichier qu'on recopie en croyant tenir la référence.
      */}
      <meta property="og:image:alt" content={resolvedOgImageAlt} />
      <meta property="og:locale" content={ogLocale(language)} />
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
