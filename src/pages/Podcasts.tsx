import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Headphones, Clock, Calendar, Play, ArrowRight, Loader2, AlertCircle,
  Bell, Users, ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import CountUp from '../components/shared/CountUp';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import { getPublishedPodcasts } from '../lib/firestore';
import { formatDate } from '../lib/utils';
import type { Podcast } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { testimonials } from '../data/testimonials';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.podcasts;

const viewportOnce = { once: true, amount: 0.2 } as const;

// Liens d'abonnement aux plateformes d'écoute (URLs publiques, sans clé API).
// ⚠️ Remplacer par les vraies URLs de l'émission.
const SUBSCRIBE_LINKS = [
  { name: 'Apple Podcasts', color: '#FC3C44', url: 'https://podcasts.apple.com/us/podcast/le-podcast-du-marketing/id1896841789' },
  { name: 'Spotify', color: '#1DB954', url: 'https://open.spotify.com/show/5WV1QSOWsOBZoddNyPxwjc' },
];

// Portrait Max-Morrys — réutilisé depuis la page À propos.
const HOST_PORTRAIT =
  'https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/A-propos%2FChatGPT%20Image%2014%20mai%202026%2C%2000_44_30%20(1).png?alt=media&token=e72ee3b7-1ff1-45ff-a994-b43607d16387';

// Visuel du héro de la page Podcasts.
const HERO_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/Podcasts%2FChatGPT%20Image%2029%20mai%202026%2C%2011_16_32.png?alt=media&token=32159d2a-9d90-49af-9c1a-752a585c0635';

// Vidéo de l'encart CTA vidéos (bas de page) — lecture en boucle, mutée.
const VIDEOS_CTA_VIDEO =
  'https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/Podcasts%2FGenerated%20Video%20May%2029%2C%202026%20-%202_07AM.mp4?alt=media&token=579f6919-c706-4388-aa26-7f1b142a531d';

/** Intertitre de section — style typographique d'origine du site. */
function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-bold tracking-[0.35em] uppercase ${className}`}>
      {children}
    </p>
  );
}

export default function Podcasts() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [tIndex, setTIndex] = useState(0);

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
  const themeCount = Array.from(new Set(podcasts.map((p) => p.category).filter(Boolean))).length;

  // Témoignages : carrousel 2-par-2.
  const tPages = Math.max(1, Math.ceil(testimonials.length / 2));
  const tPair = testimonials.slice(tIndex * 2, tIndex * 2 + 2);

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title="Podcasts Marketing Digital"
        description="Écoute le podcast de Max-Morrys : stratégies marketing digital, SEO, IA et croissance en Afrique. Disponible sur Spotify et Apple Podcasts."
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'PodcastSeries',
        name: 'Le Podcast du Marketing — Max-Morrys',
        description: 'Stratégies marketing digital, SEO, IA et croissance en Afrique.',
        url: `${SITE_URL}/podcasts`,
        webFeed: `${SITE_URL}/podcasts`,
      }} />

      {/* ══ 1 · HERO SPLIT ══ */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-32 lg:pb-24">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Gauche : carte blanche */}
            <motion.div variants={staggerItem} className="relative z-10">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-soft p-8 sm:p-12 lg:p-14">
                <AnimatedIcon
                  icon={Headphones}
                  animation="float"
                  className="w-11 h-11 rounded-2xl bg-plum-100 dark:bg-plum-900/30 mb-4"
                  iconClassName="w-5 h-5 text-plum-600 dark:text-plum-400"
                />
                <Eyebrow className={`${theme.eyebrow} mb-3`}>bienvenue sur le</Eyebrow>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05] mb-6">
                  Le Podcast<br /><span className={theme.accentText}>du Marketing</span>
                </h1>
                <p className="text-neutral-600 dark:text-neutral-300 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                  Chaque semaine, de nouvelles stratégies, des interviews d'experts et des
                  conseils concrets pour cultiver et développer ton business en ligne.
                </p>
                <a
                  href="#episodes"
                  className={`inline-flex items-center gap-2 px-7 py-3.5 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-lg transition-all duration-300 text-sm tracking-wide uppercase`}
                >
                  <Play className="w-4 h-4" fill="currentColor" /> Écouter maintenant
                </a>
              </div>
            </motion.div>

            {/* Droite : image sur fond pastel + forme décorative */}
            <motion.div variants={staggerItem} className="relative">
              <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-plum-200 dark:bg-plum-500/20 -z-0" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-plum-200 dark:bg-plum-500/20 -z-0" />
              <div className={`relative rounded-3xl overflow-hidden aspect-[4/5] ${theme.sectionBg}`}>
                <img
                  src={HERO_IMAGE}
                  alt="Le Podcast du Marketing"
                  className="w-full h-full object-cover"
                  loading="eager"
                  width={640}
                  height={800}
                />
              </div>
            </motion.div>
          </div>

          {/* Plateformes + stats */}
          <motion.div
            variants={staggerItem}
            className="mt-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-8 border-t border-neutral-200 dark:border-white/10"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-500 mr-2">Disponible sur</span>
              {SUBSCRIBE_LINKS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 text-xs font-semibold hover:border-plum-300 dark:hover:border-plum-700 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5" style={{ color: p.color }} />
                  {p.name}
                </a>
              ))}
            </div>
            {podcasts.length > 0 && (
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-black text-neutral-900 dark:text-white">
                    <CountUp value={podcasts.length} />
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Épisodes</p>
                </div>
                <div className="w-px bg-neutral-200 dark:bg-white/10" />
                <div>
                  <p className="text-3xl font-black text-neutral-900 dark:text-white">
                    <CountUp value={100} suffix="%" />
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Gratuit</p>
                </div>
                <div className="w-px bg-neutral-200 dark:bg-white/10" />
                <div>
                  <p className="text-3xl font-black text-neutral-900 dark:text-white">
                    {themeCount ? <CountUp value={themeCount} /> : '∞'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">Thèmes</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ══ 2 · DERRIÈRE LE MICRO ══ */}
      <motion.section
        className="py-20 lg:py-28 bg-white dark:bg-neutral-950"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div>
              <Eyebrow className={`${theme.eyebrow} mb-3`}>derrière le micro</Eyebrow>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-6">
                Max-Morrys
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 text-base lg:text-lg leading-relaxed mb-8 max-w-lg">
                J'accompagne la croissance d'organisations en Afrique francophone — santé,
                services, éducation, impact social — en combinant stratégie marketing, data,
                contenu, partenariats, développement web et automatisation des processus.
                Le podcast, c'est ce que j'apprends sur le terrain, partagé sans filtre.
              </p>
              <Link
                to="/a-propos"
                className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white font-bold rounded-full hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:hover:bg-white dark:hover:text-neutral-900 transition-all duration-300 text-sm tracking-wide uppercase"
              >
                En savoir plus <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-plum-200 dark:bg-plum-500/20" />
              <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-plum-200 dark:bg-plum-500/20" />
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5]">
                <img
                  src={HOST_PORTRAIT}
                  alt="Max-Morrys Eyoum"
                  className="w-full h-full object-cover scale-x-[-1]"
                  loading="lazy"
                  width={640}
                  height={800}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══ 3 · ABONNE-TOI ══ */}
      <motion.section
        className="py-20 lg:py-28 bg-plum-100 dark:bg-neutral-900"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Eyebrow className={`${theme.eyebrow} mb-3`}>le podcast du marketing</Eyebrow>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-6">
            Abonne-toi
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-10 max-w-xl mx-auto">
            Un nouvel épisode chaque semaine, avec des invités et des analyses du moment.
            Choisis ta plateforme préférée et ne rate plus rien.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {SUBSCRIBE_LINKS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-4 bg-white dark:bg-neutral-800 text-plum-700 dark:text-plum-300 font-semibold text-sm uppercase tracking-wide hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ══ 4 · ÉPISODES ══ */}
      <section id="episodes" className="py-20 lg:py-28 bg-plum-50 dark:bg-neutral-950 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            className="max-w-2xl mb-12"
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <Eyebrow className={`${theme.eyebrow} mb-3`}>nouveaux épisodes chaque semaine</Eyebrow>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-5">
              Épisodes récents
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Des conversations sans détour pour construire un mindset solide, gagner en
              clarté et faire grandir ton business — épisode après épisode.
            </p>
          </motion.div>

          {/* Filtres catégories */}
          {categories.length > 1 && (
            <motion.div
              className="flex flex-wrap gap-2 mb-10"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? `${theme.buttonSolid} shadow-sm`
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-24">
              <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <AlertCircle className="w-8 h-8 text-error-500" />
              <p className="text-neutral-600 dark:text-neutral-400">Impossible de charger les épisodes.</p>
              <button onClick={load} className={`px-5 py-2 ${theme.buttonSolid} text-sm font-bold rounded-full transition-colors`}>
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

          {/* Épisode à la une */}
          {!loading && !error && featured && (
            <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <Link
                to={`/podcasts/${featured.slug}`}
                className="group block mb-12 rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:shadow-xl transition-all duration-300"
              >
                <div className="grid md:grid-cols-[320px_1fr]">
                  <div className="relative overflow-hidden aspect-square md:aspect-auto">
                    <img
                      src={featured.coverImage}
                      alt={featured.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      loading="eager"
                      width={640}
                      height={640}
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 ${theme.buttonSolid} text-xs font-bold rounded-full uppercase tracking-wider`}>
                        À la une
                      </span>
                    </div>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-between">
                    <div>
                      <Eyebrow className={`${theme.eyebrow} mb-3`}>
                        {featured.category || 'épisode'}
                      </Eyebrow>
                      <h3 className={`text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-snug ${theme.titleHover} transition-colors`}>
                        {featured.title}
                      </h3>
                      <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm line-clamp-3">
                        {featured.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-5 text-xs text-neutral-400">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featured.duration}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(featured.publishedAt)}</span>
                      </div>
                      <span className="flex items-center gap-2 px-5 py-2.5 bg-plum-600 text-white font-bold rounded-full text-sm group-hover:bg-plum-700 transition-colors">
                        <Play className="w-4 h-4" fill="currentColor" /> Écouter
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grille épisodes */}
          {!loading && !error && rest.length > 0 && (
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {rest.map((podcast) => (
                <motion.div key={podcast.id} variants={staggerItem}>
                  <Link
                    to={`/podcasts/${podcast.slug}`}
                    className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={podcast.coverImage}
                        alt={podcast.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        loading="lazy"
                        width={400}
                        height={300}
                      />
                      <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-plum-600 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">
                        {formatDate(podcast.publishedAt)}
                      </p>
                      <h3 className={`text-lg font-black tracking-tight text-neutral-900 dark:text-white ${theme.titleHover} transition-colors leading-snug mb-3`}>
                        {podcast.title}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-4">
                        {podcast.description}
                      </p>
                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
                        <span className="w-7 h-7 rounded-full bg-plum-50 dark:bg-plum-500/10 flex items-center justify-center">
                          <Play className={`w-3 h-3 ${theme.accentText} ml-0.5`} fill="currentColor" />
                        </span>
                        <span>{podcast.duration}</span>
                        {podcast.category && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-700">·</span>
                            <span>{podcast.category}</span>
                          </>
                        )}
                        {podcast.popularity !== undefined && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-700">·</span>
                            <span title="Score de popularité Spotify (0–100)">{podcast.popularity}/100</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══ 5 · TÉMOIGNAGES ══ */}
      <motion.section
        className={`py-20 lg:py-28 ${theme.sectionBg}`}
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1.5 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-plum-500" fill="currentColor" />
            ))}
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-12">
            Ils adorent le podcast
          </h2>

          <div className="relative">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-14 min-h-[180px]">
              {tPair.map((t) => (
                <figure key={t.id}>
                  <blockquote className="text-lg lg:text-xl font-medium text-neutral-700 dark:text-neutral-200 leading-relaxed mb-5">
                    « {t.quote} »
                  </blockquote>
                  <figcaption className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    — {t.name}
                  </figcaption>
                </figure>
              ))}
            </div>

            {tPages > 1 && (
              <div className="flex justify-center gap-3 mt-10">
                <button
                  onClick={() => setTIndex((i) => (i - 1 + tPages) % tPages)}
                  aria-label="Témoignages précédents"
                  className="w-11 h-11 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setTIndex((i) => (i + 1) % tPages)}
                  aria-label="Témoignages suivants"
                  className="w-11 h-11 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ══ 6 · CLUB DES DIGITOS ══ */}
      <motion.section
        className="py-20 lg:py-24 bg-white dark:bg-neutral-950"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 bg-plum-50 dark:bg-plum-400/10 border border-plum-200 dark:border-plum-400/20 text-plum-700 dark:text-plum-400 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase mb-6">
                <Users className="w-3.5 h-3.5" /> CLUB DES DIGITOS
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight mb-5">
                Sois là<br />quand ça se passe
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-base mb-8">
                En plus du podcast, je participe à des événements et j'en organise régulièrement.
                Les membres du Club sont les premiers informés — et souvent invités.
              </p>
              <Link
                to="/mon-espace"
                className={`inline-flex items-center gap-2 px-7 py-3.5 ${theme.buttonSolid} font-bold rounded-full transition-colors text-sm tracking-wide shadow-md shadow-plum-600/30`}
              >
                Rejoindre le Club <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-plum-400/15 border border-plum-400/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className={`w-5 h-5 ${theme.accentText}`} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Événements exclusifs</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">Conférences, masterclasses et rencontres — accès prioritaire et invitations réservés aux membres du Club.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-900 dark:bg-plum-400/10 border border-neutral-800 dark:border-plum-400/20 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-plum-400/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-plum-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white dark:text-plum-300 mb-1">Annonces en avant-première</h3>
                  <p className="text-sm text-neutral-400 dark:text-plum-400/70 leading-relaxed">Tu seras toujours le premier au courant de mes prochaines participations et des événements à ne pas rater.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400 text-sm">Abonnement annuel</span>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">19 900 <span className={`${theme.accentText} text-sm font-bold`}>FCFA</span></span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══ 7 · CTA VIDÉOS — encart menthe ══ */}
      <motion.section
        className="pb-20 lg:pb-28 bg-white dark:bg-neutral-950"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 items-stretch rounded-3xl overflow-hidden">
            <div className={`relative min-h-[280px] ${theme.sectionBg}`}>
              <video
                src={VIDEOS_CTA_VIDEO}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Le marketing en pratique"
              />
            </div>
            <div className="bg-plum-100 dark:bg-neutral-800 p-10 lg:p-16 flex flex-col justify-center">
              <Eyebrow className={`${theme.eyebrow} mb-3`}>découvre aussi</Eyebrow>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
                Le marketing en pratique
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-8 max-w-sm">
                Des vidéos pratiques sur ma chaîne pour aller encore plus loin, montrer
                les outils et passer à l'action.
              </p>
              <Link
                to="/videos"
                className={`inline-flex items-center gap-2 self-start px-7 py-3.5 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide uppercase`}
              >
                Voir les vidéos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
