import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, MapPin, MessageCircle, Search, BarChart3, CalendarClock,
  ChevronDown, Send, ArrowRight, Check, Copy, ExternalLink, ShoppingCart, Sparkles, Rocket,
} from 'lucide-react';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import ParallaxImage from '../components/shared/ParallaxImage';
import LocalizedLink from '../components/shared/LocalizedLink';
import Button from '../components/ui/Button';
import Input, { Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import MapsProof from '../components/presence/MapsProof';
import PackSelector from '../components/presence/PackSelector';
import PricingCard from '../components/presence/PricingCard';
import StickyWhatsApp from '../components/presence/StickyWhatsApp';
import { saveAgencyLead } from '../lib/firestore';
import { useFormat } from '../hooks/useFormat';
import { captureError } from '../lib/sentry';
import { trackGenerateLead } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';
import {
  PACKS, PLANS, OPTIONS, JOURNEY_STEPS, PROCESS_STEPS, TERMS, SECTOR_KEYS,
  PACK_KEYS, PLAN_KEYS, findPack, findPlan, computeTotals, type Recommendation,
} from '../lib/presence/offer';
import { whatsappUrl, buildWhatsAppMessage, buildQuickMessage } from '../lib/presence/whatsapp';
import type { AgencyPack, AgencyPlan } from '../types';

const theme = universeThemes.agency;
const viewportOnce = { once: true, amount: 0.15 } as const;

/**
 * Visuels de la page Agence — déposer les fichiers dans /Agence/ sur media.maxmorrys.me.
 * Format attendu : WebP, 1600 px de large au plus. Le héro n'est pas différable
 * (au-dessus de la ligne de flottaison), chaque kilo-octet s'y paie comptant.
 *
 * Tant que les fichiers sont absents, les deux sections retombent proprement sur
 * leur couleur de fond pleine — aucun lien brisé, aucun décalage de mise en page.
 */
const HERO_IMAGE = 'https://media.maxmorrys.me/Agence/hero.webp';
const PROCESS_IMAGE = 'https://media.maxmorrys.me/Agence/process.webp';

const PACK_ICONS = { presence: Store, visible: Search, boutique: ShoppingCart } as const;
const PLAN_ICONS = { croissance: CalendarClock, commerce360: Rocket } as const;
const JOURNEY_ICONS = {
  found: MapPin, present: Store, convert: MessageCircle, measure: BarChart3, engage: CalendarClock,
} as const;

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Numéros AOF : indicatif optionnel, espaces/points/tirets tolérés, 8 chiffres minimum.
const PHONE_RE = /^\+?[\d\s.-]{8,20}$/;

const EMPTY_FORM = {
  businessName: '', contactName: '', phone: '', email: '', city: '',
  sector: SECTOR_KEYS[0] as string,
  pack: 'undecided' as AgencyPack,
  plan: 'undecided' as AgencyPlan,
  message: '', referralCode: '', _hp: '',
};

export default function PresenceDigitale() {
  const { t } = useTranslation('presence');
  const { formatPrice, language } = useFormat();
  const { addToast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [quoteRef, setQuoteRef] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  /** Recommandation du sélecteur — badge « conseillé », distinct de la sélection. */
  const [reco, setReco] = useState<Recommendation | null>(null);
  /** Copie figée à l'envoi : le formulaire est vidé juste après, le message WhatsApp non. */
  const [submittedData, setSubmittedData] = useState<typeof EMPTY_FORM | null>(null);
  /** Incrémenté après envoi pour réinitialiser le sélecteur depuis le parent. */
  const [resetSignal, setResetSignal] = useState(0);
  /** Visuel du héro introuvable : on retombe sur l'aplat lagoon-900. */
  const [heroFailed, setHeroFailed] = useState(false);

  const faqItems = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];

  const selectCls = `w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 ${theme.focusRing}`;

  /** Fait défiler jusqu'au formulaire en pré-sélectionnant l'offre cliquée. */
  const jumpToForm = useCallback((patch: Partial<typeof EMPTY_FORM>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmitted(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /**
   * Le sélecteur écrit dans le formulaire à CHAQUE réponse, pas seulement au clic
   * sur « Demander ce devis ». C'est ce qui garantit que modifier une réponse déjà
   * donnée met bien à jour la sélection — sinon le formulaire garde l'ancien pack
   * pendant que la carte surlignée, elle, a changé.
   */
  const handleRecommend = useCallback((r: Recommendation) => {
    setReco(r);
    setForm((prev) => ({ ...prev, pack: r.pack, plan: r.plan }));
  }, []);

  /** « Demander ce devis » ne fait plus que défiler : la synchro a déjà eu lieu. */
  const acceptReco = useCallback((r: Recommendation) => {
    jumpToForm({ pack: r.pack, plan: r.plan });
  }, [jumpToForm]);

  /** « Recommencer » efface aussi la sélection du formulaire, pas seulement les réponses. */
  const resetSelection = useCallback(() => {
    setReco(null);
    setForm((prev) => ({ ...prev, pack: 'undecided', plan: 'undecided' }));
  }, []);

  const quoteUrl = quoteRef
    ? `${SITE_URL}${language === 'en' ? '/en/digital-presence/quote/' : '/presence-digitale/devis/'}${quoteRef}`
    : '';

  /** Libellés du message WhatsApp, traduits et formatés ici, assemblés par le module dédié. */
  const messageLabels = useMemo(() => ({
    greeting: t('whatsapp.greeting'),
    intro: t('whatsapp.intro'),
    packName: findPack(form.pack) ? t(`packs.${form.pack}.name`) : undefined,
    planName: findPlan(form.plan) ? t(`plans.${form.plan}.name`) : undefined,
    sectorLabel: t(`form.sectors.${form.sector}`),
    monthlySuffix: findPlan(form.plan)
      ? t('plans.monthlyLabel', { price: formatPrice(findPlan(form.plan)!.monthlyPrice) })
      : undefined,
    upfrontLabel: t('quote.upfrontTotal'),
    depositLabel: t('quote.deposit'),
    quoteLabel: t('whatsapp.quoteLabel'),
  }), [t, form.pack, form.plan, form.sector, formatPrice]);

  /**
   * Message complet de passage de main, reconstruit à la volée.
   * `submittedData` fige l'état au moment de l'envoi : le formulaire est vidé juste
   * après, sans quoi l'écran de succès afficherait un message vide.
   */
  const handoffMessage = useMemo(() => {
    const data = submittedData ?? form;
    return buildWhatsAppMessage({
      businessName: data.businessName,
      city: data.city,
      pack: data.pack,
      plan: data.plan,
      message: data.message,
      quoteUrl: quoteUrl || undefined,
      formatPrice,
      labels: {
        ...messageLabels,
        packName: findPack(data.pack) ? t(`packs.${data.pack}.name`) : undefined,
        planName: findPlan(data.plan) ? t(`plans.${data.plan}.name`) : undefined,
        sectorLabel: t(`form.sectors.${data.sector}`),
        monthlySuffix: findPlan(data.plan)
          ? t('plans.monthlyLabel', { price: formatPrice(findPlan(data.plan)!.monthlyPrice) })
          : undefined,
      },
    });
  }, [submittedData, form, quoteUrl, formatPrice, messageLabels, t]);

  /** Message court des CTA contextuels (hero, bouton collant, cartes). */
  const quickMessage = useMemo(() => {
    const pack = findPack(form.pack);
    return pack
      ? buildQuickMessage(t('whatsapp.quickIntro'), t(`packs.${form.pack}.name`), formatPrice(pack.price))
      : t('whatsapp.quickIntro');
  }, [form.pack, t, formatPrice]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.businessName.trim()) errs.businessName = t('validation.businessNameRequired');
    if (!form.contactName.trim()) errs.contactName = t('validation.contactNameRequired');
    if (!form.phone.trim()) errs.phone = t('validation.phoneRequired');
    else if (!PHONE_RE.test(form.phone.trim())) errs.phone = t('validation.phoneInvalid');
    if (!form.city.trim()) errs.city = t('validation.cityRequired');
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = t('validation.emailInvalid');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const update = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form._hp) return; // honeypot — abandon silencieux des soumissions robot
    if (!validate()) return;
    setLoading(true);
    try {
      const { quoteRef: ref } = await saveAgencyLead({
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        sector: form.sector,
        pack: form.pack,
        plan: form.plan,
        locale: language,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.message.trim() ? { message: form.message.trim() } : {}),
        ...(form.referralCode.trim() ? { referralCode: form.referralCode.trim().toUpperCase() } : {}),
      });
      // La valeur du lead alimente les conversions GA4 et Meta : sans elle, toutes les
      // demandes pèsent pareil, qu'il s'agisse d'un pack à 295 000 ou d'un Commerce 360.
      const totals = computeTotals(form.pack, form.plan);
      trackGenerateLead('agency_quote_form', totals.upfront || undefined);

      setQuoteRef(ref);
      setSubmittedData(form);
      setSubmitted(true);
      setForm(EMPTY_FORM);
      setReco(null);
      setResetSignal((n) => n + 1);
      addToast('success', t('toast.success'));
    } catch (error: unknown) {
      captureError(error, { context: 'Save agency lead failed' });
      addToast('error', t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  const copyQuoteLink = async () => {
    try {
      await navigator.clipboard.writeText(quoteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) :
      // le lien reste visible et cliquable juste au-dessus.
    }
  };

  return (
    <div>
      <SEOHead
        title={t('seoTitle')}
        description={t('seoDescription')}
        canonical={buildCanonical('/presence-digitale')}
        frPath="/presence-digitale"
        enPath="/en/digital-presence"
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('seoTitle'),
        description: t('seoDescription'),
        serviceType: 'Digital presence for local businesses',
        provider: { '@type': 'Organization', name: 'Max-Morrys', url: SITE_URL },
        areaServed: [
          { '@type': 'City', name: 'Dakar' },
          { '@type': 'City', name: 'Abidjan' },
          { '@type': 'City', name: 'Cotonou' },
        ],
        offers: PACKS.map((p) => ({
          '@type': 'Offer',
          name: t(`packs.${p.key}.name`),
          price: p.price,
          priceCurrency: 'XOF',
        })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }} />

      {/* ── HERO ──
          `bg-lagoon-900` sous l'image : si le visuel manque encore sur le CDN,
          la section reste un aplat de marque lisible plutôt qu'un trou blanc. */}
      <section className="relative overflow-hidden bg-lagoon-900 pt-28 pb-16 lg:pt-36 lg:pb-24">
        {!heroFailed && (
          <img
            src={HERO_IMAGE}
            alt=""
            aria-hidden="true"
            loading="eager"
            onError={() => setHeroFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Voile dégradé : dense à gauche pour porter la carte, dégagé à droite
            pour laisser respirer le visuel. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-lagoon-900/85 via-lagoon-900/55 to-lagoon-900/10"
        />

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Carte givrée : c'est elle qui garantit la lisibilité du texte quelle
              que soit la photo placée derrière. */}
          <div className="max-w-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10">
            <motion.div variants={staggerItem} className="flex items-center gap-3 mb-5">
              <AnimatedIcon
                icon={Store}
                animation="float"
                className="w-11 h-11 rounded-2xl bg-lagoon-100 dark:bg-lagoon-900/30 shrink-0"
                iconClassName="w-5 h-5 text-lagoon-700 dark:text-lagoon-400"
              />
              <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
                {t('eyebrow')}
              </p>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.98] mb-5"
            >
              {t('heroTitle1')}<br />{t('heroTitle2')}
            </motion.h1>

            <motion.div variants={staggerItem}>
              <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed mb-7">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#selecteur"
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-colors ${theme.buttonSolid}`}
                >
                  {t('heroCta')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href={whatsappUrl(quickMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 hover:border-lagoon-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  {t('heroSecondary')}
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── PREUVE GOOGLE MAPS — avant tout prix, délibérément ── */}
      <motion.section
        className="relative overflow-hidden bg-white dark:bg-neutral-950 py-16 lg:py-20"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {/* Halos lagoon — décor ambiant, motif partagé avec la page Vidéos. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 right-[8%] w-80 h-80 rounded-full bg-lagoon-500/20 blur-[130px]" />
          <div className="absolute bottom-0 left-[12%] w-96 h-96 rounded-full bg-lagoon-700/15 blur-[160px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <MapsProof />
        </div>
      </motion.section>

      {/* ── LE PARCOURS EN 5 ÉTAPES ── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 py-20 lg:py-24 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="max-w-2xl mb-12">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
              {t('journey.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('journey.subtitle')}</p>
          </motion.div>

          {/* Carrousel à accroche sur mobile, grille de 5 au-delà : cinq cartes empilées
              verticalement feraient une colonne interminable sur téléphone. */}
          <motion.ol
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-5 lg:overflow-visible"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {JOURNEY_STEPS.map((step, i) => {
              const Icon = JOURNEY_ICONS[step];
              return (
                <motion.li
                  key={step}
                  variants={staggerItem}
                  className="relative overflow-hidden snap-start shrink-0 w-[72vw] sm:w-[45vw] lg:w-auto p-6 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700"
                >
                  {/* Filigrane chiffré — motif repris des cartes membres du Club
                      (Formations.tsx). Il double le badge, il ne le remplace pas. */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-6 -right-2 text-[110px] leading-none font-black tabular-nums text-neutral-900 dark:text-white opacity-[0.06] select-none pointer-events-none"
                  >
                    {i + 1}
                  </span>

                  <div className={`relative w-9 h-9 rounded-full flex items-center justify-center mb-4 font-black text-sm tabular-nums ${theme.signatureFill}`}>
                    {i + 1}
                  </div>
                  <Icon className={`relative w-5 h-5 mb-3 ${theme.accentText}`} aria-hidden="true" />
                  <h3 className="relative font-black text-neutral-900 dark:text-white mb-1.5">
                    {t(`journey.${step}.title`)}
                  </h3>
                  <p className="relative text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {t(`journey.${step}.text`)}
                  </p>
                </motion.li>
              );
            })}
          </motion.ol>
        </div>
      </section>

      {/* ── SÉLECTEUR ── */}
      <motion.section
        id="selecteur"
        className="bg-white dark:bg-neutral-950 py-20 lg:py-24 scroll-mt-24"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <PackSelector
            onRecommend={handleRecommend}
            onAccept={acceptReco}
            onReset={resetSelection}
            resetSignal={resetSignal}
          />
        </div>
      </motion.section>

      {/* ── MISE EN PLACE ── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 py-20 lg:py-24 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="max-w-2xl mb-14">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
              {t('packs.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('packs.subtitle')}</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 items-start"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {PACKS.map((pack) => {
              const features = t(`packs.${pack.key}.features`, { returnObjects: true }) as string[];
              const isReco = reco?.pack === pack.key;
              const isSelected = form.pack === pack.key;
              return (
                // `order-first` sur mobile : la carte recommandée doit être la première vue,
                // sans réordonner le DOM (le lecteur d'écran garde l'ordre logique).
                <motion.div key={pack.key} variants={staggerItem} className={isSelected || isReco ? 'md:order-none order-first' : ''}>
                  <PricingCard
                    icon={PACK_ICONS[pack.key]}
                    name={t(`packs.${pack.key}.name`)}
                    tagline={t(`packs.${pack.key}.for`)}
                    price={formatPrice(pack.price)}
                    priceLabel={t('packs.priceLabel')}
                    secondaryPrice={
                      pack.promoPrice
                        ? t('packs.promoLabel', { price: formatPrice(pack.promoPrice) })
                        : t('packs.supportIncluded', { days: pack.supportDays })
                    }
                    features={features}
                    note={pack.key === 'boutique' ? t('packs.boutique.note') : undefined}
                    ctaLabel={t('packs.cta')}
                    onSelect={() => jumpToForm({ pack: pack.key })}
                    featured={pack.featured}
                    recommended={isReco}
                    selected={isSelected}
                    featuredLabel={t('packs.featured')}
                    recommendedLabel={t('packs.recommended')}
                    selectedLabel={t('packs.selected')}
                    whatsappHref={whatsappUrl(buildQuickMessage(
                      t('whatsapp.quickIntro'), t(`packs.${pack.key}.name`), formatPrice(pack.price),
                    ))}
                    whatsappLabel={t('whatsapp.cardCta')}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── ACCOMPAGNEMENT ── */}
      <section className="bg-white dark:bg-neutral-950 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="max-w-2xl mb-14">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
              {t('plans.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('plans.subtitle')}</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6 items-start max-w-4xl"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {PLANS.map((plan) => {
              const features = t(`plans.${plan.key}.features`, { returnObjects: true }) as string[];
              const isReco = reco?.plan === plan.key;
              const isSelected = form.plan === plan.key;
              const total = plan.commitmentMonths
                ? plan.setupPrice + plan.monthlyPrice * plan.commitmentMonths
                : 0;
              return (
                <motion.div key={plan.key} variants={staggerItem}>
                  <PricingCard
                    icon={PLAN_ICONS[plan.key]}
                    name={t(`plans.${plan.key}.name`)}
                    tagline={t(`plans.${plan.key}.for`)}
                    price={formatPrice(plan.setupPrice)}
                    priceLabel={t('plans.setupLabel')}
                    secondaryPrice={
                      plan.commitmentMonths
                        ? `${t('plans.monthlyLabel', { price: formatPrice(plan.monthlyPrice) })} · ${t('plans.commitmentLabel', { months: plan.commitmentMonths, total: formatPrice(total) })}`
                        : t('plans.monthlyLabel', { price: formatPrice(plan.monthlyPrice) })
                    }
                    features={features}
                    note={plan.key === 'commerce360' ? t('plans.commerce360.note') : undefined}
                    ctaLabel={t('plans.cta')}
                    onSelect={() => jumpToForm({ plan: plan.key })}
                    featured={plan.featured}
                    recommended={isReco}
                    selected={isSelected}
                    featuredLabel={t('plans.featured')}
                    recommendedLabel={t('plans.recommended')}
                    selectedLabel={t('plans.selected')}
                    whatsappHref={whatsappUrl(buildQuickMessage(
                      t('whatsapp.quickIntro'), t(`plans.${plan.key}.name`), formatPrice(plan.setupPrice),
                    ))}
                    whatsappLabel={t('whatsapp.cardCta')}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── OPTIONS (replié) ── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 py-16 lg:py-20 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">
            {t('options.title')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{t('options.subtitle')}</p>

          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            aria-expanded={showOptions}
            className={`inline-flex items-center gap-2 text-sm font-bold ${theme.accentText}`}
          >
            {t('options.toggle')}
            <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          <AnimatePresence initial={false}>
            {showOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <ul className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-700 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                  {OPTIONS.map((opt) => {
                    const unitLabel = opt.unit === 'product' ? t('options.perProduct')
                      : opt.unit === 'page' ? t('options.perPage')
                      : opt.unit === 'month' ? t('options.perMonth') : '';
                    return (
                      <li key={opt.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-5">
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 dark:text-white">{t(`options.${opt.key}.name`)}</p>
                          <p className="text-sm text-neutral-500">{t(`options.${opt.key}.text`)}</p>
                        </div>
                        <p className={`text-sm font-bold tabular-nums whitespace-nowrap ${theme.accentText}`}>
                          {t('options.range', { min: formatPrice(opt.min), max: formatPrice(opt.max) })}
                          {unitLabel && <span className="text-neutral-500 font-medium"> {unitLabel}</span>}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── PROCESS — seule rupture plein-cadre de la page ──
          Placée après la zone de décision (sélecteur → packs → options), pour
          relancer la lecture avant la FAQ et le formulaire. */}
      <section className="relative overflow-hidden bg-neutral-950 py-20 lg:py-28">
        <ParallaxImage src={PROCESS_IMAGE} />
        <div aria-hidden="true" className="absolute inset-0 bg-neutral-950/80" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={slideUp} initial="hidden" whileInView="visible" viewport={viewportOnce} className="max-w-2xl mb-12">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-3">
              {t('process.title')}
            </h2>
            <p className="text-lg text-white/70">{t('process.subtitle')}</p>
          </motion.div>

          <motion.ol
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {PROCESS_STEPS.map((step, i) => (
              <motion.li key={step} variants={staggerItem} className="p-5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm">
                {/* lagoon-400 sur neutral-950 : 10,4:1 */}
                <p className="text-xs font-black tabular-nums mb-2 text-lagoon-400">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="font-black text-white mb-1.5">{t(`process.${step}.title`)}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{t(`process.${step}.text`)}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ── CONDITIONS (replié) ── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 py-16 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            {t('terms.title')}
          </h2>
          <button
            type="button"
            onClick={() => setShowTerms((v) => !v)}
            aria-expanded={showTerms}
            className={`inline-flex items-center gap-2 text-sm font-bold ${theme.accentText}`}
          >
            {t('terms.toggle')}
            <ChevronDown className={`w-4 h-4 transition-transform ${showTerms ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <AnimatePresence initial={false}>
            {showTerms && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <ul className="mt-5 space-y-2.5">
                  {TERMS.map((key) => (
                    <li key={key} className="flex gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                      <Check className="w-4 h-4 text-lagoon-600 dark:text-lagoon-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{t(`terms.items.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── FAQ ── */}
      <motion.section
        className="relative overflow-hidden bg-white dark:bg-neutral-950 py-20 lg:py-24"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {/* Halos lagoon — décor ambiant, motif partagé avec la page Vidéos. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 right-[8%] w-80 h-80 rounded-full bg-lagoon-500/20 blur-[130px]" />
          <div className="absolute bottom-0 left-[12%] w-96 h-96 rounded-full bg-lagoon-700/15 blur-[160px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white text-center mb-14">
            {t('faq.title')}
          </h2>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  >
                    <span className={`font-semibold text-neutral-900 dark:text-white transition-colors text-sm sm:text-base ${theme.titleHover}`}>
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-lagoon-600' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── FORMULAIRE ── */}
      <section ref={formRef} id="devis" className="relative overflow-hidden bg-neutral-50 dark:bg-neutral-900 py-20 lg:py-24 scroll-mt-24 border-t border-neutral-100 dark:border-neutral-800">
        {/* Halos lagoon — décor ambiant, motif partagé avec la page Vidéos. */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 right-[8%] w-80 h-80 rounded-full bg-lagoon-500/20 blur-[130px]" />
          <div className="absolute bottom-0 left-[12%] w-96 h-96 rounded-full bg-lagoon-700/15 blur-[160px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 lg:p-10 border border-neutral-200 dark:border-neutral-700">
            {submitted ? (
              <div className="text-center py-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${theme.signatureFill}`}>
                  <Check className="w-8 h-8" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-3">{t('success.title')}</h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto leading-relaxed">
                  {t('success.text')}
                </p>

                {/* Passage de main WhatsApp — l'action dominante de cet écran.
                    C'est un VRAI lien, pas un window.open() : après l'await de
                    l'enregistrement, le geste utilisateur est perdu et Safari/iOS
                    comme Chrome mobile bloqueraient l'ouverture programmatique.
                    Ne pas « optimiser » en déclenchant depuis handleSubmit. */}
                <a
                  href={whatsappUrl(handoffMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base transition-colors mb-4 ${theme.buttonSolid}`}
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  {t('success.whatsappCta')}
                </a>
                <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto">
                  {t('success.whatsappHint')}
                </p>

                {quoteRef && (
                  <div className="rounded-2xl bg-lagoon-50 dark:bg-lagoon-900/20 border border-lagoon-200 dark:border-lagoon-800 p-6 mb-8 text-left">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">{t('success.quoteReady')}</p>
                    <p className="font-mono text-sm text-neutral-500 break-all mb-4">{quoteUrl}</p>
                    <div className="flex flex-wrap gap-3">
                      <LocalizedLink
                        to={`/presence-digitale/devis/${quoteRef}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-lagoon-500 transition-colors"
                      >
                        {t('success.viewQuote')}
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </LocalizedLink>
                      <button
                        type="button"
                        onClick={copyQuoteLink}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-lagoon-500 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                        {copied ? t('success.copied') : t('success.copyLink')}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => { setSubmitted(false); setQuoteRef(null); setSubmittedData(null); }}
                >
                  {t('success.again')}
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-2">
                  {t('form.title')}
                </h2>
                <p className="text-sm text-neutral-500 mb-8">{t('form.subtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot — invisible pour les humains, rempli par les robots */}
                  <div aria-hidden="true" className="hidden">
                    <input
                      type="text"
                      name="_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form._hp}
                      onChange={(e) => setForm((p) => ({ ...p, _hp: e.target.value }))}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input
                      label={t('form.businessName')}
                      value={form.businessName}
                      onChange={(e) => update('businessName', e.target.value)}
                      error={errors.businessName}
                      placeholder={t('form.businessNamePlaceholder')}
                    />
                    <Input
                      label={t('form.contactName')}
                      value={form.contactName}
                      onChange={(e) => update('contactName', e.target.value)}
                      error={errors.contactName}
                      placeholder={t('form.contactNamePlaceholder')}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input
                      label={t('form.phone')}
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      error={errors.phone}
                      placeholder={t('form.phonePlaceholder')}
                    />
                    <Input
                      label={t('form.city')}
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      error={errors.city}
                      placeholder={t('form.cityPlaceholder')}
                    />
                  </div>

                  <Input
                    label={t('form.email')}
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    error={errors.email}
                    placeholder={t('form.emailPlaceholder')}
                  />

                  <div className="space-y-1.5">
                    <label htmlFor="agency-sector" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t('form.sector')}
                    </label>
                    <select id="agency-sector" value={form.sector} onChange={(e) => update('sector', e.target.value)} className={selectCls}>
                      {SECTOR_KEYS.map((key) => (
                        <option key={key} value={key}>{t(`form.sectors.${key}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="agency-pack" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {t('form.pack')}
                      </label>
                      <select id="agency-pack" value={form.pack} onChange={(e) => update('pack', e.target.value)} className={selectCls}>
                        {PACK_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {key === 'undecided' ? t('form.undecided') : t(`packs.${key}.name`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="agency-plan" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {t('form.plan')}
                      </label>
                      <select id="agency-plan" value={form.plan} onChange={(e) => update('plan', e.target.value)} className={selectCls}>
                        {PLAN_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {key === 'undecided' ? t('form.undecided')
                              : key === 'aucun' ? t('form.noPlan')
                              : t(`plans.${key}.name`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Récapitulatif du choix : le visiteur voit ce qu'il s'apprête à demander,
                      avant d'envoyer. Évite les demandes faites au hasard. */}
                  {(findPack(form.pack) || findPlan(form.plan)) && (
                    <div className="rounded-2xl bg-lagoon-50 dark:bg-lagoon-900/20 border border-lagoon-200 dark:border-lagoon-800 p-5">
                      <div className="flex items-start gap-3">
                        <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${theme.accentText}`} aria-hidden="true" />
                        <div className="text-sm tabular-nums">
                          {findPack(form.pack) && (
                            <p className="text-neutral-800 dark:text-neutral-200">
                              <span className="font-bold">{t(`packs.${form.pack}.name`)}</span>
                              {' — '}{formatPrice(findPack(form.pack)!.price)}
                            </p>
                          )}
                          {findPlan(form.plan) && (
                            <p className="text-neutral-800 dark:text-neutral-200">
                              <span className="font-bold">{t(`plans.${form.plan}.name`)}</span>
                              {' — '}{formatPrice(findPlan(form.plan)!.setupPrice)}
                              {' + '}{formatPrice(findPlan(form.plan)!.monthlyPrice)}/{t('quote.monthly')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Textarea
                    label={t('form.message')}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder={t('form.messagePlaceholder')}
                    rows={4}
                  />

                  <Input
                    label={t('form.referral')}
                    value={form.referralCode}
                    onChange={(e) => update('referralCode', e.target.value)}
                    placeholder={t('form.referralPlaceholder')}
                  />

                  <Button type="submit" loading={loading} icon={<Send className="w-4 h-4" />}>
                    {loading ? t('form.submitting') : t('form.submit')}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/*
        Bifurcation vers l'autre offre commerciale du site — miroir du bloc qui vit en bas de
        /agence. Un fondateur ou une PME qui atterrit ici n'avait aucune sortie : le renvoi
        n'existait que dans un sens.

        ⚠️ Lien texte, jamais une pastille pleine : le tunnel de devis est ce qui convertit
        sur cette page, et rien ne doit lui disputer l'attention. Registre tutoyant, comme le
        reste de la page — c'est /agence qui vouvoie, pas ce renvoi.
      */}
      <section className="bg-white dark:bg-neutral-950 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl border-t border-neutral-200 dark:border-neutral-800 pt-10">
            <h2 className="font-bold text-neutral-900 dark:text-white">{t('agencyBridge.title')}</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('agencyBridge.body')}
            </p>
            <LocalizedLink
              to="/agence"
              className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${theme.accentText} hover:gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lagoon-500 rounded`}
            >
              {t('agencyBridge.cta')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </LocalizedLink>
          </div>
        </div>
      </section>

      <StickyWhatsApp message={quickMessage} />
    </div>
  );
}
