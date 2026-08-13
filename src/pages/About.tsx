import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import LocalizedLink from '../components/shared/LocalizedLink';
import { corporateUrl, pillars } from '../lib/brand';
import { motion } from 'framer-motion';
import CountUp from '../components/shared/CountUp';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import {
  ArrowRight,
  Target,
  Heart,
  BookOpen,
  Globe,
  BarChart3,
  CheckCircle,
  Sparkles,
  Code2,
  HeartHandshake,
  ChevronDown,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  HandHeart,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SOCIAL_URLS } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.about;

const viewportOnce = { once: true, amount: 0.2 } as const;

const values = [
  { icon: Heart, key: 'passion' },
  { icon: Globe, key: 'vision' },
  { icon: Sparkles, key: 'hybrid' },
  { icon: Target, key: 'results' },
];

const expertise = [
  { key: 'marketing', icon: BarChart3 },
  { key: 'ai', icon: Sparkles },
  { key: 'web', icon: Code2 },
  { key: 'management', icon: HeartHandshake },
];

type Experience = {
  company: string;
  key: string;
  icon: typeof Building2;
  blockKeys: string[];
};

const experiences: Experience[] = [
  {
    company: 'Eyone Medical',
    key: 'eyone',
    icon: Building2,
    blockKeys: ['strategy', 'branding', 'ai', 'web', 'partnerships', 'management'],
  },
  {
    company: 'Messages de Vie Sénégal',
    key: 'messagesDeVie',
    icon: HandHeart,
    blockKeys: ['strategy'],
  },
  {
    company: 'Académie Light',
    key: 'academieLight',
    icon: GraduationCap,
    blockKeys: ['training'],
  },
  {
    company: 'My Onoma',
    key: 'myOnoma',
    icon: Briefcase,
    blockKeys: ['strategy'],
  },
];

/**
 * La frise « Mon parcours » — chronologie UNIQUE de la page.
 *
 * `experienceKey` relie un jalon à une entrée d'`experiences` : le jalon devient alors
 * dépliable et révèle les missions du poste.
 *
 * ⚠️ Il existait auparavant DEUX sections chronologiques — « Expériences professionnelles »
 * et « Parcours » — qui listaient les 4 mêmes employeurs sur la même période. Les jalons
 * professionnels absorbent désormais le détail : une seule chronologie, une seule ancre.
 * Ne pas réintroduire une section d'expériences séparée.
 */
const milestones: { year: string; key: string; experienceKey?: string }[] = [
  { year: '2014', key: 'm2014' },
  { year: '2017', key: 'm2017' },
  { year: '2018', key: 'm2018' },
  { year: '2020', key: 'm2020' },
  { year: '2021', key: 'm2021' },
  { year: '2023', key: 'm2023Onoma', experienceKey: 'myOnoma' },
  { year: '2023', key: 'm2023Master' },
  { year: '2024 — Janv.', key: 'm2024Jan', experienceKey: 'eyone' },
  { year: '2024 — Mai', key: 'm2024May', experienceKey: 'academieLight' },
  { year: '2025 — Avril', key: 'm2025Apr', experienceKey: 'messagesDeVie' },
  { year: '2025', key: 'm2025' },
];

const sectionNav = [
  { id: 'impact', key: 'impact' },
  { id: 'expertise', key: 'expertise' },
  { id: 'parcours', key: 'parcours' },
];

/**
 * Une étape de la frise « Mon parcours ».
 *
 * Un jalon portant un `experienceKey` devient dépliable et révèle les missions du poste —
 * c'est ce qui a permis de supprimer la section « Expériences professionnelles » sans rien
 * perdre. Les autres jalons restent des repères simples, non interactifs.
 *
 * Le mécanisme d'accordéon (`grid-rows-[1fr]/[0fr]`, `aria-expanded`, `aria-controls`) est
 * repris tel quel de l'ancienne section : il fonctionnait et il était accessible.
 */
function MilestoneRow({
  m, t, open, onToggle,
}: {
  m: (typeof milestones)[number];
  t: TFunction;
  open: boolean;
  onToggle: () => void;
}) {
  const experience = m.experienceKey ? experiences.find((e) => e.key === m.experienceKey) : undefined;

  const head = (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
        <span className={`text-sm font-black tracking-tight ${theme.accentText}`}>{t(`milestones.${m.key}.year`)}</span>
        <span className="text-[11px] font-bold tracking-wider uppercase text-morrys-500 dark:text-morrys-400">{t(`milestones.${m.key}.lieu`)}</span>
      </div>
      <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1">{t(`milestones.${m.key}.title`)}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{t(`milestones.${m.key}.desc`)}</p>
    </>
  );

  return (
    <div className="relative pl-10">
      <span
        className="absolute left-2 top-1.5 -translate-x-1/2 w-3 h-3 rounded-full bg-morrys-500 ring-4 ring-neutral-50 dark:ring-neutral-900"
        aria-hidden="true"
      />

      {experience ? (
        <>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`milestone-panel-${m.key}`}
            className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-morrys-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-900 rounded"
          >
            {head}
            <span className={`inline-flex items-center gap-1.5 mt-3 text-sm font-bold ${theme.accentText}`}>
              {open ? t('parcours.hideMissions') : t('parcours.showMissions')}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </span>
          </button>

          <div
            id={`milestone-panel-${m.key}`}
            className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="overflow-hidden">
              <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
                  <experience.icon className={`w-5 h-5 ${theme.accentText}`} aria-hidden="true" />
                  <p className="font-bold text-neutral-900 dark:text-white">{t(`experiences.${experience.key}.role`)}</p>
                  <span className="text-xs font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                    {t(`experiences.${experience.key}.period`)}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">{t(`experiences.${experience.key}.intro`)}</p>
                <div className="space-y-6">
                  {experience.blockKeys.map((blockKey) => {
                    const bullets = t(`experiences.${experience.key}.blocks.${blockKey}.bullets`, { returnObjects: true }) as string[];
                    return (
                      <div key={blockKey}>
                        <h4 className={`font-black text-sm uppercase tracking-wider ${theme.eyebrow} mb-3`}>
                          {t(`experiences.${experience.key}.blocks.${blockKey}.title`)}
                        </h4>
                        <ul className="space-y-2">
                          {bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              <CheckCircle className="w-4 h-4 text-morrys-500 dark:text-morrys-400 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        head
      )}
    </div>
  );
}

export default function About() {
  const { t } = useTranslation('about');
  /** Jalon dont les missions sont dépliées. `null` : aucun — la frise s'ouvre fermée. */
  const [openMilestone, setOpenMilestone] = useState<string | null>(null);
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  const [activeSection, setActiveSection] = useState('impact');

  // Scroll-spy pour le menu d'ancrage
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sectionNav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <SEOHead
        title={t('seo.title')}
        description={t('seo.description')}
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Max-Morrys Eyoum',
        url: `${SITE_URL}/a-propos`,
        jobTitle: 'Marketing & Growth Manager',
        worksFor: { '@type': 'Organization', name: 'Eyone Medical' },
        address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
        sameAs: [...SOCIAL_URLS],
      }} />

      {/* ── 1. HERO CORPORATE ── */}
      <section className="pt-28 pb-24 lg:pt-36 lg:pb-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div
              className="lg:col-span-7"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
                <AnimatedIcon
                  icon={Sparkles}
                  animation="pulse"
                  className="w-10 h-10 rounded-2xl bg-morrys-100 dark:bg-morrys-900/30 shrink-0"
                  iconClassName="w-5 h-5 text-morrys-600 dark:text-morrys-400"
                />
                <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
                  {t('hero.eyebrow')}
                </p>
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-neutral-900 dark:text-white mb-6 text-balance max-w-[15ch]">
                {t('hero.title')}
              </motion.h1>
              <motion.p variants={staggerItem} className="text-base lg:text-lg text-neutral-500 dark:text-neutral-400 font-medium mb-8">
                {t('hero.subtitle')}
              </motion.p>

              {/* Blockquote — profil hybride absorbé */}
              <motion.blockquote variants={staggerItem} className="border-l-2 border-morrys-500 dark:border-morrys-400 pl-5 mb-10 max-w-2xl">
                <p className="text-base lg:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  {t('hero.blockquote')}
                </p>
              </motion.blockquote>

              {/* Mini-stats inline — responsive sans divide-x */}
              <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4 sm:gap-6 mb-10 max-w-2xl">
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    <CountUp value={1790} prefix="+" suffix=" %" format />
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-1">{t('hero.statTraffic')}</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    <CountUp value={8000} prefix="+" format />
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-1">{t('hero.statFollowers')}</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    <CountUp value={5} prefix="+" />
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-1">{t('hero.statPlatforms')}</p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem} className="flex flex-wrap gap-4">
                <LocalizedLink to="/contact" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} text-sm font-bold rounded-full hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-lg hover:shadow-morrys-600/25 transition-all duration-300 tracking-wide`}>
                  {t('hero.ctaWork')} <ArrowRight className="w-4 h-4" />
                </LocalizedLink>
                <a href="#parcours" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-200 text-sm font-bold rounded-full hover:bg-white dark:hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300 tracking-wide">
                  {t('hero.ctaParcours')}
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden relative">
                <img
                  src="https://media.maxmorrys.me/A-propos/ChatGPT%20Image%2014%20mai%202026%2C%2000_44_30%20(1).png"
                  alt={t('hero.imageAlt')}
                  className="w-full h-full object-cover scale-x-[-1]"
                  loading="lazy"
                  width={640}
                  height={800}
                />
                {/* Badge Dakar — INSIDE image on mobile/tablet */}
                <div className="absolute bottom-4 right-4 lg:hidden bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-white/40 dark:border-neutral-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-morrys-50 dark:bg-morrys-900/30 flex items-center justify-center shrink-0">
                    <MapPin className={`w-4 h-4 ${theme.accentText}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-900 dark:text-white leading-none">{t('hero.locationCity')}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-semibold tracking-wide uppercase">{t('hero.locationRegion')}</p>
                  </div>
                </div>
              </div>
              {/* Badge Dakar — floating on desktop only */}
              <motion.div
                className="hidden lg:flex absolute -bottom-6 -right-8 bg-white dark:bg-neutral-800 rounded-2xl px-5 py-4 shadow-xl border border-neutral-100 dark:border-neutral-700 items-center gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.6 }}
              >
                <div className="w-10 h-10 rounded-full bg-morrys-50 dark:bg-morrys-900/20 flex items-center justify-center shrink-0">
                  <MapPin className={`w-5 h-5 ${theme.accentText}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-900 dark:text-white leading-none">{t('hero.locationCity')}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium tracking-wide uppercase">{t('hero.locationRegion')}</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MENU D'ANCRAGE STICKY ── */}
      <nav className="sticky top-[var(--header-h)] z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-y border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ul className="flex justify-start lg:justify-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sectionNav.map((s, i) => {
              const active = activeSection === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`group flex items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3.5 sm:pl-3 sm:pr-4 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
                      active
                        ? `${theme.buttonSolid} shadow-sm shadow-morrys-600/20`
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black tabular-nums transition-colors ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 group-hover:bg-morrys-100 group-hover:text-morrys-600 dark:group-hover:bg-morrys-900/40 dark:group-hover:text-morrys-300'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {t(`sectionNav.${s.key}`)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── 2. RÉSUMÉ D'IMPACT ── */}
      <motion.section
        id="impact"
        className="py-24 bg-white dark:bg-neutral-950 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-5`}>
              {t('impact.eyebrow')}
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              {t('impact.heading')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              {t('impact.desc')}
            </p>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div variants={staggerItem} className="text-center py-10 px-8 bg-neutral-50 dark:bg-neutral-900">
              <p className={`text-5xl lg:text-6xl font-black ${theme.accentText} tracking-tight`}>
                <CountUp value={1790} prefix="+" suffix=" %" format />
              </p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">{t('impact.trafficLabel')}</p>
              <p className="text-xs text-neutral-400 mt-1">{t('impact.trafficSub')}</p>
            </motion.div>
            <motion.div variants={staggerItem} className="text-center py-10 px-8 bg-neutral-50 dark:bg-neutral-900">
              <p className={`text-5xl lg:text-6xl font-black ${theme.accentText} tracking-tight`}>
                <CountUp value={8000} prefix="+" format />
              </p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">{t('impact.followersLabel')}</p>
              <p className="text-xs text-neutral-400 mt-1">{t('impact.followersSub')}</p>
            </motion.div>
            <motion.div variants={staggerItem} className="text-center py-10 px-8 bg-neutral-50 dark:bg-neutral-900">
              <p className={`text-5xl lg:text-6xl font-black ${theme.accentText} tracking-tight`}>
                <CountUp value={5} prefix="+" />
              </p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">{t('impact.platformsLabel')}</p>
              <p className="text-xs text-neutral-400 mt-1">{t('impact.platformsSub')}</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── 3. EXPERTISE & COMPÉTENCES (fusion) ── */}
      <motion.section
        id="expertise"
        className="py-24 bg-neutral-50 dark:bg-neutral-900 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              {t('expertiseSection.heading')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              {t('expertiseSection.desc')}
            </p>
          </div>
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {expertise.map((item) => {
              const tags = t(`expertise.${item.key}.tags`, { returnObjects: true }) as string[];
              return (
                <motion.div
                  key={item.key}
                  variants={staggerItem}
                  className="bg-white dark:bg-neutral-950 rounded-2xl p-8 border border-neutral-100 dark:border-neutral-800 flex flex-col hover:border-morrys-300 dark:hover:border-morrys-700 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-morrys-50 dark:bg-morrys-900/20 flex items-center justify-center mb-5">
                    <item.icon className={`w-5 h-5 ${theme.accentText}`} />
                  </div>
                  <h3 className="font-black text-xl text-neutral-900 dark:text-white mb-3">{t(`expertise.${item.key}.title`)}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">{t(`expertise.${item.key}.desc`)}</p>
                  <div className="flex flex-wrap items-start content-start gap-2 mb-6 flex-1">
                    {tags.map((tag) => (
                      <span key={tag} className={`px-3 py-1 ${theme.softBadge} text-xs font-semibold rounded-full whitespace-nowrap`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className={`text-sm font-bold ${theme.accentText} border-t border-neutral-200 dark:border-neutral-700 pt-4`}>
                    {t(`expertise.${item.key}.stat`)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>


      {/* ── 5. STACK & OUTILS (rupture sombre) ── */}
      <motion.section
        className="py-16 bg-neutral-950 dark:bg-black"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-[0.95] mb-3">
            {t('stack.heading')}
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10">
            {t('stack.desc')}
          </p>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {(t('stack.items', { returnObjects: true }) as string[]).map((tool) => (
              <motion.span
                key={tool}
                variants={staggerItem}
                className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-semibold text-neutral-200 hover:border-morrys-500 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
              >
                {tool}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── 7. VALEURS ── */}
      <motion.section
        className="py-24 bg-white dark:bg-neutral-950"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">
                {t('valuesSection.heading')}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('valuesSection.desc')}
              </p>
            </div>
            <motion.div
              className="border-t border-neutral-200 dark:border-neutral-800"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {values.map((v) => (
                <motion.div
                  key={v.key}
                  variants={staggerItem}
                  className="flex items-start gap-5 py-7 border-b border-neutral-200 dark:border-neutral-800"
                >
                  <div className="w-10 h-10 rounded-full bg-morrys-50 dark:bg-morrys-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <v.icon className={`w-5 h-5 ${theme.accentText}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-neutral-900 dark:text-white mb-1">{t(`values.${v.key}.title`)}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{t(`values.${v.key}.desc`)}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── 7. PARCOURS (narrative + timeline fusionnés) ── */}
      <motion.section
        id="parcours"
        className="py-24 lg:py-32 bg-neutral-50 dark:bg-neutral-900 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-4`}>
              {t('parcours.eyebrow')}
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">
              {t('parcours.heading')}
            </h2>
            <div className="space-y-5 text-base lg:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
              <p>{t('parcours.p1')}</p>
              <p>{t('parcours.p2')}</p>
              <p>{t('parcours.p3')}</p>
            </div>
          </div>

          {/* Timeline — rail unique, aligné mobile ET desktop */}
          <div className="relative">
            {/* Rail vertical */}
            <div
              className="absolute left-2 top-1.5 bottom-1.5 w-px bg-neutral-200 dark:bg-neutral-700"
              aria-hidden="true"
            />

            {/* Nœud de bascule en tête de frise */}
            <div className="relative pl-10 mb-8">
              <span
                className="absolute left-2 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-morrys-400 dark:border-morrys-500 bg-neutral-50 dark:bg-neutral-900 ring-4 ring-neutral-50 dark:ring-neutral-900"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setShowAllMilestones((v) => !v)}
                aria-expanded={showAllMilestones}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 hover:border-morrys-400 dark:hover:border-morrys-600 transition-all"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllMilestones ? 'rotate-180' : ''}`} />
                {showAllMilestones ? t('parcours.collapse') : t('parcours.expand')}
              </button>
            </div>

            {/* Étapes anciennes (2014-2021) — repliables */}
            <div
              className={`grid transition-all duration-500 ease-out ${
                showAllMilestones ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-8 mb-8">
                  {milestones.slice(0, 5).map((m) => (
                    <MilestoneRow
                      key={m.key}
                      m={m}
                      t={t}
                      open={openMilestone === m.key}
                      onToggle={() => setOpenMilestone(openMilestone === m.key ? null : m.key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Étapes récentes (depuis 2023) — toujours visibles */}
            <div className="space-y-8">
              {milestones.slice(5).map((m) => (
                <MilestoneRow
                      key={m.key}
                      m={m}
                      t={t}
                      open={openMilestone === m.key}
                      onToggle={() => setOpenMilestone(openMilestone === m.key ? null : m.key)}
                    />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 8. AU-DELÀ DE LA MARQUE PERSONNELLE ──
          Section volontairement courte. MY ONOMA n'est pas une co-marque de ce site : elle
          apparaît quand la structure a besoin d'être claire, et pas davantage.
          ⚠️ Aucun rôle ni titre de Max-Morrys au sein de MY ONOMA n'est publié : cette
          information n'est pas validée. Voir docs/CONTENT-TODO.md §4. */}
      <motion.section
        className="py-20 lg:py-24 bg-neutral-950 text-white"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-lagoon-400 mb-5">
            {t('beyond.eyebrow')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-balance mb-5">
            {t('beyond.heading')}
          </h2>
          <p className="text-neutral-300 leading-relaxed max-w-2xl">{t('beyond.desc')}</p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <li key={pillar} className="rounded-2xl border border-neutral-800 p-5">
                <span className="text-sm font-black tracking-[0.2em] text-white">{pillar}</span>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  {t(`beyond.pillars.${pillar.toLowerCase()}`)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col sm:flex-row gap-6 sm:items-center">
            <a
              href={corporateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-lagoon-400 hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-400 rounded"
            >
              {t('beyond.cta')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <LocalizedLink
              to="/agence"
              className="inline-flex items-center gap-2 font-semibold text-white hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              {t('beyond.ctaAgency')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </LocalizedLink>
          </div>
        </div>
      </motion.section>

      {/* ── 9. CTA FINAL ── */}
      <motion.section
        className="py-24 bg-gradient-to-br from-morrys-600 to-morrys-800 text-white"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-morrys-200 mb-5">
            {t('finalCta.eyebrow')}
          </p>
          <h2 className="text-4xl lg:text-5xl font-black mb-5 tracking-tight">{t('finalCta.heading')}</h2>
          <p className="text-morrys-100 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            {t('finalCta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <LocalizedLink to="/contact" className="inline-flex items-center gap-2 bg-white text-morrys-700 font-bold px-8 py-4 rounded-full hover:bg-morrys-50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide">
              {t('finalCta.ctaContact')} <ArrowRight className="w-4 h-4" />
            </LocalizedLink>
            <LocalizedLink to="/formations" className="inline-flex items-center gap-2 text-white font-bold text-sm tracking-wide hover:text-morrys-100 hover:translate-x-0.5 transition-all duration-300">
              <BookOpen className="w-4 h-4" /> {t('finalCta.ctaFormations')} <ArrowRight className="w-4 h-4" />
            </LocalizedLink>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
