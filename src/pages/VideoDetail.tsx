import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Eye, Calendar, ArrowLeft, Clock, Loader2, TrendingUp } from 'lucide-react';
import { getVideoBySlug, getPublishedVideos } from '../lib/firestore';
import FormationCTA from '../components/shared/FormationCTA';
import VideoCard from '../components/shared/VideoCard';
import { formatDate, markdownToHtml } from '../lib/utils';
import type { Video } from '../types';
import { trackViewItem, trackVideoPlay } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.videos;

const viewportOnce = { once: true, amount: 0.2 } as const;

function resolveVideoEmbed(url: string): { type: 'iframe' | 'native'; src: string } {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com') || url.includes('vimeo.com/video')) {
    return { type: 'iframe', src: url };
  }
  return { type: 'native', src: url };
}

export default function VideoDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<Video | null | undefined>(undefined);
  const [others, setOthers] = useState<Video[]>([]);

  useEffect(() => {
    if (!slug) return;
    getVideoBySlug(slug).then((data) => {
      setVideo(data);
      if (data) {
        trackViewItem({ id: data.id, name: data.title, category: data.category, content_type: 'video' });
        trackVideoPlay(data.id, data.title);
        getPublishedVideos().then((all) => setOthers(all.filter((v) => v.id !== data.id).slice(0, 10))).catch(() => null);
      }
    }).catch(() => setVideo(null));
  }, [slug]);

  if (video === undefined) {
    return <div className="pt-32 pb-20 flex justify-center"><Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} /></div>;
  }

  if (!video) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Vidéo introuvable</h1>
        <Link to="/videos" className={`${theme.accentText} hover:underline`}>Retour aux vidéos</Link>
      </div>
    );
  }

  return (
    <div>
      <SEOHead
        title={video.title}
        description={video.description}
        ogImage={video.thumbnailUrl}
      >
        {video.thumbnailUrl && <link rel="preload" as="image" href={video.thumbnailUrl} />}
      </SEOHead>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        uploadDate: video.publishedAt,
        duration: video.duration,
        embedUrl: video.videoUrl,
        url: `${SITE_URL}/videos/${video.slug}`,
        ...(video.views > 0 && {
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/WatchAction',
            userInteractionCount: video.views,
          },
        }),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Vidéos', item: `${SITE_URL}/videos` },
          { '@type': 'ListItem', position: 3, name: video.title, item: `${SITE_URL}/videos/${video.slug}` },
        ],
      }} />

      {/* ── HERO ── */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 bg-neutral-50 dark:bg-neutral-900">
        <motion.div
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'Accueil', href: '/' },
                { label: 'Vidéos', href: '/videos' },
                { label: video.title },
              ]}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <Link
              to="/videos"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Toutes les vidéos
            </Link>
          </motion.div>

          <motion.p variants={staggerItem} className={`text-xs font-bold tracking-[0.25em] uppercase ${theme.eyebrow} mb-4`}>
            {video.category}
          </motion.p>

          <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05] mb-6">
            {video.title}
          </motion.h1>

          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 pb-10">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {video.views.toLocaleString()} vues
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {video.duration}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(video.publishedAt)}
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── PLAYER + SIDEBAR ── */}
      <motion.div
        className="bg-white dark:bg-neutral-950 pb-24"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="grid lg:grid-cols-3 gap-10">

            {/* Player */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-neutral-900">
                {video.videoUrl ? (() => {
                  const { type, src } = resolveVideoEmbed(video.videoUrl);
                  return type === 'iframe' ? (
                    <iframe
                      src={src}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      title={video.title}
                    />
                  ) : (
                    <video
                      src={src}
                      controls
                      className="w-full h-full object-contain bg-black"
                      poster={video.thumbnailUrl}
                    />
                  );
                })() : (
                  <>
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white space-y-3">
                        <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mx-auto">
                          <Play className="w-8 h-8 text-neutral-900 ml-1" fill="currentColor" />
                        </div>
                        <p className="text-sm font-medium">Lecteur vidéo disponible prochainement</p>
                      </div>
                    </div>
                  </>
                )}
                {!video.videoUrl && (
                  <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-full">
                    {video.duration}
                  </span>
                )}
              </div>

              {video.description && (
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
                  <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-3">
                    Description
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-img:shadow-soft prose-blockquote:not-italic prose-blockquote:font-medium"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(video.description) }}
                  />
                </div>
              )}
            </div>

            {/* Formation CTA */}
            <div className="mb-8">
              <FormationCTA category={video.category} />
            </div>

            {/* Autres vidéos */}
            <div>
              <div className="relative overflow-hidden rounded-2xl bg-neutral-900 p-5 mb-4">
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-red-600/25 blur-[50px]" />
                <div className="relative z-10 flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-red-400" />
                  <h3 className="text-lg font-black tracking-tight text-white">Autres vidéos</h3>
                </div>
              </div>
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {others.slice(0, 4).map((v) => (
                  <motion.div key={v.id} variants={staggerItem}>
                  <Link
                    to={`/videos/${v.slug}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
                  >
                    <div className="relative shrink-0">
                      {v.thumbnailUrl && (
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-20 h-12 rounded-lg object-cover"
                          loading="lazy"
                        />
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded">
                        {v.duration}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold text-neutral-800 dark:text-neutral-200 ${theme.titleHover} transition-colors leading-snug line-clamp-2`}>
                        {v.title}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {v.views.toLocaleString()} vues
                      </p>
                    </div>
                  </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Vidéos à voir ensuite ── */}
      {others.length > 4 && (
        <motion.section
          className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 py-16"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
              Vidéos à voir ensuite
            </h2>
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {others.slice(4, 10).map((v) => (
                <motion.div key={v.id} variants={staggerItem}>
                  <VideoCard video={v} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
