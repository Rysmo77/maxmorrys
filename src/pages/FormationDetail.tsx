import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Star, Users, Clock, BookOpen, Award, Play, FileText, CheckCircle, Lock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getFormationBySlug } from '../lib/firestore';
import { formatPrice, markdownToHtml } from '../lib/utils';
import type { Formation } from '../types';
import { trackViewItem, trackAddToCart } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import Breadcrumbs from '../components/ui/Breadcrumbs';

const levelLabels: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const lessonIcons: Record<string, typeof Play> = { video: Play, text: FileText, quiz: CheckCircle, resource: FileText, mission: Award };

export default function FormationDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    getFormationBySlug(slug).then((data) => {
      setFormation(data);
      if (data) {
        trackViewItem({
          id: data.id,
          name: data.title,
          category: data.category,
          content_type: 'formation',
          price: data.promoPrice ?? data.price,
          currency: 'XOF',
        });
      }
    }).catch(() => setFormation(null));
  }, [slug]);

  if (formation === undefined) {
    return (
      <div className="pt-32 pb-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Formation introuvable</h1>
        <Link to="/formations" className="text-brand-600 dark:text-brand-400 hover:underline">Voir toutes les formations</Link>
      </div>
    );
  }

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const totalLessons = (formation.modules ?? []).reduce((acc, m) => acc + m.lessons.length, 0);

  const handleEnroll = () => {
    if (!user) {
      navigate('/connexion', { state: { from: { pathname: `/checkout/${formation?.slug}` } } });
      return;
    }
    trackAddToCart({
      id: formation!.id,
      name: formation!.title,
      category: formation!.category,
      price: formation!.promoPrice ?? formation!.price,
      currency: 'XOF',
    });
    navigate(`/checkout/${formation?.slug}`);
  };

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title={formation.metaTitle || formation.title}
        description={formation.metaDescription || formation.description}
        ogTitle={formation.ogTitle}
        ogDescription={formation.ogDescription}
        ogImage={formation.ogImage || formation.coverImage}
        canonical={formation.canonicalUrl}
        noIndex={formation.noIndex}
      >
        {formation.coverImage && <link rel="preload" as="image" href={formation.coverImage} />}
      </SEOHead>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: formation.title,
        description: formation.description,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        educationalLevel: formation.level,
        inLanguage: 'fr',
        image: formation.coverImage,
        offers: {
          '@type': 'Offer',
          price: formation.promoPrice ?? formation.price,
          priceCurrency: 'XOF',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/formations/${formation.slug}`,
        },
        ...(formation.rating > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: formation.rating,
            bestRating: 5,
            ratingCount: formation.students || 1,
          },
        }),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Formations', item: `${SITE_URL}/formations` },
          { '@type': 'ListItem', position: 3, name: formation.title, item: `${SITE_URL}/formations/${formation.slug}` },
        ],
      }} />

      {/* ── HERO ── */}
      <div className="pt-28 pb-12 lg:pt-36 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'Accueil', href: '/' },
                { label: 'Formations', href: '/formations' },
                { label: formation.title },
              ]}
            />
          </div>
          <Link to="/formations" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux formations
          </Link>

          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
            {formation.category} · {levelLabels[formation.level]}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white mb-8 leading-[1.05] max-w-4xl">
            {formation.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-accent-500" fill="currentColor" />
              <span className="font-bold text-neutral-700 dark:text-neutral-200">{formation.rating}</span>
            </span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{formation.students} étudiants</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formation.duration}</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{totalLessons} leçons</span>
            {formation.certificateEnabled && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-success-500" />Certificat inclus</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="aspect-[16/7] rounded-2xl overflow-hidden">
          <img src={formation.coverImage} alt={formation.title} className="w-full h-full object-cover" width={1200} height={525} />
        </div>
      </div>

      {/* ── CONTENU + SIDEBAR ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-3 gap-12">

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <div
              className="prose-article prose prose-sm sm:prose-base dark:prose-invert max-w-none mb-12 prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-img:shadow-soft prose-blockquote:not-italic prose-blockquote:font-medium"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(formation.longDescription) }}
            />

            {/* Contenu du cours */}
            <div className="mb-12">
              <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
                PROGRAMME
              </p>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-8">
                Contenu du cours
              </h2>
              {(formation.modules ?? []).length === 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4">
                  Le programme détaillé sera disponible prochainement.
                </p>
              )}
              <div className="space-y-3">
                {(formation.modules ?? []).map((module) => {
                  const isExpanded = expandedModules.includes(module.id);
                  return (
                    <div key={module.id} className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-sm font-black text-brand-600 dark:text-brand-400 shrink-0">
                            {module.order}
                          </span>
                          <div className="text-left">
                            <p className="font-bold text-neutral-900 dark:text-white">{module.title}</p>
                            <p className="text-xs text-neutral-500">{module.lessons.length} leçons</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-neutral-200 dark:border-neutral-700">
                          {module.lessons.map((lesson) => {
                            const Icon = lessonIcons[lesson.type] || FileText;
                            return (
                              <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                                <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{lesson.title}</span>
                                <span className="text-xs text-neutral-400 mr-2">{lesson.duration}</span>
                                {lesson.isFree ? (
                                  <span className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider">Gratuit</span>
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sidebar sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-xl p-8">
                <div className="text-center mb-6">
                  {formation.promoPrice ? (
                    <>
                      <p className="text-sm text-neutral-400 line-through mb-1">{formatPrice(formation.price)}</p>
                      <p className="text-4xl font-black text-brand-600 dark:text-brand-400">{formatPrice(formation.promoPrice)}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-xs font-bold rounded-full uppercase tracking-wider">
                        Économisez {formatPrice(formation.price - (formation.promoPrice ?? 0))}
                      </span>
                    </>
                  ) : (
                    <p className="text-4xl font-black text-brand-600 dark:text-brand-400">{formatPrice(formation.price)}</p>
                  )}
                </div>

                <Button className="w-full mb-3" size="lg" onClick={handleEnroll}>
                  S'inscrire maintenant
                </Button>

                <p className="text-xs text-center text-neutral-400 mb-6">Accès à vie · Garantie 14 jours</p>

                <div className="space-y-3 text-sm border-t border-neutral-100 dark:border-neutral-800 pt-5">
                  <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                    <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{formation.duration}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                    <BookOpen className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{totalLessons} leçons</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                    <Users className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{formation.students} étudiants inscrits</span>
                  </div>
                  {formation.certificateEnabled && (
                    <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                      <Award className="w-4 h-4 text-success-500 shrink-0" />
                      <span>Certificat de complétion</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            Articles, analyses et conseils gratuits pour approfondir vos connaissances en marketing digital.
          </p>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Lire le blog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
