import { useRef, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, CheckLine, Icon, MediaCard, Num, SubNav, Tag, TruthPanel, type IconName } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { PriceApprox, PriceFootnote } from '../components/shared/PriceApprox';
import {
  CLUB_MEMBER_FORMATION_DISCOUNT, CLUB_OPENED_AT, CLUB_PRICE_XOF, CLUB_TERMS_REVISED_AT, LIVE_SESSIONS_PER_MONTH,
  clubReferralPrice,
} from '../lib/club/pricing';
import { RYSMO_BASE_DAILY, RYSMO_CLUB_DAILY } from '../lib/rysmo/quota';
import { getPublishedPodcasts } from '../lib/firestore/content';
import { getPublicClubStats, type PublicClubStats } from '../lib/firestore/club';
import { queryKeys } from '../lib/queryClient';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /club-des-digitos — LA PAGE PUBLIQUE DU CLUB. Kit v4.3 : « aperçu produit clair ».
 *
 * L'ordre du kit (`ClubHero` → `ClubOffer` → `ClubPricing`) : le prix dès le premier écran,
 * l'intérieur du produit, ce que l'adhésion ouvre (six cartes, toutes GARANTIES) avec ce qui
 * est en construction sous la grille en pointillés, trois étapes, le tarif et les questions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA MAQUETTE MONTRE ET QUE CETTE PAGE NE RECOPIE PAS
 *
 * · L'APERÇU DU FIL rempli de membres, de compteurs et de sessions « d'exemple ». Le cadre de
 *   navigateur est gardé ; il montre ce qui est VRAI de l'intérieur — les huit onglets, sous
 *   leurs noms du produit (`club.tab.nav`, la table que l'espace connecté utilise aussi).
 * · LE CALENDRIER DES SESSIONS : l'agenda est fermé aux non-membres par les règles. La page
 *   cite l'engagement (`LIVE_SESSIONS_PER_MONTH`) et, dessous, ce qui a été réellement tenu,
 *   compté par le Worker (`public_stats/club`) — jamais trois dates inventées.
 * · LES CERCLES (`#seo-local`…) : ils n'existent pas dans le produit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES NOMBRES DE CETTE PAGE, UN PAR UN — chacun porte sa source :
 *   • le prix, le mensuel, le prix parrainé, la remise sur les formations → `lib/club/pricing`
 *     (le mensuel est l'annuel divisé par douze, et la page le dit) ;
 *   • les questions par jour du répétiteur → `lib/rysmo/quota` (miroir vérifié par test) ;
 *   • les sessions par mois → engagement de l'offre, daté de la révision des termes.
 * Aucun autre chiffre. Pas de nombre de membres, pas de note, pas de témoignage, et aucune
 * promesse de remboursement (CGV, article 6).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Les huit onglets du produit, dans l'ordre de leurs adresses. */
const TABS: { key: string; glyph: IconName; tint: string; ink: string }[] = [
  { key: 'feed', glyph: 'list', tint: 'var(--mm-violet)', ink: 'var(--mm-violet-t)' },
  { key: 'discussions', glyph: 'chat', tint: 'var(--mm-violet)', ink: 'var(--mm-violet-t)' },
  { key: 'agenda', glyph: 'calendar', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'members', glyph: 'users', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'leaderboard', glyph: 'bars', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)' },
  { key: 'opportunities', glyph: 'case', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'infos', glyph: 'info', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'referral', glyph: 'plus', tint: 'var(--mm-corail)', ink: 'var(--mm-corail-t)' },
];

/** Le fond d'un puits d'icône : la teinte, très diluée. */
const well = (tint: string) => ({ background: `color-mix(in srgb, ${tint} 14%, transparent)` });

/**
 * Le kit écrit `#fff` en dur sur ses cartes publiques (`mm-offer__c`, `mm-step`, `mm-price`,
 * `mm-browser`) : la tuile bento, elle, bascule sous `.dk`. Le style en ligne l'emporte.
 */
const BENTO = { background: 'var(--bento)' };

/** Une carte opaque du kit v3 — remplace le faux verre sur une page claire. */
const CARD = 'rounded-card border border-[color:var(--line)] bg-bento shadow-v3-soft';

export default function ClubDigitos() {
  const { t } = useTranslation('club');
  const { t: tNav } = useTranslation('nav');
  const path = useLocalizedPath();
  const { formatMonth } = useFormat();

  const clubOpened = formatMonth(CLUB_OPENED_AT);
  /* `useRef` et non `new Date()` dans le corps : un `<Num>` mémoïsé sur `asOf` ne se
     recalcule pas à chaque rendu. */
  const asOf = useRef(new Date()).current;
  /** Le mensuel n'est PAS un prix débité : c'est l'annuel divisé par douze, et c'est écrit. */
  const monthly = Math.round(CLUB_PRICE_XOF / 12);
  const discountPct = Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100);

  /* « Avant de payer, écoute-les » — le vrai premier épisode, ou rien. */
  const { data: podcasts = [] } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const firstEpisode = podcasts[0];

  /* CE QUI A RÉELLEMENT ÉTÉ TENU, à côté de ce qui est promis. `null` → « non relevé »,
     jamais un zéro qui dirait « aucune session tenue ». */
  const { data: clubStats } = useQuery<PublicClubStats | null>({
    queryKey: queryKeys.publicClubStats,
    queryFn: () => getPublicClubStats(),
  });

  /* `returnObjects` rend la CLÉ, une chaîne, tant que le namespace n'est pas là. */
  const faqRaw = t('publicPage.faq', { returnObjects: true });
  const faq: { q: string; a: string }[] = Array.isArray(faqRaw) ? faqRaw : [];
  const stepsRaw = t('publicPage.steps', { returnObjects: true });
  const steps: { title: string; body: string }[] = Array.isArray(stepsRaw) ? stepsRaw : [];

  /* Les six cartes de l'offre : uniquement ce qui ne dépend que de Max-Morrys. */
  const offer: { key: string; glyph: IconName; tint: string; ink: string; body: ReactNode }[] = [
    {
      key: 'sessions', glyph: 'video', tint: 'var(--mm-violet)', ink: 'var(--mm-violet-t)',
      body: (
        <>
          <Num value={LIVE_SESSIONS_PER_MONTH} source={{ cite: t('publicPage.sessionsCite') }} asOf={CLUB_TERMS_REVISED_AT} />{' '}
          {t('publicPage.included.sessionsPost')}
          <span className="mt-1.5 block text-meta-2">
            {t('publicPage.sessionsHeldPre', { days: clubStats?.windowDays ?? 90 })}{' '}
            <Num
              value={clubStats?.liveSessionsHeld ?? null}
              source="server"
              asOf={clubStats ? new Date(clubStats.asOf) : asOf}
              showAsOf={Boolean(clubStats)}
            />
          </span>
        </>
      ),
    },
    { key: 'missions', glyph: 'case', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)', body: t('publicPage.included.missions') },
    { key: 'workshops', glyph: 'users', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)', body: t('publicPage.included.workshops') },
    { key: 'answer', glyph: 'chat', tint: 'var(--mm-violet)', ink: 'var(--mm-violet-t)', body: t('publicPage.included.answer') },
    {
      key: 'tutor', glyph: 'send', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)',
      body: (
        <>
          {t('publicPage.included.tutorPre')} <Num value={RYSMO_CLUB_DAILY} source="server" asOf={asOf} />{' '}
          {t('publicPage.included.tutorMid')} <Num value={RYSMO_BASE_DAILY} source="server" asOf={asOf} />
        </>
      ),
    },
    {
      key: 'discount', glyph: 'gift', tint: 'var(--mm-corail)', ink: 'var(--mm-corail-t)',
      body: (
        <>
          <Num value={discountPct} unit="%" source="server" asOf={asOf} /> {t('publicPage.included.discountPost')}
        </>
      ),
    },
  ];

  const stepGlyphs: IconName[][] = [['card', 'phone', 'check'], ['user', 'case', 'link'], ['list', 'chat', 'video']];

  return (
    <DsNavHost>
      <SEOHead title={t('publicPage.seoTitle')} description={t('publicPage.seoDescription')} />
      {/* Aucune donnée structurée d'offre ni d'avis : `AggregateRating` sur un club fermé
          sans avis vérifiable est précisément le chiffre inventé que le système refuse. */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }} />

      <PageSite>
        {/* Les deux étages du territoire, montrés ensemble — garde-fou n° 1 du violet. */}
        <SubNav
          label={t('publicPage.subnavLabel')}
          active={t('publicPage.subnavClub')}
          items={[
            { label: t('publicPage.subnavFree'), href: path('/podcast-et-videos'), territory: 'transforme' },
            { label: t('publicPage.subnavClub'), href: path('/club-des-digitos'), territory: 'transforme' },
          ]}
        />

        {/* ── 1 · Le héros : la promesse, deux actions, le prix juste dessous (`ClubHero`) ── */}
        <div className="mm-arc-host mt-[26px] flex flex-col items-center text-center">
          <span className="mm-cpill rv"><b>{t('publicPage.pill')}</b>{t('publicPage.eyebrow')}</span>
          <div className="mt-5">
            <SiteDisplay arc lines={t('publicPage.titleLines', { returnObjects: true }) as string[]} size={72} from={1} />
          </div>
          <p className="rv mx-auto mt-[18px] max-w-[52ch] text-[17px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
            {t('publicPage.lede')}
          </p>

          <div className="rv mt-[26px] flex w-full flex-col items-stretch justify-center gap-2.5 stack:w-auto stack:flex-row" style={{ ['--i' as string]: 5 }}>
            {/* « Je rejoins le Club » NAVIGUE vers l'espace connecté, seul endroit où
                l'abonnement se crée, et gardé. Aucun tunnel ne s'ouvre d'une page publique. */}
            <Button href={path('/mon-espace/club')} tone="transforme" fullWidth={false}>
              {t('publicPage.cta')} · <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} />
            </Button>
            <Button href="#interieur" tone="ghost" fullWidth={false}>{t('publicPage.ctaInside')}</Button>
          </div>

          <p className="rv m-0 mt-3.5 text-meta-2 text-ink-3" style={{ ['--i' as string]: 6 }}>
            <Num value={monthly} unit="F" source="server" asOf={asOf} /> {t('publicPage.perMonth')} ·{' '}
            {t('publicPage.payMethods')} · {t('publicPage.noDebit')}
            <span className="mt-1 block"><PriceApprox xof={CLUB_PRICE_XOF} /></span>
          </p>
        </div>

        {/* ── 2 · L'intérieur, dans un cadre de navigateur : les huit onglets réels ──── */}
        <div id="interieur" className="mm-browser rv scroll-mt-24" style={{ ...BENTO, marginTop: '44px' }}>
          <div className="mm-browser__bar" aria-hidden="true">
            <i /><i /><i />
            <span className="mm-browser__url"><Icon name="lock" size={12} />maxmorrys.me/mon-espace/club</span>
          </div>
          <div className="p-4 stack:p-6">
            <SiteDisplay as="h2" lines={t('publicPage.tabsTitle', { returnObjects: true }) as string[]} size={30} />
            <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-3 p-0 stack:grid-cols-2 wide:grid-cols-4">
              {TABS.map((tab) => (
                <li key={tab.key} className={`${CARD} p-4`}>
                  <span aria-hidden="true" className="grid h-[34px] w-[34px] place-items-center rounded-[11px]" style={well(tab.tint)}>
                    <Icon name={tab.glyph} size={18} color={tab.ink} />
                  </span>
                  <p className="mt-[11px] mb-0 text-[14.5px] font-bold text-ink">{t(`tab.nav.${tab.key}`)}</p>
                  <p className="mt-[5px] mb-0 text-meta-2 leading-[1.5] text-ink-2">{t(`publicPage.tabs.${tab.key}`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="m-0 mt-3 text-center text-meta-2 text-ink-3">{t('publicPage.insideCaption')}</p>

        {/* ── 3 · Ce que l'adhésion ouvre : six cartes garanties, puis le bandeau (`ClubOffer`) ── */}
        <div className="mm-section">
          <div className="mx-auto max-w-[720px] text-center">
            <span className="mm-kick">{t('publicPage.offerKick')}</span>
            <div className="mt-3">
              <SiteDisplay as="h2" lines={t('publicPage.offerTitle', { returnObjects: true }) as string[]} size={40} />
            </div>
            <p className="mx-auto mt-3 max-w-[52ch] text-[15.5px] leading-[1.6] text-ink-2">{t('publicPage.includedNote')}</p>
          </div>

          <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 stack:grid-cols-2 wide:grid-cols-3">
            {offer.map((card) => (
              <li key={card.key} className="mm-offer__c rv" style={BENTO}>
                <span aria-hidden="true" className="mm-offer__ic" style={well(card.tint)}>
                  <Icon name={card.glyph} size={20} color={card.ink} />
                </span>
                <b>{t(`publicPage.offerCards.${card.key}`)}</b>
                <span>{card.body}</span>
              </li>
            ))}
          </ul>

          {/* Ce qui DÉPEND DES MEMBRES — jamais glissé dans les six cartes. Même texte que le
              mur d'abonnement, mot pour mot : un engagement ne se reformule pas d'un écran à l'autre. */}
          <p className="mm-build mx-0">
            <Tag tone="warn">{t('subscriptionGate.building.tag')}</Tag>
            <span className="min-w-0 flex-1">
              <b className="text-ink">{t('subscriptionGate.building.title')}</b> — {t('subscriptionGate.building.body')}
            </span>
          </p>

          <div className={`${CARD} mt-4 p-6`}>
            <Tag tone="ok">{t('subscriptionGate.guaranteed.tag')}</Tag>
            <p className="mt-3 mb-0 font-display text-[20px] font-black tracking-[-.03em] text-ink">
              {t('subscriptionGate.guaranteed.title')}
            </p>
            <p className="mt-[9px] mb-0 text-[14.5px] leading-[1.6] text-ink-2">{t('subscriptionGate.guaranteed.body')}</p>
          </div>
        </div>

        {/* ── 4 · Trois étapes pour commencer (`mm-steps`) ─────────────────────────── */}
        <div className="mm-section">
          <div className="mx-auto max-w-[720px] text-center">
            <span className="mm-kick">{t('publicPage.stepsKick')}</span>
            <div className="mt-3">
              <SiteDisplay as="h2" lines={t('publicPage.stepsTitle', { returnObjects: true }) as string[]} size={40} />
            </div>
          </div>
          <ol className="m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 wide:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="mm-step rv" style={BENTO}>
                <div className="mm-step__vis" aria-hidden="true">
                  {(stepGlyphs[i] ?? []).map((g) => (
                    <span key={g} className={`${CARD} grid h-12 w-12 place-items-center text-transforme`}>
                      <Icon name={g} size={20} />
                    </span>
                  ))}
                </div>
                <span className="mm-step__n">{String(i + 1).padStart(2, '0')}</span>
                <b className="text-[17px] text-ink">{step.title}</b>
                <span className="text-[14.5px] leading-[1.5] text-ink-2">{step.body}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── 5 · Le tarif, l'échéance et les questions (`ClubPricing`) ────────────── */}
        <div className="mm-section grid items-start gap-10 wide:grid-cols-[.95fr_1.05fr]">
          <div className="mm-price rv" style={BENTO}>
            <span className="mm-kick">{t('publicPage.includedTitle')}</span>
            <p className="m-0 mt-4 flex flex-wrap items-baseline gap-[10px]">
              <b className="text-[52px] tracking-[-.045em] text-transforme">
                <Num value={CLUB_PRICE_XOF} source="server" asOf={asOf} />
              </b>
              <span className="text-[16px] font-semibold text-ink">{t('publicPage.priceUnitYear')}</span>
            </p>
            <p className="mt-2 mb-0 text-[14.5px] text-ink-2">
              <b className="text-ink"><Num value={monthly} unit="F" source="server" asOf={asOf} /></b> {t('publicPage.perMonth')}
              {' · '}{t('publicPage.priceMonthlyNote')}
            </p>
            <p className="mt-1 mb-0 text-[13px] font-semibold text-ink-2"><PriceApprox xof={CLUB_PRICE_XOF} /></p>

            <div className="mt-4">
              <CheckLine>{t('publicPage.included.missions')}</CheckLine>
              <CheckLine>{t('publicPage.included.answer')}</CheckLine>
              <CheckLine>{t('publicPage.included.workshops')}</CheckLine>
            </div>

            <Button href={path('/mon-espace/club')} tone="transforme" style={{ marginTop: '20px' }}>
              {t('publicPage.cta')}
            </Button>
            <div className="mt-[14px] flex flex-wrap gap-2">
              <Tag>{t('publicPage.payWave')}</Tag>
              <Tag>{t('publicPage.payOrange')}</Tag>
              <Tag>{t('publicPage.payCard')}</Tag>
            </div>

            <div className="my-5 h-px bg-[color:var(--border-hair)]" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-meta text-ink-2">{t('publicPage.referralRow')}</span>
              <b className="text-[16px] text-ink"><Num value={clubReferralPrice()} unit="F" source="server" asOf={asOf} /></b>
            </div>
            <p className="mt-[9px] mb-0 text-small text-ink-2">{t('publicPage.referralNote')}</p>

            {/* L'ÉCHÉANCE : aucun prélèvement automatique, sur aucun moyen de paiement — un
                engagement, pas une limite technique (voir `renewalBody`). */}
            <div className="mt-5 rounded-m bg-[color:var(--fill-1)] p-4">
              <p className="m-0 text-meta font-bold text-ink">{t('publicPage.renewalTitle')}</p>
              <p className="mt-1.5 mb-0 text-meta-2 leading-[1.6] text-ink-2">{t('publicPage.renewalBody')}</p>
            </div>
            <PriceFootnote className="mt-[9px] mb-0" />
          </div>

          <div>
            <SiteDisplay as="h2" lines={t('publicPage.faqTitle', { returnObjects: true }) as string[]} size={34} />
            <div className="mm-faq mt-4">
              {faq.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary className="text-ink">{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ── 6 · Et si ce n'est pas pour toi ──────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.fitTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-6 grid gap-4 stack:grid-cols-2">
            <div className={`${CARD} rv p-6`}>
              <p className="m-0 font-display text-[19px] font-black tracking-[-.03em] text-ink">{t('publicPage.fitYesTitle')}</p>
              <CheckLine tone="ok">{t('publicPage.fitYes1')}</CheckLine>
              <CheckLine tone="ok">{t('publicPage.fitYes2')}</CheckLine>
              <CheckLine tone="ok">{t('publicPage.fitYes3')}</CheckLine>
            </div>
            {/* Le renvoi vers les autres territoires : une page de vente qui ne nomme aucune
                sortie fait payer des gens à qui elle ne convient pas. */}
            <div className={`${CARD} rv p-6`}>
              <p className="m-0 font-display text-[19px] font-black tracking-[-.03em] text-ink">{t('publicPage.fitNoTitle')}</p>
              <CheckLine tone="neutre" dash>
                {t('publicPage.fitNo1')}{' '}
                <a className="font-semibold text-forme underline" href={path('/formations')}>{tNav('formations')}</a>
              </CheckLine>
              <CheckLine tone="neutre" dash>
                {t('publicPage.fitNo2')}{' '}
                <a className="font-semibold text-digitalise-txt underline" href={path('/conception/commerces-et-tpe')}>{tNav('presence')}</a>
              </CheckLine>
              <CheckLine tone="neutre" dash>
                {t('publicPage.fitNo3')}{' '}
                <a className="font-semibold text-informe-txt underline" href={path('/blog')}>{tNav('blog')}</a>
                {t('publicPage.fitNo3End')}
              </CheckLine>
            </div>
          </div>
        </div>

        {/* ── 7 · Avant de payer, écoute-les ───────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.listenTitle', { returnObjects: true }) as string[]} size={34} />
          <p className="rv mt-[14px] max-w-[62ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 4 }}>
            {t('publicPage.listenLede')}
          </p>
          <div className="mt-6 grid items-center gap-4 wide:grid-cols-[1.1fr_.9fr]">
            {firstEpisode ? (
              <div className="rv" style={{ ['--i' as string]: 5 }}>
                <MediaCard
                  format="audio"
                  artHeight={150}
                  titleSize={21}
                  eyebrow={firstEpisode.duration}
                  title={firstEpisode.title}
                  playHref={path(`/podcasts/${firstEpisode.slug}`)}
                  playLabel={`${t('publicPage.listenCta')} — ${firstEpisode.title}`}
                  actions={
                    <Button href={path('/podcast-et-videos')} tone="quiet" size="sm" fullWidth={false}>
                      {t('publicPage.listenCta')}
                    </Button>
                  }
                />
              </div>
            ) : (
              <p className="rv max-w-prose text-lede text-ink-2" style={{ ['--i' as string]: 5 }}>{t('publicPage.listenEmpty')}</p>
            )}
            <p className="rv m-0 text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 6 }}>{t('publicPage.listenBoundary')}</p>
          </div>
        </div>

        {/* ── 8 · Le panneau de vérité de la page — le seul ─────────────────────── */}
        <TruthPanel
          className="mt-[22px]"
          provenTitle={t('publicPage.truthProvenTitle')}
          withheldTitle={t('publicPage.truthWithheldTitle')}
          proven={[
            t('subscriptionGate.truth.proven2'),
            t('subscriptionGate.truth.proven3'),
            t('publicPage.truthProvenPurchase'),
          ]}
          withheld={[
            t('subscriptionGate.truth.withheld1', { opened: clubOpened }),
            t('subscriptionGate.truth.withheld2'),
          ]}
        />

        {/* ── 9 · La dalle d'encre finale — `.dk` est une PORTÉE, jamais une prop (AD-3) ── */}
        <div className="dk rv-s mm-section rounded-xl bg-night p-[34px] text-[color:var(--text-body)]">
          <div className="grid items-center gap-10 wide:grid-cols-[1.2fr_.8fr]">
            <div>
              <h2 className="m-0 font-display text-[34px] font-black leading-[1.05] tracking-[-.03em] text-ink">
                {t('publicPage.finalPre')}{' '}
                <b className="font-bold"><Num value={monthly} unit="F" source="server" asOf={asOf} /></b>{' '}
                {t('publicPage.finalPost')}
                <br />
                {t('publicPage.finalSecondLine')}
              </h2>
              <p className="mt-3 mb-0 max-w-[48ch] text-[14px] leading-[1.6] text-ink-2">{t('publicPage.finalBody')}</p>
            </div>
            <div className="flex flex-col gap-[10px]">
              <Button href={path('/mon-espace/club')} tone="transforme">{t('publicPage.cta')}</Button>
              <Button href={path('/contact')} tone="ghost">{t('publicPage.finalCtaSecondary')}</Button>
            </div>
          </div>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
