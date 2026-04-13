import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, Calendar, ArrowRight, Loader2, AlertCircle, Clapperboard, Bell, Users, Video as VideoIcon } from 'lucide-react';

function YtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
import { getPublishedVideos } from '../lib/firestore';
import { formatDate } from '../lib/utils';
import type { Video } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');

  const load = () => {
    setError(false);
    setLoading(true);
    getPublishedVideos()
      .then((data) => { setVideos(data); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(
    () => ['Tous', ...Array.from(new Set(videos.map((v) => v.category).filter(Boolean)))],
    [videos]
  );
  const filtered = useMemo(
    () => activeCategory === 'Tous' ? videos : videos.filter((v) => v.category === activeCategory),
    [videos, activeCategory]
  );
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const heroVideo = videos[0];
  const totalViews = useMemo(() => videos.reduce((sum, v) => sum + (v.views || 0), 0), [videos]);

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen">
      <SEOHead
        title="Vidéos Marketing Digital"
        description="Regarde les vidéos de Max-Morrys sur le marketing digital, le SEO et l'IA. Tutoriels pratiques et analyses sur YouTube."
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Vidéos Marketing Digital',
        description: 'Tutoriels et analyses vidéo sur le marketing digital par Max-Morrys.',
        url: `${SITE_URL}/videos`,
        isPartOf: { '@type': 'WebSite', name: 'Max-Morrys', url: SITE_URL },
      }} />

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-950 pt-28 pb-20 lg:pt-36 lg:pb-0">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[10%] w-80 h-80 rounded-full bg-red-600/20 blur-[130px]" />
          <div className="absolute bottom-0 left-[15%] w-96 h-96 rounded-full bg-brand-700/15 blur-[160px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center pb-16 lg:pb-20">

            {/* ── Left: text + stats + CTA ── */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <Clapperboard className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-xs font-bold tracking-[0.35em] uppercase text-red-600 dark:text-red-400">
                  YOUTUBE
                </p>
              </div>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black text-neutral-900 dark:text-white tracking-tight leading-[0.95] mb-6">
                Le Marketing<br />
                <span className="text-red-600 dark:text-red-400">En Pratique</span>
              </h1>

              <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed mb-8 max-w-md">
                Si tu es plus à l'aise avec des vidéos, abonne-toi à ma chaine Youtube pour ne manquer des tutoriels, analyses et stratégies marketing que je te propose.
              </p>

              <a
                href="https://youtube.com/@maxmorrys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#FF0000] text-white text-sm font-bold hover:bg-red-700 transition-all duration-200 shadow-lg shadow-red-900/30"
              >
                <YtIcon className="w-4 h-4" />
                S'abonner sur YouTube
              </a>

              {/* Stats */}
              {videos.length > 0 && (
                <div className="flex gap-8 mt-10 pt-8 border-t border-neutral-200 dark:border-white/10">
                  <div>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white">{videos.length}</p>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">Vidéos</p>
                  </div>
                  <div className="w-px bg-neutral-200 dark:bg-white/10" />
                  <div>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white">
                      {totalViews >= 1000 ? `${(totalViews / 1000).toFixed(0)}k` : totalViews}
                    </p>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">Vues</p>
                  </div>
                  <div className="w-px bg-neutral-200 dark:bg-white/10" />
                  <div>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white">
                      {Array.from(new Set(videos.map((v) => v.category).filter(Boolean))).length || '∞'}
                    </p>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">Thèmes</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: featured video preview ── */}
            {heroVideo && (
              <Link
                to={`/videos/${heroVideo.slug}`}
                className="group block"
              >
                {/* Widescreen thumbnail */}
                <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-neutral-200 dark:ring-white/10 shadow-2xl shadow-neutral-300/60 dark:shadow-black/60">
                  <img
                    src={heroVideo.thumbnailUrl}
                    alt={heroVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  {/* Dark overlay + play button */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-9 h-9 text-neutral-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/75 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                    {heroVideo.duration}
                  </span>
                  {/* "À la une" badge */}
                  <span className="absolute top-4 left-4 px-3 py-1.5 bg-[#FF0000] text-white text-xs font-black rounded-full uppercase tracking-wider">
                    Dernière vidéo
                  </span>
                </div>

                {/* Video info below thumbnail */}
                <div className="mt-4 px-1">
                  <p className="text-xs font-bold tracking-widest uppercase text-red-600 dark:text-red-400 mb-1.5">
                    {heroVideo.category}
                  </p>
                  <h2 className="text-base lg:text-lg font-black text-neutral-900 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 mb-2">
                    {heroVideo.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-500">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{heroVideo.views.toLocaleString()} vues</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(heroVideo.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Placeholder when no videos yet */}
            {!heroVideo && !loading && (
              <div className="aspect-video rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                <div className="text-center">
                  <YtIcon className="w-12 h-12 text-neutral-400 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 dark:text-neutral-600 text-sm">Aucune vidéo pour le moment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-neutral-600 dark:text-neutral-400">Impossible de charger les vidéos.</p>
            <button onClick={load} className="px-5 py-2 bg-brand-600 text-white text-sm font-bold rounded-full hover:bg-brand-700 transition-colors">
              Réessayer
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <YtIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Aucune vidéo disponible pour le moment.</p>
          </div>
        )}

        {/* Featured video (from active filter) */}
        {!loading && !error && featured && (
          <Link
            to={`/videos/${featured.slug}`}
            className="group block mb-12 rounded-3xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-900 hover:shadow-xl transition-all duration-300 bg-neutral-50 dark:bg-neutral-900"
          >
            <div className="grid md:grid-cols-[3fr_2fr] gap-0">
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={featured.thumbnailUrl}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 text-neutral-900 ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-[#FF0000] text-white text-xs font-black rounded-full uppercase tracking-wider">
                    À la une
                  </span>
                </div>
                <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-full">
                  {featured.duration}
                </span>
              </div>
              <div className="p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-red-600 dark:text-red-400 mb-4">
                    {featured.category}
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm line-clamp-3">
                    {featured.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{featured.views.toLocaleString()}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(featured.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white font-bold rounded-full text-sm group-hover:bg-red-700 transition-colors">
                    <Play className="w-4 h-4" fill="currentColor" />
                    Regarder
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Video grid */}
        {!loading && !error && rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((video) => (
              <Link
                key={video.id}
                to={`/videos/${video.slug}`}
                className="group flex flex-col bg-neutral-50 dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-900 hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
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
                  <p className="text-xs font-bold tracking-widest uppercase text-red-600 dark:text-red-400 mb-2">
                    {video.category}
                  </p>
                  <h3 className="font-black text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug text-sm mb-3 flex-1">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views.toLocaleString()}</span>
                    <span>{formatDate(video.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* YouTube CTA */}
        {!loading && !error && videos.length > 0 && (
          <div className="mt-16 text-center">
            <a
              href="https://youtube.com/@maxmorrys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white font-bold rounded-full hover:bg-red-700 transition-colors text-sm tracking-wide"
            >
              <YtIcon className="w-4 h-4" /> S'abonner sur YouTube
            </a>
          </div>
        )}
      </div>

      {/* ── CLUB DES DIGITOS PROMO ── */}
      <section className="py-16 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900">
            {/* Background glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-yellow-400/10 blur-[120px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-600/10 blur-[100px]" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-0">

              {/* Left */}
              <div className="p-10 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full px-3 py-1 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                  </span>
                  <span className="text-xs font-bold tracking-[0.25em] uppercase text-yellow-400">CLUB DES DIGITOS</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-[0.95] mb-5">
                  Rejoins mes<br />sessions Live
                </h2>
                <p className="text-neutral-400 leading-relaxed text-base mb-8">
                  Les vidéos, c'est en replay. Mais dans le Club, je fais des sessions Live interactives où tu peux poser tes questions en direct et vraiment progresser avec moi.
                </p>
                <Link
                  to="/mon-espace"
                  className="inline-flex items-center gap-2 self-start px-7 py-3.5 bg-yellow-400 text-neutral-900 font-black rounded-full hover:bg-yellow-300 transition-colors text-sm tracking-wide shadow-lg shadow-yellow-400/20"
                >
                  Rejoindre le Club <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: features */}
              <div className="p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-center gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <VideoIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">Sessions Live avec moi</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Des séances interactives en direct où je réponds à tes questions et on travaille ensemble en temps réel.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">Notifications exclusives</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Ne manque jamais un Live : les membres sont notifiés en priorité avant tout le monde.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">Communauté active</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Rejoins un réseau de professionnels du digital pour avancer ensemble après chaque Live.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">19 900</span>
                  <span className="text-yellow-400 font-bold">FCFA / an</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── CTA → Podcast ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Le Podcast du Marketing
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Analyses et réflexions en audio — à écouter n'importe où, n'importe quand.
          </p>
          <Link to="/podcasts" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Écouter le podcast <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
