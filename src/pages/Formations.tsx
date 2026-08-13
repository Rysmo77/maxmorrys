import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search, ArrowRight, Loader2, Calendar, MessageSquare, Video, Bell, Building2,
  Lock, Rss, Users, Quote, Briefcase, GraduationCap, Sparkles, ChevronRight,
} from 'lucide-react';
import { getPublishedFormations } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';
import { trackSearch, trackClubJoinIntent } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import LocalizedLink from '../components/shared/LocalizedLink';
import TranslatedText from '../components/shared/TranslatedText';
import FormationCard from '../components/formations/FormationCard';
import FormationCarousel from '../components/formations/FormationCarousel';
import { testimonials } from '../data/testimonials';
import { universeThemes } from '../lib/sectionThemes';
import { useFormat } from '../hooks/useFormat';
import { CLUB_PRICE_XOF } from '../lib/club/pricing';

const theme = universeThemes.formations;
const clubTheme = universeThemes.club;

// Visuel de fond du héro de la page Formations.
const HERO_IMAGE =
  'https://media.maxmorrys.me/Formations/ChatGPT%20Image%2029%20mai%202026%2C%2015_43_26.png';

const viewportOnce = { once: true, amount: 0.15 } as const;

// Le nom du membre est un nom propre (non traduit) ; le rôle est traduit via roleKey.
const clubMembers = [
  { id: 'KD', name: 'Kouassi David', roleKey: 'club.members.marketing', gradient: 'from-brand-700 via-brand-900 to-neutral-950' },
  { id: 'AF', name: 'Aminata Fall', roleKey: 'club.members.seo', gradient: 'from-neutral-500 via-neutral-700 to-neutral-950' },
  { id: 'MB', name: 'Moussa Ballo', roleKey: 'club.members.ecommerce', gradient: 'from-plum-800 via-plum-900 to-neutral-950' },
  { id: 'SN', name: 'Sali Ndiaye', roleKey: 'club.members.social', gradient: 'from-brand-800 via-brand-900 to-neutral-950' },
];

const levelOptions = [
  { labelKey: 'level.all', value: 'Tous' },
  { labelKey: 'level.debutant', value: 'debutant' },
  { labelKey: 'level.intermediaire', value: 'intermediaire' },
  { labelKey: 'level.avance', value: 'avance' },
];

const clubFeatures = [
  { icon: Rss, labelKey: 'club.feed' },
  { icon: MessageSquare, labelKey: 'club.forum' },
  { icon: Video, labelKey: 'club.live' },
  { icon: Bell, labelKey: 'club.exclusiveInfo' },
  { icon: Calendar, labelKey: 'club.events' },
  { icon: Users, labelKey: 'club.network' },
];

const businessOffers = [
  { icon: Users, titleKey: 'business.offers.licensesTitle', descKey: 'business.offers.licensesDesc', noteKey: 'business.offers.licensesNote' },
  { icon: Briefcase, titleKey: 'business.offers.workshopsTitle', descKey: 'business.offers.workshopsDesc', noteKey: 'business.offers.workshopsNote' },
  { icon: GraduationCap, titleKey: 'business.offers.coachingTitle', descKey: 'business.offers.coachingDesc', noteKey: 'business.offers.coachingNote' },
];

export default function Formations() {
  const { t } = useTranslation('formations');
  const { locale } = useFormat();
  /** Prix du Club — source unique : src/lib/club/pricing.ts */
  const clubPrice = CLUB_PRICE_XOF.toLocaleString(locale);
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [activeTab, setActiveTab] = useState('Toutes');
  const catalogRef = useRef<HTMLDivElement>(null);

  // Lecture Firestore mise en cache (cf. src/lib/queryClient.ts) : plus de relecture
  // de la collection à chaque retour sur la page tant que les données sont « fresh ».
  const { data: formations = [], isLoading: loading, isError: error, refetch } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });

  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => trackSearch(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(
    () => Array.from(new Set(formations.map((f) => f.category).filter(Boolean))),
    [formations],
  );

  /* Carte-image par catégorie (image = 1re formation de la catégorie) */
  const categoryCards = useMemo(
    () => categories.map((cat) => {
      const inCat = formations.filter((f) => f.category === cat);
      return { name: cat, image: inCat[0]?.coverImage, count: inCat.length };
    }),
    [categories, formations],
  );

  /* Cours tendance : à la une d'abord, puis les plus suivis */
  const trending = useMemo(
    () => [...formations]
      .sort((a, b) => (Number(b.featured) - Number(a.featured)) || (b.students - a.students))
      .slice(0, 8),
    [formations],
  );

  /* Catalogue filtré (onglet + recherche + niveau) */
  const filtered = useMemo(() => formations.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    const matchesLevel = activeLevel === 'Tous' || f.level === activeLevel;
    const matchesTab = activeTab === 'Toutes' || f.category === activeTab;
    return matchesSearch && matchesLevel && matchesTab;
  }), [formations, search, activeLevel, activeTab]);

  /* Compétences populaires : catégorie + total d'étudiants */
  const popularSkills = useMemo(
    () => categories
      .map((cat) => ({
        name: cat,
        students: formations.filter((f) => f.category === cat).reduce((a, f) => a + (f.students || 0), 0),
      }))
      .sort((a, b) => b.students - a.students),
    [categories, formations],
  );

  const goToCategory = (cat: string) => {
    setActiveTab(cat);
    setSearch('');
    setActiveLevel('Tous');
    requestAnimationFrame(() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title={t('seo.title')}
        description={t('seo.description')}
      />
      {formations.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Formations Marketing Digital',
          url: `${SITE_URL}/formations`,
          numberOfItems: formations.length,
          itemListElement: formations.slice(0, 10).map((f, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Course',
              name: f.title,
              description: f.description,
              url: `${SITE_URL}/formations/${f.slug}`,
              provider: { '@type': 'Organization', name: SITE_NAME },
            },
          })),
        }} />
      )}

      {/* ─────────── 1. HERO BANNIÈRE ─────────── */}
      <section className="relative overflow-hidden bg-brand-900 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-brand-900/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-3 mb-4">
              <AnimatedIcon
                icon={GraduationCap}
                animation="float"
                className="w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-900/30 shrink-0"
                iconClassName="w-5 h-5 text-brand-600 dark:text-brand-400"
              />
              <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
                {t('eyebrow')}
              </p>
            </motion.div>
            <motion.h1 variants={staggerItem} className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05] mb-4">
              {t('hero.title')}
            </motion.h1>
            <motion.p variants={staggerItem} className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              {t('hero.subtitle')}
            </motion.p>
            <motion.form
              variants={staggerItem}
              onSubmit={(e) => { e.preventDefault(); catalogRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className={`w-full pl-11 pr-5 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>
              <button
                type="submit"
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${theme.buttonSolid} text-sm font-bold rounded-full transition-all active:scale-[0.97] whitespace-nowrap`}
              >
                {t('hero.exploreCatalog')} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-24">
          <p className="text-neutral-500 mb-4">{t('states.loadError')}</p>
          <button onClick={() => refetch()} className={`px-5 py-2.5 ${theme.buttonSolid} rounded-full text-sm font-semibold transition-colors`}>
            {t('states.retry')}
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ─────────── 2. CATÉGORIES ESSENTIELLES ─────────── */}
          {categoryCards.length > 0 && (
            <motion.section
              className="py-16 lg:py-20 bg-white dark:bg-neutral-950"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight mb-2">
                    <Trans
                      t={t}
                      i18nKey="categories.title"
                      components={{ accent: <span className={theme.accentText} /> }}
                    />
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    {t('categories.subtitle')}
                  </p>
                </div>
                <FormationCarousel ariaLabel={t('categories.carouselAria')}>
                  {categoryCards.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => goToCategory(cat.name)}
                      className="group relative shrink-0 w-[260px] sm:w-[320px] snap-start text-left"
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        {cat.image ? (
                          <img src={cat.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={300} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </div>
                      <div className="absolute left-4 right-4 bottom-4 bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 flex items-center justify-between gap-2 shadow-lg">
                        <div className="min-w-0">
                          <TranslatedText text={cat.name} as="p" className="font-bold text-neutral-900 dark:text-white truncate" />
                          <p className="text-xs text-neutral-500">{t(cat.count !== 1 ? 'categories.countOther' : 'categories.countOne', { count: cat.count })}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 ${theme.accentText} shrink-0 group-hover:translate-x-1 transition-transform`} />
                      </div>
                    </button>
                  ))}
                </FormationCarousel>
              </div>
            </motion.section>
          )}

          {/* ─────────── 3. COURS TENDANCE ─────────── */}
          {trending.length > 0 && (
            <motion.section
              className="py-16 lg:py-20 bg-neutral-50 dark:bg-neutral-900"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between gap-4 mb-8">
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                    {t('trending.title')}
                  </h2>
                  <button type="button" onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`hidden sm:inline-flex items-center gap-1 text-sm font-semibold ${theme.accentText} hover:gap-2 transition-all`}>
                    {t('trending.seeAll')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <FormationCarousel ariaLabel={t('trending.carouselAria')}>
                  {trending.map((formation) => (
                    <div key={formation.id} className="shrink-0 w-[260px] sm:w-[300px] snap-start">
                      <FormationCard formation={formation} enablePopover={false} />
                    </div>
                  ))}
                </FormationCarousel>
              </div>
            </motion.section>
          )}

          {/* ─────────── 4. CATALOGUE PAR ONGLETS ─────────── */}
          <section ref={catalogRef} id="catalogue" className="py-16 lg:py-24 bg-white dark:bg-neutral-950 scroll-mt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight mb-2">
                  {t('catalog.title')}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t('catalog.subtitle')}
                </p>
              </div>

              {/* Onglets catégories */}
              <div className="flex gap-1 sm:gap-2 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {['Toutes', ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`relative px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                      activeTab === cat
                        ? theme.accentText
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {cat === 'Toutes' ? t('catalog.all') : <TranslatedText text={cat} />}
                    {activeTab === cat && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />}
                  </button>
                ))}
              </div>

              {/* Filtres secondaires : recherche + niveau */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
                <div className="relative sm:max-w-xs flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('catalog.keywordPlaceholder')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setActiveLevel(opt.value)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                        activeLevel === opt.value
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille de formations */}
              {filtered.length > 0 ? (
                <motion.div
                  key={`${activeTab}-${activeLevel}-${search}`}
                  className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {filtered.map((formation) => (
                    <motion.div key={formation.id} variants={staggerItem}>
                      <FormationCard formation={formation} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-neutral-500 dark:text-neutral-400">{t('states.empty')}</p>
                </div>
              )}
            </div>
          </section>

          {/* ─────────── 5. CLUB DES DIGITOS ─────────── */}
          <motion.section
            className="py-12 lg:py-20 bg-white dark:bg-neutral-950"
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 lg:p-12">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-plum-600/20 blur-3xl" />
                <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                  {/* Texte */}
                  <div>
                    <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-plum-300 mb-5">
                      <Sparkles className="w-3.5 h-3.5" /> {t('club.eyebrow')}
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight mb-4">
                      {t('club.title')}
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-6">
                      {t('club.description')}
                    </p>
                    <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-white/10">
                      <span className="text-4xl font-black text-white">{clubPrice}</span>
                      <div>
                        <span className="block text-neutral-300 font-bold text-sm">{t('club.priceUnit')}</span>
                        <span className="block text-neutral-500 text-xs">{t('club.renewal')}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-7">
                      {clubFeatures.map((feat) => (
                        <div key={feat.labelKey} className="flex items-center gap-2 text-sm text-neutral-300">
                          <feat.icon className="w-4 h-4 text-plum-300 shrink-0" />
                          {t(feat.labelKey)}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <LocalizedLink
                        to="/mon-espace"
                        onClick={() => trackClubJoinIntent()}
                        className={`inline-flex items-center gap-2 px-7 py-3.5 ${clubTheme.buttonSolid} font-black rounded-full transition-colors text-sm shadow-lg shadow-plum-600/30`}
                      >
                        {t('club.join')} <ArrowRight className="w-4 h-4" />
                      </LocalizedLink>
                      <span className="inline-flex items-center gap-2 px-4 py-3.5 border border-white/15 text-neutral-400 rounded-full text-xs font-medium">
                        <Lock className="w-3.5 h-3.5" /> {t('club.studentsOnly')}
                      </span>
                    </div>
                  </div>
                  {/* Collage membres */}
                  <div className="grid grid-cols-2 gap-4">
                    {clubMembers.map((member, i) => (
                      <div
                        key={member.id}
                        className={`relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-b ${member.gradient} ${i % 2 === 1 ? 'translate-y-5' : ''}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                          <span className="text-[90px] font-black text-white opacity-[0.07] leading-none">{member.id}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white font-bold text-sm truncate">{member.name}</p>
                          <p className="text-white/55 text-xs truncate">{t(member.roleKey)}</p>
                          <p className="text-accent-400 text-xs mt-1 tracking-widest">★★★★★</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ─────────── 6. TÉMOIGNAGES ─────────── */}
          <motion.section
            className="py-16 lg:py-24 bg-neutral-50 dark:bg-neutral-900"
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight mb-10 max-w-2xl">
                {t('testimonials.title')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {testimonials.map((t) => (
                  <div key={t.id} className="flex flex-col bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6">
                    <Quote className="w-7 h-7 text-brand-500 mb-4" />
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1 mb-5">
                      {t.quote}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                      <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                        {t.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{t.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ─────────── 7. MAX-MORRYS BUSINESS ─────────── */}
          <motion.section
            className="py-12 lg:py-20 bg-white dark:bg-neutral-950"
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 lg:p-12">
                <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-brand-600/20 blur-3xl" />
                <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                  <div>
                    <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-brand-300 mb-5">
                      <Building2 className="w-3.5 h-3.5" /> {t('business.eyebrow')}
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight mb-4">
                      {t('business.title')}
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-7">
                      {t('business.description')}
                    </p>
                    <LocalizedLink
                      to="/contact"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-100 transition-colors text-sm"
                    >
                      {t('business.cta')} <ArrowRight className="w-4 h-4" />
                    </LocalizedLink>
                  </div>
                  <div className="space-y-3">
                    {businessOffers.map((offer) => (
                      <div key={offer.titleKey} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                        <span className="w-11 h-11 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
                          <offer.icon className="w-5 h-5 text-brand-300" />
                        </span>
                        <div>
                          <h3 className="font-bold text-white">{t(offer.titleKey)}</h3>
                          <p className="text-sm text-neutral-400">{t(offer.descKey)}</p>
                          <p className="text-sm font-semibold text-brand-300 mt-1">{t(offer.noteKey)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ─────────── 8. COMPÉTENCES POPULAIRES ─────────── */}
          {popularSkills.length > 0 && (
            <motion.section
              className="py-16 lg:py-20 bg-neutral-50 dark:bg-neutral-900"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
                  {t('popularSkills.title')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
                  {popularSkills.map((skill) => (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => goToCategory(skill.name)}
                      className="text-left group"
                    >
                      <p className={`font-bold ${theme.accentText} group-hover:underline mb-1 flex items-center gap-1`}>
                        <TranslatedText text={skill.name} />
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t(skill.students !== 1 ? 'popularSkills.studentsOther' : 'popularSkills.studentsOne', { count: skill.students, formattedCount: skill.students.toLocaleString(locale) })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </>
      )}

      {/* ─────────── 9. CTA CROISÉ → BLOG ─────────── */}
      <motion.section
        className="py-16 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-4`}>
            {t('crossBlog.eyebrow')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            {t('crossBlog.title')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            {t('crossBlog.description')}
          </p>
          <LocalizedLink to="/blog" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide`}>
            {t('crossBlog.cta')} <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>
      </motion.section>
    </div>
  );
}
