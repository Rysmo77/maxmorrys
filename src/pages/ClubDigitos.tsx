import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, Num, type IconName } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import DsNavHost from '../components/layout/DsNavHost';
import { SiteBand } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import {
  CLUB_MEMBER_FORMATION_DISCOUNT, CLUB_PRICE_XOF, CLUB_REFERRAL_DISCOUNT, LIVE_SESSIONS_PER_MONTH,
} from '../lib/club/pricing';
import { RYSMO_CLUB_BONUS } from '../lib/rysmo/quota';
import { getPublicClubStats, type PublicClubStats } from '../lib/firestore/club';
import { queryKeys } from '../lib/queryClient';
import { CLUB_NAV, clubTabPath } from './lms/tabs/club/clubNav';
import {
  CLUB_PUBLIC_CATEGORIES, CategoryChip, HERO_TOP, PriceCard, SessionsClosed, type PriceCardCopy,
} from './club/parts';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /club-des-digitos — LA PAGE PUBLIQUE DU CLUB. Maquette `Club-Accueil.dc.html` (+ `-mobile`),
 * passe 2 : la mise en page, les sections et les textes de la maquette font foi.
 *
 * Ordre de la maquette : héros (prix dès le premier écran) → l'intérieur dans un cadre de
 * navigateur → six cartes garanties + bandeau « en construction » → trois étapes → prochaines
 * sessions et « de quoi on parle » → tarif et questions → citation de Max-Morrys.
 *
 * CE QUE LA MAQUETTE MONTRE AVEC DES « DONNÉES D'EXEMPLE », ET CE QUE LA PAGE EN FAIT
 * · L'aperçu de l'espace membre : le cadre, le rail (les huit onglets RÉELS de `CLUB_NAV`) et
 *   la disposition sont gardés ; les publications, prénoms et compteurs d'exemple sont
 *   remplacés par une maquette figée (les rubriques réelles, le champ de publication vide) —
 *   aucun membre inventé, et plus de barres grises qui passaient pour un chargement bloqué.
 * · Le calendrier : `club_sessions` n'est lisible que par les membres (règles). La page dit
 *   où se trouvent les dates et montre le relevé public des sessions tenues.
 * · Les cercles : ils n'existent pas. Les six catégories réelles d'une publication prennent
 *   leur place, et la colonne de cercles de l'aperçu reste vide.
 *
 * Les nombres viennent de leurs modules (`lib/club/pricing`, `lib/rysmo/quota`) ; aucun
 * nombre de membres, aucune note, aucun témoignage, aucune promesse de remboursement.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const OFFER: { key: string; icon: IconName; tint: string }[] = [
  { key: 'feed', icon: 'comment', tint: 'var(--mm-violet)' },
  { key: 'sessions', icon: 'video', tint: 'var(--mm-corail)' },
  { key: 'opportunities', icon: 'case', tint: 'var(--mm-teal)' },
  { key: 'directory', icon: 'users', tint: 'var(--mm-bleu)' },
  { key: 'discount', icon: 'tag', tint: 'var(--mm-orange)' },
  { key: 'rysmo', icon: 'sparkles', tint: 'var(--mm-violet)' },
];

const well = (tint: string) => ({ background: `color-mix(in srgb, ${tint} 13%, transparent)`, color: tint });

/** Les rubriques montrées dans la carte « Pour toi » de l'aperçu — toutes réelles. */
const PREVIEW_TABS: ReadonlyArray<string> = ['feed', 'agenda', 'opportunities'];

export default function ClubDigitos() {
  const { t } = useTranslation('club');
  const path = useLocalizedPath();
  /* `useRef` et non `new Date()` dans le corps : un `<Num>` mémoïsé sur `asOf` ne se
     recalcule pas à chaque rendu. */
  const asOf = useRef(new Date()).current;
  const monthly = Math.round(CLUB_PRICE_XOF / 12);
  const discountPct = Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100);
  const referralPct = Math.round(CLUB_REFERRAL_DISCOUNT * 100);

  /* CE QUI A RÉELLEMENT ÉTÉ TENU. `null` → « non relevé », jamais un zéro fabriqué. */
  const { data: clubStats } = useQuery<PublicClubStats | null>({
    queryKey: queryKeys.publicClubStats,
    queryFn: () => getPublicClubStats(),
  });

  const list = <T,>(key: string): T[] => {
    const raw = t(key, { returnObjects: true });
    return Array.isArray(raw) ? (raw as T[]) : [];
  };
  const faq = list<{ q: string; a: string }>('v3.faq.items');
  const steps = list<{ title: string; body: string }>('v3.steps.items');
  const priceCopy: PriceCardCopy = {
    title: t('v3.price.title'),
    tag: t('v3.price.tag'),
    perYear: t('v3.price.perYear'),
    monthlyPre: t('v3.price.monthlyPre'),
    monthlyPost: t('v3.price.monthlyPost'),
    referralPost: t('v3.price.referralPost', { pct: referralPct }),
    items: [
      t('v3.price.items.feed'),
      t('v3.price.items.sessions', { n: LIVE_SESSIONS_PER_MONTH }),
      t('v3.price.items.opportunities'),
      t('v3.price.items.discount', { pct: discountPct }),
      t('v3.price.items.rysmo', { n: RYSMO_CLUB_BONUS }),
    ],
    note: t('v3.price.note'),
  };
  const offerVars = { n: LIVE_SESSIONS_PER_MONTH, pct: discountPct, bonus: RYSMO_CLUB_BONUS };
  const joinHref = path('/club-des-digitos/adhesion');

  return (
    <DsNavHost>
      <SEOHead title={t('publicPage.seoTitle')} description={t('publicPage.seoDescription')} />
      {/* Aucune donnée structurée d'offre ni d'avis : un `AggregateRating` sur un club fermé
          sans avis vérifiable serait précisément le chiffre inventé que le système refuse. */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }} />

      {/* ── 1 · Le héros, puis l'intérieur dans un cadre de navigateur ─────────── */}
      <section className="mm-lhero px-[18px] stack:px-11" style={HERO_TOP}>
        <span className="mm-cpill max-w-full" style={{ background: 'var(--bento)' }}>
          <b>{t('v3.hero.pill')}</b>
          <span className="truncate">{t('v3.hero.pillText')}</span>
        </span>
        <h1 className="!text-[44px] stack:!text-[78px]" style={{ maxWidth: 'none' }}>
          {t('v3.hero.titleA')}
          <br className="hidden stack:inline" /> {t('v3.hero.titleB')} <em>{t('v3.hero.titleEm')}</em>
        </h1>
        <p className="mm-lhero__sub !text-[16px] stack:!text-[18px]">{t('publicPage.lede')}</p>
        <div className="mm-lhero__cta flex-col stack:flex-row">
          <a className="mm-btn-club" href={joinHref}>
            {t('v3.hero.cta')} · <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} /> {t('v3.price.perYear')}
            <Icon name="arrow-up-right" size={16} />
          </a>
          <a className="mm-btn-ghost" href="#interieur" style={{ background: 'var(--bento)' }}>{t('publicPage.ctaInside')}</a>
        </div>
        <span className="mm-lhero__note">
          {t('v3.price.monthlyPre')} <Num value={monthly} unit="F" source="server" asOf={asOf} /> {t('v3.hero.note')}
        </span>

        <div className="mm-browser scroll-mt-24" id="interieur" style={{ background: 'var(--bento)' }}>
          <div className="mm-browser__bar" aria-hidden="true">
            <i /><i /><i />
            <span className="mm-browser__url"><Icon name="lock" size={12} />{t('v3.preview.url')}</span>
            <span style={{ width: 45 }} />
          </div>
          <div className="mm-browser__body">
            <div className="mm-dash !grid-cols-[minmax(0,1fr)] !p-3 wide:!grid-cols-[76px_minmax(0,1fr)_76px] wide:!p-4">
              <nav className="mm-dash__rail !hidden wide:!flex" aria-label={t('v3.preview.railLabel')}>
                {CLUB_NAV.map((it, i) => (
                  <a key={it.id} href={path(clubTabPath(it.id))} title={t(`tab.nav.${it.id}`)} aria-label={t(`tab.nav.${it.id}`)} aria-current={i === 0 ? 'page' : undefined}>
                    <Icon name={it.icon} size={20} />
                  </a>
                ))}
              </nav>
              <div className="min-w-0 space-y-4" aria-hidden="true">
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <b className="block font-display text-[24px] leading-none tracking-[-.03em] text-ink stack:text-[30px]">{t('v3.preview.greeting')}</b>
                    <span className="mt-1.5 block text-[13px] text-ink-2">{t('v3.preview.greetingSub')}</span>
                  </div>
                  <span className="mm-dsearch ml-auto !hidden !w-[260px] wide:!flex"><Icon name="search" size={16} />{t('v3.preview.search')}</span>
                </div>
                <div className="grid gap-4 wide:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div
                    className="mm-feature !min-h-[220px]"
                    style={{ background: 'radial-gradient(90% 90% at 30% 30%, var(--mm-orange), var(--mm-corail) 45%, var(--mm-violet) 100%)' }}
                  >
                    <span className="mb-2.5 text-[11px] font-semibold uppercase tracking-[.14em]">{t('v3.preview.sessionKick')}</span>
                    <b className="!text-[26px]">{t('v3.preview.sessionTitle')}</b>
                  </div>
                  {/* MAQUETTE FIGÉE, PAS UN CHARGEMENT (audit 29/10/2026, #13) : les barres grises se
                      lisaient comme une page bloquée. On montre à la place ce qui existe vraiment —
                      les rubriques réelles de l'espace (`CLUB_NAV`) — sans membre ni chiffre inventé. */}
                  <div className="mm-card !p-5">
                    <b className="block text-[17px] text-ink">{t('v3.preview.forYou')}</b>
                    <ul className="m-0 mt-3 list-none space-y-2 p-0">
                      {CLUB_NAV.filter((it) => PREVIEW_TABS.includes(it.id)).map((it) => (
                        <li key={it.id} className="flex items-center gap-3 rounded-m border border-[color:var(--line)] px-3 py-2.5">
                          <span className="grid h-9 w-9 flex-none place-items-center rounded-m text-transforme" style={{ background: 'color-mix(in srgb, var(--mm-violet) 10%, transparent)' }}>
                            <Icon name={it.icon} size={17} />
                          </span>
                          <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">{t(`tab.nav.${it.id}`)}</span>
                          <Icon name="chevron-right" size={16} color="var(--ink-3)" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mm-dpost">
                  <div className="flex items-center gap-3">
                    <span className="mm-avatar" style={{ background: 'var(--fill-1)', color: 'var(--ink-3)' }}><Icon name="user" size={18} /></span>
                    <span className="min-w-0 flex-1 rounded-pill border border-[color:var(--line)] px-4 py-2.5 text-[14px] text-ink-3">
                      {t('v3.steps.composer')}
                    </span>
                    <span className="mm-tag !hidden stack:!inline-flex">{t('v3.steps.publish')}</span>
                  </div>
                  <div className="mt-4 flex gap-4 text-ink-3">
                    <Icon name="heart" size={18} /><Icon name="comment" size={18} /><Icon name="repeat" size={18} />
                  </div>
                </div>
              </div>
              <aside className="mm-circles !hidden wide:!flex" aria-label={t('v3.preview.circles')}>
                <span className="text-[9.5px] font-semibold uppercase tracking-[.1em] text-ink-3">{t('v3.preview.circles')}</span>
                <span className="grid h-[42px] w-[42px] place-items-center rounded-xs border-[1.5px] border-dashed border-[color:var(--ink-3)] text-ink-3">
                  <Icon name="plus" size={16} />
                </span>
              </aside>
            </div>
          </div>
        </div>
      </section>
      <p className="m-0 border-t border-[color:var(--line)] bg-bento px-[18px] py-3.5 text-center text-[12.5px] text-ink-3">
        {t('v3.preview.caption')}
      </p>

      {/* ── 2 · Ce que tu as en rejoignant ──────────────────────────────────── */}
      <SiteBand style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div className="mm-sec__head">
          <span className="mm-kick">{t('v3.offer.kick')}</span>
          <h2 className="!text-[34px] stack:!text-[52px]">{t('v3.offer.title')}</h2>
          <p>{t('v3.offer.sub')}</p>
        </div>
        <div className="mm-offer !grid-cols-1 stack:!grid-cols-2 wide:!grid-cols-3">
          {OFFER.map((c) => (
            <div key={c.key} className="mm-offer__c" style={{ background: 'var(--bento)' }}>
              <span className="mm-offer__ic" style={well(c.tint)} aria-hidden="true"><Icon name={c.icon} size={20} /></span>
              <b>{t(`v3.offer.cards.${c.key}.title`, offerVars)}</b>
              <span>{t(`v3.offer.cards.${c.key}.body`, offerVars)}</span>
            </div>
          ))}
        </div>
        <p className="mm-build">
          <span className="mm-tag" style={{ border: '1.5px dashed var(--ink-3)', background: 'none' }}>{t('v3.offer.buildTag')}</span>
          {t('v3.offer.build')}
        </p>
      </SiteBand>

      {/* ── 3 · Trois étapes pour commencer ─────────────────────────────────── */}
      <SiteBand tint="var(--paper)" style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div className="mm-sec__head">
          <span className="mm-kick">{t('v3.steps.kick')}</span>
          <h2 className="!text-[34px] stack:!text-[52px]">{t('v3.steps.title')}</h2>
        </div>
        <ol className="mm-steps m-0 list-none p-0 !grid-cols-1 wide:!grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="mm-step" style={{ background: 'var(--bento)' }}>
              <div className="mm-step__vis" aria-hidden="true">
                {i === 0 && [t('publicPage.payWave'), t('publicPage.payOrange'), t('publicPage.payCard')].map((m, j) => (
                  <span
                    key={m}
                    className="flex items-center gap-2 rounded-xs bg-bento px-3.5 py-2.5 text-[13px] font-bold text-ink"
                    style={{ border: j === 0 ? '2px solid var(--mm-violet)' : '1px solid var(--line)' }}
                  >
                    <Icon name={j === 2 ? 'card' : 'smartphone'} size={16} />{m}
                  </span>
                ))}
                {i === 1 && CLUB_PUBLIC_CATEGORIES.map((c) => (
                  <CategoryChip key={c.id} label={t(`categories.${c.id}`)} icon={c.icon} tint={c.tint} />
                ))}
                {i === 2 && (
                  <div className="flex w-full items-center gap-2.5 rounded-m border border-[color:var(--line)] bg-bento px-3 py-2.5">
                    <span className="mm-avatar sm" style={{ background: 'var(--fill-1)', color: 'var(--ink-3)' }}><Icon name="user" size={15} /></span>
                    <span className="flex-1 text-[12.5px] text-ink-3">{t('v3.steps.composer')}</span>
                    <span className="rounded-xs bg-transforme px-3 py-2 text-[12px] font-bold text-[color:var(--paper-fixed)]">{t('v3.steps.publish')}</span>
                  </div>
                )}
              </div>
              <span className="mm-step__n">{String(i + 1).padStart(2, '0')}</span>
              <b className="text-[18px] leading-[1.25] text-ink">{step.title}</b>
              <span className="text-[14.5px] leading-[1.5] text-ink-2">{step.body}</span>
            </li>
          ))}
        </ol>
      </SiteBand>

      {/* ── 4 · Prochaines sessions · de quoi on parle ──────────────────────── */}
      <SiteBand style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div className="grid items-start gap-10 wide:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            <span className="mm-kick">{t('v3.sessions.kick')}</span>
            <h2 className="mm-d mb-5 mt-3 text-[30px] text-ink stack:text-[40px]">{t('v3.sessions.title')}</h2>
            <SessionsClosed
              title={t('v3.sessions.closedTitle')}
              body={t('v3.sessions.closedBody', { n: LIVE_SESSIONS_PER_MONTH })}
              heldPre={t('v3.sessions.heldPre', { days: clubStats?.windowDays ?? 90 })}
              held={clubStats?.liveSessionsHeld ?? null}
              heldAsOf={clubStats ? new Date(clubStats.asOf) : null}
              asOf={asOf}
            />
            <div className="mt-3.5 flex justify-end">
              <a className="mm-ulink" href={path('/club-des-digitos/sessions')}>
                {t('v3.sessions.link')} <Icon name="arrow-up-right" size={14} />
              </a>
            </div>
          </div>
          <div>
            <span className="mm-kick">{t('v3.topics.kick')}</span>
            <h2 className="mm-d mb-5 mt-3 text-[30px] text-ink stack:text-[40px]">{t('v3.topics.title')}</h2>
            <div className="mm-card !p-6">
              <div className="flex flex-wrap gap-2">
                {CLUB_PUBLIC_CATEGORIES.map((c) => (
                  <CategoryChip key={c.id} label={t(`categories.${c.id}`)} icon={c.icon} tint={c.tint} />
                ))}
              </div>
              <p className="m-0 mt-[18px] text-[14.5px] leading-[1.55] text-ink-2">{t('v3.topics.body')}</p>
            </div>
          </div>
        </div>
      </SiteBand>

      {/* ── 5 · Le tarif et les questions ───────────────────────────────────── */}
      <SiteBand tint="var(--paper)" style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div id="tarif" className="grid items-start gap-12 wide:grid-cols-[440px_minmax(0,1fr)] wide:gap-16">
          <PriceCard copy={priceCopy} asOf={asOf}>
            <a className="mm-btn-club w-full" href={joinHref}>{t('v3.price.cta')}</a>
          </PriceCard>
          <div>
            <span className="mm-kick">{t('v3.faq.kick')}</span>
            <h2 className="mm-d mb-4 mt-3 text-[30px] text-ink stack:text-[44px]">{t('v3.faq.title')}</h2>
            <div className="mm-faq">
              {faq.map((item, i) => (
                <details key={item.q} open={i === 0}>
                  <summary className="text-ink">{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </SiteBand>

      {/* ── 6 · La citation de Max-Morrys — pas un témoignage (doc 04 du kit) ──── */}
      <SiteBand tint="var(--paper)" style={{ paddingTop: 0, paddingBottom: 96 }}>
        <div
          className="grid items-center gap-8 rounded-xl p-7 stack:p-14 wide:grid-cols-[minmax(0,1fr)_auto] wide:gap-10"
          style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--mm-violet) 12%, var(--bento)), color-mix(in srgb, var(--mm-orange) 16%, var(--bento)))' }}
        >
          <div>
            <span className="mm-avatar lg" style={{ background: 'linear-gradient(135deg, var(--mm-bleu), var(--mm-teal))' }} aria-hidden="true">MM</span>
            <p className="m-0 mb-2.5 mt-[18px] max-w-[30ch] font-display text-[24px] font-bold leading-[1.25] tracking-[-.01em] text-ink stack:text-[30px]">
              {t('v3.quote.text')}
            </p>
            <span className="text-[14px] text-ink-2">{t('v3.quote.by')}</span>
          </div>
          <div className="flex flex-col items-stretch gap-2.5">
            <a className="mm-btn-club" href={joinHref}>{t('v3.price.cta')}</a>
            <a className="mm-btn-ghost" href={path('/club-des-digitos/sessions')} style={{ background: 'var(--bento)' }}>{t('v3.quote.sessions')}</a>
          </div>
        </div>
      </SiteBand>
    </DsNavHost>
  );
}
