import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Headphones, Clock, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { getPodcastBySlug, getPublishedPodcasts } from '../lib/firestore';
import FormationCTA from '../components/shared/FormationCTA';
import { formatDate, markdownToHtml } from '../lib/utils';
import type { Podcast } from '../types';
import { trackViewContent } from '../lib/meta-pixel';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';

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
        trackViewContent({ content_type: 'podcast', content_ids: [data.id], content_name: data.title });
        getPublishedPodcasts().then((all) => setOthers(all.filter((p) => p.id !== data.id).slice(0, 4))).catch(() => null);
      }
    }).catch(() => setPodcast(null));
  }, [slug]);

  if (podcast === undefined) {
    return <div className="pt-32 pb-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  if (!podcast) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Épisode introuvable</h1>
        <Link to="/podcasts" className="text-brand-600 dark:text-brand-400 hover:underline">Retour aux podcasts</Link>
      </div>
    );
  }

  return (
    <div>
      <SEOHead
        title={podcast.title}
        description={podcast.description}
        ogImage={podcast.coverImage}
      />
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
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/podcasts"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les épisodes
          </Link>

          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400">
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
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.1] mb-6">
            {podcast.title}
          </h1>

          <div
            className="prose dark:prose-invert max-w-none mb-8 prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-blockquote:not-italic prose-blockquote:font-medium"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(podcast.description) }}
          />

          <div className="flex items-center gap-5 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {podcast.duration}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(podcast.publishedAt)}
            </span>
          </div>
        </div>
      </section>

      {/* ── PLAYER ── */}
      <div className="bg-white dark:bg-neutral-950 pb-24">
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
                      <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center mx-auto">
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
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-4">
                Autres épisodes
              </h3>
              {others.map((ep) => (
                <Link
                  key={ep.id}
                  to={`/podcasts/${ep.slug}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
                >
                  {ep.coverImage && (
                    <img
                      src={ep.coverImage}
                      alt={ep.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug line-clamp-2">
                      {ep.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{ep.duration}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
