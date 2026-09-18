import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Icon } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import JsonLd from '../../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../../components/seo/seo-config';
import DsNavHost from '../../components/layout/DsNavHost';
import { ConceptionSubNav } from '../../components/navigation/PisteSubNav';
import { ClientWorkCard } from '../../components/conception/WorkCard';
import RealisationFilters from '../../components/conception/RealisationFilters';
import { PageSite, SiteDisplay, SiteEyebrow, SiteExit } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { categoryKey, clientCategories, clientProjects, legalName, corporateUrl } from '../../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /conception/realisations — LE PORTFOLIO TECHNIQUE (CDC du 14/09/2026, §3.3 et §4.2).
 *
 * CE QUE CETTE PAGE AJOUTE, ET CE QU'ELLE N'INVENTE PAS. Le portfolio EXISTAIT déjà, monté
 * dans une bande de `/agence` : `ClientWorkIndex`, une liste numérotée avec un seul aperçu
 * ancré. Il lui manquait des ADRESSES — on ne pouvait ni partager une référence, ni la
 * faire indexer, ni y revenir. C'est tout ce que ce lot apporte : les mêmes données, à une
 * URL par réalisation.
 *
 * ── TROIS DÉCISIONS, ET LEURS RAISONS ────────────────────────────────────────────────
 *
 * 1. AUCUNE CAPTURE SUR L'INDEX. `ClientWorkIndex` documente pourquoi il n'est pas une
 *    grille : « une grille en déclenchait douze [captures externes] en parallèle ». Le
 *    problème ne disparaît pas parce que la grille change de page. Les cartes ne portent donc
 *    que du texte, et l'aperçu se paie une fois, sur la fiche qu'on a demandée.
 *
 * 2. AUCUNE VENTURE ICI. `clients.ts` interdit formellement de mélanger les produits DÉTENUS
 *    par MY ONOMA aux produits construits POUR des tiers : ils portent deux mentions de
 *    relation contradictoires, et STEPS apparaîtrait deux fois sur le site. La page
 *    `/conception` porte déjà le bloc « Products built inside MY ONOMA » ; le dupliquer ici
 *    en deux sections étiquetées serait permis, mais il n'y a rien à gagner à montrer deux
 *    fois la même chose à un cran de profondeur supplémentaire.
 *
 * 3. LE FILTRE VIT DANS L'ADRESSE. Même raison que sur `/blog` : une vue filtrée se partage,
 *    survit au rechargement, et le retour arrière depuis une fiche ramène sur la liste qu'on
 *    avait, pas sur la liste entière.
 *
 * ⚠️ LE TITRE NE COMPTE RIEN. C'est le défaut connu des index du dépôt — « le titre affirme
 * "0" avant lecture ». Ici les données sont statiques et un compte serait juste dès le
 * premier rendu ; le titre n'en porte quand même pas, pour que la règle reste vraie sans
 * dépendre de l'origine des données. Le seul compte de la page dérive de la liste rendue
 * juste en dessous, et il est annoncé aux lecteurs d'écran.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Décalage de la cascade d'entrée. Une seule écriture pour toute la page. */
const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

/** Clé du filtre dans l'adresse. Non localisée, comme `?pole=` et `?tag=` ailleurs. */
const PARAM_CATEGORIE = 'categorie';

export default function Realisations() {
  const { t } = useTranslation('realisations');
  /* Les sept libellés de catégorie vivent dans `shared`, catalogue de base : c'est la seule
     source depuis que les deux copies jumelles ont été supprimées. */
  const { t: ts } = useTranslation('shared');
  const path = useLocalizedPath();
  const [params, setParams] = useSearchParams();

  const active = params.get(PARAM_CATEGORIE);

  const setActive = (categorie: string | null) => {
    const suivant = new URLSearchParams(params);
    if (categorie) suivant.set(PARAM_CATEGORIE, categorie);
    else suivant.delete(PARAM_CATEGORIE);
    // `replace` : affiner un filtre n'est pas une étape de navigation. Sans ça, revenir en
    // arrière depuis une fiche oblige à défaire un clic de filtre à la fois.
    setParams(suivant, { replace: true });
  };

  /*
   * Une catégorie inconnue arrivée par l'adresse ne doit pas vider la page en silence : elle
   * est traitée comme aucun filtre. `clientCategories` est la seule liste admise.
   */
  const categorieValide = active && clientCategories.includes(active) ? active : null;

  const filtres = useMemo(
    () =>
      categorieValide
        ? clientProjects.filter((p) => p.category === categorieValide)
        : clientProjects,
    [categorieValide],
  );

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: t('seo.title'),
        description: t('seo.description'),
        url: buildCanonical(path('/conception/realisations')),
        /*
         * `about` nomme QUI a tenu le rôle, sans rien affirmer sur les produits eux-mêmes.
         * Max-Morrys Agency est une MARQUE : la personne morale est MY ONOMA SARL, et il ne
         * doit jamais exister d'`Organization` autonome portant le nom de la marque.
         */
        about: { '@type': 'Organization', name: legalName, url: corporateUrl },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        /*
         * ⚠️ Les entrées pointent vers NOS fiches, pas vers les sites des clients. Une liste
         * qui renvoie ailleurs se fait lire comme un annuaire de liens sortants ; et surtout,
         * elle affirmerait un rapport entre cette page et des domaines qui ne sont pas à
         * nous. La fiche, elle, porte le lien — et l'autorisation qui va avec.
         */
        itemListElement: clientProjects.map((project, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: project.name,
          url: `${SITE_URL}${path(`/conception/realisations/${project.slug}`)}`,
        })),
      },
    ],
    [t, path],
  );

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      <JsonLd data={jsonLd} />

      <PageSite>
        {/* La sous-navigation est une primitive de PAGE : elle vit DANS le `PageSite`, pas
            au-dessus — voir l'en-tête de `design-system/react/navigation/SubNav.tsx`. */}
        <ConceptionSubNav active="realisations" />

        {/*
          LE HÉROS A BESOIN D'UNE FRONTIÈRE. Le remplissage de l'arc (AD-23) répond au survol
          de son hôte : posé sur `PageSite`, il ferait de la page ENTIÈRE la cible et le
          fragment entre crochets resterait peint en permanence.
        */}
        <div className="mm-arc-host mt-8">
          {/* La seule marque de couleur de la piste Conception, et sa version TEXTE :
              `#FF6E7F` fait 2,70:1 sur blanc, d'où `--mm-corail-t` (AD-20). */}
          <SiteEyebrow className="text-corail-txt">{t('index.eyebrow')}</SiteEyebrow>

          <SiteDisplay
            arc
            lines={t('index.titleLines', { returnObjects: true }) as string[]}
            size={52}
            from={1}
            style={{ marginTop: '8px' }}
          />

          <p className="rv mt-[14px] max-w-[54ch] text-[16px] leading-[1.55] text-ink-2" style={rv(5)}>
            {t('index.lede')}
          </p>
        </div>

        <div className="rv mt-8" style={rv(6)}>
          <RealisationFilters
            categories={clientCategories}
            active={categorieValide}
            onChange={setActive}
            resultCount={filtres.length}
          />
        </div>

        {filtres.length === 0 ? (
          <EmptyState
            style={{ marginTop: '22px' }}
            glyph={<Icon name="search" size={24} />}
            title={t('index.emptyTitle')}
            body={t('index.emptyBody')}
            action={
              <Button tone="quiet" fullWidth={false} onClick={() => setActive(null)}>
                {t('index.emptyAction')}
              </Button>
            }
          />
        ) : (
          <ul
            /* `key` composite : la cascade d'entrée rejoue à chaque changement de filtre. */
            key={categorieValide ?? 'toutes'}
            aria-label={t('index.gridAria')}
            className="mt-7 grid list-none gap-5 p-0 stack:grid-cols-2 wide:grid-cols-3"
          >
            {filtres.map((project, i) => (
              <li key={project.slug} className="rv" style={rv(i + 1)}>
                {/* La MÊME carte que l'aperçu de `/conception`, par le même adaptateur : une
                    seule coque, et une relation épinglée que la page ne choisit pas. Elle ne
                    lit aucun namespace — c'est ce qui lui permet d'être montée ici et là-bas
                    sans qu'aucune des deux routes charge le catalogue de l'autre. */}
                <ClientWorkCard
                  href={path(`/conception/realisations/${project.slug}`)}
                  name={project.name}
                  category={ts(`realisations.categories.${categoryKey(project.category)}`)}
                  cta={t('index.cardCta')}
                  description={
                    project.descriptionKey
                      ? t(`projects.${project.descriptionKey}.description`)
                      : undefined
                  }
                  stack={project.stack}
                />
              </li>
            ))}
          </ul>
        )}

        {/*
          LA PORTE DE SORTIE. L'index se terminait sur sa dernière carte : quatorze
          réalisations, et rien à faire ensuite que remonter. La même primitive que sur
          `/conception` et sur la fiche — un seul dessin de sortie pour toute la piste.
        */}
        <SiteExit
          title={t('index.exitTitle')}
          body={t('index.exitBody')}
          cta={t('index.exitCta')}
          href={path('/contact')}
        />
      </PageSite>
    </DsNavHost>
  );
}
