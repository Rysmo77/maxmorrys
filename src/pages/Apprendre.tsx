import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Num, Tag, TERRITORY_VERB, TerritoryCard, TruthPanel, type Territory } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { ApprendreSubNav } from '../components/navigation/PisteSubNav';
import {
  PageSite, SiteBand, SiteDisplay, SiteEyebrow, SiteExit, TerritoryRow, useTerritoryLayout,
} from '../components/site';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { CLUB_PRICE_XOF } from '../lib/club/pricing';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /apprendre — LA PAGE MÈRE DE LA PISTE APPRENDRE.  CDC du 14/09/2026, §3.3 et §4.3.
 *
 * Elle existe parce que la navigation globale est passée à quatre entrées neutres. Les quatre
 * verbes à la première personne — « Je te forme », « Je t'informe », « Je te transforme », plus
 * le Club — ne sont pas supprimés : ils QUITTENT LA BARRE HAUTE et redeviennent les titres de
 * cette page. C'est le contraire d'un renoncement de ton. Dans un menu global, « Je te
 * digitalise » accueillait un directeur financier européen ; ici, ils s'adressent à qui est
 * déjà entré par la bonne porte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELLE PRÉSENTE, ELLE NE REJOUE PAS LE CATALOGUE
 *
 * Aucune lecture Firestore : pas de liste de formations, pas de grille d'articles, pas de
 * dernier épisode. Les quatre pages filles le font déjà, mieux, avec leurs filtres et leurs
 * états vides. Une page mère qui recopie ses filles a deux défauts au lieu d'un : elle coûte
 * quatre requêtes avant le premier pixel, et elle affirme un catalogue au moment où elle ne
 * l'a pas encore lu — le défaut exact relevé par l'audit UX du 02/09 sur les index.
 *
 * Le SEUL nombre de la page est le tarif du Club, et il est DÉRIVÉ de `lib/club/pricing`,
 * jamais recopié : c'est une constante d'offre, pas une mesure.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'ORDRE DES QUATRE CARTES EST LA RÈGLE DU SYSTÈME, PAS UN GOÛT
 *
 * `SubNav` l'écrit dans son en-tête et le motive commercialement : « sans cette séparation
 * visible, un visiteur croit le podcast derrière le mur et ne clique pas — et le haut de
 * l'entonnoir perd sa fonction. L'ordre n'est donc pas négociable : le gratuit d'abord, le
 * Club ensuite. » Les cartes lisent donc, de gauche à droite : blog (ouvert) · pôle média
 * (ouvert) · formations (payant, à l'unité) · Club (payant, fermé).
 *
 * ⚠️ `ApprendreSubNav` ordonne SES quatre entrées autrement (formations en tête). Les deux
 * ordres cohabitent sur cet écran, à trois centimètres l'un de l'autre. Signalé à
 * l'orchestrateur : `PisteSubNav.tsx` est un fichier « spine », il n'est pas retouché ici.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `/verifier` EST LA PREUVE, ET C'EST POUR ÇA QU'ELLE A SA BANDE
 *
 * Le CDC §4.3 la demande nommément depuis la piste. La raison tient en une phrase : c'est la
 * seule affirmation de tout le site qu'un tiers peut contrôler SANS moi et CONTRE moi, pour
 * zéro franc et sans compte. Tout le reste — une note, un nombre d'inscrits, un taux de
 * réussite — se fabrique ; un code de certificat qui ne répond pas se voit. D'où le
 * `TruthPanel` à côté d'elle plutôt qu'ailleurs : ce qui se vérifie sans compte, et ce que
 * cette page ne chiffre pas, se lisent à l'endroit où la preuve est offerte.
 *
 * ⚠️ ET C'EST LE SEUL PANNEAU DE VÉRITÉ DE LA PAGE. Ses deux sourcils nommaient leur objet
 * en toute généralité — « Ce que je peux te prouver », « Ce que je n'affiche pas » — c'est-
 * à-dire les mêmes mots que trois autres écrans du site. Un titre qui pourrait coiffer
 * n'importe quel panneau ne dit plus lequel on lit : ils nomment désormais CE panneau-ci,
 * celui d'une page où tout se contrôle sans ouvrir de compte.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Les quatre entrées de la piste, dans l'ordre d'affichage — voir l'en-tête.
 *
 * `territory` est le territoire de la DESTINATION, pas celui de cette page : c'est ce qui fait
 * qu'une carte bleue mène au catalogue et une carte violette au Club, sur toutes les surfaces
 * du produit. Deux cartes portent `transforme` et c'est volontaire : le pôle média et le Club
 * sont les deux étages d'un même verbe (`sectionThemes.ts`).
 */
const ENTRIES = [
  { key: 'blog', territory: 'informe', to: '/blog', access: 'accessOpen' },
  { key: 'media', territory: 'transforme', to: '/podcast-et-videos', access: 'accessOpen' },
  { key: 'formations', territory: 'forme', to: '/formations', access: 'accessPaid' },
  { key: 'club', territory: 'transforme', to: '/club-des-digitos', access: 'accessClosed' },
] as const;

/**
 * Le petit libellé au-dessus d'une ligne de carte — « Pour qui », « Ce que ça coûte ».
 *
 * Il n'emprunte PAS `.mm-eyebrow` : le sourcil du système lit `--text-muted`, une encre de
 * page, et une carte territoire est peinte d'un dégradé de marque avec sa propre encre
 * (`--card-ink-2`, qui s'inverse sous `.dk`). Poser le sourcil ici donnerait un gris de page
 * sur un fond coloré — invisible en nuit, et hors système dans les deux modes.
 */
const CARD_LABEL: CSSProperties = {
  display: 'block',
  marginBottom: '3px',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  opacity: 0.62,
};

export default function Apprendre() {
  const { t } = useTranslation('apprendre');
  /* Les six libellés qui se répètent d'une piste à l'autre vivent dans `common:cta` — c'est
     leur seul emplacement, et c'est ce qui fait qu'une reformulation ne se fait pas deux fois
     de deux façons. Le namespace est de base : aucune route n'a à le déclarer. */
  const { t: tc } = useTranslation('common');
  const { language } = useLanguage();
  const path = useLocalizedPath();
  const layout = useTerritoryLayout();

  /* Le tarif se cadre au MOIS, la mention annuelle dessous — la règle de cadrage du système,
     déjà tenue par le pôle média. Recalculé depuis le module, jamais recopié. */
  const monthly = Math.round(CLUB_PRICE_XOF / 12);
  /* Un prix est une constante d'offre, pas un relevé : sa date est celle du module qui le
     porte, et `showAsOf` reste à false — un tarif n'affiche pas sa date à l'écran. */
  const asOf = new Date();

  /*
   * Les trois verbes viennent du DESIGN SYSTEM, pas d'une table de traduction — c'est le
   * choix que `TERRITORY_VERB` existe pour rendre irréversible : « I transform you »
   * sonnerait comme une publicité de coach de vie, et l'anglais n'a pas de tutoiement. Le
   * Club, lui, est un NOM PROPRE : il vit dans le catalogue i18n, avec son article.
   */
  const titreDe = (key: string, territory: Territory) =>
    key === 'club' ? t('entries.club.title') : TERRITORY_VERB[territory][language === 'en' ? 'en' : 'fr'];

  /* Le pied de la carte « formations » disait mot pour mot `common:cta.formations`, et le
     héros aussi : deux recopies d'un libellé dont le dépôt possède déjà l'unique source. Les
     trois autres cartes gardent leur propre pied — « Lire le blog » n'est pas un des six. */
  const ctaDe = (key: string) => (key === 'formations' ? tc('cta.formations') : t(`entries.${key}.cta`));

  /* Pas de `useMemo` : la valeur dépend de `t`, de la langue ET de `titreDe`, qui se
     reconstruit à chaque rendu. Une mémoïsation aurait exigé de mentir sur ses dépendances —
     et `react-hooks/exhaustive-deps` est une ERREUR ici, pas un avertissement. Le coût réel
     est une sérialisation de quelques centaines d'octets par rendu, sur une page qui n'en
     fait presque aucun : elle ne lit rien. */
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: t('seo.jsonLdName'),
      description: t('seo.jsonLdDescription'),
      url: buildCanonical(path('/apprendre')),
      inLanguage: language,
      /* La liste est ORDONNÉE, et l'ordre est l'information — le gratuit d'abord. Le dire
         aux robots comme à l'écran évite qu'un extrait enrichi réordonne la promesse. */
      mainEntity: {
        '@type': 'ItemList',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: ENTRIES.map((e, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: titreDe(e.key, e.territory),
          description: t(`entries.${e.key}.body`),
          url: buildCanonical(path(e.to)),
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('seo.breadcrumbHome'), item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t('seo.breadcrumbCurrent'), item: buildCanonical(path('/apprendre')) },
      ],
    },
  ];

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      <JsonLd data={jsonLd} />

      <PageSite>
        {/* La sous-navigation de piste est une primitive de PAGE : elle vit DANS le `PageSite`,
            en tête, et `active={null}` n'allume aucune entrée — cette page n'est aucun des
            quatre étages, elle les présente. */}
        <ApprendreSubNav active={null} />

        <div className="mm-arc-host mt-[26px]">
          <SiteEyebrow>{t('hero.eyebrow')}</SiteEyebrow>
          <SiteDisplay
            arc
            lines={t('hero.titleLines', { returnObjects: true }) as string[]}
            size={54}
            from={1}
          />

          <p className="rv mt-[18px] max-w-[46ch] text-[16.5px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 5 }}>
            {t('hero.lede')}
          </p>

          <div className="rv mt-5 flex flex-wrap gap-2" style={{ ['--i' as string]: 6 }}>
            <Tag tone="ok">{t('hero.tagFree')}</Tag>
            <Tag>{t('hero.tagPaid')}</Tag>
          </div>

          {/*
            LE BOUTON PLEIN OUVRE CE QUI EST OUVERT, et il porte donc l'orange de sa
            destination, pas le bleu de cette page. Le précédent est sur l'accueil, qui bascule
            exactement ces deux tons entre le blog et le catalogue — à ceci près qu'il lit
            Firestore pour trancher. Ici, rien n'est lu : la règle du système décide seule, et
            elle dit que le gratuit passe devant. Un bouton plein vers une page payante, en
            premier appel d'une page qui vient de promettre l'inverse, se contredirait à deux
            lignes d'intervalle.
          */}
          <div className="rv mt-6 flex flex-wrap gap-3" style={{ ['--i' as string]: 7 }}>
            <Button href={path('/blog')} tone="informe" fullWidth={false}>
              {t('hero.ctaFree')}
            </Button>
            <Button href={path('/formations')} tone="ghost" fullWidth={false}>
              {tc('cta.formations')}
            </Button>
          </div>

          <p className="rv mt-5 max-w-[58ch] text-small leading-[1.5] text-ink-2" style={{ ['--i' as string]: 8 }}>
            {t('hero.note')}
          </p>
        </div>

        {/* ── LES QUATRE ENTRÉES ────────────────────────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay
            arc
            as="h2"
            lines={t('entries.titleLines', { returnObjects: true }) as string[]}
            size={34}
          />
          <p className="rv mt-3 max-w-[62ch] text-prose leading-[1.6] text-ink-2" style={{ ['--i' as string]: 3 }}>
            {t('entries.intro')}
          </p>
        </div>

        {/*
          QUATRE CHEVRONS EN RANGÉE — la silhouette du M du logo, lue horizontalement. C'est
          `useTerritoryLayout` qui choisit entre la pile, la grille 2 × 2 et la rangée ; la
          page ne réécrit aucun des trois points de rupture.

          `fill` parce que les quatre cartes sont COMPARATIVES : sans lui, la ligne de tarif du
          Club et celle du blog ne tombent pas à la même hauteur, et l'œil ne peut plus les
          mettre en regard. Le paragraphe de corps porte le `flex-1` — c'est l'appelant qui
          désigne l'élément élastique, la primitive ne le devine pas.
        */}
        <div className="mt-6">
          <TerritoryRow layout={layout}>
            {ENTRIES.map((entry, i) => (
              <div key={entry.key} className="rv min-w-0" style={{ ['--i' as string]: i + 1 }}>
                <TerritoryCard
                  territory={entry.territory}
                  layout={layout}
                  first={i === 0}
                  fill
                  href={path(entry.to)}
                  meta={t(`entries.${entry.access}`)}
                  title={titreDe(entry.key, entry.territory)}
                  titleSize={20}
                >
                  <p
                    className="mt-[14px] mb-0 flex-1 text-[13.5px] leading-[1.5]"
                    style={{ color: 'var(--card-ink-2)' }}
                  >
                    {t(`entries.${entry.key}.body`)}
                  </p>

                  <p className="mt-[14px] mb-0 text-[12.5px] leading-[1.45]" style={{ color: 'var(--card-ink-2)' }}>
                    <span style={CARD_LABEL}>{t('entries.forWho')}</span>
                    {t(`entries.${entry.key}.who`)}
                  </p>

                  <p className="mt-[12px] mb-0 text-[12.5px] leading-[1.45]" style={{ color: 'var(--card-ink-2)' }}>
                    <span style={CARD_LABEL}>{t('entries.cost')}</span>
                    {entry.key === 'club' ? (
                      <>
                        {/* Les deux montants sortent de la chaîne traduite : ce sont des <Num>,
                            donc ils portent leur source, leur monospace tabulaire et le
                            séparateur de milliers DE LA LANGUE. Interpolés dans la phrase, ils
                            auraient été figés sur une seule des deux. */}
                        {t('entries.club.costPrefix')}{' '}
                        <Num value={monthly} unit="F/mois" source="server" asOf={asOf} showAsOf={false} />
                        {'. '}
                        {t('entries.club.costBilled')}{' '}
                        <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} showAsOf={false} />{' '}
                        {t('entries.club.costBilledSuffix')}
                      </>
                    ) : (
                      t(`entries.${entry.key}.cost`)
                    )}
                  </p>

                  {/* La carte EST le lien : ce pied n'est qu'une affordance, jamais une
                      seconde ancre — un `<a>` dans un `<a>` est invalide, et le lecteur
                      d'écran annoncerait deux cibles pour une destination. */}
                  <p
                    className="mt-[16px] mb-0 inline-flex items-center gap-[6px] text-[13px] font-semibold"
                    style={{ color: 'var(--card-ink)' }}
                  >
                    {ctaDe(entry.key)}
                    <Icon name="arrow-up-right" size={14} color="var(--card-ink)" />
                  </p>
                </TerritoryCard>
              </div>
            ))}
          </TerritoryRow>
        </div>
      </PageSite>

      {/* ── LA PREUVE : /verifier ─────────────────────────────────────────────────────
          Une bande pleine largeur, et pas un encart de bas de page. Le CDC la veut mise en
          avant depuis la piste ; un lien noyé sous les cartes l'aurait mentionnée sans la
          montrer. */}
      <SiteBand>
        <div className="grid items-start gap-[34px] wide:grid-cols-[1.05fr_.95fr]">
          <div className="min-w-0">
            <SiteEyebrow>{t('verify.eyebrow')}</SiteEyebrow>
            <SiteDisplay
              arc
              as="h2"
              lines={t('verify.titleLines', { returnObjects: true }) as string[]}
              size={34}
              from={1}
            />
            <p className="rv mt-3 max-w-[50ch] text-prose leading-[1.6] text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('verify.body')}
            </p>
            <p className="rv mt-3 max-w-[50ch] text-small leading-[1.5] text-ink-2" style={{ ['--i' as string]: 5 }}>
              {t('verify.note')}
            </p>
            <div className="rv mt-5" style={{ ['--i' as string]: 6 }}>
              {/* Bleu « Je te forme » : le certificat sort d'une formation, et c'est le
                  territoire de cette page. */}
              <Button href={path('/verifier')} tone="forme" fullWidth={false}>
                <Icon name="shield" size={17} />
                {t('verify.cta')}
              </Button>
            </div>
          </div>

          {/* `TruthPanel` EST déjà la surface `truth` : l'envelopper dans un `GlassPanel` du
              même niveau empilerait deux fois le même voile. */}
          <TruthPanel
            className="rv-s min-w-0"
            provenTitle={t('verify.provenTitle')}
            withheldTitle={t('verify.withheldTitle')}
            proven={t('verify.proven', { returnObjects: true }) as string[]}
            withheld={t('verify.withheld', { returnObjects: true }) as string[]}
          />
        </div>
      </SiteBand>

      {/* ── LA SORTIE ─────────────────────────────────────────────────────────────────
          Une page mère doit finir sur une porte, pas sur un silence. Celle-ci ne vend rien :
          elle propose de poser la question, et assume que la réponse puisse être « ce n'est
          pas la peine ».

          C'était une rangée écrite à la main — `SiteDisplay` arc + bouton `quiet` — et c'est
          exactement le dessin dont `SiteExit` existe pour être la seule version. Le titre y
          perd ses crochets d'arc parce qu'il n'est plus un titre d'affichage : la primitive
          le rend en 18 px, et un arc de couleur sur une porte de sortie mettrait sa masse au
          mauvais endroit de la page. */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteExit
          title={t('end.title')}
          body={t('end.body')}
          cta={t('end.cta')}
          href={path('/contact')}
        />
      </PageSite>
    </DsNavHost>
  );
}
