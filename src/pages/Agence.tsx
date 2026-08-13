import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes, BrainCircuit, Server, Sparkle, ArrowRight, ChevronDown, Send, Check,
  Rocket, Building2, Landmark, UserRound,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../components/seo/seo-config';
import EditorialHeading from '../components/shared/EditorialHeading';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import LocalizedLink from '../components/shared/LocalizedLink';
import Button from '../components/ui/Button';
import Input, { Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import ClientWorkIndex from '../components/agency/ClientWorkIndex';
import VentureCard from '../components/agency/VentureCard';
import { staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';
import {
  agencyLeadConfig, isGrowthRequest, routingTagFor, MIN_DESCRIPTION_LENGTH,
} from '../lib/agency/engagement';
import {
  practices, pillars, ventures, corporateUrl, legalName, legalEntity,
  formatRegisteredAddress,
} from '../lib/brand';
import { saveEngagementLead } from '../lib/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, trackGenerateLead } from '../lib/tracking';
import { captureError } from '../lib/sentry';
import type {
  EngagementProjectType, EngagementBudget, EngagementTimeline,
} from '../types';

const theme = universeThemes.agency;
const viewportOnce = { once: true, amount: 0.2 };

/** Les quatre capabilities, dans l'ordre. Les icônes vivent ici, les libellés en i18n. */
const CAPABILITIES = [
  { key: 'product', icon: Boxes },
  { key: 'ai', icon: BrainCircuit },
  { key: 'technology', icon: Server },
  { key: 'brand', icon: Sparkle },
] as const;

const AUDIENCES = [
  { key: 'founders', icon: Rocket },
  { key: 'companies', icon: Building2 },
  { key: 'institutions', icon: Landmark },
  { key: 'executives', icon: UserRound },
] as const;

const HOW_WE_WORK = ['frame', 'design', 'build', 'run'] as const;

const EMPTY_FORM = {
  name: '',
  company: '',
  email: '',
  website: '',
  projectType: 'product' as EngagementProjectType,
  budget: 'exploring' as EngagementBudget,
  timeline: 'quarter' as EngagementTimeline,
  description: '',
  _hp: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState, string>>;

/**
 * Max-Morrys Agency — practice BUILD de MY ONOMA.
 *
 * ⚠️ Cette page ne publie AUCUNE grille tarifaire, AUCUN chiffre, AUCUN logo client et
 * AUCUN témoignage : l'offre est high-ticket, et rien de chiffré n'est vérifiable à ce jour.
 * Voir `docs/AGENCY-POSITIONING.md` et `docs/CONTENT-TODO.md`.
 *
 * ⚠️ L'offre TPE « Digital Commerce Local » vit sur `/presence-digitale`, avec son propre
 * tunnel. Les deux ne doivent jamais se mélanger.
 *
 * ⚠️ Vouvoiement intégral — le reste du site tutoie, cette page s'adresse à des fondateurs,
 * des PME et des institutions. Voir `docs/UX-AUDIT.md §2`.
 */
export default function Agence() {
  const { t } = useTranslation('agency');
  const { language } = useLanguage();
  const { addToast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number[]>([]);
  const formStarted = useRef(false);

  const faqItems = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];

  const build = practices.build;
  const grow = practices.grow;

  /** Vue de page — une seule fois, pas à chaque re-rendu. */
  useEffect(() => {
    trackEvent('agency_view', { practice: build.pillar });
  }, [build.pillar]);

  /** La demande relève-t-elle de Cléa ? Recalculé à chaque frappe pour prévenir en amont. */
  const isGrowth = useMemo(
    () => isGrowthRequest(form.projectType, form.description),
    [form.projectType, form.description],
  );

  const selectCls = `w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 ${theme.focusRing}`;

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    // Premier contact avec le formulaire : signalé une seule fois.
    if (!formStarted.current) {
      formStarted.current = true;
      trackEvent('agency_form_start');
    }
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = t('form.required');
    if (!form.company.trim()) next.company = t('form.required');
    if (!form.email.trim()) next.email = t('form.required');
    else if (!EMAIL_RE.test(form.email.trim())) next.email = t('form.invalidEmail');
    if (!form.description.trim()) next.description = t('form.required');
    else if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      next.description = t('form.descriptionTooShort');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Pot de miel : un bot remplit tout, on abandonne sans le lui dire.
    if (form._hp) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const routedTo = routingTagFor(form.projectType, form.description);
      await saveEngagementLead({
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        ...(form.website.trim() ? { website: form.website.trim() } : {}),
        projectType: form.projectType,
        budget: form.budget,
        timeline: form.timeline,
        description: form.description.trim(),
        ...(routedTo ? { routedTo } : {}),
        locale: language,
      });

      trackGenerateLead('agency_engagement');
      trackEvent('agency_form_submit', {
        project_type: form.projectType,
        budget: form.budget,
        timeline: form.timeline,
        routed_to: routedTo ?? 'build',
      });

      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (error: unknown) {
      captureError(error, { context: 'Agency engagement form submit failed' });
      addToast('error', t('form.errorToast'));
    } finally {
      setSubmitting(false);
    }
  }

  const toggleFaq = (i: number) =>
    setOpenFaq((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  /**
   * Données structurées.
   *
   * ⚠️ `Service` avec `provider` = MY ONOMA SARL, et `brand` = Max-Morrys Agency.
   * Max-Morrys Agency est une MARQUE, pas une personne morale : il ne doit jamais exister
   * d'`Organization` autonome portant ce nom. Voir `docs/SEO-AUDIT.md §3`.
   */
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: build.brand,
      serviceType: build.discipline,
      description: t('seoDescription'),
      url: buildCanonical('/agence'),
      brand: { '@type': 'Brand', name: build.brand },
      provider: {
        '@type': 'Organization',
        name: legalName,
        url: corporateUrl,
        address: {
          '@type': 'PostalAddress',
          streetAddress: legalEntity.registeredAddress,
          addressLocality: legalEntity.city,
          addressCountry: legalEntity.countryCode,
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Max-Morrys', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: build.brand, item: buildCanonical('/agence') },
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-neutral-950">
      <SEOHead
        title={t('seoTitle')}
        description={t('seoDescription')}
        canonical={buildCanonical('/agence')}
        frPath="/agence"
        enPath="/en/agency"
      />
      <JsonLd data={jsonLd} />

      {/* ── 01 · Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-neutral-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-lagoon-400 mb-6">
              {t('hero.eyebrow')}
            </p>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-balance leading-[1.05]">
              {t('hero.titlePart1')}
              <span className="text-lagoon-400">{t('hero.titleAccent')}</span>
              {t('hero.titlePart2')}
            </h1>
            <p className="mt-8 text-lg lg:text-xl text-neutral-300 max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <p className="mt-8 text-sm font-bold tracking-[0.2em] uppercase text-neutral-500">
              {t('hero.disciplines')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a href="#projet" onClick={() => trackEvent('agency_cta_click', { location: 'hero' })}>
                <Button size="lg" className="w-full sm:w-auto bg-lagoon-500 text-neutral-900 hover:bg-lagoon-400">
                  {t('hero.cta')}
                </Button>
              </a>
              <a href="#realisations">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10">
                  {t('hero.ctaSecondary')}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 02 · Avec qui nous travaillons ────────────────────────────────────── */}
      <section className="py-20 lg:py-28 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorialHeading
            eyebrow={t('whoWeHelp.eyebrow')}
            eyebrowColor="lagoon"
            segments={[
              { text: t('whoWeHelp.titlePart1') },
              { text: t('whoWeHelp.titleAccent'), color: 'lagoon' },
              { text: t('whoWeHelp.titlePart2') },
            ]}
          />
          <p className="mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {t('whoWeHelp.subtitle')}
          </p>

          <motion.div
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {AUDIENCES.map(({ key, icon }) => (
              <motion.div
                key={key}
                variants={staggerItem}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6"
              >
                <AnimatedIcon icon={icon} animation="float" iconClassName="w-6 h-6 text-lagoon-700 dark:text-lagoon-400" />
                <h3 className="mt-5 text-lg font-bold text-neutral-900 dark:text-white">
                  {t(`whoWeHelp.audiences.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t(`whoWeHelp.audiences.${key}.desc`)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-12 rounded-2xl bg-neutral-50 dark:bg-neutral-900 p-7 max-w-3xl">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-400 mb-3">
              {t('whoWeHelp.notForTitle')}
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {t('whoWeHelp.notFor')}
            </p>
          </div>
        </div>
      </section>

      {/* ── 03 · Capabilities ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorialHeading
            eyebrow={t('capabilities.eyebrow')}
            eyebrowColor="lagoon"
            segments={[
              { text: t('capabilities.titlePart1') },
              { text: t('capabilities.titleAccent'), color: 'lagoon' },
              { text: t('capabilities.titlePart2') },
            ]}
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {CAPABILITIES.map(({ key, icon: Icon }, index) => {
              const items = t(`capabilities.${key}.items`, { returnObjects: true }) as string[];
              return (
                <motion.article
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  onViewportEnter={() => trackEvent('agency_capability_view', { capability: key })}
                  className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-7 lg:p-9"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <span className="grid place-items-center w-11 h-11 rounded-xl bg-lagoon-50 dark:bg-lagoon-900/30">
                      <Icon className="w-5 h-5 text-lagoon-700 dark:text-lagoon-400" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                    {t(`capabilities.${key}.name`)}
                  </h3>
                  <p className="mt-2 text-lagoon-700 dark:text-lagoon-400 font-medium">
                    {t(`capabilities.${key}.tagline`)}
                  </p>
                  <p className="mt-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {t(`capabilities.${key}.desc`)}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-lagoon-600" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 04 · Selected work ────────────────────────────────────────────────── */}
      <section id="realisations" className="py-20 lg:py-28 border-b border-neutral-100 dark:border-neutral-800 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorialHeading
            eyebrow={t('work.eyebrow')}
            eyebrowColor="lagoon"
            segments={[
              { text: t('work.titlePart1') },
              { text: t('work.titleAccent'), color: 'lagoon' },
              { text: t('work.titlePart2') },
            ]}
          />

          {/*
            ⚠️ Deux blocs séparés, jamais une grille commune : un projet client n'appartient
            pas à MY ONOMA, une venture si. Voir docs/BRAND-ARCHITECTURE.md §6.
          */}
          <div className="mt-14">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{t('work.clientsTitle')}</h3>
            <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{t('work.clientsDesc')}</p>
            <ClientWorkIndex />
          </div>

          <div className="mt-16 pt-16 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{t('work.venturesTitle')}</h3>
            <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{t('work.venturesDesc')}</p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ventures.map((venture) => (
                <VentureCard key={venture.slug} venture={venture} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 · Comment nous travaillons ─────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorialHeading
            eyebrow={t('howWeWork.eyebrow')}
            eyebrowColor="lagoon"
            segments={[
              { text: t('howWeWork.titlePart1') },
              { text: t('howWeWork.titleAccent'), color: 'lagoon' },
              { text: t('howWeWork.titlePart2') },
            ]}
          />
          <motion.ol
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {HOW_WE_WORK.map((step, i) => (
              <motion.li key={step} variants={staggerItem} className="relative">
                <span className="text-5xl font-black text-lagoon-500/25 dark:text-lagoon-400/20 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-bold text-neutral-900 dark:text-white">
                  {t(`howWeWork.steps.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t(`howWeWork.steps.${step}.desc`)}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ── 06 · MY ONOMA ─────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-lagoon-700 dark:text-lagoon-400 mb-5">
              {t('myOnoma.eyebrow')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-balance text-neutral-900 dark:text-white">
              {t('myOnoma.title')}
            </h2>
            <p className="mt-6 text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('myOnoma.body')}
            </p>
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed">
              {t('myOnoma.legalNote')}
            </p>
            <a
              href={corporateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 font-semibold text-lagoon-700 dark:text-lagoon-400 hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-600 rounded"
            >
              {t('myOnoma.cta')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500 mb-5">
              {t('myOnoma.pillarsLabel')}
            </p>
            <ul className="space-y-4">
              {pillars.map((pillar) => {
                const practice =
                  pillar === 'BUILD' ? build : pillar === 'GROW' ? grow : null;
                return (
                  <li
                    key={pillar}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-black tracking-[0.2em] text-neutral-900 dark:text-white">
                        {pillar}
                      </span>
                      {practice && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('myOnoma.carriedBy')} {practice.brand}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {t(`myOnoma.pillars.${pillar.toLowerCase()}`)}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Renvoi vers la practice sœur — jamais présentée comme un sous-traitant. */}
            <div className="mt-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900 p-6">
              <h3 className="font-bold text-neutral-900 dark:text-white">{t('myOnoma.growTitle')}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('myOnoma.growBody')}
              </p>
              <p className="mt-3 text-sm font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {t('myOnoma.growDistinction')}
              </p>
              <a
                href={`${corporateUrl}${grow.corporatePath}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('growth_referral_click', { source: 'agency_myonoma' })}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lagoon-700 dark:text-lagoon-400 hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-600 rounded"
              >
                {t('myOnoma.growCta')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 07 · FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorialHeading
            eyebrow={t('faq.eyebrow')}
            eyebrowColor="lagoon"
            segments={[
              { text: t('faq.titlePart1') },
              { text: t('faq.titleAccent'), color: 'lagoon' },
              { text: t('faq.titlePart2') },
            ]}
          />
          <div className="mt-12 divide-y divide-neutral-200 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800">
            {faqItems.map((item, i) => {
              const open = openFaq.includes(i);
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={open}
                    aria-controls={`agency-faq-${i}`}
                    className={`w-full flex items-center justify-between gap-6 py-5 text-left focus:outline-none focus-visible:ring-2 ${theme.focusRing} rounded`}
                  >
                    <span className="font-semibold text-neutral-900 dark:text-white">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={`agency-faq-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-10 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 08 · Formulaire de qualification ──────────────────────────────────── */}
      <section id="projet" className="py-20 lg:py-28 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center rounded-2xl border border-lagoon-500/40 bg-lagoon-50 dark:bg-lagoon-900/20 p-10"
            >
              <span className="grid place-items-center w-14 h-14 mx-auto rounded-full bg-lagoon-500 text-neutral-900">
                <Check className="w-7 h-7" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-2xl font-black text-neutral-900 dark:text-white">
                {t('form.success.title')}
              </h2>
              <p className="mt-3 text-neutral-700 dark:text-neutral-300">{t('form.success.body')}</p>
              <Button className="mt-8" variant="outline" onClick={() => setSubmitted(false)}>
                {t('form.success.backCta')}
              </Button>
            </motion.div>
          ) : (
            <>
              <EditorialHeading
                eyebrow={t('form.eyebrow')}
                eyebrowColor="lagoon"
                segments={[
                  { text: t('form.titlePart1') },
                  { text: t('form.titleAccent'), color: 'lagoon' },
                  { text: t('form.titlePart2') },
                ]}
              />
              <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('form.subtitle')}
              </p>

              <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
                {/* Pot de miel — hors flux, hors tabulation, invisible aux lecteurs d'écran. */}
                <div className="absolute w-px h-px overflow-hidden -m-px" aria-hidden="true">
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form._hp}
                    onChange={(e) => setForm((p) => ({ ...p, _hp: e.target.value }))}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label={t('form.nameLabel')}
                    placeholder={t('form.namePlaceholder')}
                    value={form.name}
                    error={errors.name}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                  <Input
                    label={t('form.companyLabel')}
                    placeholder={t('form.companyPlaceholder')}
                    value={form.company}
                    error={errors.company}
                    onChange={(e) => setField('company', e.target.value)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    type="email"
                    label={t('form.emailLabel')}
                    placeholder={t('form.emailPlaceholder')}
                    value={form.email}
                    error={errors.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                  <Input
                    type="url"
                    label={t('form.websiteLabel')}
                    placeholder={t('form.websitePlaceholder')}
                    value={form.website}
                    onChange={(e) => setField('website', e.target.value)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor="projectType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('form.projectTypeLabel')}
                    </label>
                    <select
                      id="projectType"
                      className={selectCls}
                      value={form.projectType}
                      onChange={(e) => setField('projectType', e.target.value as EngagementProjectType)}
                    >
                      {agencyLeadConfig.projectTypes.map((key) => (
                        <option key={key} value={key}>{t(`form.projectTypes.${key}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('form.budgetLabel')}
                    </label>
                    <select
                      id="budget"
                      className={selectCls}
                      value={form.budget}
                      onChange={(e) => setField('budget', e.target.value as EngagementBudget)}
                    >
                      {agencyLeadConfig.budgets.map((key) => (
                        <option key={key} value={key}>{t(`form.budgets.${key}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('form.timelineLabel')}
                    </label>
                    <select
                      id="timeline"
                      className={selectCls}
                      value={form.timeline}
                      onChange={(e) => setField('timeline', e.target.value as EngagementTimeline)}
                    >
                      {agencyLeadConfig.timelines.map((key) => (
                        <option key={key} value={key}>{t(`form.timelines.${key}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Textarea
                  label={t('form.descriptionLabel')}
                  placeholder={t('form.descriptionPlaceholder')}
                  rows={6}
                  value={form.description}
                  error={errors.description}
                  onChange={(e) => setField('description', e.target.value)}
                />

                {/*
                  Routage Cléa : le prospect est prévenu AVANT d'envoyer, pas après. La
                  demande part quand même — on ne rejette jamais un lead.
                */}
                <AnimatePresence>
                  {isGrowth && (
                    <motion.aside
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-lagoon-500/40 bg-lagoon-50 dark:bg-lagoon-900/20 p-6">
                        <h3 className="font-bold text-neutral-900 dark:text-white">
                          {t('form.growNotice.title')}
                        </h3>
                        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {t('form.growNotice.body')}
                        </p>
                        <a
                          href={`${corporateUrl}${grow.corporatePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent('growth_referral_click', { source: 'agency_form' })}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-lagoon-700 dark:text-lagoon-400 hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-600 rounded"
                        >
                          {t('form.growNotice.cta')}
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </a>
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  size="lg"
                  loading={submitting}
                  icon={<Send className="w-4 h-4" />}
                  className="w-full sm:w-auto bg-lagoon-700 hover:bg-lagoon-800 text-white"
                >
                  {submitting ? t('form.submitting') : t('form.submit')}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── 09 · CTA final + renvoi Présence Digitale ─────────────────────────── */}
      <section className="bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-balance">
              {t('finalCta.titlePart1')}
              <span className="text-lagoon-400">{t('finalCta.titleAccent')}</span>
              {t('finalCta.titlePart2')}
            </h2>
            <p className="mt-5 text-lg text-neutral-300">{t('finalCta.subtitle')}</p>
            <a href="#projet" onClick={() => trackEvent('agency_cta_click', { location: 'final' })}>
              <Button size="lg" className="mt-8 bg-lagoon-500 text-neutral-900 hover:bg-lagoon-400">
                {t('finalCta.cta')}
              </Button>
            </a>
          </div>

          {/*
            Bifurcation vers l'autre offre commerciale du site : un commerçant qui atterrit
            ici doit trouver sa porte, sans que la page d'agence vende des packs.
          */}
          <div className="mt-16 pt-10 border-t border-neutral-800 max-w-2xl">
            <h3 className="font-bold text-white">{t('finalCta.presenceTitle')}</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{t('finalCta.presenceBody')}</p>
            <LocalizedLink
              to="/presence-digitale"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lagoon-400 hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-400 rounded"
            >
              {t('finalCta.presenceCta')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </LocalizedLink>
          </div>

          {/* Précision juridique — discrète, jamais un paragraphe corporate. */}
          <p className="mt-14 text-xs text-neutral-500">
            {legalName} · {formatRegisteredAddress()}
          </p>
        </div>
      </section>
    </div>
  );
}
