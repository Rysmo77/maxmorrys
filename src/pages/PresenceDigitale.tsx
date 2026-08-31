import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, CheckLine, DocLine, Field, GlassPanel, Icon, LessonRow, Num, PriceBlock, Tag, TerritoryCard,
} from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import MapsProof from '../components/presence/MapsProof';
import PackSelector from '../components/presence/PackSelector';
import StickyWhatsApp from '../components/presence/StickyWhatsApp';
import { useFormat } from '../hooks/useFormat';
import { useLocalizedPath } from '../contexts/LanguageContext';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import {
  PACKS, PLANS, OPTIONS, JOURNEY_STEPS, TERMS, SECTOR_KEYS, PACK_KEYS, PLAN_KEYS,
} from '../lib/presence/offer';
import { whatsappUrl } from '../lib/presence/whatsapp';
import { usePresenceQuote } from './presence/usePresenceQuote';

/**
 * LE CATALOGUE EST DATÉ, ET C'EST CE QUI AUTORISE `source="db"`.
 *
 * `<Num>` exige une source ET une date de relevé. Les prix ne viennent pas d'une requête :
 * ils sont écrits dans `src/lib/presence/offer.ts`. La date de sa dernière révision est donc
 * la date de relevé honnête — pas `new Date()`, qui prétendrait que le prix a été vérifié à
 * l'instant où la page s'affiche.
 *
 * À mettre à jour AVEC le catalogue, jamais séparément.
 */
const CATALOGUE_ASOF = new Date('2026-08-02');

/**
 * ── LE PRIX BARRÉ, ET POURQUOI IL EST LÉGITIME ───────────────────────────────────────
 *
 * Le readme du système écrit que « le prix d'entrée TPE réellement pratiqué est 250 000,
 * pas 295 000 ». Lu vite, c'est l'interdiction d'afficher un barré. Lu contre les données,
 * c'en est le contraire : `PACKS[0]` porte `price: 295_000` ET `promoPrice: 250_000`. Le
 * readme décrit le prix PRATIQUÉ ; il ne nie pas le prix de liste, il dit lequel des deux
 * on encaisse. C'est exactement la structure que `PriceBlock` attend — `amount` sur ce
 * qu'on paie, `strike` sur ce qu'on ne paie plus.
 *
 * Les deux valeurs sortent donc du catalogue avec `source="db"`. Un pack sans `promoPrice`
 * n'a pas de barré : rien n'est fabriqué pour faire nombre.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
function packPricing(pack: (typeof PACKS)[number]) {
  const promo = pack.promoPrice;
  return {
    amount: { value: promo ?? pack.price, source: 'db' as const, asOf: CATALOGUE_ASOF },
    strike: promo ? { value: pack.price, source: 'db' as const, asOf: CATALOGUE_ASOF } : undefined,
  };
}

/** Les trois territoires du kit, dans l'ordre où le catalogue liste les packs. */
const PACK_TERRITORY = ['digitalise', 'forme', 'transforme'] as const;

/**
 * L'unité d'une option pointe vers sa clé de traduction. `flat` n'en a pas : un forfait
 * n'est ni « par produit » ni « par mois », et lui coller un suffixe inventerait une
 * facturation qui n'existe pas au catalogue.
 */
const UNIT_SUFFIX: Record<string, string | undefined> = {
  product: 'options.perProduct',
  page: 'options.perPage',
  month: 'options.perMonth',
  flat: undefined,
};

export default function PresenceDigitale() {
  const { t } = useTranslation('presence');
  const { formatPrice } = useFormat();
  const path = useLocalizedPath();
  const q = usePresenceQuote();
  /** Le détail des conditions est replié : il est contractuel, pas promotionnel. */
  const [showTerms, setShowTerms] = useState(false);

  const faqItems = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];
  const entryPack = PACKS[0];
  const entryPrice = entryPack.promoPrice ?? entryPack.price;

  const sectorOptions = useMemo(
    () => SECTOR_KEYS.map((k) => ({ value: k, label: t(`form.sectors.${k}`) })),
    [t],
  );
  const packOptions = useMemo(
    () => [
      { value: 'undecided', label: t('form.undecided') },
      ...PACK_KEYS.map((k) => ({ value: k, label: t(`packs.${k}.name`) })),
    ],
    [t],
  );
  const planOptions = useMemo(
    () => [
      { value: 'undecided', label: t('form.undecided') },
      { value: 'aucun', label: t('form.noPlan') },
      ...PLAN_KEYS.map((k) => ({ value: k, label: t(`plans.${k}.name`) })),
    ],
    [t],
  );

  return (
    <DsNavHost>
      <SEOHead title={t('seoTitle')} description={t('seoDescription')} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('seoTitle'),
        description: t('seoDescription'),
        areaServed: 'Afrique de l\'Ouest',
        url: `${SITE_URL}/presence-digitale`,
        /*
          Les trois packs sont des offres au sens de schema.org — un prix, une devise, une
          disponibilité. Aucun `aggregateRating` : le produit n'a pas d'avis collectés, et en
          fabriquer un serait le premier des six interdits.
        */
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t('packs.title'),
          itemListElement: PACKS.map((p) => ({
            '@type': 'Offer',
            name: t(`packs.${p.key}.name`),
            price: p.promoPrice ?? p.price,
            priceCurrency: 'XOF',
          })),
        },
      }} />

      <PageSite>
        {/* ── HÉROS — 1.05fr .95fr, la réponse au prix POSÉE À CÔTÉ du titre ── */}
        <div className="grid items-center gap-11 pb-[14px] lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <SiteEyebrow>{t('eyebrow')}</SiteEyebrow>
            <SiteDisplay
              lines={[t('heroTitle1'), t('heroTitle2')]}
              size={56}
              style={{ marginTop: '9px' }}
            />
            <p className="rv mt-4 max-w-[44ch] text-lede text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('heroSubtitle')}
            </p>
            <div className="rv mt-6 flex flex-wrap gap-3" style={{ ['--i' as string]: 5 }}>
              <Button
                tone="digitalise"
                fullWidth={false}
                onClick={() => q.jumpToForm({})}
              >
                {t('heroCta')}
              </Button>
              <Button
                href={whatsappUrl(q.quickMessage)}
                target="_blank"
                tone="quiet"
                fullWidth={false}
              >
                {t('heroSecondary')}
              </Button>
            </div>
          </div>

          {/*
            L'ENCART QUI DÉSAMORCE — la maquette le place au premier écran, avant tout
            formulaire, et elle a raison : la question du coût de la première année est
            posée par tout le monde et la faire attendre coûte la visite. Le montant vient
            du catalogue, pas de la traduction, pour qu'un changement de prix ne laisse
            jamais un chiffre périmé dans une phrase.
          */}
          <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 5 }}>
            <SiteEyebrow style={{ margin: 0, color: 'var(--mm-teal-t)' }}>
              {t('anchor.eyebrow')}
            </SiteEyebrow>
            <p className="m-0 mt-[9px] text-[17px] font-bold leading-[1.32]">{t('anchor.question')}</p>
            <p className="m-0 mt-3 text-meta leading-[1.6] text-ink-2">
              {t('anchor.answerBefore')}
              <b className="text-ink">
                <Num value={entryPrice} source="db" asOf={CATALOGUE_ASOF} unit="FCFA" />
              </b>
              {t('anchor.answerAfter')}
            </p>
            <div className="my-[18px] h-px bg-[color:var(--border-hair)]" />
            <p className="m-0 text-meta-2 text-ink-2">{t('anchor.footnote')}</p>
          </GlassPanel>
        </div>

        {/* ── LES TROIS PACKS — prix affichés, pas de « à partir de » ── */}
        <SiteBand>
          <SiteDisplay as="h2" lines={[t('packs.title')]} size={34} />
          <p className="rv mt-[10px] max-w-[56ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
            {t('packs.subtitle')}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PACKS.map((pack, i) => {
              const { amount, strike } = packPricing(pack);
              const features = t(`packs.${pack.key}.features`, { returnObjects: true }) as string[];
              return (
                <div key={pack.key} className="rv" style={{ ['--i' as string]: i + 2 }}>
                  <TerritoryCard
                    territory={PACK_TERRITORY[i]}
                    padding={24}
                    meta={pack.featured ? t('packs.featured') : t(`packs.${pack.key}.for`)}
                    title={t(`packs.${pack.key}.name`)}
                    titleSize={23}
                  >
                    <ul className="m-0 mt-[9px] grid list-none gap-[6px] p-0">
                      {features.map((f) => (
                        <li key={f} className="flex gap-2 text-[13.5px] leading-[1.5] text-[color:var(--card-ink-2)]">
                          <Icon name="check" size={13} strokeWidth={3.4} style={{ marginTop: '4px', flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <PriceBlock
                      amount={amount}
                      strike={strike}
                      strikeLabel={t('packs.strikeLabel')}
                      size={26}
                      note={strike ? t('packs.promoNote') : t('packs.onceNote')}
                      style={{ marginTop: '18px' }}
                    />

                    <p className="m-0 mt-2 text-meta-2 text-[color:var(--card-ink-2)]">
                      {t('packs.supportIncluded', { days: pack.supportDays })}
                    </p>

                    <div className="mt-[14px]">
                      <Button
                        tone="digitalise"
                        size="sm"
                        fullWidth={false}
                        onClick={() => q.jumpToForm({ pack: pack.key })}
                      >
                        {t('packs.cta')}
                      </Button>
                    </div>
                  </TerritoryCard>
                </div>
              );
            })}
          </div>

          {/*
            L'accompagnement mensuel, mis À CÔTÉ des packs et non dedans. C'est la promesse
            que l'encart du héros vient de faire : une décision séparée. L'imbriquer dans les
            cartes la reprendrait d'une main après l'avoir donnée de l'autre.
          */}
          <GlassPanel level="flat" padding={22} className="rv mt-5" style={{ ['--i' as string]: 5 }}>
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row">
              <div className="max-w-[60ch]">
                <p className="m-0 font-display text-[18px] font-black tracking-[-.03em]">
                  {t('plansAside.title')}
                </p>
                <p className="m-0 mt-2 text-meta leading-[1.55] text-ink-2">{t('plansAside.body')}</p>
                <div className="mt-3 grid gap-[2px]">
                  {PLANS.map((plan, i) => (
                    <DocLine
                      key={plan.key}
                      label={t(`plans.${plan.key}.name`)}
                      value={t('plans.monthlyLabel', { price: formatPrice(plan.monthlyPrice) })}
                      last={i === PLANS.length - 1}
                    />
                  ))}
                </div>
              </div>
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                onClick={() => q.jumpToForm({})}
              >
                {t('plansAside.cta')}
              </Button>
            </div>
          </GlassPanel>
        </SiteBand>

        {/* ── LE SÉLECTEUR — 1fr 1fr, la promesse à gauche, les questions à droite ── */}
        <div className="mt-11 grid items-center gap-9 lg:grid-cols-2">
          <div>
            <SiteDisplay as="h2" lines={[t('selector.title')]} size={34} />
            <p className="rv mt-3 max-w-[44ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
              {t('selector.subtitle')}
            </p>
          </div>
          <div className="rv" style={{ ['--i' as string]: 4 }}>
            <PackSelector
              onRecommend={q.handleRecommend}
              onAccept={q.acceptReco}
              onReset={q.resetSelection}
              resetSignal={q.resetSignal}
            />
          </div>
        </div>

        {/* ── CE QUE LE PACK CONTIENT, ÉTAPE PAR ÉTAPE ── */}
        <div className="mt-11">
          <SiteDisplay as="h2" lines={[t('journey.title')]} size={34} />
          <p className="rv mt-3 mm-prose text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
            {t('journey.subtitle')}
          </p>
          <GlassPanel level="flat" padding="4px 18px" className="rv mt-4" style={{ ['--i' as string]: 3 }}>
            <ul className="m-0 list-none p-0">
              {JOURNEY_STEPS.map((step, i) => (
                <li key={step}>
                  <LessonRow
                    state="plain"
                    title={t(`journey.${step}.title`)}
                    meta={t(`journey.${step}.text`)}
                    icon={<Icon name="check" size={13} color="var(--mm-teal)" strokeWidth={3.4} />}
                    iconBackground="color-mix(in srgb, var(--mm-teal) 18%, transparent)"
                    last={i === JOURNEY_STEPS.length - 1}
                  />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        {/* ── LA PREUVE, APRÈS LES PRIX ── */}
        <div className="rv mt-11" style={{ ['--i' as string]: 1 }}>
          <MapsProof />
        </div>

        {/* ── LE FORMULAIRE ── */}
        <div ref={q.formRef} className="mt-11 grid items-start gap-11 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <SiteDisplay as="h2" lines={[t('form.title')]} size={34} />
            <p className="rv mt-3 max-w-[44ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
              {t('form.subtitle')}
            </p>

            {/*
              L'ENCART DE VÉRITÉ — il nomme ce que la page NE montre pas. Sur un écran qui
              vend, c'est la contrepartie des six interdits : on ne remplace pas une note en
              étoiles par du silence, on écrit pourquoi elle n'est pas là.
            */}
            <GlassPanel level="truth" className="rv mt-5" style={{ ['--i' as string]: 3 }}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('truth.title')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('truth.body')}</p>
            </GlassPanel>

            {/* Les options chiffrées : une fourchette réelle, jamais un « sur devis ». */}
            <SiteEyebrow style={{ marginTop: '26px' }}>{t('options.title')}</SiteEyebrow>
            <p className="m-0 mt-1 text-meta-2 text-ink-2">{t('options.subtitle')}</p>
            <div className="mt-3 grid gap-[2px]">
              {OPTIONS.map((opt, i) => (
                <DocLine
                  key={opt.key}
                  label={t(`options.${opt.key}.name`)}
                  value={
                    <>
                      {t('options.range', { min: formatPrice(opt.min), max: formatPrice(opt.max) })}
                      {UNIT_SUFFIX[opt.unit] ? ` ${t(UNIT_SUFFIX[opt.unit]!)}` : ''}
                    </>
                  }
                  last={i === OPTIONS.length - 1}
                />
              ))}
            </div>

            {/* Les conditions commerciales, repliées : contractuelles, pas promotionnelles. */}
            <div className="mt-6">
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                onClick={() => setShowTerms((v) => !v)}
                aria-expanded={showTerms}
              >
                {t('terms.toggle')}
              </Button>
              {showTerms && (
                <div className="mm-prose mt-3 grid gap-[6px]">
                  {TERMS.map((key) => (
                    <CheckLine key={key}>{t(`terms.items.${key}`)}</CheckLine>
                  ))}
                </div>
              )}
            </div>
          </div>

          <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 4 }}>
            {q.submitted ? (
              <div>
                <Tag tone="ok">{t('success.quoteReady')}</Tag>
                <SiteDisplay as="h3" lines={[t('success.title')]} size={26} style={{ marginTop: '10px' }} />
                <p className="mt-3 text-meta leading-[1.6] text-ink-2">{t('success.text')}</p>

                {q.quoteUrl && (
                  <p className="mm-num mt-3 break-all text-meta-2 text-ink-3">{q.quoteUrl}</p>
                )}

                <div className="mt-5 grid gap-[10px]">
                  <Button href={whatsappUrl(q.handoffMessage)} target="_blank" tone="digitalise">
                    {t('success.whatsappCta')}
                  </Button>
                  {q.quoteRef && (
                    <Button href={path(`/presence-digitale/devis/${q.quoteRef}`)} tone="ghost">
                      {t('success.viewQuote')}
                    </Button>
                  )}
                  <Button tone="quiet" onClick={() => void q.copyQuoteLink()}>
                    {q.copied ? t('success.copied') : t('success.copyLink')}
                  </Button>
                </div>

                <p className="mt-4 text-meta-2 text-ink-3">{t('success.whatsappHint')}</p>
              </div>
            ) : (
              <form onSubmit={q.handleSubmit} noValidate>
                <Field
                  label={t('form.businessName')}
                  value={q.form.businessName}
                  onChange={(v) => q.update('businessName', v)}
                  error={q.errors.businessName}
                  placeholder={t('form.businessNamePlaceholder')}
                  autoComplete="organization"
                  required
                  style={{ marginTop: 0 }}
                />
                <Field
                  label={t('form.contactName')}
                  value={q.form.contactName}
                  onChange={(v) => q.update('contactName', v)}
                  error={q.errors.contactName}
                  placeholder={t('form.contactNamePlaceholder')}
                  autoComplete="name"
                  required
                />
                <Field
                  label={t('form.phone')}
                  type="tel"
                  value={q.form.phone}
                  onChange={(v) => q.update('phone', v)}
                  error={q.errors.phone}
                  placeholder={t('form.phonePlaceholder')}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
                <Field
                  label={t('form.email')}
                  type="email"
                  value={q.form.email}
                  onChange={(v) => q.update('email', v)}
                  error={q.errors.email}
                  placeholder={t('form.emailPlaceholder')}
                  inputMode="email"
                  autoComplete="email"
                />
                <Field
                  label={t('form.city')}
                  value={q.form.city}
                  onChange={(v) => q.update('city', v)}
                  error={q.errors.city}
                  placeholder={t('form.cityPlaceholder')}
                  autoComplete="address-level2"
                  required
                />
                <Field
                  as="select"
                  label={t('form.sector')}
                  value={q.form.sector}
                  onChange={(v) => q.update('sector', v)}
                  options={sectorOptions}
                />
                <Field
                  as="select"
                  label={t('form.pack')}
                  value={q.form.pack}
                  onChange={(v) => q.update('pack', v)}
                  options={packOptions}
                />
                <Field
                  as="select"
                  label={t('form.plan')}
                  value={q.form.plan}
                  onChange={(v) => q.update('plan', v)}
                  options={planOptions}
                />
                <Field
                  as="textarea"
                  rows={3}
                  label={t('form.message')}
                  value={q.form.message}
                  onChange={(v) => q.update('message', v)}
                  placeholder={t('form.messagePlaceholder')}
                />
                <Field
                  label={t('form.referral')}
                  value={q.form.referralCode}
                  onChange={(v) => q.update('referralCode', v)}
                  placeholder={t('form.referralPlaceholder')}
                  autoComplete="off"
                />

                {/*
                  Piège à robots. `tabIndex={-1}` et `aria-hidden` le retirent du parcours
                  clavier ET de l'arbre d'accessibilité : une personne au lecteur d'écran ne
                  le rencontre jamais, un script de remplissage automatique le remplit.
                */}
                <input
                  type="text"
                  name="_hp"
                  value={q.form._hp}
                  onChange={(e) => q.update('_hp', e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute h-0 w-0 overflow-hidden opacity-0"
                />

                <Button
                  type="submit"
                  tone="digitalise"
                  loading={q.loading}
                  disabled={q.loading}
                  style={{ marginTop: '17px' }}
                >
                  {q.loading ? t('form.submitting') : t('form.submit')}
                </Button>
              </form>
            )}
          </GlassPanel>
        </div>

        {/* ── FAQ D'ACHAT ── */}
        <div className="mt-11">
          <SiteDisplay as="h2" lines={[t('faq.title')]} size={34} />
          <div className="mm-prose mt-4 grid gap-[2px]">
            {faqItems.map((item, i) => (
              <details key={item.q} className="rv border-b border-[color:var(--border-hair)] py-4 last:border-0" style={{ ['--i' as string]: i + 1 }}>
                <summary className="cursor-pointer list-none font-bold text-ink">{item.q}</summary>
                <p className="m-0 mt-2 text-meta leading-[1.6] text-ink-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* ── LA PASSERELLE VERS L'AGENCE — l'autre offre, nommée, pas cachée ── */}
        <GlassPanel level="truth" className="mt-11">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('agencyBridge.title')}</SiteEyebrow>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('agencyBridge.body')}</p>
          <div className="mt-3">
            <Button href={path('/agence')} tone="quiet" size="sm" fullWidth={false}>
              {t('agencyBridge.cta')}
            </Button>
          </div>
        </GlassPanel>
      </PageSite>

      <StickyWhatsApp message={q.quickMessage} />
    </DsNavHost>
  );
}
