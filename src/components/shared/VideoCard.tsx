import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Eye } from 'lucide-react';
import TranslatedText from './TranslatedText';
import type { Video } from '../../types';
import { universeThemes } from '../../lib/sectionThemes';
import { useFormat } from '../../hooks/useFormat';
import { useLanguage } from '../../contexts/LanguageContext';
import { contentPath } from '../../lib/contentPath';

const theme = universeThemes.videos;

interface VideoCardProps {
  video: Video;
  /** Réduit la taille du titre pour les contextes denses (grilles secondaires). */
  compact?: boolean;
}

/**
 * Carte vidéo éditoriale réutilisée par les grilles « Vidéos populaires »,
 * « Toutes les vidéos » et la page de détail. Vignette 16/9 avec overlay play
 * au survol, eyebrow catégorie + vues, titre, date.
 */
export default function VideoCard({ video, compact = false }: VideoCardProps) {
  const { t } = useTranslation('shared');
  const { formatDate } = useFormat();
  const { language } = useLanguage();
  return (
    <Link
      to={contentPath('videos', video, language)}
      className="group flex flex-col bg-neutral-50 dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-900 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          width={480}
          height={270}
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-neutral-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
        <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 text-white text-xs font-bold rounded-full">
          {video.duration}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className={`text-xs font-bold tracking-widest uppercase ${theme.eyebrow} mb-2`}>
          <TranslatedText text={video.category} />
          {' · '}
          <span className="inline-flex items-center gap-1 font-normal normal-case tracking-normal text-neutral-400">
            <Eye className="w-3 h-3" />{t('videoCard.views', { count: video.views })}
          </span>
        </p>
        <TranslatedText
          text={video.title}
          as="h3"
          className={`font-black text-neutral-900 dark:text-white ${theme.titleHover} transition-colors leading-snug mb-3 flex-1 ${
            compact ? 'text-sm' : 'text-base lg:text-lg'
          }`}
        />
        <p className="text-xs text-neutral-400 mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800">
          {formatDate(video.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
