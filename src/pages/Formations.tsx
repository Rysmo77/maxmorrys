import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Users, Clock, ArrowRight, Play, Loader2 } from 'lucide-react';
import { getPublishedFormations } from '../lib/firestore';
import type { Formation } from '../types';

const levelOptions = [
  { label: 'Tous', value: 'Tous' },
  { label: 'Débutant', value: 'debutant' },
  { label: 'Intermédiaire', value: 'intermediaire' },
  { label: 'Avancé', value: 'avance' },
];

export default function Formations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [activeCategory, setActiveCategory] = useState('Toutes');

  useEffect(() => {
    getPublishedFormations().then((data) => {
      setFormations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = ['Toutes', ...Array.from(new Set(formations.map((f) => f.category).filter(Boolean)))];

  const filtered = formations.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = activeLevel === 'Tous' || f.level === activeLevel;
    const matchesCategory = activeCategory === 'Toutes' || f.category === activeCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const noFilters = activeLevel === 'Tous' && activeCategory === 'Toutes' && !search;
  const featuredFormation = noFilters ? filtered[0] : null;
  const gridFormations = featuredFormation ? filtered.slice(1) : filtered;

  return (
    <div>

      {/* ── HERO éditorial ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
            FORMATIONS
          </p>
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-12">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95]">
              Formations
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed lg:pb-2">
              Des formations pratiques pour maîtriser le marketing digital, le SEO et l'IA — et transformer tes compétences en résultats concrets.
            </p>
          </div>

          {/* Recherche + filtres */}
          <div className="flex flex-col gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une formation..."
                className="w-full pl-11 pr-5 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {levelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActiveLevel(opt.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    activeLevel === opt.value
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <span className="w-px h-8 self-center bg-neutral-200 dark:bg-neutral-700 mx-1" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white dark:bg-neutral-950 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          )}

          {/* Formation featured hero */}
          {!loading && featuredFormation && (
            <div className="pt-12 mb-16">
              <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <div className="relative overflow-hidden aspect-[16/9] lg:aspect-auto">
                  <img
                    src={featuredFormation.coverImage}
                    alt={featuredFormation.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-neutral-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {featuredFormation.featured && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-accent-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        À la une
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center bg-neutral-50 dark:bg-neutral-900">
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-4">
                    {featuredFormation.category} · {featuredFormation.level}
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight">
                    {featuredFormation.title}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {featuredFormation.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-accent-500" fill="currentColor" />
                      <span className="font-bold text-neutral-700 dark:text-neutral-200">{featuredFormation.rating}</span>
                    </span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{featuredFormation.students} étudiants</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{featuredFormation.duration}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/formations/${featuredFormation.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide"
                    >
                      Voir la formation <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">
                      {featuredFormation.price === 0 ? 'Gratuit' : `${featuredFormation.price.toLocaleString()} FCFA`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grille formations */}
          {gridFormations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridFormations.map((formation) => (
                <Link key={formation.id} to={`/formations/${formation.slug}`} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl aspect-[16/9] mb-5">
                    <img
                      src={formation.coverImage}
                      alt={formation.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-neutral-900 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {formation.featured && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        À la une
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-2">
                    {formation.category} · <span className="font-normal normal-case tracking-normal text-neutral-400">{formation.level}</span>
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug flex-1">
                    {formation.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-accent-500" fill="currentColor" />
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300">{formation.rating}</span>
                    </span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formation.students}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formation.duration}</span>
                  </div>
                  <p className="text-base font-black text-neutral-900 dark:text-white">
                    {formation.price === 0 ? 'Gratuit' : `${formation.price.toLocaleString()} FCFA`}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            !featuredFormation && (
              <div className="text-center py-20">
                <p className="text-neutral-500 dark:text-neutral-400">Aucune formation trouvée pour ta recherche.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── CTA croisé → Blog ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Je t'informe
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Articles, analyses et conseils pratiques pour maîtriser le marketing digital, le SEO et l'IA.
          </p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Lire le blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
