import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Clock, ArrowRight, Loader2, AlertCircle, MessageSquare, Rss, ChevronDown } from 'lucide-react';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import { getPublishedPosts } from '../lib/firestore';
import { formatDate, truncate } from '../lib/utils';
import { trackSearch } from '../lib/tracking';
import type { BlogPost } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { BLOG_POLES, categoryToPole } from '../lib/blogCategories';
import ArticleCard from '../components/shared/ArticleCard';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.blog;

const viewportOnce = { once: true, amount: 0.2 } as const;

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [topicsOpen, setTopicsOpen] = useState(true);

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

  const categories = useMemo(() => {
    const present = new Set(posts.map((p) => categoryToPole(p.category)));
    return ['Tous', ...BLOG_POLES.filter((pole) => present.has(pole))];
  }, [posts]);

  const filtered = useMemo(() => posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Tous' || categoryToPole(post.category) === activeCategory;
    return matchesSearch && matchesCategory;
  }), [posts, search, activeCategory]);

  // Article à la une : affiché uniquement sans filtre ni recherche.
  const featuredPost = useMemo(() => {
    if (activeCategory !== 'Tous' || search.trim()) return null;
    return posts.find((p) => p.featured) ?? posts[0] ?? null;
  }, [posts, activeCategory, search]);

  const gridPosts = featuredPost ? filtered.filter((p) => p.id !== featuredPost.id) : filtered;

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

      {/* ── HERO : article à la une ── */}
      <section className="pt-28 pb-14 lg:pt-36 lg:pb-16 bg-neutral-50 dark:bg-neutral-900">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3 mb-8">
            <AnimatedIcon
              icon={Rss}
              animation="float"
              className="w-11 h-11 rounded-2xl bg-coral-100 dark:bg-coral-900/30 shrink-0"
              iconClassName="w-5 h-5 text-coral-600 dark:text-coral-400"
            />
            <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
              BLOG
            </p>
          </motion.div>

          {featuredPost ? (
            <motion.div variants={staggerItem}>
              <Link to={`/blog/${featuredPost.slug}`} className="group grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                    width={800}
                    height={600}
                  />
                </div>
                <div>
                  <p className={`text-xs font-bold tracking-[0.3em] uppercase ${theme.eyebrow} mb-4`}>
                    À la une · {categoryToPole(featuredPost.category)}
                  </p>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05] mb-5 ${theme.titleHover} transition-colors`}>
                    {featuredPost.title}
                  </h1>
                  <p className="text-base lg:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {truncate(featuredPost.excerpt, 200)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mb-7">
                    <span>{formatDate(featuredPost.publishedAt)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredPost.readTime} min de lecture</span>
                  </div>
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 text-sm font-bold text-neutral-900 dark:text-white group-hover:bg-coral-600 group-hover:border-coral-600 group-hover:text-white transition-colors">
                    Lire plus <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={staggerItem} className="max-w-2xl">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-5">
                Ne manque aucune news
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Les choses vont tellement vite en marketing qu'il ne faut rien rater des tendances et nouveautés. Mais je te dis tout ; pas de secret entre nous !
              </p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── SUJETS + RECHERCHE + GRILLE ── */}
      <div className="bg-white dark:bg-neutral-950 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

          {/* Sujets repliable */}
          <button
            type="button"
            onClick={() => setTopicsOpen((v) => !v)}
            className="flex items-center gap-2 text-xl font-black tracking-tight text-neutral-900 dark:text-white mb-5"
            aria-expanded={topicsOpen}
          >
            Sujets
            <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${topicsOpen ? 'rotate-180' : ''}`} />
          </button>
          {topicsOpen && (
            <div className="flex flex-wrap gap-2.5 mb-7">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    activeCategory === cat
                      ? theme.buttonSolid
                      : 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Recherche */}
          <div className="relative max-w-md mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className={`w-full pl-11 pr-5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${theme.focusRing}`}
            />
          </div>

          {/* Loading / error states */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} />
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <AlertCircle className="w-8 h-8 text-error-500" />
              <p className="text-neutral-600 dark:text-neutral-400">Impossible de charger les articles. Vérifie ta connexion.</p>
              <button onClick={load} className={`px-5 py-2 ${theme.buttonSolid} text-sm font-bold rounded-full transition-colors`}>
                Réessayer
              </button>
            </div>
          )}

          {/* Grille articles */}
          {!loading && !error && (
            gridPosts.length > 0 ? (
              <motion.div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {gridPosts.map((post) => (
                  <motion.div key={post.id} variants={staggerItem}>
                    <ArticleCard post={post} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
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
          <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-4`}>
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Le Podcast du Marketing
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Analyses, interviews et réflexions sur le marketing digital — à écouter partout, tout le temps.
          </p>
          <Link to="/podcasts" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide`}>
            Écouter le podcast <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
