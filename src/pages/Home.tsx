import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Icon, Num, TERRITORY_VERB, TerritoryCard, type IconName } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SOCIAL_URLS } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow, TerritoryRow, useTerritoryLayout, type TerritoryLayout } from '../components/site';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { portrait } from '../lib/author';
import type { PublicCounts } from '../lib/firestore/publicCounts';
import { queryKeys } from '../lib/queryClient';
import { CLUB_PRICE_XOF } from '../lib/club/pricing';
import { PACKS as presencePacks } from '../lib/presence/offer';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ACCUEIL — sept sections, contre trois.
 *
 * La page en a fait treize, puis trois. Les treize étaient un catalogue de sections sans
 * hiérarchie ; les trois répondaient bien à « qu'est-ce que c'est, et est-ce que je peux
 * payer », mais elles ne disaient plus CE QU'IL Y A ICI. Un visiteur qui arrivait sur `/`
 * ne pouvait pas apprendre que le Club des Digitos existe, ni Max-Morrys Agency, ni ce que
 * « Je te digitalise » recouvre : les quatre cartes territoire nomment des verbes, pas des
 * offres, et l'agence vit hors des quatre verbes.
 *
 * Sept sections, donc, sur demande explicite du porteur — et le héros du kit intact.
 *
 * ── CE QUI REVIENT ────────────────────────────────────────────────────────────────────
 *   · « Je suis Max-Morrys » — la personne, nommée sur sa propre page d'accueil. Le sourcil
 *     du héros la nomme dès la première ligne lue.
 *   · « Tout ce que tu peux faire ici » — les six portes, y compris les deux que les quatre
 *     verbes ne peuvent pas porter : le Club (deuxième étage du territoire violet) et
 *     l'Agence (corail, hors territoire, carte `rose` du système).
 *   · L'offre commerce local, développée : « Je te digitalise » ne se comprend pas tout seul.
 *   · Un appel final, deux portes.
 *
 * ── CE QUI NE REVIENT PAS, ET NE REVIENDRA PAS ────────────────────────────────────────
 *   · LES QUATRE CHIFFRES DE FAÇADE — +340 % de trafic, 50+ étudiants, 94 % de réussite,
 *     10+ cours — alors que la base compte 5 comptes et 0 formation publiée.
 *   · LE CARROUSEL DE TÉMOIGNAGES et ses notes en étoiles. « Interdits absolus, sans
 *     exception : note en étoiles, nombre d'avis, nombre d'élèves, taux de réussite,
 *     témoignage, logo client. » Ces chiffres se vérifient en trente secondes.
 *   · LA LETTRE D'INFORMATION. Le produit n'a toujours AUCUN canal d'envoi.
 *
 * L'encart de vérité reste, et il reste dans le premier écran : c'est lui qui NOMME ce qui
 * manque, et une page qui s'allonge en a plus besoin, pas moins.
 *
 * ── LE RYTHME ─────────────────────────────────────────────────────────────────────────
 * Neutre · bande · neutre · bande · neutre · bande · neutre. Deux sections neutres qui se
 * touchent effacent la respiration du kit ; deux bandes qui se touchent font un aplat de
 * 900 px. C'est pour ça, et pour ça seulement, que « Commence gratuitement » passe de
 * `PageSite` à `SiteBand` : son contenu ne bouge pas d'une ligne.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Les quatre territoires. L'agence n'y est pas : elle vit hors des quatre verbes. */
const TERRITORIES = [
  { key: 'forme', to: '/formations', glyph: 'book' },
  { key: 'informe', to: '/blog', glyph: 'doc' },
  { key: 'transforme', to: '/podcast-et-videos', glyph: 'play' },
  { key: 'digitalise', to: '/presence-digitale', glyph: 'globe' },
] as const;

/**
 * LES SIX PORTES, dans l'ordre où on les franchit : ce qui s'apprend seul, ce qui se lit et
 * s'écoute gratuitement, puis ce qui s'achète — du moins cher au sur-mesure.
 *
 * `rose` est la CINQUIÈME CARTE du système, déclarée par `TerritoryCard` comme « corail, hors
 * des quatre verbes ». C'est sa première utilisation dans le dépôt, et c'est exactement
 * l'emploi pour lequel elle a été dessinée : l'Agence n'est pas un territoire, elle est à
 * côté. `--g-rose-1/2` bascule sous `.dk`, comme les quatre autres.
 */
const OFFERS = [
  { key: 'formations', territory: 'forme', to: '/formations' },
  { key: 'blog', territory: 'informe', to: '/blog' },
  { key: 'media', territory: 'transforme', to: '/podcast-et-videos' },
  { key: 'club', territory: 'transforme', to: '/club-des-digitos' },
  { key: 'presence', territory: 'digitalise', to: '/presence-digitale' },
  { key: 'agency', territory: 'rose', to: '/agence' },
] as const;

/** « Ce que je fais, concrètement » — mêmes glyphes et mêmes teintes que le kit (§ Apropos). */
const DOES: { key: 'c1' | 'c2' | 'c3'; glyph: IconName; tint: string; ink: string }[] = [
  { key: 'c1', glyph: 'book', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'c2', glyph: 'list', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'c3', glyph: 'bars', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)' },
];

const REASONS: { key: 'r1' | 'r2' | 'r3'; glyph: IconName; tint: string; ink: string }[] = [
  { key: 'r1', glyph: 'card', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'r2', glyph: 'globe', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'r3', glyph: 'download', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)' },
];

/** Les quatre promesses de l'offre commerce local, dans l'ordre où elles se produisent. */
const PRESENCE_POINTS: { key: 'found' | 'present' | 'convert' | 'measure'; glyph: IconName }[] = [
  { key: 'found', glyph: 'pin' },
  { key: 'present', glyph: 'store' },
  { key: 'convert', glyph: 'send' },
  { key: 'measure', glyph: 'bars' },
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

  /*
    ── LES QUATRE LECTURES SONT CHARGÉES À LA DEMANDE, PAS À L'IMPORT ──────────────
    Cette page est la SEULE du site montée sans `lazy()` — c'est la page d'atterrissage,
    et un aller-retour de plus avant son premier pixel coûterait plus qu'il ne rapporte.
    Mais quatre imports statiques de `lib/firestore` suffisaient à faire entrer le SDK
    Firestore — 90 Ko gzip — dans le graphe de l'entrée, donc dans le `modulepreload`
    de TOUTES les pages.

    ⚠️ LA QUATRIÈME LIGNE ÉTAIT LA PIRE : `from '../lib/firestore'` visait le BARILLET,
    qui fait `export *` sur quatorze modules. Une ligne tirait l'administration, le Club,
    les missions et les redirections dans la page d'accueil.

    `useQuery` n'appelle `queryFn` qu'après le montage : l'import dynamique s'y glisse
    sans rien changer au comportement, et le SDK descend EN PARALLÈLE du premier rendu
    au lieu de le précéder. Les états de chargement existaient déjà.
  */
  const { data: counts } = useQuery<PublicCounts | null>({
    queryKey: queryKeys.publicCounts,
    queryFn: async () => (await import('../lib/firestore/publicCounts')).getPublicCounts(),
  });
  const { data: posts = [] } = useQuery({
    queryKey: queryKeys.homeRecentPosts,
    queryFn: async () => (await import('../lib/firestore/blog')).getPublishedPosts(5),
  });
  const { data: podcasts = [] } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: async () => (await import('../lib/firestore/content')).getPublishedPodcasts(),
  });
  const { data: formations = [] } = useQuery({
    queryKey: queryKeys.publishedFormations,
    queryFn: async () => (await import('../lib/firestore/formations')).getPublishedFormations(),
  });

  /*
   * Les chiffres des cartes territoire. Ils viennent de `getPublicCounts()`, qui compte côté
   * serveur — jamais des valeurs du kit, qui se contredisent elles-mêmes : l'accueil du kit
   * annonce « 1 formation », son catalogue « 2 », sa page à propos « 2 », et le readme « 0 ».
   * Les quatre sont en monospace, donc tous présentés comme vérifiés.
   */
  const nombres: Record<string, number | null> = {
    forme: counts?.publishedFormations ?? null,
    informe: counts?.publishedArticles ?? null,
    transforme: counts ? counts.publishedPodcasts + counts.publishedVideos : null,
    // Les trois packs viennent du catalogue de l'offre, pas de la base : c'est une constante
    // commerciale, pas une mesure. Elle n'a donc pas de date de relevé à porter.
    digitalise: presencePacks.length,
  };

  /*
   * LE PRIX D'ENTRÉE DE CHAQUE TERRITOIRE, tel que le kit le pose en pied de carte.
   *
   * Aucun n'est recopié : le prix de formation est le PLUS BAS du catalogue publié, l'entrée
   * TPE vient de la grille de l'offre, et le mensuel du Club est recalculé. Si le catalogue
   * est vide, `min` vaut `null` et le prix ne s'affiche pas — un « à partir de 0 F » serait
   * un chiffre inventé, et c'est exactement ce que la règle 6 refuse.
   */
  const prixFormation = formations.length
    ? Math.min(...formations.map((f) => f.promoPrice ?? f.price))
    : null;
  const prixTpe = presencePacks.length
    ? Math.min(...presencePacks.map((pk: (typeof presencePacks)[number]) => pk.promoPrice ?? pk.price))
    : null;
  const clubMensuel = Math.round(CLUB_PRICE_XOF / 12);

  /* « Commence gratuitement » — trois vraies entrées, ou rien. */
  const starters = [
    posts[0] && { territory: 'informe' as const, meta: t('free.metaArticle'), title: posts[0].title, to: `/blog/${posts[0].slug}` },
    podcasts[0] && { territory: 'transforme' as const, meta: t('free.metaPodcast'), title: podcasts[0].title, to: `/podcasts/${podcasts[0].slug}` },
    formations[0] && { territory: 'forme' as const, meta: t('free.metaCourse'), title: formations[0].title, to: `/formations/${formations[0].slug}` },
  ].filter(Boolean) as { territory: 'informe' | 'transforme' | 'forme'; meta: string; title: string; to: string }[];

  const asOf = counts?.asOf ?? new Date();

  /*
   * ── LES QUATRE CARTES VIVENT DANS LA COLONNE DE DROITE ─────────────────────────────────
   *
   * C'est la composition du kit site (`pages-core.jsx` § Accueil, `pages-en.jsx` § AccueilEN) :
   * grille `1.06fr .94fr`, à gauche le titre, le chapô, les boutons et l'aveu ; à droite les
   * quatre territoires en 2 × 2, gouttière 13.
   *
   * La planche responsive dessine, elle, une rangée de quatre pleine largeur SOUS le héros.
   * Les deux existent dans le transfert ; c'est le dessin du kit site qui fait foi ici, sur
   * demande explicite. `row` est donc ramené à `grid` : deux colonnes dans une colonne, ce
   * qui est ce que la maquette montre à 1280 px.
   *
   * LE CHEVRON RESTE. C'est l'autre axe, et il est porté séparément par `TerritoryCard` :
   * le motif `grid` garde l'encoche et supprime le chevauchement. Le kit rend ses cartes en
   * `stacked={false}` — donc `plain`, sans chevron — mais le readme, la planche des points de
   * rupture et le kit responsive veulent tous les trois la silhouette du M, et c'est la
   * position des cartes qui était en cause, pas leur découpe.
   */
  const heroLayout: TerritoryLayout = layout === 'row' ? 'grid' : layout;

  /*
   * La ligne de pied de chaque carte : un compte, puis un prix quand il en existe un.
   *
   * Les libellés NE CONTIENNENT PAS `{{count}}` — seulement le mot, au singulier et au
   * pluriel. Le nombre est rendu à côté, par <Num>, qui seul sait le mettre en monospace
   * tabulaire, citer sa source et poser le séparateur de milliers de la langue. `count` est
   * quand même passé : c'est lui qui choisit la forme, même quand il ne s'écrit pas.
   */
  const pied: Record<string, ReactNode> = {
    forme: (
      <>
        <Num value={nombres.forme} source="db" asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footForme', { count: nombres.forme ?? 0 })}
        {prixFormation !== null && (
          <> · <Num value={prixFormation} unit="F" source="db" asOf={asOf} showAsOf={false} /></>
        )}
      </>
    ),
    informe: (
      <>
        <Num value={nombres.informe} source="db" asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footInforme', { count: nombres.informe ?? 0 })}
      </>
    ),
    transforme: (
      <>
        <Num value={nombres.transforme} source="db" asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footTransforme', { count: nombres.transforme ?? 0 })}
        {' · '}
        <Num value={clubMensuel} unit={t('territories.footPerMonth')} source="server" asOf={asOf} showAsOf={false} />
      </>
    ),
    digitalise: (
      <>
        <Num value={nombres.digitalise} source={{ cite: t('territories.digitaliseCite') }} asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footDigitalise', { count: nombres.digitalise ?? 0 })}
        {prixTpe !== null && (
          <>
            {' · '}{t('territories.footFrom')}{' '}
            <Num value={prixTpe} unit="F" source={{ cite: t('territories.digitaliseCite') }} asOf={asOf} showAsOf={false} />
          </>
        )}
      </>
    ),
  };

  /*
   * LE PIED DES SIX PORTES. Même discipline que ci-dessus, appliquée à des OFFRES et non
   * plus à des territoires : chaque nombre passe par <Num> avec sa source.
   *
   * `agency` n'y figure pas, et c'est le point important de cette grille. `/agence` est
   * livrée sans grille tarifaire, sans logo client, sans témoignage et sans aucun chiffre
   * (FR-053) ; sa carte d'accueil tient la même ligne. Son pied est une phrase, rendue dans
   * la fonte de corps — la mettre en `.mm-num` habillerait de la prose en chiffre vérifié.
   */
  const offerFoot: Record<string, ReactNode> = {
    formations: (
      <>
        <Num value={nombres.forme} source="db" asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footForme', { count: nombres.forme ?? 0 })}
        {prixFormation !== null && (
          <>
            {' · '}{t('territories.footFrom')}{' '}
            <Num value={prixFormation} unit="F" source="db" asOf={asOf} showAsOf={false} />
          </>
        )}
      </>
    ),
    blog: (
      <>
        <Num value={nombres.informe} source="db" asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footInforme', { count: nombres.informe ?? 0 })} · {t('all.footFree')}
      </>
    ),
    media: (
      <>
        <Num value={nombres.transforme} source="db" asOf={asOf} showAsOf={false} />{' '}
        {t('territories.footTransforme', { count: nombres.transforme ?? 0 })} · {t('all.footFree')}
      </>
    ),
    club: (
      <Num value={clubMensuel} unit={t('territories.footPerMonth')} source="server" asOf={asOf} showAsOf={false} />
    ),
    presence: prixTpe !== null
      ? (
        <>
          {t('territories.footFrom')}{' '}
          <Num value={prixTpe} unit="F" source={{ cite: t('territories.digitaliseCite') }} asOf={asOf} showAsOf={false} />
          {' · '}{t('all.footOnce')}
        </>
      )
      : null,
  };

  return (
    <DsNavHost>
      <SEOHead title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} ogImage={DEFAULT_OG_IMAGE} />
      {/* Le balisage ne décrit QUE l'organisation. Pas de `Service` par offre, pas de
          `FAQPage`, pas de `Person` : `/a-propos` porte déjà la personne, et un second
          `Person` qui divergerait d'un champ vaudrait moins que pas de balisage du tout. */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        sameAs: Object.values(SOCIAL_URLS),
      }} />

      <PageSite>
        {/*
          ── 1 · LE HÉROS, DANS LA COMPOSITION DU KIT ─────────────────────────────────
          `PagesCore.js:21-44` : une grille `1.06fr .94fr`, gouttière 44, alignée au centre.
          À GAUCHE le titre, le chapô, les deux boutons ET l'encart de vérité ; à DROITE les
          quatre cartes territoire en grille 2 × 2, gouttière 13.

          Une seule arborescence pour les trois largeurs : l'encart de vérité et les cartes
          sont des enfants de la même grille. Monter deux compositions et en cacher une
          paierait deux fois le rendu — ce que `TerritoryRow` refuse pour la même raison.
        */}
        <div className="grid items-center gap-[44px] pb-4 wide:grid-cols-[1.06fr_.94fr]">
          <div className="min-w-0">
            {/*
              LE SOURCIL NOMME LA PERSONNE AVANT LE VERBE. Le titre dit ce que je fais ; il ne
              disait pas qui le fait, et « Max-Morrys » n'apparaissait nulle part sur sa propre
              page d'accueil — seulement dans la barre haute, qui est du chrome.

              Le précédent est dans le kit : le héros de `/a-propos` pose exactement ce sourcil
              au-dessus d'un `SiteDisplay size={60}`. C'est du monospace de 10,5 px, pas du
              texte de corps : il ne tombe pas sous la règle du premier tiers d'un écran à
              maillage, qui vise les paragraphes lus sous le voile le plus clair.
            */}
            <SiteEyebrow>{t('hero.eyebrow')}</SiteEyebrow>

            {/* 60 px, et les réglages portés par `SiteDisplay` — les valeurs du kit.
                `from={1}` décale la cascade d'un cran : le sourcil occupe le premier. */}
            <SiteDisplay
              lines={t('hero.titleLines', { returnObjects: true }) as string[]}
              size={60}
              from={1}
              style={{ marginTop: '9px' }}
            />

            <p
              className="rv mt-[18px] max-w-[44ch] text-[16.5px] leading-[1.55] text-ink-2"
              style={{ ['--i' as string]: 6 }}
            >
              {t('hero.lede')}
            </p>

            <div className="rv mt-6 flex flex-wrap gap-3" style={{ ['--i' as string]: 7 }}>
              <Button href={path('/formations')} tone="forme" fullWidth={false}>
                {t('hero.ctaCourses')}
              </Button>
              {/* Le kit porte le compte SUR le bouton — c'est ce qui fait cliquer. Tant que la
                  base n'a pas répondu, le libellé reste nu : un zéro n'est pas une mesure. */}
              <Button href={path('/blog')} tone="ghost" fullWidth={false}>
                {counts ? t('hero.ctaBlogCount', { count: counts.publishedArticles }) : t('hero.ctaBlog')}
              </Button>
            </div>

            {/* L'encart de vérité vit DANS la colonne de gauche, sous les boutons, borné à
                52 caractères — `pages-core.jsx`. Il reste au premier écran : une page qui
                s'allonge a plus besoin de nommer ce qu'elle n'affiche pas, pas moins. */}
            <GlassPanel level="truth" className="rv mt-6 max-w-[52ch]" style={{ ['--i' as string]: 8 }}>
              <p className="mm-eyebrow m-0 mb-[6px]">{t('hero.truthTitle')}</p>
              <p className="m-0 text-[13px] leading-[1.55] text-ink-2">{t('hero.truthBody')}</p>
            </GlassPanel>
          </div>

          <TerritoryRow layout={heroLayout}>
            {TERRITORIES.map((territory, i) => (
              <div key={territory.key} className="rv min-w-0" style={{ ['--i' as string]: 6 + i }}>
                <TerritoryCard
                  territory={territory.key}
                  layout={heroLayout}
                  first={i === 0}
                  href={path(territory.to)}
                  meta={t(`territories.${territory.key}Meta`)}
                  title={TERRITORY_VERB[territory.key][language === 'en' ? 'en' : 'fr']}
                  titleSize={20}
                >
                  {/*
                    LA LIGNE DE PIED DU KIT — « 1 formation · 95 000 F », en monospace.
                    C'est elle qui remet les PRIX sur l'accueil : ils en avaient disparu le jour
                    où la carte est passée à un grand nombre surmonté d'un libellé.

                    Chaque nombre passe par <Num>, avec sa source. Le `mm-num` du paragraphe ne
                    porte donc que les mots de liaison : la règle 6 est tenue par les <Num>,
                    pas par la classe.
                  */}
                  <p className="mm-num mt-[26px] mb-0 text-[12px]" style={{ color: 'var(--card-ink-2)' }}>
                    {pied[territory.key]}
                  </p>
                </TerritoryCard>
              </div>
            ))}
          </TerritoryRow>
        </div>
      </PageSite>

      {/*
        ── 2 · JE SUIS MAX-MORRYS ────────────────────────────────────────────────
        Le portrait est une PHOTOGRAPHIE RÉELLE, déposée au dépôt le 01/09/2026. Son chemin
        n'est pas écrit ici : `src/lib/author.ts` est le seul module qui le connaît, et quatre
        chaînes recopiées à la main finiraient par pointer sur deux fichiers différents le jour
        du prochain shooting. L'image générée par IA qui occupait cette place a été retirée.
      */}
      <SiteBand>
        <div className="grid items-center gap-[44px] wide:grid-cols-[.42fr_.58fr]">
          <figure
            /* Le cadre du kit : passe-partout de 14 px en aplat de marque, 4:5 déduit de la
               largeur. Pas de `mx-auto` — à une colonne il décrocherait le portrait du titre
               et des cartes, tous ferrés à gauche. */
            className="rv-s w-full min-w-0 max-w-[340px] rounded-xl p-[14px]"
            style={{
              background:
                'linear-gradient(150deg,var(--mm-orange-c),var(--mm-rose-c) 48%,var(--mm-violet-c))',
              boxShadow: '0 20px 46px color-mix(in srgb, var(--mm-orange) 24%, transparent)',
              ['--i' as string]: 1,
            }}
          >
            <img
              src={portrait.src}
              srcSet={portrait.srcSet}
              /* La largeur AFFICHÉE : la piste de 340 px moins le passe-partout de 2 × 14. */
              sizes="312px"
              width={portrait.width}
              height={portrait.height}
              alt={t('me.portraitAlt')}
              /* Contrairement à `/a-propos`, ce portrait est en DEUXIÈME section : il est sous
                 la ligne de flottaison, et il n'a rien à disputer à la police d'affichage. */
              loading="lazy"
              decoding="async"
              className="block w-full rounded-[18px] object-cover"
              style={{ aspectRatio: '4 / 5' }}
            />
          </figure>

          <div className="min-w-0">
            <SiteEyebrow>{t('me.eyebrow')}</SiteEyebrow>
            <SiteDisplay
              as="h2"
              lines={t('me.titleLines', { returnObjects: true }) as string[]}
              size={34}
              from={1}
            />
            <p className="rv mt-4 max-w-[52ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('me.lede')}{' '}
              {/* L'aveu du kit, mot pour mot. C'est la seule affirmation de cette bande, et
                  elle est déjà celle de `/a-propos` : deux rédactions du même engagement sont
                  une occasion de le contredire, une reprise littérale n'en est pas une. */}
              <b className="text-ink">{t('me.alone')}</b>
            </p>

            <div className="mt-5 grid gap-3 stack:grid-cols-3">
              {DOES.map((item, i) => (
                <GlassPanel level="flat" padding={20} key={item.key} className="rv min-w-0" style={{ ['--i' as string]: i + 5 }}>
                  <span
                    aria-hidden="true"
                    className="grid h-[38px] w-[38px] place-items-center rounded-[12px]"
                    style={{ background: `color-mix(in srgb, ${item.tint} 16%, transparent)` }}
                  >
                    <Icon name={item.glyph} size={19} color={item.ink} />
                  </span>
                  <p className="mt-[13px] mb-0 font-display text-[17px] font-black tracking-[-.03em] text-ink">
                    {t(`me.${item.key}Title`)}
                  </p>
                  <p className="mt-2 mb-0 text-[13.5px] leading-[1.55] text-ink-2">{t(`me.${item.key}Body`)}</p>
                </GlassPanel>
              ))}
            </div>

            <div className="rv mt-5" style={{ ['--i' as string]: 8 }}>
              <Button href={path('/a-propos')} tone="ghost" size="sm" fullWidth={false}>
                {t('me.cta')}
              </Button>
            </div>
          </div>
        </div>
      </SiteBand>

      {/*
        ── 3 · TOUT CE QUE TU PEUX FAIRE ICI ─────────────────────────────────────
        La section qui répond à « qu'est-ce qu'il y a ici ». Les quatre cartes du héros
        nomment des VERBES ; celles-ci nomment des OFFRES, et elles en portent deux que les
        quatre verbes ne peuvent pas porter : le Club, deuxième étage du territoire violet,
        et l'Agence, qui vit à côté des territoires.

        `fill` aligne les six pieds sur une même ligne : c'est sa raison d'être déclarée dans
        la primitive — deux montants qui ne sont pas à la même hauteur ne se comparent plus.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteDisplay as="h2" lines={t('all.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[56ch] text-lede text-ink-2" style={{ ['--i' as string]: 3 }}>
          {t('all.lede')}
        </p>

        <div className="mt-[22px] grid gap-4 stack:grid-cols-2 wide:grid-cols-3">
          {OFFERS.map((offer, i) => (
            <div key={offer.key} className="rv min-w-0" style={{ ['--i' as string]: i + 1 }}>
              <TerritoryCard
                layout="plain"
                fill
                territory={offer.territory}
                href={path(offer.to)}
                padding={22}
                meta={t(`all.${offer.key}Meta`)}
                title={t(`all.${offer.key}Title`)}
                titleSize={19}
              >
                {/* L'élément élastique que `fill` attend de l'appelant : c'est lui qui pousse
                    le pied en bas de piste, quelle que soit la hauteur du sourcil. */}
                <span aria-hidden="true" className="min-h-[22px] flex-1" />
                {offerFoot[offer.key] ? (
                  <p className="mm-num mb-0 text-[12px]" style={{ color: 'var(--card-ink-2)' }}>
                    {offerFoot[offer.key]}
                  </p>
                ) : (
                  /* Aucun chiffre pour l'Agence, donc aucune monospace : la fonte des nombres
                     déclare qu'une valeur vient d'une source, et il n'y a pas de valeur. */
                  <p className="mb-0 text-[12px] leading-[1.5]" style={{ color: 'var(--card-ink-2)' }}>
                    {t('all.agencyFoot')}
                  </p>
                )}
              </TerritoryCard>
            </div>
          ))}
        </div>
      </PageSite>

      {/* ── 4 · Pourquoi ici, et pas ailleurs ───────────────────────────────── */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('why.title', { returnObjects: true }) as string[]} size={34} />
        <div className="mt-6 grid gap-4 stack:grid-cols-3">
          {REASONS.map((reason, i) => (
            <GlassPanel level="flat" padding={24} key={reason.key} className="rv min-w-0" style={{ ['--i' as string]: i + 1 }}>
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

      {/*
        ── 5 · TU AS UN COMMERCE ? ───────────────────────────────────────────────
        « Je te digitalise » est un verbe, pas une offre : personne ne devine ce qu'il y a
        derrière. Cette bande le dit, et elle le dit SETUP-FIRST.

        ⚠️ LE PRIX AFFICHÉ EST UN PRIX D'INSTALLATION, PAYÉ UNE FOIS. Les deux formules
        mensuelles de la grille (175 000 et 225 000 F/mois) n'apparaissent pas ici : le
        premier montant qu'on lit doit être celui qui ouvre la relation, jamais un abonnement.
        `prixTpe` vaut `min(promoPrice ?? price)` — le montant même que `computeTotals()`
        devise derrière le bouton, invariant tenu par `tests/unit/presence-offer.test.ts`.

        Les NOMS des trois packs ne sont pas repris : ils vivent dans le namespace `presence`,
        chargé par sa route. Les recopier ici en ferait une seconde source de vérité.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <div className="grid items-center gap-[44px] wide:grid-cols-2">
          <div className="min-w-0">
            <SiteEyebrow className="text-digitalise-txt">{t('presence.eyebrow')}</SiteEyebrow>
            <SiteDisplay
              as="h2"
              lines={t('presence.titleLines', { returnObjects: true }) as string[]}
              size={34}
              from={1}
            />
            <p className="rv mt-4 max-w-[52ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('presence.desc')}
            </p>

            {prixTpe !== null && (
              <p className="mm-num rv mt-4 mb-0 text-[13px] text-ink-2" style={{ ['--i' as string]: 5 }}>
                {t('presence.from')}{' '}
                <Num value={prixTpe} unit="F" source={{ cite: t('presence.cite') }} asOf={asOf} showAsOf={false} />
                {' · '}{t('presence.once')}
              </p>
            )}

            <div className="rv mt-5" style={{ ['--i' as string]: 6 }}>
              <Button href={path('/presence-digitale')} tone="digitalise" fullWidth={false}>
                {t('presence.cta')}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 stack:grid-cols-2">
            {PRESENCE_POINTS.map((point, i) => (
              <GlassPanel level="flat" padding={20} key={point.key} className="rv min-w-0" style={{ ['--i' as string]: i + 3 }}>
                <span
                  aria-hidden="true"
                  className="grid h-[34px] w-[34px] place-items-center rounded-[10px]"
                  style={{ background: 'color-mix(in srgb, var(--mm-teal) 16%, transparent)' }}
                >
                  {/* Le teal ne porte JAMAIS de texte (2,84:1) — le glyphe prend sa variante
                      texte, comme partout ailleurs dans le dépôt. */}
                  <Icon name={point.glyph} size={17} color="var(--mm-teal-t)" />
                </span>
                <p className="mt-[11px] mb-0 font-display text-[16px] font-black tracking-[-.03em] text-ink">
                  {t(`presence.points.${point.key}Title`)}
                </p>
                <p className="mt-1.5 mb-0 text-[13px] leading-[1.55] text-ink-2">
                  {t(`presence.points.${point.key}Body`)}
                </p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </PageSite>

      {/*
        ── 6 · COMMENCE GRATUITEMENT ─────────────────────────────────────────────
        Contenu inchangé. La section passe de `PageSite` à `SiteBand` pour la seule raison du
        rythme : sans elle, trois sections neutres se suivraient et le site perdrait sa
        respiration sur la moitié basse de sa page d'accueil.
      */}
      <SiteBand>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SiteDisplay as="h2" lines={t('free.title', { returnObjects: true }) as string[]} size={34} />
          <Button href={path('/blog')} tone="quiet" size="sm" fullWidth={false}>
            {t('free.all')}
          </Button>
        </div>

        {starters.length > 0 ? (
          <div className="mt-[22px] grid gap-4 stack:grid-cols-3">
            {starters.map((starter, i) => (
              <div key={starter.to} className="rv min-w-0" style={{ ['--i' as string]: i + 1 }}>
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
      </SiteBand>

      {/*
        ── 7 · PAR OÙ TU COMMENCES ───────────────────────────────────────────────
        Deux portes, et pas une de plus : ce qui s'achète seul, et une conversation. Le
        second bouton mène au contact et non à un formulaire d'agence — c'est la même
        personne qui répond aux deux, et la page le dit.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteDisplay as="h2" lines={t('end.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-4 max-w-[56ch] text-lede text-ink-2" style={{ ['--i' as string]: 3 }}>
          {t('end.lede')}
        </p>
        <div className="rv mt-6 flex flex-wrap gap-3" style={{ ['--i' as string]: 4 }}>
          <Button href={path('/formations')} tone="forme" fullWidth={false}>
            {t('end.ctaCourses')}
          </Button>
          <Button href={path('/contact')} tone="ghost" fullWidth={false}>
            {t('end.ctaContact')}
          </Button>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
