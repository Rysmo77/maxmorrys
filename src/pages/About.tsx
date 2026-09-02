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
import { HOUSE_AUTHOR_FULL_NAME, portrait } from '../lib/author';
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
 * 2. LE PORTRAIT GÉNÉRÉ PAR IA. Il avait été remplacé par un EMPLACEMENT DÉCLARÉ, pas par
 *    une autre image : sur la seule page dont le métier est d'inspirer confiance, une image
 *    synthétique est le pire endroit possible.
 *    ✅ CLOS LE 01/09/2026 (FR-084) — une photographie réelle, retouchée, en 4:5, occupe
 *    désormais le héros. Le chemin vit dans `src/lib/author.ts`, avec la découpe carrée qui
 *    signe les articles ; l'emplacement déclaré et ses deux clés i18n sont partis avec lui.
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
 * DEUX EMPLACEMENTS DÉCLARÉS survivent à la place de ce qui manque — ils NOMMENT le manque au
 * lieu de le combler : les preuves de jalons, et les liens de profils à confirmer. Ils étaient
 * trois ; celui du portrait s'est fermé le 01/09/2026, ce qui est exactement ce qu'un
 * emplacement déclaré est censé finir par faire. Voir `SiteSlot` et le rapport de
 * recomposition pour les deux endroits où la copie du kit a dû être corrigée contre la donnée
 * réelle du dépôt.
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

/**
 * ── LA FRISE, EN TROIS CHAPITRES ────────────────────────────────────────────────────────
 *
 * Onze jalons en une colonne, chacun avec sa description : la section faisait à elle seule
 * plus d'un écran et demi, sur une page dont le rôle est de rassurer AVANT l'achat. Le kit,
 * lui, n'en dessine que trois et pose un emplacement « trois à cinq jalons à ajouter » — la
 * longueur est donc un écart, pas une fidélité.
 *
 * Les onze restent TOUS visibles : cacher une date sur la page dont le métier est de donner
 * des dates vérifiables serait le contraire du but. Ils sont groupés par chapitre, et les
 * trois chapitres passent côte à côte au-delà de 1080 px — la hauteur est divisée par trois
 * sans qu'aucun fait ne disparaisse.
 *
 * LES CHAPITRES SONT UNE INFORMATION, PAS UN ORNEMENT : ils nomment les trois temps que la
 * frise raconte déjà — la formation, le basculement vers le digital, la construction. C'est
 * pour ça qu'ils portent leur intervalle d'années plutôt qu'un numéro.
 */
const CHAPTERS = [
  { key: 'learn', items: ['m2014', 'm2017', 'm2018', 'm2020'] },
  { key: 'pivot', items: ['m2021', 'm2023Onoma', 'm2023Master'] },
  { key: 'build', items: ['m2024Jan', 'm2024May', 'm2025Apr', 'm2025'] },
] as const;

/**
 * ── LA PREUVE PUBLIQUE D'UN JALON ───────────────────────────────────────────────────────
 *
 * Une date, un établissement, un employeur : tout ça est DÉCLARÉ par une personne. Sur une
 * page qui remplace la preuve sociale, la seule chose qui vaut mieux qu'une déclaration est
 * un lien qu'un inconnu peut ouvrir sans me croire.
 *
 * Chaque jalon peut donc porter une URL. Quand elle existe, la ligne affiche « Vérifier ↗ » ;
 * quand elle n'existe pas, elle affiche « déclaré » — et l'emplacement en bas de section
 * compte ce qui manque, au lieu de laisser croire que tout est sourcé.
 *
 * CE QUI FAIT UNE PREUVE ACCEPTABLE ICI, par ordre de force :
 *   1. une page du TIERS qui te nomme (un employeur, une école, une association) ;
 *   2. une réalisation en ligne que tu as construite — `src/lib/brand/clients.ts` en porte
 *      quatorze, toutes avec leur URL, et c'est la source la plus solide dont dispose cette
 *      page depuis que les accords écrits sont obtenus ;
 *   3. un profil public que TU tiens (LinkedIn), qui prouve la déclaration, pas le fait.
 *
 * Ce qui n'en est pas une : un annuaire tiers recopié, une capture d'écran, un chiffre.
 */
const MILESTONE_PROOFS: Partial<Record<string, string>> = {
  // À remplir au fil des accords : `m2024Jan: 'https://…/equipe'`, etc.
};

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
      <p className="mm-prose m-0 mt-[7px] max-w-[58ch] text-meta leading-[1.55] text-ink-2">{children}</p>
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
        name: HOUSE_AUTHOR_FULL_NAME,
        url: `${SITE_URL}/a-propos`,
        // La même image que le héros, en absolu : c'est la vignette que Google pose à côté
        // du nom dans un panneau de connaissance. Elle n'existait pas tant que la page
        // n'avait pas de portrait — déclarer l'ancien, généré, aurait été le pire des deux.
        image: `${SITE_URL}${portrait.src}`,
        jobTitle: 'Marketing & Growth Manager',
        worksFor: { '@type': 'Organization', name: 'Eyone Medical' },
        address: { '@type': 'PostalAddress', addressLocality: legalEntity.city, addressCountry: legalEntity.countryCode },
        sameAs: [...SOCIAL_URLS],
      }} />

      <PageSite>
        {/* ── 1 · Le héros — le positionnement, puis l'aveu ─────────────────── */}
        {/*
          LA COLONNE DU PORTRAIT EST FIXE, PAS PROPORTIONNELLE.

          `1.04fr / .96fr` partageait la page en deux moitiés quasi égales — une règle qui a du
          sens pour deux blocs de contenu, aucun pour une personne : un portrait a une taille
          naturelle, et la moitié d'une page n'en est pas une. À la mesure du kit, cette moitié
          fait 554 px pour un 4:5 qui n'en veut que 380 ; le reste devenait du vide entre le
          texte et l'image, et l'image y flottait sans bord à quoi s'aligner.

          380 px de piste, donc, et la prose prend tout ce qui reste. `minmax(0,1fr)` et non
          `1fr` : une piste `fr` garde `min-width:auto` et refuse de descendre sous son contenu
          — c'est le même défaut que celui déjà corrigé au panneau des profils, plus bas.
        */}
        <div className="grid items-center gap-[46px] pb-[14px] wide:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <SiteEyebrow>{t('page.eyebrow')}</SiteEyebrow>
            {/* Écrit ligne par ligne, jamais replié (AD-13). */}
            <SiteDisplay
              arc
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
            LE PORTRAIT. FR-084 est CLOS : la photographie est réelle, en 4:5, et elle remplace
            l'emplacement déclaré qui disait publiquement pourquoi il n'y en avait pas.

            LE DÉGRADÉ NE DISPARAÎT PAS SOUS L'IMAGE, IL DEVIENT SON CADRE. Les trois pastels
            du kit — `PagesCore.js:392`, `#FFDCA8 → #FFC9CE 48% → #DFD0FF`, déjà déclarés en
            jetons — tenaient toute la place quand il n'y avait rien à montrer. Ils restent
            visibles en passe-partout de 14 px : c'est la seule surface de la page qui porte la
            couleur de marque en aplat, et la perdre coûterait au héros sa signature.
            (La production posait ici `--action-informe`, le dégradé d'ACTION : un orange
            saturé de bouton, à la place d'une plage de couleur.)

            LA PROPORTION COMMANDE, LA HAUTEUR SUIT. Le `400px` d'origine tenait parce qu'un
            bloc de couleur se moque de sa proportion ; une personne, non. Le cadre remplit
            maintenant sa piste de 380 px et le 4:5 déduit la hauteur — une seule règle, la
            même à toutes les largeurs, là où un `clamp` de hauteur faisait varier le cadrage
            du portrait d'un écran à l'autre sans que personne l'ait demandé.
          */}
          <figure
            /* PAS DE `mx-auto`. Dans la piste de 380 px, le cadre remplit exactement — centrer
               n'y change rien. À une colonne, en revanche, le centrer le décrochait du titre,
               du chapô et des deux boutons, tous alignés à gauche : entre 700 et 1080 px, le
               portrait flottait seul au milieu d'une pile ferrée à gauche. La marge de
               `<figure>` est déjà remise à zéro par le préflet Tailwind. */
            className="rv-s w-full max-w-[380px] rounded-xl p-[14px]"
            style={{
              background:
                'linear-gradient(150deg,var(--mm-orange-c),var(--mm-rose-c) 48%,var(--mm-violet-c))',
              boxShadow: '0 20px 46px color-mix(in srgb, var(--mm-orange) 24%, transparent)',
              ['--i' as string]: 5,
            }}
          >
            <img
              src={portrait.src}
              srcSet={portrait.srcSet}
              /* La largeur AFFICHÉE, pas celle du fichier : la piste de 380 px moins le
                 passe-partout de 2 × 14. Constante à toutes les ruptures, comme le cadre. */
              sizes="352px"
              width={portrait.width}
              height={portrait.height}
              alt={t('page.portraitAlt')}
              /* Le portrait est au-dessus de la ligne de flottaison : ni `lazy`, ni différé.
                 `fetchPriority` le sort de la file d'attente des images ordinaires — il entre
                 en concurrence avec la police d'affichage, et c'est lui qu'on veut d'abord. */
              fetchPriority="high"
              decoding="async"
              className="block w-full rounded-[18px] object-cover"
              /* La proportion en style plutôt qu'en classe : sans elle, `w-full` laisserait
                 l'image retomber sur ses 800 × 1000 intrinsèques et casserait le cadre. */
              style={{ aspectRatio: '4 / 5' }}
            />
          </figure>
        </div>
      </PageSite>

      {/* ── 2 · Ce que je fais, concrètement ─────────────────────────────────── */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('page.doesTitle', { returnObjects: true }) as string[]} size={34} />
        <div className="mt-6 grid gap-4 stack:grid-cols-3">
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
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <div className="grid items-start gap-[46px] wide:grid-cols-[1fr_.9fr]">
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
              Elle a quitté cette colonne pour la pleine largeur, plus bas.
            */}

            {/*
              LE PANNEAU « SEUL » A CHANGÉ DE COLONNE, ET C'EST UNE CORRECTION DE VIDE.

              Quand la frise a migré en pleine largeur, cette colonne s'est retrouvée avec un
              titre et trois lignes de chapô face à deux panneaux qui en font 450 : environ
              280 px de blanc mort sous le texte, à la rupture même où la page a le plus de
              place. Ramener ce panneau ici referme le trou par les deux bouts — les colonnes
              finissent à hauteur voisine, et le tri devient lisible : la PROSE avec la prose
              à gauche, les NOMBRES avec les nombres à droite.
            */}
            <GlassPanel level="flat" padding={24} className="rv mt-[18px]" style={{ ['--i' as string]: 3 }}>
              <SiteEyebrow style={{ margin: 0 }}>{t('page.soloTitle')}</SiteEyebrow>
              <p className="mm-prose mt-[9px] mb-0 max-w-[46ch] text-[14.5px] leading-[1.6] text-ink-2">
                {t('page.soloBody')} <b className="text-ink">{t('page.soloStrong')}</b>
              </p>
            </GlassPanel>
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
              <p className="mm-prose m-0 max-w-[46ch] text-meta leading-[1.55] text-ink-2">
                {t('page.producedBody')} <b className="text-ink">{t('page.producedStrong')}</b>
              </p>
            </GlassPanel>
          </div>
        </div>

        {/*
          LA FRISE EST PLEINE LARGEUR, sous les deux colonnes.

          Elle vivait dans la colonne de gauche d'une grille `1fr .9fr`. Trois chapitres côte
          à côte n'y tiennent pas : ils y seraient revenus en une seule colonne, c'est-à-dire
          à la hauteur qu'on cherchait précisément à réduire. Le titre et le chapô restent en
          haut avec les deux panneaux de droite ; la matière vérifiable prend toute la largeur.
        */}
        <div className="mm-section">
          {/*
            DEUX COLONNES DÈS 700 PX, TROIS AU-DELÀ DE 1080.

            La frise ne passait à trois colonnes qu'à `wide`. En dessous — tablettes, portables
            de 1024, c'est-à-dire une grosse part des visites — les onze jalons revenaient en
            UNE colonne, soit près de 1 200 px de haut sur la section qu'on avait justement
            raccourcie. La rupture intermédiaire existe déjà dans le système (`stack`, 700 px)
            et n'était pas servie. Deux colonnes en divisent la hauteur par deux, et l'ordre
            chronologique tient : la lecture reste gauche-droite puis dessous.
          */}
          <div
            className="rv mt-[26px] grid gap-7 stack:grid-cols-2 stack:gap-6 wide:grid-cols-3"
            style={{ ['--i' as string]: 3 }}
          >
            {CHAPTERS.map((chapter) => (
              <section key={chapter.key} aria-label={t(`chapters.${chapter.key}.title`)}>
                {/* L'intertitre porte son INTERVALLE d'années : c'est ce qui fait du
                    chapitre une information plutôt qu'un séparateur décoratif. */}
                <p className="mm-eyebrow m-0 flex flex-wrap items-baseline gap-x-2">
                  {t(`chapters.${chapter.key}.title`)}
                  <span style={{ color: 'var(--ink-3)' }}>{t(`chapters.${chapter.key}.range`)}</span>
                </p>

                <div
                  className="mt-[14px] pl-[22px]"
                  style={{ borderLeft: '2px solid var(--fill-3)' }}
                >
                  {chapter.items.map((key, i) => {
                    const proof = MILESTONE_PROOFS[key];
                    return (
                      <div
                        key={key}
                        className="relative"
                        style={{ paddingBottom: i === chapter.items.length - 1 ? 0 : '22px' }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute left-[-29px] top-[5px] h-3 w-3 rounded-full"
                          style={{ background: 'var(--surface-page)', border: '2.5px solid var(--mm-orange)' }}
                        />
                        <p className="m-0 flex flex-wrap items-baseline gap-x-[6px] text-[11px] text-ink-2">
                          <Num
                            value={t(`milestones.${key}.year`)}
                            source={{ cite: t('page.pathCite') }}
                            asOf={DECLARED_AT}
                          />
                          <span>· {t(`milestones.${key}.lieu`)}</span>
                        </p>
                        <b className="mt-[3px] block text-[15px] font-bold text-ink">
                          {t(`milestones.${key}.title`)}
                        </b>
                        <p className="mm-prose mt-[5px] mb-0 max-w-[52ch] text-meta leading-[1.5] text-ink-2">
                          {t(`milestones.${key}.desc`)}
                        </p>
                        {/*
                          LA PREUVE, OU SON ABSENCE — jamais rien. Un lien qu'on peut ouvrir
                          quand il existe ; le mot « déclaré » quand il n'existe pas. Laisser
                          la ligne muette reviendrait à présenter une déclaration comme un
                          fait vérifié, ce qui est exactement ce que cette page refuse.
                        */}
                        {proof ? (
                          <a
                            href={proof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mm-eyebrow mt-[6px] inline-flex items-center gap-[5px]"
                            style={{ color: 'var(--mm-bleu)' }}
                          >
                            {t('page.pathProofLabel')}
                            <Icon name="forward" size={11} strokeWidth={2.6} />
                          </a>
                        ) : (
                          <span className="mm-eyebrow mt-[6px] block" style={{ color: 'var(--ink-3)' }}>
                            {t('page.pathDeclared')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Emplacement déclaré nº 2 — ce que la frise ne peut toujours pas prouver. */}
          <SiteSlot title={t('page.slotPathTitle')} style={{ marginTop: '18px' }}>
            {t('page.slotPathBody')} <b className="text-ink">{t('page.slotPathStrong')}</b>
          </SiteSlot>
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

        <div className="mt-[22px] grid gap-4 stack:grid-cols-3">
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
          <div className="grid gap-6 stack:grid-cols-3">
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
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <div className="grid items-center gap-[44px] wide:grid-cols-[.95fr_1.05fr]">
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
          {/*
            `min-w-0` : à une colonne, l'élément de grille garde `min-width: auto` et refuse
            de descendre sous la largeur minimale de son contenu. Mesuré à 377 px pour une
            piste de 333 — et comme les deux enfants partagent la colonne, le titre et le
            paragraphe de gauche s'élargissaient avec le panneau, donc toute la page.
          */}
          <GlassPanel level="flat" padding={24} className="min-w-0 rv" style={{ ['--i' as string]: 3 }}>
            {socialLinks.map((profile, i) => (
              <a
                key={profile.name}
                href={profile.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 py-[11px] no-underline"
                style={i ? { borderTop: '1px solid var(--border-hair)' } : undefined}
              >
                {/* `flexShrink: 0` : la pastille garde ses 34 px quand la rangée se serre. */}
                <Avatar
                  initials={profile.name.slice(0, 1)}
                  size={34}
                  background={i % 2 ? 'var(--action-informe)' : 'var(--action-forme)'}
                  style={{ borderRadius: '11px', flexShrink: 0 }}
                />
                <span className="min-w-0 flex-1">
                  <b className="block text-[14px] text-ink">{profile.name}</b>
                  <span className="block truncate text-[12px] text-ink-2">
                    {profile.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </span>
                {/*
                  TON NEUTRE, PAS « OK ».

                  Le kit distingue ici deux états : `ok` « Déclaré » sur le seul profil tenu, et
                  `warn` « Vide » sur les trois autres (`PagesCore.js:381-383`). C'est le seul
                  écran où la contrainte d'opérateur unique se voit, et cette distinction EST le
                  propos de la section.

                  La production affichait `ok` sur les six. Le vert dit « c'est en ordre » — une
                  affirmation que rien dans le produit ne peut soutenir : aucun champ ne dit si
                  un profil est alimenté. Le ton neutre retire l'affirmation sans en inventer
                  une autre : le lien est déclaré, c'est tout ce qu'on sait.

                  Le jour où `socialLinks` porte un état, la distinction du kit revient telle
                  quelle — voir [[maxmorrys-todo-humains]].
                */}
                <span className="shrink-0"><Tag>{t('page.findDeclared')}</Tag></span>
              </a>
            ))}
          </GlassPanel>
        </div>

        {/* ── 6 · L'appel final ─────────────────────────────────────────────── */}
        <div
          className="rv mm-section grid items-center gap-9 rounded-xl p-[34px] wide:grid-cols-[1.2fr_.8fr]"
          style={{
            /* Les TROIS arrêts du kit — `PagesCore.js:530` : orange, corail à 58 %, violet.
               `--action-informe` n'en a que deux et s'arrête au corail : la moitié violette du
               dégradé manquait, et c'est elle qui porte le texte blanc à un contraste tenable. */
            background:
              'linear-gradient(140deg,var(--mm-orange),var(--mm-corail) 58%,var(--mm-violet))',
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
          {/*
            LES BOUTONS SONT BORNÉS, ET FERRÉS À DROITE.

            `Button` remplit sa colonne par défaut, et la colonne `.8fr` en fait 460 à la
            mesure du kit : deux mots au centre d'une piste de 460 px, deux fois de suite. Un
            bouton dont la cible dépasse largement son libellé ne se lit plus comme un bouton,
            il se lit comme une barre. 260 px suffisent aux deux libellés dans les deux
            langues — « Contacte-moi » et « Talk to me » — et le ferrage à droite raccroche la
            pile au bord du bloc plutôt que de la laisser flotter.
          */}
          <div className="flex flex-col gap-[10px] wide:ml-auto wide:w-[260px]">
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
