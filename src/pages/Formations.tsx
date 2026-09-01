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
        <SiteEyebrow>{t('index.eyebrow')}</SiteEyebrow>
        <SiteDisplay
          lines={[t('index.countLine', { count: formations.length }), t('index.lifetimeLine')]}
          size={52}
          from={1}
        />
        <p className="rv mt-[14px] max-w-[56ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
          {t('index.lede')}
        </p>

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
                        note={t('index.lifetime')}
                      />
                      <Button tone="primary" size="sm" fullWidth={false}>{t('index.see')}</Button>
                    </div>
                  </TerritoryCard>
                </div>
              ))}
            </div>
          </>
        )}
      </PageSite>

      <SiteBand>
        {/* Gouttière 34, pas 36 — `PagesFormations.js:36`. */}
        <div className="grid items-center gap-[34px] wide:grid-cols-2">
          <div>
            <SiteDisplay as="h2" lines={t('index.whyTitle', { returnObjects: true }) as string[]} size={34} />
            <p className="rv mt-3 max-w-[44ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
              {t('index.whyBody')}
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
