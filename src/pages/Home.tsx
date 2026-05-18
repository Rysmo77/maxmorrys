import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star, Target, Zap, BarChart3, Play, Headphones, BadgeCheck, Infinity as InfinityIcon, Shield, Mail } from 'lucide-react';
import { getPublishedFormations, getPublishedPosts, getFeaturedTestimonials, getPublishedPodcasts } from '../lib/firestore';
import { truncate } from '../lib/utils';
import { categoryToPole } from '../lib/blogCategories';
import type { Formation, BlogPost, Testimonial, Podcast } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes, universeFromPath } from '../lib/sectionThemes';
import EditorialHeading, { CircularBadge } from '../components/shared/EditorialHeading';
import CourseLibraryCard from '../components/formations/CourseLibraryCard';
import NewsletterForm from '../components/shared/NewsletterForm';
import CountUp from '../components/shared/CountUp';
import ParallaxImage from '../components/shared/ParallaxImage';

const viewportOnce = { once: true, amount: 0.2 } as const;

const PROFILE_IMG = 'https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/A-propos%2FChatGPT%20Image%2014%20mai%202026%2C%2000_49_18%20(3).png?alt=media&token=cc4027ff-c053-40a3-8b22-28d5603ee729';

const stats = [
  { value: 340, prefix: '+', suffix: '%', label: 'Croissance de trafic en 1 an' },
  { value: 50, prefix: '', suffix: '+', label: 'Étudiants formés' },
  { value: 94, prefix: '', suffix: '%', label: 'Taux de réussite' },
  { value: 10, prefix: '', suffix: '+', label: 'Cours créés' },
];

const services = [
  { icon: Target, title: 'Je te forme', desc: 'Des formations pratiques et actionnables pour maîtriser le digital.', link: '/formations' },
  { icon: Zap, title: "Je t'informe", desc: 'Articles, podcasts et vidéos pour rester à la pointe.', link: '/blog' },
  { icon: BarChart3, title: 'Je te transforme', desc: 'Coaching et consulting pour accélérer ta croissance.', link: '/contact' },
];

const trustBadges = [
  { icon: BadgeCheck, title: 'Certificat inclus', desc: 'Chaque formation délivre un certificat vérifiable.' },
  { icon: InfinityIcon, title: 'Accès à vie', desc: 'Tes formations restent accessibles sans limite.' },
  { icon: Shield, title: 'Garantie satisfait', desc: 'Remboursement sous 7 jours si insatisfaction.' },
];

/** Indicateur de défilement animé — souris stylisée avec point qui descend. */
function ScrollCue() {
  const reduced = useReducedMotion();
  return (
    <div className="w-6 h-10 rounded-full border-2 border-white/50 flex justify-center pt-2">
      <motion.div
        className="w-1 h-2 rounded-full bg-white/70"
        animate={reduced ? undefined : { y: [0, 10, 0], opacity: [0.9, 0.2, 0.9] }}
        transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/** Accent Newsletter — icône Mail avec léger flottement vertical. */
function FloatingMail() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center"
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Mail className="w-7 h-7 text-brand-400" />
    </motion.div>
  );
}

function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const t = testimonials[active];
  if (!t) return null;

  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="min-h-[240px] flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-1 mb-6 justify-center">
          {[...Array(t.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-accent-500 fill-accent-500" />
          ))}
        </div>
        <p className="text-xl lg:text-2xl font-bold italic text-neutral-800 dark:text-neutral-100 leading-snug mb-8 transition-opacity duration-500">
          «&nbsp;{t.content}&nbsp;»
        </p>
        <div className="flex items-center justify-center gap-3">
          {t.avatar && <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" loading="lazy" />}
          <div className="text-left">
            <p className="font-bold text-neutral-900 dark:text-white text-sm">{t.name}</p>
            <p className="text-xs text-neutral-500">{t.role}{t.company ? `, ${t.company}` : ''}</p>
          </div>
        </div>
      </div>
      {testimonials.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? 'bg-brand-500 w-6' : 'bg-neutral-300 dark:bg-neutral-600 w-2'
              }`}
              aria-label={`Témoignage ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [recentPodcasts, setRecentPodcasts] = useState<Podcast[]>([]);
  const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    getPublishedFormations().then(setFormations).catch(() => {});
    getPublishedPosts(5).then(setRecentPosts).catch(() => {});
    getPublishedPodcasts().then(setRecentPodcasts).catch(() => {});
    getFeaturedTestimonials().then(setFeaturedTestimonials).catch(() => {});
  }, []);

  const featuredFormations = formations.filter((f) => f.featured).slice(0, 3);
  const featuredPost = recentPosts[0];
  const listPosts = recentPosts.slice(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFading, setVideoFading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      setVideoFading(remaining < 1.2 || video.currentTime < 0.6);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  return (
    <div>
      <SEOHead title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} isHomePage />
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: DEFAULT_OG_IMAGE,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+221776041985',
            contactType: 'customer service',
            areaServed: ['SN', 'CI', 'CM', 'FR'],
            availableLanguage: 'French',
          },
          sameAs: [
            'https://www.linkedin.com/in/maxmorrys',
            'https://www.youtube.com/@maxmorrys',
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: 'fr',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/blog?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Max-Morrys',
          url: SITE_URL,
          image: DEFAULT_OG_IMAGE,
          jobTitle: 'Expert en marketing digital, SEO et IA',
          worksFor: { '@type': 'Organization', name: SITE_NAME },
          sameAs: [
            'https://www.linkedin.com/in/maxmorrys',
            'https://www.youtube.com/@maxmorrys',
          ],
        },
      ]} />

      {/* ── HERO : vidéo plein écran + typographie éditoriale ── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950">
          <video
            ref={videoRef}
            src="https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/Le%20Marketing%20en%20Pratique.mp4?alt=media&token=7aebaa77-b33a-4494-92e4-9c3cfdc433c1"
            poster={DEFAULT_OG_IMAGE}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={`w-full h-full object-cover transition-opacity duration-[1200ms] ${videoFading ? 'opacity-0' : 'opacity-100'}`}
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        <motion.div
          className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={staggerItem}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] max-w-5xl text-balance"
          >
            Maîtrise le <span className="text-brand-400">digital</span>, accélère ta{' '}
            <span className="italic text-accent-400">croissance</span>.
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mt-7 max-w-xl text-base sm:text-lg text-white/75 leading-relaxed"
          >
            Formations, articles, podcast et vidéos pour transformer ton activité — SEO, IA et marketing digital, sans blabla.
          </motion.p>
          <motion.div variants={staggerItem}>
            <Link
              to="/formations"
              className="mt-9 inline-flex items-center gap-2.5 bg-white text-neutral-900 font-bold text-sm px-8 py-4 rounded-full hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
            >
              Explorer les formations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <ScrollCue />
          </div>
        </motion.div>
      </section>

      {/* ── MANIFESTE : "J'aide les entrepreneurs..." ── */}
      <motion.section
        className="py-24 lg:py-36 bg-neutral-50 dark:bg-neutral-900"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorialHeading
            as="h2"
            eyebrow="Bonjour, moi c'est Max-Morrys"
            eyebrowColor="morrys"
            className="max-w-4xl mb-14 lg:mb-20"
            segments={[
              { text: "J'aide les " },
              { text: 'entrepreneurs', color: 'brand' },
              { text: ' à ' },
              { text: 'transformer', color: 'accent' },
              { text: ' leurs idées en ' },
              { text: 'business rentables', color: 'coral' },
              { text: '.' },
            ]}
          />

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Texte + verbes */}
            <div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-10 max-w-lg">
                Formateur et consultant en marketing digital, SEO et intelligence artificielle.
                Pas besoin d'une audience énorme ni d'y passer tes nuits : il te faut un plan clair
                et la prochaine étape. Voici ce que je fais pour toi.
              </p>

              <motion.div
                className="border-t border-neutral-200 dark:border-neutral-700"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {services.map((service) => {
                  const theme = universeThemes[universeFromPath(service.link)];
                  return (
                    <motion.div key={service.title} variants={staggerItem}>
                      <Link
                        to={service.link}
                        className="group flex items-start gap-5 py-6 border-b border-neutral-200 dark:border-neutral-700 hover:pl-2 transition-all duration-300"
                      >
                        <service.icon className={`w-5 h-5 mt-0.5 shrink-0 ${theme.accentText}`} />
                        <div className="flex-1">
                          <p className={`text-lg font-bold text-neutral-900 dark:text-white ${theme.titleHover} transition-colors`}>
                            {service.title}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{service.desc}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 mt-1 shrink-0 text-neutral-300 dark:text-neutral-600 ${theme.titleHover} group-hover:translate-x-1 transition-all`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              <Link
                to="/formations"
                className="mt-10 inline-flex items-center gap-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm px-7 py-3.5 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
              >
                Voir les nouveautés
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Image + badge circulaire */}
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem]">
                <img src={PROFILE_IMG} alt="Max-Morrys" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <CircularBadge
                text="Ravi de te rencontrer"
                center="MM"
                className="absolute -top-6 -left-6 w-28 h-28 hidden lg:block"
              />
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-5 hidden sm:block">
                <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">50+</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">étudiants formés</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── STATS : superposées sur image plein-largeur ── */}
      <motion.section
        className="relative overflow-hidden"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="relative min-h-[440px] lg:min-h-[540px]">
          <ParallaxImage
            src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Équipe au travail"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/65 to-neutral-950/25" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/55 mb-10">
              Les chiffres parlent
            </p>
            <motion.div
              className="space-y-5 lg:space-y-6 max-w-xl"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerItem}
                  className="flex items-baseline gap-5 border-b border-white/15 pb-5"
                >
                  <CountUp
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="text-4xl lg:text-6xl font-black text-white shrink-0"
                  />
                  <span className="text-xs lg:text-sm font-bold tracking-[0.2em] uppercase text-white/70">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── CATALOGUE DE FORMATIONS : dossiers à onglets ── */}
      {featuredFormations.length > 0 && (
        <motion.section
          className="relative py-24 lg:py-36 overflow-hidden"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="absolute inset-0">
            <ParallaxImage src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1600" />
            <div className="absolute inset-0 bg-neutral-950/60 dark:bg-neutral-950/75" />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-16">
              <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/60 mb-5">
                Le catalogue
              </p>
              <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-white text-balance">
                Range tes compétences dans le bon dossier.
              </h2>
            </div>

            <motion.div
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {featuredFormations.map((formation, i) => (
                <motion.div key={formation.id} variants={staggerItem}>
                  <CourseLibraryCard formation={formation} index={i} />
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-12">
              <Link
                to="/formations"
                className="group inline-flex items-center gap-2.5 bg-white text-neutral-900 font-bold text-sm px-8 py-4 rounded-full hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
              >
                Découvrir toutes les formations
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── QUIZ / NIVEAU : "Prêt à accélérer ?" ── */}
      <motion.section
        className="relative bg-accent-500 overflow-hidden"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="grid lg:grid-cols-2">
          <div className="px-6 sm:px-10 lg:px-16 py-20 lg:py-32 flex flex-col justify-center order-2 lg:order-1">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/80 mb-6">
              Passe au niveau supérieur
            </p>
            <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-white text-balance mb-6">
              Prêt à <span className="italic text-neutral-900">accélérer</span> ?
            </h2>
            <p className="text-white/90 leading-relaxed mb-9 max-w-md">
              Pas un jeu vidéo, mais ton activité IRL. Choisis le bon point de départ et passe
              à l'action avec une formation taillée pour ton objectif.
            </p>
            <Link
              to="/formations"
              className="group inline-flex w-fit items-center gap-2.5 bg-white text-accent-700 font-bold text-sm px-8 py-4 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
            >
              Trouve ta formation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="relative min-h-[340px] order-1 lg:order-2">
            <img
              src="https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Passer au niveau supérieur"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </motion.section>

      {/* ── PODCAST & YOUTUBE ── */}
      <motion.section
        className="relative overflow-hidden"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="absolute inset-0">
          <ParallaxImage src="https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&cs=tinysrgb&w=1600" />
          <div className="absolute inset-0 bg-neutral-950/82" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-white">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/55 mb-5">
            Contenu 100% gratuit
          </p>
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance max-w-3xl mb-6">
            Le <span className="text-plum-400">Podcast</span> &amp; la chaîne{' '}
            <span className="text-red-400">YouTube</span>.
          </h2>
          <p className="text-white/75 leading-relaxed max-w-xl">
            Des conseils actionnables en marketing digital, SEO et IA — dans tes oreilles ou sur ton écran.
          </p>

          {recentPodcasts.length > 0 && (
            <div className="mt-14">
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/45 mb-2">
                Épisodes populaires
              </p>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {recentPodcasts.slice(0, 5).map((podcast, i) => (
                  <motion.div key={podcast.id} variants={staggerItem}>
                    <Link
                      to={`/podcasts/${podcast.slug}`}
                      className="group flex items-center gap-5 py-4 border-b border-white/12"
                    >
                      <span className="text-xl font-bold text-white/40 w-8 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-semibold text-white/90 group-hover:text-plum-300 transition-colors leading-snug">
                        {podcast.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-12">
            <Link
              to="/podcasts"
              className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors ${universeThemes.podcasts.buttonSolid}`}
            >
              <Headphones className="w-4 h-4" />
              Écouter le podcast
            </Link>
            <Link
              to="/videos"
              className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors ${universeThemes.videos.buttonSolid}`}
            >
              <Play className="w-4 h-4" />
              Voir les vidéos
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── BLOG : "Pas ton blog business habituel" ── */}
      {recentPosts.length > 0 && (
        <motion.section
          className={`py-24 lg:py-36 ${universeThemes.blog.sectionBg}`}
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EditorialHeading
              as="h2"
              align="center"
              eyebrow="Le journal"
              eyebrowColor="coral"
              className="mb-14 lg:mb-20"
              segments={[
                { text: 'Pas ton ' },
                { text: 'blog business', color: 'coral' },
                { text: ' habituel.' },
              ]}
            />

            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-start">
              {/* Article vedette */}
              {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`} className="group block">
                  <div className="aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] overflow-hidden rounded-[2rem] mb-6">
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <p className={`text-xs font-bold tracking-[0.25em] uppercase ${universeThemes.blog.eyebrow} mb-3`}>
                    {categoryToPole(featuredPost.category)} · {featuredPost.readTime} min
                  </p>
                  <h3 className={`text-2xl lg:text-3xl font-black tracking-tight leading-[1.15] text-neutral-900 dark:text-white ${universeThemes.blog.titleHover} transition-colors`}>
                    {featuredPost.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 max-w-md">
                    {truncate(featuredPost.excerpt, 120)}
                  </p>
                </Link>
              )}

              {/* Liste catégorisée */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {listPosts.map((post) => (
                  <motion.div key={post.id} variants={staggerItem}>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group flex items-center gap-5 py-6 border-b border-neutral-200 dark:border-neutral-700 first:border-t"
                    >
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[0.7rem] font-bold tracking-[0.2em] uppercase ${universeThemes.blog.eyebrow} mb-1.5`}>
                          {categoryToPole(post.category)}
                        </p>
                        <h4 className={`text-lg font-bold leading-snug text-neutral-900 dark:text-white ${universeThemes.blog.titleHover} transition-colors`}>
                          {post.title}
                        </h4>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-coral-500 dark:group-hover:text-coral-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </motion.div>
                ))}

                <motion.div variants={staggerItem} className="mt-10">
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2.5 border border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold text-sm px-8 py-4 rounded-full hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors"
                  >
                    Lire tous les articles
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── OFFRE PHARE + CRÉDIBILITÉ ── */}
      <motion.section
        className="relative bg-brand-700 text-white overflow-hidden"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[340px]">
            <img
              src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="La méthode Max-Morrys"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-brand-900/30" />
          </div>
          <div className="px-6 sm:px-10 lg:px-16 py-20 lg:py-32 flex flex-col justify-center">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-200 mb-6">
              La méthode complète
            </p>
            <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance mb-6">
              Tout ce qu'il te faut pour réussir en ligne.
            </h2>
            <p className="text-brand-100 leading-relaxed mb-10 max-w-md">
              Des formations structurées, du concret et un accompagnement clair —
              de la première vidéo à ton activité qui tourne.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {trustBadges.map((badge) => (
                <div key={badge.title} className="flex flex-col gap-2">
                  <badge.icon className="w-6 h-6 text-accent-300" />
                  <p className="font-bold text-sm text-white">{badge.title}</p>
                  <p className="text-xs text-brand-200 leading-relaxed">{badge.desc}</p>
                </div>
              ))}
            </div>

            <Link
              to="/formations"
              className="group inline-flex w-fit items-center gap-2.5 bg-white text-brand-700 font-bold text-sm px-8 py-4 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
            >
              Commencer maintenant
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── TÉMOIGNAGES ── */}
      {featuredTestimonials.length > 0 && (
        <motion.section
          className="py-24 lg:py-36 bg-white dark:bg-neutral-950"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EditorialHeading
              as="h2"
              align="center"
              eyebrow="La communauté"
              eyebrowColor="brand"
              className="mb-16"
              segments={[
                { text: 'Ils en parlent mieux ' },
                { text: 'que moi', color: 'brand' },
                { text: '.' },
              ]}
            />
            <TestimonialCarousel testimonials={featuredTestimonials} />
          </div>
        </motion.section>
      )}

      {/* ── NEWSLETTER : "Du concret dans ta boîte mail" ── */}
      <motion.section
        className="relative overflow-hidden"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="absolute inset-0">
          <ParallaxImage src="https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=1600" />
          <div className="absolute inset-0 bg-neutral-950/85" />
        </div>
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center text-white">
          <FloatingMail />
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/55 mb-5">
            La newsletter
          </p>
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance mb-5">
            Du <span className="italic text-brand-400">concret</span> dans ta boîte mail.
          </h2>
          <p className="text-white/75 leading-relaxed mb-9">
            Chaque semaine : mes meilleures découvertes, mes stratégies qui marchent et des
            défis pour faire avancer ton activité. Gratuit, sans spam.
          </p>
          <div className="max-w-md mx-auto text-left">
            <NewsletterForm variant="inline" source="home" />
          </div>
        </div>
      </motion.section>

      {/* ── CTA FINAL ── */}
      <motion.section
        className="py-24 lg:py-28 bg-gradient-to-br from-brand-600 to-brand-800 text-white"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance mb-5">
            Prêt à transformer ton business ?
          </h2>
          <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Que tu sois entrepreneur, marketeur ou en reconversion, il y a une formation faite pour toi.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/formations"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-full hover:bg-brand-50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm"
            >
              Voir les formations <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center border border-white/40 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 text-sm"
            >
              Prendre contact
            </Link>
          </div>
        </div>
      </motion.section>

    </div>
  );
}
