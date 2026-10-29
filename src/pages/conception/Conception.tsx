import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import JsonLd from '../../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../../components/seo/seo-config';
import DsNavHost from '../../components/layout/DsNavHost';
import { Eyebrow, Hl, KitButton, KitH2, KitSection, NightHero, Photo, type PhotoTone } from '../../components/site/v3/kit';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { corporateUrl, legalEntity, legalName, practices } from '../../lib/brand';
import { agencyLeadConfig } from '../../lib/agency/engagement';
import { PACKS } from '../../lib/presence/offer';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SERVICES · CONCEPTION — LA MAQUETTE `Site-Services` (bureau) / `-mobile`, PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES (29/10/2026) : la structure du CDC du 14/09 (sous-navigation de piste,
 * garanties, aperçu des réalisations, ventures, bandeau de sortie, pont MY ONOMA) cède à
 * l'ordre de la planche — dalle, deux niveaux, services, méthode, qualification.
 *
 * Ce qui diffère de la planche :
 * - LA CARTE « COMMERCES ET TPE » TUTOIE (« Ici on se tutoie ») alors que la piste
 *   Conception vouvoie. Son texte vit sous `conception.json → levels.shops.*`, sous-arbre
 *   nommément exempté par `voix-tutoiement.test.ts` : la carte parle avec la voix de
 *   l'étage qu'elle annonce.
 * - LES FOURCHETTES « [Fourchette 1…3] » n'existent pas : les puces sont les formes
 *   d'engagement réelles du formulaire (`agencyLeadConfig.budgets`, sans aucun montant).
 * - LE FORMULAIRE de la planche ne recueille que trois champs ; la demande qualifiable en
 *   exige plus (type, échéance, nom). Il TRANSMET donc ce qu'il a recueilli à
 *   `/conception/projets-sur-mesure#formulaire`, qui le reprend (`useAgencyEngagement`) :
 *   rien n'est envoyé à moitié, rien n'est ressaisi.
 * - Les photos d'atelier n'existent pas : dégradé du kit, sans libellé.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SERVICES: { n: 1 | 2 | 3 | 4; tone: PhotoTone }[] = [
  { n: 1, tone: 'studio' },
  { n: 2, tone: 'informe' },
  { n: 3, tone: 'club' },
  { n: 4, tone: 'edu' },
];

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

export default function Conception() {
  const { t } = useTranslation('conception');
  const path = useLocalizedPath();
  const navigate = useNavigate();
  const build = practices.build;

  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [need, setNeed] = useState('');
  const [engagement, setEngagement] = useState<string>(agencyLeadConfig.budgets[0]);

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: build.brand,
        serviceType: build.discipline,
        description: t('seo.description'),
        url: buildCanonical('/conception'),
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
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Max-Morrys', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: t('seo.title'), item: buildCanonical('/conception') },
        ],
      },
    ],
    [t, build.brand, build.discipline],
  );

  const shopChips = t('levels.shops.chips', { returnObjects: true, count: PACKS.length }) as string[];
  const customChips = t('levels.custom.chips', { returnObjects: true }) as string[];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (org.trim()) q.set('org', org.trim());
    if (email.trim()) q.set('email', email.trim());
    if (need.trim()) q.set('besoin', need.trim());
    q.set('engagement', engagement);
    navigate(`${path('/conception/projets-sur-mesure')}?${q.toString()}#formulaire`);
  };

  return (
    <DsNavHost>
      <SEOHead
        title={t('seo.title')}
        description={t('seo.description')}
        canonical={buildCanonical('/conception')}
        frPath="/conception"
        enPath="/en/design"
      />
      <JsonLd data={jsonLd} />

      {/* ── 1 · LA DALLE (teal) ──────────────────────────────────────────────── */}
      <NightHero
        mesh="digitalise"
        backdrop={
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden wide:block"
            style={{ background: 'linear-gradient(115deg,rgba(10,13,17,1) 35%,rgba(11,59,57,.9) 62%,rgba(2,172,156,.85) 92%)' }}
          />
        }
      >
        <div className="relative z-[1] mx-auto box-border w-full max-w-[1360px] px-5 pb-10 pt-6 wide:px-10 wide:pb-16 wide:pt-[120px]">
          <Eyebrow className="text-[color:var(--mm-teal-t)]">{t('hero.eyebrow')}</Eyebrow>
          <h1 className="mm-d m-0 mb-[22px] mt-5 text-[46px] leading-[.9] tracking-[-.05em] wide:text-[clamp(60px,8vw,120px)] wide:leading-[.86]">
            <TealLines lines={t('hero.titleLines', { returnObjects: true }) as string[]} />
          </h1>
          <p className="m-0 mb-5 max-w-[50ch] text-[15.5px] leading-[1.55] text-ink-2 stack:hidden">{t('hero.ledeShort')}</p>
          <p className="m-0 mb-[26px] hidden max-w-[50ch] text-[18px] leading-[1.55] text-ink-2 stack:block">{t('hero.lede')}</p>
          <div className="hidden flex-wrap gap-[10px] stack:flex">
            <KitButton href="#niveaux" tone="studio" arrow>{t('hero.ctaLevels')}</KitButton>
            <KitButton href={path('/conception/realisations')} tone="veil">{t('hero.ctaWork')}</KitButton>
          </div>
          <Photo tone="studio" className="h-[200px] stack:hidden" />
        </div>
      </NightHero>

      {/* ── 2 · DEUX NIVEAUX D'ENGAGEMENT ────────────────────────────────────── */}
      <KitSection id="niveaux" className="scroll-mt-[var(--header-h)] pt-12 wide:pt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-5 wide:mb-6">
          <div>
            <Eyebrow tone="studio">{t('levels.eyebrow')}</Eyebrow>
            <KitH2 className="mt-3 stack:hidden" size="38px">{t('levels.titleShort')}</KitH2>
            <KitH2 className="mt-[14px] hidden stack:block">{t('levels.title')}</KitH2>
          </div>
          <p className="m-0 hidden max-w-[42ch] text-ink-2 stack:block">{t('levels.lede')}</p>
        </div>
        <div className="grid gap-3 wide:grid-cols-2 wide:gap-[18px]">
          <article className="relative isolate flex flex-col gap-[14px] overflow-hidden rounded-xl bg-[color:var(--mm-teal-c)] p-6 text-[color:var(--ink-fixed)] wide:min-h-[500px] wide:p-8">
            <div aria-hidden="true" className="mm-mesh m-digitalise" style={{ opacity: 0.5 }}><b /><b /><b /></div>
            <span className="mm-tag relative self-start bg-[color:var(--paper-fixed)] text-[color:var(--ink-fixed)]">
              <span className="stack:hidden">{t('levels.shops.tagShort')}</span>
              <span className="hidden stack:inline">{t('levels.shops.tag')}</span>
            </span>
            <h3 className="mm-d relative m-0 text-[30px] wide:text-[48px]">{t('levels.shops.title')}</h3>
            <p className="relative m-0 max-w-[42ch] text-[color:var(--ink-fixed)] opacity-80">
              <span className="stack:hidden">{t('levels.shops.bodyShort')}</span>
              <span className="hidden stack:inline">{t('levels.shops.body')}</span>
            </p>
            <div className="relative hidden flex-wrap gap-[10px] stack:flex">
              {shopChips.map((c) => (
                <span key={c} className="mm-chip cursor-default">{c}</span>
              ))}
            </div>
            <KitButton href={path('/conception/commerces-et-tpe')} tone="studio" arrow className="relative self-start wide:mt-auto">
              {t('levels.shops.ctaPacks')}
            </KitButton>
          </article>
          <article className="dk relative isolate flex flex-col gap-[14px] overflow-hidden rounded-xl bg-night p-6 text-ink wide:min-h-[500px] wide:p-8">
            <div aria-hidden="true" className="mm-mesh m-nuit" style={{ opacity: 0.8 }}><b /><b /><b /></div>
            <span className="mm-tag relative self-start">
              <span className="stack:hidden">{t('levels.custom.tagShort')}</span>
              <span className="hidden stack:inline">{t('levels.custom.tag')}</span>
            </span>
            <h3 className="mm-d relative m-0 text-[30px] wide:text-[48px]">{t('levels.custom.title')}</h3>
            <p className="relative m-0 max-w-[42ch] text-ink-2">
              <span className="stack:hidden">{t('levels.custom.bodyShort')}</span>
              <span className="hidden stack:inline">{t('levels.custom.body')}</span>
            </p>
            <div className="relative hidden flex-wrap gap-[10px] stack:flex">
              {customChips.map((c) => (
                <span key={c} className="mm-chip cursor-default">{c}</span>
              ))}
            </div>
            <a href="#qualif" className="mm-btn has-arrow relative self-start no-underline wide:mt-auto" style={{ ['--bg' as string]: 'var(--paper-fixed)', ['--fg' as string]: 'var(--ink-fixed)' }}>
              {t('levels.custom.cta')}
              <span className="mm-btn__arrow" aria-hidden="true" style={{ background: 'var(--ink-fixed)', color: 'var(--paper-fixed)' }}>
                <Icon name="arrow-up-right" size={16} />
              </span>
            </a>
          </article>
        </div>
      </KitSection>

      {/* ── 3 · CE QUE NOUS FAISONS ──────────────────────────────────────────── */}
      <section className="relative z-[3] pt-12 wide:pt-24">
        <KitSection as="div">
          <Eyebrow>{t('services.eyebrow')}</Eyebrow>
          <KitH2 className="mb-6 mt-[14px] hidden stack:block">
            <Hl text={t('services.title')} tone="edu" />
          </KitH2>
        </KitSection>
        <KitSection as="div" className="!px-0 stack:!px-6">
          <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] pb-2 stack:mt-0 stack:grid stack:grid-cols-2 stack:overflow-visible stack:px-0 stack:pb-0 wide:grid-cols-4 wide:gap-4">
            {SERVICES.map(({ n, tone }) => {
              const accent = n === 1;
              return (
                <article
                  key={n}
                  className={[
                    'flex min-h-[300px] flex-none basis-[240px] snap-start flex-col gap-[10px] rounded-xl p-4 stack:basis-auto wide:min-h-[400px] wide:p-[18px]',
                    accent ? 'bg-[color:var(--mm-teal-t)] text-[color:var(--paper-fixed)]' : 'mm-bento',
                  ].join(' ')}
                >
                  <span className={accent ? 'mm-tag hidden self-start bg-[color:rgb(255_255_255/.18)] text-[color:var(--paper-fixed)] stack:inline-flex' : 'mm-tag hidden self-start stack:inline-flex'}>
                    {String(n).padStart(2, '0')}
                  </span>
                  <b className="font-display text-[22px] font-black leading-none wide:text-[28px]">{t(`services.s${n}Title`)}</b>
                  <span className={`text-[13px] wide:text-[14px] ${accent ? 'opacity-[.88]' : 'text-ink-2'}`}>
                    <span className="stack:hidden">{t(`services.s${n}Short`)}</span>
                    <span className="hidden stack:inline">{t(`services.s${n}Body`)}</span>
                  </span>
                  <Photo tone={tone} className="mt-auto h-[150px] !min-h-0 !rounded-card wide:h-[190px]" />
                </article>
              );
            })}
          </div>
        </KitSection>
      </section>

      {/* ── 4 · NOTRE MÉTHODE ────────────────────────────────────────────────── */}
      <KitSection className="grid items-start gap-8 pt-12 wide:grid-cols-2 wide:pt-24">
        <div>
          <Eyebrow className="stack:hidden">{t('method.eyebrowShort')}</Eyebrow>
          <Eyebrow className="hidden stack:inline-flex">{t('method.eyebrow')}</Eyebrow>
          <KitH2 className="mb-4 mt-3 stack:hidden" size="38px">{t('method.titleShort')}</KitH2>
          <KitH2 className="mb-5 mt-[14px] hidden stack:block" size="clamp(40px, 5vw, 60px)">
            {(t('method.titleLines', { returnObjects: true }) as string[]).map((l, i) => (
              <span key={i}>
                {i > 0 && ' '}
                {i > 0 && <br />}
                <Hl text={l} tone="edu" />
              </span>
            ))}
          </KitH2>
          <div className="mm-acc">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="mm-acc__item" open={n === 3}>
                <summary>
                  <span className="mm-acc__n">{String(n).padStart(2, '0')}</span>
                  <span className="stack:hidden">{t(`method.s${n}Short`)}</span>
                  <span className="hidden stack:inline">{t(`method.s${n}Title`)}</span>
                  <span className="mm-acc__plus" aria-hidden="true">
                    <Icon name="plus" size={14} />
                  </span>
                </summary>
                <div className="mm-acc__body">{t(`method.s${n}Body`)}</div>
              </details>
            ))}
          </div>
        </div>
        <Photo tone="studio" className="hidden h-[520px] wide:block" />
      </KitSection>

      {/* ── 5 · DÉCRIVEZ VOTRE PROJET ────────────────────────────────────────── */}
      <KitSection id="qualif" className="scroll-mt-[var(--header-h)] pt-12 wide:pt-24">
        <div className="grid gap-8 rounded-xl bg-[color:var(--paper-2)] p-5 stack:p-10 wide:grid-cols-2">
          <div>
            <Eyebrow className="hidden stack:inline-flex">{t('qualif.eyebrow')}</Eyebrow>
            <KitH2 className="mb-[14px] stack:mt-[14px]" size="clamp(32px, 5vw, 56px)">{t('qualif.title')}</KitH2>
            <p className="m-0 max-w-[44ch] text-ink-2">
              <span className="stack:hidden">{t('qualif.ledeShort')}</span>
              <span className="hidden stack:inline">{t('qualif.lede')}</span>
            </p>
          </div>
          <form onSubmit={submit} className="grid grid-cols-2 gap-[10px]">
            <div className="mm-field col-span-2">
              <div className="mm-field__box">
                <input id="qualif-org" placeholder=" " value={org} onChange={(e) => setOrg(e.target.value)} autoComplete="organization" />
                <label htmlFor="qualif-org">{t('qualif.org')}</label>
              </div>
            </div>
            <div className="mm-field col-span-2 hidden stack:block">
              <div className="mm-field__box">
                <input id="qualif-mail" type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                <label htmlFor="qualif-mail">{t('qualif.email')}</label>
              </div>
            </div>
            <div className="mm-field col-span-2">
              <div className="mm-field__box">
                <input id="qualif-need" placeholder=" " value={need} onChange={(e) => setNeed(e.target.value)} />
                <label htmlFor="qualif-need">{t('qualif.need')}</label>
              </div>
            </div>
            <fieldset className="col-span-2 m-0 border-0 p-0">
              <legend className="mb-2 text-[13px] text-ink-2">{t('qualif.engagement')}</legend>
              <div className="mm-chips">
                {agencyLeadConfig.budgets.map((key) => (
                  <button key={key} type="button" className="mm-chip" aria-pressed={engagement === key} onClick={() => setEngagement(key)}>
                    {t(`form.engagements.${key}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="col-span-2 mt-2">
              <KitButton type="submit" tone="studio">{t('qualif.submit')}</KitButton>
              <p className="m-0 mt-3 text-[12.5px] text-ink-3">{t('qualif.next')}</p>
            </div>
          </form>
        </div>
      </KitSection>
    </DsNavHost>
  );
}
