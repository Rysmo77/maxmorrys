import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Eye, Calendar, ArrowRight, Loader2, AlertCircle, Clapperboard,
  Bell, Users, Video as VideoIcon, GraduationCap, Mic, Newspaper, Mail, TrendingUp,
} from 'lucide-react';
import AnimatedIcon from '../components/shared/AnimatedIcon';

function YtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
import { getPublishedVideos } from '../lib/firestore';
import { formatDate, truncate } from '../lib/utils';
import type { Video } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import VideoCard from '../components/shared/VideoCard';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.videos;

const viewportOnce = { once: true, amount: 0.2 } as const;
const YT_URL = 'https://youtube.com/@maxmorrys';
const PAGE_STEP = 9;

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);

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

  // Vidéo à la une = la plus récente (les vidéos arrivent triées par date DESC).
  const heroVideo = videos[0];

  // Classement par vues, hors vidéo à la une.
  const byViews = useMemo(
    () => [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)),
    [videos]
  );
  const trending = useMemo(
    () => byViews.filter((v) => v.id !== heroVideo?.id).slice(0, 3),
    [byViews, heroVideo]
  );
  const popular = useMemo(() => {
    const used = new Set([heroVideo?.id, ...trending.map((v) => v.id)]);
    return byViews.filter((v) => !used.has(v.id)).slice(0, 5);
  }, [byViews, heroVideo, trending]);

  // Section « Toutes les vidéos » : catalogue complet filtré par catégorie.
  const catalog = useMemo(
    () => (activeCategory === 'Tous' ? videos : videos.filter((v) => v.category === activeCategory)),
    [videos, activeCategory]
  );
  const visibleCatalog = catalog.slice(0, visibleCount);

  const selectCategory = (cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(PAGE_STEP);
  };

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

      {/* ── HERO : vidéo à la une + sidebar Tendance ── */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-950 pt-28 pb-16 lg:pt-36">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[10%] w-80 h-80 rounded-full bg-red-600/20 blur-[130px]" />
          <div className="absolute bottom-0 left-[15%] w-96 h-96 rounded-full bg-brand-700/15 blur-[160px]" />
        </div>

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Bandeau titre + abonnement */}
          <motion.div variants={staggerItem} className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <AnimatedIcon
                  icon={Clapperboard}
                  animation="float"
                  className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30"
                  iconClassName="w-5 h-5 text-red-500 dark:text-red-400"
                />
                <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
                  YOUTUBE
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-[0.95]">
                Le Marketing <span className={theme.accentText}>En Pratique</span>
              </h1>
            </div>
            <a
              href={YT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#FF0000] text-white text-sm font-bold hover:bg-red-700 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 shadow-lg shadow-red-900/30"
            >
              <YtIcon className="w-4 h-4" />
              S'abonner sur YouTube
            </a>
          </motion.div>

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
              <p className="text-neutral-600 dark:text-neutral-400">Impossible de charger les vidéos.</p>
              <button onClick={load} className={`px-5 py-2 ${theme.buttonSolid} text-sm font-bold rounded-full transition-colors`}>
                Réessayer
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-24">
              <YtIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400">Aucune vidéo disponible pour le moment.</p>
            </div>
          )}

          {/* Hero grid */}
          {!loading && !error && heroVideo && (
            <motion.div variants={staggerItem} className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-10">

              {/* Vidéo à la une */}
              <Link to={`/videos/${heroVideo.slug}`} className="group block">
                <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-neutral-200 dark:ring-white/10 shadow-2xl shadow-neutral-300/60 dark:shadow-black/60">
                  <img
                    src={heroVideo.thumbnailUrl}
                    alt={heroVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                    width={1280}
                    height={720}
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-9 h-9 text-neutral-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/75 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                    {heroVideo.duration}
                  </span>
                  <span className="absolute top-4 left-4 px-3 py-1.5 bg-[#FF0000] text-white text-xs font-black rounded-full uppercase tracking-wider">
                    Dernière vidéo
                  </span>
                </div>
                <div className="mt-5">
                  <p className={`text-xs font-bold tracking-[0.25em] uppercase ${theme.eyebrow} mb-2`}>
                    {heroVideo.category}
                  </p>
                  <h2 className={`text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight ${theme.titleHover} transition-colors mb-3`}>
                    {heroVideo.title}
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm line-clamp-2 mb-4 max-w-2xl">
                    {truncate(heroVideo.description, 160)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-500">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{heroVideo.views.toLocaleString()} vues</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(heroVideo.publishedAt)}</span>
                  </div>
                </div>
              </Link>

              {/* Sidebar Tendance */}
              <aside className="flex flex-col">
                {/* En-tête sombre */}
                <div className="relative overflow-hidden rounded-2xl bg-neutral-900 p-6 mb-5">
                  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-red-600/25 blur-[60px]" />
                  <YtIcon className="absolute -bottom-3 -right-2 w-24 h-24 text-white/5" />
                  <div className="relative z-10 flex items-center gap-2.5">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                    <h2 className="text-2xl font-black tracking-tight text-white leading-none">
                      Tendance<br />sur la chaîne
                    </h2>
                  </div>
                </div>

                {/* 3 vidéos les plus vues */}
                <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
                  {trending.map((v) => (
                    <Link key={v.id} to={`/videos/${v.slug}`} className="group flex gap-4 py-4 first:pt-0">
                      <div className="relative shrink-0 w-32 aspect-video rounded-lg overflow-hidden">
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          width={256}
                          height={144}
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded">
                          {v.duration}
                        </span>
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <h3 className={`text-sm font-black text-neutral-900 dark:text-white leading-snug line-clamp-2 ${theme.titleHover} transition-colors mb-1.5`}>
                          {v.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mb-2">
                          {formatDate(v.publishedAt)} · {v.views.toLocaleString()} vues
                        </p>
                        <span className={`self-start text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${theme.softBadge}`}>
                          {v.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {trending.length === 0 && (
                    <p className="text-sm text-neutral-400 py-4">Bientôt d'autres vidéos.</p>
                  )}
                </div>
              </aside>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── SECTION 2 : Vidéos populaires ── */}
      {!loading && !error && popular.length > 0 && (
        <motion.section
          className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
            Vidéos populaires
          </h2>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {popular[0] && (
              <motion.div variants={staggerItem}><VideoCard video={popular[0]} /></motion.div>
            )}

            {/* Carte CTA abonnement YouTube */}
            <motion.div variants={staggerItem}>
              <div className="relative h-full overflow-hidden rounded-2xl bg-neutral-900 p-7 flex flex-col justify-between min-h-[260px]">
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-red-600/30 blur-[70px]" />
                <YtIcon className="absolute -bottom-4 -right-3 w-28 h-28 text-white/5" />
                <div className="relative z-10">
                  <p className="text-xs font-bold tracking-[0.3em] uppercase text-red-400 mb-3">YOUTUBE</p>
                  <h3 className="text-2xl font-black tracking-tight text-white leading-tight mb-2">
                    Ne rate aucune vidéo
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Tutoriels, analyses et stratégies marketing — abonne-toi pour être notifié à chaque sortie.
                  </p>
                </div>
                <a
                  href={YT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex items-center gap-2 self-start mt-6 px-5 py-2.5 bg-[#FF0000] text-white text-sm font-bold rounded-full hover:bg-red-700 transition-colors"
                >
                  <YtIcon className="w-4 h-4" /> S'abonner
                </a>
              </div>
            </motion.div>

            {popular.slice(1).map((video) => (
              <motion.div key={video.id} variants={staggerItem}><VideoCard video={video} /></motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ── SECTION 3 : Explore les thèmes ── */}
      <motion.section
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
          Explore les thèmes
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formations */}
          <Link
            to="/formations"
            className="group relative overflow-hidden rounded-3xl h-64 lg:h-72 flex flex-col justify-end p-8 bg-gradient-to-br from-brand-600 to-brand-800"
          >
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-400/30 blur-[80px]" />
            <GraduationCap className="absolute top-6 right-6 w-28 h-28 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <h3 className="text-3xl font-black tracking-tight text-white mb-2">
                Passe à la pratique
              </h3>
              <p className="text-white/80 text-sm max-w-sm">
                Des formations complètes pour transformer ce que tu apprends en vidéo en résultats concrets.
              </p>
              <span className="inline-flex items-center gap-2 mt-4 text-white font-bold text-sm">
                Voir les formations <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Podcast */}
          <Link
            to="/podcasts"
            className="group relative overflow-hidden rounded-3xl h-64 lg:h-72 flex flex-col justify-end p-8 bg-gradient-to-br from-plum-600 to-neutral-900"
          >
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-plum-400/30 blur-[80px]" />
            <Mic className="absolute top-6 right-6 w-28 h-28 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <h3 className="text-3xl font-black tracking-tight text-white mb-2">
                Le Podcast du Marketing
              </h3>
              <p className="text-white/80 text-sm max-w-sm">
                Analyses et réflexions en audio — à écouter n'importe où, n'importe quand.
              </p>
              <span className="inline-flex items-center gap-2 mt-4 text-white font-bold text-sm">
                Écouter le podcast <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </motion.section>

      {/* ── SECTION 4 : Club des Digitos ── */}
      <motion.section
        className="py-16 bg-white dark:bg-neutral-950"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-plum-400/10 blur-[120px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-600/10 blur-[100px]" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-10 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full px-3 py-1 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                  </span>
                  <span className="text-xs font-bold tracking-[0.25em] uppercase text-plum-400">CLUB DES DIGITOS</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white leading-[0.95] mb-5">
                  Rejoins mes<br />sessions Live
                </h2>
                <p className="text-neutral-400 leading-relaxed text-base mb-8">
                  Les vidéos, c'est en replay. Mais dans le Club, je fais des sessions Live interactives où tu peux poser tes questions en direct et vraiment progresser avec moi.
                </p>
                <Link
                  to="/mon-espace"
                  className="inline-flex items-center gap-2 self-start px-7 py-3.5 bg-plum-600 text-white font-black rounded-full hover:bg-plum-700 transition-colors text-sm tracking-wide shadow-lg shadow-plum-600/20"
                >
                  Rejoindre le Club <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: features */}
              <div className="p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-center gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-plum-400/15 border border-plum-400/20 flex items-center justify-center flex-shrink-0">
                    <VideoIcon className="w-5 h-5 text-plum-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">Sessions Live avec moi</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Des séances interactives en direct où je réponds à tes questions et on travaille ensemble en temps réel.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-plum-400/15 border border-plum-400/20 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-plum-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">Notifications exclusives</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Ne manque jamais un Live : les membres sont notifiés en priorité avant tout le monde.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 rounded-xl bg-plum-400/15 border border-plum-400/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-plum-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">Communauté active</h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">Rejoins un réseau de professionnels du digital pour avancer ensemble après chaque Live.</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">19 900</span>
                  <span className="text-plum-400 font-bold">FCFA / an</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 5 : Ressources ── */}
      <motion.section
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-8 text-center">
          Ressources Max-Morrys
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { to: '/blog', icon: Newspaper, color: 'text-brand-400', bg: 'bg-brand-400/15', title: 'Le Blog', desc: 'Articles, analyses et conseils pratiques en marketing digital, SEO et IA.' },
            { to: '/formations', icon: GraduationCap, color: 'text-plum-400', bg: 'bg-plum-400/15', title: 'Les Formations', desc: 'Des parcours structurés pour monter en compétences à ton rythme.' },
            { to: '/contact', icon: Mail, color: 'text-red-400', bg: 'bg-red-400/15', title: 'Me contacter', desc: 'Une question, un projet ? Écris-moi, je te réponds personnellement.' },
          ].map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group relative overflow-hidden rounded-2xl bg-neutral-900 p-8 flex flex-col"
            >
              <div className={`w-12 h-12 rounded-xl ${r.bg} flex items-center justify-center mb-5`}>
                <r.icon className={`w-6 h-6 ${r.color}`} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-white mb-2">{r.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed flex-1">{r.desc}</p>
              <span className="inline-flex items-center gap-2 mt-5 text-white font-bold text-sm">
                Découvrir <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 6 : Toutes les vidéos ── */}
      {!loading && !error && videos.length > 0 && (
        <motion.section
          className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-7">
              Toutes les vidéos
            </h2>

            {/* Onglets de catégories */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2.5 mb-10">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      activeCategory === cat
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                        : 'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {catalog.length > 0 ? (
              <>
                <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {visibleCatalog.map((video) => (
                    <motion.div key={video.id} variants={staggerItem}>
                      <VideoCard video={video} />
                    </motion.div>
                  ))}
                </motion.div>

                {visibleCount < catalog.length && (
                  <div className="text-center mt-12">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_STEP)}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 text-sm font-bold text-neutral-900 dark:text-white hover:bg-neutral-900 hover:border-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors"
                    >
                      Voir plus de vidéos
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400">Aucune vidéo dans cette catégorie.</p>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}
