import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, CheckLine, DocLine, Field, GlassPanel, Icon, Num, PriceBlock, Tag, TerritoryCard, TruthPanel,
} from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import MapsProof from '../components/presence/MapsProof';
import PackSelector from '../components/presence/PackSelector';
import StickyWhatsApp from '../components/presence/StickyWhatsApp';
import { useFormat } from '../hooks/useFormat';
import { useLocalizedPath } from '../contexts/LanguageContext';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import {
  PACKS, PLANS, OPTIONS, JOURNEY_STEPS, TERMS, SECTOR_KEYS, PACK_KEYS, PLAN_KEYS,
  packEffectivePrice,
} from '../lib/presence/offer';
import { whatsappUrl } from '../lib/presence/whatsapp';
import { usePresenceQuote } from './presence/usePresenceQuote';

/**
 * LE CATALOGUE EST DATÉ, ET C'EST CE QUI AUTORISE `source="db"`.
 *
 * `<Num>` exige une source ET une date de relevé. Les prix ne viennent pas d'une requête :
 * ils sont écrits dans `src/lib/presence/offer.ts`. La date de sa dernière révision est donc
 * la date de relevé honnête — pas `new Date()`, qui prétendrait que le prix a été vérifié à
 * l'instant où la page s'affiche.
 *
 * À mettre à jour AVEC le catalogue, jamais séparément.
 */
const CATALOGUE_ASOF = new Date('2026-08-02');

/**
 * ── LE PRIX BARRÉ, ET POURQUOI IL EST LÉGITIME ───────────────────────────────────────
 *
 * Le readme du système écrit que « le prix d'entrée TPE réellement pratiqué est 250 000,
 * pas 295 000 ». Lu vite, c'est l'interdiction d'afficher un barré. Lu contre les données,
 * c'en est le contraire : `PACKS[0]` porte `price: 295_000` ET `promoPrice: 250_000`. Le
 * readme décrit le prix PRATIQUÉ ; il ne nie pas le prix de liste, il dit lequel des deux
 * on encaisse. C'est exactement la structure que `PriceBlock` attend — `amount` sur ce
 * qu'on paie, `strike` sur ce qu'on ne paie plus.
 *
 * Les deux valeurs sortent donc du catalogue avec `source="db"`. Un pack sans `promoPrice`
 * n'a pas de barré : rien n'est fabriqué pour faire nombre.
 *
 * ⚠️ LE MONTANT NE SE RECALCULE PAS ICI. Cette fonction lisait `promo ?? pack.price` de son
 * côté pendant que `computeTotals()` lisait `pack.price` du sien : la page affichait 250 000
 * et le devis ouvert derrière le même bouton en annonçait 295 000. Les deux passent
 * maintenant par `packEffectivePrice()`, et il n'y a plus qu'un endroit où se tromper.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
function packPricing(pack: (typeof PACKS)[number]) {
  const amount = packEffectivePrice(pack);
  return {
    amount: { value: amount, source: 'db' as const, asOf: CATALOGUE_ASOF },
    strike: amount < pack.price
      ? { value: pack.price, source: 'db' as const, asOf: CATALOGUE_ASOF }
      : undefined,
  };
}

/** Les trois territoires du kit, dans l'ordre où le catalogue liste les packs. */
const PACK_TERRITORY = ['digitalise', 'forme', 'transforme'] as const;

/**
 * L'unité d'une option pointe vers sa clé de traduction. `flat` n'en a pas : un forfait
 * n'est ni « par produit » ni « par mois », et lui coller un suffixe inventerait une
 * facturation qui n'existe pas au catalogue.
 */
const UNIT_SUFFIX: Record<string, string | undefined> = {
  product: 'options.perProduct',
  page: 'options.perPage',
  month: 'options.perMonth',
  flat: undefined,
};

export default function PresenceDigitale() {
  const { t } = useTranslation('presence');
  const { formatPrice } = useFormat();
  const path = useLocalizedPath();
  const q = usePresenceQuote();
  /** Le détail des conditions est replié : il est contractuel, pas promotionnel. */
  const [showTerms, setShowTerms] = useState(false);
  /** Les six champs de précision du devis, repliés derrière « Ajouter des précisions ». */
  const [showMore, setShowMore] = useState(false);

  const faqItems = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];
  const entryPack = PACKS[0];
  const entryPrice = packEffectivePrice(entryPack);

  /**
   * Le visiteur a-t-il dit quoi que ce soit sur les packs — une recommandation reçue, ou un
   * pack cliqué ? Tant que non, « Le plus choisi » a sa place ; après, il devient du bruit
   * à côté de « Recommandé pour toi ».
   */
  const hasPackSignal = q.reco !== null || q.form.pack !== 'undecided';

  const sectorOptions = useMemo(
    () => SECTOR_KEYS.map((k) => ({ value: k, label: t(`form.sectors.${k}`) })),
    [t],
  );
  const packOptions = useMemo(
    () => [
      { value: 'undecided', label: t('form.undecided') },
      ...PACK_KEYS.map((k) => ({ value: k, label: t(`packs.${k}.name`) })),
    ],
    [t],
  );
  const planOptions = useMemo(
    () => [
      { value: 'undecided', label: t('form.undecided') },
      { value: 'aucun', label: t('form.noPlan') },
      ...PLAN_KEYS.map((k) => ({ value: k, label: t(`plans.${k}.name`) })),
    ],
    [t],
  );

  return (
    <DsNavHost>
      <SEOHead title={t('seoTitle')} description={t('seoDescription')} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('seoTitle'),
        description: t('seoDescription'),
        areaServed: 'Afrique de l\'Ouest',
        url: `${SITE_URL}/presence-digitale`,
        /*
          Les trois packs sont des offres au sens de schema.org — un prix, une devise, une
          disponibilité. Aucun `aggregateRating` : le produit n'a pas d'avis collectés, et en
          fabriquer un serait le premier des six interdits.
        */
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t('packs.title'),
          itemListElement: PACKS.map((p) => ({
            '@type': 'Offer',
            name: t(`packs.${p.key}.name`),
            price: packEffectivePrice(p),
            priceCurrency: 'XOF',
          })),
        },
      }} />

      <PageSite>
        {/* ── HÉROS — 1.05fr .95fr, la PREUVE posée à côté du titre ──
            L'aside portait l'encart de prix. Il porte maintenant le test Google Maps, et
            l'échange n'est pas une préférence de mise en page : le titre affirme « ils
            trouvent tes concurrents », et la seule chose de cette page qui le démontre
            vivait quatre écrans plus bas. Une affirmation et sa preuve se tiennent.

            L'encart de prix, lui, désamorce une objection TARIFAIRE : il est descendu
            là où les tarifs sont. */}
        <div className="grid items-center gap-11 pb-[14px] wide:grid-cols-[1.05fr_.95fr]">
          <div>
            <SiteEyebrow>{t('eyebrow')}</SiteEyebrow>
            <SiteDisplay
              /* TROIS lignes, comme le kit (`PagesCore.js:207`) : « Ta boutique, / trouvable /
                 sur Google. » Le titre en faisait deux, et le bloc perdait la masse que trois
                 lignes courtes lui donnent — c'est la règle des titres écrits par langue. */
              arc
              lines={[t('heroTitle1'), t('heroTitle2'), t('heroTitle3')]}
              size={56}
              style={{ marginTop: '9px' }}
            />
            <p className="rv mt-4 max-w-[44ch] text-lede text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('heroSubtitle')}
            </p>
            <div className="rv mt-6 flex flex-wrap gap-3" style={{ ['--i' as string]: 5 }}>
              {/* « Trouve ton pack en 3 questions » ouvre LES TROIS QUESTIONS, et non le
                  formulaire de devis : c'est ce que dit son libellé, et c'est ce que la
                  maquette promet — « aucune donnée personnelle n'est demandée avant que tu
                  aies vu la recommandation ». */}
              <Button
                tone="digitalise"
                fullWidth={false}
                onClick={q.jumpToSelector}
              >
                {t('heroCta')}
              </Button>
              <Button
                href={whatsappUrl(q.quickMessage)}
                target="_blank"
                tone="quiet"
                fullWidth={false}
              >
                {t('heroSecondary')}
              </Button>
            </div>
          </div>

          {/*
            LA DÉMONSTRATION, ET ELLE COÛTE ZÉRO DONNÉE PERSONNELLE. Deux champs, un bouton,
            et la vérification se termine chez Google — hors de ce site, dans un outil que je
            ne contrôle pas. C'est la seule preuve qu'une page qui s'interdit les témoignages
            puisse offrir, et c'est aussi la moins chère à essayer.
          */}
          <div className="rv" style={{ ['--i' as string]: 5 }}>
            <MapsProof />
          </div>
        </div>

        {/* ── CE QUE TU ACHÈTES — EN BANDE, JUSTE APRÈS LA PREUVE ──
            Cinq colonnes qui se PARCOURENT, là où c'étaient cinq rangées qui se LISAIENT.
            Le bloc répond à « qu'est-ce que j'achète » et doit donc précéder « combien » ;
            il arrivait après la grille de prix. Une ligne par colonne : à ce stade le
            commerçant survole, il ne lit pas encore. */}
        <SiteBand bleed className="mm-section">
          <SiteDisplay as="h2" lines={t('journey.titleLines', { returnObjects: true }) as string[]} size={34} />
          <p className="rv mt-3 mm-prose text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
            {t('journey.subtitle')}
          </p>
          <ul className="mt-6 grid list-none gap-4 p-0 stack:grid-cols-5">
            {JOURNEY_STEPS.map((step, i) => (
              <li key={step} className="rv" style={{ ['--i' as string]: i + 3 }}>
                <GlassPanel level="flat" padding={18} style={{ height: '100%' }}>
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--mm-teal) 18%, transparent)' }}
                  >
                    <Icon name="check" size={13} color="var(--mm-teal)" strokeWidth={3.4} />
                  </span>
                  <p className="m-0 mt-[10px] text-[15px] font-bold leading-[1.3]">
                    {t(`journey.${step}.title`)}
                  </p>
                  <p className="m-0 mt-[6px] text-meta-2 leading-[1.5] text-ink-2">
                    {t(`journey.${step}.text`)}
                  </p>
                </GlassPanel>
              </li>
            ))}
          </ul>
        </SiteBand>

        {/* ── LE SÉLECTEUR — AVANT LA GRILLE, ET C'EST TOUT L'INTÉRÊT ──
            Le bouton du héros s'appelle « Trouve ton pack en 3 questions » et devait
            franchir les trois cartes de prix pour arriver ici : l'outil fait pour épargner
            la comparaison était placé derrière la comparaison. Les trois questions passent
            devant ; la grille devient la sortie de ceux qui veulent tout voir. */}
        {/*
          `.85fr / 1.15fr`, PAS DEUX MOITIÉS.

          Le titre tient sur deux lignes et le chapô sur une, plafonnée à 44 caractères : à
          50/50, ce bloc occupait 380 px d'une piste de 577 et le reste — près de 250 px —
          devenait un couloir vide entre le texte et le questionnaire. `items-center` ne le
          referme pas, il le répartit au-dessus et en dessous.

          Le kit ne dessine PAS cette section : il n'a qu'un bouton « Trouver mon pack en
          3 questions » (`pages-core.jsx:217`). Il n'y a donc pas de fidélité à tenir ici, et
          c'est aussi la seule section de la page dont le titre est en vis-à-vis au lieu
          d'être au-dessus — les cinq bénéfices et les trois packs posent le leur en tête.
          Faute de pouvoir remonter le titre sans coller un questionnaire de 700 px de large
          contre le bord, on resserre : la piste du texte tombe à 494, celle de l'outil monte
          à 670. C'est l'outil qu'on vient utiliser.
        */}
        <div className="mm-section grid items-center gap-9 wide:grid-cols-[.85fr_1.15fr]">
          <div>
            <SiteDisplay as="h2" lines={t('selector.titleLines', { returnObjects: true }) as string[]} size={34} />
            <p className="rv mt-3 max-w-[44ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
              {t('selector.subtitle')}
            </p>
          </div>
          <div ref={q.selectorRef} className="rv" style={{ ['--i' as string]: 4 }}>
            <PackSelector
              onRecommend={q.handleRecommend}
              onAccept={q.acceptReco}
              onReset={q.resetSelection}
              resetSignal={q.resetSignal}
            />
          </div>
        </div>

        {/* ── LES TROIS PACKS — prix affichés, pas de « à partir de » ──
            `bleed` : seule bande du dépôt IMBRIQUÉE dans un `PageSite`. Elle doit donc
            ressortir de la gouttière de 40 px, là où les onze autres sont déjà de premier
            niveau et n'ont rien à annuler. */}
        <SiteBand bleed className="mm-section">
          <SiteDisplay as="h2" lines={[t('packs.title')]} size={34} />
          <p className="rv mt-[10px] max-w-[56ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
            {t('packs.subtitle')}
          </p>

          <div className="mt-6 grid gap-4 stack:grid-cols-3">
            {PACKS.map((pack, i) => {
              const { amount, strike } = packPricing(pack);
              const features = t(`packs.${pack.key}.features`, { returnObjects: true }) as string[];
              const isReco = q.reco?.pack === pack.key;
              const isSelected = q.form.pack === pack.key;
              return (
                /*
                  `h-full` SUR L'ENVELOPPE, `fill` SUR LA CARTE — les deux, sinon rien.
                  La grille étire déjà ses cellules ; c'est le `<div className="rv">` qui
                  s'arrêtait à sa hauteur naturelle et laissait la carte flotter dedans.
                */
                <div key={pack.key} className="rv h-full" style={{ ['--i' as string]: i + 2 }}>
                  <TerritoryCard
                    fill
                    territory={PACK_TERRITORY[i]}
                    padding={24}
                    /*
                      TROIS ÉTATS, ET LE SOURCIL DIT LEQUEL. `packs.recommended` et
                      `packs.selected` étaient traduits en français comme en anglais et
                      n'apparaissaient dans aucun composant : on répondait aux trois questions
                      et la grille ne bougeait pas d'un pixel.

                      « Le plus choisi » ne survit pas au premier signal du visiteur. C'est un
                      argument qui parle des AUTRES ; dès qu'on sait quelque chose de celui-ci,
                      deux badges de désirabilité concurrents sur la même rangée s'annulent.
                    */
                    meta={
                      isReco ? t('packs.recommended')
                        : isSelected ? t('packs.selected')
                          : (pack.featured && !hasPackSignal) ? t('packs.featured')
                            : t(`packs.${pack.key}.for`)
                    }
                    title={t(`packs.${pack.key}.name`)}
                    titleSize={23}
                    /*
                      L'ANNEAU MARQUE OÙ ON EN EST, PAS CE QUE JE CONSEILLE — il suit la
                      sélection, le sourcil dit pourquoi. Après les trois questions les deux
                      coïncident ; si le commerçant clique ensuite un autre pack, l'anneau le
                      suit et la carte conseillée garde son sourcil sans son anneau. La grille
                      écrit alors les deux choses à la fois : « j'ai conseillé celui-là, tu as
                      pris celui-ci. »

                      `outline` et non `border` : il se pose HORS du flux, donc l'apparition de
                      l'anneau ne redessine pas la carte et ne décale pas la rangée.

                      Les deux autres cartes ne sont PAS estompées. Baisser leur opacité
                      ferait passer `--card-ink-2` sous le seuil de contraste sur un fond
                      pastel — on ne rend pas un prix moins lisible pour en vanter un autre.
                    */
                    style={isSelected ? {
                      outline: '2px solid var(--mm-teal)',
                      outlineOffset: '2px',
                      /*
                        Le chevron de la carte SUIVANTE est en `top:-16px` et déborde de 16 px
                        au-dessus d'elle, dans les 14 px de chevauchement de l'empilement : en
                        colonne unique, il passait par-dessus le bas de l'anneau. `z-index`
                        fonctionne ici parce que `.play .rv` remet `transform:none` — le
                        conteneur de révélation ne forme plus de contexte d'empilement une fois
                        la carte apparue.
                      */
                      zIndex: 1,
                    } : undefined}
                  >
                    {/* L'ÉLÉMENT ÉLASTIQUE de la carte : c'est la liste qui absorbe la
                        différence de longueur entre les trois packs, pour que les trois prix
                        et les trois boutons tombent sur la même ligne. `content-start` :
                        étirée, une grille répartirait ses lignes au lieu de les grouper. */}
                    <ul className="m-0 mt-[9px] grid flex-1 list-none content-start gap-[6px] p-0">
                      {features.map((f) => (
                        <li key={f} className="flex gap-2 text-[13.5px] leading-[1.5] text-[color:var(--card-ink-2)]">
                          <Icon name="check" size={13} strokeWidth={3.4} style={{ marginTop: '4px', flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <PriceBlock
                      amount={amount}
                      strike={strike}
                      strikeLabel={t('packs.strikeLabel')}
                      size={26}
                      note={strike ? t('packs.promoNote') : t('packs.onceNote')}
                      style={{ marginTop: '18px' }}
                    />

                    <p className="m-0 mt-2 text-meta-2 text-[color:var(--card-ink-2)]">
                      {t('packs.supportIncluded', { days: pack.supportDays })}
                    </p>

                    <div className="mt-[14px]">
                      <Button
                        tone="digitalise"
                        size="sm"
                        fullWidth={false}
                        onClick={() => q.jumpToForm({ pack: pack.key })}
                      >
                        {t('packs.cta')}
                      </Button>
                    </div>
                  </TerritoryCard>
                </div>
              );
            })}
          </div>

          {/*
            L'ENCART QUI DÉSAMORCE — descendu du héros, et posé JUSTE APRÈS les trois prix.

            Il vivait au premier écran, où il répondait à une objection tarifaire que
            personne n'avait encore eu l'occasion de se formuler : il faut avoir vu un
            montant pour se demander ce qu'il cache. Ici, la séquence se tient toute seule —
            on lit les trois prix, on se demande « et la suite ? », l'encart répond, et
            l'accompagnement qui suit est exactement ce dont il vient de dire qu'il est une
            décision séparée.

            Le montant vient du catalogue, pas de la traduction, pour qu'un changement de
            prix ne laisse jamais un chiffre périmé dans une phrase.
          */}
          <GlassPanel level="hero" padding={26} className="rv mt-5" style={{ ['--i' as string]: 5 }}>
            <div className="mm-prose">
              <SiteEyebrow style={{ margin: 0, color: 'var(--mm-teal-t)' }}>
                {t('anchor.eyebrow')}
              </SiteEyebrow>
              <p className="m-0 mt-[9px] text-[17px] font-bold leading-[1.32]">{t('anchor.question')}</p>
              <p className="m-0 mt-3 text-meta leading-[1.6] text-ink-2">
                {t('anchor.answerBefore')}
                <b className="text-ink">
                  <Num value={entryPrice} source="db" asOf={CATALOGUE_ASOF} unit="FCFA" />
                </b>
                {t('anchor.answerAfter')}
              </p>
              <div className="my-[18px] h-px bg-[color:var(--border-hair)]" />
              <p className="m-0 text-meta-2 text-ink-2">{t('anchor.footnote')}</p>
            </div>
          </GlassPanel>

          {/*
            L'accompagnement mensuel, mis À CÔTÉ des packs et non dedans. C'est la promesse
            que l'encart du héros vient de faire : une décision séparée. L'imbriquer dans les
            cartes la reprendrait d'une main après l'avoir donnée de l'autre.
          */}
          <GlassPanel level="flat" padding={22} className="rv mt-4" style={{ ['--i' as string]: 6 }}>
            <div className="flex flex-col items-start justify-between gap-5 stack:flex-row">
              <div className="max-w-[60ch]">
                <p className="m-0 font-display text-[18px] font-black tracking-[-.03em]">
                  {t('plansAside.title')}
                </p>
                <p className="m-0 mt-2 text-meta leading-[1.55] text-ink-2">{t('plansAside.body')}</p>
                {/*
                  LA MISE EN PLACE EST ÉCRITE, PAS SEULEMENT MENTIONNÉE. Ces deux lignes
                  n'affichaient que le mensuel. Le texte au-dessus annonce « des frais de mise
                  en place distincts » sans les chiffrer, et le montant — 375 000 F, plus que
                  le pack d'entrée — n'apparaissait qu'au devis et dans le message WhatsApp.
                  C'était le seul prix caché d'une page intitulée « les prix sont affichés ».

                  Le nommer ne l'additionne PAS au dû à la signature : `computeTotals()` tient
                  `setupDue` sur le pack seul, et le modèle setup-first tient toujours. On
                  écrit ce que ça coûtera le jour où la décision se prendra, pas une facture.
                */}
                <div className="mt-3 grid gap-[2px]">
                  {PLANS.map((plan, i) => (
                    <DocLine
                      key={plan.key}
                      /*
                        La recommandation porte AUSSI une formule, et `plans.recommended` était
                        la deuxième clé morte du couple. Elle peut valoir « aucun » : le
                        sélecteur refuse de vendre de l'accompagnement à quelqu'un qui publie
                        déjà régulièrement, et dans ce cas aucune des deux lignes n'est marquée.

                        `--mm-teal-t` et non `--mm-teal` : le teal plafonne à 2,84:1 sur blanc,
                        il ne porte jamais de texte. Le jeton `-t` bascule seul en nuit.
                      */
                      label={
                        q.reco?.plan === plan.key ? (
                          <>
                            {t(`plans.${plan.key}.name`)}
                            {' · '}
                            <span style={{ color: 'var(--mm-teal-t)', fontWeight: 600 }}>
                              {t('plans.recommended')}
                            </span>
                          </>
                        ) : t(`plans.${plan.key}.name`)
                      }
                      value={
                        /*
                          Les DEUX montants passent par `formatPrice`, et pas l'un par
                          `<Num unit="FCFA">` et l'autre par `formatPrice` : Intl écrit
                          « 175 000 F CFA » là où `<Num>` écrit « 375 000 FCFA », et la ligne
                          portait alors deux orthographes de la même devise à trois mots
                          d'intervalle.
                        */
                        `${t('plans.setupLabel')} ${formatPrice(plan.setupPrice)} · `
                        + t('plans.monthlyLabel', { price: formatPrice(plan.monthlyPrice) })
                      }
                      last={i === PLANS.length - 1}
                      style={{ flexWrap: 'wrap' }}
                    />
                  ))}
                </div>
              </div>
              <Button
                tone="quiet"
                size="sm"
                fullWidth={false}
                onClick={() => q.jumpToForm({})}
              >
                {t('plansAside.cta')}
              </Button>
            </div>
          </GlassPanel>
        </SiteBand>


        {/* ── L'ENCART DE VÉRITÉ — LES DEUX MOITIÉS, ET SA PROPRE SECTION ──
            Il était dans la colonne gauche du formulaire, en `text-meta-2`, sous un
            `GlassPanel level="truth"` : la moitié négative seule, à la taille d'une mention
            légale. Or c'est la position de la page tout entière, et le kit porte le composant
            qui la dit — `TruthPanel`, deux moitiés, déjà en service sur six écrans du Club.

            « Ce que je peux te prouver » n'était pas écrit faute de matière. La matière est
            là : une grille datée, une recherche que le visiteur a lancée lui-même, un devis
            qui relit la grille à chaque ouverture. Trois choses vérifiables par lui, depuis
            son téléphone. C'est ce qui autorise l'autre moitié à refuser les étoiles. */}
        <div className="mm-section">
          {/* Le titre de section ne REPREND pas l'un des deux sourcils du panneau — il les
              encadre. `TruthPanel` porte déjà « Ce que je peux te prouver » et « Ce que je
              n'affiche pas » en `mm-eyebrow` : un h2 qui répète le premier mot pour mot
              donnait le même titre deux fois de suite, à deux tailles différentes. */}
          <SiteDisplay as="h2" lines={[t('truth.sectionTitle')]} size={34} />
          <div className="rv mt-4 mm-prose" style={{ ['--i' as string]: 2 }}>
            <TruthPanel
              provenTitle={t('truth.provenTitle')}
              withheldTitle={t('truth.title')}
              proven={t('truth.proven', { returnObjects: true }) as string[]}
              withheld={t('truth.withheld', { returnObjects: true }) as string[]}
            />
          </div>
        </div>

        {/* ── LE FORMULAIRE ── */}
        <SiteBand bleed className="mm-section">
        <div ref={q.formRef} className="grid items-start gap-11 wide:grid-cols-[.95fr_1.05fr]">
          <div>
            <SiteDisplay as="h2" lines={[t('form.title')]} size={34} />
            <p className="rv mt-3 max-w-[44ch] text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 2 }}>
              {t('form.subtitle')}
            </p>

            {/*
              CE QUE JE SAIS DÉJÀ — relu, pas redemandé.

              La colonne portait trois contenus qui n'avaient rien à faire à côté d'un
              formulaire : l'encart de vérité (devenu sa propre section), les fourchettes
              d'options et les conditions commerciales (descendues sous la FAQ, avec le reste
              de ce qui se consulte au lieu de se lire). Ce qui la remplace parle du devis en
              cours, et de rien d'autre.

              Le sélecteur a déduit l'activité, le pack et l'accompagnement. Les redemander en
              listes déroulantes ferait passer une déduction pour une question ; les cacher
              sans les montrer serait pire. Ils sont donc ÉCRITS, et modifiables d'un clic.
            */}
            <GlassPanel level="truth" className="rv mt-5" style={{ ['--i' as string]: 3 }}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('form.knownLabel')}</SiteEyebrow>
              <div className="grid gap-[2px]">
                <DocLine label={t('form.sector')} value={t(`form.sectors.${q.form.sector}`)} />
                <DocLine
                  label={t('form.pack')}
                  value={q.form.pack === 'undecided' ? t('form.undecided') : t(`packs.${q.form.pack}.name`)}
                />
                <DocLine
                  label={t('form.plan')}
                  value={
                    q.form.plan === 'undecided' ? t('form.undecided')
                      : q.form.plan === 'aucun' ? t('form.noPlan')
                        : t(`plans.${q.form.plan}.name`)
                  }
                  last
                />
              </div>
              <p className="m-0 mt-3 text-meta-2 leading-[1.55] text-ink-3">{t('form.moreHint')}</p>
            </GlassPanel>
          </div>

          <GlassPanel level="hero" padding={26} className="rv" style={{ ['--i' as string]: 4 }}>
            {q.submitted ? (
              <div>
                <Tag tone="ok">{t('success.quoteReady')}</Tag>
                <SiteDisplay as="h3" lines={[t('success.title')]} size={26} style={{ marginTop: '10px' }} />
                <p className="mt-3 text-meta leading-[1.6] text-ink-2">{t('success.text')}</p>

                {q.quoteUrl && (
                  <p className="mm-num mt-3 break-all text-meta-2 text-ink-3">{q.quoteUrl}</p>
                )}

                <div className="mt-5 grid gap-[10px]">
                  <Button href={whatsappUrl(q.handoffMessage)} target="_blank" tone="digitalise">
                    {t('success.whatsappCta')}
                  </Button>
                  {q.quoteRef && (
                    <Button href={path(`/presence-digitale/devis/${q.quoteRef}`)} tone="ghost">
                      {t('success.viewQuote')}
                    </Button>
                  )}
                  <Button tone="quiet" onClick={() => void q.copyQuoteLink()}>
                    {q.copied ? t('success.copied') : t('success.copyLink')}
                  </Button>
                </div>

                <p className="mt-4 text-meta-2 text-ink-3">{t('success.whatsappHint')}</p>
              </div>
            ) : (
              <form onSubmit={q.handleSubmit} noValidate>
                <Field
                  label={t('form.businessName')}
                  value={q.form.businessName}
                  onChange={(v) => q.update('businessName', v)}
                  error={q.errors.businessName}
                  placeholder={t('form.businessNamePlaceholder')}
                  autoComplete="organization"
                  required
                  style={{ marginTop: 0 }}
                />
                {/* Le numéro passe DEVANT le nom de la personne : c'est le seul champ dont
                    dépend la réponse promise juste au-dessus. */}
                <Field
                  label={t('form.phone')}
                  type="tel"
                  value={q.form.phone}
                  onChange={(v) => q.update('phone', v)}
                  error={q.errors.phone}
                  placeholder={t('form.phonePlaceholder')}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
                <Field
                  label={t('form.contactName')}
                  value={q.form.contactName}
                  onChange={(v) => q.update('contactName', v)}
                  error={q.errors.contactName}
                  placeholder={t('form.contactNamePlaceholder')}
                  autoComplete="name"
                  required
                />
                <Field
                  label={t('form.city')}
                  value={q.form.city}
                  onChange={(v) => q.update('city', v)}
                  error={q.errors.city}
                  placeholder={t('form.cityPlaceholder')}
                  autoComplete="address-level2"
                  required
                />

                {/*
                  QUATRE CHAMPS VISIBLES AU LIEU DE DIX, ET LES SIX AUTRES À UN CLIC.

                  Les quatre qui restent sont ceux sans lesquels je ne peux pas tenir la
                  promesse écrite juste au-dessus — « je te réponds sous 48 heures sur
                  WhatsApp » : le nom du commerce, la personne, le numéro, la ville. Les six
                  autres précisent, ils ne débloquent rien.

                  ILS SONT REPLIÉS, PAS SUPPRIMÉS, et leurs valeurs courantes sont écrites en
                  clair dans l'encart à gauche : on ne cache pas à quelqu'un ce qu'il est sur
                  le point d'envoyer.

                  `<details>` porte le pliage — le clavier, l'annonce de l'état et la
                  recherche dans la page viennent alors du navigateur, et le contenu reste
                  dans le DOM, donc dans le formulaire, ouvert ou non. L'état React ne
                  REMPLACE pas ce comportement, il l'oriente dans un seul cas : rouvrir sur
                  une erreur cachée (voir juste en dessous).
                */}
                {/*
                  ET IL S'OUVRE TOUT SEUL SUR UNE ERREUR QU'IL CACHE. `email` est le seul
                  champ replié que la validation refuse ; replié, son message d'erreur ne
                  serait lu par personne et l'envoi échouerait sans rien dire. Tant que
                  l'erreur tient, le bloc reste ouvert — elle s'efface à la frappe suivante,
                  `update()` vidant l'erreur du champ qu'on modifie.
                */}
                <details
                  open={showMore || Boolean(q.errors.email)}
                  onToggle={(e) => setShowMore(e.currentTarget.open)}
                  className="mt-4 rounded-[var(--r-m)] border border-dashed border-[color:var(--border-hair)] p-3"
                >
                  <summary className="mm-touch-extend cursor-pointer list-none text-meta font-bold text-ink">
                    {t('form.moreToggle')}
                    <span className="ml-2 font-normal text-ink-3">{t('form.moreHint')}</span>
                  </summary>
                  <div className="mt-2">
                    <Field
                      label={t('form.email')}
                      type="email"
                      value={q.form.email}
                      onChange={(v) => q.update('email', v)}
                      error={q.errors.email}
                      placeholder={t('form.emailPlaceholder')}
                      inputMode="email"
                      autoComplete="email"
                    />
                    <Field
                      as="select"
                      label={t('form.sector')}
                      value={q.form.sector}
                      onChange={(v) => q.update('sector', v)}
                      options={sectorOptions}
                    />
                    <Field
                      as="select"
                      label={t('form.pack')}
                      value={q.form.pack}
                      onChange={(v) => q.update('pack', v)}
                      options={packOptions}
                    />
                    <Field
                      as="select"
                      label={t('form.plan')}
                      value={q.form.plan}
                      onChange={(v) => q.update('plan', v)}
                      options={planOptions}
                    />
                    <Field
                      as="textarea"
                      rows={3}
                      label={t('form.message')}
                      value={q.form.message}
                      onChange={(v) => q.update('message', v)}
                      placeholder={t('form.messagePlaceholder')}
                    />
                    <Field
                      label={t('form.referral')}
                      value={q.form.referralCode}
                      onChange={(v) => q.update('referralCode', v)}
                      placeholder={t('form.referralPlaceholder')}
                      autoComplete="off"
                    />
                  </div>
                </details>

                {/*
                  Piège à robots. `tabIndex={-1}` et `aria-hidden` le retirent du parcours
                  clavier ET de l'arbre d'accessibilité : une personne au lecteur d'écran ne
                  le rencontre jamais, un script de remplissage automatique le remplit.
                */}
                <input
                  type="text"
                  name="_hp"
                  value={q.form._hp}
                  onChange={(e) => q.update('_hp', e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute h-0 w-0 overflow-hidden opacity-0"
                />

                <Button
                  type="submit"
                  tone="digitalise"
                  loading={q.loading}
                  disabled={q.loading}
                  style={{ marginTop: '17px' }}
                >
                  {q.loading ? t('form.submitting') : t('form.submit')}
                </Button>
              </form>
            )}
          </GlassPanel>
        </div>
        </SiteBand>

        {/* ── FAQ D'ACHAT — neutre ── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={[t('faq.title')]} size={34} />
          <div className="mm-prose mt-4 grid gap-[2px]">
            {faqItems.map((item, i) => (
              <details key={item.q} className="rv border-b border-[color:var(--border-hair)] py-4 last:border-0" style={{ ['--i' as string]: i + 1 }}>
                <summary className="cursor-pointer list-none font-bold text-ink">{item.q}</summary>
                <p className="m-0 mt-2 text-meta leading-[1.6] text-ink-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* ── LE DÉTAIL — OPTIONS ET CONDITIONS, RÉUNIES SOUS LA FAQ ──
            Les deux vivaient dans la colonne gauche du formulaire : six fourchettes de prix
            et huit clauses contractuelles à côté des champs à remplir, c'est-à-dire de la
            documentation posée dans un tunnel. Elles se consultent, elles ne se lisent pas —
            leur place est ici, avec la FAQ, après que la décision s'est prise.

            Réunies, elles règlent aussi la quatrième liste d'affilée : la page enchaînait
            cinq rangées de parcours, six d'options, huit de conditions et six de FAQ au même
            rythme typographique. Il en reste deux, sous un titre qui annonce ce que c'est. */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={[t('details.title')]} size={34} />
          <p className="rv mt-3 mm-prose text-meta leading-[1.6] text-ink-2" style={{ ['--i' as string]: 1 }}>
            {t('details.subtitle')}
          </p>

          <div className="mt-6 grid gap-9 stack:grid-cols-2">
            {/* Les options chiffrées : une fourchette réelle, jamais un « sur devis ». */}
            <div className="rv" style={{ ['--i' as string]: 2 }}>
              <SiteEyebrow style={{ margin: 0 }}>{t('options.title')}</SiteEyebrow>
              <p className="m-0 mt-1 text-meta-2 text-ink-2">{t('options.subtitle')}</p>
              <div className="mt-3 grid gap-[2px]">
                {OPTIONS.map((opt, i) => (
                  <DocLine
                    key={opt.key}
                    label={t(`options.${opt.key}.name`)}
                    value={
                      <>
                        {t('options.range', { min: formatPrice(opt.min), max: formatPrice(opt.max) })}
                        {UNIT_SUFFIX[opt.unit] ? ` ${t(UNIT_SUFFIX[opt.unit]!)}` : ''}
                      </>
                    }
                    last={i === OPTIONS.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Les conditions commerciales, repliées : contractuelles, pas promotionnelles. */}
            <div className="rv" style={{ ['--i' as string]: 3 }}>
              <SiteEyebrow style={{ margin: 0 }}>{t('terms.title')}</SiteEyebrow>
              <div className="mt-3">
                <Button
                  tone="quiet"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setShowTerms((v) => !v)}
                  aria-expanded={showTerms}
                >
                  {t('terms.toggle')}
                </Button>
                {showTerms && (
                  <div className="mt-3 grid gap-[6px]">
                    {TERMS.map((key) => (
                      <CheckLine key={key}>{t(`terms.items.${key}`)}</CheckLine>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── LA PASSERELLE VERS L'AGENCE — l'autre offre, nommée, pas cachée ── */}
        <GlassPanel level="truth" className="mm-section">
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('agencyBridge.title')}</SiteEyebrow>
          <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('agencyBridge.body')}</p>
          <div className="mt-3">
            <Button href={path('/agence')} tone="quiet" size="sm" fullWidth={false}>
              {t('agencyBridge.cta')}
            </Button>
          </div>
        </GlassPanel>
      </PageSite>

      <StickyWhatsApp message={q.quickMessage} hideNear={q.formRef} />
    </DsNavHost>
  );
}
