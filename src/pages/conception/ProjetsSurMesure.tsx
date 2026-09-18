import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CheckLine, DocLine, Field, GlassPanel, Icon } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import JsonLd from '../../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../../components/seo/seo-config';
import DsNavHost from '../../components/layout/DsNavHost';
import { ConceptionSubNav } from '../../components/navigation/PisteSubNav';
import StepList from '../../components/conception/StepList';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { trackEvent } from '../../lib/tracking';
import { agencyLeadConfig } from '../../lib/agency/engagement';
import { corporateUrl, legalEntity, legalName, practices } from '../../lib/brand';
import { DESCRIPTION_MAX, useAgencyEngagement } from './useAgencyEngagement';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /conception/projets-sur-mesure — LE SECOND NIVEAU D'ENGAGEMENT.  CDC § 4.2.
 *
 * Sites corporate et bilingues, plateformes, portails métier, systèmes de design,
 * intégrations. C'est ici que vit le formulaire de qualification qui occupait le héros
 * de `/agence` : il s'adresse maintenant à quelqu'un qui a lu la page mère et reconnu
 * son niveau, pas à quiconque arrive sur la piste.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES QUATRE RÈGLES QUE CETTE PAGE NE PEUT PAS ENFREINDRE
 *
 * 1. AUCUN MONTANT. Pas une somme, pas une fourchette chiffrée, pas un « à partir de ».
 *    Les cinq entrées de la liste d'engagement nomment une DURÉE et une ÉQUIPE — les
 *    clés stockées ne bougent pas (`exploring`…`xlarge`, lues par l'administration),
 *    seuls leurs libellés publics changent. AD-5 ferme le chemin de toute façon :
 *    `<Num source asOf>` est le seul passage du dépôt vers un chiffre, et il n'entre
 *    pas dans un `<option>`.
 *
 * 2. VOUVOIEMENT STRICT. « nous / vous », registre de studio, sur la page ET dans les
 *    messages d'erreur du formulaire — d'où le déplacement du hook vers le namespace
 *    `conception` : les erreurs qu'il rendait avant tutoyaient, et un formulaire qui
 *    change de personne entre son étiquette et son message d'erreur fait parler deux voix.
 *
 * 3. AUCUNE ORGANISATION TIERCE NOMMÉE. La page ne cite aucun client : les réalisations
 *    ont leur propre route, alimentée par `lib/brand/clients.ts`.
 *
 * 4. RIEN QUI VENDE DE LA CROISSANCE. Une demande qui relève du growth n'est pas
 *    refusée : elle est enregistrée, taguée `MY_ONOMA_GROW` par `routingTagFor`, et
 *    réorientée APRÈS l'envoi — jamais pendant la saisie. Annoncer la practice sœur
 *    avant que la demande soit partie, c'est offrir une porte de sortie à quelqu'un
 *    qu'on n'a pas encore lu.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * LE FORMULAIRE N'EST PAS RECONSTRUIT. `useAgencyEngagement` porte déjà le pot de miel,
 * la revalidation des trois listes contre `agencyLeadConfig`, les bornes de
 * `firestore.rules`, le repère de première frappe, la suppression de la pop-up de sortie
 * et l'écriture du lead. Une seconde implémentation aurait perdu l'une des six sans que
 * rien ne le dise — aucun test du dépôt ne rend un composant.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Décalage de la cascade d'entrée. Une seule écriture pour toute la page. */
const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

export default function ProjetsSurMesure() {
  const { t } = useTranslation('conception');
  const path = useLocalizedPath();
  const lead = useAgencyEngagement();

  const build = practices.build;
  const grow = practices.grow;

  /*
   * Les blocs STATIQUES sont mémorisés, et ce n'est pas de la coquetterie : l'état du
   * formulaire vit dans ce composant, donc chaque caractère tapé le rend à nouveau.
   */
  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('custom.eyebrow'),
        serviceType: build.discipline,
        description: t('seo.customDescription'),
        url: buildCanonical('/conception/projets-sur-mesure'),
        brand: { '@type': 'Brand', name: build.brand },
        /* ⚠️ `provider` = la personne morale, `brand` = la marque commerciale. Il ne doit
           jamais exister d'`Organization` autonome nommée « Max-Morrys Agency ». */
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
          {
            '@type': 'ListItem',
            position: 3,
            name: t('custom.eyebrow'),
            item: buildCanonical('/conception/projets-sur-mesure'),
          },
        ],
      },
    ],
    [t, build.brand, build.discipline],
  );

  const scopeItems = useMemo(
    () => t('scope.items', { returnObjects: true }) as { title: string; body: string }[],
    [t],
  );
  const steps = useMemo(
    () => t('steps.items', { returnObjects: true }) as { n: string; title: string; body: string }[],
    [t],
  );
  const commitments = useMemo(
    () =>
      (['acceptance', 'maintenance', 'reversibility'] as const).map((key) => ({
        key,
        title: t(`delivery.${key}.title`),
        body: t(`delivery.${key}.body`),
        points: t(`delivery.${key}.points`, { returnObjects: true }) as string[],
      })),
    [t],
  );

  const head = (
    <>
      <SEOHead
        title={t('seo.customTitle')}
        description={t('seo.customDescription')}
        canonical={buildCanonical('/conception/projets-sur-mesure')}
        frPath="/conception/projets-sur-mesure"
        enPath="/en/design/custom-projects"
      />
      <JsonLd data={jsonLd} />
    </>
  );

  /*
   * ── LA CONFIRMATION ─────────────────────────────────────────────────────────
   * Un écran, pas un encart : une demande envoyée n'a plus rien à faire à côté du
   * formulaire qui l'a produite. La sous-navigation reste en tête — la personne est
   * toujours quelque part dans la piste, et doit pouvoir en sortir autrement qu'en
   * revenant en arrière.
   */
  if (lead.receipt) {
    const { receipt } = lead;
    return (
      <DsNavHost>
        {head}
        <PageSite>
          <ConceptionSubNav active="surMesure" />

          <div className="mx-auto mt-[26px] max-w-[620px]">
            <span
              aria-hidden="true"
              className="rv-s grid h-[70px] w-[70px] place-items-center rounded-card"
              style={{ background: 'color-mix(in srgb, var(--mm-corail) 18%, transparent)' }}
            >
              <Icon name="check" size={30} color="var(--mm-corail-t)" strokeWidth={3.4} />
            </span>

            <SiteDisplay
              arc
              lines={t('sent.titleLines', { returnObjects: true }) as string[]}
              size={40}
              from={1}
              style={{ marginTop: '24px' }}
            />
            <p className="rv mt-3 max-w-[46ch] text-[16px] leading-[1.55] text-ink-2" style={rv(4)}>
              {t('sent.lede')}
            </p>

            {/* Le récapitulatif ne porte AUCUN nombre : un chiffre passe par
                <Num source asOf> ou ne s'affiche pas (AD-5). Ce qui reste — le type, la
                forme d'engagement communiquée, le statut — est du texte, et c'est ce que
                la personne vient vérifier. */}
            <GlassPanel level="flat" padding={18} className="rv mt-5" style={rv(5)}>
              <SiteEyebrow style={{ marginBottom: '9px' }}>{t('sent.recapEyebrow')}</SiteEyebrow>
              <DocLine label={t('sent.recapType')} value={t(`form.projectTypes.${receipt.projectType}`)} />
              <DocLine label={t('sent.recapEngagement')} value={t('sent.recapEngagementValue')} />
              <DocLine label={t('sent.recapStatus')} value={t('sent.recapStatusValue')} last />
            </GlassPanel>

            {/*
              LA CARTE DE RÉORIENTATION — le SEUL endroit de la page où Cléa est nommée, et
              il est postérieur à l'envoi. Le lead est déjà écrit, déjà tagué `MY_ONOMA_GROW` :
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
                    dans un nouvel onglet, et l'événement de suivi est conservé. */}
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
        <ConceptionSubNav active="surMesure" />

        {/* ── LE HÉROS — la promesse à gauche, le formulaire à droite ───────── */}
        <div className="mm-arc-host mt-[26px] grid items-center gap-11 pb-[14px] wide:grid-cols-2">
          <div>
            <SiteEyebrow className="text-corail-txt">{t('custom.eyebrow')}</SiteEyebrow>

            <SiteDisplay
              arc
              lines={t('custom.titleLines', { returnObjects: true }) as string[]}
              size={52}
              from={1}
              style={{ marginTop: '9px' }}
            />

            <p className="rv mt-4 max-w-[46ch] text-[16px] leading-[1.55] text-ink-2" style={rv(5)}>
              {t('custom.lede')}
            </p>

            {/*
              L'ENCART DE VÉRITÉ — il ne s'excuse pas d'une absence de prix, il en donne le
              motif ET la sortie : l'autre niveau d'engagement, qui a, lui, une grille
              publique. Le lien est nommé pour ce qu'il a, pas offert en consolation.
            */}
            <GlassPanel level="truth" className="rv mt-[22px] max-w-[52ch]" style={rv(6)}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('custom.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta-2 leading-[1.6] text-ink-2">
                {t('custom.truthStart')}
                <b className="text-ink">{t('custom.truthStrong')}</b>
                {t('custom.truthEnd')}
              </p>
              <a
                href={path('/conception/commerces-et-tpe')}
                className="mt-3 inline-flex items-center gap-2 text-meta font-bold text-digitalise-txt"
              >
                {t('levels.shops.cta')}
                <Icon name="forward" size={16} />
              </a>
            </GlassPanel>
          </div>

          {/* ── LE FORMULAIRE ────────────────────────────────────────────────
              Les trois premiers champs qualifient ; les trois suivants ne sont pas
              négociables : `firestore.rules` exige `name`, `company` et `email` à la
              création d'un `engagement_lead`, et une réponse écrite n'est tenable que si
              une adresse est arrivée. */}
          <GlassPanel level="hero" padding={26} className="rv" style={rv(6)} as="section">
            <SiteEyebrow style={{ margin: 0 }}>{t('form.eyebrow')}</SiteEyebrow>
            <p className="mt-2 mb-4 text-[14.5px] leading-[1.6] text-ink-2">{t('form.lede')}</p>

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
                label={t('form.typeLabel')}
                value={lead.form.projectType}
                onChange={(v) => lead.update('projectType', v)}
                error={lead.errors.projectType}
                placeholder={t('form.typePlaceholder')}
                options={agencyLeadConfig.projectTypes.map((key) => ({
                  value: key,
                  label: t(`form.projectTypes.${key}`),
                }))}
                required
              />

              {/*
                LA FORME D'ENGAGEMENT, SANS UN CHIFFRE. Les cinq clés stockées ne bougent
                pas — l'administration lit toujours `exploring`…`xlarge` — mais leurs
                libellés publics nomment une durée et une équipe au lieu d'une somme. C'est
                ce qui permet au champ de filtrer sans que la page publie un prix.
              */}
              <Field
                as="select"
                label={t('form.engagementLabel')}
                value={lead.form.budget}
                onChange={(v) => lead.update('budget', v)}
                error={lead.errors.budget}
                placeholder={t('form.engagementPlaceholder')}
                hint={t('form.engagementHint')}
                options={agencyLeadConfig.budgets.map((key) => ({
                  value: key,
                  label: t(`form.engagements.${key}`),
                }))}
                required
              />

              <Field
                as="select"
                label={t('form.timelineLabel')}
                value={lead.form.timeline}
                onChange={(v) => lead.update('timeline', v)}
                error={lead.errors.timeline}
                placeholder={t('form.timelinePlaceholder')}
                options={agencyLeadConfig.timelines.map((key) => ({
                  value: key,
                  label: t(`form.timelines.${key}`),
                }))}
                required
              />

              <Field
                as="textarea"
                label={t('form.descriptionLabel')}
                value={lead.form.description}
                onChange={(v) => lead.update('description', v)}
                error={lead.errors.description}
                placeholder={t('form.descriptionPlaceholder')}
                rows={4}
                /* Le plafond de `firestore.rules`, lu à sa source et non retapé ici. */
                maxLength={DESCRIPTION_MAX}
                required
              />

              <SiteEyebrow style={{ margin: '18px 0 0' }}>{t('form.replyEyebrow')}</SiteEyebrow>

              <div className="grid gap-3 stack:grid-cols-2">
                <Field
                  label={t('form.nameLabel')}
                  value={lead.form.name}
                  onChange={(v) => lead.update('name', v)}
                  error={lead.errors.name}
                  placeholder={t('form.namePlaceholder')}
                  autoComplete="name"
                  required
                />
                <Field
                  label={t('form.companyLabel')}
                  value={lead.form.company}
                  onChange={(v) => lead.update('company', v)}
                  error={lead.errors.company}
                  placeholder={t('form.companyPlaceholder')}
                  autoComplete="organization"
                  required
                />
              </div>

              <Field
                label={t('form.emailLabel')}
                type="email"
                value={lead.form.email}
                onChange={(v) => lead.update('email', v)}
                error={lead.errors.email}
                placeholder={t('form.emailPlaceholder')}
                /* Sans `inputMode` ni `autoComplete`, aucun clavier adapté ne s'ouvre et rien
                   ne se pré-remplit — ce qui coûte cher au pouce sur le marché visé (AD-6). */
                inputMode="email"
                autoComplete="email"
                required
              />

              {/* Le corail plein ne s'écrit pas sur fond clair (AD-20) et la piste n'a pas de
                  dégradé d'action déclaré : son bouton plein est le primaire d'encre —
                  exactement ce que `sectionThemes.agency` déclare. */}
              <Button type="submit" loading={lead.loading} style={{ marginTop: '17px' }}>
                {lead.loading ? t('form.submitting') : t('form.submit')}
              </Button>
            </form>

            <p className="mt-[10px] mb-0 text-center text-small leading-[1.5] text-ink-2">
              {t('form.reply')}
            </p>
          </GlassPanel>
        </div>
      </PageSite>

      {/* ── LE PÉRIMÈTRE — cinq familles, la liste que le CDC nomme ─────────── */}
      <SiteBand>
        <SiteEyebrow>{t('scope.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('scope.titleLines', { returnObjects: true }) as string[]} size={34} />

        <div className="mt-[22px] grid gap-[14px] stack:grid-cols-2 wide:grid-cols-3">
          {scopeItems.map((item, i) => (
            <GlassPanel level="flat" key={item.title} padding={20} className="rv h-full" style={rv(i + 1)}>
              <p className="m-0 font-display text-[17px] font-black tracking-[-.03em] text-ink">{item.title}</p>
              <p className="mt-[7px] mb-0 text-meta leading-[1.5] text-ink-2">{item.body}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      {/*
        ── LE PARCOURS D'ENGAGEMENT ────────────────────────────────────────────────────
        Cette bande et celle de `/conception` étaient rendues par quinze lignes de JSX
        identiques — et disaient la même chose, pendant que `method.lede` affirmait « la même
        méthode aux deux niveaux d'engagement ». Le CDC exige les deux bandes ; la sortie
        n'était donc pas d'en supprimer une, mais de leur rendre deux sujets.

        `/conception` garde LA MÉTHODE DE TRAVAIL — cadrer, concevoir, construire, exploiter.
        Celle-ci décrit LE PARCOURS D'ENGAGEMENT : de la première conversation au contrat,
        c'est-à-dire tout ce qui se passe AVANT que la méthode commence. Aucune des deux ne
        peut plus être lue comme une version abrégée de l'autre.

        Trois faits qui vivaient en double ou en triple n'ont plus qu'une adresse :
        les jalons livrés sur une adresse ouvrable sont dans la méthode (`method` 03), la
        maintenance décidée avant la livraison est dans `delivery.maintenance` — le bloc dont
        c'est le sujet —, et la liste des prestations n'est plus écrite ici (voir `custom.lede`).
      */}
      <PageSite style={{ paddingTop: 'var(--site-section-gap)' }}>
        <SiteEyebrow>{t('steps.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('steps.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('steps.lede')}
        </p>

        {/* Le dessin est partagé avec la bande de méthode de `/conception` : même forme de
            liste, une seule écriture. Ce sont les contenus qui diffèrent, pas la grille. */}
        <StepList steps={steps} />
      </PageSite>

      {/*
        ── RECETTE, MAINTENANCE, RÉVERSIBILITÉ ─────────────────────────────────────────
        La partie que les propositions commerciales laissent en blanc. Elle est ici parce
        qu'elle décide de ce que vaut le reste : un livrable dont on ne peut pas sortir
        n'est pas un livrable, c'est une dépendance.
      */}
      <SiteBand>
        <SiteEyebrow>{t('delivery.eyebrow')}</SiteEyebrow>
        <SiteDisplay as="h2" lines={t('delivery.titleLines', { returnObjects: true }) as string[]} size={34} />
        <p className="rv mt-3 max-w-[58ch] text-[15.5px] leading-[1.6] text-ink-2" style={rv(1)}>
          {t('delivery.lede')}
        </p>

        <div className="mt-[22px] grid gap-[14px] stack:grid-cols-3">
          {commitments.map((block, i) => (
            <GlassPanel level="flat" key={block.key} padding={24} className="rv h-full" style={rv(i + 1)}>
              <p className="m-0 font-display text-[18px] font-black tracking-[-.03em] text-ink">{block.title}</p>
              <p className="mt-2 mb-0 text-meta leading-[1.55] text-ink-2">{block.body}</p>
              <div className="mt-3">
                {block.points.map((point) => (
                  <CheckLine key={point} tone="neutre">
                    {point}
                  </CheckLine>
                ))}
              </div>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>
    </DsNavHost>
  );
}
