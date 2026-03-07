import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Clock, Calendar, Play, ArrowRight, Loader2, AlertCircle, Mic } from 'lucide-react';
import { getPublishedPodcasts } from '../lib/firestore';
import { formatDate } from '../lib/utils';
import type { Podcast } from '../types';

const PLATFORMS = [
  { name: 'Spotify', color: '#1DB954' },
  { name: 'Apple Podcasts', color: '#FC3C44' },
  { name: 'Deezer', color: '#A238FF' },
  { name: 'Google Podcasts', color: '#4285F4' },
];

export default function Podcasts() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');

  const load = () => {
    setError(false);
    setLoading(true);
    getPublishedPodcasts()
      .then((data) => { setPodcasts(data); setLoading(false); })
      .catch(() => { setLoading(false); setError(true); });
  };

  useEffect(() => { load(); }, []);

  const categories = ['Tous', ...Array.from(new Set(podcasts.map((p) => p.category).filter(Boolean)))];
  const filtered = activeCategory === 'Tous' ? podcasts : podcasts.filter((p) => p.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const heroBg = podcasts[0]?.coverImage;

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-950 pt-28 pb-20 lg:pt-36 lg:pb-28">

        {/* Background cover image from latest podcast */}
        {heroBg && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
        )}

        {/* Gradient overlay — left heavy so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/55 dark:from-neutral-950 dark:via-neutral-950/92 dark:to-neutral-950/55" />
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/20 dark:from-neutral-950/80 dark:via-transparent dark:to-neutral-950/40" />

        {/* Accent glow on top of image */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[8%] w-64 h-64 rounded-full bg-brand-600/20 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-brand-400" />
                </div>
                <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400">
                  PODCAST
                </p>
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-neutral-900 dark:text-white tracking-tight leading-[0.95] mb-6">
                Le Podcast<br />
                <span className="text-brand-600 dark:text-brand-400">du Marketing</span>
              </h1>
              <p className="text-neutral-600 dark:text-neutral-300 text-lg leading-relaxed max-w-xl">
                Analyses, interviews et stratégies en marketing digital, SEO et IA — directement dans tes oreilles.
              </p>
            </div>

            {/* Platform badges */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500 mb-1">Disponible sur</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <span
                    key={p.name}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 text-xs font-semibold hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors cursor-default"
                  >
                    <Headphones className="w-3.5 h-3.5" style={{ color: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Stats row */}
          {podcasts.length > 0 && (
            <div className="flex gap-8 mt-12 pt-8 border-t border-neutral-200 dark:border-white/10">
              <div>
                <p className="text-3xl font-black text-neutral-900 dark:text-white">{podcasts.length}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Épisodes</p>
              </div>
              <div className="w-px bg-neutral-200 dark:bg-white/10" />
              <div>
                <p className="text-3xl font-black text-neutral-900 dark:text-white">100%</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Gratuit</p>
              </div>
              <div className="w-px bg-neutral-200 dark:bg-white/10" />
              <div>
                <p className="text-3xl font-black text-neutral-900 dark:text-white">
                  {Array.from(new Set(podcasts.map((p) => p.category).filter(Boolean))).length || '∞'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Thèmes</p>
              </div>
            </div>
          )}
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
            <p className="text-neutral-600 dark:text-neutral-400">Impossible de charger les épisodes.</p>
            <button onClick={load} className="px-5 py-2 bg-brand-600 text-white text-sm font-bold rounded-full hover:bg-brand-700 transition-colors">
              Réessayer
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <Headphones className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Aucun épisode disponible pour le moment.</p>
          </div>
        )}

        {/* Featured episode */}
        {!loading && !error && featured && (
          <Link
            to={`/podcasts/${featured.slug}`}
            className="group block mb-12 rounded-3xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-xl transition-all duration-300 bg-neutral-50 dark:bg-neutral-900"
          >
            <div className="grid md:grid-cols-[280px_1fr] gap-0">
              <div className="relative overflow-hidden aspect-square md:aspect-auto">
                <img
                  src={featured.coverImage}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-brand-600 text-white text-xs font-black rounded-full uppercase tracking-wider">
                    À la une
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="text-4xl font-black text-white/30">#{filtered.indexOf(featured) + 1}</span>
                </div>
              </div>
              <div className="p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-4">
                    {featured.category}
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm line-clamp-3">
                    {featured.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-5 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featured.duration}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(featured.publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold rounded-full text-sm group-hover:bg-brand-700 transition-colors">
                    <Play className="w-4 h-4" fill="currentColor" />
                    Écouter
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Episode grid */}
        {!loading && !error && rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((podcast, i) => (
              <Link
                key={podcast.id}
                to={`/podcasts/${podcast.slug}`}
                className="group flex flex-col bg-neutral-50 dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={podcast.coverImage}
                    alt={podcast.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-brand-600 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-black/60 text-white text-xs font-bold rounded-full">
                      #{i + 2}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-2">
                    {podcast.category}
                  </p>
                  <h3 className="font-black text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug text-sm mb-3 flex-1">
                    {podcast.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{podcast.duration}</span>
                    <span>{formatDate(podcast.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA → Vidéos ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Le Marketing en Pratique
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Des vidéos pratiques sur ma chaîne YouTube pour aller encore plus loin.
          </p>
          <Link to="/videos" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Voir les vidéos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
