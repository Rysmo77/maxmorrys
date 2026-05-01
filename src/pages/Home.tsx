import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, TrendingUp, Users, Award, BookOpen, Play, ChevronDown, Star, Zap, Target, BarChart3, Shield, Infinity, BadgeCheck } from 'lucide-react';
import { getPublishedFormations, getPublishedPosts, getFeaturedTestimonials } from '../lib/firestore';
import { formatPrice, truncate } from '../lib/utils';
import type { Formation, BlogPost, Testimonial } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '../components/seo/seo-config';

const stats = [
  { icon: TrendingUp, value: '+340%', label: 'Croissance trafic en 1 an', color: 'text-brand-500' },
  { icon: BookOpen, value: '10+', label: 'Cours crees', color: 'text-accent-500' },
  { icon: Users, value: '50+', label: 'Étudiants formés', color: 'text-success-500' },
  { icon: Award, value: '94%', label: 'Taux de reussite', color: 'text-warning-500' },
];

const services = [
  { icon: Target, title: 'Je te forme', desc: 'Des formations pratiques et actionnables pour maîtriser le digital.', link: '/formations' },
  { icon: Zap, title: "Je t'informe", desc: 'Articles, podcasts et videos pour rester a la pointe.', link: '/blog' },
  { icon: BarChart3, title: 'Je te transforme', desc: 'Coaching et consulting pour accélérer ta croissance.', link: '/contact' },
];


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
    <div className="max-w-4xl mx-auto text-center">
      <div className="min-h-[200px] flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-1 mb-4 justify-center">
          {[...Array(t.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-accent-500 fill-accent-500" />
          ))}
        </div>
        <p className="text-xl lg:text-2xl font-bold italic text-neutral-800 dark:text-neutral-200 leading-relaxed mb-6 transition-opacity duration-500">
          "{t.content}"
        </p>
        <div className="flex items-center justify-center gap-3">
          {t.avatar && <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />}
          <div className="text-left">
            <p className="font-bold text-neutral-900 dark:text-white text-sm">{t.name}</p>
            <p className="text-xs text-neutral-500">{t.role}{t.company ? `, ${t.company}` : ''}</p>
          </div>
        </div>
      </div>
      {/* Dots */}
      {testimonials.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === active ? 'bg-brand-500 w-6' : 'bg-neutral-300 dark:bg-neutral-600'
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
  const [featuredTestimonials, setFeaturedTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    getPublishedFormations().then(setFormations).catch(() => {});
    getPublishedPosts(4).then(setRecentPosts).catch(() => {});
    getFeaturedTestimonials().then(setFeaturedTestimonials).catch(() => {});
  }, []);

  const featuredFormations = formations.filter((f) => f.featured).slice(0, 3);
  const featuredFormation = featuredFormations[0];

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
      <SEOHead
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        isHomePage
      />
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/og-default.jpg`,
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
          image: `${SITE_URL}/og-default.jpg`,
          jobTitle: 'Expert en marketing digital, SEO et IA',
          worksFor: { '@type': 'Organization', name: SITE_NAME },
          sameAs: [
            'https://www.linkedin.com/in/maxmorrys',
            'https://www.youtube.com/@maxmorrys',
          ],
        },
      ]} />

      {/* ── HERO : vidéo plein écran en fond ── */}
      <section className="relative mt-16 lg:mt-[68px] h-[calc(100vh-4rem)] lg:h-[calc(100vh-68px)] min-h-[560px] overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950">
          <video
            ref={videoRef}
            src="https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/Le%20Marketing%20en%20Pratique.mp4?alt=media&token=7aebaa77-b33a-4494-92e4-9c3cfdc433c1"
            poster="/og-default.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={`w-full h-full object-cover transition-opacity duration-[1200ms] ${videoFading ? 'opacity-0' : 'opacity-100'}`}
          />
          <div className="absolute inset-0 bg-black/80" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] max-w-5xl">
            Maîtrise le digital,<br />
            accélère ta{' '}
            <em className="not-italic text-brand-400">croissance</em>
          </h1>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/50" />
          </div>
        </div>
      </section>

      {/* ── STATS : bande horizontale editoriale ── */}
      <section className="py-14 bg-white dark:bg-neutral-950 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 dark:divide-neutral-800">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center px-6 py-2">
                <p className={`text-4xl lg:text-5xl font-bold mb-1 tracking-tight ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 dark:text-neutral-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES : "JE SUIS MAX-MORRYS." split editorial ── */}
      <section id="services" className="py-24 lg:py-36 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Texte gauche */}
            <div>
              <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-6">
                BONJOUR !
              </p>
              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] text-neutral-900 dark:text-white mb-10 tracking-tight">
                JE SUIS<br />MAX-<br />MORRYS.
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-10 max-w-lg">
                Je t'aide à comprendre et maîtriser le marketing digital, le SEO et l'intelligence artificielle pour transformer ton activité. Voici ce que je fais pour toi :
              </p>

              {/* Services en liste editoriale */}
              <div className="space-y-0 border-t border-neutral-200 dark:border-neutral-700">
                {services.map((service, i) => (
                  <Link key={i} to={service.link} className="group flex items-start gap-5 py-6 border-b border-neutral-200 dark:border-neutral-700 hover:pl-2 transition-all duration-300">
                    <service.icon className="w-5 h-5 mt-0.5 text-brand-500 dark:text-brand-400 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {service.title}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{service.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Image droite */}
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  src="https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Max-Morrys"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Badge flottant */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-5 hidden lg:block">
                <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">
                  50+
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">étudiants formés</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Formations vedettes ── */}
      {featuredFormations.length > 0 && (
        <section className="bg-white dark:bg-neutral-950 py-24 lg:py-36 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* En-tête éditorial */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
              <div>
                <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
                  Formations
                </h2>
              </div>
              <div className="flex flex-col gap-3 lg:items-end lg:shrink-0">
                <p className="text-sm text-neutral-600 dark:text-neutral-500 max-w-xs lg:text-right leading-relaxed">
                  Des formations pratiques pour maîtriser le marketing digital, le SEO et l'IA.
                </p>
                <Link to="/formations" className="group inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Voir toutes les formations
                    <span className="w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 group-hover:border-brand-500 group-hover:bg-brand-500/10 flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                </Link>
              </div>
            </div>

            {/* Carte principale (formation 1) */}
            {featuredFormation && (
              <Link
                to={`/formations/${featuredFormation.slug}`}
                className="group relative flex flex-col lg:flex-row overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/5 hover:border-brand-500/30 transition-all duration-500 mb-4"
              >
                {/* Image plein-bleed droite */}
                <div className="relative lg:order-2 w-full lg:w-[55%] aspect-[16/9] lg:aspect-auto lg:min-h-[420px] overflow-hidden shrink-0">
                  {featuredFormation.coverImage ? (
                    <img
                      src={featuredFormation.coverImage}
                      alt={featuredFormation.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-neutral-400 dark:text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-neutral-950 via-white/20 dark:via-neutral-950/20 to-transparent lg:block hidden" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-100/70 dark:from-neutral-950/70 via-transparent to-transparent lg:hidden" />
                  {featuredFormation.promoPrice && (
                    <span className="absolute top-5 right-5 bg-brand-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">
                      Promo
                    </span>
                  )}
                </div>

                {/* Contenu gauche */}
                <div className="lg:order-1 flex flex-col justify-between p-8 lg:p-12 bg-neutral-100/80 dark:bg-neutral-900/80 lg:bg-transparent dark:lg:bg-transparent lg:w-[45%] shrink-0">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-400 block mb-6">
                      {featuredFormation.category}
                    </span>
                    <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black text-neutral-900 dark:text-white leading-[1.05] mb-5 group-hover:text-brand-600 dark:group-hover:text-brand-200 transition-colors">
                      {featuredFormation.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 text-sm lg:text-base max-w-sm">
                      {featuredFormation.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-600 mb-10">
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
                        <strong className="text-neutral-700 dark:text-neutral-300">{featuredFormation.rating}</strong>
                      </span>
                      <span>·</span>
                      <span>{featuredFormation.students} étudiants</span>
                      <span>·</span>
                      <span>{featuredFormation.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {featuredFormation.promoPrice ? (
                        <>
                          <p className="text-xs text-neutral-500 dark:text-neutral-600 line-through mb-0.5">{formatPrice(featuredFormation.price)}</p>
                          <p className="text-3xl font-black text-brand-400">{formatPrice(featuredFormation.promoPrice)}</p>
                        </>
                      ) : (
                        <p className="text-3xl font-black text-brand-400">{formatPrice(featuredFormation.price)}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-2 bg-brand-600 group-hover:bg-brand-500 text-white font-bold text-sm px-6 py-3 rounded-full transition-colors">
                      Acceder
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Cartes secondaires (formations 2 & 3) */}
            {featuredFormations.length > 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {featuredFormations.slice(1).map((f, i) => (
                  <Link
                    key={f.id}
                    to={`/formations/${f.slug}`}
                    className="group relative flex overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/5 hover:border-brand-500/30 bg-neutral-50 dark:bg-neutral-900 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Image gauche */}
                    <div className="relative w-36 sm:w-44 shrink-0 overflow-hidden">
                      {f.coverImage ? (
                        <img
                          src={f.coverImage}
                          alt={f.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-100/30 dark:to-neutral-900/30" />
                      <span className="absolute top-3 left-3 text-[9px] font-bold tracking-[0.2em] text-neutral-400/50 dark:text-white/30">
                        {String(i + 2).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Contenu droite */}
                    <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
                      <div>
                        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-brand-400 mb-2">{f.category}</p>
                        <h3 className="font-black text-neutral-900 dark:text-white text-base leading-snug mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-200 transition-colors line-clamp-2">
                          {f.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 text-accent-500 fill-accent-500" />
                            {f.rating}
                          </span>
                          <span>·</span>
                          <span>{f.students} étudiants</span>
                          <span>·</span>
                          <span>{f.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-white/5">
                        <div>
                          {f.promoPrice ? (
                            <>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-600 line-through">{formatPrice(f.price)}</p>
                              <p className="text-lg font-black text-brand-400">{formatPrice(f.promoPrice)}</p>
                            </>
                          ) : (
                            <p className="text-lg font-black text-brand-400">{formatPrice(f.price)}</p>
                          )}
                        </div>
                        <div className="w-7 h-7 rounded-full border border-neutral-300 dark:border-white/10 group-hover:border-brand-400/50 group-hover:bg-brand-400/10 flex items-center justify-center transition-all">
                          <ArrowRight className="w-3 h-3 text-neutral-500 dark:text-neutral-600 group-hover:text-brand-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="flex justify-center mt-12">
              <Link to="/formations" className="group inline-flex items-center gap-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 hover:border-neutral-300 text-neutral-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:hover:border-white/20 dark:text-white font-semibold px-8 py-4 rounded-full transition-all text-sm tracking-wide">
                  Découvrir toutes les formations
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </section>
      )}

      {/* ── PODCAST & YOUTUBE : style carte flottante sur image plein-largeur ── */}
      <section className="relative min-h-[560px] flex items-center overflow-hidden">
        {/* Image de fond pleine largeur */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Studio podcast"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Carte flottante droite */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end py-16">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-10 text-center shadow-2xl">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-600 dark:text-brand-400 mb-4">
              CONTENU GRATUIT
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 dark:text-white mb-4 leading-tight">
              Le Podcast &amp; la Chaine YouTube
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 text-sm">
              Des conseils actionnables en marketing digital, SEO et IA — directement dans tes oreilles ou sur ton écran. Gratuit, concret, sans blabla.
            </p>

            {/* Boutons plateformes */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/podcasts"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15zm0 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-.75 4.5h1.5v6h-1.5v-6z"/></svg>
                Écouter le Podcast
              </Link>
              <Link
                to="/videos"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-full font-semibold text-sm hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Play className="w-4 h-4 shrink-0" />
                Voir les Vidéos
              </Link>
            </div>

            {/* Stats media */}
            <div className="flex justify-center gap-8 mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-700">
              <div className="text-center">
                <p className="text-2xl font-black text-neutral-900 dark:text-white">50+</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">Épisodes</p>
              </div>
              <div className="w-px bg-neutral-100 dark:bg-neutral-700" />
              <div className="text-center">
                <p className="text-2xl font-black text-neutral-900 dark:text-white">30+</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">Vidéos</p>
              </div>
              <div className="w-px bg-neutral-100 dark:bg-neutral-700" />
              <div className="text-center">
                <p className="text-2xl font-black text-neutral-900 dark:text-white">100%</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">Gratuit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG "LES DERNIERS ARTICLES" : style The Latest ── */}
      <section className="py-24 lg:py-36 bg-accent-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl lg:text-6xl font-black text-center text-neutral-900 dark:text-white mb-16 tracking-tight">
            Les Derniers Articles
          </h2>

          <div className="grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-20 items-start">

            {/* Photo gauche (sticky) */}
            <div className="hidden lg:block sticky top-24">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl">
                <img
                  src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Max-Morrys Blog"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Liste numerotee droite */}
            <div>
              {recentPosts.map((post, i) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group flex items-center gap-6 py-7 border-b border-neutral-200 dark:border-neutral-700 first:border-t first:border-neutral-200 dark:first:border-neutral-700 hover:bg-white/60 dark:hover:bg-neutral-800/40 transition-colors rounded-lg px-3 -mx-3">
                  <span className="text-sm font-bold text-neutral-300 dark:text-neutral-600 w-8 shrink-0 text-right">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold tracking-widest uppercase text-brand-600 dark:text-brand-400 mb-1.5">
                      {post.category} · {post.readTime} min de lecture
                    </p>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                      {truncate(post.excerpt, 100)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700 group-hover:border-brand-500 dark:group-hover:border-brand-400 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" />
                  </div>
                </Link>
              ))}

              <div className="mt-10">
                <Link to="/blog" className="inline-flex border border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold px-8 py-4 rounded-full hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-colors text-sm tracking-wide">
                    Lire tous les articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMOIGNAGES : editorial ── */}
      <section className="py-24 lg:py-36 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
              COMMUNAUTE
            </p>
            <h2 className="text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight">
              Ce qu'ils disent
            </h2>
          </div>

          {/* Rotating testimonial carousel */}
          {featuredTestimonials.length > 0 && (
            <TestimonialCarousel testimonials={featuredTestimonials} />
          )}
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="py-12 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: BadgeCheck, title: 'Certificat inclus', desc: 'Chaque formation délivre un certificat vérifiable' },
              { icon: Infinity, title: 'Accès à vie', desc: 'Tes formations restent accessibles sans limite' },
              { icon: Shield, title: 'Garantie satisfait', desc: 'Remboursement sous 7 jours si insatisfaction' },
            ].map((badge) => (
              <div key={badge.title} className="flex flex-col items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <p className="font-bold text-neutral-900 dark:text-white text-sm">{badge.title}</p>
                <p className="text-xs text-neutral-500 max-w-[200px]">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-5 tracking-tight">
            Prêt à transformer ton business ?
          </h2>
          <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Que tu sois entrepreneur, marketeur ou en reconversion, il y a une formation faite pour toi.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/formations" className="inline-flex items-center bg-white text-brand-700 font-bold px-8 py-4 rounded-full hover:bg-brand-50 transition-colors text-sm tracking-wide">
                Voir les formations <ArrowRight className="inline w-4 h-4 ml-1" />
            </Link>
            <Link to="/contact" className="inline-flex items-center border border-white/40 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-sm tracking-wide">
                Prendre contact
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
