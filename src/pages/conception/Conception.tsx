import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CheckLine, GlassPanel, Icon, Tag } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import JsonLd from '../../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../../components/seo/seo-config';
import DsNavHost from '../../components/layout/DsNavHost';
import MyOnomaBridge from '../../components/brand/MyOnomaBridge';
import { ConceptionSubNav } from '../../components/navigation/PisteSubNav';
import StepList from '../../components/conception/StepList';
import { ClientWorkCard, VentureWorkCard } from '../../components/conception/WorkCard';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow, SiteExit } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import {
  categoryKey,
  clientProjects,
  corporateUrl,
  legalEntity,
  legalName,
  practices,
  ventures,
} from '../../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /conception — LA PAGE MÈRE DE LA PISTE CONCEPTION.  CDC du 14/09/2026, § 4.2.
 *
 * Elle remplace `/agence`, dont elle absorbe le contenu. Ce n'est pas un renommage
 * d'URL : c'est un changement de ce que la page est censée faire.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE `/agence` FAISAIT, ET QUI NE PEUT PAS SURVIVRE ICI
 *
 * 1. ELLE PARLAIT À LA PREMIÈRE PERSONNE DU SINGULIER — « je te réponds sous 48 h ».
 *    Le tutoiement est un actif de marque sur la piste APPRENDRE, où quelqu'un vient
 *    se former. Il n'a jamais été le bon registre pour un directeur de système
 *    d'information qui cherche un prestataire de plateforme, et le CDC tranche : la
 *    piste Conception vouvoie, dit « nous / vous », et tient le registre de studio.
 *    ⚠️ `tests/unit/voix-tutoiement.test.ts` porte DEUX règles, pas une exemption : les
 *    catalogues hors piste Conception ne vouvoient jamais, et `conception.json` comme
 *    `realisations.json` ne tutoient jamais. Les deux sens sont gardés.
 *
 * 2. ELLE NE MONTRAIT QU'UN SEUL NIVEAU D'ENGAGEMENT. `/agence` renvoyait vers
 *    Présence Digitale au détour d'une bande, comme une porte de service — « ce n'est
 *    pas un lot de consolation », disait la copie, ce qui est précisément ce qu'on
 *    écrit quand ça en a l'air. Les deux niveaux sont désormais MONTRÉS ENSEMBLE, dans
 *    la même bande, avec la même forme de carte : l'un affiche ses prix, l'autre se
 *    cadre avant d'être chiffré, et aucun des deux n'est caché derrière l'autre.
 *
 * 3. ELLE PORTAIT LE FORMULAIRE DANS SON HÉROS. Une page mère qui demande de qualifier
 *    un besoin avant d'avoir dit ce qu'elle sait faire choisit à la place du visiteur.
 *    Le formulaire descend d'un étage, sur `/conception/projets-sur-mesure`, où il
 *    s'adresse à quelqu'un qui a déjà reconnu son niveau.
 *
 * 4. ELLE MONTAIT L'INDEX COMPLET DES QUATORZE RÉALISATIONS. L'index a désormais sa
 *    propre route (`/conception/realisations`) : ici, un aperçu de trois, et le lien.
 *    Ce n'est pas qu'une question de longueur — `ClientWorkIndex` déclenche une capture
 *    externe par projet sélectionné, et la page mère est la première vue de la piste.
 *    L'aperçu ci-dessous n'appelle aucun service de capture.
 *
 * 5. ELLE PORTAIT LE BLOC DES VENTURES — et c'est la seule chose de `/agence` qui devait
 *    revenir À L'IDENTIQUE. Le bloc « Products built inside MY ONOMA » a failli se perdre
 *    dans la refonte : `VentureCard` s'est retrouvé sans aucun point de montage, et les
 *    trois ventures sont redevenues du code invisible — l'état exact que `/agence` avait
 *    corrigé quelques semaines plus tôt. Il est remonté ici, en bande séparée.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * CE QUE LA PAGE NE VEND PAS, ET NE VENDRA PAS. Direction marketing, stratégie de
 * marque, acquisition : ces métiers sont portés par MY ONOMA, et le passage se fait par
 * `<MyOnomaBridge variant="panel" />`. On renvoie, on ne vend pas — c'est la règle 6 du
 * contrat d'implémentation, et l'encart de vérité du héros la dit à voix haute plutôt
 * que de la laisser se deviner d'une absence.
 *
 * ⚠️ L'ATTRIBUTION SE FAIT À DEUX ÉTAGES, ET IL FAUT DIRE LEQUEL. Cette page attribuait
 * « acquisition » à My Onoma pendant que la page sœur, À propos et Contact l'attribuaient à
 * Cléa Growth Office : deux étages de la même organisation, nommés chacun sans le dire, donc
 * lus comme une contradiction. La règle est tranchée — ce qui n'est pas vendu ici relève de
 * MY ONOMA, LA SOCIÉTÉ ; le routage opérationnel d'une demande relève de Cléa Growth Office,
 * SA PRACTICE CROISSANCE, et ne se nomme qu'à l'écran d'envoi du formulaire, une fois la
 * demande partie.
 *
 * ⚠️ LE NOM VIENT DE `lib/brand`, PAS DU JSON. Il s'écrit « MY ONOMA » en capitales, et le
 * code fait foi (`lib/brand/company.ts`). Recopié dans un catalogue, il dérivait déjà : les
 * deux langues écrivaient « My Onoma ». Même motif qu'`about:page.treeSentence` — le
 * catalogue porte la phrase, `{{company}}` porte le nom.
 *
 * UNIVERS VISUEL : `agency` (`lib/sectionThemes.ts`) — corail en version TEXTE
 * (`text-corail-txt`, AD-20), et AUCUN maillage. La piste Conception ne se range pas
 * sous les quatre verbes, exactement comme `/agence` avant elle.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Décalage de la cascade d'entrée. Une seule écriture pour toute la page. */
const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

/**
 * L'APERÇU DE RÉALISATIONS — les trois premières de `clientProjects`, dans l'ordre du
 * module.
 *
 * Ce choix est délibérément MÉCANIQUE. Élire « les trois meilleures » demanderait un
 * critère, et le dépôt n'en porte aucun : `clients.ts` interdit nommément les résultats,
 * les métriques et les témoignages, donc il n'existe pas de donnée qui départage deux
 * projets. Un ordre de source se lit, se vérifie, et ne prétend rien.
 *
 * ⚠️ Aucune organisation n'est écrite ici. Les noms, domaines et catégories viennent tous
 * de `src/lib/brand/clients.ts`, seule liste autorisée à en porter.
 */
const PREVIEW_COUNT = 3;

export default function Conception() {
  const { t } = useTranslation('conception');
  /* Les appels partagés vivent dans `common`, les sept catégories dans `shared` : deux
     catalogues de base, chargés partout, donc rien de plus à déclarer sur la route. */
  const { t: tc } = useTranslation('common');
  const { t: ts } = useTranslation('shared');
  const path = useLocalizedPath();

  const build = practices.build;

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: build.brand,
        serviceType: build.discipline,
        description: t('seo.description'),
        url: buildCanonical('/conception'),
        brand: { '@type': 'Brand', name: build.brand },
        /*
         * ⚠️ `provider` = MY ONOMA SARL, `brand` = Max-Morrys Agency. Max-Morrys Agency est
         * une MARQUE, pas une personne morale : il ne doit jamais exister d'`Organization`
         * autonome portant ce nom. Reconduit tel quel depuis `/agence`.
         */
        provider: {
          '@type': 'Organization',
          name: legalName,
          url: corporateUrl,
          address: {
            '@type': 'PostalAddress',
            streetAddress: legalEntity.registeredAddress,
            addressLocality: legalEntity.city,
            addressCountry: legalEntity.countryCode,
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Max-Morrys', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: t('seo.title'), item: buildCanonical('/conception') },
        ],
      },
    ],
    [t, build.brand, build.discipline],
  );

  const studioItems = useMemo(() => t('page.studioItems', { returnObjects: true }) as string[], [t]);
  const shopsPoints = useMemo(() => t('levels.shops.points', { returnObjects: true }) as string[], [t]);
  const customPoints = useMemo(() => t('levels.custom.points', { returnObjects: true }) as string[], [t]);
  const steps = useMemo(
    () => t('method.steps', { returnObjects: true }) as { n: string; title: string; body: string }[],
    [t],
  );
  const guarantees = useMemo(
    () => t('guarantees.items', { returnObjects: true }) as { title: string; body: string }[],
    [t],
  );
  /* La liste vient du module de marque, jamais d'un tableau recopié dans la page. */
  const preview = useMemo(() => clientProjects.slice(0, PREVIEW_COUNT), []);

  return (
    <DsNavHost>
      <SEOHead
        title={t('seo.title')}
        description={t('seo.description')}
        canonical={buildCanonical('/conception')}
        frPath="/conception"
        enPath="/en/design"
      />
      <JsonLd data={jsonLd} />

      <PageSite>
        {/* La sous-navigation de piste est une primitive de PAGE : elle vit DANS le
            `PageSite`, en tête, et elle existe aux trois largeurs. `active={null}` parce
            que la page mère n'est aucun des trois niveaux. */}
        <ConceptionSubNav active={null} />

        {/* ── LE HÉROS — le studio à gauche, ce qu'il fait à droite ─────────── */}
        <div className="mm-arc-host mt-[26px] grid items-center gap-11 pb-[14px] wide:grid-cols-[1.05fr_.95fr]">
          <div>
            {/* La seule marque de couleur de la piste, et sa version TEXTE : #FF6E7F fait
                2,70:1 sur blanc et ne porte jamais de texte (AD-20). */}
            <SiteEyebrow className="text-corail-txt">
              {t('page.eyebrow', { brand: build.brand })}
            </SiteEyebrow>

            <SiteDisplay
              arc
              lines={t('page.titleLines', { returnObjects: true }) as string[]}
              size={46}
              from={1}
              style={{ marginTop: '9px' }}
            />

            <p className="rv mt-4 max-w-[48ch] text-[16px] leading-[1.55] text-ink-2" style={rv(5)}>
              {t('page.lede')}
            </p>

            {/*
              L'ENCART DE VÉRITÉ — il nomme ce que la page NE vend pas, et où ça se vend.
              Une absence silencieuse se lit comme une lacune ; une absence motivée se lit
              comme une frontière, et c'est ce qu'elle est.
            */}
            <GlassPanel level="truth" className="rv mt-[22px] max-w-[52ch]" style={rv(6)}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('page.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.6] text-ink-2">
                {t('page.truthStart')}
                <b className="text-ink">{t('page.truthStrong', { company: legalEntity.name })}</b>
                {t('page.truthEnd')}
              </p>
            </GlassPanel>
          </div>

          {/* ── CE QUE FAIT LE STUDIO — le seul panneau héros de la page ─────── */}
          <GlassPanel level="hero" padding={26} className="rv" style={rv(6)} as="section">
            <SiteEyebrow style={{ margin: 0 }}>{t('page.studioEyebrow')}</SiteEyebrow>
            <p className="mt-2 mb-0 text-[15px] leading-[1.6] text-ink-2">{t('page.studioLede')}</p>
            <div className="mt-4">
              {studioItems.map((item) => (
                <CheckLine key={item} tone="neutre">
                  {item}
                </CheckLine>
              ))}
            </div>
          </GlassPanel>
        </div>
      </PageSite>

      {/*
        ── LES DEUX NIVEAUX D'ENGAGEMENT ───────────────────────────────────────────────
        Le point n°2 du CDC, et le seul endroit de la refonte où la mise en page PORTE la
        décision : deux cartes de même forme, de même taille, dans la même grille. Une
        carte plus haute que l'autre, ou l'une en pleine largeur et l'autre en encart,
        rétablirait la hiérarchie que le CDC refuse.
      */}
      <SiteBand>
        <SiteEyebrow>{t('levels.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('levels.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[60ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('levels.lede')}
        </p>

        <div className="mt-[22px] grid items-stretch gap-[18px] wide:grid-cols-2">
          {/* Le niveau productisé porte le teal : « Je te digitalise » est un des quatre
              verbes, et c'est le seul des deux niveaux qui s'y range. */}
          <GlassPanel
            level="flat"
            padding={26}
            className="rv flex h-full flex-col"
            style={{ ...rv(1), borderColor: 'color-mix(in srgb, var(--mm-teal) 24%, transparent)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="m-0 font-display text-[21px] font-black tracking-[-.03em] text-ink">
                {t('levels.shops.title')}
              </p>
              <Tag>{t('levels.shops.tag')}</Tag>
            </div>
            <p className="mt-3 mb-0 text-[14.5px] leading-[1.6] text-ink-2">{t('levels.shops.body')}</p>
            <div className="mt-3">
              {shopsPoints.map((point) => (
                <CheckLine key={point} tone="ok">
                  {point}
                </CheckLine>
              ))}
            </div>
            {/* `ghost` DES DEUX CÔTÉS — c'est ce qui tient la contrainte du CDC : deux
                niveaux de poids strictement égal. Un ton plein d'un côté et un lien nu de
                l'autre rétablirait la hiérarchie que la bande existe pour refuser. La
                distinction teal / corail reste portée par la bordure de la carte.
                ⚠️ Corollaire : la carte de niveau ne peut PAS devenir un lien pleine carte —
                un `<a>` dans un `<a>` est invalide. */}
            <Button
              href={path('/conception/commerces-et-tpe')}
              tone="ghost"
              size="sm"
              fullWidth={false}
              className="mt-5"
            >
              {t('levels.shops.cta')}
              <Icon name="forward" size={16} />
            </Button>
          </GlassPanel>

          <GlassPanel
            level="flat"
            padding={26}
            className="rv flex h-full flex-col"
            style={{ ...rv(2), borderColor: 'color-mix(in srgb, var(--mm-corail) 28%, transparent)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="m-0 font-display text-[21px] font-black tracking-[-.03em] text-ink">
                {t('levels.custom.title')}
              </p>
              <Tag>{t('levels.custom.tag')}</Tag>
            </div>
            <p className="mt-3 mb-0 text-[14.5px] leading-[1.6] text-ink-2">{t('levels.custom.body')}</p>
            <div className="mt-3">
              {customPoints.map((point) => (
                <CheckLine key={point} tone="neutre">
                  {point}
                </CheckLine>
              ))}
            </div>
            <Button
              href={path('/conception/projets-sur-mesure')}
              tone="ghost"
              size="sm"
              fullWidth={false}
              className="mt-5"
            >
              {t('levels.custom.cta')}
              <Icon name="forward" size={16} />
            </Button>
          </GlassPanel>
        </div>
      </SiteBand>

      {/* ── LA MÉTHODE ───────────────────────────────────────────────────────── */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteEyebrow>{t('method.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('method.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('method.lede')}
        </p>

        {/* Le DESSIN de la bande est partagé avec `/conception/projets-sur-mesure` ; son
            CONTENU ne l'est plus. Ici, la méthode de travail — celle dont `method.lede`
            affirme qu'elle est la même aux deux niveaux d'engagement, ce qui n'était vrai
            qu'une fois l'autre bande sortie du registre « méthode ». */}
        <StepList steps={steps} />
      </PageSite>

      {/*
        ── LES GARANTIES TECHNIQUES ────────────────────────────────────────────────────
        Quatre engagements que le CDC nomme, et qui ont tous la même propriété : ils se
        vérifient SUR LE LIVRABLE. Aucun d'eux n'est un chiffre — ce serait une promesse
        qu'on demande de croire, et AD-5 ferme ce chemin de toute façon.
      */}
      <SiteBand>
        <SiteEyebrow>{t('guarantees.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('guarantees.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('guarantees.lede')}
        </p>

        <div className="mt-[22px] grid gap-[14px] stack:grid-cols-2 wide:grid-cols-4">
          {guarantees.map((item, i) => (
            <GlassPanel level="flat" key={item.title} padding={20} className="rv h-full" style={rv(i + 1)}>
              <p className="m-0 font-display text-[17px] font-black tracking-[-.03em] text-ink">{item.title}</p>
              <p className="mt-[7px] mb-0 text-meta leading-[1.5] text-ink-2">{item.body}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      {/*
        ── L'APERÇU DE RÉALISATIONS ────────────────────────────────────────────────────
        LA PREMIÈRE DES DEUX GRILLES, et l'ordre des deux compte. `clients.ts` et
        `ventures.ts` interdisent de les MÉLANGER : un projet client appartient à son
        client et n'ouvre droit qu'à un rôle revendiqué ; une venture est détenue et
        opérée par MY ONOMA. Deux sections, deux surfaces, et surtout deux étiquettes de
        relation écrites à l'écran — `CLIENT_RELATION` ici, `VENTURE_RELATION` plus bas.
        Sans elles, la distinction ne vivrait que dans le titre de section, c'est-à-dire
        dans la seule ligne qu'un lecteur pressé saute.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteEyebrow>{t('work.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('work.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('work.lede')}
        </p>

        <ul aria-label={t('work.listAria')} className="mt-7 grid list-none gap-[14px] p-0 stack:grid-cols-3">
          {preview.map((project, i) => (
            <li key={project.slug} className="rv h-full" style={rv(i + 2)}>
              {/* L'ADAPTATEUR ÉPINGLE LA RELATION. La page ne passe plus « Client product » :
                  elle choisit une carte CLIENTE, et le mauvais couple n'est pas exprimable.
                  La règle de `clients.ts` cesse ainsi de dépendre de l'attention du relecteur.
                  Le domaine, pas une capture — la page mère est la première vue de la piste,
                  et un aperçu de site est une requête vers un service tiers. */}
              <ClientWorkCard
                href={path(`/conception/realisations/${project.slug}`)}
                name={project.name}
                category={ts(`realisations.categories.${categoryKey(project.category)}`)}
                cta={t('work.visit')}
                domain={project.domain}
              />
            </li>
          ))}
        </ul>

        {/* `quiet` : ouvrir l'index n'est pas l'action principale de la page — c'est le
            prolongement d'une grille qui vient d'en montrer trois. Le libellé vient de
            `common`, partagé avec les autres surfaces qui ouvrent le même index. */}
        <Button
          href={path('/conception/realisations')}
          tone="quiet"
          size="sm"
          fullWidth={false}
          className="rv mt-5"
          style={rv(6)}
        >
          {tc('cta.realisations')}
          <Icon name="forward" size={16} />
        </Button>
      </PageSite>

      {/*
        ── LES PRODUITS DU STUDIO ──────────────────────────────────────────────────────
        Le bloc « Products built inside MY ONOMA » vivait sur `/agence` et avait disparu du
        site avec elle : `VentureCard` n'était plus monté nulle part, et les trois ventures
        étaient de nouveau dans le code et invisibles à l'écran — exactement l'état que
        `/agence` avait corrigé.

        ⚠️ LE TITRE EST IMPOSÉ, ET DANS LES DEUX LANGUES. `ventures.ts` l'écrit comme une
        contrainte, pas comme une suggestion : ces produits « n'apparaissent que dans un bloc
        explicitement intitulé "Products built inside MY ONOMA" ». Il n'est donc pas traduit,
        et il ne porte pas d'arc — c'est une mention de rattachement, pas une accroche.

        POURQUOI UNE BANDE, ET NON LA SUITE DU `PageSite` AU-DESSUS. Les deux grilles ne
        doivent jamais se lire comme une seule. Le changement de surface fait cette
        séparation sans une ligne de CSS, là où une simple marge la laisserait à
        l'appréciation du lecteur.

        POURQUOI PAS `components/agency/VentureCard` (supprimé avec ce changement). Il fixait
        son namespace à « agency » en dur, et `App.tsx` ne charge que `['conception']` sur
        cette route : les libellés seraient sortis en clés brutes EN PRODUCTION, sans qu'aucune
        porte le voie — ni le typecheck, ni le lint, ni `i18n-keys.test.ts`, qui ne suit pas
        les clés construites. Le rendu vit donc ici, dans le namespace de la page.

        ⚠️ La phrase ci-dessus évite d'écrire l'appel `useTranslation` avec ce namespace :
        `tests/unit/route-namespaces.test.ts` scanne le SOURCE d'un fichier de route sans en
        retirer les commentaires, et l'expliquer littéralement suffisait à le faire échouer.

        ⚠️ AUCUN CHIFFRE. `ventures.ts` interdit nommément utilisateurs, revenus, traction,
        levée et partenaires. La carte nomme le produit, sa catégorie et son domaine — rien
        d'autre —, et n'appelle aucun service de capture, comme l'aperçu client au-dessus.
      */}
      <SiteBand>
        <SiteEyebrow>{t('ventures.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('ventures.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('ventures.lede')}
        </p>

        <ul aria-label={t('ventures.listAria')} className="mt-7 grid list-none gap-[14px] p-0 stack:grid-cols-3">
          {ventures.map((venture, i) => (
            <li key={venture.slug} className="rv h-full" style={rv(i + 2)}>
              {/* L'AUTRE ADAPTATEUR. Même coque que l'aperçu client au-dessus, et c'est
                  précisément pourquoi la relation ne peut pas être une prop de page : les
                  deux grilles se ressemblent, et une inversion se lirait comme une
                  revendication de propriété sur le produit d'un tiers. */}
              <VentureWorkCard
                href={venture.website}
                name={venture.name}
                category={venture.category}
                cta={t('ventures.visit')}
                domain={venture.domain}
              />
            </li>
          ))}
        </ul>
      </SiteBand>

      {/*
        LE PASSAGE VERS MY ONOMA — fourni par l'orchestrateur, et rendu tel quel.
        Réécrire ce bloc ici le ferait diverger de sa jumelle de l'accueil au premier
        changement de positionnement, ce qui est exactement le défaut que le composant
        partagé existe pour empêcher.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        {/*
          LA SORTIE DE PAGE VIENT AVANT LE PONT, ET L'ORDRE EST TOUT.

          La page mère de la piste la plus chère du catalogue se terminait sur `MyOnomaBridge`,
          c'est-à-dire sur un lien SORTANT du site : la dernière chose offerte à quelqu'un qui
          venait de lire deux niveaux d'engagement, quatre étapes et quatre garanties était de
          partir ailleurs. Aucune des trois pages de la piste n'avait de sortie vers `/contact`.
          Le pont reste — il dit une frontière de marque —, mais il ne ferme plus la page.
        */}
        <SiteExit
          title={t('exit.title')}
          body={t('exit.body')}
          cta={t('exit.cta')}
          href={path('/contact')}
        />

        <MyOnomaBridge variant="panel" />
      </PageSite>
    </DsNavHost>
  );
}
