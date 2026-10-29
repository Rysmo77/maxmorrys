import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon, Num } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_URLS } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { Eyebrow, Hl, KitButton, KitH2, KitSection, Lines, NightHero, Photo, type PhotoTone } from '../components/site/v3/kit';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { portrait } from '../lib/author';
import { clientProjects } from '../lib/brand/clients';
import { legalEntity } from '../lib/brand/company';
import { CLUB_PRICE_XOF } from '../lib/club/pricing';
import { contentPath } from '../lib/contentPath';
import { queryKeys } from '../lib/queryClient';
import type { BlogPost, Podcast, Video } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ACCUEIL — LA MAQUETTE `Main` (bureau) / `Hub-Accueil-mobile` (390 px), PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES PAR LE PORTEUR (29/10/2026) : « maquettes + DS + PRD rév. 6 font foi ».
 * L'accueil « cinq blocs » du CDC du 14/09 et l'accueil « sept sections » du 01/09 sont
 * abandonnés : la page suit l'ordre de la planche — dalle de nuit, clients, à propos,
 * publics, offres, méthode, vidéos, articles, appel final.
 *
 * Ce qui reste tenu, et pourquoi la page diffère de la planche à ces endroits-là :
 * - CHIFFRES DÉRIVÉS OU MASQUÉS. « 2022 » vient de l'immatriculation (`legalEntity`),
 *   « 11 » du compte des réalisations publiées (`clientProjects`). « 20+ formés » et
 *   « 3 pays » n'ont aucune source : ils ne s'affichent pas. La pastille « Disponible pour
 *   [N] projets en [MOIS] » n'a pas de donnée : absente.
 * - CLIENTS : seulement les vrais noms de `clientProjects`, jamais de `[Client 4]`.
 * - TÉMOIGNAGES : aucun témoignage avec accord écrit n'existe en base — la section de la
 *   planche (marquée « exemple ») n'est pas rendue.
 * - VIDÉOS, ARTICLES, ÉPISODE : lus en base ; une section sans contenu publié disparaît
 *   au lieu d'afficher les titres d'exemple de la planche.
 * - PHOTOS : seul le portrait existe (`portrait`). Les autres emplacements gardent le
 *   dégradé du kit, sans libellé « à faire ».
 *
 * `Home` est la SEULE page montée sans `lazy()` : les lectures Firestore passent par un
 * `import()` dans leur `queryFn` (`tests/unit/first-view-graph.test.ts`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const AUDIENCES: { key: 'tpe' | 'pro' | 'brands'; to: string; tone: PhotoTone }[] = [
  { key: 'tpe', to: '/conception/commerces-et-tpe', tone: 'studio' },
  { key: 'pro', to: '/apprendre', tone: 'edu' },
  { key: 'brands', to: '/conception', tone: 'informe' },
];

const OFFERS: { key: 'edu' | 'club' | 'tpe' | 'custom'; to: string; tone: PhotoTone }[] = [
  { key: 'edu', to: '/apprendre', tone: 'edu' },
  { key: 'club', to: '/club-des-digitos', tone: 'club' },
  { key: 'tpe', to: '/conception/commerces-et-tpe', tone: 'studio' },
  { key: 'custom', to: '/conception', tone: 'informe' },
];

const ARTICLE_TONES: PhotoTone[] = ['informe', 'studio', 'edu', 'club'];
const VIDEO_TONES: PhotoTone[] = ['club', 'edu', 'informe', 'studio', 'edu'];

export default function Home() {
  const { t } = useTranslation('home');
  const { t: tShared } = useTranslation('shared');
  const path = useLocalizedPath();
  const { language } = useLanguage();
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';

  const { data: posts = [] } = useQuery<BlogPost[]>({
    queryKey: queryKeys.homeRecentPosts,
    queryFn: async () => (await import('../lib/firestore/blog')).getPublishedPosts(5),
  });
  const { data: podcasts = [] } = useQuery<Podcast[]>({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: async () => (await import('../lib/firestore/content')).getPublishedPodcasts(),
  });
  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: queryKeys.publishedVideos,
    queryFn: async () => (await import('../lib/firestore/content')).getPublishedVideos(),
  });

  /* Les deux faits de la dalle — chacun avec sa source et sa date (AD-5). */
  const registeredAt = new Date(`${legalEntity.registeredAt}T12:00:00Z`);
  const renderedAt = new Date();
  const projectCount = clientProjects.length;
  const latestEpisode = podcasts[0];
  const articles = posts.slice(0, 4);
  /* La planche montre cinq vignettes, la plus récente au centre. */
  const shownVideos = videos.slice(0, 5);
  const centre = Math.floor(shownVideos.length / 2);
  const ordered = shownVideos.length > 0 ? [...shownVideos.slice(1, centre + 1).reverse(), shownVideos[0], ...shownVideos.slice(centre + 1)] : [];
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <DsNavHost>
      <SEOHead title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} ogImage={DEFAULT_OG_IMAGE} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        sameAs: Object.values(SOCIAL_URLS),
      }} />

      {/* ── 1 · LA DALLE DE NUIT ─────────────────────────────────────────────── */}
      <NightHero
        mesh="club"
        className="flex min-h-[780px] flex-col wide:min-h-[860px]"
        backdrop={
          <>
            <Photo tone="club" className="!absolute inset-0 !rounded-none" />
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden wide:block"
              style={{ background: 'linear-gradient(90deg,rgba(10,13,17,.94) 0%,rgba(10,13,17,.6) 45%,rgba(10,13,17,0) 72%),linear-gradient(0deg,rgba(10,13,17,.92) 0%,rgba(10,13,17,0) 42%)' }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 wide:hidden"
              style={{ background: 'linear-gradient(0deg,rgba(10,13,17,.96) 10%,rgba(10,13,17,.2) 70%)' }}
            />
          </>
        }
      >
        <div className="relative z-[1] mx-auto mt-auto box-border w-full max-w-[1360px] px-5 pb-6 wide:mt-0 wide:flex-1 wide:px-10 wide:pb-0 wide:pt-[150px]">
          <h1 className="mm-d m-0 mb-4 text-[min(58px,14.6vw)] !leading-[.86] wide:!leading-[.84] wide:mb-6 wide:text-[clamp(72px,9.5vw,148px)]" style={{ letterSpacing: '-.055em' }}>
            <Lines accent="aplat" lines={t('hero.titleLines', { returnObjects: true }) as string[]} />
          </h1>
          <p className="m-0 mb-[18px] max-w-[48ch] text-[15.5px] leading-[1.5] text-ink-2 wide:mb-7 wide:text-[19px]">{t('hero.lede')}</p>
          <div className="flex flex-wrap gap-[10px]">
            <KitButton href={path('/contact?rdv=1')} tone="club" arrow className="w-full justify-between stack:w-auto">
              {t('hero.ctaCall')}
            </KitButton>
            <KitButton href={path('/a-propos')} tone="veil" className="hidden stack:inline-flex">
              {t('hero.ctaStory')}
            </KitButton>
          </div>
        </div>
        <div className="relative z-[1] mx-auto box-border w-full max-w-[1360px] px-5 pb-6 wide:mt-16 wide:px-10 wide:pb-[30px]">
          <dl aria-label={t('hero.statsLabel')} className="m-0 grid grid-cols-2 border-0 border-t border-solid border-[color:var(--line)] wide:grid-cols-4">
            <div className="mm-stat !pl-0">
              <dt className="sr-only">{t('stats.projectsLabel')}</dt>
              <dd className="m-0 contents">
                <span className="mm-stat__v !text-[30px] wide:!text-[44px]"><Num value={projectCount} source={{ cite: t('stats.projectsSrc') }} asOf={renderedAt} /></span>
                <span className="mm-stat__l text-ink-2" aria-hidden="true">{t('stats.projectsLabel')}</span>
                <span className="mm-stat__src">{t('stats.projectsSrc')}</span>
              </dd>
            </div>
            <div className="mm-stat">
              <dt className="sr-only">{t('stats.companyLabel')}</dt>
              <dd className="m-0 contents">
                <span className="mm-stat__v !text-[30px] wide:!text-[44px]"><Num value={String(registeredAt.getUTCFullYear())} source={{ cite: t('stats.companySrc', { date: fmt(registeredAt.toISOString()) }) }} asOf={registeredAt} /></span>
                <span className="mm-stat__l text-ink-2" aria-hidden="true">{t('stats.companyLabel')}</span>
                <span className="mm-stat__src">{t('stats.companySrc', { date: fmt(registeredAt.toISOString()) })}</span>
              </dd>
            </div>
          </dl>
        </div>
      </NightHero>

      {/* ── 2 · LES CLIENTS (vrais noms seulement) ───────────────────────────── */}
      <KitSection className="pt-10 text-center wide:pt-[72px]">
        <p className="m-0 mb-4 wide:mb-[22px]"><Eyebrow>{t('clients.eyebrow')}</Eyebrow></p>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-[22px] gap-y-[10px] p-0 font-display text-[20px] font-black leading-none tracking-[-.03em] text-ink-3 wide:gap-x-10 wide:gap-y-[14px] wide:text-[26px]">
          {clientProjects.map((c) => (
            <li key={c.slug}>{c.name}</li>
          ))}
        </ul>
      </KitSection>

      {/* ── 3 · À PROPOS ─────────────────────────────────────────────────────── */}
      <KitSection className="grid items-center gap-11 pt-14 wide:grid-cols-2 wide:gap-12 wide:pt-24">
        <div className="relative w-full wide:max-w-[460px]">
          <Photo
            className="h-[400px] !rounded-xl wide:h-[540px]"
            img={{ src: portrait.src, srcSet: portrait.srcSet, sizes: '(min-width: 1080px) 460px, 100vw', width: portrait.width, height: portrait.height, alt: tShared('portrait.alt') }}
          />
          {latestEpisode && (
            <a
              href={contentPath('podcasts', latestEpisode, language)}
              className="mm-float bottom-[-22px] right-3 text-ink no-underline wide:bottom-[60px] wide:right-[-40px] wide:max-w-[250px]"
            >
              <span className="mm-avatar bg-[image:linear-gradient(135deg,var(--mm-orange),var(--mm-corail))] text-[color:var(--ink-fixed)]">
                <Icon name="mic" size={16} />
              </span>
              <span>
                <b>{t('about.podcast')}</b>
                {latestEpisode.title}
              </span>
            </a>
          )}
        </div>
        <div>
          <Eyebrow>{t('about.eyebrow')}</Eyebrow>
          <KitH2 className="mb-[14px] mt-3 wide:mb-[22px] wide:mt-4" size="clamp(44px, 5.5vw, 76px)">
            <Hl text={t('about.title')} />
          </KitH2>
          <p className="m-0 mb-[18px] text-[15.5px] leading-[1.6] text-ink-2 stack:hidden">{t('about.pShort')}</p>
          <p className="m-0 mb-[14px] hidden max-w-[54ch] text-[17px] leading-[1.6] text-ink-2 stack:block">{t('about.p1')}</p>
          <p className="m-0 mb-[26px] hidden max-w-[54ch] text-[17px] leading-[1.6] text-ink-2 stack:block">{t('about.p2')}</p>
          <div className="flex flex-wrap gap-[10px]">
            <KitButton href={path('/a-propos')} tone="club" arrow className="hidden stack:inline-flex">{t('about.cta')}</KitButton>
            <KitButton href={path('/a-propos')} tone="quiet" arrow className="stack:hidden">{t('about.ctaShort')}</KitButton>
            <span aria-hidden="true" className="ml-3 hidden self-center font-display text-[30px] font-black leading-none text-ink-3 stack:inline">{t('about.signature')}</span>
          </div>
        </div>
      </KitSection>

      {/* ── 4 · POUR QUI JE TRAVAILLE ────────────────────────────────────────── */}
      <KitSection className="pt-14 wide:pt-24">
        <div className="grid items-center gap-4 rounded-xl wide:grid-cols-2 wide:gap-8 wide:bg-[color:var(--paper-2)] wide:p-10">
          <div>
            <Eyebrow>{t('audiences.eyebrow')}</Eyebrow>
            <KitH2 className="mb-4 mt-3 wide:mb-[18px] wide:mt-[14px]" size="clamp(38px, 5vw, 64px)">{t('audiences.title')}</KitH2>
            <p className="m-0 hidden text-[20px] leading-[1.45] text-ink-3 wide:block">
              {t('audiences.lede')} <b className="text-ink">{t('audiences.ledeStrong')}</b>
            </p>
          </div>
          <Photo tone="club" className="hidden h-[300px] wide:block" />
          <div className="grid gap-[10px] wide:col-span-2 wide:grid-cols-3 wide:gap-[14px]">
            {AUDIENCES.map((a) => (
              <a key={a.key} href={path(a.to)} className="relative isolate block h-[170px] overflow-hidden rounded-xl text-[color:var(--paper-fixed)] no-underline wide:h-auto wide:min-h-[260px]">
                <Photo tone={a.tone} className="!absolute inset-0 !min-h-0 !rounded-none" />
                <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(0deg,rgba(14,17,22,.88),rgba(14,17,22,.05) 70%)' }} />
                <span className="absolute bottom-[14px] left-4 right-4 wide:bottom-[18px] wide:left-5 wide:right-5">
                  <b className="block font-display text-[22px] font-black leading-[1.05] wide:text-[26px]">{t(`audiences.${a.key}Title`)}</b>
                  <span className="text-[13px] opacity-[.88] wide:text-[14px]">{t(`audiences.${a.key}Body`)}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </KitSection>

      {/* ── 5 · CE QUE JE PROPOSE ────────────────────────────────────────────── */}
      <section className="relative z-[3] pt-14 wide:pt-24">
        <KitSection as="div" className="mb-4 wide:mb-[26px]">
          <Eyebrow>{t('offers.eyebrow')}</Eyebrow>
          <KitH2 className="mt-3 wide:mt-[14px]" size="clamp(38px, 5vw, 64px)">
            <Lines lines={t('offers.titleLines', { returnObjects: true }) as string[]} />
          </KitH2>
        </KitSection>
        <KitSection as="div" className="!px-0 stack:!px-6">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] pb-2 stack:grid stack:grid-cols-2 stack:overflow-visible stack:px-0 stack:pb-0 wide:grid-cols-4 wide:gap-4">
            {OFFERS.map((o, i) => {
              const accent = i === 0;
              return (
                <a
                  key={o.key}
                  href={path(o.to)}
                  className={[
                    'flex min-h-[360px] flex-none basis-[260px] snap-start flex-col gap-[10px] rounded-xl p-4 no-underline stack:basis-auto wide:min-h-[440px] wide:gap-3 wide:p-[18px]',
                    accent ? 'bg-[color:var(--mm-violet)] text-[color:var(--paper-fixed)]' : 'border border-solid border-[color:var(--line)] bg-bento text-ink',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between">
                    <span className={accent ? 'mm-tag bg-[color:rgb(255_255_255/.18)] text-[color:var(--paper-fixed)]' : 'mm-tag'}>{t(`offers.${o.key}Tag`)}</span>
                    <span
                      aria-hidden="true"
                      className={[
                        'hidden h-[34px] w-[34px] place-items-center rounded-pill wide:grid',
                        accent ? 'bg-[color:var(--paper-fixed)] text-[color:var(--ink-fixed)]' : 'border border-solid border-[color:var(--line)]',
                      ].join(' ')}
                    >
                      <Icon name="arrow-up-right" size={16} />
                    </span>
                  </span>
                  <b className="font-display text-[24px] font-black leading-none wide:text-[28px]">{t(`offers.${o.key}Title`)}</b>
                  <span className={accent ? 'text-[13px] opacity-[.88] wide:text-[14px]' : 'text-[13px] text-ink-2 wide:text-[14px]'}>
                    {t(`offers.${o.key}Body`, { price: CLUB_PRICE_XOF.toLocaleString('fr-FR').replace(/\s/g, ' ') })}
                  </span>
                  <Photo tone={o.tone} className="mt-auto h-[170px] !min-h-0 !rounded-card wide:h-[200px]" />
                </a>
              );
            })}
          </div>
        </KitSection>
      </section>

      {/* ── 6 · LA MÉTHODE ───────────────────────────────────────────────────── */}
      <KitSection className="grid items-start gap-8 pt-14 wide:grid-cols-2 wide:pt-24">
        <div>
          <Eyebrow>{t('method.eyebrow')}</Eyebrow>
          <KitH2 className="mb-4 mt-3 wide:mb-5 wide:mt-[14px]" size="clamp(38px, 5vw, 60px)">
            <Lines lines={t('method.titleLines', { returnObjects: true }) as string[]} />
          </KitH2>
          <div className="mm-acc">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="mm-acc__item" open={n === 3}>
                <summary>
                  <span className="mm-acc__n">{String(n).padStart(2, '0')}</span>
                  {t(`method.s${n}Title`)}
                  <span className="mm-acc__plus" aria-hidden="true">
                    <Icon name="plus" size={14} />
                  </span>
                </summary>
                <div className="mm-acc__body">{t(`method.s${n}Body`)}</div>
              </details>
            ))}
          </div>
        </div>
        <Photo tone="club" className="hidden h-[520px] wide:block" />
      </KitSection>

      {/* ── 7 · LES VIDÉOS (lues en base ; absentes sans contenu) ─────────────── */}
      {ordered.length > 0 && (
        <section className="relative z-[3] pt-14 wide:pt-24">
          <KitSection as="div" className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow tone="informe">{t('videos.eyebrow')}</Eyebrow>
              <KitH2 className="mt-3 wide:mt-[14px]" size="clamp(38px, 5vw, 64px)">{t('videos.title')}</KitH2>
            </div>
            <p className="m-0 hidden max-w-[40ch] text-ink-2 stack:block">{t('videos.lede')}</p>
          </KitSection>
          <div className="flex gap-3 overflow-x-auto px-[18px] pb-2 pt-4 wide:items-center wide:justify-center wide:gap-[18px] wide:overflow-hidden wide:px-6 wide:pt-7">
            {ordered.map((v, i) => {
              const dist = Math.abs(i - ordered.indexOf(shownVideos[0]));
              const main = dist === 0;
              const wideCls = main ? 'wide:basis-[420px]' : dist === 1 ? 'wide:basis-[300px] wide:scale-[.94] wide:opacity-80' : 'wide:basis-[240px] wide:scale-[.88] wide:opacity-[.55]';
              return (
                <div key={v.id} className={`mm-video flex-none basis-[250px] ${wideCls}`}>
                  <Photo tone={VIDEO_TONES[i % VIDEO_TONES.length]} img={v.thumbnailUrl ? { src: v.thumbnailUrl, alt: '' } : undefined} />
                  {(main || dist === 1) && (
                    <div className={`mm-video__cap ${main ? '' : 'wide:hidden'}`}>
                      <span>
                        {v.title}
                        {v.duration && <span className="mm-video__weight">{v.duration}</span>}
                      </span>
                      <a className="mm-video__play" href={contentPath('videos', v, language)} aria-label={t('videos.play', { title: v.title })}>
                        <Icon name="play" size={14} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 8 · LES DERNIERS ARTICLES (lus en base) ──────────────────────────── */}
      {articles.length > 0 && (
        <KitSection className="hidden pt-24 stack:block">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow>{t('articles.eyebrow')}</Eyebrow>
              <KitH2 className="mt-[14px]">{t('articles.title')}</KitH2>
            </div>
            <KitButton href={path('/blog')} tone="quiet" size="sm" arrow>{t('articles.all')}</KitButton>
          </div>
          <div className="grid grid-cols-2 gap-4 wide:grid-cols-4">
            {articles.map((p, i) => {
              const accent = i === 0;
              return (
                <a
                  key={p.id}
                  href={contentPath('blog', p, language)}
                  className={[
                    'flex min-h-[420px] flex-col gap-[10px] rounded-xl p-[18px] no-underline',
                    accent ? 'bg-[color:var(--mm-violet)] text-[color:var(--paper-fixed)]' : 'border border-solid border-[color:var(--line)] bg-bento text-ink',
                  ].join(' ')}
                >
                  {p.publishedAt && (
                    <span className={accent ? 'mm-tag self-start bg-[color:rgb(255_255_255/.18)] text-[color:var(--paper-fixed)]' : 'mm-tag self-start'}>{fmt(p.publishedAt)}</span>
                  )}
                  <b className="font-display text-[26px] font-black leading-[1.02]">{p.title}</b>
                  {p.excerpt && <span className={accent ? 'line-clamp-3 text-[13.5px] opacity-[.88]' : 'line-clamp-3 text-[13.5px] text-ink-2'}>{p.excerpt}</span>}
                  <Photo
                    tone={ARTICLE_TONES[i % ARTICLE_TONES.length]}
                    className="mt-auto h-[190px] !min-h-0 !rounded-card"
                    img={p.coverImage ? { src: p.coverImage, alt: '' } : undefined}
                  />
                </a>
              );
            })}
          </div>
        </KitSection>
      )}

      {/* ── 9 · L'APPEL FINAL ────────────────────────────────────────────────── */}
      <KitSection className="pt-14 wide:pt-24">
        <div className="dk relative isolate flex min-h-[380px] items-end overflow-hidden rounded-xl wide:min-h-[460px]">
          <Photo tone="edu" className="!absolute inset-0 !rounded-none" />
          <span aria-hidden="true" className="absolute inset-0 hidden wide:block" style={{ background: 'linear-gradient(90deg,rgba(10,13,17,.8),rgba(10,13,17,0) 70%)' }} />
          <span aria-hidden="true" className="absolute inset-0 wide:hidden" style={{ background: 'linear-gradient(0deg,rgba(10,13,17,.85),rgba(10,13,17,0) 70%)' }} />
          <div className="relative z-[1] p-[22px] wide:p-11">
            <KitH2 className="mb-4 text-ink wide:mb-6 wide:leading-[.9]" size="clamp(38px, 6vw, 84px)">
              <Lines accent="aplat" lines={t('cta.titleLines', { returnObjects: true }) as string[]} />
            </KitH2>
            <KitButton href={path('/contact?rdv=1')} tone="highlight" arrow>{t('cta.button')}</KitButton>
          </div>
        </div>
      </KitSection>
    </DsNavHost>
  );
}
