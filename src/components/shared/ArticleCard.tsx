import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TranslatedText from './TranslatedText';
import type { BlogPost } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { contentPath } from '../../lib/contentPath';
import { categoryToPole } from '../../lib/blogCategories';
import { truncate } from '../../lib/utils';
import { universeThemes } from '../../lib/sectionThemes';
import { useFormat } from '../../hooks/useFormat';

const theme = universeThemes.blog;

interface ArticleCardProps {
  post: BlogPost;
  /** Masque l'extrait pour une carte plus compacte (ex. articles similaires). */
  compact?: boolean;
}

/**
 * Carte d'article éditoriale réutilisée par la grille du blog et les articles
 * similaires. Image avec overlay « Lire Plus » au survol, eyebrow pôle + temps
 * de lecture, titre, extrait, date.
 */
export default function ArticleCard({ post, compact = false }: ArticleCardProps) {
  const { t } = useTranslation('shared');
  const { formatDate } = useFormat();
  const { language } = useLanguage();
  return (
    <Link
      to={contentPath('blog', post, language)}
      className="group flex flex-col hover:-translate-y-1 transition-transform duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[16/9] mb-5">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          width={400}
          height={225}
        />
        {/* Overlay survol « Lire Plus » */}
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-flex items-center gap-2 text-white text-sm font-bold tracking-wide">
            {t('articleCard.readMore')} <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
      <p className={`text-xs font-bold tracking-[0.25em] uppercase ${theme.eyebrow} mb-2`}>
        <TranslatedText text={categoryToPole(post.category)} />
        {' · '}
        <span className="font-normal normal-case tracking-normal text-neutral-400">
          {t('articleCard.readTime', { count: post.readTime })}
          {post.views !== undefined && post.views > 0 && (
            <> · {t('articleCard.views', { count: post.views })}</>
          )}
        </span>
      </p>
      <TranslatedText
        as="h3"
        text={post.title}
        className={`text-lg font-black tracking-tight text-neutral-900 dark:text-white mb-2 leading-snug ${theme.titleHover} transition-colors flex-1`}
      />
      {!compact && (
        <TranslatedText
          as="p"
          text={truncate(post.excerpt, 100)}
          className="text-sm text-neutral-500 dark:text-neutral-400 mb-3"
        />
      )}
      <p className="text-xs text-neutral-400">{formatDate(post.publishedAt)}</p>
    </Link>
  );
}
