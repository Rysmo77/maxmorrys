import type { CSSProperties, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, GlassPanel, Icon, Num, Tag, type IconName } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SOCIAL_URLS } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { legalEntity, pillars, practices, socialLinks } from '../lib/brand';
import { getPublicCounts, type PublicCounts } from '../lib/firestore';
import { queryKeys } from '../lib/queryClient';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * « JE SUIS MAX-MORRYS » — la seule page dont le métier est d'inspirer confiance.
 *
 * La page faisait 768 lignes et neuf sections : héros corporate avec portrait généré par IA,
 * menu d'ancrage collant et flouté, résumé d'impact, expertise, stack, valeurs, parcours à
 * double accordéon, MY ONOMA, appel final. La maquette en dessine six, et le tri n'est pas
 * une question de longueur.
 *
 * CE QUI EST PARTI, ET POURQUOI :
 *
 * 1. LES SIX `CountUp` NON SOURCÉS — +1 790 % de trafic, +8 000 abonnés, 5 plateformes,
 *    affichés deux fois chacun (héros puis « résumé d'impact »). Deux d'entre eux sont des
 *    chiffres d'AUDIENCE, ce qu'AD-5 interdit sans exception, et aucun des trois ne porte de
 *    source. Ce qui les remplace n'est pas un vide : ce sont des COMPTEURS DE PRODUCTION —
 *    articles publiés, formations montées — comptés côté serveur par `getPublicCounts()`,
 *    rendus par `<Num value source asOf />`, avec la phrase qui dit pourquoi.
 *
 * 2. LE PORTRAIT GÉNÉRÉ PAR IA. Le fichier s'appelait littéralement « ChatGPT Image 14 mai
 *    2026 ». Il est remplacé par un EMPLACEMENT DÉCLARÉ, pas par une autre image : sur la
 *    seule page dont le métier est d'inspirer confiance, une image synthétique est le pire
 *    endroit possible. Bénéfice annexe : une requête réseau de 640 × 800 en moins.
 *
 * 3. LE MENU D'ANCRAGE COLLANT, qui portait le seul `backdrop-blur` de la page (AD-4) et un
 *    `IntersectionObserver` de scroll-spy pour trois ancres. Trois ancres ne valent pas un
 *    second chrome collant sous celui du site.
 *
 * 4. L'ACCORDÉON DES MISSIONS. Onze jalons dont cinq dépliaient six blocs de puces chacun :
 *    c'est un CV d'employeur, et le kit tranche — « des dates et des faits, pas des
 *    adjectifs ». Les jalons gardent l'employeur, le rôle et la période ; les missions sortent
 *    de l'écran. Les clés i18n `experiences.*` restent en place, non rendues.
 *
 * 5. « VALEURS », « EXPERTISE », « STACK ». Quatre valeurs adjectivales, quatre cartes de
 *    compétences et une rupture sombre de logos d'outils. Rien de vérifiable, et la page les
 *    répétait déjà en prose.
 *
 * TROIS EMPLACEMENTS DÉCLARÉS survivent à la place de ce qui manque — ils NOMMENT le manque
 * au lieu de le combler. Voir `SiteSlot` et le rapport de recomposition pour les deux endroits
 * où la copie du kit a dû être corrigée contre la donnée réelle du dépôt.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * La date à laquelle le parcours a été relevé auprès de son auteur.
 *
 * `<Num>` exige `asOf` : un jalon déclaré n'est pas lu en base, il est DIT par quelqu'un, à un
 * moment. Le composant l'annonce au survol et au lecteur d'écran — « parcours déclaré par
 * Max-Morrys · relevé du 30/08/2026 » — ce qui est exactement le statut de cette information.
 */
const DECLARED_AT = new Date('2026-08-30T00:00:00Z');

/** L'ordre de la frise. Chronologique, et il ne dépend pas de l'ordre des clés du JSON. */
const MILESTONES = [
  'm2014', 'm2017', 'm2018', 'm2020', 'm2021',
  'm2023Onoma', 'm2023Master', 'm2024Jan', 'm2024May', 'm2025Apr', 'm2025',
] as const;

/** Les trois panneaux de « Ce que je fais ». Une teinte de territoire chacun, jamais un hex. */
const DOES: { key: 'Train' | 'Publish' | 'Support'; glyph: IconName; tint: string; ink: string }[] = [
  { key: 'Train', glyph: 'book', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'Publish', glyph: 'list', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'Support', glyph: 'bars', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)' },
];

/**
 * L'EMPLACEMENT DÉCLARÉ — il nomme ce qui manque, il ne le comble pas.
 *
 * Bordure en tirets, fond à 7 % d'orange, sourcil monospace précédé de l'icône `info`. Le kit
 * le dessine en `rgba(243,139,10,…)` ; ici la teinte passe par `--mm-orange` en `color-mix`,
 * donc elle suit le jeton si le système le corrige, et elle bascule sous `.dk` (AD-2, AD-3).
 * L'encre du sourcil est `--mm-orange-t` : l'orange plein fait 2,47:1 sur blanc et ne porte
 * jamais de texte.
 *
 * Pourquoi il vit ICI et pas dans `components/site/` : c'est une pièce de cette page, comme
 * dans le kit. Les trois emplacements disparaîtront le jour où la matière arrivera ; une
 * primitive partagée survivrait à sa raison d'être.
 */
function SiteSlot({
  title, children, style,
}: { title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 'var(--r-m)',
        padding: '14px 16px',
        background: 'color-mix(in srgb, var(--mm-orange) 7%, transparent)',
        border: '1px dashed color-mix(in srgb, var(--mm-orange) 55%, transparent)',
        ...style,
      }}
    >
      <p className="mm-eyebrow m-0 flex items-center gap-[7px]" style={{ color: 'var(--mm-orange-t)' }}>
        <Icon name="info" size={11} color="var(--mm-orange-t)" strokeWidth={2.6} />
        {title}
      </p>
      <p className="mm-prose m-0 mt-[7px] max-w-[58ch] text-[13px] leading-[1.55] text-ink-2">{children}</p>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation('about');
  const path = useLocalizedPath();
  const { formatDate } = useFormat();

  /*
   * Les seuls chiffres que cette page a le droit d'afficher. `getPublicCounts()` compte côté
   * serveur : une lecture au lieu de cinquante. Un échec rend `null`, jamais zéro — et `<Num>`
   * affiche alors « non relevé » plutôt qu'un zéro faux.
   */
  const { data: counts } = useQuery<PublicCounts | null>({
    queryKey: queryKeys.publicCounts,
    queryFn: () => getPublicCounts(),
  });
  const asOf = counts?.asOf ?? new Date();

  const production: { key: string; value: number | null }[] = [
    { key: 'producedArticles', value: counts?.publishedArticles ?? null },
    { key: 'producedFormations', value: counts?.publishedFormations ?? null },
    { key: 'producedPodcasts', value: counts?.publishedPodcasts ?? null },
    { key: 'producedVideos', value: counts?.publishedVideos ?? null },
  ];

  /* L'arbre de marque vient de `src/lib/brand` — jamais d'un littéral de composant. */
  const tree = [
    { name: 'Max-Morrys', badge: t('page.treeLearnBadge'), body: t('page.treeLearnBody'), accent: false },
    {
      name: practices.build.brand,
      badge: t('page.treePillarBadge', { pillar: practices.build.pillar }),
      body: t('page.treeBuildBody'),
      /* L'agence vit hors des quatre verbes : elle porte le corail, en version texte (AD-20). */
      accent: true,
    },
    {
      name: practices.grow.brand,
      badge: t('page.treePillarBadge', { pillar: practices.grow.pillar }),
      body: t('page.treeGrowBody'),
      accent: false,
    },
  ];

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      {/*
        `sameAs` lit `SOCIAL_URLS`, donc `src/lib/brand/company.ts` — la même source que le
        panneau « Où me trouver » plus bas. Deux listes de profils sur une même page finiraient
        par diverger, et c'est la page dont le métier est justement d'être vérifiable.
        AUCUN `aggregateRating`, aucun compteur d'abonnés : rien de tout ça n'a de source.
      */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Max-Morrys Eyoum',
        url: `${SITE_URL}/a-propos`,
        jobTitle: 'Marketing & Growth Manager',
        worksFor: { '@type': 'Organization', name: 'Eyone Medical' },
        address: { '@type': 'PostalAddress', addressLocality: legalEntity.city, addressCountry: legalEntity.countryCode },
        sameAs: [...SOCIAL_URLS],
      }} />

      <PageSite>
        {/* ── 1 · Le héros — le positionnement, puis l'aveu ─────────────────── */}
        <div className="grid items-center gap-[46px] pb-[14px] lg:grid-cols-[1.04fr_.96fr]">
          <div>
            <SiteEyebrow>{t('page.eyebrow')}</SiteEyebrow>
            {/* Écrit ligne par ligne, jamais replié (AD-13). */}
            <SiteDisplay
              lines={t('page.titleLines', { returnObjects: true }) as string[]}
              size={60}
              from={1}
              style={{ marginTop: '9px' }}
            />

            <p
              className="mm-prose rv mt-4 max-w-[46ch] text-[17px] leading-[1.55] text-ink-2"
              style={{ ['--i' as string]: 4 }}
            >
              {t('page.lede')}
            </p>
            <p
              className="mm-prose rv mt-[14px] max-w-[46ch] text-[14.5px] leading-[1.6] text-ink-2"
              style={{ ['--i' as string]: 5 }}
            >
              {t('page.aloneBody')} <b className="text-ink">{t('page.aloneStrong')}</b>
            </p>

            <div className="rv mt-6 flex flex-wrap gap-3" style={{ ['--i' as string]: 6 }}>
              <Button href={path('/contact')} tone="primary" fullWidth={false}>
                {t('page.ctaContact')}
              </Button>
              <Button href={path('/formations')} tone="ghost" fullWidth={false}>
                {t('page.ctaFormations')}
              </Button>
            </div>
          </div>

          {/*
            LA PLACE DU PORTRAIT. Un dégradé de marque — `--action-informe`, poids zéro — et
            DANS ce dégradé, l'emplacement déclaré. Ce n'est pas un fond d'attente : c'est la
            réponse publiée à la question « pourquoi n'y a-t-il pas de photo ». (FR-084)
          */}
          <div
            className="rv-s flex h-[400px] items-end rounded-xl p-[18px]"
            style={{
              background: 'var(--action-informe)',
              boxShadow: '0 20px 46px color-mix(in srgb, var(--mm-orange) 24%, transparent)',
              ['--i' as string]: 5,
            }}
          >
            <SiteSlot
              title={t('page.slotPortraitTitle')}
              style={{
                width: '100%',
                background: 'color-mix(in srgb, var(--paper-fixed) 90%, transparent)',
                borderColor: 'color-mix(in srgb, var(--mm-orange) 70%, transparent)',
              }}
            >
              {t('page.slotPortraitBody')}
            </SiteSlot>
          </div>
        </div>
      </PageSite>

      {/* ── 2 · Ce que je fais, concrètement ─────────────────────────────────── */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('page.doesTitle', { returnObjects: true }) as string[]} size={34} />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {DOES.map((item, i) => (
            <GlassPanel level="flat" padding={24} key={item.key} className="rv" style={{ ['--i' as string]: i + 1 }}>
              <span
                aria-hidden="true"
                className="grid h-[38px] w-[38px] place-items-center rounded-[12px]"
                style={{ background: `color-mix(in srgb, ${item.tint} 16%, transparent)` }}
              >
                <Icon name={item.glyph} size={19} color={item.ink} />
              </span>
              <p className="mt-[13px] mb-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                {t(`page.does${item.key}Title`)}
              </p>
              <p className="mm-prose mt-2 mb-0 max-w-[42ch] text-[14px] leading-[1.55] text-ink-2">
                {t(`page.does${item.key}Body`)}
              </p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      {/* ── 3 · Le parcours, et ce qu'il a réellement produit ────────────────── */}
      <PageSite>
        <div className="grid items-start gap-[46px] lg:grid-cols-[1fr_.9fr]">
          <div>
            <SiteDisplay as="h2" lines={t('page.pathTitle', { returnObjects: true }) as string[]} size={34} />
            <p
              className="mm-prose rv mt-[11px] max-w-[44ch] text-[15.5px] leading-[1.6] text-ink-2"
              style={{ ['--i' as string]: 2 }}
            >
              {t('page.pathLede')}
            </p>

            {/*
              LA FRISE. Un rail de 2 px en `--fill-3` et un point par jalon : `--fill-3` et
              `--ink-3` sont des jetons de FILET, ils ne portent jamais de texte (AD-18).
              La date passe par `<Num>` — c'est le seul chemin du dépôt vers la monospace — et
              le lieu reste en corps, parce qu'un nom de ville n'est pas un nombre vérifié.
            */}
            <div
              className="rv mt-[26px] pl-[22px]"
              style={{ borderLeft: '2px solid var(--fill-3)', ['--i' as string]: 3 }}
            >
              {MILESTONES.map((key, i) => (
                <div key={key} className="relative" style={{ paddingBottom: i === MILESTONES.length - 1 ? 0 : '24px' }}>
                  <span
                    aria-hidden="true"
                    className="absolute left-[-29px] top-[5px] h-3 w-3 rounded-full"
                    style={{ background: 'var(--surface-page)', border: '2.5px solid var(--mm-orange)' }}
                  />
                  <p className="m-0 text-[11px] text-ink-2">
                    <Num
                      value={t(`milestones.${key}.year`)}
                      source={{ cite: t('page.pathCite') }}
                      asOf={DECLARED_AT}
                    />
                    <span className="ml-[6px]">· {t(`milestones.${key}.lieu`)}</span>
                  </p>
                  <b className="mt-[3px] block text-[15.5px] font-bold text-ink">{t(`milestones.${key}.title`)}</b>
                  <p className="mm-prose mt-[5px] mb-0 max-w-[52ch] text-[13.5px] leading-[1.55] text-ink-2">
                    {t(`milestones.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>

            {/* Emplacement déclaré nº 2 — ce que la frise ne peut toujours pas prouver. */}
            <SiteSlot title={t('page.slotPathTitle')} style={{ marginTop: '18px' }}>
              {t('page.slotPathBody')} <b className="text-ink">{t('page.slotPathStrong')}</b>
            </SiteSlot>
          </div>

          <div>
            {/*
              LES COMPTEURS DE PRODUCTION — ce qui remplace les trois chiffres d'audience.
              Quatre nombres, tous lus en base, tous datés. Le panneau porte lui-même la phrase
              qui explique la substitution : sans elle, quatre petits chiffres passeraient pour
              une modestie, alors que c'est une règle.
            */}
            <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 4 }}>
              <SiteEyebrow style={{ margin: 0 }}>
                {t('page.producedTitle')} · {formatDate(asOf.toISOString())}
              </SiteEyebrow>
              <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
                {production.map((cell) => (
                  <div key={cell.key}>
                    <p className="m-0 text-[32px] text-ink">
                      <Num value={cell.value} source="db" asOf={asOf} />
                    </p>
                    <p className="m-0 text-[12.5px] text-ink-2">{t(`page.${cell.key}`)}</p>
                  </div>
                ))}
              </div>
              <div className="my-[18px] h-px bg-[color:var(--border-hair)]" />
              <p className="mm-prose m-0 max-w-[46ch] text-[13px] leading-[1.55] text-ink-2">
                {t('page.producedBody')} <b className="text-ink">{t('page.producedStrong')}</b>
              </p>
            </GlassPanel>

            <GlassPanel level="flat" padding={24} className="rv mt-4" style={{ ['--i' as string]: 5 }}>
              <SiteEyebrow style={{ margin: 0 }}>{t('page.soloTitle')}</SiteEyebrow>
              <p className="mm-prose mt-[9px] mb-0 max-w-[46ch] text-[14.5px] leading-[1.6] text-ink-2">
                {t('page.soloBody')} <b className="text-ink">{t('page.soloStrong')}</b>
              </p>
            </GlassPanel>
          </div>
        </div>
      </PageSite>

      {/* ── 4 · Où tout ça se range — l'arbre de marque ──────────────────────── */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('page.treeTitle', { returnObjects: true }) as string[]} size={34} />
        <p
          className="mm-prose rv mt-[10px] max-w-[60ch] text-[15.5px] leading-[1.6] text-ink-2"
          style={{ ['--i' as string]: 1 }}
        >
          {t('page.treeLede')}
        </p>

        <div className="mt-[22px] grid gap-4 md:grid-cols-3">
          {tree.map((branch, i) => (
            <GlassPanel
              level="flat"
              padding={24}
              key={branch.name}
              className="rv"
              style={{
                ['--i' as string]: i + 2,
                borderColor: branch.accent ? 'color-mix(in srgb, var(--mm-corail) 32%, transparent)' : undefined,
              }}
            >
              <Tag
                style={branch.accent
                  ? { background: 'color-mix(in srgb, var(--mm-corail) 14%, transparent)', color: 'var(--mm-corail-t)' }
                  : undefined}
              >
                {branch.badge}
              </Tag>
              <p className="mt-[11px] mb-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                {branch.name}
              </p>
              <p className="mm-prose mt-2 mb-0 max-w-[42ch] text-[14px] leading-[1.55] text-ink-2">{branch.body}</p>
            </GlassPanel>
          ))}
        </div>

        {/* Les trois faits corporate. Ils viennent de `legalEntity`, qui porte les pièces. */}
        <GlassPanel level="flat" padding={22} className="rv mt-[18px]" style={{ ['--i' as string]: 5 }}>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="m-0 text-[12.5px] text-ink-2">{t('page.treeRegistered')}</p>
              <p className="mt-[2px] mb-0 text-[18px] text-ink">
                <Num
                  value={formatDate(legalEntity.registeredAt)}
                  source={{ cite: t('page.treeCite') }}
                  asOf={new Date(legalEntity.registeredAt)}
                />
              </p>
            </div>
            <div>
              <p className="m-0 text-[12.5px] text-ink-2">{t('page.treeSeat')}</p>
              <p className="mt-[2px] mb-0 text-[18px] font-semibold text-ink">
                {legalEntity.city}, {legalEntity.country}
              </p>
            </div>
            <div>
              <p className="m-0 text-[12.5px] text-ink-2">{t('page.treePillars')}</p>
              <p className="mt-[2px] mb-0 text-[18px] font-semibold text-ink">{pillars.join(' · ')}</p>
            </div>
          </div>
        </GlassPanel>
      </SiteBand>

      {/* ── 5 · Où me trouver ────────────────────────────────────────────────── */}
      <PageSite>
        <div className="grid items-center gap-[44px] lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <SiteDisplay as="h2" lines={t('page.findTitle', { returnObjects: true }) as string[]} size={34} />
            <p
              className="mm-prose rv mt-[11px] max-w-[40ch] text-[15.5px] leading-[1.6] text-ink-2"
              style={{ ['--i' as string]: 2 }}
            >
              {t('page.findLede')}
            </p>
            {/* Emplacement déclaré nº 3 — ce qui reste vide, et pourquoi on ne le devine pas. */}
            <SiteSlot title={t('page.slotFindTitle')} style={{ marginTop: '18px' }}>
              {t('page.slotFindBody')} <b className="text-ink">{t('page.slotFindStrong')}</b>
            </SiteSlot>
          </div>

          {/*
            AUCUN LOGO DE PLATEFORME. Le kit dessine les marques tierces en aplat de leur
            couleur — quatre hexadécimaux hors du système, quatre tracés à embarquer, et un
            second jeu d'icônes sur un écran qui en a déjà un. La pastille d'initiale du DS
            dit la même chose pour zéro octet, et le nom est écrit juste à côté.
          */}
          <GlassPanel level="flat" padding={24} className="rv" style={{ ['--i' as string]: 3 }}>
            {socialLinks.map((profile, i) => (
              <a
                key={profile.name}
                href={profile.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 py-[11px] no-underline"
                style={i ? { borderTop: '1px solid var(--border-hair)' } : undefined}
              >
                <Avatar
                  initials={profile.name.slice(0, 1)}
                  size={34}
                  background={i % 2 ? 'var(--action-informe)' : 'var(--action-forme)'}
                  style={{ borderRadius: '11px' }}
                />
                <span className="min-w-0 flex-1">
                  <b className="block text-[14px] text-ink">{profile.name}</b>
                  <span className="block truncate text-[12px] text-ink-2">
                    {profile.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </span>
                <Tag tone="ok">{t('page.findDeclared')}</Tag>
              </a>
            ))}
          </GlassPanel>
        </div>

        {/* ── 6 · L'appel final ─────────────────────────────────────────────── */}
        <div
          className="rv mt-11 grid items-center gap-9 rounded-xl p-[34px] lg:grid-cols-[1.2fr_.8fr]"
          style={{
            background: 'var(--action-informe)',
            color: 'var(--paper-fixed)',
            boxShadow: '0 20px 48px color-mix(in srgb, var(--mm-orange) 30%, transparent)',
          }}
        >
          <div>
            <SiteDisplay
              as="h2"
              lines={t('page.closingTitle', { returnObjects: true }) as string[]}
              size={33}
              style={{ lineHeight: 1.06 }}
            />
            {/* Le compte d'articles est le seul argument de ce bloc : il passe par <Num>. */}
            <p className="mm-prose mt-[11px] mb-0 max-w-[50ch] text-[15px]">
              {t('page.closingBefore')}{' '}
              <Num value={counts?.publishedArticles ?? null} source="db" asOf={asOf} />{' '}
              {t('page.closingAfter')}
            </p>
          </div>
          <div className="flex flex-col gap-[10px]">
            <Button
              href={path('/blog')}
              focusInvert
              style={{ background: 'var(--paper-fixed)', color: 'var(--ink-fixed)', boxShadow: 'none' }}
            >
              {t('page.closingBlog')}
            </Button>
            <Button
              href={path('/contact')}
              focusInvert
              style={{
                background: 'color-mix(in srgb, var(--paper-fixed) 16%, transparent)',
                color: 'var(--paper-fixed)',
                border: '1px solid color-mix(in srgb, var(--paper-fixed) 30%, transparent)',
                boxShadow: 'none',
              }}
            >
              {t('page.closingContact')}
            </Button>
          </div>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
