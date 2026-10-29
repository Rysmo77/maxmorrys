import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, Field, GlassPanel, Num, Tag } from '@ds';
import { Bento } from '../components/site/v3/Bento';
import DsNavHost from '../components/layout/DsNavHost';
import { SiteEyebrow } from '../components/site';
import { Eyebrow, KitButton, KitH2, KitSection, NightHero } from '../components/site/v3/kit';
import MapsProof from '../components/presence/MapsProof';
import StickyWhatsApp from '../components/presence/StickyWhatsApp';
import { useLocalizedPath } from '../contexts/LanguageContext';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import {
  PACKS, SECTOR_KEYS, PACK_KEYS, PLAN_KEYS, QUOTE_VALIDITY_DAYS, DEPOSIT_RATE,
  packEffectivePrice, computeTotals, depositAmount, balanceAmount, CATALOGUE_REVISED_AT,
  type PackDefinition,
} from '../lib/presence/offer';
import { doitMentionnerLaTaxe, regimeDe, tauxEnPourcent, ventilerDepuisHT } from '../lib/tax/senegal';
import { whatsappUrl } from '../lib/presence/whatsapp';
import { usePresenceQuote } from './presence/usePresenceQuote';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMMERCES ET TPE — LA MAQUETTE `Site-Commerces` (bureau) / `-mobile`, PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES (29/10/2026, « maquettes + DS + PRD rév. 6 font foi ») : la page
 * longue (bénéfices, questionnaire en trois questions, formules d'accompagnement, options,
 * panneau de vérité, FAQ, conditions) cède à l'ordre de la planche — dalle, trois packs,
 * démonstration et devis instantané, étapes, appel. Le formulaire de devis, lui, RESTE :
 * c'est lui qui produit le récapitulatif consultable (`/conception/commerces-et-tpe/devis/…`)
 * que le bouton « Recevoir mon devis » de la planche promet.
 *
 * Ce qui diffère de la planche, et pourquoi :
 * - LES PACKS sont ceux du catalogue (`PACKS`, noms et prix de `presence.json` /
 *   `offer.ts`), pas « Essentiel / Visibilité / Complet » ni leurs descriptions.
 * - « Promo de lancement · jusqu'au [DATE] » : aucune date de fin n'existe — « Promo de
 *   lancement » seul. « Délai : [N] jours ouvrés » : aucun délai n'est publié — l'étape 4
 *   dit la durée de support du catalogue (`supportDays`).
 * - LA DÉMO « boutique fictive » devient le test Google Maps réel (`MapsProof`) : aucun
 *   exemple inventé.
 * - L'ACOMPTE se calcule sur la mise en place HT (`depositAmount(setupDue)`), comme le
 *   récapitulatif et le message WhatsApp — et le libellé le dit.
 * - Paiement : les trois moyens réels (`proof:check` règle 8), pas deux.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const REGIME_AGENCE = regimeDe('agence');
type PackKey = PackDefinition['key'];

/** Sur la dalle teal, le fragment entre crochets prend le teal clair de la planche. */
function TealLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br className="hidden stack:inline" />}
          {i > 0 && ' '}
          {line.split(/\[([^\]]+)\]/).map((part, j) =>
            j % 2 === 1 ? (
              <span key={j} className="text-[color:var(--mm-teal-t)]">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
      ))}
    </>
  );
}

export default function PresenceDigitale() {
  const { t } = useTranslation('presence');
  const path = useLocalizedPath();
  const q = usePresenceQuote();
  const [showMore, setShowMore] = useState(false);
  const featured = (PACKS.find((p) => p.featured) ?? PACKS[0]).key;
  const [selected, setSelected] = useState<PackKey>(featured);

  const rate = tauxEnPourcent(REGIME_AGENCE.taux);
  const supportDays = PACKS.map((p) => p.supportDays);
  const totals = computeTotals(selected, 'aucun');
  const showTax = doitMentionnerLaTaxe(totals.setupDueTax.etat) && totals.setupDueTax.tva > 0;
  const pct = Math.round(DEPOSIT_RATE * 100);

  const choose = (key: PackKey) => {
    setSelected(key);
    q.update('pack', key);
  };

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
        url: `${SITE_URL}${path('/conception/commerces-et-tpe')}`,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t('packs.title'),
          itemListElement: PACKS.map((p) => ({
            '@type': 'Offer',
            name: t(`packs.${p.key}.name`),
            price: packEffectivePrice(p),
            priceCurrency: 'XOF',
          })),
        },
      }} />

      {/* ── 1 · LA DALLE (teal) ──────────────────────────────────────────────── */}
      <NightHero mesh="digitalise">
        <div className="relative z-[1] mx-auto box-border w-full max-w-[1360px] px-5 pb-10 pt-6 wide:px-10 wide:pb-16 wide:pt-[110px]">
          <Eyebrow className="text-[color:var(--mm-teal-t)]">
            <span className="stack:hidden">{t('v3.hero.eyebrowShort')}</span>
            <span className="hidden stack:inline">{t('v3.hero.eyebrow')}</span>
          </Eyebrow>
          <h1 className="mm-d m-0 mb-[22px] mt-5 text-[46px] leading-[.9] tracking-[-.05em] wide:text-[clamp(56px,7.4vw,112px)] wide:leading-[.88]">
            <TealLines lines={t('v3.hero.titleLines', { returnObjects: true }) as string[]} />
          </h1>
          <p className="m-0 mb-5 max-w-[52ch] text-[15.5px] leading-[1.55] text-ink-2 stack:hidden">{t('v3.hero.ledeShort', { count: PACKS.length })}</p>
          <p className="m-0 mb-[26px] hidden max-w-[52ch] text-[18px] leading-[1.55] text-ink-2 stack:block">{t('v3.hero.lede', { count: PACKS.length })}</p>
          <div className="flex flex-wrap gap-[10px]">
            <KitButton href="#packs" tone="studio" arrow>{t('v3.hero.ctaPacks')}</KitButton>
            <KitButton href="#demo" tone="veil" className="hidden stack:inline-flex">{t('v3.hero.ctaDemo')}</KitButton>
          </div>
        </div>
      </NightHero>

      {/* ── 2 · LES PACKS (catalogue) ────────────────────────────────────────── */}
      <KitSection id="packs" className="scroll-mt-[var(--header-h)] pt-12 wide:pt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-5 wide:mb-6">
          <div>
            <Eyebrow tone="studio">
              <span className="stack:hidden">{t('v3.packs.eyebrowShort')}</span>
              <span className="hidden stack:inline">{t('v3.packs.eyebrow', { count: PACKS.length })}</span>
            </Eyebrow>
            <KitH2 className="mt-3 wide:mt-[14px]" size="clamp(38px, 5vw, 64px)">{t('v3.packs.title')}</KitH2>
          </div>
          <p className="m-0 hidden max-w-[40ch] text-ink-2 stack:block">{t('v3.packs.lede', { rate })}</p>
        </div>
        <div className="grid gap-3 stack:grid-cols-3 stack:gap-4">
          {PACKS.map((pack) => {
            const isSel = selected === pack.key;
            const amount = packEffectivePrice(pack);
            const promo = amount < pack.price;
            const tax = ventilerDepuisHT(amount, REGIME_AGENCE);
            return (
              <article
                key={pack.key}
                className={[
                  'flex flex-col gap-3 rounded-xl p-[22px] stack:min-h-[420px] stack:p-[26px]',
                  isSel ? 'dk bg-night text-ink' : 'mm-bento',
                ].join(' ')}
              >
                {isSel && <span className="mm-tag self-start bg-[color:var(--mm-teal)] text-[color:var(--ink-fixed)]">{t('v3.packs.selectedTag')}</span>}
                <b className="font-display text-[28px] font-black leading-none stack:text-[34px]">{t(`packs.${pack.key}.name`)}</b>
                <span className="text-[14.5px] text-ink-2">{t(`v3.packs.summary.${pack.key}`)}</span>
                <span className="mt-auto" />
                {promo && (
                  <span className="mm-n text-[13px] line-through opacity-60">
                    <span className="sr-only">{t('v3.packs.strike')} : </span>
                    <Num value={pack.price} source="db" asOf={CATALOGUE_REVISED_AT} unit="FCFA" />
                  </span>
                )}
                {/* LE PRIX TIENT SUR UNE LIGNE (audit 29/10/2026 : « HT » orphelin à 40 px fixes
                    dans une carte de 210 px). Taille fluide, groupe insécable, et l'unité à la
                    moitié du corps du chiffre — c'est le chiffre qui se lit. */}
                <b className="mm-n block whitespace-nowrap text-[clamp(28px,8vw,36px)] tracking-[-.03em] stack:text-[clamp(22px,2.9vw,40px)]">
                  <Num value={amount} source="db" asOf={CATALOGUE_REVISED_AT} />
                  {'\u00a0'}
                  <span className="font-sans text-[.5em] font-normal tracking-normal">{t('v3.packs.ht')}</span>
                </b>
                {promo && <span className="mm-tag self-start bg-[color:var(--mm-orange)] text-[color:var(--ink-fixed)]">{t('v3.packs.promo')}</span>}
                {doitMentionnerLaTaxe(tax.etat) && tax.tva > 0 && (
                  <span className="mm-n text-[12.5px] text-ink-2">{t('v3.packs.tax', { rate })}</span>
                )}
                {/* Choisi, le bouton ne redit pas l'état (l'étiquette « Sélectionné » le porte
                    déjà) : il propose l'étape suivante, le devis (audit 29/10/2026). */}
                {isSel ? (
                  <KitButton href="#devis" tone="studio" arrow className="mt-2">
                    {t('v3.packs.selected')}
                  </KitButton>
                ) : (
                  <KitButton tone="ghost" className="mt-2" onClick={() => choose(pack.key)}>
                    {t('v3.packs.choose')}
                  </KitButton>
                )}
              </article>
            );
          })}
        </div>
      </KitSection>

      {/* ── 3 · LA DÉMO (test Google Maps réel) ET LE DEVIS INSTANTANÉ ───────── */}
      <KitSection className="pt-12 wide:pt-24">
        <div className="grid items-start gap-6 wide:grid-cols-2 wide:gap-8">
          <div id="demo" className="mm-photo is-informe order-2 flex scroll-mt-[var(--header-h)] items-center justify-center p-5 wide:order-1 wide:min-h-[520px] wide:p-10">
            <div className="w-full max-w-[460px]">
              <MapsProof />
            </div>
          </div>
          <div className="order-1 wide:order-2">
            <Eyebrow tone="studio">{t('v3.quote.eyebrow')}</Eyebrow>
            <div className="mm-seg mt-4" role="radiogroup" aria-label={t('form.pack')}>
              {PACKS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  role="radio"
                  aria-checked={selected === p.key}
                  aria-pressed={selected === p.key}
                  className={selected === p.key ? 'bg-bento shadow-soft' : ''}
                  onClick={() => choose(p.key)}
                >
                  {t(`packs.${p.key}.name`)}
                </button>
              ))}
            </div>
            <dl className="m-0 mt-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 border-0 border-t border-solid border-[color:var(--line)] pt-4 text-[14.5px]">
              <dt className="text-ink-2">{t('v3.quote.packHt', { name: t(`packs.${selected}.name`) })}</dt>
              <dd className="m-0 text-right"><b className="mm-n"><Num value={totals.setupDue} source="db" asOf={CATALOGUE_REVISED_AT} unit="FCFA" /></b></dd>
              {showTax && (
                <>
                  <dt className="text-ink-2">{t('v3.quote.vat', { rate })}</dt>
                  <dd className="m-0 text-right"><b className="mm-n"><Num value={totals.setupDueTax.tva} source={{ cite: t('v3.quote.cite') }} asOf={CATALOGUE_REVISED_AT} unit="FCFA" /></b></dd>
                  <dt className="font-semibold text-ink">{t('v3.quote.ttc')}</dt>
                  <dd className="m-0 text-right"><b className="mm-n text-[18px]"><Num value={totals.setupDueTax.ttc} source={{ cite: t('v3.quote.cite') }} asOf={CATALOGUE_REVISED_AT} unit="FCFA" /></b></dd>
                </>
              )}
              <dt className="text-ink-2">{t('v3.quote.deposit', { pct })}</dt>
              <dd className="m-0 text-right"><b className="mm-n"><Num value={depositAmount(totals.setupDue)} source="db" asOf={CATALOGUE_REVISED_AT} unit="FCFA" /></b></dd>
              <dt className="text-ink-2">{t('v3.quote.balance')}</dt>
              <dd className="m-0 text-right"><b className="mm-n"><Num value={balanceAmount(totals.setupDue)} source="db" asOf={CATALOGUE_REVISED_AT} unit="FCFA" /></b></dd>
            </dl>
            <p className="m-0 mt-4 text-[12.5px] text-ink-2">
              {t('v3.quote.note', { days: QUOTE_VALIDITY_DAYS })}{' '}
              <a href={path('/legal/cgv')} className="text-ink underline">{t('v3.quote.cgv')}</a>
            </p>
            <KitButton tone="studio" className="mt-5" onClick={() => q.jumpToForm({ pack: selected })}>
              {t('v3.quote.cta')}
            </KitButton>
          </div>
        </div>
      </KitSection>

      {/* ── 4 · LES ÉTAPES ───────────────────────────────────────────────────── */}
      <KitSection className="hidden pt-24 stack:block">
        <Eyebrow>{t('v3.steps.eyebrow')}</Eyebrow>
        <KitH2 className="mb-6 mt-[14px]" size="clamp(40px, 5vw, 64px)">{t('v3.steps.title')}</KitH2>
        <div className="grid grid-cols-2 gap-4 wide:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="mm-bento flex flex-col gap-2">
              <span className="mm-n text-[12px] text-ink-3">{String(n).padStart(2, '0')}</span>
              <b className="font-display text-[22px] font-black leading-[1.05]">{t(`v3.steps.s${n}Title`)}</b>
              <span className="text-[14px] text-ink-2">
                {t(`v3.steps.s${n}Body`, { days: QUOTE_VALIDITY_DAYS, pct, min: Math.min(...supportDays), max: Math.max(...supportDays) })}
              </span>
            </div>
          ))}
        </div>
      </KitSection>

      {/* ── 5 · LE FORMULAIRE DE DEVIS (produit le récapitulatif) ────────────── */}
      {/* `id="devis"` : la pop-up `quoteAbandon` y ramène (« Reprendre mon devis »). L'ancre
          avait disparu avec la refonte et le bouton ne menait plus nulle part. */}
      <KitSection id="devis" className="scroll-mt-[var(--header-h)] pt-12 wide:pt-24">
        <div ref={q.formRef} className="grid items-start gap-11 wide:grid-cols-[.95fr_1.05fr]">
          <div>
            <KitH2 size="clamp(36px, 4.5vw, 56px)">{t('form.title')}</KitH2>
            <p className="rv mt-3 max-w-[44ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
              {t('form.subtitle')}
            </p>

            {/*
              CE QUE JE SAIS DÉJÀ — relu, pas redemandé.

              La colonne portait trois contenus qui n'avaient rien à faire à côté d'un
              formulaire : l'encart de vérité (devenu sa propre section), les fourchettes
              d'options et les conditions commerciales (descendues sous la FAQ, avec le reste
              de ce qui se consulte au lieu de se lire). Ce qui la remplace parle du devis en
              cours, et de rien d'autre.

              Le sélecteur a déduit l'activité, le pack et l'accompagnement. Les redemander en
              listes déroulantes ferait passer une déduction pour une question ; les cacher
              sans les montrer serait pire. Ils sont donc ÉCRITS, et modifiables d'un clic.
            */}
            {/* `flat`, et surtout pas `truth` : la surface de vérité DÉSIGNE quelque chose sur
                cette page — le panneau juste au-dessus, celui qui nomme ce qui se vérifie et
                ce qui ne s'affiche pas. Ce bloc-ci relit les choix du visiteur ; le peindre du
                même voile faisait passer un récapitulatif de formulaire pour une preuve, et
                diluait la seule surface à qui cette page confie ce rôle. */}
            <Bento className="rv mt-5" style={{ ['--i' as string]: 3 }}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('form.knownLabel')}</SiteEyebrow>
              <div className="grid gap-[2px]">
                <DocLine label={t('form.sector')} value={t(`form.sectors.${q.form.sector}`)} />
                <DocLine
                  label={t('form.pack')}
                  value={q.form.pack === 'undecided' ? t('form.undecided') : t(`packs.${q.form.pack}.name`)}
                />
                <DocLine
                  label={t('form.plan')}
                  value={
                    q.form.plan === 'undecided' ? t('form.undecided')
                      : q.form.plan === 'aucun' ? t('form.noPlan')
                        : t(`plans.${q.form.plan}.name`)
                  }
                  last
                />
              </div>
              <p className="m-0 mt-3 text-meta-2 leading-[1.55] text-ink-3">{t('form.moreHint')}</p>
            </Bento>
          </div>

          <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 4 }}>
            {q.submitted ? (
              <div>
                <Tag tone="ok">{t('success.quoteReady')}</Tag>
                <h3 className="mm-d m-0 mt-[10px] text-[26px]">{t('success.title')}</h3>
                <p className="mt-3 text-meta leading-[1.6] text-ink-2">{t('success.text')}</p>

                {q.quoteUrl && (
                  <p className="mm-num mt-3 break-all text-meta-2 text-ink-3">{q.quoteUrl}</p>
                )}

                <div className="mt-5 grid gap-[10px]">
                  <Button href={whatsappUrl(q.handoffMessage)} target="_blank" tone="digitalise">
                    {t('success.whatsappCta')}
                  </Button>
                  {q.quoteRef && (
                    <Button href={path(`/conception/commerces-et-tpe/devis/${q.quoteRef}`)} tone="ghost">
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
                {/* Le numéro passe DEVANT le nom de la personne : c'est le seul champ dont
                    dépend la réponse promise juste au-dessus. */}
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
                  label={t('form.contactName')}
                  value={q.form.contactName}
                  onChange={(v) => q.update('contactName', v)}
                  error={q.errors.contactName}
                  placeholder={t('form.contactNamePlaceholder')}
                  autoComplete="name"
                  required
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

                {/*
                  QUATRE CHAMPS VISIBLES AU LIEU DE DIX, ET LES SIX AUTRES À UN CLIC.

                  Les quatre qui restent sont ceux sans lesquels je ne peux pas tenir la
                  promesse écrite juste au-dessus — « je te réponds sous 48 heures sur
                  WhatsApp » : le nom du commerce, la personne, le numéro, la ville. Les six
                  autres précisent, ils ne débloquent rien.

                  ILS SONT REPLIÉS, PAS SUPPRIMÉS, et leurs valeurs courantes sont écrites en
                  clair dans l'encart à gauche : on ne cache pas à quelqu'un ce qu'il est sur
                  le point d'envoyer.

                  `<details>` porte le pliage — le clavier, l'annonce de l'état et la
                  recherche dans la page viennent alors du navigateur, et le contenu reste
                  dans le DOM, donc dans le formulaire, ouvert ou non. L'état React ne
                  REMPLACE pas ce comportement, il l'oriente dans un seul cas : rouvrir sur
                  une erreur cachée (voir juste en dessous).
                */}
                {/*
                  ET IL S'OUVRE TOUT SEUL SUR UNE ERREUR QU'IL CACHE. `email` est le seul
                  champ replié que la validation refuse ; replié, son message d'erreur ne
                  serait lu par personne et l'envoi échouerait sans rien dire. Tant que
                  l'erreur tient, le bloc reste ouvert — elle s'efface à la frappe suivante,
                  `update()` vidant l'erreur du champ qu'on modifie.
                */}
                <details
                  open={showMore || Boolean(q.errors.email)}
                  onToggle={(e) => setShowMore(e.currentTarget.open)}
                  className="mt-4 rounded-[var(--r-m)] border border-dashed border-[color:var(--border-hair)] p-3"
                >
                  <summary className="mm-touch-extend cursor-pointer list-none text-meta font-bold text-ink">
                    {t('form.moreToggle')}
                    <span className="ml-2 font-normal text-ink-3">{t('form.moreHint')}</span>
                  </summary>
                  <div className="mt-2">
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
                  </div>
                </details>

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
      </KitSection>

      {/* ── 6 · L'APPEL ──────────────────────────────────────────────────────── */}
      <KitSection className="pt-12 wide:pt-24">
        <div className="dk relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-xl bg-night p-8 text-ink stack:flex-row stack:items-center stack:justify-between stack:p-11">
          <div aria-hidden="true" className="mm-mesh m-hub"><b /><b /><b /></div>
          <KitH2 className="relative" size="clamp(32px, 4vw, 52px)">{t('v3.cta.title')}</KitH2>
          <KitButton href={path('/contact?rdv=1')} tone="highlight" arrow className="relative">{t('v3.cta.button')}</KitButton>
        </div>
      </KitSection>

      <StickyWhatsApp message={q.quickMessage} hideNear={q.formRef} />
    </DsNavHost>
  );
}
