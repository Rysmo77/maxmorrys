import { useParams, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight, Star, Users, Clock, BookOpen, Award, Play, FileText, CheckCircle,
  Lock, ChevronDown, ChevronUp, Loader2, Quote, ShieldCheck, Infinity as InfinityIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import LocalizedLink from '../components/shared/LocalizedLink';
import TranslatedText from '../components/shared/TranslatedText';
import { useTranslatedContent, useTranslatedText } from '../hooks/useTranslatedContent';
import { useAuth } from '../contexts/AuthContext';
import { getFormationBySlug, getApprovedTestimonials } from '../lib/firestore';
import { formatPrice, markdownToHtml } from '../lib/utils';
import type { Formation, Testimonial } from '../types';
import { trackViewItem, trackAddToCart } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import { useLanguage } from '../contexts/LanguageContext';
import { localizedPath } from '../i18n/routing';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';

function initialsFromName(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const theme = universeThemes.formations;

const viewportOnce = { once: true, amount: 0.2 } as const;

const lessonIcons: Record<string, typeof Play> = { video: Play, text: FileText, quiz: CheckCircle, resource: FileText, mission: Award };

export default function FormationDetail() {
  const { t } = useTranslation('formations');
  const { slug } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const levelLabels: Record<string, string> = {
    debutant: t('level.debutant'),
    intermediaire: t('level.intermediaire'),
    avance: t('level.avance'),
  };
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (!slug) return;
    getFormationBySlug(slug, language).then((data) => {
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
  }, [slug, language]);

  useEffect(() => {
    if (!formation) return;
    getApprovedTestimonials().then((all) => {
      const targeted = all.filter((t) => t.targetType === 'formation' && t.targetId === formation.id);
      const fallback = all.filter((t) => !t.targetType || t.targetType === 'platform' || t.targetType === 'mentor');
      setReviews((targeted.length > 0 ? targeted : fallback).slice(0, 4));
    }).catch(() => setReviews([]));
  }, [formation]);

  /* Traduction du contenu dynamique Firestore (FR -> EN selon langue active). */
  const tFormation = useTranslatedContent(
    formation as (Formation & Record<string, unknown>) | null | undefined,
    ['title', 'description', 'longDescription', 'category'],
  ) as Formation | null | undefined;
  const seoTitleSource = formation ? formation.metaTitle || formation.title : '';
  const seoDescSource = formation ? formation.metaDescription || formation.description : '';
  const seoTitle = useTranslatedText(seoTitleSource);
  const seoDescription = useTranslatedText(seoDescSource);
  const longDescriptionBody = useTranslatedText(formation?.longDescription);

  if (formation === undefined) {
    return (
      <div className="pt-32 pb-20 flex justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} />
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">{t('detail.notFoundTitle')}</h1>
        <LocalizedLink to="/formations" className={`${theme.accentText} hover:underline`}>{t('detail.notFoundLink')}</LocalizedLink>
      </div>
    );
  }

  /* Vue traduite garantie non-nulle pour l'affichage du contenu. */
  const display = tFormation ?? formation;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const totalLessons = (formation.modules ?? []).reduce((acc, m) => acc + m.lessons.length, 0);
  const hasPromo = formation.promoPrice != null && formation.promoPrice < formation.price;

  /* « Ce que tu apprendras » — titres de modules, fallback tags */
  const learnItems = ((formation.modules ?? []).length > 0
    ? (formation.modules ?? []).map((m) => m.title)
    : (formation.tags ?? [])
  ).slice(0, 8);

  const handleEnroll = () => {
    if (!user) {
      // ⚠️ `from` doit etre localise lui aussi : Login le rejoue tel quel apres connexion.
      navigate(localizedPath('/connexion', language), {
        state: { from: { pathname: localizedPath(`/checkout/${formation?.slug}`, language) } },
      });
      return;
    }
    trackAddToCart({
      id: formation!.id,
      name: formation!.title,
      category: formation!.category,
      price: formation!.promoPrice ?? formation!.price,
      currency: 'XOF',
    });
    navigate(localizedPath(`/checkout/${formation?.slug}`, language));
  };

  /* ── Carte d'achat (réutilisée mobile + desktop) ── */
  const purchaseCard = (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden">
      <div className="relative aspect-video">
        <img src={formation.coverImage} alt={formation.title} className="w-full h-full object-cover" width={400} height={225} />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-neutral-900 ml-0.5" fill="currentColor" />
          </span>
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs font-medium rounded-full">
          {t('detail.previewBadge')}
        </span>
      </div>
      <div className="p-6 lg:p-7">
        <div className="flex items-baseline gap-3 mb-1">
          {formation.promoPrice ? (
            <>
              <span className="text-3xl font-black text-neutral-900 dark:text-white">{formatPrice(formation.promoPrice)}</span>
              <span className="text-base text-neutral-400 line-through">{formatPrice(formation.price)}</span>
            </>
          ) : (
            <span className="text-3xl font-black text-neutral-900 dark:text-white">
              {formation.price === 0 ? t('detail.free') : formatPrice(formation.price)}
            </span>
          )}
        </div>
        {hasPromo && (
          <span className="inline-block mb-4 px-3 py-1 bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-xs font-bold rounded-full uppercase tracking-wider">
            {t('detail.save', { amount: formatPrice(formation.price - (formation.promoPrice ?? 0)) })}
          </span>
        )}

        <Button className="w-full mb-3" size="lg" onClick={handleEnroll}>
          {t('detail.enroll')}
        </Button>
        <p className="text-xs text-center text-neutral-400 mb-6">{t('detail.guaranteeShort')}</p>

        <p className="text-xs font-bold tracking-[0.18em] uppercase text-neutral-400 mb-3">{t('detail.includesTitle')}</p>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <Clock className="w-4 h-4 text-brand-500 shrink-0" /> <span>{t('detail.durationContent', { duration: formation.duration })}</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <BookOpen className="w-4 h-4 text-brand-500 shrink-0" /> <span>{t('detail.lessonsCount', { count: totalLessons })}</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
            <InfinityIcon className="w-4 h-4 text-brand-500 shrink-0" /> <span>{t('detail.lifetimeAccess')}</span>
          </div>
          {formation.certificateEnabled && (
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
              <Award className="w-4 h-4 text-success-500 shrink-0" /> <span>{t('detail.certificate')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogTitle={formation.ogTitle}
        ogDescription={formation.ogDescription}
        ogImage={formation.ogImage || formation.coverImage}
        canonical={formation.canonicalUrl}
        frPath={contentPath('formations', formation, 'fr')}
        enPath={contentPath('formations', formation, 'en')}
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

      {/* ─────────── HERO SOMBRE ─────────── */}
      <div className="bg-neutral-900 pt-28 pb-12 lg:pt-32 lg:pb-64">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.nav variants={staggerItem} className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
            <LocalizedLink to="/" className="hover:text-white transition-colors">{t('detail.breadcrumbHome')}</LocalizedLink>
            <span className="text-neutral-600">/</span>
            <LocalizedLink to="/formations" className="hover:text-white transition-colors">{t('detail.breadcrumbFormations')}</LocalizedLink>
            <span className="text-neutral-600">/</span>
            <TranslatedText text={display.category} className="text-neutral-500 truncate" />
          </motion.nav>

          <div className="lg:max-w-[58%]">
            <motion.p variants={staggerItem} className="text-xs font-bold tracking-[0.3em] uppercase text-brand-400 mb-4">
              <TranslatedText text={display.category} /> · {levelLabels[formation.level] ?? formation.level}
            </motion.p>
            <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4 leading-[1.1]">
              {display.title}
            </motion.h1>
            <motion.p variants={staggerItem} className="text-base lg:text-lg text-neutral-300 leading-relaxed mb-5">
              {display.description}
            </motion.p>
            <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-accent-400" fill="currentColor" />
                <span className="font-bold text-white">{formation.rating}</span>
              </span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{t('detail.studentsCount', { count: formation.students })}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formation.duration}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{t('detail.lessonsCount', { count: totalLessons })}</span>
              {formation.certificateEnabled && (
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-success-400" />{t('detail.certificateIncluded')}</span>
              )}
            </motion.div>
            <motion.p variants={staggerItem} className="mt-5 text-sm text-neutral-400">
              {t('detail.createdBy')} <span className="font-semibold text-white">Max-Morrys</span>
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* ─────────── CONTENU + CARTE D'ACHAT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-12 lg:items-start">

          {/* Carte d'achat — chevauche le hero sur desktop */}
          <aside className="lg:col-span-1 lg:order-2 -mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24 lg:-mt-[19rem]">
              {purchaseCard}
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="lg:col-span-2 lg:order-1 pt-12 lg:pt-14 pb-4">

            {/* Ce que tu apprendras */}
            {learnItems.length > 0 && (
              <motion.div
                className="mb-12 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 lg:p-8"
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                <h2 className="text-xl lg:text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-5">
                  {t('detail.learnTitle')}
                </h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {learnItems.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success-500 shrink-0 mt-0.5" />
                      <TranslatedText text={item} className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Programme */}
            {(formation.modules ?? []).length > 0 && (
            <motion.div
              className="mb-12"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-3`}>
                {t('detail.programEyebrow')}
              </p>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">
                {t('detail.programTitle')}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                {t('detail.programSummary', {
                  modules: t((formation.modules ?? []).length !== 1 ? 'detail.moduleCountOther' : 'detail.moduleCountOne', { count: (formation.modules ?? []).length }),
                  lessons: t('detail.lessonsCount', { count: totalLessons }),
                  duration: formation.duration,
                })}
              </p>
              <div className="space-y-3">
                {(formation.modules ?? []).map((module) => {
                  const isExpanded = expandedModules.includes(module.id);
                  return (
                    <div key={module.id} className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-9 h-9 rounded-full ${theme.softBadge} flex items-center justify-center text-sm font-black shrink-0`}>
                            {module.order}
                          </span>
                          <div className="text-left">
                            <TranslatedText text={module.title} as="p" className="font-bold text-neutral-900 dark:text-white" />
                            <p className="text-xs text-neutral-500">{t('detail.moduleLessons', { count: module.lessons.length })}</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />}
                      </button>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="border-t border-neutral-200 dark:border-neutral-700 overflow-hidden"
                        >
                          {module.lessons.map((lesson) => {
                            const Icon = lessonIcons[lesson.type] || FileText;
                            return (
                              <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                                <TranslatedText text={lesson.title} className="flex-1 text-sm text-neutral-700 dark:text-neutral-300" />
                                <span className="text-xs text-neutral-400 mr-2">{lesson.duration}</span>
                                {lesson.isFree ? (
                                  <span className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider">{t('detail.lessonFree')}</span>
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
            )}

            {/* Description */}
            <motion.div
              className="mb-12"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-6">
                {t('detail.descriptionTitle')}
              </h2>
              <div
                className="prose-article prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:transition-colors prose-img:shadow-soft prose-blockquote:not-italic prose-blockquote:font-medium"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(longDescriptionBody) }}
              />
            </motion.div>

            {/* Note & avis */}
            <motion.div
              className="mb-4"
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-6">
                {t('detail.reviewsTitle')}
              </h2>
              <div className="flex items-center gap-5 mb-7 p-5 rounded-2xl bg-accent-50 dark:bg-accent-900/10 border border-accent-200/60 dark:border-accent-900/30">
                <div className="text-center shrink-0">
                  <p className="text-4xl font-black text-accent-600 dark:text-accent-400 leading-none">{formation.rating}</p>
                  <p className="text-accent-500 text-sm mt-1 tracking-widest">★★★★★</p>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  <Trans
                    t={t}
                    i18nKey="detail.ratingSummary"
                    values={{ count: formation.students }}
                    components={{ strong: <span className="font-bold text-neutral-900 dark:text-white" /> }}
                  />
                </p>
              </div>
              {reviews.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {reviews.slice(0, 2).map((t) => (
                    <div key={t.id} className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
                      <Quote className="w-6 h-6 text-brand-500 mb-3" />
                      {t.mediaType === 'video' && t.mediaUrl && (
                        <video src={t.mediaUrl} controls playsInline className="w-full max-h-48 rounded-lg bg-black mb-4" />
                      )}
                      {t.mediaType === 'audio' && t.mediaUrl && (
                        <audio src={t.mediaUrl} controls className="w-full mb-4" />
                      )}
                      {t.content && <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed flex-1 mb-4">{t.content}</p>}
                      <div className="flex items-center gap-3">
                        {t.avatar ? (
                          <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover shrink-0" loading="lazy" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {initialsFromName(t.name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{t.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>

      {/* ─────────── BANDEAU GARANTIE ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-6">
          <ShieldCheck className="w-5 h-5 text-success-500 shrink-0" />
          {t('detail.guaranteeBanner')}
        </div>
      </div>

      {/* ─────────── CTA croisé → Blog ─────────── */}
      <motion.section
        className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-4`}>
            {t('detail.crossEyebrow')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            {t('detail.crossTitle')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            {t('detail.crossDescription')}
          </p>
          <LocalizedLink to="/blog" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide`}>
            {t('detail.crossCta')} <ArrowRight className="w-4 h-4" />
          </LocalizedLink>
        </div>
      </motion.section>
    </div>
  );
}
