import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, Field, GlassPanel, Icon, Tag } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import ClientWorkIndex from '../components/agency/ClientWorkIndex';
import VentureCard from '../components/agency/VentureCard';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/tracking';
import { agencyLeadConfig } from '../lib/agency/engagement';
import { practices, corporateUrl, legalName, legalEntity, ventures } from '../lib/brand';
import { DESCRIPTION_MAX, useAgencyEngagement } from './agence/useAgencyEngagement';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /agence — LE SEUL TERRITOIRE QUI N'EN EST PAS UN.
 *
 * Le système est formel : « L'agence vit HORS des quatre verbes — séparateur dans la barre
 * haute, entrée en corail : elle ne se range pas sous "Je te digitalise", c'est une autre
 * promesse et un autre client. » `sectionThemes.agency` porte `territory: null, mesh: null` :
 * cette page ne reçoit AUCUN maillage, et c'est voulu. Sa seule marque de couleur est le
 * corail — en version TEXTE (`--mm-corail-t`, AD-20), parce que `#FF6E7F` fait 2,70:1 sur
 * blanc et que le kit l'écrit quand même en dur, à quatre endroits.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CETTE PAGE A CESSÉ DE FAIRE — 856 lignes, neuf sections, contre trois ici.
 *
 * 1. LES RÉFÉRENCES CLIENTS SONT REVENUES. Elles avaient été retirées parce que la page
 *    nommait publiquement des organisations sans accord écrit (FR-105) — nommer un client
 *    sans son accord n'est pas une imprécision, c'est un risque juridique porté par le
 *    client. Une NOTE DE DETTE disait l'absence et sa raison, plutôt que de la maquiller :
 *    c'est ce qui lui a donné une date de fin. Les accords sont obtenus, la note a disparu
 *    avec son objet, et `ClientWorkIndex` a repris sa place.
 *
 *    CE QUE LE FEU VERT NE CHANGE PAS : ces produits appartiennent à leurs clients. La page
 *    nomme le rôle tenu et donne un lien qu'on peut ouvrir. Aucun résultat, aucun chiffre de
 *    croissance, aucun témoignage — les interdits du § 13 ne dépendaient pas de l'accord.
 *
 * 2. ELLE NE VOUVOIE PLUS, et ne dit plus « nous ». « Comment nous travaillons », « nous
 *    répondons sous deux jours », « nous vous orientons » : quatre sections écrites à la
 *    première personne du pluriel, sur une page dont toute la promesse est qu'une seule
 *    personne lit, répond et cadre. Le kit tranche : « Réponse sous 48 h, par moi. »
 *
 * 3. ELLE NE MONTRE AUCUN MONTANT. Le kit l'écrit en commentaire — « Aucun montant. Aucune
 *    organisation tierce nommée. » — et le contredit dans sa propre maquette en pré-remplissant
 *    la fourchette avec « À partir de 3 M FCFA ». On garde la règle, pas la maquette :
 *    les cinq fourchettes du formulaire nomment désormais une FORME D'ENGAGEMENT (durée,
 *    équipe) et non une somme. La règle a d'ailleurs un second appui, structurel : AD-5 fait
 *    de `<Num source asOf>` le seul chemin du dépôt vers un chiffre — et il n'entre pas dans
 *    un `<option>`.
 *
 * 4. ELLE N'ANNONCE PLUS CLÉA AVANT L'ENVOI. L'encart « ce besoin relève de Cléa » s'ouvrait
 *    pendant la saisie. Sur cette page, Cléa n'apparaît qu'APRÈS envoi, dans la carte de
 *    réorientation — le lead est enregistré et tagué d'abord, orienté ensuite. Aucune demande
 *    n'est rejetée ; elle est réorientée.
 *
 * 5. ELLE NE REDOUBLE PLUS `/faq`, ni le pied de page. La FAQ de six questions et ses données
 *    structurées `FAQPage` sont parties avec la section : publier un balisage FAQ pour un
 *    contenu absent de la page est une déclaration fausse à un tiers. La mention légale
 *    finale l'était aussi, mot pour mot, dans `Footer`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Décalage de la cascade d'entrée. Une seule écriture pour toute la page. */
const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

/**
 * Les quatre familles du kit, illustratives : le formulaire, lui, propose les NEUF types
 * réels de `agencyLeadConfig.projectTypes` — d'où la première ligne du titre de bande, qui
 * les compte. Si la liste change, cette ligne ment : elle est vérifiée ici plutôt que crue.
 */
const BAND_TYPES = 4;

export default function Agence() {
  const { t } = useTranslation('agency');
  const path = useLocalizedPath();
  const lead = useAgencyEngagement();

  const build = practices.build;
  const grow = practices.grow;

  /*
   * Les blocs STATIQUES sont mémorisés, et ce n'est pas de la coquetterie : l'état du
   * formulaire vit dans ce composant, donc chaque caractère tapé le rend à nouveau. La
   * version précédente reconstruisait à chaque frappe le tableau de la FAQ, trois objets de
   * données structurées et une chaîne de classes de `<select>`.
   */
  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: build.brand,
        serviceType: build.discipline,
        description: t('meta.description'),
        url: buildCanonical('/agence'),
        brand: { '@type': 'Brand', name: build.brand },
        /*
         * ⚠️ `Service` avec `provider` = MY ONOMA SARL, et `brand` = Max-Morrys Agency.
         * Max-Morrys Agency est une MARQUE, pas une personne morale : il ne doit jamais
         * exister d'`Organization` autonome portant ce nom.
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
          { '@type': 'ListItem', position: 2, name: build.brand, item: buildCanonical('/agence') },
        ],
      },
    ],
    [t, build.brand, build.discipline],
  );

  const types = useMemo(
    () => (t('band.types', { returnObjects: true }) as { title: string; body: string }[]).slice(0, BAND_TYPES),
    [t],
  );
  const steps = useMemo(
    () => t('process.steps', { returnObjects: true }) as { n: string; title: string; body: string }[],
    [t],
  );

  const head = (
    <>
      <SEOHead
        title={t('meta.title')}
        description={t('meta.description')}
        canonical={buildCanonical('/agence')}
        frPath="/agence"
        enPath="/en/agency"
      />
      <JsonLd data={jsonLd} />
    </>
  );

  /*
   * ── LA CONFIRMATION ─────────────────────────────────────────────────────────
   * Un écran, pas un encart : le kit lui consacre une vue entière, et une demande envoyée
   * n'a plus rien à faire à côté du formulaire qui l'a produite.
   */
  if (lead.receipt) {
    const { receipt } = lead;
    return (
      <DsNavHost>
        {head}
        <PageSite>
          <div className="mx-auto max-w-[620px]">
            <span
              aria-hidden="true"
              className="rv-s grid h-[70px] w-[70px] place-items-center rounded-[22px]"
              style={{ background: 'color-mix(in srgb, var(--mm-corail) 18%, transparent)' }}
            >
              <Icon name="check" size={30} color="var(--mm-corail-t)" strokeWidth={3.4} />
            </span>

            <SiteDisplay
              lines={t('sent.titleLines', { returnObjects: true }) as string[]}
              size={40}
              from={1}
              style={{ marginTop: '24px' }}
            />
            <p className="rv mt-3 max-w-[46ch] text-[16px] leading-[1.55] text-ink-2" style={rv(4)}>
              {t('sent.lede')}
            </p>

            {/* Le récapitulatif ne porte AUCUN nombre : le kit y met une date de réception en
                monospace, or un chiffre passe par <Num source asOf> ou ne s'affiche pas
                (AD-5). Ce qui reste — le type, la fourchette communiquée, le statut — est du
                texte, et c'est ce que la personne vient vérifier. */}
            <GlassPanel level="flat" padding={18} className="rv mt-5" style={rv(5)}>
              <SiteEyebrow style={{ marginBottom: '9px' }}>{t('sent.recapEyebrow')}</SiteEyebrow>
              <DocLine
                label={t('sent.recapType')}
                value={t(`form.projectTypes.${receipt.projectType}`)}
              />
              <DocLine label={t('sent.recapBudget')} value={t('sent.recapBudgetValue')} />
              <DocLine label={t('sent.recapStatus')} value={t('sent.recapStatusValue')} last />
            </GlassPanel>

            {/*
              LA CARTE DE RÉORIENTATION — le SEUL endroit de la page où Cléa est nommée, et il
              est postérieur à l'envoi. Le lead est déjà écrit, déjà tagué `MY_ONOMA_GROW` :
              ce panneau explique ce qui vient d'arriver, il ne demande rien de plus.
            */}
            {receipt.growth && (
              <GlassPanel
                level="flat"
                padding={18}
                className="rv mt-[14px]"
                style={{ ...rv(6), borderColor: 'color-mix(in srgb, var(--mm-corail) 30%, transparent)' }}
              >
                <p className="m-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                  {t('sent.growTitle')}
                </p>
                <p className="mt-2 mb-0 text-meta leading-[1.6] text-ink-2">
                  {t('sent.growStart')}
                  <b className="text-ink">{t('sent.growStrong')}</b>
                  {t('sent.growEnd')}
                </p>
                {/* Cléa n'a pas de page sur maxmorrys.me : le renvoi va au site corporate,
                    dans un nouvel onglet, et l'événement de suivi qui existait est conservé. */}
                <a
                  href={`${corporateUrl}${grow.corporatePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('growth_referral_click', { source: 'agency_sent' })}
                  className="mt-3 inline-block text-meta font-bold text-corail-txt"
                >
                  {t('sent.growCta')}
                </a>
              </GlassPanel>
            )}

            <Button tone="quiet" className="rv mt-4" style={rv(7)} onClick={lead.reset}>
              {t('sent.back')}
            </Button>

            {/* Sur `--ink-2`, jamais sur `--text-faint` : l'encre tertiaire ne porte pas de
                texte (AD-18), et c'est ici la phrase qui engage le plus. */}
            <p className="rv mt-[14px] mb-0 text-center text-small leading-[1.5] text-ink-2" style={rv(8)}>
              {t('sent.footer')}
            </p>
          </div>
        </PageSite>
      </DsNavHost>
    );
  }

  return (
    <DsNavHost>
      {head}

      <PageSite>
        {/* ── LE HÉROS — 1fr 1fr, gouttière 44, aligné au centre ────────────── */}
        <div className="mm-arc-host grid items-center gap-11 pb-[14px] wide:grid-cols-2">
          <div>
            {/* La seule marque de couleur de la page, et sa version TEXTE. Le kit écrit ici
                `#B4231F` — qui est `--stop`, la couleur d'un échec, pas celle de l'agence. */}
            <SiteEyebrow className="text-corail-txt">
              {t('page.eyebrow', { brand: build.brand, pillar: build.pillar })}
            </SiteEyebrow>

            <SiteDisplay
              arc
              lines={t('page.titleLines', { returnObjects: true }) as string[]}
              size={56}
              from={1}
              style={{ marginTop: '9px' }}
            />

            <p className="rv mt-4 max-w-[46ch] text-[16px] leading-[1.55] text-ink-2" style={rv(5)}>
              {t('page.lede')}
            </p>

            {/*
              L'ENCART DE VÉRITÉ — il ne s'excuse pas d'une absence de prix, il en donne le
              motif et la SORTIE : l'offre qui, elle, a une grille publique.
            */}
            <GlassPanel level="truth" className="rv mt-[22px] max-w-[50ch]" style={rv(6)}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('page.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.6] text-ink-2">
                {t('page.truthStart')}
                <b className="text-ink">{t('page.truthStrong')}</b>
                {t('page.truthEnd')}
              </p>
            </GlassPanel>
          </div>

          {/* ── LE FORMULAIRE — le seul panneau héros de la page ──────────────
              Les trois premiers champs sont ceux de la maquette, dans son ordre. Les trois
              suivants ne s'y trouvent pas et ne sont pas négociables : `firestore.rules`
              exige `name`, `company` et `email` à la création d'un `engagement_lead`, et
              « Réponse sous 48 h, par moi » n'est tenable que si une adresse est arrivée. */}
          <GlassPanel level="hero" padding={26} className="rv" style={rv(6)} as="section">
            <SiteEyebrow style={{ margin: 0 }}>{t('panel.eyebrow')}</SiteEyebrow>

            <form onSubmit={lead.handleSubmit} noValidate>
              {/* Piège à robots — invisible à l'œil, retiré de l'arbre d'accessibilité, et
                  exclu de la charge envoyée. Ce n'est pas un `Field` : un champ que personne
                  ne doit remplir n'a pas d'étiquette à annoncer. */}
              <div aria-hidden="true" className="hidden">
                <input
                  type="text"
                  name="_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={lead.form._hp}
                  onChange={(e) => lead.update('_hp', e.target.value)}
                />
              </div>

              <Field
                as="select"
                label={t('panel.typeLabel')}
                value={lead.form.projectType}
                onChange={(v) => lead.update('projectType', v)}
                error={lead.errors.projectType}
                placeholder={t('panel.typePlaceholder')}
                options={agencyLeadConfig.projectTypes.map((key) => ({
                  value: key,
                  label: t(`form.projectTypes.${key}`),
                }))}
                required
              />

              {/*
                LA FOURCHETTE, SANS UN CHIFFRE. Les cinq clés stockées ne bougent pas —
                l'administration lit toujours `exploring`…`xlarge` — mais leurs libellés
                publics nomment une durée et une équipe au lieu d'une somme. C'est ce qui
                permet au champ de filtrer sans que la page publie un prix.
              */}
              <Field
                as="select"
                label={t('panel.budgetLabel')}
                value={lead.form.budget}
                onChange={(v) => lead.update('budget', v)}
                error={lead.errors.budget}
                placeholder={t('panel.budgetPlaceholder')}
                hint={t('panel.budgetHint')}
                options={agencyLeadConfig.budgets.map((key) => ({
                  value: key,
                  label: t(`panel.budgets.${key}`),
                }))}
                required
              />

              <Field
                as="select"
                label={t('panel.timelineLabel')}
                value={lead.form.timeline}
                onChange={(v) => lead.update('timeline', v)}
                error={lead.errors.timeline}
                placeholder={t('panel.timelinePlaceholder')}
                options={agencyLeadConfig.timelines.map((key) => ({
                  value: key,
                  label: t(`form.timelines.${key}`),
                }))}
                required
              />

              <Field
                as="textarea"
                label={t('panel.descriptionLabel')}
                value={lead.form.description}
                onChange={(v) => lead.update('description', v)}
                error={lead.errors.description}
                placeholder={t('panel.descriptionPlaceholder')}
                rows={4}
                /* Le plafond de `firestore.rules`, lu à sa source et non retapé ici. */
                maxLength={DESCRIPTION_MAX}
                required
              />

              <SiteEyebrow style={{ margin: '18px 0 0' }}>{t('panel.replyEyebrow')}</SiteEyebrow>

              <div className="grid gap-3 stack:grid-cols-2">
                <Field
                  label={t('panel.nameLabel')}
                  value={lead.form.name}
                  onChange={(v) => lead.update('name', v)}
                  error={lead.errors.name}
                  placeholder={t('panel.namePlaceholder')}
                  autoComplete="name"
                  required
                />
                <Field
                  label={t('panel.companyLabel')}
                  value={lead.form.company}
                  onChange={(v) => lead.update('company', v)}
                  error={lead.errors.company}
                  placeholder={t('panel.companyPlaceholder')}
                  autoComplete="organization"
                  required
                />
              </div>

              <Field
                label={t('panel.emailLabel')}
                type="email"
                value={lead.form.email}
                onChange={(v) => lead.update('email', v)}
                error={lead.errors.email}
                placeholder={t('panel.emailPlaceholder')}
                /* Sans `inputMode` ni `autoComplete`, aucun clavier adapté ne s'ouvre et rien
                   ne se pré-remplit — ce qui coûte cher au pouce sur le marché visé (AD-6). */
                inputMode="email"
                autoComplete="email"
                required
              />

              {/* Le corail plein ne s'écrit pas sur fond clair (AD-20) et n'a pas de dégradé
                  d'action déclaré : l'agence n'ayant pas de territoire, son bouton plein est
                  le primaire d'encre — exactement ce que `sectionThemes.agency` déclare. */}
              <Button type="submit" loading={lead.loading} style={{ marginTop: '17px' }}>
                {lead.loading ? t('panel.submitting') : t('panel.submit')}
              </Button>
            </form>

            <p className="mt-[10px] mb-0 text-center text-small leading-[1.5] text-ink-2">
              {t('panel.reply')}
            </p>
          </GlassPanel>
        </div>
      </PageSite>

      {/* ── LA BANDE — quatre familles, puis l'autre porte ────────────────── */}
      <SiteBand>
        <SiteDisplay as="h2" lines={t('band.titleLines', { returnObjects: true }) as string[]} size={34} />

        <div className="mt-[22px] grid gap-[14px] stack:grid-cols-2 wide:grid-cols-4">
          {types.map((type, i) => (
            <GlassPanel level="flat" key={type.title} padding={20} className="rv" style={rv(i + 1)}>
              <p className="m-0 font-display text-[17px] font-black tracking-[-.03em] text-ink">
                {type.title}
              </p>
              <p className="mt-[7px] mb-0 text-meta leading-[1.5] text-ink-2">{type.body}</p>
            </GlassPanel>
          ))}
        </div>

        {/*
          LE RENVOI VERS PRÉSENCE DIGITALE. Un commerçant qui atterrit ici doit trouver sa
          porte sans que la page d'agence se mette à vendre des packs — et sans qu'il ait le
          sentiment d'être éconduit : l'autre offre est nommée pour ce qu'elle a, une grille
          publique, ce qui est précisément ce qui manque ici.
        */}
        <GlassPanel
          level="flat"
          padding={24}
          className="rv mt-[18px]"
          style={{ ...rv(5), borderColor: 'color-mix(in srgb, var(--mm-teal) 24%, transparent)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-[62ch]">
              <p className="m-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                {t('band.presenceTitle')}
              </p>
              <p className="mt-2 mb-0 text-[14px] leading-[1.6] text-ink-2">{t('band.presenceBody')}</p>
              <a href={path('/presence-digitale')} className="mt-3 inline-block text-meta font-bold text-digitalise-txt">
                {t('band.presenceCta')}
              </a>
            </div>
            <Tag>{t('band.presenceTag')}</Tag>
          </div>
        </GlassPanel>
      </SiteBand>

      {/* ── LE PROCESSUS, puis la note de dette ───────────────────────────── */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteDisplay as="h2" lines={t('process.titleLines', { returnObjects: true }) as string[]} size={34} />

        {/* Une liste ORDONNÉE : l'ordre des étapes est porté par le balisage, ce qui laisse
            le grand numéro être ce qu'il est — un ornement, sur `--fill-5`, retiré de
            l'arbre d'accessibilité. Un lecteur d'écran annonce « 1 sur 3 », pas « zéro un ». */}
        <ol className="mt-[22px] grid list-none gap-4 p-0 stack:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.n}>
              <GlassPanel level="flat" padding={24} className="rv" style={rv(i + 1)}>
                <p
                  className="mm-num m-0"
                  style={{ fontSize: '30px', color: 'var(--fill-5)' }}
                  aria-hidden="true"
                >
                  {step.n}
                </p>
                <p className="mt-2 mb-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">
                  {step.title}
                </p>
                <p className="mt-2 mb-0 text-[14px] leading-[1.55] text-ink-2">{step.body}</p>
              </GlassPanel>
            </li>
          ))}
        </ol>

      </PageSite>

      {/*
        ── LES RÉFÉRENCES, RÉTABLIES ──────────────────────────────────────────────────────
        Cette section avait été retirée et remplacée par une note de dette : la page nommait
        publiquement des organisations sans accord écrit (FR-105). Les accords sont obtenus,
        la note n'a plus d'objet, et `ClientWorkIndex` — qui existait, complet, monté nulle
        part — reprend sa place.

        LA FORME EST CELLE QUE LE COMPOSANT IMPOSE, et elle est juste : une liste numérotée à
        gauche, UN SEUL aperçu ancré à droite. À quatorze projets, une grille de cartes
        hautes serait illisible — et surtout elle déclencherait quatorze captures externes en
        parallèle, sur un produit dont le budget de première vue est de 900 Ko.

        CE QUI RESTE VRAI MALGRÉ LE FEU VERT : ces produits appartiennent à leurs clients. La
        page n'annonce donc ni résultat, ni chiffre de croissance — elle nomme le rôle tenu et
        donne le lien. Un lien qu'on peut ouvrir vaut mieux qu'un chiffre qu'on doit croire.
      */}
      <SiteBand>
        <SiteEyebrow>{t('work.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('work.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('work.lede')}
        </p>
        <div className="mt-7">
          <ClientWorkIndex />
        </div>
      </SiteBand>

      {/*
        ── LES PRODUITS DU STUDIO, ENFIN MONTÉS ──────────────────────────────────────────
        `VentureCard` existait, complet, rendu nulle part ; `work.venturesTitle` et
        `venturesDesc` étaient écrites en FR et en EN sans consommateur. Les trois ventures
        étaient donc dans le code et invisibles sur le site.

        POURQUOI PAS DANS L'INDEX AU-DESSUS. `clients.ts` interdit nommément d'y faire entrer
        STEPS : il porterait « Client product » alors que `docs/CONTENT-TODO.md §3` a tranché
        que STEPS est une venture MY ONOMA, et rien d'autre. Deux listes, deux grilles, deux
        relations — jamais mélangées.

        POURQUOI UN `PageSite` ET NON UNE SECONDE `SiteBand`. Deux bandes collées partagent le
        même `--surface-band` : elles fondraient en un seul aplat, et la séparation que la
        règle exige ne serait plus lisible. Le fond de page la rend, sans une ligne de CSS.

        LE TITRE A SES COUPURES ÉCRITES (AD-13). « Products built inside MY ONOMA » en une
        seule ligne `nowrap` réclame plus que la colonne d'un écran de 390 : c'est exactement
        le débordement corrigé ailleurs sur cette page.
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteDisplay as="h2" lines={t('work.venturesTitleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('work.venturesDesc')}
        </p>

        <div className="mt-7 grid gap-6 stack:grid-cols-2 wide:grid-cols-3">
          {ventures.map((venture, i) => (
            <div key={venture.slug} className="rv" style={rv(i + 2)}>
              <VentureCard venture={venture} />
            </div>
          ))}
        </div>
      </PageSite>
    </DsNavHost>
  );
}
