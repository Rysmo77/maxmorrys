import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, GlassPanel, Icon, Num, Tag, TruthPanel } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import JsonLd from '../../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../../components/seo/seo-config';
import DsNavHost from '../../components/layout/DsNavHost';
import { ConceptionSubNav } from '../../components/navigation/PisteSubNav';
import RealisationPreview from '../../components/conception/RealisationPreview';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow, SiteExit } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import NotFound from '../NotFound';
import {
  CLIENT_PUBLICATION_GRANTED,
  CLIENT_PUBLICATION_WITHHELD,
  CLIENT_RELATION,
  categoryKey,
  clientProjects,
  corporateUrl,
  getClientProject,
  legalName,
} from '../../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /conception/realisations/:slug — LA FICHE D'UNE RÉALISATION (CDC du 14/09/2026 §4.2).
 *
 * Le CDC demande sept choses sur cette fiche : contexte, rôle réel, périmètre technique,
 * stack, durée, résultat mesurable, autorisation de publication.
 *
 * ── CINQ SONT LÀ. DEUX N'Y SONT PAS, ET LA PAGE LE DIT ───────────────────────────────
 *
 * Le dépôt ne documente NI la durée d'une mission, NI un résultat mesurable — et
 * `src/lib/brand/clients.ts` interdit par ailleurs toute métrique non publique. Deux sorties
 * existaient : écrire des phrases qui donnent le change (« une mission au long cours »,
 * « une plateforme qui tourne »), ou dire l'absence et sa raison.
 *
 * C'est la seconde, selon le motif de NOTE DE DETTE que la page `/agence` a déjà porté une
 * fois : « une note de dette disait l'absence et sa raison, plutôt que de la maquiller :
 * c'est ce qui lui a donné une date de fin. Les accords sont obtenus, la note a disparu avec
 * son objet. » Les champs `duration` et `outcome` existent dans les données, VIDES ; le jour
 * où l'un est relevé et autorisé, son bloc s'affiche et l'encart perd son objet.
 *
 * ── L'AUTORISATION EST AFFICHÉE, PAS SUPPOSÉE ────────────────────────────────────────
 *
 * Les accords clients sont obtenus. Ce qu'ils NE couvrent PAS est écrit en tête de
 * `src/pages/Agence.tsx` : « aucun résultat, aucun chiffre de croissance, aucun témoignage ».
 * Cette phrase vivait dans un commentaire, donc nulle part. `CLIENT_PUBLICATION_GRANTED` et
 * `CLIENT_PUBLICATION_WITHHELD` en font une donnée, et le panneau de vérité la rend : le
 * visiteur voit le périmètre de l'accord en même temps que ce qu'il autorise.
 *
 * ── UN SLUG INCONNU REND LA VRAIE PAGE 404 ───────────────────────────────────────────
 *
 * Pas un écran vide, pas un panneau « introuvable » maison : `<NotFound />`, celle du site,
 * avec son `noIndex`, son encart d'explication et ses deux sorties. Son namespace (`errors`)
 * est statique, donc elle s'affiche sans chargement, même quand `realisations` n'est pas
 * encore arrivé.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Décalage de la cascade d'entrée. Une seule écriture pour toute la page. */
const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

export default function RealisationDetail() {
  const { t } = useTranslation('realisations');
  /* Les sept libellés de catégorie vivent dans `shared`, catalogue de base — une seule
     source pour la fiche, l'index et l'aperçu de la page mère. */
  const { t: ts } = useTranslation('shared');
  const path = useLocalizedPath();
  const { slug } = useParams();

  const project = slug ? getClientProject(slug) : undefined;

  // Aucun hook au-delà de ce point : la garde peut donc sortir sans casser leur ordre.
  if (!project) return <NotFound />;

  const categorie = ts(`realisations.categories.${categoryKey(project.category)}`);
  const ficheUrl = path(`/conception/realisations/${project.slug}`);

  /* Voisins dans l'ordre du catalogue — pas d'ordre « éditorial » inventé pour l'occasion. */
  const rang = clientProjects.findIndex((p) => p.slug === project.slug);
  const precedent = rang > 0 ? clientProjects[rang - 1] : undefined;
  const suivant = rang < clientProjects.length - 1 ? clientProjects[rang + 1] : undefined;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Max-Morrys', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t('fiche.breadcrumbRoot'), item: buildCanonical(path('/conception')) },
        { '@type': 'ListItem', position: 3, name: t('fiche.breadcrumbIndex'), item: buildCanonical(path('/conception/realisations')) },
        { '@type': 'ListItem', position: 4, name: project.name, item: buildCanonical(ficheUrl) },
      ],
    },
    {
      '@context': 'https://schema.org',
      /*
       * `CreativeWork` DÉCRIT UN TRAVAIL RÉALISÉ, ET RIEN DE PLUS.
       *
       * Deux choix pèsent ici, et ils sont du même ordre que la mention de relation affichée
       * à l'écran :
       *
       *  • `contributor`, pas `creator` ni `author`. Le produit appartient à son client ;
       *    revendiquer la création d'une chose qu'on ne détient pas est exactement ce que
       *    `clients.ts` interdit. On a contribué, et c'est vérifiable.
       *  • AUCUNE propriété de résultat. Pas d'`aggregateRating`, pas de `review`, pas
       *    d'`interactionStatistic` : ce sont les trois façons dont un balisage affirme un
       *    résultat, et l'accord de publication n'en couvre aucune. Un balisage qui affirme
       *    ce que la page n'affiche pas est une déclaration fausse à un tiers.
       */
      '@type': 'CreativeWork',
      name: project.name,
      url: project.website,
      genre: categorie,
      mainEntityOfPage: buildCanonical(ficheUrl),
      contributor: { '@type': 'Organization', name: legalName, url: corporateUrl },
      ...(project.descriptionKey
        ? { description: t(`projects.${project.descriptionKey}.description`) }
        : {}),
      ...(project.stack && project.stack.length > 0 ? { keywords: project.stack.join(', ') } : {}),
    },
  ];

  return (
    <DsNavHost>
      <SEOHead
        title={t('seo.detailTitle', { name: project.name })}
        description={t('seo.detailDescription', { name: project.name, category: categorie })}
      />
      <JsonLd data={jsonLd} />

      <PageSite>
        <ConceptionSubNav active="realisations" activeKind="section" />

        <div className="mt-8">
          <Breadcrumb
            label={t('fiche.breadcrumbAria')}
            items={[
              { label: t('fiche.breadcrumbRoot'), href: path('/conception') },
              { label: t('fiche.breadcrumbIndex'), href: path('/conception/realisations') },
              { label: project.name },
            ]}
          />

          <SiteEyebrow className="text-corail-txt" style={{ marginTop: '12px' }}>
            {t('fiche.eyebrow')}
          </SiteEyebrow>

          {/* `wrap` : le nom vient des DONNÉES, pas d'un rédacteur. AD-13 protège les coupures
              ÉCRITES ; un nom lu n'en a pas, et `nowrap` le ferait déborder à 390 px. */}
          <SiteDisplay wrap lines={[project.name]} size={46} from={1} style={{ marginTop: '6px', maxWidth: '18ch' }} />

          <div className="rv mt-4 flex flex-wrap items-center gap-3" style={rv(4)}>
            <span className="text-[15px] text-ink-2">{categorie}</span>
            {/* ⚠️ « Client product » s'oppose à « A MY ONOMA Venture » et ne cohabite jamais
                avec elle : on annonce un RÔLE tenu, jamais une propriété. */}
            <Tag tone="neutral">{CLIENT_RELATION}</Tag>
          </div>
        </div>

        <div className="mt-9 grid items-start gap-10 wide:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] wide:gap-12">
          {/* ── LA COLONNE DE LECTURE ──────────────────────────────────────── */}
          <div className="min-w-0">
            {/* CONTEXTE — absent quand aucune description validée n'existe. Le blanc est
                nommé plutôt que rempli : c'est la même règle que pour la durée, un cran
                plus bas dans les conséquences. */}
            <section className="rv" style={rv(5)}>
              <SiteEyebrow>{t('fiche.contextTitle')}</SiteEyebrow>
              {project.descriptionKey ? (
                <p className="m-0 max-w-[62ch] text-[16px] leading-[1.6] text-ink-2">
                  {t(`projects.${project.descriptionKey}.description`)}
                </p>
              ) : (
                <p className="m-0 max-w-[62ch] text-[15px] italic leading-[1.6] text-ink-2">
                  {t('fiche.contextMissing')}
                </p>
              )}
            </section>

            {/* RÔLE RÉEL — conditionnel. Un dépôt qui ne l'établit pas ne se voit pas
                attribuer de capabilities inventées ; la règle de déduction est écrite en
                tête de `src/lib/brand/clients.ts`. */}
            {project.capabilities && project.capabilities.length > 0 && (
              <section className="rv mt-8" style={rv(6)}>
                <SiteEyebrow>{t('fiche.roleTitle')}</SiteEyebrow>
                <ul className="flex list-none flex-wrap gap-2 p-0">
                  {project.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="rounded-pill bg-[color-mix(in_srgb,var(--mm-corail)_10%,transparent)] px-3 py-1.5 text-[14px] text-corail-txt"
                    >
                      {t(`capabilities.${cap}`)}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 mb-0 max-w-[62ch] text-small leading-[1.55] text-ink-2">
                  {t('fiche.roleNote')}
                </p>
              </section>
            )}

            {/* PÉRIMÈTRE TECHNIQUE — la stack, telle qu'elle a été relevée dans le dépôt du
                projet. Conditionnel pour la même raison. */}
            {project.stack && project.stack.length > 0 && (
              <section className="rv mt-8" style={rv(7)}>
                <SiteEyebrow>{t('fiche.scopeTitle')}</SiteEyebrow>
                <p className="m-0 max-w-[62ch] text-[15.5px] leading-[1.7] text-ink-2">
                  {project.stack.join(' · ')}
                </p>
                <p className="mt-3 mb-0 max-w-[62ch] text-small leading-[1.55] text-ink-2">
                  {t('fiche.scopeNote')}
                </p>
              </section>
            )}

            {/*
              DURÉE ET RÉSULTAT — les deux blocs que le CDC demande et que rien ne documente.
              Ils ne s'affichent pas : `duration` et `outcome` sont vides sur les onze
              réalisations. Le code reste ÉCRIT, et ce n'est pas du code mort décoratif — il
              est ce qui rend la note de dette plus bas vérifiable : elle promet que la fiche
              affichera ces champs dès qu'ils existeront, et c'est exécutable ici, pas plus tard.

              `<Num>` est le seul chemin du dépôt vers un chiffre affiché (AD-5) : il exige
              une source et une date de relevé, que `ClientEvidence` rend obligatoires dans
              le type. Un résultat non sourçable ne peut donc pas entrer par accident.
            */}
            {project.duration && (
              <section className="rv mt-8" style={rv(8)}>
                <SiteEyebrow>{t('fiche.durationTitle')}</SiteEyebrow>
                <p className="m-0 text-[16px] text-ink">
                  <Num
                    value={project.duration.value}
                    unit={t(`units.${project.duration.unitKey}`)}
                    source={{ cite: project.duration.cite }}
                    asOf={new Date(project.duration.asOf)}
                    showAsOf
                  />
                </p>
              </section>
            )}

            {project.outcome && (
              <section className="rv mt-8" style={rv(9)}>
                <SiteEyebrow>{t('fiche.outcomeTitle')}</SiteEyebrow>
                <p className="m-0 text-[16px] text-ink">
                  <Num
                    value={project.outcome.value}
                    unit={t(`units.${project.outcome.unitKey}`)}
                    source={{ cite: project.outcome.cite }}
                    asOf={new Date(project.outcome.asOf)}
                    showAsOf
                  />
                </p>
              </section>
            )}

            {/*
              LA NOTE DE DETTE. Elle dit l'absence ET sa raison — la raison est la moitié qui
              compte : « je n'ai rien d'honnête à en dire » se lit tout autrement qu'un blanc
              silencieux. Et elle porte sa condition de disparition, ce qui lui donne une fin.
            */}
            <GlassPanel level="flat" padding={20} className="rv mt-8 max-w-[64ch]" style={rv(10)}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-ink-2">
                  <Icon name="info" size={18} />
                </span>
                <div className="min-w-0">
                  <p className="m-0 font-display text-[17px] font-black tracking-[-.03em] text-ink">
                    {t('debt.title')}
                  </p>
                  <p className="mt-2 mb-0 text-meta leading-[1.6] text-ink-2">{t('debt.body')}</p>
                  <p className="mt-2 mb-0 text-small leading-[1.5] text-ink-2">{t('debt.footer')}</p>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* ── L'ASIDE : l'aperçu, le lien, l'autorisation ─────────────────── */}
          <aside className="min-w-0">
            <div className="rv" style={rv(5)}>
              <RealisationPreview url={project.website} domain={project.domain} name={project.name} />
            </div>

            {/*
              LE LIEN EST LE GESTE PRINCIPAL DE LA FICHE. « Un lien qu'on peut ouvrir vaut
              mieux qu'un chiffre qu'on doit croire » : c'est ce qui remplace, ici, les
              résultats qu'on n'affiche pas.
            */}
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rv mt-4 inline-flex items-center gap-2 text-meta font-bold text-corail-txt transition hover:gap-3 focus:outline-none"
              style={rv(6)}
            >
              {project.domain}
              <Icon name="arrow-up-right" size={16} />
              <span className="sr-only">— {t('fiche.visitAria', { name: project.name })}</span>
            </a>

            <div className="rv mt-6" style={rv(7)}>
              <SiteEyebrow>{t('authorization.eyebrow')}</SiteEyebrow>
              <p className="m-0 mb-3 text-meta leading-[1.6] text-ink-2">{t('authorization.body')}</p>
              {/*
                Le panneau de vérité rend les deux listes de `clients.ts`. Elles ne sont pas
                retapées ici : une liste d'autorisations recopiée dans une surface diverge de
                celle qui fait foi le jour où l'accord change, et personne ne le voit.
              */}
              <TruthPanel
                provenTitle={t('authorization.provenTitle')}
                withheldTitle={t('authorization.withheldTitle')}
                proven={CLIENT_PUBLICATION_GRANTED.map((cle) => t(`authorization.granted.${cle}`))}
                withheld={CLIENT_PUBLICATION_WITHHELD.map((cle) => t(`authorization.withheld.${cle}`))}
              />
            </div>
          </aside>
        </div>
      </PageSite>

      {/* ── LA SORTIE : les voisines, puis la porte ────────────────────────── */}
      <SiteBand>
        <nav aria-label={t('fiche.navAria')} className="flex flex-wrap items-center justify-between gap-4">
          {precedent ? (
            <a
              href={path(`/conception/realisations/${precedent.slug}`)}
              className="inline-flex items-center gap-2 text-meta font-bold text-ink no-underline"
            >
              <Icon name="chevron-left" size={16} />
              <span className="min-w-0">
                <span className="mm-eyebrow block">{t('fiche.prev')}</span>
                <span className="block truncate">{precedent.name}</span>
              </span>
            </a>
          ) : (
            <span />
          )}

          <Button href={path('/conception/realisations')} tone="quiet" size="sm" fullWidth={false}>
            {t('fiche.backToIndex')}
          </Button>

          {suivant ? (
            <a
              href={path(`/conception/realisations/${suivant.slug}`)}
              className="inline-flex items-center gap-2 text-right text-meta font-bold text-ink no-underline"
            >
              <span className="min-w-0">
                <span className="mm-eyebrow block">{t('fiche.next')}</span>
                <span className="block truncate">{suivant.name}</span>
              </span>
              <Icon name="chevron-right" size={16} />
            </a>
          ) : (
            <span />
          )}
        </nav>

        {/* La porte de sortie du site, pas un bandeau maison. Ce panneau était écrit à la
            main ici pendant qu'`/apprendre` en écrivait un autre, d'un autre poids : même
            geste, deux dessins. `SiteExit` impose le sien, et la piste entière sort de la
            même façon. */}
        <SiteExit
          title={t('fiche.nextStepTitle')}
          body={t('fiche.nextStepBody')}
          cta={t('fiche.nextStepCta')}
          href={path('/contact')}
        />
      </SiteBand>
    </DsNavHost>
  );
}
