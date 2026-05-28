import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Headphones, Clock, Calendar, ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import { getPodcastBySlug, getPublishedPodcasts } from '../lib/firestore';
import FormationCTA from '../components/shared/FormationCTA';
import { formatDate, markdownToHtml } from '../lib/utils';
import type { Podcast } from '../types';
import { trackViewItem, trackPodcastPlay } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.podcasts;

const viewportOnce = { once: true, amount: 0.2 } as const;

function resolveAudioEmbed(url: string): { type: 'iframe' | 'native'; src: string } {
  const spotifyMatch = url.match(/open\.spotify\.com\/(episode|show|track)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return { type: 'iframe', src: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}` };
  if (url.includes('/embed/') || url.includes('anchor.fm') || url.includes('podcasters.spotify.com')) {
    return { type: 'iframe', src: url };
  }
  return { type: 'native', src: url };
}

export default function PodcastDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [podcast, setPodcast] = useState<Podcast | null | undefined>(undefined);
  const [others, setOthers] = useState<Podcast[]>([]);

  useEffect(() => {
    if (!slug) return;
    getPodcastBySlug(slug).then((data) => {
      setPodcast(data);
      if (data) {
        trackViewItem({ id: data.id, name: data.title, category: data.category, content_type: 'podcast' });
        trackPodcastPlay(data.id, data.title);
        getPublishedPodcasts().then((all) => setOthers(all.filter((p) => p.id !== data.id).slice(0, 4))).catch(() => null);
      }
    }).catch(() => setPodcast(null));
  }, [slug]);

  if (podcast === undefined) {
    return <div className="pt-32 pb-20 flex justify-center"><Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} /></div>;
  }

  if (!podcast) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Épisode introuvable</h1>
        <Link to="/podcasts" className={`${theme.accentText} hover:underline`}>Retour aux podcasts</Link>
      </div>
    );
  }

  return (
    <div>
      <SEOHead
        title={podcast.title}
        description={podcast.description}
        ogImage={podcast.coverImage}
      >
        {podcast.coverImage && <link rel="preload" as="image" href={podcast.coverImage} />}
      </SEOHead>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'PodcastEpisode',
        name: podcast.title,
        description: podcast.description,
        datePublished: podcast.publishedAt,
        timeRequired: podcast.duration,
        image: podcast.coverImage,
        url: `${SITE_URL}/podcasts/${podcast.slug}`,
        partOfSeries: {
          '@type': 'PodcastSeries',
          name: 'Le Podcast du Marketing — Max-Morrys',
          url: `${SITE_URL}/podcasts`,
        },
        ...(podcast.audioUrl && {
          associatedMedia: {
            '@type': 'MediaObject',
            contentUrl: podcast.audioUrl,
          },
        }),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Podcasts', item: `${SITE_URL}/podcasts` },
          { '@type': 'ListItem', position: 3, name: podcast.title, item: `${SITE_URL}/podcasts/${podcast.slug}` },
        ],
      }} />

      {/* ── HERO ── */}
      <section className={`relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-20 ${theme.sectionBg}`}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-plum-200/60 dark:bg-plum-500/10 pointer-events-none" />
        <motion.div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'Accueil', href: '/' },
                { label: 'Podcasts', href: '/podcasts' },
                { label: podcast.title },
              ]}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <Link
              to="/podcasts"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-plum-600 dark:hover:text-plum-400 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les épisodes
            </Link>
          </motion.div>

          <motion.div variants={staggerItem} className="flex items-center gap-2 mb-5">
            <span className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
              PODCAST
            </span>
            {podcast.category && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  {podcast.category}
                </span>
              </>
            )}
          </motion.div>

          <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.1] mb-6">
            {podcast.title}
          </motion.h1>

          <motion.div
            variants={staggerItem}
            className="prose dark:prose-invert max-w-none mb-8 prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-blockquote:not-italic prose-blockquote:font-medium"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(podcast.description) }}
          />

          <motion.div variants={staggerItem} className="flex items-center gap-5 text-sm text-neutral-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {podcast.duration}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(podcast.publishedAt)}
            </span>
            {podcast.popularity !== undefined && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1.5" title="Score de popularité Spotify (0–100)">
                  <TrendingUp className="w-4 h-4" />
                  Popularité {podcast.popularity}/100
                </span>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ── PLAYER ── */}
      <motion.div
        className="bg-white dark:bg-neutral-950 pb-24"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="grid lg:grid-cols-3 gap-10">

            {/* Cover + player */}
            <div className="lg:col-span-2 space-y-6">
              {podcast.audioUrl ? (() => {
                const { type, src } = resolveAudioEmbed(podcast.audioUrl);
                return type === 'iframe' ? (
                  <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                    <iframe
                      src={src}
                      className="w-full"
                      height="152"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title={podcast.title}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6">
                    <div className="flex items-center gap-4 mb-5">
                      {podcast.coverImage && (
                        <img src={podcast.coverImage} alt={podcast.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-white">{podcast.title}</p>
                        <p className="text-sm text-neutral-500">{podcast.duration}</p>
                      </div>
                    </div>
                    <audio controls className="w-full" src={src}>
                      Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                  </div>
                );
              })() : (
                <div className="rounded-2xl overflow-hidden aspect-video relative">
                  <img
                    src={podcast.coverImage}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white space-y-3">
                      <div className="w-16 h-16 rounded-full bg-plum-600 flex items-center justify-center mx-auto">
                        <Headphones className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-medium">Lecteur audio disponible prochainement</p>
                    </div>
                  </div>
                </div>
              )}

              {podcast.transcript && (
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Transcription</h3>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-a:transition-colors"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(podcast.transcript) }}
                  />
                </div>
              )}
            </div>

            {/* Formation CTA */}
            <div className="mb-8">
              <FormationCTA category={podcast.category} />
            </div>

            {/* Autres épisodes */}
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-4">
                Autres épisodes
              </h3>
              {others.map((ep) => (
                <motion.div key={ep.id} variants={staggerItem}>
                <Link
                  to={`/podcasts/${ep.slug}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
                >
                  {ep.coverImage && (
                    <img
                      src={ep.coverImage}
                      alt={ep.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold text-neutral-800 dark:text-neutral-200 ${theme.titleHover} transition-colors leading-snug line-clamp-2`}>
                      {ep.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{ep.duration}</p>
                  </div>
                </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
