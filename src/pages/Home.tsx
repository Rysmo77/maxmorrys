import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../components/shared/LocalizedLink';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Star, Target, Zap, BarChart3, Play, Headphones, BadgeCheck, Infinity as InfinityIcon, Shield, Mail } from 'lucide-react';
// Imports directs plutôt que via le barrel `lib/firestore` : celui-ci fait
// `export *` sur 17 modules, ce qui en tirait plusieurs dans le chunk d'entrée.
import { getPublishedFormations } from '../lib/firestore/formations';
import { getPublishedPosts } from '../lib/firestore/blog';
import { getFeaturedTestimonials, getPublishedPodcasts } from '../lib/firestore/content';
import { queryKeys } from '../lib/queryClient';
import { truncate } from '../lib/utils';
import { categoryToPole } from '../lib/blogCategories';
import type { Testimonial } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_URLS, CONTACT_PHONE_E164 } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes, universeFromPath } from '../lib/sectionThemes';
import EditorialHeading, { CircularBadge } from '../components/shared/EditorialHeading';
import CourseLibraryCard from '../components/formations/CourseLibraryCard';
import TranslatedText from '../components/shared/TranslatedText';
import NewsletterForm from '../components/shared/NewsletterForm';
import CountUp from '../components/shared/CountUp';
import ParallaxImage from '../components/shared/ParallaxImage';

const viewportOnce = { once: true, amount: 0.2 } as const;

const PROFILE_IMG = 'https://media.maxmorrys.me/A-propos/ChatGPT%20Image%2014%20mai%202026%2C%2000_49_18%20(3).png';

const stats = [
  { value: 340, prefix: '+', suffix: '%', labelKey: 'stats.trafficGrowth' },
  { value: 50, prefix: '', suffix: '+', labelKey: 'stats.studentsTrained' },
  { value: 94, prefix: '', suffix: '%', labelKey: 'stats.successRate' },
  { value: 10, prefix: '', suffix: '+', labelKey: 'stats.coursesCreated' },
];

const services = [
  { icon: Target, titleKey: 'services.train.title', descKey: 'services.train.desc', link: '/formations' },
  { icon: Zap, titleKey: 'services.inform.title', descKey: 'services.inform.desc', link: '/blog' },
  { icon: BarChart3, titleKey: 'services.transform.title', descKey: 'services.transform.desc', link: '/contact' },
];

const trustBadges = [
  { icon: BadgeCheck, titleKey: 'trustBadges.certificate.title', descKey: 'trustBadges.certificate.desc' },
  { icon: InfinityIcon, titleKey: 'trustBadges.lifetime.title', descKey: 'trustBadges.lifetime.desc' },
  { icon: Shield, titleKey: 'trustBadges.guarantee.title', descKey: 'trustBadges.guarantee.desc' },
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
  const { t: translate } = useTranslation('home');
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
        {t.mediaType === 'video' && t.mediaUrl && (
          <video src={t.mediaUrl} controls playsInline className="w-full max-w-md max-h-72 rounded-xl bg-black mb-6" />
        )}
        {t.mediaType === 'audio' && t.mediaUrl && (
          <audio src={t.mediaUrl} controls className="w-full max-w-md mb-6" />
        )}
        {t.content && (
          <p className="text-xl lg:text-2xl font-bold italic text-neutral-800 dark:text-neutral-100 leading-snug mb-8 transition-opacity duration-500">
            «&nbsp;{t.content}&nbsp;»
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          {t.avatar && <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" loading="lazy" width={44} height={44} />}
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
              aria-label={translate('testimonialAria', { number: i + 1 })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation('home');
  /*
    Lectures mises en cache et partagées (cf. `lib/queryClient`). Les listes
    formations/podcasts servent aussi aux pages catalogue, à l'arbitre de pop-ups
    et à la recherche : sous la même clé, elles ne sont lues qu'une fois.
  */
  const { data: formations = [] } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });
  const { data: recentPosts = [] } = useQuery({
    queryKey: queryKeys.homeRecentPosts,
    queryFn: () => getPublishedPosts(5),
  });
  const { data: recentPodcasts = [] } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const { data: featuredTestimonials = [] } = useQuery({
    queryKey: queryKeys.featuredTestimonials,
    queryFn: () => getFeaturedTestimonials(),
  });

  const featuredFormations = useMemo(
    () => formations.filter((f) => f.featured).slice(0, 3),
    [formations],
  );
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
            telephone: CONTACT_PHONE_E164,
            contactType: 'customer service',
            areaServed: ['SN', 'CI', 'CM', 'FR'],
            availableLanguage: 'French',
          },
          sameAs: [...SOCIAL_URLS],
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
          // ⚠️ Doit rester IDENTIQUE au `jobTitle` du Person de /a-propos : c'est la même
          // personne, avec les mêmes profils `sameAs`. Trois libellés concurrents coexistaient
          // sur le site avant le 13 août 2026.
          jobTitle: 'Marketing & Growth Manager',
          // ⚠️ `worksFor` diverge de /a-propos, qui déclare Eyone Medical. C'est une question
          // de fond — qui emploie qui — laissée ouverte. Voir docs/CONTENT-TODO.md.
          worksFor: { '@type': 'Organization', name: SITE_NAME },
          sameAs: [...SOCIAL_URLS],
        },
      ]} />

      {/* ── HERO : vidéo plein écran + typographie éditoriale ── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950">
          <video
            ref={videoRef}
            src="https://media.maxmorrys.me/Le%20Marketing%20en%20Pratique.mp4"
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
            {t('hero.titlePart1')}<span className="text-brand-400">{t('hero.titleDigital')}</span>{t('hero.titlePart2')}{' '}
            <span className="italic text-accent-400">{t('hero.titleGrowth')}</span>{t('hero.titleEnd')}
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mt-7 max-w-xl text-base sm:text-lg text-white/75 leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div variants={staggerItem}>
            <LocalizedLink
              to="/formations"
              className="mt-9 inline-flex items-center gap-2.5 bg-white text-neutral-900 font-bold text-sm px-8 py-4 rounded-full hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
            >
              {t('hero.cta')}
              <ArrowRight className="w-4 h-4" />
            </LocalizedLink>
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
            eyebrow={t('manifesto.eyebrow')}
            eyebrowColor="morrys"
            className="max-w-4xl mb-14 lg:mb-20"
            segments={[
              { text: t('manifesto.headingHelp') },
              { text: t('manifesto.headingEntrepreneurs'), color: 'brand' },
              { text: t('manifesto.headingTo') },
              { text: t('manifesto.headingTransform'), color: 'accent' },
              { text: t('manifesto.headingIdeas') },
              { text: t('manifesto.headingBusiness'), color: 'coral' },
              { text: t('manifesto.headingEnd') },
            ]}
          />

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Texte + verbes */}
            <div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-10 max-w-lg">
                {t('manifesto.intro')}
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
                    <motion.div key={service.titleKey} variants={staggerItem}>
                      <LocalizedLink
                        to={service.link}
                        className="group flex items-start gap-5 py-6 border-b border-neutral-200 dark:border-neutral-700 hover:pl-2 transition-all duration-300"
                      >
                        <service.icon className={`w-5 h-5 mt-0.5 shrink-0 ${theme.accentText}`} />
                        <div className="flex-1">
                          <p className={`text-lg font-bold text-neutral-900 dark:text-white ${theme.titleHover} transition-colors`}>
                            {t(service.titleKey)}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t(service.descKey)}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 mt-1 shrink-0 text-neutral-300 dark:text-neutral-600 ${theme.titleHover} group-hover:translate-x-1 transition-all`} />
                      </LocalizedLink>
                    </motion.div>
                  );
                })}
              </motion.div>

              <LocalizedLink
                to="/formations"
                className="mt-10 inline-flex items-center gap-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm px-7 py-3.5 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
              >
                {t('manifesto.ctaNew')}
                <ArrowRight className="w-4 h-4" />
              </LocalizedLink>
            </div>

            {/* Image + badge circulaire */}
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem]">
                <img src={PROFILE_IMG} alt={t('manifesto.imageAlt')} className="w-full h-full object-cover" loading="lazy" width={640} height={800} />
              </div>
              <CircularBadge
                text={t('manifesto.badgeText')}
                center="MM"
                className="absolute -top-6 -left-6 w-28 h-28 hidden lg:block"
              />
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-5 hidden sm:block">
                <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">{t('manifesto.statValue')}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">{t('manifesto.statLabel')}</p>
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
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center md:bg-fixed"
            style={{ backgroundImage: 'url(/chiffres-parlent.webp)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/65 to-neutral-950/25" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/55 mb-10">
              {t('stats2.eyebrow')}
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
                  key={stat.labelKey}
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
                    {t(stat.labelKey)}
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
                {t('catalog.eyebrow')}
              </p>
              <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-white text-balance">
                {t('catalog.heading')}
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
              <LocalizedLink
                to="/formations"
                className="group inline-flex items-center gap-2.5 bg-white text-neutral-900 font-bold text-sm px-8 py-4 rounded-full hover:bg-brand-50 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
              >
                {t('catalog.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </LocalizedLink>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── BUILD WITH ME : Max-Morrys Agency ──
          La bifurcation principale du site : après le catalogue de formations, le visiteur
          qui ne veut pas apprendre mais faire construire trouve sa porte. Sobre et sombre,
          délibérément : c'est le registre premium de l'agence, pas l'aplat commercial.
          Voir docs/BRAND-ARCHITECTURE.md §2.

          ⚠️ Bloc centré, SANS carte ni grille — et ce n'est pas un oubli. Cette section
          déclarait `grid lg:grid-cols-2` avec un seul enfant : la moitié droite restait vide
          et la section passait pour une version appauvrie de PRÉSENCE DIGITALE, qui la
          suivait immédiatement avec ses quatre cartes. Deux offres sans rapport (fondateurs
          et PME au vouvoiement ici, commerces de proximité au tutoiement là-bas) ne doivent
          jamais partager un squelette. Ne pas « compléter » avec des cartes : la valeur de ce
          bloc tient à la typographie et au vide autour. Voir docs/UX-AUDIT.md §7. */}
      <motion.section
        className="bg-neutral-950 text-white"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase mb-5 text-lagoon-400">
            {t('agency.eyebrow')}
          </p>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-balance mb-5">
            {t('agency.heading')}
          </h2>
          <p className="text-lg leading-relaxed text-neutral-300 mb-6 max-w-xl mx-auto">
            {t('agency.desc')}
          </p>
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-500 mb-8">
            {t('agency.disciplines')}
          </p>
          <LocalizedLink
            to="/agence"
            className="group inline-flex items-center gap-2.5 bg-lagoon-500 text-neutral-900 font-bold text-sm px-8 py-4 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
          >
            {t('agency.cta')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </LocalizedLink>
        </div>
      </motion.section>

      {/* ── QUIZ / NIVEAU : "Prêt à accélérer ?" ──
          ⚠️ Cette section sépare volontairement les deux blocs commerciaux du site. Elle
          suivait PRÉSENCE DIGITALE ; elle la précède désormais. L'agence (neutral-950) et
          l'offre commerce local (aplat lagoon) se touchaient, et leur voisinage les faisait
          lire comme deux variantes d'une même offre. L'orange s'intercale et rompt à la fois
          le scroll et la parenté chromatique. Ne pas réordonner sans relire
          docs/AGENCY-POSITIONING.md §9. */}
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
              {t('quiz.eyebrow')}
            </p>
            <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-white text-balance mb-6">
              {t('quiz.headingReady')}<span className="italic text-neutral-900">{t('quiz.headingAccelerate')}</span>{t('quiz.headingEnd')}
            </h2>
            <p className="text-white/90 leading-relaxed mb-9 max-w-md">
              {t('quiz.desc')}
            </p>
            <LocalizedLink
              to="/formations"
              className="group inline-flex w-fit items-center gap-2.5 bg-white text-accent-700 font-bold text-sm px-8 py-4 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
            >
              {t('quiz.cta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </LocalizedLink>
          </div>
          <div className="relative min-h-[340px] order-1 lg:order-2">
            <img
              src="/niveau-superieur.webp"
              alt={t('quiz.imageAlt')}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              width={1600}
              height={1067}
            />
          </div>
        </div>
      </motion.section>

      {/* ── PRÉSENCE DIGITALE : l'offre commerce local ──
          Deuxième bifurcation, distincte de l'agence : ce n'est ni le même client, ni le
          même funnel. Voir docs/AGENCY-POSITIONING.md §9.

          Elle garde ses quatre cartes bénéfices — c'est ce qui convertit ici — là où la
          section agence est un bloc centré nu. Les deux squelettes doivent rester distincts,
          et le mot « agence » ne doit jamais réapparaître dans ce bloc. */}
      <motion.section
        className="bg-lagoon-500 text-neutral-900"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.35em] uppercase mb-5 opacity-70">
                {t('presence.eyebrow')}
              </p>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-balance mb-5">
                {t('presence.heading')}
              </h2>
              <p className="text-lg leading-relaxed opacity-80 mb-8 max-w-lg">
                {t('presence.desc')}
              </p>
              <LocalizedLink
                to="/presence-digitale"
                className="group inline-flex items-center gap-2.5 bg-neutral-900 text-white font-bold text-sm px-8 py-4 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
              >
                {t('presence.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </LocalizedLink>
            </div>

            <ul className="grid sm:grid-cols-2 gap-4">
              {['found', 'present', 'convert', 'measure'].map((key) => (
                <li key={key} className="rounded-2xl bg-neutral-900/10 px-5 py-4">
                  <p className="font-black text-sm mb-1">{t(`presence.points.${key}.title`)}</p>
                  <p className="text-sm opacity-75 leading-relaxed">{t(`presence.points.${key}.text`)}</p>
                </li>
              ))}
            </ul>
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
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center md:bg-fixed"
            style={{ backgroundImage: 'url(/contenu-gratuit.webp)' }}
          />
          <div className="absolute inset-0 bg-neutral-950/82" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-neutral-950/40 to-neutral-950/80" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-white">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/55 mb-5">
            {t('podcast.eyebrow')}
          </p>
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance max-w-3xl mb-6">
            {t('podcast.headingThe')}<span className="text-plum-400">{t('podcast.headingPodcast')}</span>{t('podcast.headingChannel')}{' '}
            <span className="text-red-400">{t('podcast.headingYoutube')}</span>{t('podcast.headingEnd')}
          </h2>
          <p className="text-white/75 leading-relaxed max-w-xl">
            {t('podcast.desc')}
          </p>

          {recentPodcasts.length > 0 && (
            <div className="mt-14">
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/45 mb-2">
                {t('podcast.popularEpisodes')}
              </p>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {recentPodcasts.slice(0, 5).map((podcast, i) => (
                  <motion.div key={podcast.id} variants={staggerItem}>
                    <LocalizedLink
                      to={`/podcasts/${podcast.slug}`}
                      className="group flex items-center gap-5 py-4 border-b border-white/12"
                    >
                      <span className="text-xl font-bold text-white/40 w-8 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <TranslatedText
                        text={podcast.title}
                        as="span"
                        className="flex-1 font-semibold text-white/90 group-hover:text-plum-300 transition-colors leading-snug"
                      />
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                    </LocalizedLink>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-12">
            <LocalizedLink
              to="/podcasts"
              className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors ${universeThemes.podcasts.buttonSolid}`}
            >
              <Headphones className="w-4 h-4" />
              {t('podcast.listen')}
            </LocalizedLink>
            <LocalizedLink
              to="/videos"
              className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm transition-colors ${universeThemes.videos.buttonSolid}`}
            >
              <Play className="w-4 h-4" />
              {t('podcast.watch')}
            </LocalizedLink>
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
              eyebrow={t('blog.eyebrow')}
              eyebrowColor="coral"
              className="mb-14 lg:mb-20"
              segments={[
                { text: t('blog.headingNot') },
                { text: t('blog.headingBlogBusiness'), color: 'coral' },
                { text: t('blog.headingUsual') },
              ]}
            />

            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-start">
              {/* Article vedette */}
              {featuredPost && (
                <LocalizedLink to={`/blog/${featuredPost.slug}`} className="group block">
                  <div className="aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] overflow-hidden rounded-[2rem] mb-6">
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  </div>
                  <p className={`text-xs font-bold tracking-[0.25em] uppercase ${universeThemes.blog.eyebrow} mb-3`}>
                    {categoryToPole(featuredPost.category)} · {t('blog.readTime', { count: featuredPost.readTime })}
                  </p>
                  <TranslatedText
                    text={featuredPost.title}
                    as="h3"
                    className={`text-2xl lg:text-3xl font-black tracking-tight leading-[1.15] text-neutral-900 dark:text-white ${universeThemes.blog.titleHover} transition-colors`}
                  />
                  <TranslatedText
                    text={truncate(featuredPost.excerpt, 120)}
                    as="p"
                    className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 max-w-md"
                  />
                </LocalizedLink>
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
                    <LocalizedLink
                      to={`/blog/${post.slug}`}
                      className="group flex items-center gap-5 py-6 border-b border-neutral-200 dark:border-neutral-700 first:border-t"
                    >
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover shrink-0"
                        loading="lazy"
                        width={80}
                        height={80}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[0.7rem] font-bold tracking-[0.2em] uppercase ${universeThemes.blog.eyebrow} mb-1.5`}>
                          {categoryToPole(post.category)}
                        </p>
                        <TranslatedText
                          text={post.title}
                          as="h4"
                          className={`text-lg font-bold leading-snug text-neutral-900 dark:text-white ${universeThemes.blog.titleHover} transition-colors`}
                        />
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-coral-500 dark:group-hover:text-coral-400 group-hover:translate-x-1 transition-all" />
                    </LocalizedLink>
                  </motion.div>
                ))}

                <motion.div variants={staggerItem} className="mt-10">
                  <LocalizedLink
                    to="/blog"
                    className="inline-flex items-center gap-2.5 border border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold text-sm px-8 py-4 rounded-full hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors"
                  >
                    {t('blog.readAll')}
                    <ArrowRight className="w-4 h-4" />
                  </LocalizedLink>
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
              src="/methode-complete.webp"
              alt={t('offer.imageAlt')}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              width={1600}
              height={1067}
            />
            <div className="absolute inset-0 bg-brand-900/30" />
          </div>
          <div className="px-6 sm:px-10 lg:px-16 py-20 lg:py-32 flex flex-col justify-center">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-200 mb-6">
              {t('offer.eyebrow')}
            </p>
            <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance mb-6">
              {t('offer.heading')}
            </h2>
            <p className="text-brand-100 leading-relaxed mb-10 max-w-md">
              {t('offer.desc')}
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {trustBadges.map((badge) => (
                <div key={badge.titleKey} className="flex flex-col gap-2">
                  <badge.icon className="w-6 h-6 text-accent-300" />
                  <p className="font-bold text-sm text-white">{t(badge.titleKey)}</p>
                  <p className="text-xs text-brand-200 leading-relaxed">{t(badge.descKey)}</p>
                </div>
              ))}
            </div>

            <LocalizedLink
              to="/formations"
              className="group inline-flex w-fit items-center gap-2.5 bg-white text-brand-700 font-bold text-sm px-8 py-4 rounded-full hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-300"
            >
              {t('offer.cta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </LocalizedLink>
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
              eyebrow={t('testimonials.eyebrow')}
              eyebrowColor="brand"
              className="mb-16"
              segments={[
                { text: t('testimonials.headingPart1') },
                { text: t('testimonials.headingPart2'), color: 'brand' },
                { text: t('testimonials.headingEnd') },
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
            {t('newsletter.eyebrow')}
          </p>
          <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-balance mb-5">
            {t('newsletter.headingThe')}<span className="italic text-brand-400">{t('newsletter.headingConcrete')}</span>{t('newsletter.headingMailbox')}
          </h2>
          <p className="text-white/75 leading-relaxed mb-9">
            {t('newsletter.desc')}
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
            {t('finalCta.heading')}
          </h2>
          <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('finalCta.desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <LocalizedLink
              to="/formations"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-full hover:bg-brand-50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm"
            >
              {t('finalCta.ctaFormations')} <ArrowRight className="w-4 h-4" />
            </LocalizedLink>
            <LocalizedLink
              to="/contact"
              className="inline-flex items-center border border-white/40 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 text-sm"
            >
              {t('finalCta.ctaContact')}
            </LocalizedLink>
          </div>
        </div>
      </motion.section>

    </div>
  );
}
