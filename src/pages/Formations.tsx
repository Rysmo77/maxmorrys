import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, CheckLine, ChipRow, EmptyState, GlassPanel, Icon, PriceBlock, Skeleton, TerritoryCard } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { PriceApprox, PriceFootnote } from '../components/shared/PriceApprox';
import { getPublishedFormations } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';

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
      `${t('index.filterAll')} · ${formations.length}`,
      ...counts.map(([l, n]) => `${levelLabel[l]} · ${n}`),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formations, t]);

  const listed = useMemo(
    () =>
      formations
        .filter((f) => !level || f.level === level)
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')),
    [formations, level],
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

      <PageSite>
        {/*
          LE HÉROS A BESOIN D'UNE FRONTIÈRE, ET IL N'EN AVAIT PAS.

          Sourcil, titre et chapô étaient des enfants DIRECTS de `PageSite`, comme la liste
          qui suit : rien dans le DOM ne disait où le héros s'arrête. Le remplissage de l'arc
          (AD-23) répond au survol du héros — posé sur `PageSite`, il aurait fait de la page
          ENTIÈRE la cible, et le fragment serait resté peint en permanence.

          Ce conteneur est neutre à la mise en page : `PageSite` ne déclare aucun `display`,
          c'est donc un bloc, et trois blocs enveloppés dans un bloc tombent au même endroit.
        */}
        <div className="mm-arc-host">
          <SiteEyebrow>{t('index.eyebrow')}</SiteEyebrow>
          {/*
            ⚠️ LE TITRE N'ANNONCE PAS « 0 » TANT QUE LA BASE N'A PAS RÉPONDU.

            Ici le zéro finit par être VRAI. Mais il était produit par le même mécanisme que
            sur `/blog`, où la base publie 46 articles et où le titre affirmait quand même
            « 0 article » pendant tout le chargement, au-dessus de ses propres squelettes. Un
            zéro juste par accident reste un nombre affiché sans avoir été mesuré, et c'est
            exactement ce que la règle 6 refuse — le zéro DATÉ est une valeur, le zéro d'un
            chargement n'en est pas une.

            Le repli ne porte donc pas de compte, et la seconde ligne ne bouge pas : quand la
            vraie ligne prend sa place, rien ne saute.
          */}
          <SiteDisplay
            arc
            lines={[
              isLoading ? t('index.loadingLine') : t('index.countLine', { count: formations.length }),
              t('index.lifetimeLine'),
            ]}
            size={52}
            from={1}
          />
          <p className="rv mt-[14px] max-w-[56ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
            {t('index.lede')}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-[22px] grid gap-4 stack:grid-cols-2">
            {[0, 1].map((i) => <Skeleton key={i} height={220} radius="var(--r-l)" />)}
          </div>
        ) : formations.length === 0 ? (
          /*
            L'ÉTAT VIDE. Il dit ce qui manque, propose la seule action utile, et nomme la
            contrainte plutôt que de promettre un e-mail qui ne partira pas.
          */
          <div className="mt-[22px]">
            <GlassPanel level="hero" padding={22}>
              <EmptyState
                glyph={<Icon name="book" size={26} color="var(--mm-bleu)" />}
                glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
                title={t('index.emptyTitle')}
                body={t('index.emptyBody')}
                action={
                  <Button href={path('/inscription')} tone="primary">{t('index.emptyCta')}</Button>
                }
              />
            </GlassPanel>
            <p className="mt-4 text-center text-small leading-[1.5] text-ink-2">{t('index.emptyNote')}</p>

            {/*
              ── CE QUI EXISTE, PROPOSÉ LÀ OÙ IL N'Y A RIEN ────────────────────────────────
              L'état vide s'arrêtait ici et laissait environ trois cents pixels de rien avant
              le pied de page. C'est pourtant l'endroit du site où la question « et
              maintenant ? » se pose le plus fort : la personne a suivi le premier appel de
              l'accueil et elle est arrivée dans une pièce vide.

              La seule action offerte était « crée ton compte » — c'est-à-dire un formulaire,
              pour quelqu'un qui venait chercher à LIRE. Le blog paraît chaque semaine et
              publie quarante-six articles : c'est la réponse, et elle est gratuite.

              Trois seulement, et jamais de titre inventé : `posts` sort de la base, et si la
              lecture ne rend rien, tout ce bloc disparaît plutôt que de laisser une grille
              vide sous une invitation à lire.
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
            <div className="rv mt-[26px] flex flex-wrap items-center justify-between gap-4" style={{ ['--i' as string]: 5 }}>
              <div className="min-w-0 max-w-[420px] flex-1">
                <ChipRow
                  label={t('index.eyebrow')}
                  options={chips}
                  value={level ? chips.find((c) => c.startsWith(levelLabel[level])) : chips[0]}
                  onChange={(option) => {
                    const found = LEVELS.find((l) => option.startsWith(levelLabel[l]));
                    setLevel(found ?? '');
                  }}
                />
              </div>
              <span className="text-small text-ink-2">{t('index.sortNote')}</span>
            </div>

            <div className="mt-5 grid gap-4 stack:grid-cols-2">
              {listed.map((formation, i) => (
                <div key={formation.id} className="rv" style={{ ['--i' as string]: 6 + i }}>
                  <TerritoryCard
                    layout="plain"
                    /* Deux titres, deux territoires — le kit alterne pour que la grille ait
                       un rythme sans qu'aucune vignette ne se charge. */
                    territory={i % 2 === 0 ? 'forme' : 'transforme'}
                    href={path(`/formations/${formation.slug}`)}
                    padding={24}
                    /*
                     * LA MÉTA ÉTAIT ABSENTE. Le kit ouvre chaque carte par « SEO · 6 modules ·
                     * 47 leçons · débutant » (`PagesFormations.js:17`) : c'est ce qui permet
                     * de comparer deux formations sans ouvrir les deux fiches, et c'est la
                     * seule ligne de la carte qui donne une taille.
                     *
                     * Les quatre valeurs viennent de la base — catégorie, modules, leçons
                     * recomptées, niveau. Aucune n'est estimée, aucune n'est arrondie.
                     */
                    meta={[
                      formation.category,
                      t('index.cardModules', { count: formation.modules?.length ?? 0 }),
                      t('index.cardLessons', {
                        count: (formation.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0),
                      }),
                      levelLabel[formation.level],
                    ].filter(Boolean).join(' · ')}
                    title={formation.title}
                  >
                    <p className="mt-[10px] mb-0 text-[14px] leading-[1.5]" style={{ color: 'var(--card-ink-2)' }}>
                      {formation.description}
                    </p>
                    <div className="mt-[22px] flex items-end justify-between gap-3">
                      <PriceBlock
                        size={27}
                        amount={{ value: formation.promoPrice ?? formation.price, source: 'db', asOf }}
                        strike={formation.promoPrice ? { value: formation.price, source: 'db', asOf } : undefined}
                        currency="FCFA"
                        approx={<PriceApprox xof={formation.promoPrice ?? formation.price} />}
                        note={t('index.lifetime')}
                      />
                      <Button tone="primary" size="sm" fullWidth={false}>{t('index.see')}</Button>
                    </div>
                  </TerritoryCard>
                </div>
              ))}
            </div>
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
            */}
            <SiteDisplay
              as="h2"
              lines={t(vide ? 'index.whyTitleEmpty' : 'index.whyTitle', { returnObjects: true }) as string[]}
              size={34}
            />
            <p className="rv mt-3 max-w-[44ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
              {t(vide ? 'index.whyBodyEmpty' : 'index.whyBody')}
            </p>
          </div>
          <GlassPanel level="flat" padding={24} className="rv" style={{ ['--i' as string]: 2 }}>
            {/* Le sourcil manquait : quatre lignes à coche nues, sans ce qui les qualifie.
                Le kit ouvre ce panneau par « Ce que comprend chaque formation »
                (`pages-formations.jsx`), et c'est cette ligne qui dit de quoi la liste parle. */}
            <SiteEyebrow style={{ margin: 0 }}>{t('index.includesTitle')}</SiteEyebrow>
            <div className="mt-3">
              {(['c1', 'c2', 'c3', 'c4'] as const).map((key) => (
                <CheckLine key={key} tone="ok">{t(`index.${key}`)}</CheckLine>
              ))}
            </div>
          </GlassPanel>
        </div>
      </SiteBand>
    </DsNavHost>
  );
}
