import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ArrowRight, Loader2, Calendar, MessageSquare, Video, Bell, Building2,
  Lock, Rss, Users, Quote, Briefcase, GraduationCap, Sparkles, ChevronRight,
} from 'lucide-react';
import { getPublishedFormations } from '../lib/firestore';
import { trackSearch, trackClubJoinIntent } from '../lib/tracking';
import type { Formation } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import FormationCard from '../components/formations/FormationCard';
import FormationCarousel from '../components/formations/FormationCarousel';
import { testimonials } from '../data/testimonials';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.formations;
const clubTheme = universeThemes.club;

const viewportOnce = { once: true, amount: 0.15 } as const;

const clubMembers = [
  { id: 'KD', name: 'Kouassi David', role: 'Marketing Digital', gradient: 'from-brand-700 via-brand-900 to-neutral-950' },
  { id: 'AF', name: 'Aminata Fall', role: 'SEO & Contenu', gradient: 'from-neutral-500 via-neutral-700 to-neutral-950' },
  { id: 'MB', name: 'Moussa Ballo', role: 'E-commerce', gradient: 'from-plum-800 via-plum-900 to-neutral-950' },
  { id: 'SN', name: 'Sali Ndiaye', role: 'Réseaux Sociaux', gradient: 'from-brand-800 via-brand-900 to-neutral-950' },
];

const levelOptions = [
  { label: 'Tous niveaux', value: 'Tous' },
  { label: 'Débutant', value: 'debutant' },
  { label: 'Intermédiaire', value: 'intermediaire' },
  { label: 'Avancé', value: 'avance' },
];

const clubFeatures = [
  { icon: Rss, label: "Fil d'actualité" },
  { icon: MessageSquare, label: 'Forum & discussions' },
  { icon: Video, label: 'Sessions Live' },
  { icon: Bell, label: 'Infos exclusives' },
  { icon: Calendar, label: 'Événements' },
  { icon: Users, label: 'Réseau digital' },
];

const businessOffers = [
  { icon: Users, title: 'Licences équipe', desc: "Formez l'ensemble de votre organisation", note: 'Prix par siège' },
  { icon: Briefcase, title: 'Ateliers corporate', desc: 'Sessions intensives sur mesure', note: 'Programme sur-mesure' },
  { icon: GraduationCap, title: 'Accompagnement', desc: 'Suivi & coaching de vos talents', note: 'Sur devis' },
];

export default function Formations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [activeTab, setActiveTab] = useState('Toutes');
  const catalogRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    getPublishedFormations().then((data) => {
      setFormations(data);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

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
        title="Formations Marketing Digital"
        description="Formations pratiques en marketing digital, SEO et IA pour accélérer ta croissance. Cours en ligne accessibles depuis l'Afrique et le monde entier."
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-8 lg:p-10"
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
                Formations
              </p>
            </motion.div>
            <motion.h1 variants={staggerItem} className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.05] mb-4">
              Forme-toi autrement
            </motion.h1>
            <motion.p variants={staggerItem} className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              Marre des cours trop théoriques ? Ici, c'est du concret, de la pratique, et surtout… ça marche vraiment. Apprends à ton rythme et accélère ta croissance.
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
                  placeholder="Rechercher une formation…"
                  className={`w-full pl-11 pr-5 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${theme.focusRing}`}
                />
              </div>
              <button
                type="submit"
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${theme.buttonSolid} text-sm font-bold rounded-full transition-all active:scale-[0.97] whitespace-nowrap`}
              >
                Explorer le catalogue <ArrowRight className="w-4 h-4" />
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
          <p className="text-neutral-500 mb-4">Impossible de charger les formations. Vérifie ta connexion et réessaie.</p>
          <button onClick={load} className={`px-5 py-2.5 ${theme.buttonSolid} rounded-full text-sm font-semibold transition-colors`}>
            Réessayer
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
                    Apprends des compétences <span className={theme.accentText}>essentielles</span>
                  </h2>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    Des thématiques très recherchées pour faire progresser ta carrière et ton business.
                  </p>
                </div>
                <FormationCarousel ariaLabel="Catégories de formations">
                  {categoryCards.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => goToCategory(cat.name)}
                      className="group relative shrink-0 w-[260px] sm:w-[320px] snap-start text-left"
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={300} />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </div>
                      <div className="absolute left-4 right-4 bottom-4 bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 flex items-center justify-between gap-2 shadow-lg">
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 dark:text-white truncate">{cat.name}</p>
                          <p className="text-xs text-neutral-500">{cat.count} formation{cat.count !== 1 ? 's' : ''}</p>
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
                    Formations tendance
                  </h2>
                  <button type="button" onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`hidden sm:inline-flex items-center gap-1 text-sm font-semibold ${theme.accentText} hover:gap-2 transition-all`}>
                    Tout voir <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <FormationCarousel ariaLabel="Formations tendance">
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
                  Des compétences pour accélérer ta croissance
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Du marketing digital aux sujets techniques — explore tout le catalogue.
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
                    {cat}
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
                    placeholder="Filtrer par mot-clé…"
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
                      {opt.label}
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
                  <p className="text-neutral-500 dark:text-neutral-400">Aucune formation ne correspond à ta recherche.</p>
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
                      <Sparkles className="w-3.5 h-3.5" /> Communauté
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight mb-4">
                      Rejoins le Club des Digitos
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-6">
                      L'espace communautaire réservé aux étudiants de la plateforme. Forum, sessions Live, événements et infos exclusives — un vrai réseau de professionnels du digital.
                    </p>
                    <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-white/10">
                      <span className="text-4xl font-black text-white">19 900</span>
                      <div>
                        <span className="block text-neutral-300 font-bold text-sm">FCFA / an</span>
                        <span className="block text-neutral-500 text-xs">Renouvellement auto ou manuel</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-7">
                      {clubFeatures.map((feat) => (
                        <div key={feat.label} className="flex items-center gap-2 text-sm text-neutral-300">
                          <feat.icon className="w-4 h-4 text-plum-300 shrink-0" />
                          {feat.label}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to="/mon-espace"
                        onClick={() => trackClubJoinIntent()}
                        className={`inline-flex items-center gap-2 px-7 py-3.5 ${clubTheme.buttonSolid} font-black rounded-full transition-colors text-sm shadow-lg shadow-plum-600/30`}
                      >
                        Rejoindre le Club <ArrowRight className="w-4 h-4" />
                      </Link>
                      <span className="inline-flex items-center gap-2 px-4 py-3.5 border border-white/15 text-neutral-400 rounded-full text-xs font-medium">
                        <Lock className="w-3.5 h-3.5" /> Réservé aux étudiants inscrits
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
                          <p className="text-white/55 text-xs truncate">{member.role}</p>
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
                Rejoins celles et ceux qui transforment leur carrière grâce à la formation
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
                      <Building2 className="w-3.5 h-3.5" /> Offre entreprises
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight mb-4">
                      Formez vos équipes avec Max-Morrys Business
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-7">
                      Montez en compétences à l'échelle de votre organisation : licences d'équipe, ateliers sur mesure et accompagnement de vos talents.
                    </p>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-100 transition-colors text-sm"
                    >
                      Discutons de votre projet <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {businessOffers.map((offer) => (
                      <div key={offer.title} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                        <span className="w-11 h-11 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
                          <offer.icon className="w-5 h-5 text-brand-300" />
                        </span>
                        <div>
                          <h3 className="font-bold text-white">{offer.title}</h3>
                          <p className="text-sm text-neutral-400">{offer.desc}</p>
                          <p className="text-sm font-semibold text-brand-300 mt-1">{offer.note}</p>
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
                  Compétences populaires
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
                        {skill.name}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {skill.students.toLocaleString('fr-FR')} étudiant{skill.students !== 1 ? 's' : ''}
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
            Découvrez aussi
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Je t'informe
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Articles, analyses et conseils pratiques pour maîtriser le marketing digital, le SEO et l'IA.
          </p>
          <Link to="/blog" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide`}>
            Lire le blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
