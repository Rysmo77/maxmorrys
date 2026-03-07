import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getPublishedPosts } from '../lib/firestore';
import { formatDate, truncate } from '../lib/utils';
import type { BlogPost } from '../types';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');

  const load = () => {
    setError(false);
    setLoading(true);
    getPublishedPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    }).catch(() => { setLoading(false); setError(true); });
  };

  useEffect(() => { load(); }, []);

  const categories = ['Tous', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))];

  const filtered = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = activeCategory === 'Tous' && !search ? filtered[0] : null;
  const gridPosts = featuredPost ? filtered.slice(1) : filtered;

  return (
    <div>

      {/* ── HERO editorial ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
            RESSOURCES
          </p>
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-12">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95]">
              Blog
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed lg:pb-2">
              Articles, analyses et conseils pratiques pour maîtriser le marketing digital, le SEO et l'IA.
            </p>
          </div>

          {/* Barre recherche + filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article..."
                className="w-full pl-11 pr-5 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    activeCategory === cat
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
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

          {/* Article featured en grand format horizontal */}
          {featuredPost && (
            <Link to={`/blog/${featuredPost.slug}`} className="group block mb-12 pt-12">
              <div className="grid lg:grid-cols-[5fr_4fr] gap-0 overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                <div className="relative overflow-hidden aspect-[16/9] lg:aspect-auto">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                  />
                  {featuredPost.featured && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        A la une
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center bg-neutral-50 dark:bg-neutral-900">
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-4">
                    {featuredPost.category}
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {truncate(featuredPost.excerpt, 180)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span>{formatDate(featuredPost.publishedAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredPost.readTime} min</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Lire <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Loading / error states */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="w-8 h-8 text-error-500" />
              <p className="text-neutral-600 dark:text-neutral-400">Impossible de charger les articles. Vérifie ta connexion.</p>
              <button onClick={load} className="px-5 py-2 bg-brand-600 text-white text-sm font-bold rounded-full hover:bg-brand-700 transition-colors">
                Réessayer
              </button>
            </div>
          )}

          {/* Grille articles */}
          {!loading && gridPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl aspect-[16/9] mb-5">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-2">
                    {post.category} · <span className="font-normal normal-case tracking-normal text-neutral-400">{post.readTime} min de lecture</span>
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug flex-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{truncate(post.excerpt, 100)}</p>
                  <p className="text-xs text-neutral-400">{formatDate(post.publishedAt)}</p>
                </Link>
              ))}
            </div>
          ) : (
            !featuredPost && (
              <div className="text-center py-20">
                <p className="text-neutral-500 dark:text-neutral-400">Aucun article trouvé pour ta recherche.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── CTA croisé → Podcast ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Le Podcast du Marketing
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Analyses, interviews et réflexions sur le marketing digital — à écouter partout, tout le temps.
          </p>
          <Link to="/podcasts" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Écouter le podcast <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
