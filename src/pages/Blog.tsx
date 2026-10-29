import { lazy, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, Skeleton } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { Eyebrow, KitButton, KitH2, KitSection, NightAccent, NightHero, Photo, type PhotoTone } from '../components/site/v3/kit';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { getPublishedPosts } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';
import LogoLoader from '../components/states/LogoLoader';
import { categoryToPole } from '../lib/blogCategories';

const NewsletterForm = lazy(() => import('../components/shared/NewsletterForm'));

/*
 * PRÉCHARGEMENT AU SURVOL. Le texte de l'article est déjà là — la liste ci-dessous porte les
 * documents entiers, et `BlogPost` les relit dans le cache (`findCachedPost`). Ce qui manque
 * encore au clic, c'est le CODE de la page : on le demande dès que le pointeur ou le focus
 * se pose sur une carte. `import()` est dédoublonné par le bundler, l'appel répété ne coûte rien.
 */
const prefetchArticle = () => {
  void import('./BlogPost');
};

/**
 * L'INDEX EN ATTENTE — À LA FORME DE CE QUI ARRIVE (audit du 29/10/2026, registre #5).
 *
 * L'ancien squelette posait une dalle de 400 px puis TROIS cartes de 260 px en grille, alors
 * que la page rend une une (photo 230 → 400 px, texte à côté sur bureau) puis une RANGÉE
 * défilante de cartes de 290 → 420 px : tout sautait à l'arrivée. Mêmes classes de géométrie
 * ici que dans le rendu réel. Le logo animé, posé sur la photo de la une, porte le statut ;
 * les barres sont muettes.
 */
function BlogIndexSkeleton({ label }: { label: string }) {
  return (
    <>
      <KitSection className="pt-11 stack:pt-[72px]">
        <div className="flex flex-col gap-[10px] p-3 stack:grid stack:grid-cols-[1.2fr_1fr] stack:items-center stack:gap-7 stack:p-0">
          <div className="relative h-[230px] stack:h-[400px]">
            <div aria-hidden="true" className="h-full"><Skeleton height="100%" radius="var(--r-l)" /></div>
            <div className="absolute inset-0 grid place-items-center">
              <LogoLoader label={label} />
            </div>
          </div>
          <div aria-hidden="true" className="grid gap-[10px] px-[6px] stack:gap-[14px] stack:px-0">
            <Skeleton width={180} height={11} />
            <div className="h-[24px] w-[90%] stack:h-[50px]"><Skeleton height="100%" /></div>
            <div className="h-[24px] w-[60%] stack:h-[50px]"><Skeleton height="100%" /></div>
            <div className="hidden stack:block"><Skeleton height={16} width="80%" /></div>
          </div>
        </div>
      </KitSection>
      <KitSection className="pt-11 stack:pt-20">
        <div aria-hidden="true">
          <div className="mb-[18px] hidden stack:block"><Skeleton width={320} height={44} /></div>
          <div className="flex gap-3 overflow-hidden pb-[6px] stack:gap-4 stack:pb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-none basis-[290px] flex-col gap-[10px] p-3 stack:basis-[420px]">
                <div className="h-[170px] stack:h-[220px]"><Skeleton height="100%" radius="var(--r-l)" /></div>
                <Skeleton width={140} height={11} />
                <Skeleton height={22} width="85%" />
              </div>
            ))}
          </div>
        </div>
      </KitSection>
    </>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE BLOG — LA MAQUETTE `Site-Blog` (bureau) / `-mobile` (390 px), PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES (porteur, 29/10/2026) : le titre à compte (« N articles »), la recherche
 * en pilule, la grille paginée et le renvoi « écoute ailleurs » cèdent la place à la planche :
 * dalle de nuit avec le sélecteur Articles / Podcast et vidéos, l'article à la une, la rangée
 * « Derniers articles » filtrée par sujet, puis la lettre.
 *
 * Ce qui reste tenu :
 * - tout vient de la base : la une est l'article le plus récent (aucun champ « à la une »
 *   n'existe), les sujets sont ceux des articles publiés, la date et la durée sont celles de
 *   l'article — jamais les « titres d'exemple » ni les `[DATE]`/`[N] min` de la planche ;
 * - un chargement n'est pas un catalogue vide : squelette, puis erreur avec relance, puis
 *   état vide honnête ;
 * - le filtre par sujet (`?pole=`) et par étiquette (`?tag=`, depuis un article) restent dans
 *   l'adresse ;
 * - la lettre est le vrai formulaire (`NewsletterForm`, consentement explicite) ; la
 *   fréquence de la planche (« un article par [fréquence] ») n'existe pas : le titre ne promet
 *   que le prochain article.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const TONES: PhotoTone[] = ['studio', 'club', 'edu', 'informe'];

export default function Blog() {
  const { t } = useTranslation('blog');
  const path = useLocalizedPath();
  const { formatDate } = useFormat();
  const [params, setParams] = useSearchParams();
  const pole = params.get('pole') ?? '';
  const tag = params.get('tag') ?? '';
  const rangee = useRef<HTMLDivElement>(null);

  const setParam = (cle: string, valeur: string) => {
    const suivant = new URLSearchParams(params);
    if (valeur) suivant.set(cle, valeur);
    else suivant.delete(cle);
    setParams(suivant, { replace: true });
  };

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.blogPosts,
    queryFn: () => getPublishedPosts(),
  });

  /* Les sujets RÉELS, du plus fourni au moins fourni. */
  const poles = useMemo(() => {
    const tally = new Map<string, number>();
    for (const post of posts) {
      const key = categoryToPole(post.category);
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([nom]) => nom);
  }, [posts]);

  /* La une ne bouge pas avec le filtre : c'est l'article le plus récent. */
  const [featured, ...others] = posts;
  const rest = useMemo(() => {
    const tagBas = tag.trim().toLowerCase();
    return others.filter((post) => {
      const matchesPole = !pole || categoryToPole(post.category) === pole;
      const matchesTag = !tagBas || (post.tags ?? []).some((x) => x.toLowerCase() === tagBas);
      return matchesPole && matchesTag;
    });
  }, [others, pole, tag]);

  const defiler = (sens: 1 | -1) => {
    const el = rangee.current;
    if (el) el.scrollBy({ left: sens * Math.max(320, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  const meta = (category: string, readTime?: number) =>
    [categoryToPole(category), readTime ? t('post.readTime', { count: readTime }) : ''].filter(Boolean).join(' · ');

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      {posts.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          url: `${SITE_URL}/blog`,
          blogPost: posts.slice(0, 10).map((p) => ({
            '@type': 'BlogPosting', headline: p.title, datePublished: p.publishedAt,
            url: `${SITE_URL}/blog/${p.slug}`,
          })),
        }} />
      )}

      <NightHero mesh="club" className="pb-[30px] stack:pb-16">
        <div className="relative z-[1] mx-auto box-border w-full max-w-[1360px] px-5 pt-9 stack:px-10 stack:pt-[110px]">
          <Eyebrow className="text-[color:var(--mm-violet-c)]">
            <span className="stack:hidden">{t('index.eyebrowShort')}</span>
            <span className="hidden stack:inline">{t('index.eyebrow')}</span>
          </Eyebrow>
          <h1 className="mm-d mb-[14px] mt-[14px] text-[52px] leading-[.9] stack:mb-[22px] stack:mt-5 stack:text-[clamp(56px,7.4vw,112px)] stack:leading-[.88] stack:tracking-[-.05em]">
            {(t('index.titleLines', { returnObjects: true }) as string[]).map((l, i) => (
              <span key={i}>
                {i > 0 && <br className="hidden stack:inline" />}
                {i > 0 && ' '}
                <NightAccent text={l} />
              </span>
            ))}
          </h1>
          <p className="m-0 text-[15.5px] leading-[1.55] text-ink-2 stack:hidden">{t('index.ledeShort')}</p>
          <p className="m-0 mb-[26px] hidden max-w-[52ch] text-[18px] leading-[1.55] text-ink-2 stack:block">{t('index.lede')}</p>
          <nav aria-label={t('index.tabsAria')} className="mm-seg mt-[6px] hidden bg-[color:rgb(255_255_255/.1)] stack:inline-flex">
            <span aria-current="page" className="flex items-center rounded-pill bg-[color:rgb(255_255_255/.9)] px-[13px] text-[12.5px] font-semibold text-[color:var(--ink-fixed)] shadow-soft">
              {t('index.tabArticles')}
            </span>
            <a href={path('/podcast-et-videos')} className="flex items-center px-[13px] text-[12.5px] font-semibold text-ink-2 no-underline">
              {t('index.tabMedia')}
            </a>
          </nav>
        </div>
      </NightHero>

      {isLoading ? (
        <BlogIndexSkeleton label={t('post.loading')} />
      ) : isError ? (
        <KitSection className="pt-11 stack:pt-[72px]">
          <EmptyState
            glyph={<Icon name="alert-circle" size={24} />}
            title={t('index.errorTitle')}
            body={t('states.loadError')}
            action={<KitButton tone="ink" onClick={() => refetch()}>{t('states.retry')}</KitButton>}
          />
        </KitSection>
      ) : !featured ? (
        <KitSection className="pt-11 stack:pt-[72px]">
          <EmptyState glyph={<Icon name="doc" size={24} />} title={t('index.emptyTitle')} body={t('index.empty')} />
        </KitSection>
      ) : (
        <>
          {/* ── À LA UNE ─────────────────────────────────────────────────────── */}
          <KitSection className="pt-11 stack:pt-[72px]">
            <a
              href={path(`/blog/${featured.slug}`)}
              onPointerEnter={prefetchArticle}
              onFocus={prefetchArticle}
              className="mm-bento flex flex-col gap-[10px] !rounded-xl p-3 text-inherit no-underline stack:grid stack:grid-cols-[1.2fr_1fr] stack:items-center stack:gap-7 stack:!rounded-none stack:!border-0 stack:!bg-transparent stack:p-0 stack:!shadow-none"
            >
              <Photo
                tone="informe"
                className="relative h-[230px] !min-h-0 !rounded-card stack:h-[400px] stack:!rounded-media"
                img={featured.coverImage ? { src: featured.coverImage, alt: '', eager: true } : undefined}
              >
                <span className="mm-tag absolute left-3 top-3 bg-[color:var(--paper-fixed)] text-[color:var(--ink-fixed)] stack:hidden">
                  {formatDate(featured.publishedAt)}
                </span>
              </Photo>
              <div className="px-[6px] stack:px-0">
                <Eyebrow className="stack:mt-[14px] stack:block">
                  <span className="stack:hidden">{[t('index.featured'), featured.readTime ? t('post.readTime', { count: featured.readTime }) : ''].filter(Boolean).join(' · ')}</span>
                  <span className="hidden stack:inline">{[t('index.featured'), categoryToPole(featured.category), formatDate(featured.publishedAt)].join(' · ')}</span>
                </Eyebrow>
                <h2 className="mm-d mb-2 mt-[10px] text-[22px] leading-[1.08] stack:mb-[14px] stack:mt-3 stack:text-[52px] stack:leading-[.95]">{featured.title}</h2>
                {featured.excerpt && <p className="m-0 mb-[18px] hidden max-w-[46ch] text-ink-2 stack:block">{featured.excerpt}</p>}
                <span className="mm-btn is-ghost has-arrow hidden stack:inline-flex">
                  {t('index.readArticle')}
                  <span className="mm-btn__arrow" aria-hidden="true"><Icon name="arrow-up-right" size={16} /></span>
                </span>
              </div>
            </a>
          </KitSection>

          {/* ── DERNIERS ARTICLES ────────────────────────────────────────────── */}
          {others.length > 0 && (
            <KitSection className="pt-11 stack:pt-20">
              <div className="mb-[18px] hidden flex-wrap items-center justify-between gap-4 stack:flex">
                <KitH2 className="m-0" size="44px">{t('index.latestTitle')}</KitH2>
                <div className="flex gap-2">
                  <button className="mm-iconbtn" type="button" aria-label={t('index.prev')} onClick={() => defiler(-1)}>
                    <Icon name="chevron-left" size={18} />
                  </button>
                  <button className="mm-iconbtn" type="button" aria-label={t('index.next')} onClick={() => defiler(1)}>
                    <Icon name="chevron-right" size={18} />
                  </button>
                </div>
              </div>
              {poles.length > 1 && (
                <div role="group" aria-label={t('index.filterAria')} className="mm-chips flex-nowrap overflow-x-auto stack:flex-wrap">
                  <button className="mm-chip" type="button" aria-pressed={!pole} onClick={() => setParam('pole', '')}>
                    {t('index.filterAll')}
                  </button>
                  {poles.map((p) => (
                    <button key={p} className="mm-chip" type="button" aria-pressed={pole === p} onClick={() => setParam('pole', p)}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {tag && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="mm-tag">{t('index.tagFilter', { tag })}</span>
                  <KitButton tone="quiet" size="sm" onClick={() => setParam('tag', '')}>{t('index.clearFilter')}</KitButton>
                </div>
              )}
              {rest.length === 0 ? (
                <p className="m-0 mt-[18px] text-ink-2">
                  {t('index.emptyFiltered')}{' '}
                  <button type="button" className="mm-ulink" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                    {t('index.emptyAction')}
                  </button>
                </p>
              ) : (
                <div ref={rangee} className="mt-[14px] flex snap-x snap-mandatory gap-3 overflow-x-auto pb-[6px] stack:mt-[18px] stack:gap-4 stack:pb-2">
                  {rest.map((post, i) => (
                    <a
                      key={post.id}
                      href={path(`/blog/${post.slug}`)}
                      onPointerEnter={prefetchArticle}
                      onFocus={prefetchArticle}
                      className="mm-bento flex flex-none basis-[290px] snap-start flex-col gap-[10px] !rounded-xl p-3 text-inherit no-underline stack:basis-[420px]"
                    >
                      <Photo
                        tone={TONES[i % TONES.length]}
                        className="relative h-[170px] !min-h-0 !rounded-card stack:h-[220px]"
                        img={post.coverImage ? { src: post.coverImage, alt: '' } : undefined}
                      >
                        <span className="mm-tag absolute left-3 top-3 bg-[color:var(--paper-fixed)] text-[color:var(--ink-fixed)]">
                          {formatDate(post.publishedAt)}
                        </span>
                      </Photo>
                      <Eyebrow className="px-[6px]">{meta(post.category, post.readTime)}</Eyebrow>
                      <b className="px-[6px] pb-2 font-display text-[22px] font-black leading-[1.08]">{post.title}</b>
                    </a>
                  ))}
                </div>
              )}
            </KitSection>
          )}
        </>
      )}

      {/* ── LA LETTRE ────────────────────────────────────────────────────────── */}
      <KitSection className="pt-11 stack:pt-24">
        <div className="flex flex-col gap-3 rounded-xl bg-[color:var(--paper-2)] p-5 stack:flex-row stack:flex-wrap stack:items-center stack:justify-between stack:gap-6 stack:p-10">
          <div>
            <span className="hidden stack:block"><Eyebrow>{t('index.newsletterEyebrow')}</Eyebrow></span>
            <KitH2 className="m-0 stack:mt-[10px]" size="clamp(26px, 3vw, 40px)">{t('index.newsletterTitle')}</KitH2>
          </div>
          <div className="w-full stack:w-auto stack:min-w-[420px]">
            <Suspense fallback={null}>
              <NewsletterForm source="blog" />
            </Suspense>
          </div>
        </div>
      </KitSection>
    </DsNavHost>
  );
}
