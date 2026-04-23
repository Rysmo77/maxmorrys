import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Users, Clock, ArrowRight, Play, Loader2, Calendar, MessageSquare, Video, Bell, Building2, Lock, Rss } from 'lucide-react';
import { getPublishedFormations } from '../lib/firestore';
import { trackSearch, trackClubJoinIntent } from '../lib/tracking';
import type { Formation } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';

const clubMembers = [
  { id: 'KD', name: 'Kouassi David', role: 'Marketing Digital', gradient: 'from-brand-700 via-brand-900 to-neutral-950' },
  { id: 'AF', name: 'Aminata Fall', role: 'SEO & Contenu', gradient: 'from-neutral-500 via-neutral-700 to-neutral-950' },
  { id: 'MB', name: 'Moussa Ballo', role: 'E-commerce', gradient: 'from-yellow-800 via-yellow-900 to-neutral-950' },
  { id: 'SN', name: 'Sali Ndiaye', role: 'Réseaux Sociaux', gradient: 'from-brand-800 via-brand-900 to-neutral-950' },
  { id: 'DT', name: 'Diallo Thierno', role: 'Design UI/UX', gradient: 'from-neutral-600 via-neutral-800 to-neutral-950' },
];

const levelOptions = [
  { label: 'Tous', value: 'Tous' },
  { label: 'Débutant', value: 'debutant' },
  { label: 'Intermédiaire', value: 'intermediaire' },
  { label: 'Avancé', value: 'avance' },
];

export default function Formations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState('Tous');
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [activeCard, setActiveCard] = useState(0);

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

  useEffect(() => {
    const t = setInterval(() => setActiveCard((p) => (p + 1) % clubMembers.length), 3500);
    return () => clearInterval(t);
  }, []);

  const categories = ['Toutes', ...Array.from(new Set(formations.map((f) => f.category).filter(Boolean)))];

  const filtered = formations.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = activeLevel === 'Tous' || f.level === activeLevel;
    const matchesCategory = activeCategory === 'Toutes' || f.category === activeCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const noFilters = activeLevel === 'Tous' && activeCategory === 'Toutes' && !search;
  const featuredFormation = noFilters ? filtered[0] : null;
  const gridFormations = featuredFormation ? filtered.slice(1) : filtered;

  return (
    <div>
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

      {/* ── HERO éditorial ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
            FORMATIONS
          </p>
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-12">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95]">
              Forme-toi autrement
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed lg:pb-2">
              J'ai mis en place ces formations parce que je sais que tu en as marre des cours trop théoriques et parfois sans valeur ajoutée. Ici, c'est du concret, de la pratique, et surtout... ça marche vraiment !
            </p>
          </div>

          {/* Recherche + filtres */}
          <div className="flex flex-col gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une formation..."
                className="w-full pl-11 pr-5 py-3 rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {levelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActiveLevel(opt.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    activeLevel === opt.value
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <span className="w-px h-8 self-center bg-neutral-200 dark:bg-neutral-700 mx-1" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand-600 text-white'
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

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-neutral-500 mb-4">Impossible de charger les formations. Verifie ta connexion et reessaie.</p>
              <button onClick={load} className="px-5 py-2.5 bg-brand-600 text-white rounded-full text-sm font-semibold hover:bg-brand-500 transition-colors">
                Reessayer
              </button>
            </div>
          )}

          {/* Formation featured hero */}
          {!loading && featuredFormation && (
            <div className="pt-12 mb-16">
              <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <div className="relative overflow-hidden aspect-[16/9] lg:aspect-auto">
                  <img
                    src={featuredFormation.coverImage}
                    alt={featuredFormation.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    width={800}
                    height={450}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-neutral-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {featuredFormation.featured && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-accent-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        À la une
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center bg-neutral-50 dark:bg-neutral-900">
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-4">
                    {featuredFormation.category} · {featuredFormation.level}
                  </p>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight">
                    {featuredFormation.title}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {featuredFormation.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-accent-500" fill="currentColor" />
                      <span className="font-bold text-neutral-700 dark:text-neutral-200">{featuredFormation.rating}</span>
                    </span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{featuredFormation.students} étudiants</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{featuredFormation.duration}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      to={`/formations/${featuredFormation.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide"
                    >
                      Voir la formation <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white">
                      {featuredFormation.price === 0 ? 'Gratuit' : `${featuredFormation.price.toLocaleString()} FCFA`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grille formations */}
          {gridFormations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridFormations.map((formation) => (
                <Link key={formation.id} to={`/formations/${formation.slug}`} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl aspect-[16/9] mb-5">
                    <img
                      src={formation.coverImage}
                      alt={formation.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={400}
                      height={225}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-neutral-900 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {formation.featured && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        À la une
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold tracking-[0.25em] uppercase text-brand-600 dark:text-brand-400 mb-2">
                    {formation.category} · <span className="font-normal normal-case tracking-normal text-neutral-400">{formation.level}</span>
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug flex-1">
                    {formation.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-accent-500" fill="currentColor" />
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300">{formation.rating}</span>
                    </span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formation.students}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formation.duration}</span>
                  </div>
                  <p className="text-base font-black text-neutral-900 dark:text-white">
                    {formation.price === 0 ? 'Gratuit' : `${formation.price.toLocaleString()} FCFA`}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            !featuredFormation && (
              <div className="text-center py-20">
                <p className="text-neutral-500 dark:text-neutral-400">Aucune formation trouvée pour ta recherche.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── CLUB DES DIGITOS ── */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 min-h-[340px]">

          {/* Left: texte */}
          <div className="py-8 lg:py-10 lg:pr-12 flex flex-col justify-center">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.9] mb-3">
              Le Club<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-300 dark:to-yellow-500">des Digitos</span>
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-base mb-5">
              L'espace communautaire réservé aux étudiants de la plateforme. Forum, sessions Live, événements, infos exclusives — un réseau de professionnels du digital.
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-neutral-200 dark:border-neutral-800">
              <span className="text-4xl font-black text-neutral-900 dark:text-white">19 900</span>
              <div>
                <span className="block text-yellow-500 dark:text-yellow-400 font-bold text-base">FCFA / an</span>
                <span className="block text-neutral-400 dark:text-neutral-500 text-xs mt-0.5">Renouvellement auto ou manuel</span>
              </div>
            </div>

            {/* Feature list */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-6">
              {[
                { icon: Rss, label: 'Fil d\'actualité' },
                { icon: MessageSquare, label: 'Forum & discussions' },
                { icon: Video, label: 'Sessions Live' },
                { icon: Bell, label: 'Infos exclusives' },
                { icon: Calendar, label: 'Événements' },
                { icon: Users, label: 'Réseau digital' },
              ].map((feat) => (
                <div key={feat.label} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <feat.icon className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                  {feat.label}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/mon-espace"
                onClick={() => trackClubJoinIntent()}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-yellow-400 text-neutral-900 font-black rounded-full hover:bg-yellow-300 transition-colors text-sm tracking-wide shadow-md shadow-yellow-400/30"
              >
                Rejoindre le Club <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="inline-flex items-center gap-2 px-4 py-3.5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 rounded-full text-xs font-medium">
                <Lock className="w-3.5 h-3.5" /> Réservé aux étudiants inscrits
              </div>
            </div>
          </div>

          {/* Right: carrousel 3 cartes avec slide */}
          <div className="relative min-h-[260px] lg:min-h-0 overflow-hidden">
            {clubMembers.map((member, index) => {
              const n = clubMembers.length;
              const raw = ((index - activeCard) % n + n) % n;
              const slot = raw > Math.floor(n / 2) ? raw - n : raw;
              const tr = 'left 0.55s cubic-bezier(0.25,0.46,0.45,0.94), top 0.55s, bottom 0.55s, opacity 0.4s';
              const posStyle: React.CSSProperties =
                slot === -2 ? { left: '-70%', top: '10%', bottom: '10%', width: '48%', zIndex: 5,  opacity: 0, transition: tr } :
                slot === -1 ? { left: '-12%', top: '6%',  bottom: '6%',  width: '48%', zIndex: 10, opacity: 1, transition: tr } :
                slot ===  0 ? { left:  '26%', top:   0,   bottom:    0,   width: '48%', zIndex: 20, opacity: 1, transition: tr } :
                slot ===  1 ? { left:  '64%', top: '6%',  bottom: '6%',  width: '48%', zIndex: 10, opacity: 1, transition: tr } :
                              { left: '120%', top: '10%', bottom: '10%', width: '48%', zIndex: 5,  opacity: 0, transition: tr };
              const isCenter = slot === 0;
              return (
                <div
                  key={member.id}
                  style={posStyle}
                  className={`absolute rounded-2xl overflow-hidden bg-gradient-to-b ${member.gradient}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                    <span className="text-[110px] font-black text-white opacity-[0.06] leading-none">{member.id}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{member.name}</p>
                      <p className="text-white/55 text-xs mt-0.5 truncate">{member.role}</p>
                      <p className="text-yellow-400 text-xs mt-1 tracking-widest">★★★★★</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isCenter ? 'bg-white' : 'bg-white/15 border border-white/25'}`}>
                      <Play className={`w-3.5 h-3.5 ml-0.5 ${isCenter ? 'text-neutral-900' : 'text-white'}`} fill="currentColor" />
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Indicateurs */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
              {clubMembers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCard(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeCard === i ? 'w-5 bg-yellow-400' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>

        </div>
        </div>
      </section>

      {/* ── MAX-MORRYS BUSINESS ── */}
      <section
        className="relative min-h-[600px] flex items-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/Je-te-forme%2F2252.jpg?alt=media&token=c7942987-73f4-45e3-9a9e-2735a1eb1927')", backgroundAttachment: 'fixed' }}
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex justify-end">
          {/* Right-aligned square card */}
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl p-10 shadow-2xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/60 text-brand-600 dark:text-brand-400 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase mb-7">
              <Building2 className="w-3.5 h-3.5" /> OFFRE ENTREPRISES
            </div>

            {/* Title */}
            <h2 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-8">
              Max-Morrys<br />Business
            </h2>

            {/* Licences équipe */}
            <div className="mb-6">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1">Licences équipe</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Formations à l'échelle de votre organisation</p>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1">Prix par siège</p>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 mb-6" />

            {/* Ateliers corporate */}
            <div className="mb-10">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1">Ateliers corporate</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Sessions intensives sur mesure</p>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1">Programme sur-mesure</p>
            </div>

            {/* CTA */}
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 w-full px-7 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors text-sm tracking-wide"
            >
              Discutons de votre projet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA croisé → Blog ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Je t'informe
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Articles, analyses et conseils pratiques pour maîtriser le marketing digital, le SEO et l'IA.
          </p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Lire le blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
