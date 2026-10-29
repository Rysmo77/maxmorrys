import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, CheckLine, EmptyState, Icon, Num, Skeleton, TerritoryCard } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import BusinessSection from '../components/formations/BusinessSection';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { PriceApprox, PriceFootnote } from '../components/shared/PriceApprox';
import { getPublishedFormations } from '../lib/firestore';
import { estAVenir, ouverture } from '../types/formationRelease';
import { queryKeys } from '../lib/queryClient';
import CourseCover from '../components/formations/CourseCover';

import Bento from '../components/formations/Bento';
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /formations — LE CATALOGUE, dans ses deux états.
 *
 * Le kit dessine DEUX écrans — `Catalogue` (vide) et `CataloguePlein` — mais c'est un seul
 * écran produit à deux états. Ils ne se portent pas en deux pages : la branche est ici.
 *
 * ⚠️ L'ÉTAT VIDE EST L'ÉTAT RÉEL. Au relevé du 30 août 2026, la base contient deux formations
 * et AUCUNE publiée : un visiteur qui arrive ici ne peut rien acheter. Le système en fait une
 * règle de conception plutôt qu'un accident — « un écran vide est une invitation à agir, pas
 * une excuse » — et il interdit d'y promettre un e-mail que le produit ne sait pas envoyer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A DISPARU DE CETTE PAGE, ET POURQUOI
 *
 * Le type `Formation` porte `students` et `rating`. La page les affichait : nombre d'inscrits
 * par compétence, tri par popularité, note en étoiles, et un carrousel de témoignages statique
 * lu depuis `src/data/testimonials.ts`.
 *
 * Ce sont QUATRE des six interdits absolus du système. Ils ne sont pas retirés par goût : ces
 * chiffres se vérifient en trente secondes contre une base qui compte 5 comptes et 2
 * inscriptions à 0 % de progression. Les champs restent en base — ils servent au tri interne
 * et à l'administration — ils ne s'affichent plus.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const LEVELS = ['debutant', 'intermediaire', 'avance'] as const;
type Level = (typeof LEVELS)[number];

export default function Formations() {
  const { t } = useTranslation('formations');
  const path = useLocalizedPath();
  const [level, setLevel] = useState<Level | ''>('');
  const [category, setCategory] = useState('');

  const { data: formations = [], isLoading } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });

  /*
   * Les trois articles proposés à la place du vide. Trois précautions :
   *
   *  · `enabled` — la lecture ne part QUE si le catalogue est mesuré vide. Une page qui
   *    liste des formations ne paie pas une requête blog qu'elle n'affichera pas ; le
   *    forfait est compté, ici.
   *  · `queryKeys.homeRecentPosts` — la MÊME clé que l'accueil, et la même limite de 5.
   *    Quelqu'un qui arrive par le premier bouton de l'accueil a déjà cette liste en
   *    cache : la page vide ne coûte alors aucune lecture de plus.
   *  · import dynamique — `lib/firestore/blog` n'entre pas dans le graphe de la page pour
   *    une branche qui ne s'ouvrira plus le jour de la publication.
   */
  const { data: posts = [] } = useQuery({
    queryKey: queryKeys.homeRecentPosts,
    queryFn: async () => (await import('../lib/firestore/blog')).getPublishedPosts(5),
    enabled: !isLoading && formations.length === 0,
  });

  const levelLabel: Record<Level, string> = {
    debutant: t('index.levelBeginner'),
    intermediaire: t('index.levelIntermediate'),
    avance: t('index.levelAdvanced'),
  };

  /* Les compteurs de filtre dérivent de la liste. Ce n'est pas un compteur libre. */
  const chips = useMemo(() => {
    const counts = LEVELS.map((l) => [l, formations.filter((f) => f.level === l).length] as const)
      .filter(([, n]) => n > 0);
    return [
      { id: '' as Level | '', label: `${t('index.filterAll')} · ${formations.length}` },
      ...counts.map(([l, n]) => ({ id: l as Level | '', label: `${levelLabel[l]} · ${n}` })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formations, t]);

  /* Les catégories sont celles des formations réelles, dans l'ordre où elles paraissent. */
  const categories = useMemo(
    () => [...new Set(formations.map((f) => f.category).filter(Boolean))],
    [formations],
  );

  const listed = useMemo(
    () =>
      formations
        .filter((f) => !level || f.level === level)
        .filter((f) => !category || f.category === category)
        /*
         * CE QUI EST OUVERT PASSE DEVANT. Le tri par date placerait les annonces en tête —
         * elles sont les plus récentes par construction — et la première chose que verrait
         * un visiteur serait ce qu'il ne peut pas acheter. Le tri par date reste, mais à
         * l'intérieur de chaque groupe.
         */
        .sort((a, b) => {
          const rang = Number(estAVenir(a)) - Number(estAVenir(b));
          if (rang !== 0) return rang;
          return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
        }),
    [formations, level, category],
  );

  /**
   * Le catalogue est-il vide, MESURÉ ? Pendant le chargement, `formations` vaut `[]` sans
   * que rien n'ait encore été lu : `isLoading` exclut ce cas, sinon toute la page passerait
   * une fraction de seconde dans sa version « avant ouverture » avant de se réécrire.
   *
   * C'est la même distinction que celle du titre juste au-dessus — « je ne sais pas encore »
   * n'est pas « il n'y en a pas ».
   */
  const vide = !isLoading && formations.length === 0;

  /*
   * ⚠️ UN CATALOGUE QUI N'A QUE DES ANNONCES N'EST PAS VIDE, ET N'EST PAS OUVERT NON PLUS.
   *
   * C'est le troisième état, et il n'existait pas : la page ne connaissait que « rien » et
   * « tout ». Sans lui, un catalogue entièrement en « bientôt » aurait affiché la bande de
   * bas de page au présent — « une fois payée, l'accès est à vie » — au-dessus de fiches dont
   * aucune ne peut être payée.
   */
  const riencOuvert = !isLoading && formations.length > 0 && formations.every(estAVenir);

  /* Le prix vient de la base, et le PROMOTIONNEL PRIME — dans l'affichage comme au débit. */
  const asOf = new Date();

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      {listed.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          url: `${SITE_URL}/formations`,
          numberOfItems: listed.length,
          itemListElement: listed.slice(0, 10).map((f, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: {
              '@type': 'Course', name: f.title, description: f.description,
              url: `${SITE_URL}/formations/${f.slug}`,
              provider: { '@type': 'Organization', name: SITE_NAME },
            },
          })),
        }} />
      )}

      {/*
        ── LE HÉROS D'EDU (kit v3 `EduHero`) ────────────────────────────────────────────
        Bande sombre (portée `.dk` locale, jamais une prop de thème), ligne en italique
        orange, titre en capitales. Les crochets de `lifetimeLine` restent PORTEURS (AD-23) :
        le titre passe toujours par `SiteDisplay arc`, seule sa casse change.

        ⚠️ LE TITRE N'ANNONCE PAS « 0 » TANT QUE LA BASE N'A PAS RÉPONDU : pendant le
        chargement, la première ligne ne porte aucun compte (règle 6 — un zéro de chargement
        n'est pas une valeur).

        Les couvertures flottantes sont celles des VRAIES formations (trois au plus) : sans
        formation, la colonne disparaît plutôt que de montrer des titres d'exemple.
      */}
      <section className="dk relative overflow-hidden bg-night text-[color:var(--text-body)]">
        <PageSite style={{ paddingBottom: '64px' }}>
          <div className="grid items-center gap-8 wide:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
            <div className="mm-arc-host">
              <span className="mm-script block text-[22px]">{t('index.eyebrow')}</span>
              <SiteDisplay
                arc
                lines={[
                  isLoading ? t('index.loadingLine') : t('index.countLine', { count: formations.length }),
                  t('index.lifetimeLine'),
                ]}
                size={64}
                from={1}
                style={{ textTransform: 'uppercase', letterSpacing: '-.045em', lineHeight: 0.88, marginTop: '10px' }}
              />
              <p className="rv mt-[18px] max-w-[52ch] text-lede leading-[1.5] text-ink-2" style={{ ['--i' as string]: 4 }}>
                {t('index.lede')}
              </p>
            </div>
            {listed.length > 0 && (
              <div aria-hidden="true" className="relative hidden h-[300px] wide:block">
                {listed.slice(0, 3).map((f, i) => (
                  <CourseCover
                    key={f.id}
                    title={f.title}
                    category={f.category}
                    slug={f.slug}
                    id={f.id}
                    kicker={f.category}
                    size="sm"
                    className="mm-floaty w-[210px]"
                    style={{
                      top: `${[10, 70, 150][i]}px`,
                      left: `${[4, 38, 14][i]}%`,
                      ['--r' as string]: `${[-6, 5, -2][i]}deg`,
                      animationDelay: `${i * -2}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </PageSite>
      </section>

      <PageSite>
        {isLoading ? (
          <div className="grid gap-4 stack:grid-cols-2 wide:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} height={380} radius="var(--r-xl)" />)}
          </div>
        ) : formations.length === 0 ? (
          /*
            L'ÉTAT VIDE. Il dit ce qui manque, propose la seule action utile, et nomme la
            contrainte plutôt que de promettre un e-mail qui ne partira pas.
          */
          <div>
            <div className="mm-card">
              <EmptyState
                glyph={<Icon name="book" size={26} color="var(--mm-bleu)" />}
                glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
                title={t('index.emptyTitle')}
                body={t('index.emptyBody')}
                action={
                  <Button href={path('/inscription')} tone="primary">{t('index.emptyCta')}</Button>
                }
              />
            </div>
            <p className="mt-4 text-center text-small leading-[1.5] text-ink-2">{t('index.emptyNote')}</p>

            {/*
              CE QUI EXISTE, PROPOSÉ LÀ OÙ IL N'Y A RIEN : trois articles réels du blog, et
              le bloc disparaît si la lecture ne rend rien.
            */}
            {posts.length > 0 && (
              <div className="mt-10">
                <SiteEyebrow>{t('index.emptyReadTitle')}</SiteEyebrow>
                <div className="mt-3 grid gap-4 stack:grid-cols-3">
                  {posts.slice(0, 3).map((post, i) => (
                    <div key={post.id} className="rv" style={{ ['--i' as string]: 6 + i }}>
                      <TerritoryCard
                        layout="plain"
                        territory="informe"
                        href={path(`/blog/${post.slug}`)}
                        padding={20}
                        meta={post.category}
                        title={post.title}
                        titleSize={17}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Filtres : catégories (onglets du kit) puis niveau (puces). Les compteurs
                dérivent de la liste — ce ne sont pas des compteurs libres. */}
            <div className="rv flex flex-wrap items-center justify-between gap-4" style={{ ['--i' as string]: 5 }}>
              {categories.length > 1 ? (
                <div className="mm-tabs max-w-full overflow-x-auto" role="group" aria-label={t('index.categoriesLabel')}>
                  <button type="button" aria-pressed={!category} onClick={() => setCategory('')}>
                    {`${t('index.filterAll')} · ${formations.length}`}
                  </button>
                  {categories.map((c) => (
                    <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              ) : <span />}
              <div className="mm-chips" role="group" aria-label={t('index.levelLabel')}>
                {chips.map((chip) => (
                  <button
                    key={chip.id || 'all'}
                    type="button"
                    className="mm-chip"
                    aria-pressed={level === chip.id}
                    onClick={() => setLevel(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 text-small text-ink-2">{t('index.sortNote')}</p>

            {/*
              ── LE TROISIÈME ÉTAT ────────────────────────────────────────────────────────
              Le catalogue n'est pas vide, et il n'est pas ouvert : le dire une fois en haut
              vaut mieux que de le faire deviner carte par carte.
            */}
            {riencOuvert && (
              <div className="mm-card mt-5">
                <p className="m-0 font-display text-[18px] font-black leading-tight tracking-[-.03em] text-ink">
                  {t('comingSoon.catalogTitle')}
                </p>
                <p className="m-0 mt-2 max-w-[62ch] text-[14.5px] leading-[1.55] text-ink-2">
                  {t('comingSoon.catalogBody')}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-5 stack:grid-cols-2 wide:grid-cols-3">
              {listed.map((formation, i) => {
                const aVenir = estAVenir(formation);
                const quand = ouverture(formation);
                const lessons = (formation.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
                const free = (formation.modules ?? []).reduce(
                  (n, m) => n + (m.lessons ?? []).filter((l) => l.isFree).length, 0);
                const href = path(`/formations/${formation.slug}`);
                const price = formation.promoPrice ?? formation.price;
                return (
                  <article key={formation.id} className="mm-prod rv" style={{ ['--i' as string]: 6 + i }}>
                    <CourseCover
                      title={formation.title}
                      category={formation.category}
                      slug={formation.slug}
                      id={formation.id}
                      coverImage={formation.coverImage}
                      kicker={formation.category}
                      transitionName={`course-${formation.slug}`}
                      /* Sur une annonce : « Bientôt » ou sa formulation libre. Sinon le
                         nombre RÉEL de leçons libres — et rien s'il n'y en a aucune. */
                      tag={aVenir
                        ? (quand?.kind === 'label' ? quand.value : t('comingSoon.tag'))
                        : free > 0 ? t('index.cardFree', { count: free }) : undefined}
                    />
                    <div className="px-2">
                      <h2 className="m-0 font-sans text-[17px] font-bold leading-[1.25] text-ink">{formation.title}</h2>
                      <p className="m-0 mt-[6px] line-clamp-3 text-[14px] leading-[1.5] text-ink-2">{formation.description}</p>
                    </div>
                    {/* ⚠️ PAS DE COMPTE DE LEÇONS SUR UNE ANNONCE (elles sont retirées à la
                        lecture : « 0 leçon » mentirait) — on dit les modules. */}
                    <div className="mm-prod__stats">
                      <div><b>{levelLabel[formation.level]}</b><span>{t('index.statLevel')}</span></div>
                      <div>
                        <b><Num value={aVenir ? (formation.modules?.length ?? 0) : lessons} source="db" asOf={asOf} /></b>
                        <span>{aVenir ? t('index.statModules') : t('index.statLessons')}</span>
                      </div>
                      <div>
                        <b>
                          <Num value={price} source="db" asOf={asOf} unit="F" />
                          {formation.promoPrice ? (
                            <s className="ml-1 text-ink-3">
                              <Num value={formation.price} source="db" asOf={asOf} />
                            </s>
                          ) : null}
                        </b>
                        <span>{t('index.lifetime')}</span>
                      </div>
                    </div>
                    <div className="px-2 text-small text-ink-2"><PriceApprox xof={price} /></div>
                    <div className="mm-prod__cta">
                      <Link className={aVenir ? 'mm-pill is-sm is-plain' : 'mm-pill is-sm'} to={href}>
                        {aVenir ? t('comingSoon.cardCta') : t('index.seeCourse')}
                        {!aVenir && <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
            {listed.length === 0 && <p className="mt-6 text-ink-2">{t('states.empty')}</p>}
            <PriceFootnote className="mt-5" />
          </>
        )}
      </PageSite>

      <SiteBand>
        {/* Gouttière 34, pas 36 — `PagesFormations.js:36`. */}
        <div className="grid items-center gap-[34px] wide:grid-cols-2">
          <div>
            {/*
              ⚠️ CETTE BANDE DISAIT « DEUX » PENDANT QUE L'ÉTAT VIDE DISAIT « AUCUNE ».

              Elle était écrite pour le catalogue plein et rendue dans les DEUX états :
              « Pourquoi il n'y a que deux titres » et « le module d'ouverture de chacune est
              en accès libre » s'affichaient à quatre cents pixels sous « Aucune formation
              n'est encore en ligne ». Sur la page qui vient d'invoquer l'honnêteté comme
              argument — « je préfère te le dire que te faire cliquer dans le vide » —, la
              section suivante décrivait un catalogue absent. On n'en conclut pas qu'il y a
              un bug : on en conclut que ces textes sont du décor.

              La bande ne disparaît pas, parce que c'est elle qui porte l'argument éditorial,
              et il vaut avant l'ouverture autant qu'après. Elle passe au FUTUR, ce qui la
              rend vraie dans l'état où elle est lue aujourd'hui.

              `vide` est mesuré, pas supposé : pendant le chargement `isLoading` est vrai et
              la branche pleine reste servie — on ne réécrit pas une section sur une lecture
              qui n'a pas abouti.

              ⚠️ ET LE MÊME RAISONNEMENT VAUT POUR UN CATALOGUE QUI N'A QUE DES ANNONCES.
              « Le module d'ouverture de chacune EST en accès libre » y serait faux au présent :
              aucune leçon n'est ouverte tant qu'aucune formation ne l'est. Le futur, lui, est
              exact dans les deux cas — c'est pourquoi la condition porte sur les deux états et
              non sur le seul vide.
            */}
            <SiteDisplay
              as="h2"
              lines={t(vide || riencOuvert ? 'index.whyTitleEmpty' : 'index.whyTitle', { returnObjects: true }) as string[]}
              size={34}
            />
            <p className="rv mt-3 max-w-[44ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
              {t(vide || riencOuvert ? 'index.whyBodyEmpty' : 'index.whyBody')}
            </p>
          </div>
          <Bento padding={24} className="rv" style={{ ['--i' as string]: 2 }}>
            {/* Le sourcil manquait : quatre lignes à coche nues, sans ce qui les qualifie.
                Le kit ouvre ce panneau par « Ce que comprend chaque formation »
                (`pages-formations.jsx`), et c'est cette ligne qui dit de quoi la liste parle. */}
            <SiteEyebrow style={{ margin: 0 }}>{t('index.includesTitle')}</SiteEyebrow>
            <div className="mt-3">
              {/* Même raison que le titre de la bande, deux blocs plus haut : « le module
                  d'ouverture EST gratuit » est faux au présent tant qu'aucune formation n'est
                  ouverte. Les trois autres lignes décrivent le produit et restent vraies. */}
              {(['c1', 'c2', 'c3', 'c4'] as const).map((key) => (
                <CheckLine key={key} tone="ok">
                  {key === 'c2' && (vide || riencOuvert) ? t('comingSoon.freeLater') : t(`index.${key}`)}
                </CheckLine>
              ))}
            </div>
          </Bento>
        </div>
      </SiteBand>

      {/*
        ── L'OFFRE ENTREPRISES — UN `PageSite`, ET SURTOUT PAS UNE SECONDE BANDE ──────────
        `Agence.tsx` le dit mot pour mot : « deux bandes collées partagent le même
        `--surface-band` : elles fondraient en un seul aplat ». Le `paddingTop` reprend
        l'écart de section, comme là-bas.

        ELLE EST APRÈS LA BANDE EXPLICATIVE, ET PAS AVANT. Dans l'état vide, la séquence
        devient « rien à acheter aujourd'hui → voilà pourquoi → et voilà ce que je peux faire
        pour ton organisation dès maintenant ». Placée avant, le B2B passerait pour un lot de
        consolation.

        Elle ne dépend NI de `vide` NI de `riencOuvert` : une organisation qui veut former
        vingt personnes ne commande pas un cours au détail, et sa demande se traite qu'il y
        ait un catalogue ouvert ou non. C'est même la seule chose de cette page qui se vende
        pendant que la boutique est fermée.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <BusinessSection />
      </PageSite>
    </DsNavHost>
  );
}
