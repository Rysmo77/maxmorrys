import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, ArrowRight, Loader2, AlertCircle, MessageSquare, Rss } from 'lucide-react';
import { getPublishedPosts } from '../lib/firestore';
import { formatDate, truncate } from '../lib/utils';
import { trackSearch } from '../lib/tracking';
import type { BlogPost } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';

const viewportOnce = { once: true, amount: 0.2 } as const;

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

  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => trackSearch(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(
    () => ['Tous', ...Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))],
    [posts]
  );

  const filtered = useMemo(() => posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  }), [posts, search, activeCategory]);

  const featuredPost = activeCategory === 'Tous' && !search ? filtered[0] : null;
  const gridPosts = featuredPost ? filtered.slice(1) : filtered;

  return (
    <div>
      <SEOHead
        title="Blog Marketing Digital — Articles et Conseils"
        description="Articles, analyses et conseils pratiques en marketing digital, SEO, IA et stratégie de croissance. Par Max-Morrys depuis Dakar."
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Blog Marketing Digital',
        description: 'Articles et conseils en marketing digital, SEO et IA.',
        url: `${SITE_URL}/blog`,
        isPartOf: { '@type': 'WebSite', name: 'Max-Morrys', url: SITE_URL },
      }} />

      {/* ── HERO editorial ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={staggerItem} className="text-xs font-bold tracking-[0.35em] uppercase text-coral-600 dark:text-coral-400 mb-5">
            BLOG
          </motion.p>
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-12">
            <motion.h1 variants={staggerItem} className="text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95]">
              Ne manque aucune news
            </motion.h1>
            <motion.p variants={staggerItem} className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed lg:pb-2">
              Les choses vont tellement vite en marketing qu'il ne faut rien rater des tendaces et nouveautés. Mais je te dis tout ; pas de secret entre nous !
            </motion.p>
          </div>

          {/* Barre recherche + filtres */}
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4">
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
          </motion.div>
        </motion.div>
      </section>

      <div className="bg-white dark:bg-neutral-950 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Article featured en grand format horizontal */}
          {featuredPost && (
            <motion.div
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
            <Link to={`/blog/${featuredPost.slug}`} className="group block mb-12 pt-12">
              <div className="grid lg:grid-cols-[5fr_4fr] gap-0 overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                <div className="relative overflow-hidden aspect-[16/9] lg:aspect-auto">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                    width={800}
                    height={450}
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
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-coral-600 dark:text-coral-400 mb-4">
                    {featuredPost.category}
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight group-hover:text-coral-600 dark:group-hover:text-coral-400 transition-colors">
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
                    <span className="text-sm font-semibold text-coral-600 dark:text-coral-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Lire <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            </motion.div>
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
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {gridPosts.map((post) => (
                <motion.div key={post.id} variants={staggerItem}>
                <Link to={`/blog/${post.slug}`} className="group flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  <div className="relative overflow-hidden rounded-2xl aspect-[16/9] mb-5">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={400}
                      height={225}
                    />
                  </div>
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-coral-600 dark:text-coral-400 mb-2">
                    {post.category} · <span className="font-normal normal-case tracking-normal text-neutral-400">{post.readTime} min de lecture</span>
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white mb-2 group-hover:text-coral-600 dark:group-hover:text-coral-400 transition-colors leading-snug flex-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{truncate(post.excerpt, 100)}</p>
                  <p className="text-xs text-neutral-400">{formatDate(post.publishedAt)}</p>
                </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            !featuredPost && (
              <div className="text-center py-20">
                <p className="text-neutral-500 dark:text-neutral-400">Aucun article trouvé pour ta recherche.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── CLUB DES DIGITOS PROMO ── */}
      <motion.section
        className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-neutral-900 dark:bg-neutral-900 dark:border dark:border-white/10 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">

              {/* Left: plum panel (Club universe) */}
              <div className="bg-plum-600 p-10 lg:p-12 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/70 mb-5">CLUB DES DIGITOS</p>
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-[0.95] mb-4">
                    Échange avec moi<br />& la communauté
                  </h2>
                  <p className="text-white/85 leading-relaxed text-base mb-8">
                    Le blog, c'est bien. Mais dans le Club, on va plus loin : pose tes questions directement dans le forum, réagis aux actus du moment sur le fil, et discute avec moi et les autres membres.
                  </p>
                </div>
                <Link
                  to="/mon-espace"
                  className="inline-flex items-center gap-2 self-start px-7 py-3.5 bg-neutral-900 text-white font-bold rounded-full hover:bg-neutral-800 transition-colors text-sm tracking-wide"
                >
                  Rejoindre le Club <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: features */}
              <div className="p-10 lg:p-12 flex flex-col justify-center gap-8">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-plum-400/15 border border-plum-400/30 flex items-center justify-center flex-shrink-0">
                    <Rss className="w-5 h-5 text-plum-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base mb-1">Fil d'actualité</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">Les dernières infos du digital filtrées et commentées par moi — directement dans ton feed.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-plum-400/15 border border-plum-400/30 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-plum-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base mb-1">Forum & discussions avec moi</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">Pose tes questions, partage tes avancées et discute directement avec moi et toute la communauté.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">19 900</span>
                  <span className="text-plum-400 font-bold">FCFA / an</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.section>

      {/* ── CTA croisé → Podcast ── */}
      <motion.section
        className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
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
          <Link to="/podcasts" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide">
            Écouter le podcast <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
