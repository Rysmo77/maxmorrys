import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Icon, Num, TERRITORY_VERB, TerritoryCard, type IconName } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_URLS } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, TerritoryRow, useTerritoryLayout } from '../components/site';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { getPublishedFormations } from '../lib/firestore/formations';
import { getPublishedPosts } from '../lib/firestore/blog';
import { getPublishedPodcasts } from '../lib/firestore/content';
import { getPublicCounts, type PublicCounts } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ACCUEIL — trois sections, contre dix auparavant.
 *
 * La page faisait 978 lignes : héros vidéo plein écran, manifeste, quatre chiffres de façade,
 * catalogue à onglets, bande agence, quiz de niveau, présence digitale, podcast, blog, offre
 * phare, carrousel de témoignages, lettre d'information, appel final.
 *
 * La maquette en dessine trois. Ce n'est pas une simplification : c'est une hiérarchie. Le
 * premier écran doit répondre à « qu'est-ce que c'est, et est-ce que je peux payer » — le
 * reste appartient aux pages de territoire, où quelqu'un arrive avec une intention.
 *
 * DEUX SECTIONS ONT DISPARU POUR UNE AUTRE RAISON, et elles n'auraient jamais dû exister :
 *
 *   · LE CARROUSEL DE TÉMOIGNAGES, avec ses notes en étoiles. « Interdits absolus, sans
 *     exception : note en étoiles, nombre d'avis, nombre d'élèves, taux de réussite,
 *     témoignage, logo client. » Ce n'est pas une préférence de ton — ces chiffres se
 *     vérifient en trente secondes, et un visiteur qui les prend en défaut ne revient pas.
 *   · LA LETTRE D'INFORMATION. Le produit n'a AUCUN canal d'envoi. Le kit le dit à sa place :
 *     « Je ne te fais pas remplir un champ qui ne sert à rien. »
 *
 * Ce qui les remplace n'est pas un vide : c'est l'encart de vérité, qui NOMME ce qui manque.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Les quatre territoires. L'agence n'y est pas : elle vit hors des quatre verbes. */
const TERRITORIES = [
  { key: 'forme', to: '/formations', glyph: 'book' },
  { key: 'informe', to: '/blog', glyph: 'doc' },
  { key: 'transforme', to: '/podcast-et-videos', glyph: 'play' },
  { key: 'digitalise', to: '/presence-digitale', glyph: 'globe' },
] as const;

const REASONS: { key: 'r1' | 'r2' | 'r3'; glyph: IconName; tint: string; ink: string }[] = [
  { key: 'r1', glyph: 'card', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'r2', glyph: 'globe', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'r3', glyph: 'download', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)' },
];

export default function Home() {
  const { t } = useTranslation('home');
  const path = useLocalizedPath();
  const layout = useTerritoryLayout();
  /*
   * Les six libellés de navigation ne sont pas traduits, ils sont ÉCRITS — l'anglais n'a pas
   * de tutoiement, donc la familiarité y passe par la contraction et le verbe à particule.
   * « I transform you » sonnerait comme une publicité de coach de vie ; « digitize » se dit
   * de documents, pas de commerces. Les quatre valeurs vivent dans le design system, pas
   * dans une table de traduction, précisément pour qu'on ne puisse pas les traduire.
   */
  const { language } = useLanguage();

  const { data: counts } = useQuery<PublicCounts | null>({
    queryKey: queryKeys.publicCounts,
    queryFn: () => getPublicCounts(),
  });
  const { data: posts = [] } = useQuery({
    queryKey: queryKeys.homeRecentPosts,
    queryFn: () => getPublishedPosts(5),
  });
  const { data: podcasts = [] } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const { data: formations = [] } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: () => getPublishedFormations(),
  });

  /*
   * Les chiffres des cartes territoire. Ils viennent de `getPublicCounts()`, qui compte côté
   * serveur — jamais des valeurs du kit, qui se contredisent elles-mêmes : l'accueil du kit
   * annonce « 1 formation », son catalogue « 2 », sa page à propos « 2 », et le readme « 0 ».
   * Les quatre sont en monospace, donc tous présentés comme vérifiés.
   */
  const big: Record<string, number | null> = {
    forme: counts?.publishedFormations ?? null,
    informe: counts?.publishedArticles ?? null,
    transforme: counts ? counts.publishedPodcasts + counts.publishedVideos : null,
    // Les trois packs viennent du catalogue de l'offre, pas de la base : c'est une constante
    // commerciale, pas une mesure. Elle n'a donc pas de date de relevé à porter.
    digitalise: 3,
  };

  /* « Commence gratuitement » — trois vraies entrées, ou rien. */
  const starters = [
    posts[0] && { territory: 'informe' as const, meta: t('free.metaArticle'), title: posts[0].title, to: `/blog/${posts[0].slug}` },
    podcasts[0] && { territory: 'transforme' as const, meta: t('free.metaPodcast'), title: podcasts[0].title, to: `/podcasts/${podcasts[0].slug}` },
    formations[0] && { territory: 'forme' as const, meta: t('free.metaCourse'), title: formations[0].title, to: `/formations/${formations[0].slug}` },
  ].filter(Boolean) as { territory: 'informe' | 'transforme' | 'forme'; meta: string; title: string; to: string }[];

  const asOf = counts?.asOf ?? new Date();

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

      <PageSite>
        {/* ── 1 · Le héros ─────────────────────────────────────────────────── */}
        <div className="grid items-center gap-[52px] lg:grid-cols-[1.02fr_.98fr]">
          <div>
            {/* Écrit ligne par ligne : le français court ~18 % plus long que l'anglais, et
                un titre laissé libre passe à quatre lignes et perd sa masse (AD-13). */}
            <SiteDisplay
              lines={t('hero.titleLines', { returnObjects: true }) as string[]}
              size={70}
              style={{ letterSpacing: '-.04em', lineHeight: 0.88 }}
            />

            <p className="rv mt-5 max-w-[44ch] text-[17px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 5 }}>
              {t('hero.lede')}
            </p>

            <div className="rv mt-[26px] flex flex-wrap gap-3" style={{ ['--i' as string]: 6 }}>
              <Button href={path('/formations')} tone="forme" fullWidth={false}>
                {t('hero.ctaCourses')}
              </Button>
              <Button href={path('/blog')} tone="ghost" fullWidth={false}>
                {t('hero.ctaBlog')}
              </Button>
            </div>
          </div>

          {/*
            L'ENCART DE VÉRITÉ, À CÔTÉ DU HÉROS et non sous les boutons.
            C'est le placement du kit responsive : au-dessus de 1080 px il occupe la colonne
            que les cartes territoire libèrent en passant en rangée pleine largeur.
          */}
          <GlassPanel level="truth" className="rv" style={{ ['--i' as string]: 7 }}>
            <p className="mm-eyebrow m-0 mb-[7px]">{t('hero.truthTitle')}</p>
            <p className="m-0 text-[14.5px] leading-[1.6] text-ink-2">{t('hero.truthBody')}</p>
          </GlassPanel>
        </div>

        {/* ── 2 · Les quatre territoires ───────────────────────────────────────
            En rangée au-delà de 1080 px : quatre chevrons côte à côte redonnent la
            silhouette du M du logo, lue horizontalement. */}
        <div className="mt-[38px]">
          <TerritoryRow layout={layout}>
            {TERRITORIES.map((territory, i) => (
              <div key={territory.key} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <TerritoryCard
                  territory={territory.key}
                  layout={layout}
                  first={i === 0}
                  href={path(territory.to)}
                  meta={t(`territories.${territory.key}Meta`)}
                  title={TERRITORY_VERB[territory.key][language === 'en' ? 'en' : 'fr']}
                  titleSize={23}
                  big={
                    <Num
                      value={big[territory.key]}
                      source={territory.key === 'digitalise' ? { cite: "catalogue de l'offre" } : 'db'}
                      asOf={asOf}
                    />
                  }
                  bigLabel={t(`territories.${territory.key}Label`)}
                />
              </div>
            ))}
          </TerritoryRow>
        </div>
      </PageSite>

      {/* ── 3 · Pourquoi ici, et pas ailleurs ───────────────────────────────── */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('why.title', { returnObjects: true }) as string[]} size={34} />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {REASONS.map((reason, i) => (
            <GlassPanel level="flat" padding={24} key={reason.key} className="rv" style={{ ['--i' as string]: i + 1 }}>
              <span
                aria-hidden="true"
                className="grid h-[38px] w-[38px] place-items-center rounded-[12px]"
                style={{ background: `color-mix(in srgb, ${reason.tint} 16%, transparent)` }}
              >
                <Icon name={reason.glyph} size={19} color={reason.ink} />
              </span>
              <p className="mt-[13px] mb-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                {t(`why.${reason.key}Title`)}
              </p>
              <p className="mt-2 mb-0 text-[14px] leading-[1.55] text-ink-2">{t(`why.${reason.key}Body`)}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      {/* ── 4 · Commence gratuitement ───────────────────────────────────────── */}
      <PageSite style={{ paddingTop: 'var(--sp-44, 44px)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SiteDisplay as="h2" lines={t('free.title', { returnObjects: true }) as string[]} size={34} />
          <Button href={path('/blog')} tone="quiet" size="sm" fullWidth={false}>
            {t('free.all')}
          </Button>
        </div>

        {starters.length > 0 ? (
          <div className="mt-[22px] grid gap-4 md:grid-cols-3">
            {starters.map((starter, i) => (
              <div key={starter.to} className="rv" style={{ ['--i' as string]: i + 1 }}>
                <TerritoryCard
                  layout="plain"
                  territory={starter.territory}
                  href={path(starter.to)}
                  padding={22}
                  meta={starter.meta}
                  title={starter.title}
                  titleSize={19}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Un état vide DIT ce qui manque et oriente. Jamais « oups », jamais un vide muet. */
          <p className="mt-[22px] max-w-prose text-lede text-ink-2">{t('free.empty')}</p>
        )}
      </PageSite>
    </DsNavHost>
  );
}
