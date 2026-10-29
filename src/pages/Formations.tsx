import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState, Icon, Num, Skeleton } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { PriceApprox, PriceFootnote } from '../components/shared/PriceApprox';
import { getPublishedFormations } from '../lib/firestore';
import { estAVenir, ouverture } from '../types/formationRelease';
import { queryKeys } from '../lib/queryClient';
import EduCover from '../components/edu/g2/EduCover';
import FloatingCovers from '../components/edu/g2/FloatingCovers';
import TeamQuoteCard from '../components/edu/g2/TeamQuoteCard';
import EduPreFooter from '../components/edu/g2/EduPreFooter';
import { CLUB_MEMBER_FORMATION_DISCOUNT } from '../lib/club/pricing';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /formations — LE CATALOGUE, au gabarit de la maquette `Edu-Catalogue` (passe 2, lot B).
 *
 * Ordre de la maquette : héros de nuit (script « Le catalogue », titre en capitales,
 * couvertures flottantes), onglets de catégories + puces de niveau, grille de cartes
 * `mm-prod`, carte bleue « Former toute ton équipe ? », puis le bas de page éditorial
 * (lettre, « Ce qui guide chaque formation », bande orange) au-dessus du pied du châssis.
 *
 * CE QUI NE VIENT PAS DE LA MAQUETTE, ET POURQUOI
 *  · Les titres, prix, niveaux et comptes de leçons sont ceux de la BASE. La maquette écrit
 *    un catalogue d'exemple (six titres, « [PRIX] F », « ouvre le [DATE] ») : aucun n'est
 *    repris. Les onglets sont les catégories réelles ; le compte « Toutes · N » dérive de la
 *    liste. Sur une annonce (« Bientôt »), on compte les modules, jamais « 0 leçon ».
 *  · La pastille « 3 leçons libres » est le nombre COMPTÉ de leçons `isFree` ; sans leçon
 *    libre, pas de pastille.
 *  · Le marque-page (`mm-bm`) de la maquette n'est pas posé : aucune liste d'envies n'existe
 *    côté serveur, et un bouton qui ne retient rien est une promesse creuse.
 *  · Sous chaque prix, la contrevaleur EUR/USD (`PriceApprox`), et la note de change en pied.
 *  · Aucune note, aucun nombre d'inscrits (interdits de preuve sociale — champs `students`
 *    et `rating` restés en base, jamais affichés).
 *  · « Membre du Club : −20 % » : c'est la constante du serveur
 *    (`worker/apps/api/src/lib/bictorys.ts`, `CLUB_MEMBER_FORMATION_DISCOUNT = 0.2`), appliquée
 *    par `resolveCheckoutTotal`. Son miroir côté app est UNIQUE : `lib/club/pricing.ts`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
const LEVELS = ['debutant', 'intermediaire', 'avance'] as const;
type Level = (typeof LEVELS)[number];
/** `CLUB_MEMBER_FORMATION_DISCOUNT` (miroir unique du Worker), en pourcentage. */
const CLUB_PCT = Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100);

export default function Formations() {
  const { t } = useTranslation('formations');
  const path = useLocalizedPath();
  const [level, setLevel] = useState<Level | ''>('');
  const [category, setCategory] = useState('');

  const { data: formations = [], isLoading } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });

  const levelLabel: Record<Level, string> = {
    debutant: t('index.levelBeginner'),
    intermediaire: t('index.levelIntermediate'),
    avance: t('index.levelAdvanced'),
  };

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
        /* Ce qui est ouvert passe devant ; le plus récent d'abord à l'intérieur de chaque groupe. */
        .sort((a, b) => {
          const rang = Number(estAVenir(a)) - Number(estAVenir(b));
          if (rang !== 0) return rang;
          return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
        }),
    [formations, level, category],
  );

  const vide = !isLoading && formations.length === 0;
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

      {/* ── LE HÉROS DE NUIT ─────────────────────────────────────────────────── */}
      <section
        className="dk relative isolate overflow-hidden px-6"
        style={{ background: 'var(--night)', borderRadius: '0 0 36px 36px', paddingTop: 'calc(var(--header-h) + 40px)' }}
      >
        <div className="mm-mesh m-edu" style={{ opacity: 0.55 }}><b /><b /><b /></div>
        <div className="relative z-[2] mx-auto flex max-w-[1360px] items-end justify-between gap-[30px] pb-14">
          <div>
            <span className="mm-script text-[26px] wide:text-[32px]">{t('v3.catalog.script')}</span>
            <h1 className="mm-up m-0 mb-[18px] mt-1.5 text-[color:var(--paper-fixed)]" style={{ fontSize: 'clamp(40px, 10.5vw, 104px)' }}>
              {t('v3.catalog.title1')}<br />{t('v3.catalog.title2')}
            </h1>
            <p className="m-0 max-w-[46ch] text-[17px] text-[color:color-mix(in_srgb,var(--paper-fixed)_80%,transparent)]">
              {t('v3.catalog.lede')}
            </p>
          </div>
          <FloatingCovers className="hidden wide:block" />
        </div>
      </section>

      {/* ── FILTRES + GRILLE ─────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[1360px] px-4 pt-8 stack:px-6 wide:pt-14">
          {isLoading ? (
            <div className="grid gap-[18px] stack:grid-cols-2 wide:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} height={420} radius="var(--r-xl)" />)}
            </div>
          ) : vide ? (
            <div className="mm-card">
              <EmptyState
                glyph={<Icon name="book" size={26} color="var(--mm-bleu)" />}
                glyphBackground="color-mix(in srgb, var(--mm-bleu) 14%, transparent)"
                title={t('index.emptyTitle')}
                body={t('index.emptyBody')}
                action={<Link className="mm-pill" to={path('/inscription')}>{t('index.emptyCta')}</Link>}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="mm-tabs max-w-full overflow-x-auto" role="group" aria-label={t('index.categoriesLabel')}>
                  <button type="button" aria-pressed={!category} onClick={() => setCategory('')}>
                    {`${t('index.filterAll')} · ${formations.length}`}
                  </button>
                  {categories.map((c) => (
                    <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
                  ))}
                </div>
                <div className="hidden items-center gap-2 stack:flex">
                  <span className="hidden text-[13px] text-ink-2 stack:inline">{t('index.statLevel')}</span>
                  <div className="mm-chips" role="group" aria-label={t('index.levelLabel')}>
                    <button type="button" className="mm-chip" aria-pressed={!level} onClick={() => setLevel('')}>{t('v3.catalog.levelAll')}</button>
                    {LEVELS.map((l) => (
                      <button key={l} type="button" className="mm-chip" aria-pressed={level === l} onClick={() => setLevel(l)}>
                        {levelLabel[l]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-[26px] grid gap-[18px] stack:grid-cols-2 wide:grid-cols-3">
                {listed.map((formation) => {
                  const aVenir = estAVenir(formation);
                  const quand = ouverture(formation);
                  const modules = formation.modules ?? [];
                  const lessons = modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
                  const free = modules.reduce((n, m) => n + (m.lessons ?? []).filter((l) => l.isFree).length, 0);
                  const price = formation.promoPrice ?? formation.price;
                  const href = path(`/formations/${formation.slug}`);
                  return (
                    <article key={formation.id} className="mm-prod">
                      {/* Le titre ne s'écrit qu'UNE fois par carte (audit 29/10/2026, #3) : la
                          couverture porte la catégorie, le <h2> porte le titre. */}
                      <EduCover
                        title={formation.category || formation.title}
                        category={formation.category}
                        slug={formation.slug}
                        id={formation.id}
                        kicker={t('sheet.coverKicker')}
                        tag={aVenir
                          ? (quand?.kind === 'label' ? quand.value : t('comingSoon.tag'))
                          : free > 0 ? t('index.cardFree', { count: free }) : undefined}
                        style={{ height: '230px' }}
                      />
                      <div className="px-2 pt-1">
                        <h2 className="m-0 block text-[18px] font-bold leading-[1.2] text-ink">{formation.title}</h2>
                        <p className="m-0 line-clamp-2 text-[13.5px] text-ink-2">{formation.description}</p>
                      </div>
                      <div className="mm-prod__stats">
                        <div><b>{levelLabel[formation.level]}</b><span>{t('index.statLevel')}</span></div>
                        <div>
                          <b><Num value={aVenir ? modules.length : lessons} source="db" asOf={asOf} showAsOf={false} /></b>
                          <span>{aVenir ? t('index.statModules') : t('index.statLessons')}</span>
                        </div>
                        <div>
                          {/* Une annonce n'est pas achetable : son prix se dit « prévu », pas « une fois ». */}
                          <b className={aVenir ? 'text-ink-2' : undefined}><Num value={price} source="db" asOf={asOf} unit="F" showAsOf={false} /></b>
                          <span>{aVenir ? t('v3.catalog.plannedPrice') : t('v3.catalog.once')}</span>
                        </div>
                      </div>
                      <div className="px-2 text-[13px] text-ink-2"><PriceApprox xof={price} /></div>
                      <div className="mm-prod__cta">
                        {/* ÉTAT « INDISPONIBLE » : contour neutre, jamais l'orange plein du CTA
                            d'achat. Il mène à la fiche, où se trouve la liste d'attente. */}
                        <Link
                          className={aVenir
                            ? 'mm-pill is-sm is-plain border border-[color:var(--quiet-brd)] !bg-transparent !text-ink-2 shadow-none'
                            : 'mm-pill is-sm'}
                          to={href}
                          style={{ flex: 1, justifyContent: aVenir ? 'center' : 'space-between' }}
                        >
                          {aVenir && <Icon name="clock" size={15} />}
                          {aVenir ? t('comingSoon.cardCta') : t('index.seeCourse')}
                          {!aVenir && <i aria-hidden="true"><Icon name="arrow-up-right" size={15} /></i>}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
              {listed.length === 0 && <p className="mt-6 text-ink-2">{t('states.empty')}</p>}
              <p className="m-0 mt-4 text-[13px] text-ink-2">{t('v3.catalog.clubNote', { pct: CLUB_PCT })}</p>
              <PriceFootnote className="m-0 mt-1 !text-[13px]" />
            </>
          )}
        </div>
      </section>

      {/* ── FORMATION D'ÉQUIPE ──────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[1360px] px-4 pb-[200px] pt-16 stack:px-6 wide:pt-20">
          <div className="rounded-xl p-6 stack:p-10" style={{ background: 'var(--mm-bleu-c)', color: 'var(--ink-fixed)' }}>
            <TeamQuoteCard />
          </div>
        </div>
      </section>

      <EduPreFooter source="formations" />
    </DsNavHost>
  );
}
