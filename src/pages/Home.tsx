import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Num, TerritoryCard } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_URLS } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import MyOnomaBridge from '../components/brand/MyOnomaBridge';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { portrait } from '../lib/author';
import { contentPath } from '../lib/contentPath';
import { queryKeys } from '../lib/queryClient';
import type { BlogPost, Podcast } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ACCUEIL — IL PRÉSENTE ET IL AIGUILLE. IL NE VEND RIEN.
 *
 * Le CDC du 14/09/2026 § 4.1 tranche ce que sept versions successives de cette page n'avaient
 * jamais tranché : « L'accueil ne vend rien directement. Il présente la personne et aiguille.
 * C'est sa seule fonction, et il doit y renoncer à toute autre. » Cinq blocs, dans cet ordre —
 * présentation, les deux pistes, preuve d'audience, dernières publications, lien My Onoma.
 *
 * ⚠️ CETTE DÉCISION EN ANNULE UNE PLUS ANCIENNE, ET C'EST VOULU. Une note de mémoire du dépôt
 * dit « l'accueil est repassé à 7 sections le 01/09/2026 — ne pas le réduire en croyant
 * réparer ». Le CDC est postérieur et dit l'inverse. Ce qui reste vrai de l'ancienne note,
 * c'est son motif : rien ne doit DISPARAÎTRE du site en quittant l'accueil. Chaque section
 * retirée a donc une destination, et l'accueil y mène par la carte de sa piste :
 *
 *   · « Tout ce que tu peux faire ici » (six portes)     → /apprendre et /conception
 *   · « Pourquoi ici, et pas ailleurs » (paiement, …)    → /apprendre
 *   · « Tu as un commerce ? » (offre TPE développée)     → /conception (commerces-et-tpe)
 *   · « Par où tu commences » (double appel final)       → remplacé par les deux pistes
 *
 * ── LES DEUX PISTES SONT DE POIDS STRICTEMENT ÉGAL ────────────────────────────────────
 * Même primitive, même `layout`, même `padding`, même `titleSize`, même structure de contenu
 * et `fill` pour que les deux pieds se posent sur la même ligne. Aucune des deux ne porte de
 * chiffre que l'autre n'aurait pas : un compte d'un seul côté suffirait à faire de l'autre la
 * piste secondaire, ce que le CDC refuse explicitement.
 *
 * ── LES COMPTEURS ONT QUITTÉ L'ACCUEIL, ET IL N'EN RESTE QU'UN SEUL FAIT DATÉ ─────────
 * ⚠️ ÉCART ASSUMÉ AU CDC § 4.1, décidé le 18/09/2026 après mesure. L'accueil et `/a-propos`
 * affichaient LES MÊMES QUATRE COMPTES, issus du même `getPublicCounts()` : deux relevés du
 * même fait, à deux dates de lecture potentiellement différentes, sur deux pages qui se
 * suivent. Le décompte reste sur `/a-propos`, dont c'est le métier — la page qui doit
 * inspirer confiance —, et l'accueil garde la seule chose que l'autre ne dit pas : la DATE
 * de la dernière parution.
 *
 * RIEN NE DISPARAÎT SANS DESTINATION, ici non plus : `proof.truthBody` RENVOIE au décompte
 * de `/a-propos` au lieu de le répéter. C'est ce qui distingue un retrait d'une perte.
 *
 * AD-5 tient inchangé : le seul chemin vers un nombre reste `<Num source asOf>`.
 *
 * ⚠️ `asOf` VENAIT DE `counts.asOf`, ET CETTE SOURCE N'EXISTE PLUS ICI. La requête de
 * comptes est partie avec la grille. La date de relevé est désormais celle du RENDU — le
 * moment où les deux lectures de publications (articles, épisodes) ont été servies à cette
 * page —, et c'est bien ce qu'elle date : `derniere` sort de `latest`, pas d'un compteur.
 *
 * ── CE QUE CETTE PAGE COÛTE AU PREMIER OCTET ──────────────────────────────────────────
 * `Home` est la SEULE page montée sans `lazy()` dans `App.tsx` : tout import statique ici pèse
 * sur l'entrée de chaque visiteur anonyme. Les deux lectures passent donc par un `import()`
 * dans leur `queryFn` — `tests/unit/first-view-graph.test.ts` refuse `firebase/firestore` dans
 * le graphe statique de l'entrée, et le barillet `lib/firestore` l'y ferait entrer d'une ligne.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * LES DEUX PISTES, dans l'ordre du CDC — et leur teinte n'est pas un choix de mise en page.
 *
 * ⚠️ CONCEPTION N'EST PAS UN TERRITOIRE. La piste vit HORS des quatre verbes : c'est ce que
 * `sectionThemes.universeFromPath` câble (`/conception` → univers `agency`, corail) et ce que
 * `tests/unit/og-territory-sync.test.ts` exige — seul l'étage productisé
 * `/conception/commerces-et-tpe` garde le teal de « Je te digitalise ». D'où `rose`, la
 * CINQUIÈME carte du système, déclarée par `TerritoryCard` comme « corail, hors des quatre
 * verbes ». Lui donner `digitalise` ici aurait mis la couleur d'une grille tarifaire publique
 * sur la porte d'une piste qui n'en affiche aucune.
 *
 * APPRENDRE prend `forme` : le verbe qui l'ouvre, et ce que le pré-rendu annonce déjà.
 *
 * Deux teintes différentes, donc — mais AUCUNE hiérarchie : même primitive, même géométrie,
 * même structure de contenu, et `fill` pour que les deux pieds tombent sur la même ligne.
 */
const PISTES = [
  { key: 'conception', territory: 'rose', to: '/conception', cta: 'cta.pisteConception' },
  { key: 'apprendre', territory: 'forme', to: '/apprendre', cta: 'cta.pisteApprendre' },
] as const;

export default function Home() {
  const { t } = useTranslation('home');
  /* Les six libellés de destination sont partagés : ils étaient écrits au caractère près dans
     `home.json` ET `about.json`, deux cartes pour la même porte. */
  const { t: tc } = useTranslation('common');
  const { t: tShared } = useTranslation('shared');
  const path = useLocalizedPath();
  const { language } = useLanguage();

  const { data: posts = [] } = useQuery<BlogPost[]>({
    queryKey: queryKeys.homeRecentPosts,
    queryFn: async () => (await import('../lib/firestore/blog')).getPublishedPosts(5),
  });
  const { data: podcasts = [] } = useQuery<Podcast[]>({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: async () => (await import('../lib/firestore/content')).getPublishedPodcasts(),
  });

  /*
   * ⚠️ LA DATE DE RELEVÉ NE VIENT PLUS DE `counts.asOf` — cette lecture a quitté la page avec
   * la grille des quatre comptes (voir l'en-tête). C'est l'instant du RENDU, c'est-à-dire
   * celui où les deux requêtes ci-dessus ont servi cette page : la seule chose qu'`asOf`
   * date encore ici est `derniere`, qui en est tirée.
   */
  const asOf = new Date();
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';

  /*
   * LES TROIS DERNIÈRES PUBLICATIONS, TOUS SUPPORTS CONFONDUS.
   *
   * Articles et épisodes se rangent sur la MÊME frise chronologique : trier chaque source
   * séparément ferait passer un article vieux de six mois devant un épisode d'hier, et la
   * section s'appelle « les dernières publications », pas « un de chaque ».
   *
   * `publishedAt` est une chaîne ISO en base — la comparaison lexicographique y est déjà
   * chronologique, et elle évite de construire trois `Date` par rendu.
   */
  const latest = [
    ...posts.map((p) => ({
      territory: 'informe' as const,
      meta: t('latest.metaArticle'),
      title: p.title,
      at: p.publishedAt,
      to: contentPath('blog', p, language),
    })),
    ...podcasts.map((p) => ({
      territory: 'transforme' as const,
      meta: t('latest.metaEpisode'),
      title: p.title,
      at: p.publishedAt,
      to: contentPath('podcasts', p, language),
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 3);

  /*
   * LE RYTHME DE PUBLICATION, RÉDUIT À CE QUI EST SOURÇABLE : la date de la dernière parution.
   *
   * Le CDC demande « le rythme de publication ». Une CADENCE — « un article par semaine » —
   * n'est mesurable par aucune lecture que cette page fait : les cinq derniers articles ne
   * décrivent pas une fréquence, et l'écrire à la main serait précisément le chiffre rond
   * invérifiable que le CDC interdit. La date de la dernière publication, elle, est lue en
   * base, et elle dit au lecteur ce qu'une cadence prétendrait lui dire.
   */
  const derniere = latest[0]?.at ?? null;

  return (
    <DsNavHost>
      <SEOHead title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} ogImage={DEFAULT_OG_IMAGE} />
      {/* Le balisage ne décrit QUE l'organisation. Pas de `Person` : `/a-propos` le porte
          déjà, et un second qui divergerait d'un champ vaudrait moins que rien. */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        sameAs: Object.values(SOCIAL_URLS),
      }} />

      <PageSite>
        {/*
          ── 1 · LA PRÉSENTATION ───────────────────────────────────────────────────────
          Une personne, un métier, un lieu — et un vrai portrait. Pas de slogan : le titre
          NOMME, il ne promet pas. Le fragment entre crochets reste l'arc de couleur rendu
          par `SiteDisplay`, c'est la seule mise en valeur du bloc.

          La colonne du portrait est FIXE (380 px), comme sur `/a-propos` : une personne a une
          taille naturelle, et la moitié d'une page n'en est pas une. `minmax(0,1fr)` à gauche,
          sans quoi la piste `fr` garde `min-width:auto` et refuse de descendre sous son texte.
        */}
        <div className="mm-arc-host grid items-center gap-[46px] pb-[14px] wide:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <SiteEyebrow>{t('hero.eyebrow')}</SiteEyebrow>
            <SiteDisplay
              arc
              lines={t('hero.titleLines', { returnObjects: true }) as string[]}
              size={60}
              from={1}
              style={{ marginTop: '9px' }}
            />
            <p
              className="mm-prose rv mt-[18px] max-w-[48ch] text-[16.5px] leading-[1.55] text-ink-2"
              style={{ ['--i' as string]: 5 }}
            >
              {t('hero.lede')}
            </p>
            <div className="rv mt-6" style={{ ['--i' as string]: 6 }}>
              <Button href={path('/a-propos')} tone="ghost" fullWidth={false}>
                {t('hero.cta')}
              </Button>
            </div>
          </div>

          {/* Le portrait est au-dessus de la ligne de flottaison : ni `lazy`, ni différé. Le
              passe-partout de 14 px en aplat de marque est la seule surface colorée du bloc. */}
          <figure
            className="rv-s w-full max-w-[380px] rounded-card p-[14px]"
            style={{
              background:
                'linear-gradient(150deg,var(--mm-orange-c),var(--mm-rose-c) 48%,var(--mm-violet-c))',
              boxShadow: '0 20px 46px color-mix(in srgb, var(--mm-orange) 24%, transparent)',
              ['--i' as string]: 4,
            }}
          >
            <img
              src={portrait.src}
              srcSet={portrait.srcSet}
              /* La largeur AFFICHÉE : la piste de 380 px moins le passe-partout de 2 × 14. */
              sizes="352px"
              width={portrait.width}
              height={portrait.height}
              alt={tShared('portrait.alt')}
              fetchPriority="high"
              decoding="async"
              className="block w-full rounded-xs object-cover"
              style={{ aspectRatio: '4 / 5' }}
            />
          </figure>
        </div>
      </PageSite>

      {/*
        ── 2 · LES DEUX PISTES ─────────────────────────────────────────────────────────
        Le seul aiguillage de la page, et son centre de gravité. Les deux cartes sont
        rigoureusement identiques en dessin : ce qui les distingue est leur territoire et
        leur texte, jamais leur taille, leur padding ni la présence d'un chiffre.
      */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('pistes.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="mm-prose rv mt-3 max-w-[58ch] text-lede text-ink-2" style={{ ['--i' as string]: 3 }}>
          {t('pistes.lede')}
        </p>

        <div className="mt-[22px] grid gap-5 stack:grid-cols-2">
          {PISTES.map((piste, i) => (
            <div key={piste.key} className="rv min-w-0" style={{ ['--i' as string]: i + 1 }}>
              <TerritoryCard
                layout="plain"
                fill
                territory={piste.territory}
                href={path(piste.to)}
                padding={26}
                meta={t(`pistes.${piste.key}Meta`)}
                title={t(`pistes.${piste.key}Title`)}
                titleSize={26}
              >
                <p className="mt-[13px] mb-0 text-[14.5px] leading-[1.55]" style={{ color: 'var(--card-ink-2)' }}>
                  {t(`pistes.${piste.key}Body`)}
                </p>
                {/* L'élément élastique que `fill` attend de l'appelant : c'est lui qui pousse
                    les deux pieds sur la même ligne, quelle que soit la longueur des textes. */}
                <span aria-hidden="true" className="min-h-[18px] flex-1" />
                <p className="mm-eyebrow mt-0 mb-0" style={{ color: 'var(--card-ink)' }}>
                  {tc(piste.cta)}
                </p>
              </TerritoryCard>
            </div>
          ))}
        </div>
      </SiteBand>

      {/*
        ── 3 · LA PREUVE ───────────────────────────────────────────────────────────────
        UN SEUL FAIT DATÉ, et le renvoi vers ce qui a déménagé. Les quatre comptes de
        production vivaient ici ET sur `/a-propos`, lus par le même `getPublicCounts()` :
        c'était deux fois le même relevé à deux dates de lecture. Il ne reste que la date de
        la dernière parution — celle-là, `/a-propos` ne la porte pas.

        Tout nombre passe toujours par <Num> : c'est le seul chemin du dépôt vers la
        monospace, et il exige sa source et sa date au typage.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <div className="grid items-start gap-[46px] wide:grid-cols-[1fr_.95fr]">
          <div className="min-w-0">
            <SiteDisplay as="h2" lines={t('proof.titleLines', { returnObjects: true }) as string[]} size={34} />
            <p
              className="mm-prose rv mt-[11px] max-w-[46ch] text-[15.5px] leading-[1.6] text-ink-2"
              style={{ ['--i' as string]: 2 }}
            >
              {t('proof.lede')}
            </p>

            <GlassPanel level="truth" className="rv mt-[18px] max-w-[54ch]" style={{ ['--i' as string]: 3 }}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('proof.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta leading-[1.55] text-ink-2">{t('proof.truthBody')}</p>
            </GlassPanel>
          </div>

          {/* LE PANNEAU NE PORTE PLUS QU'UN FAIT : la date de la dernière parution. La grille
              des quatre comptes et sa ligne de relevé sont parties sur `/a-propos`, où elles
              ne sont plus un doublon — et `proof.truthBody`, ci-contre, y mène. */}
          <GlassPanel level="hero" padding={26} className="min-w-0 rv" style={{ ['--i' as string]: 4 }}>
            <p className="m-0 text-[12.5px] text-ink-2">{t('proof.lastLabel')}</p>
            {/* 26 px, la taille que la grille des comptes portait : seul dans son panneau,
                ce fait est ce que le bloc vient dire, il n'en est plus la note de bas de page. */}
            <p className="mt-[2px] mb-0 text-[26px] text-ink">
              <Num
                value={derniere ? new Date(derniere).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : null}
                source="db"
                asOf={asOf}
                fallback={t('proof.lastNone')}
              />
            </p>
          </GlassPanel>
        </div>
      </PageSite>

      {/*
        ── 4 · LES DERNIÈRES PUBLICATIONS ──────────────────────────────────────────────
        Alimentées automatiquement : trois entrées, articles et épisodes mêlés, prises sur la
        même frise chronologique. Rien n'y est choisi à la main, donc rien n'y périme.
      */}
      <SiteBand>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SiteDisplay as="h2" lines={t('latest.titleLines', { returnObjects: true }) as string[]} size={34} />
          <Button href={path('/blog')} tone="quiet" size="sm" fullWidth={false}>
            {t('latest.all')}
          </Button>
        </div>

        {latest.length > 0 ? (
          <div className="mt-[22px] grid gap-4 stack:grid-cols-3">
            {latest.map((item, i) => (
              <div key={item.to} className="rv min-w-0" style={{ ['--i' as string]: i + 1 }}>
                <TerritoryCard
                  layout="plain"
                  territory={item.territory}
                  href={item.to}
                  padding={22}
                  meta={item.meta}
                  title={item.title}
                  titleSize={19}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Un état vide DIT ce qui manque et oriente. Jamais « oups », jamais un vide muet. */
          <p className="mm-prose mt-[22px] max-w-prose text-lede text-ink-2">{t('latest.empty')}</p>
        )}
      </SiteBand>

      {/*
        ── 5 · LE LIEN MY ONOMA ────────────────────────────────────────────────────────
        Une phrase et un lien sortant, rendus par le pont partagé. Il n'y a volontairement
        pas de seconde rédaction ici : deux écritures du même rattachement corporate sont
        une occasion de le contredire.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <MyOnomaBridge variant="line" />
      </PageSite>
    </DsNavHost>
  );
}
